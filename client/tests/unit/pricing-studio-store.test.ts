import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePricingStudioStore } from '@/stores/pricing-studio-store';
import { planAdjustment, createFreezeState, computeReadiness, type Adjustment } from '@/utils/pricing-engine';
import { sampleDeck } from '../fixtures/us-rate-sheet';

const markupInter10: Adjustment = {
  type: 'markup',
  valueType: 'percentage',
  value: 10,
  target: 'inter',
};

describe('pricing-studio-store', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('records an adjustment plan into session state', () => {
    const store = usePricingStudioStore();
    store.recordAdjustment(planAdjustment(sampleDeck(), markupInter10, createFreezeState()));

    expect([...store.frozenNpas].sort()).toEqual(['201', '212', '310']);
    expect(store.modifiedNpanxx.has('201200')).toBe(true);
    expect(store.operations).toHaveLength(1);
    expect(store.frozenScopeCount).toBe(3);
    expect(store.hasOperations).toBe(true);
  });

  it('excludes already-frozen NPAs on a second apply', () => {
    const store = usePricingStudioStore();
    const njOnly = sampleDeck().filter((r) => r.npa === '201');
    store.recordAdjustment(planAdjustment(njOnly, markupInter10, createFreezeState()));

    // Second apply over the full deck, using the freeze state accumulated so far.
    const plan2 = planAdjustment(sampleDeck(), markupInter10, store.freezeState);
    expect(plan2.updates.map((u) => u.id)).toEqual([3, 4]); // 201 rows now excluded
    store.recordAdjustment(plan2);

    expect(store.operations).toHaveLength(2);
    expect([...store.frozenNpas].sort()).toEqual(['201', '212', '310']);
  });

  it('freezes and thaws an NPANXX with audit operations', () => {
    const store = usePricingStudioStore();

    store.freezeNpanxx('212500');
    expect(store.npanxxOverrides.get('212500')).toBe('frozen');
    expect(store.frozenScopeCount).toBe(1);

    store.thawNpanxx('212500');
    expect(store.npanxxOverrides.get('212500')).toBe('thawed');
    expect(store.frozenScopeCount).toBe(0); // thawed overrides are not "frozen scopes"
    expect(store.operations.map((o) => o.kind)).toEqual(['lock', 'unlock']);
  });

  it('integrates with computeReadiness', () => {
    const store = usePricingStudioStore();
    store.recordAdjustment(planAdjustment(sampleDeck(), markupInter10, createFreezeState()));
    store.setDeckAvgInterRate(0.0078);

    const stats = computeReadiness({
      totalRecords: 100,
      operations: store.operations,
      freeze: store.freezeState,
      avgInterRate: store.deckAvgInterRate,
    });
    expect(stats.modifiedRows).toBe(4);
    expect(stats.frozenScopes).toBe(3);
    expect(stats.avgInterRate).toBe(0.0078);
    expect(stats.exportReady).toBe(true);
  });

  it('reset clears all session state', () => {
    const store = usePricingStudioStore();
    store.recordAdjustment(planAdjustment(sampleDeck(), markupInter10, createFreezeState()));
    store.setDeckAvgInterRate(0.0078);

    store.reset();
    expect(store.frozenNpas.size).toBe(0);
    expect(store.npanxxOverrides.size).toBe(0);
    expect(store.modifiedNpanxx.size).toBe(0);
    expect(store.operations).toHaveLength(0);
    expect(store.deckAvgInterRate).toBeNull();
  });
});
