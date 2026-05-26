/// <reference lib="webworker" />

/**
 * US Rate Sheet adjuster worker — moves Apply + Freeze (and Preview) off the
 * main thread for large filtered scopes (~188K rows).
 *
 * Unlike the other workers in this folder (compute-only — they receive plain
 * data and the main thread owns Dexie), this worker owns its OWN Dexie
 * connection because the cost being eliminated IS the IndexedDB read+write, not
 * the arithmetic. IndexedDB allows multiple connections to the same database,
 * so this runs alongside the main thread's connection. All math/freeze/plan
 * logic is reused from the pure pricing-engine so results are identical to the
 * legacy main-thread path.
 *
 * Flow: open DB → scan + scope-filter → planAdjustment → (apply: write changed
 * records via bulkPut in 1000-chunks; preview: skip write) → averages → post.
 */
import Dexie from 'dexie';
import {
  buildScopeFilter,
  planAdjustment,
  computeFilteredAverages,
  type Adjustment,
  type PricingRecord,
  type FreezeState,
  type AdjustmentImpact,
  type PricingOperation,
  type RateAverages,
} from '@/utils/pricing-engine';

const DB_NAME = 'us_rate_sheet_db'; // DBName.US_RATE_SHEET
const TABLE_NAME = 'entries';
// Must match DBSchemas[US_RATE_SHEET] exactly (static v1 schema). Rate fields are
// deliberately not indexed — see the note in app-types.ts DBSchemas.
const SCHEMA = '++id, npanxx, stateCode, npa, nxx';
const WRITE_CHUNK = 5000;
const READ_PROGRESS_EVERY = 10000;

/** Stored entries always have a numeric primary key. */
type StoredRecord = PricingRecord & { id: number };

export interface UsRateAdjusterRequest {
  searchTerms: string[];
  selectedState: string;
  metroNpas: string[];
  npaGeoMap: Record<string, { country_code: string; state_province_code: string }>;
  adjustment: Adjustment;
  freeze: {
    frozenNpas: Set<string>;
    npanxxOverrides: Map<string, 'frozen' | 'thawed'>;
  };
  scopeLabel: string;
  filtersApplied: string[];
  mode: 'apply' | 'preview';
}

export interface UsRateAdjusterProgress {
  type: 'progress';
  phase: 'reading' | 'writing';
  processed: number;
  total: number;
  percentage: number;
}

export interface UsRateAdjusterApplyComplete {
  type: 'complete';
  mode: 'apply';
  operation: PricingOperation;
  modifiedNpanxx: string[];
  newlyFrozenNpas: string[];
  impact: AdjustmentImpact;
  averages: RateAverages;
}

export interface UsRateAdjusterPreviewComplete {
  type: 'complete';
  mode: 'preview';
  impact: AdjustmentImpact;
}

export interface UsRateAdjusterError {
  type: 'error';
  message: string;
}

export type UsRateAdjusterResponse =
  | UsRateAdjusterProgress
  | UsRateAdjusterApplyComplete
  | UsRateAdjusterPreviewComplete
  | UsRateAdjusterError;

function post(msg: UsRateAdjusterResponse) {
  self.postMessage(msg);
}

self.onmessage = async (event: MessageEvent<UsRateAdjusterRequest>) => {
  const req = event.data;
  const db = new Dexie(DB_NAME);
  db.version(1).stores({ [TABLE_NAME]: SCHEMA });

  try {
    await db.open();
    // US_RATE_SHEET is a static v1 schema (only dynamically-versioned DBs in
    // useDexieDB bump the version, and `entries` is already declared so it never
    // triggers a bump). If verno ever drifts, surface it for diagnosis — the
    // mismatch would otherwise be a silent VersionError or stale read.
    if (db.verno !== 1) {
      console.warn(`[us-rate-adjuster.worker] expected DB version 1, got ${db.verno}`);
    }

    const table = db.table<StoredRecord, number>(TABLE_NAME);

    // --- Phase 1: scan + scope-filter (full-table read, mirrors loadFilteredRecords) ---
    const scopeFilter = buildScopeFilter({
      searchTerms: req.searchTerms,
      selectedState: req.selectedState,
      metroNpas: req.metroNpas,
      npaGeoMap: req.npaGeoMap,
    });

    const tRead0 = performance.now();
    const total = await table.count();
    const filtered: StoredRecord[] = [];
    let scanned = 0;
    await table.toCollection().each((rec) => {
      if (scopeFilter(rec)) filtered.push(rec);
      scanned++;
      if (scanned % READ_PROGRESS_EVERY === 0) {
        post({
          type: 'progress',
          phase: 'reading',
          processed: scanned,
          total,
          percentage: total ? (scanned / total) * 100 : 0,
        });
      }
    });

    const freeze: FreezeState = {
      frozenNpas: req.freeze.frozenNpas,
      npanxxOverrides: req.freeze.npanxxOverrides,
    };

    const plan = planAdjustment(filtered, req.adjustment, freeze, {
      scopeLabel: req.scopeLabel,
      filtersApplied: req.filtersApplied,
    });

    // Preview is a dry run: return impact only, never touch the DB.
    if (req.mode === 'preview') {
      post({ type: 'complete', mode: 'preview', impact: plan.impact });
      return;
    }

    // --- Phase 2: apply planned changes onto the in-memory records, then write ---
    // We already hold the full records from the filtered read, so we mutate them
    // and bulkPut the changed ones (faster than bulkUpdate's read-modify-write).
    const byId = new Map<number, StoredRecord>(filtered.map((r) => [r.id, r]));
    const changed: StoredRecord[] = [];
    for (const u of plan.updates) {
      const rec = byId.get(u.id);
      if (!rec) continue;
      Object.assign(rec, u.changes);
      changed.push(rec);
    }

    const writeTotal = changed.length;
    // One rw transaction for all chunks → the apply is atomic (a mid-write
    // failure rolls back rather than leaving a half-adjusted deck). Only Dexie
    // ops are awaited inside the zone; post() is synchronous, so the transaction
    // stays active (awaiting a non-Dexie promise here would commit it early).
    await db.transaction('rw', table, async () => {
      for (let i = 0; i < writeTotal; i += WRITE_CHUNK) {
        const chunk = changed.slice(i, i + WRITE_CHUNK);
        await table.bulkPut(chunk);
        const processed = Math.min(i + WRITE_CHUNK, writeTotal);
        post({
          type: 'progress',
          phase: 'writing',
          processed,
          total: writeTotal,
          percentage: writeTotal ? (processed / writeTotal) * 100 : 100,
        });
      }
    });

    // Averages over the filtered, post-apply records (mirrors the legacy
    // recalculateAndDisplayAverages scan that runs right after the write).
    const averages = computeFilteredAverages(filtered);

    post({
      type: 'complete',
      mode: 'apply',
      operation: plan.operation,
      modifiedNpanxx: plan.modifiedNpanxx,
      newlyFrozenNpas: plan.newlyFrozenNpas,
      impact: plan.impact,
      averages,
    });
  } catch (error) {
    post({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error in rate adjuster worker',
    });
  } finally {
    db.close();
  }
};
