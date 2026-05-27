/**
 * Pricing Studio engine — pure, framework-free logic for rate-deck sculpting.
 *
 * Every function here is deterministic and side-effect-free so it can be unit
 * tested without Vue, Pinia, or Dexie. The Pricing Studio store/components own
 * the IndexedDB reads/writes and reactive state; this module owns the math, the
 * freeze model, impact preview, audit/CSV generation, and readiness stats.
 *
 * Freeze model (owner decision): bulk adjustments freeze at NPA granularity by
 * default. A per-NPANXX override lets the operator manually freeze or thaw a
 * single NPANXX regardless of its NPA's state — the override always wins over
 * the NPA rule. Frozen records are excluded from future bulk adjustments.
 *
 * Session-only: nothing here persists. The deck itself lives in IndexedDB and
 * is wiped on every app load (see utils/cleanup.ts), so freeze/operation state
 * is intentionally ephemeral and never leaves the browser.
 */
import type {
  AdjustmentType,
  AdjustmentValueType,
  TargetRateType,
} from '@/types/domains/rate-sheet-types';

/**
 * Minimal record shape the engine operates on. Both `USRateSheetEntry` variants
 * (us-types non-null rates, rate-sheet-types nullable rates) are assignable to
 * this, so the engine stays decoupled from the known duplicate-type debt.
 */
export interface PricingRecord {
  id?: number;
  npa: string;
  nxx: string;
  npanxx: string;
  stateCode?: string;
  interRate: number | null;
  intraRate: number | null;
  indetermRate: number | null;
}

export interface Adjustment {
  type: AdjustmentType; // markup | markdown | set
  valueType: AdjustmentValueType; // percentage | fixed (ignored when type === 'set')
  value: number;
  target: TargetRateType; // all | inter | intra | indeterm
}

/** Session freeze state: NPA-level set plus per-NPANXX manual overrides. */
export interface FreezeState {
  frozenNpas: Set<string>;
  npanxxOverrides: Map<string, 'frozen' | 'thawed'>;
}

export function createFreezeState(): FreezeState {
  return { frozenNpas: new Set<string>(), npanxxOverrides: new Map<string, 'frozen' | 'thawed'>() };
}

/**
 * Serializable inputs for the scope predicate — everything the table's filter
 * panel resolves to, with geography pre-resolved into a plain map so the
 * predicate stays pure and structured-cloneable into a worker (no lergStore
 * closure). `npaGeoMap` mirrors lergStore.getNPAInfo's relevant fields.
 */
export interface ScopeFilterParams {
  searchTerms: string[]; // lowercased; matched with startsWith (OR across terms)
  selectedState: string; // '' | GROUP_UNITED_STATES | GROUP_CANADA | GROUP_OTHER_COUNTRIES | <stateCode>
  metroNpas: string[]; // NPAs to keep (empty = no metro filter)
  npaGeoMap: Record<string, { country_code: string; state_province_code: string }>;
}

const US_TERRITORY_CODES = ['PR', 'VI', 'GU', 'AS', 'MP'];

/**
 * Build the scope predicate the table applies to select adjustment scope. This
 * mirrors the legacy createFilters() in USRateSheetTable exactly — search,
 * state/region group, specific-state (stored stateCode), metro — AND-combined.
 * Extracted as a pure function so the off-thread worker and the main thread run
 * identical logic and it can be unit tested without Vue/Pinia.
 */
export function buildScopeFilter(
  params: ScopeFilterParams
): (record: PricingRecord) => boolean {
  const { searchTerms, selectedState, metroNpas, npaGeoMap } = params;
  const hasSearch = searchTerms.length > 0;
  const metroSet = metroNpas.length > 0 ? new Set(metroNpas) : null;

  return (record: PricingRecord): boolean => {
    if (hasSearch) {
      const lower = record.npanxx.toLowerCase();
      if (!searchTerms.some((term) => lower.startsWith(term))) return false;
    }

    if (selectedState) {
      const geo = npaGeoMap[record.npa];
      if (selectedState === 'GROUP_UNITED_STATES') {
        if (!(geo?.country_code === 'US' && !US_TERRITORY_CODES.includes(geo.state_province_code)))
          return false;
      } else if (selectedState === 'GROUP_CANADA') {
        if (geo?.country_code !== 'CA') return false;
      } else if (selectedState === 'GROUP_OTHER_COUNTRIES') {
        if (!(geo && geo.country_code !== 'US' && geo.country_code !== 'CA')) return false;
      } else if (record.stateCode !== selectedState) {
        return false;
      }
    }

    if (metroSet && !metroSet.has(record.npa)) return false;

    return true;
  };
}

const RATE_FIELDS = ['interRate', 'intraRate', 'indetermRate'] as const;
type RateField = (typeof RATE_FIELDS)[number];

const TARGET_TO_FIELDS: Record<TargetRateType, RateField[]> = {
  all: ['interRate', 'intraRate', 'indetermRate'],
  inter: ['interRate'],
  intra: ['intraRate'],
  indeterm: ['indetermRate'],
};

function round6(n: number): number {
  return parseFloat(n.toFixed(6));
}

function round2(n: number): number {
  return parseFloat(n.toFixed(2));
}

function defaultId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Compute one adjusted rate. Mirrors the legacy inline math exactly so existing
 * behavior is preserved: set → value; percentage → rate * (1 ± value/100);
 * fixed → rate ± value. Result is clamped to ≥ 0 and rounded to 6 decimals.
 */
export function computeAdjustedRate(
  current: number,
  type: AdjustmentType,
  valueType: AdjustmentValueType,
  value: number
): number {
  let adjusted: number;
  if (type === 'set') {
    adjusted = value;
  } else if (valueType === 'percentage') {
    const pct = value / 100;
    adjusted = current * (type === 'markup' ? 1 + pct : 1 - pct);
  } else {
    adjusted = current + (type === 'markup' ? value : -value);
  }
  return Math.max(0, round6(adjusted));
}

/** Is this record protected from bulk adjustment? Override wins over NPA rule. */
export function isRecordFrozen(record: PricingRecord, freeze: FreezeState): boolean {
  const override = freeze.npanxxOverrides.get(record.npanxx);
  if (override) return override === 'frozen';
  return freeze.frozenNpas.has(record.npa);
}

export interface RateDelta {
  inter: number | null;
  intra: number | null;
  indeterm: number | null;
}

export interface AdjustmentImpact {
  rowsAffected: number; // rows whose rate would actually change (excludes frozen + no-ops)
  npasAffected: number; // distinct NPAs among affected rows
  frozenRowsExcluded: number; // in-scope rows skipped because frozen
  avgDelta: RateDelta; // mean (after − before) per target field, over changed rows
}

export interface RecordUpdate {
  id: number;
  changes: Partial<Pick<PricingRecord, 'interRate' | 'intraRate' | 'indetermRate'>>;
}

export interface PricingOperation {
  id: string;
  timestamp: string; // ISO 8601
  kind: AdjustmentType | 'lock' | 'unlock';
  valueType?: AdjustmentValueType;
  value?: number;
  target?: TargetRateType;
  scopeLabel: string; // human label, e.g. "Filtered Results"
  filtersApplied: string[];
  npasAffected: string[];
  recordsAffected: number;
  avgDelta: RateDelta;
}

export interface AdjustmentPlan {
  updates: RecordUpdate[];
  impact: AdjustmentImpact;
  newlyFrozenNpas: string[]; // NPAs that would freeze (affected and not already frozen)
  modifiedNpanxx: string[]; // NPANXXs whose rate actually changed (for the Status column)
  operation: PricingOperation;
}

export interface PlanMeta {
  scopeLabel?: string;
  filtersApplied?: string[];
  now?: () => Date; // injectable clock for deterministic tests
  idFactory?: () => string; // injectable id for deterministic tests
}

/**
 * Pure planner. Given the in-scope records, an adjustment, and the current
 * freeze state, compute: the per-record updates, the impact summary, which NPAs
 * would newly freeze, and an operation record for the audit/history. Inputs are
 * never mutated. The same plan powers both Preview Changes and Apply + Freeze —
 * Preview reads `.impact`; Apply commits `.updates` and merges
 * `.newlyFrozenNpas` + `.operation` into session state.
 */
export function planAdjustment(
  records: PricingRecord[],
  adjustment: Adjustment,
  freeze: FreezeState,
  meta: PlanMeta = {}
): AdjustmentPlan {
  const fields = TARGET_TO_FIELDS[adjustment.target];
  const updates: RecordUpdate[] = [];
  const affectedNpas = new Set<string>();
  const modifiedNpanxx: string[] = [];
  let frozenRowsExcluded = 0;

  const deltaSum: Record<RateField, number> = { interRate: 0, intraRate: 0, indetermRate: 0 };
  const deltaCount: Record<RateField, number> = { interRate: 0, intraRate: 0, indetermRate: 0 };

  for (const rec of records) {
    if (isRecordFrozen(rec, freeze)) {
      frozenRowsExcluded++;
      continue;
    }
    const changes: RecordUpdate['changes'] = {};
    let changed = false;
    for (const field of fields) {
      const cur = rec[field];
      if (typeof cur !== 'number') continue;
      const next = computeAdjustedRate(cur, adjustment.type, adjustment.valueType, adjustment.value);
      if (next !== cur) {
        changes[field] = next;
        deltaSum[field] += next - cur;
        deltaCount[field]++;
        changed = true;
      }
    }
    if (changed && rec.id != null) {
      updates.push({ id: rec.id, changes });
      affectedNpas.add(rec.npa);
      modifiedNpanxx.push(rec.npanxx);
    }
  }

  const avgDelta: RateDelta = {
    inter: deltaCount.interRate ? round6(deltaSum.interRate / deltaCount.interRate) : null,
    intra: deltaCount.intraRate ? round6(deltaSum.intraRate / deltaCount.intraRate) : null,
    indeterm: deltaCount.indetermRate ? round6(deltaSum.indetermRate / deltaCount.indetermRate) : null,
  };

  const impact: AdjustmentImpact = {
    rowsAffected: updates.length,
    npasAffected: affectedNpas.size,
    frozenRowsExcluded,
    avgDelta,
  };

  // NPA-level freeze: every NPA we actually adjusted becomes frozen going forward.
  const newlyFrozenNpas = [...affectedNpas].filter((npa) => !freeze.frozenNpas.has(npa));

  const now = (meta.now ?? (() => new Date()))();
  const operation: PricingOperation = {
    id: (meta.idFactory ?? defaultId)(),
    timestamp: now.toISOString(),
    kind: adjustment.type,
    valueType: adjustment.valueType,
    value: adjustment.value,
    target: adjustment.target,
    scopeLabel: meta.scopeLabel ?? 'Filtered Results',
    filtersApplied: meta.filtersApplied ?? [],
    npasAffected: [...affectedNpas].sort(),
    recordsAffected: updates.length,
    avgDelta,
  };

  return { updates, impact, newlyFrozenNpas, modifiedNpanxx, operation };
}

export interface GeoInfo {
  state: string;
  country: string;
}
export type GeoResolver = (npa: string) => GeoInfo;

export interface CsvTable {
  headers: string[];
  rows: string[][];
}

/**
 * Final rate-deck CSV (matches the legacy export columns). Geography is resolved
 * via an injected callback so this stays pure — the component passes a wrapper
 * around the LERG store; tests pass a stub.
 */
export function buildRateDeckCsv(
  records: PricingRecord[],
  opts: {
    effectiveDate?: string | null;
    getGeo: GeoResolver;
    formatRate?: (n: number | null) => string;
  }
): CsvTable {
  const fmt = opts.formatRate ?? ((n) => (typeof n === 'number' ? n.toFixed(6) : 'N/A'));
  const headers = [
    'NPANXX',
    'State',
    'Country',
    'Interstate Rate',
    'Intrastate Rate',
    'Indeterminate Rate',
    'Effective Date',
  ];
  const rows = records.map((r) => {
    const geo = opts.getGeo(r.npa);
    return [
      `1${r.npanxx}`,
      geo.state || 'N/A',
      geo.country || 'N/A',
      fmt(r.interRate),
      fmt(r.intraRate),
      fmt(r.indetermRate),
      opts.effectiveDate || 'N/A',
    ];
  });
  return { headers, rows };
}

/**
 * Change-audit table — one row per session operation. Per-operation granularity
 * (not per-record) keeps this scalable for 200K+ row decks and matches the
 * "trust and audit visibility" intent of the Recent Operations panel. Returns a
 * headers/rows shape that feeds jspdf-autotable's head/body directly (the audit
 * is exported as a branded PDF, not a CSV).
 */
export function buildAuditTable(operations: PricingOperation[]): CsvTable {
  const headers = [
    'Operation',
    'Method',
    'Value',
    'Target Rate',
    'Scope',
    'Filters',
    'NPAs Affected',
    'Records Affected',
    'Avg Delta Inter',
    'Avg Delta Intra',
    'Avg Delta Indeterm',
  ];
  const fmtDelta = (n: number | null) => (n != null ? n.toFixed(6) : '');
  const rows = operations.map((op) => [
    op.kind,
    op.valueType ?? '',
    op.value != null ? String(op.value) : '',
    op.target ?? '',
    op.scopeLabel,
    op.filtersApplied.join('; '),
    String(op.npasAffected.length),
    String(op.recordsAffected),
    fmtDelta(op.avgDelta.inter),
    fmtDelta(op.avgDelta.intra),
    fmtDelta(op.avgDelta.indeterm),
  ]);
  return { headers, rows };
}

export interface ReadinessStats {
  totalRecords: number;
  modifiedRows: number;
  modifiedPct: number;
  frozenScopes: number; // count of frozen NPAs + explicit per-NPANXX 'frozen' overrides
  avgInterRate: number | null;
  exportReady: boolean;
}

const ADJUSTMENT_KINDS: ReadonlySet<string> = new Set(['markup', 'markdown', 'set']);

/**
 * Readiness strip stats. `avgInterRate` is supplied by the caller (it requires a
 * deck-wide scan that the table already performs via Dexie) to keep this pure.
 * Because adjusted NPAs freeze, rows touched across operations are disjoint, so
 * modifiedRows = sum of recordsAffected over adjustment operations.
 */
export function computeReadiness(input: {
  totalRecords: number;
  operations: PricingOperation[];
  freeze: FreezeState;
  avgInterRate: number | null;
}): ReadinessStats {
  const modifiedRows = input.operations
    .filter((op) => ADJUSTMENT_KINDS.has(op.kind))
    .reduce((sum, op) => sum + op.recordsAffected, 0);
  const frozenNpanxxCount = [...input.freeze.npanxxOverrides.values()].filter(
    (v) => v === 'frozen'
  ).length;
  const frozenScopes = input.freeze.frozenNpas.size + frozenNpanxxCount;
  return {
    totalRecords: input.totalRecords,
    modifiedRows,
    modifiedPct: input.totalRecords ? round2((modifiedRows / input.totalRecords) * 100) : 0,
    frozenScopes,
    avgInterRate: input.avgInterRate,
    exportReady: input.totalRecords > 0,
  };
}

/** Row-status classification for the table's Status column. */
export type RowStatus = 'frozen' | 'modified' | 'original';

/**
 * Classify a row for the table. Precedence is modified → frozen → original:
 * a rate you actually changed reads as "modified" (green) even though its NPA is
 * now locked; "frozen" (purple) is reserved for locked-but-unchanged rows
 * (protected NPA siblings or per-NPANXX freeze overrides). `modifiedNpanxx` is
 * the session set of NPANXXs whose rate changed.
 */
export function classifyRow(
  record: PricingRecord,
  freeze: FreezeState,
  modifiedNpanxx: Set<string>
): RowStatus {
  if (modifiedNpanxx.has(record.npanxx)) return 'modified';
  if (isRecordFrozen(record, freeze)) return 'frozen';
  return 'original';
}

export interface RateAverages {
  inter: number | null;
  intra: number | null;
  indeterm: number | null;
}

/**
 * Per-field rate averages over a record set. Mirrors the legacy
 * calculateAverages() in USRateSheetTable exactly: the denominator is the count
 * of rows that have at least one numeric rate, and each field's sum is divided
 * by that same denominator. Extracted as a pure function so the worker computes
 * the readiness-strip average in the same pass it applies the adjustment.
 */
export function computeFilteredAverages(records: PricingRecord[]): RateAverages {
  let sumInter = 0;
  let sumIntra = 0;
  let sumIndeterm = 0;
  let count = 0;
  for (const entry of records) {
    if (typeof entry.interRate === 'number') sumInter += entry.interRate;
    if (typeof entry.intraRate === 'number') sumIntra += entry.intraRate;
    if (typeof entry.indetermRate === 'number') sumIndeterm += entry.indetermRate;
    if (
      typeof entry.interRate === 'number' ||
      typeof entry.intraRate === 'number' ||
      typeof entry.indetermRate === 'number'
    ) {
      count++;
    }
  }
  return {
    inter: count > 0 && !isNaN(sumInter) ? sumInter / count : null,
    intra: count > 0 && !isNaN(sumIntra) ? sumIntra / count : null,
    indeterm: count > 0 && !isNaN(sumIndeterm) ? sumIndeterm / count : null,
  };
}
