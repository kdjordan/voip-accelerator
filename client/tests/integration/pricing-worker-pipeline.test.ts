import { describe, it, expect } from 'vitest';
import {
  buildScopeFilter,
  planAdjustment,
  computeFilteredAverages,
  createFreezeState,
  type Adjustment,
  type FreezeState,
  type PlanMeta,
  type PricingRecord,
  type ScopeFilterParams,
} from '@/utils/pricing-engine';
import { geoSampleDeck, sampleNpaGeoMap } from '../fixtures/us-rate-sheet';

/**
 * The off-thread adjuster worker must produce byte-for-byte the same result the
 * legacy main-thread path did — only WHERE the work runs changed, not WHAT it
 * computes. The worker's onmessage is hard to unit test, so we exercise the
 * pure core it calls (buildScopeFilter → planAdjustment → apply → averages) and
 * compare it against faithful re-implementations of the legacy
 * createFilters()/calculateAverages() that USRateSheetTable used to run inline.
 */

// Faithful copy of the legacy createFilters() predicate chain (pre-worker),
// using npaGeoMap lookups in place of lergStore.getNPAInfo (same data).
function legacyFilters(params: ScopeFilterParams): ((r: PricingRecord) => boolean)[] {
  const { searchTerms, selectedState, metroNpas, npaGeoMap } = params;
  const getNPAInfo = (npa: string) => npaGeoMap[npa];
  const filters: ((r: PricingRecord) => boolean)[] = [];

  if (searchTerms.length > 0) {
    filters.push((r) => {
      const lower = r.npanxx.toLowerCase();
      return searchTerms.some((t) => lower.startsWith(t));
    });
  }
  if (selectedState) {
    filters.push((r) => {
      if (selectedState === 'GROUP_UNITED_STATES') {
        const info = getNPAInfo(r.npa);
        return (
          info?.country_code === 'US' &&
          !['PR', 'VI', 'GU', 'AS', 'MP'].includes(info.state_province_code)
        );
      } else if (selectedState === 'GROUP_CANADA') {
        return getNPAInfo(r.npa)?.country_code === 'CA';
      } else if (selectedState === 'GROUP_OTHER_COUNTRIES') {
        const info = getNPAInfo(r.npa);
        return !!info && info.country_code !== 'US' && info.country_code !== 'CA';
      }
      return r.stateCode === selectedState;
    });
  }
  if (metroNpas.length > 0) {
    const npaSet = new Set(metroNpas);
    filters.push((r) => npaSet.has(r.npa));
  }
  return filters;
}

// Faithful copy of the legacy calculateAverages() reduction.
function legacyAverages(records: PricingRecord[]) {
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

/** Apply a plan's changes onto records, as both the worker and legacy bulkUpdate do. */
function applyChanges(records: PricingRecord[], plan: ReturnType<typeof planAdjustment>) {
  const byId = new Map(records.map((r) => [r.id, r]));
  for (const u of plan.updates) Object.assign(byId.get(u.id)!, u.changes);
}

const fixedMeta: PlanMeta = {
  scopeLabel: 'Filtered Results',
  filtersApplied: ['Region: GROUP_UNITED_STATES'],
  now: () => new Date('2026-05-26T12:00:00.000Z'),
  idFactory: () => 'op_pipeline_1',
};

const markupInter10: Adjustment = { type: 'markup', valueType: 'percentage', value: 10, target: 'inter' };

/** Run both paths over the same params/adjustment/freeze and compare every output. */
function comparePaths(params: ScopeFilterParams, adjustment: Adjustment, freeze: FreezeState, meta: PlanMeta) {
  // Legacy main-thread path.
  const legacyDeck = geoSampleDeck();
  const lf = legacyFilters(params);
  const legacyFiltered = legacyDeck.filter((r) => lf.every((fn) => fn(r)));
  const legacyPlan = planAdjustment(legacyFiltered, adjustment, freeze, meta);
  applyChanges(legacyFiltered, legacyPlan);
  const legacyAvg = legacyAverages(legacyFiltered);

  // Worker pure-core path.
  const workerDeck = geoSampleDeck();
  const workerFiltered = workerDeck.filter(buildScopeFilter(params));
  const workerPlan = planAdjustment(workerFiltered, adjustment, freeze, meta);
  applyChanges(workerFiltered, workerPlan);
  const workerAvg = computeFilteredAverages(workerFiltered);

  // Same rows selected.
  expect(workerFiltered.map((r) => r.id)).toEqual(legacyFiltered.map((r) => r.id));
  // Same plan outputs.
  expect(workerPlan.impact).toEqual(legacyPlan.impact);
  expect(workerPlan.operation).toEqual(legacyPlan.operation);
  expect(workerPlan.modifiedNpanxx).toEqual(legacyPlan.modifiedNpanxx);
  expect(workerPlan.newlyFrozenNpas).toEqual(legacyPlan.newlyFrozenNpas);
  // Same post-apply averages.
  expect(workerAvg).toEqual(legacyAvg);

  return { workerPlan, workerAvg };
}

describe('worker pipeline parity with legacy main-thread path', () => {
  const geoMap = sampleNpaGeoMap();

  it('US-group scope: identical filter, plan, and averages', () => {
    const { workerPlan } = comparePaths(
      { searchTerms: [], selectedState: 'GROUP_UNITED_STATES', metroNpas: [], npaGeoMap: geoMap },
      markupInter10,
      createFreezeState(),
      fixedMeta
    );
    // Sanity: US group hits the three US-state rows (201/212/310), not PR/CA/JM.
    expect(workerPlan.modifiedNpanxx.sort()).toEqual(['201200', '212500', '310100']);
    expect(workerPlan.newlyFrozenNpas.sort()).toEqual(['201', '212', '310']);
  });

  it('search + metro combination: identical outputs', () => {
    comparePaths(
      { searchTerms: ['2'], selectedState: '', metroNpas: ['201', '212'], npaGeoMap: geoMap },
      { type: 'markdown', valueType: 'fixed', value: 0.005, target: 'all' },
      createFreezeState(),
      fixedMeta
    );
  });

  it('respects pre-existing freeze: frozen rows excluded identically', () => {
    const freeze: FreezeState = { frozenNpas: new Set(['201']), npanxxOverrides: new Map() };
    const { workerPlan } = comparePaths(
      { searchTerms: [], selectedState: 'GROUP_UNITED_STATES', metroNpas: [], npaGeoMap: geoMap },
      markupInter10,
      freeze,
      fixedMeta
    );
    // 201 is frozen → excluded; only 212/310 adjusted.
    expect(workerPlan.impact.frozenRowsExcluded).toBe(1);
    expect(workerPlan.modifiedNpanxx.sort()).toEqual(['212500', '310100']);
  });
});
