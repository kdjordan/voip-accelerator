import { defineStore } from 'pinia';
import type { PricingOperation, FreezeState, AdjustmentPlan } from '@/utils/pricing-engine';

/**
 * Pricing Studio session store — ephemeral state for rate-deck sculpting.
 *
 * Holds the freeze membership (NPA-level + per-NPANXX overrides), the set of
 * NPANXXs whose rate changed this session, and the operations history. None of
 * this is persisted: the deck in IndexedDB is wiped on every app load
 * (utils/cleanup.ts), so this state is intentionally session-only and never
 * leaves the browser. The actual Dexie writes of adjusted rates are performed
 * by the caller (USRateSheetTable); this store only records session metadata so
 * the metric strip, table Status column, and Recent Operations panel stay in
 * sync from one source of truth.
 */
interface PricingStudioState {
  frozenNpas: Set<string>;
  npanxxOverrides: Map<string, 'frozen' | 'thawed'>;
  modifiedNpanxx: Set<string>;
  operations: PricingOperation[];
  deckAvgInterRate: number | null;
}

function buildLockOperation(kind: 'lock' | 'unlock', npanxx: string): PricingOperation {
  return {
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    kind,
    scopeLabel: `NPANXX ${npanxx}`,
    filtersApplied: [],
    npasAffected: [npanxx.slice(0, 3)],
    recordsAffected: 1,
    avgDelta: { inter: null, intra: null, indeterm: null },
  };
}

export const usePricingStudioStore = defineStore('pricingStudio', {
  state: (): PricingStudioState => ({
    frozenNpas: new Set<string>(),
    npanxxOverrides: new Map<string, 'frozen' | 'thawed'>(),
    modifiedNpanxx: new Set<string>(),
    operations: [],
    deckAvgInterRate: null,
  }),

  getters: {
    /** Live freeze state shaped for the pure engine (planAdjustment/classifyRow). */
    freezeState: (state): FreezeState => ({
      frozenNpas: state.frozenNpas,
      npanxxOverrides: state.npanxxOverrides,
    }),
    /** Locked scopes = frozen NPAs + explicit per-NPANXX freeze overrides. */
    frozenScopeCount: (state): number =>
      state.frozenNpas.size +
      [...state.npanxxOverrides.values()].filter((v) => v === 'frozen').length,
    hasOperations: (state): boolean => state.operations.length > 0,
  },

  actions: {
    /**
     * Record an Apply + Freeze result into session state. Merges the newly
     * frozen NPAs and modified NPANXXs and appends the operation for history.
     * Accepts only the three fields it reads so it works equally for a full
     * AdjustmentPlan (legacy/tests) or the partial result posted by the
     * off-thread adjuster worker (which commits the writes itself).
     */
    recordAdjustment(
      result: Pick<AdjustmentPlan, 'newlyFrozenNpas' | 'modifiedNpanxx' | 'operation'>
    ) {
      // Merge on plain Sets, then assign once. Adding entries one-by-one to the
      // reactive Sets fires Vue reactivity per item — at ~200K+ modified NPANXXs
      // that froze the tab for minutes. A single reassignment is one trigger.
      if (result.newlyFrozenNpas.length) {
        const frozen = new Set(this.frozenNpas);
        for (const npa of result.newlyFrozenNpas) frozen.add(npa);
        this.frozenNpas = frozen;
      }
      if (result.modifiedNpanxx.length) {
        const modified = new Set(this.modifiedNpanxx);
        for (const npanxx of result.modifiedNpanxx) modified.add(npanxx);
        this.modifiedNpanxx = modified;
      }
      this.operations.push(result.operation);
    },
    /** Manually protect a single NPANXX (overrides its NPA's state). */
    freezeNpanxx(npanxx: string) {
      this.npanxxOverrides.set(npanxx, 'frozen');
      this.operations.push(buildLockOperation('lock', npanxx));
    },
    /** Manually re-open a single NPANXX for editing (overrides its NPA's state). */
    thawNpanxx(npanxx: string) {
      this.npanxxOverrides.set(npanxx, 'thawed');
      this.operations.push(buildLockOperation('unlock', npanxx));
    },
    setDeckAvgInterRate(rate: number | null) {
      this.deckAvgInterRate = rate;
    },
    clearOperations() {
      this.operations = [];
    },
    /** Wipe all session state (new upload, deck cleared, or reset). */
    reset() {
      this.frozenNpas.clear();
      this.npanxxOverrides.clear();
      this.modifiedNpanxx.clear();
      this.operations = [];
      this.deckAvgInterRate = null;
    },
  },
});
