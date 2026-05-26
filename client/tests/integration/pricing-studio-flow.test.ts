import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePricingStudioStore } from '@/stores/pricing-studio-store';
import {
  planAdjustment,
  buildAuditTable,
  buildRateDeckCsv,
  computeReadiness,
  classifyRow,
  type AdjustmentPlan,
  type PricingRecord,
} from '@/utils/pricing-engine';
import { sampleDeck } from '../fixtures/us-rate-sheet';

/** Simulate the Dexie bulkUpdate the component performs after planning. */
function applyToDeck(deck: PricingRecord[], plan: AdjustmentPlan) {
  const byId = new Map(deck.map((r) => [r.id, r]));
  for (const u of plan.updates) Object.assign(byId.get(u.id)!, u.changes);
}

const markupInter10 = { type: 'markup', valueType: 'percentage', value: 10, target: 'inter' } as const;

describe('Pricing Studio — end-to-end session flow', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('adjust → freeze → re-adjust excludes frozen, with audit + readiness + CSV cohering', () => {
    const store = usePricingStudioStore();
    const deck = sampleDeck();

    // 1) Markup interstate 10% on the NJ rows (filtered scope).
    const njRows = deck.filter((r) => r.npa === '201');
    const plan1 = planAdjustment(njRows, markupInter10, store.freezeState, {
      scopeLabel: 'Filtered Results',
      filtersApplied: ['Region: NJ'],
    });
    applyToDeck(deck, plan1);
    store.recordAdjustment(plan1);
    expect(store.frozenNpas.has('201')).toBe(true);

    // 2) Same markup over the whole deck — NJ (201) is now frozen and excluded.
    const plan2 = planAdjustment(deck, markupInter10, store.freezeState, {
      scopeLabel: 'All Records',
      filtersApplied: [],
    });
    expect(plan2.updates.map((u) => u.id).sort()).toEqual([3, 4]);
    expect(plan2.impact.frozenRowsExcluded).toBe(2);
    applyToDeck(deck, plan2);
    store.recordAdjustment(plan2);

    // Readiness reflects the full session.
    store.setDeckAvgInterRate(0.05);
    const readiness = computeReadiness({
      totalRecords: deck.length,
      operations: store.operations,
      freeze: store.freezeState,
      avgInterRate: store.deckAvgInterRate,
    });
    expect(readiness.modifiedRows).toBe(4); // 2 NJ + 2 others, disjoint due to freeze
    expect(readiness.frozenScopes).toBe(3); // 201, 212, 310
    expect(readiness.exportReady).toBe(true);

    // Audit = one row per operation.
    const audit = buildAuditTable(store.operations);
    expect(audit.rows).toHaveLength(2);
    expect(audit.rows[0][1]).toBe('markup');

    // Final rate-deck CSV reflects the mutated rates (0.01 → 0.011 on interstate).
    const csv = buildRateDeckCsv(deck, {
      effectiveDate: '2026-06-02',
      getGeo: () => ({ state: 'NJ', country: 'US' }),
    });
    expect(csv.rows).toHaveLength(4);
    expect(csv.rows.find((r) => r[0] === '1201200')?.[3]).toBe('0.011000');

    // Status classification: a changed row reads "modified" even though its NPA is locked.
    expect(classifyRow(deck[0], store.freezeState, store.modifiedNpanxx)).toBe('modified');
  });

  it('manual per-NPANXX freeze override excludes a single row from bulk adjustment', () => {
    const store = usePricingStudioStore();
    const deck = sampleDeck();

    store.freezeNpanxx('212500');
    const plan = planAdjustment(
      deck,
      { type: 'markdown', valueType: 'fixed', value: 0.001, target: 'all' },
      store.freezeState
    );

    expect(plan.updates.find((u) => u.id === 3)).toBeUndefined(); // 212500 protected
    expect(plan.impact.frozenRowsExcluded).toBe(1);
    expect(classifyRow(deck[2], store.freezeState, store.modifiedNpanxx)).toBe('frozen');
  });
});
