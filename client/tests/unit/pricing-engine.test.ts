import { describe, it, expect } from 'vitest';
import {
  computeAdjustedRate,
  isRecordFrozen,
  createFreezeState,
  planAdjustment,
  buildRateDeckCsv,
  buildAuditTable,
  computeReadiness,
  classifyRow,
  type Adjustment,
  type PlanMeta,
  type PricingOperation,
} from '@/utils/pricing-engine';
import { sampleDeck, makeRecord } from '../fixtures/us-rate-sheet';

const fixedMeta: PlanMeta = {
  scopeLabel: 'Filtered Results',
  filtersApplied: ['Region equals NJ'],
  now: () => new Date('2026-05-26T10:00:00.000Z'),
  idFactory: () => 'op_test_1',
};

const markupInter10: Adjustment = {
  type: 'markup',
  valueType: 'percentage',
  value: 10,
  target: 'inter',
};

describe('computeAdjustedRate', () => {
  it('applies percentage markup', () => {
    expect(computeAdjustedRate(0.1, 'markup', 'percentage', 12)).toBe(0.112);
  });
  it('applies percentage markdown', () => {
    expect(computeAdjustedRate(0.1, 'markdown', 'percentage', 10)).toBe(0.09);
  });
  it('applies fixed markup', () => {
    expect(computeAdjustedRate(0.1, 'markup', 'fixed', 0.005)).toBe(0.105);
  });
  it('applies fixed markdown', () => {
    expect(computeAdjustedRate(0.1, 'markdown', 'fixed', 0.02)).toBe(0.08);
  });
  it('sets to value, ignoring valueType', () => {
    expect(computeAdjustedRate(0.1, 'set', 'percentage', 0.25)).toBe(0.25);
  });
  it('clamps negative results to 0', () => {
    expect(computeAdjustedRate(0.01, 'markdown', 'fixed', 0.05)).toBe(0);
  });
  it('rounds to 6 decimals', () => {
    expect(computeAdjustedRate(0.1, 'markup', 'percentage', 33.333333)).toBe(0.133333);
  });
});

describe('isRecordFrozen', () => {
  const rec = makeRecord({ npanxx: '201200', npa: '201' });

  it('is frozen when its NPA is frozen', () => {
    const f = createFreezeState();
    f.frozenNpas.add('201');
    expect(isRecordFrozen(rec, f)).toBe(true);
  });
  it('is not frozen when nothing applies', () => {
    expect(isRecordFrozen(rec, createFreezeState())).toBe(false);
  });
  it('per-NPANXX "frozen" override freezes a row in an unfrozen NPA', () => {
    const f = createFreezeState();
    f.npanxxOverrides.set('201200', 'frozen');
    expect(isRecordFrozen(rec, f)).toBe(true);
  });
  it('per-NPANXX "thawed" override wins over a frozen NPA', () => {
    const f = createFreezeState();
    f.frozenNpas.add('201');
    f.npanxxOverrides.set('201200', 'thawed');
    expect(isRecordFrozen(rec, f)).toBe(false);
  });
});

describe('planAdjustment', () => {
  it('marks up interstate across the whole deck and reports impact', () => {
    const plan = planAdjustment(sampleDeck(), markupInter10, createFreezeState(), fixedMeta);

    expect(plan.updates).toHaveLength(4);
    expect(plan.updates[0]).toEqual({ id: 1, changes: { interRate: 0.011 } });
    expect(plan.impact.rowsAffected).toBe(4);
    expect(plan.impact.npasAffected).toBe(3);
    expect(plan.impact.frozenRowsExcluded).toBe(0);
    // deltas: 0.001 + 0.001 + 0.01 + 0.005 = 0.017 / 4
    expect(plan.impact.avgDelta.inter).toBe(0.00425);
    expect(plan.impact.avgDelta.intra).toBeNull();
    expect(plan.impact.avgDelta.indeterm).toBeNull();
    expect(plan.newlyFrozenNpas).toEqual(['201', '212', '310']);
    expect(plan.modifiedNpanxx).toEqual(['201200', '201201', '212500', '310100']);
  });

  it('excludes frozen NPAs from the plan and counts them', () => {
    const f = createFreezeState();
    f.frozenNpas.add('201');
    const plan = planAdjustment(sampleDeck(), markupInter10, f, fixedMeta);

    expect(plan.updates.map((u) => u.id)).toEqual([3, 4]);
    expect(plan.impact.frozenRowsExcluded).toBe(2);
    expect(plan.impact.npasAffected).toBe(2);
    expect(plan.newlyFrozenNpas).toEqual(['212', '310']); // 201 already frozen
  });

  it('honors a per-NPANXX thaw override inside a frozen NPA', () => {
    const njRows = sampleDeck().filter((r) => r.npa === '201');
    const f = createFreezeState();
    f.frozenNpas.add('201');
    f.npanxxOverrides.set('201200', 'thawed');

    const plan = planAdjustment(njRows, markupInter10, f, fixedMeta);

    expect(plan.updates.map((u) => u.id)).toEqual([1]); // 201200 adjusted, 201201 stays frozen
    expect(plan.impact.frozenRowsExcluded).toBe(1);
    expect(plan.newlyFrozenNpas).toEqual([]); // 201 already frozen
  });

  it('honors a per-NPANXX freeze override inside an unfrozen NPA', () => {
    const nyRows = sampleDeck().filter((r) => r.npa === '212');
    const f = createFreezeState();
    f.npanxxOverrides.set('212500', 'frozen');

    const plan = planAdjustment(nyRows, markupInter10, f, fixedMeta);

    expect(plan.updates).toHaveLength(0);
    expect(plan.impact.frozenRowsExcluded).toBe(1);
  });

  it('produces no updates for a no-op adjustment (0%)', () => {
    const plan = planAdjustment(
      sampleDeck(),
      { type: 'markup', valueType: 'percentage', value: 0, target: 'all' },
      createFreezeState(),
      fixedMeta
    );
    expect(plan.updates).toHaveLength(0);
    expect(plan.impact.rowsAffected).toBe(0);
    expect(plan.impact.avgDelta).toEqual({ inter: null, intra: null, indeterm: null });
  });

  it('sets all targeted rates to a fixed value', () => {
    const plan = planAdjustment(
      sampleDeck(),
      { type: 'set', valueType: 'fixed', value: 0, target: 'all' },
      createFreezeState(),
      fixedMeta
    );
    expect(plan.updates).toHaveLength(4);
    expect(plan.updates[2].changes).toEqual({ interRate: 0, intraRate: 0, indetermRate: 0 });
  });

  it('builds a deterministic operation record from injected meta', () => {
    const plan = planAdjustment(sampleDeck(), markupInter10, createFreezeState(), fixedMeta);
    expect(plan.operation).toMatchObject({
      id: 'op_test_1',
      timestamp: '2026-05-26T10:00:00.000Z',
      kind: 'markup',
      valueType: 'percentage',
      value: 10,
      target: 'inter',
      scopeLabel: 'Filtered Results',
      filtersApplied: ['Region equals NJ'],
      npasAffected: ['201', '212', '310'],
      recordsAffected: 4,
    });
  });

  it('does not mutate the input records', () => {
    const deck = sampleDeck();
    planAdjustment(deck, markupInter10, createFreezeState(), fixedMeta);
    expect(deck[0].interRate).toBe(0.01);
  });
});

describe('buildRateDeckCsv', () => {
  it('emits the legacy column layout with leading-1 NPANXX and resolved geo', () => {
    const csv = buildRateDeckCsv([makeRecord({ npanxx: '201200', interRate: 0.011, intraRate: 0.02, indetermRate: 0.03 })], {
      effectiveDate: '2026-06-02',
      getGeo: () => ({ state: 'NJ', country: 'US' }),
    });
    expect(csv.headers).toEqual([
      'NPANXX',
      'State',
      'Country',
      'Interstate Rate',
      'Intrastate Rate',
      'Indeterminate Rate',
      'Effective Date',
    ]);
    expect(csv.rows[0]).toEqual([
      '1201200',
      'NJ',
      'US',
      '0.011000',
      '0.020000',
      '0.030000',
      '2026-06-02',
    ]);
  });
});

describe('buildAuditTable', () => {
  it('emits one row per operation', () => {
    const op: PricingOperation = {
      id: 'op_test_1',
      timestamp: '2026-05-26T10:00:00.000Z',
      kind: 'markup',
      valueType: 'percentage',
      value: 12,
      target: 'inter',
      scopeLabel: 'Filtered Results',
      filtersApplied: ['Region equals NJ'],
      npasAffected: ['201', '212'],
      recordsAffected: 42,
      avgDelta: { inter: 0.001, intra: null, indeterm: null },
    };
    const csv = buildAuditTable([op]);
    expect(csv.rows).toHaveLength(1);
    expect(csv.rows[0]).toEqual([
      '2026-05-26T10:00:00.000Z',
      'markup',
      'percentage',
      '12',
      'inter',
      'Filtered Results',
      'Region equals NJ',
      '2',
      '42',
      '0.001000',
      '',
      '',
    ]);
  });
});

describe('computeReadiness', () => {
  const op = (recordsAffected: number, kind: PricingOperation['kind'] = 'markup'): PricingOperation => ({
    id: 'x',
    timestamp: 'x',
    kind,
    scopeLabel: 'Filtered Results',
    filtersApplied: [],
    npasAffected: [],
    recordsAffected,
    avgDelta: { inter: null, intra: null, indeterm: null },
  });

  it('sums modified rows over adjustment operations and counts frozen scopes', () => {
    const f = createFreezeState();
    f.frozenNpas.add('201');
    f.frozenNpas.add('212');
    f.npanxxOverrides.set('310100', 'frozen');
    f.npanxxOverrides.set('310101', 'thawed'); // thawed should not count as a frozen scope

    const stats = computeReadiness({
      totalRecords: 1000,
      operations: [op(40), op(60), op(0, 'lock')],
      freeze: f,
      avgInterRate: 0.0078,
    });

    expect(stats.modifiedRows).toBe(100); // 40 + 60; lock op excluded
    expect(stats.modifiedPct).toBe(10);
    expect(stats.frozenScopes).toBe(3); // 2 NPAs + 1 frozen override
    expect(stats.avgInterRate).toBe(0.0078);
    expect(stats.exportReady).toBe(true);
  });

  it('is not export-ready with no records', () => {
    const stats = computeReadiness({
      totalRecords: 0,
      operations: [],
      freeze: createFreezeState(),
      avgInterRate: null,
    });
    expect(stats.exportReady).toBe(false);
    expect(stats.modifiedPct).toBe(0);
  });
});

describe('classifyRow', () => {
  const rec = makeRecord({ npanxx: '201200', npa: '201' });

  it('returns modified when its rate changed, even though its NPA is now locked', () => {
    const f = createFreezeState();
    f.frozenNpas.add('201');
    expect(classifyRow(rec, f, new Set(['201200']))).toBe('modified');
  });
  it('returns frozen when locked but unchanged', () => {
    const f = createFreezeState();
    f.frozenNpas.add('201');
    expect(classifyRow(rec, f, new Set())).toBe('frozen');
  });
  it('returns modified when changed and not frozen', () => {
    expect(classifyRow(rec, createFreezeState(), new Set(['201200']))).toBe('modified');
  });
  it('returns original otherwise', () => {
    expect(classifyRow(rec, createFreezeState(), new Set())).toBe('original');
  });
});
