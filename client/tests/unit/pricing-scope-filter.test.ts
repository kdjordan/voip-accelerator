import { describe, it, expect } from 'vitest';
import {
  buildScopeFilter,
  computeFilteredAverages,
  type PricingRecord,
  type ScopeFilterParams,
} from '@/utils/pricing-engine';
import { geoSampleDeck, sampleNpaGeoMap, sampleDeck } from '../fixtures/us-rate-sheet';

/** Build params with sensible empty defaults so each test overrides one axis. */
function params(overrides: Partial<ScopeFilterParams> = {}): ScopeFilterParams {
  return {
    searchTerms: [],
    selectedState: '',
    metroNpas: [],
    npaGeoMap: sampleNpaGeoMap(),
    ...overrides,
  };
}

/** Run the predicate over the geo deck and return the matching ids. */
function matchIds(p: ScopeFilterParams): number[] {
  const fn = buildScopeFilter(p);
  return geoSampleDeck()
    .filter(fn)
    .map((r) => r.id!)
    .sort((a, b) => a - b);
}

describe('buildScopeFilter', () => {
  it('passes every row when no filters are set', () => {
    expect(matchIds(params())).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('search: startsWith match on a single term', () => {
    expect(matchIds(params({ searchTerms: ['201'] }))).toEqual([1]);
  });

  it('search: OR across multiple terms', () => {
    expect(matchIds(params({ searchTerms: ['201', '212'] }))).toEqual([1, 2]);
  });

  it('GROUP_UNITED_STATES includes US states but excludes territories, Canada, and other countries', () => {
    // 787 is PR (US territory) → excluded; 416 CA and 876 JM → excluded.
    expect(matchIds(params({ selectedState: 'GROUP_UNITED_STATES' }))).toEqual([1, 2, 3]);
  });

  it('GROUP_CANADA matches only Canadian NPAs', () => {
    expect(matchIds(params({ selectedState: 'GROUP_CANADA' }))).toEqual([5]);
  });

  it('GROUP_OTHER_COUNTRIES matches non-US, non-CA NPAs', () => {
    expect(matchIds(params({ selectedState: 'GROUP_OTHER_COUNTRIES' }))).toEqual([6]);
  });

  it('specific state code matches on the stored stateCode field, not the geo map', () => {
    expect(matchIds(params({ selectedState: 'NY' }))).toEqual([2]);
  });

  it('specific state filtering uses record.stateCode even when it diverges from geo', () => {
    const deck: PricingRecord[] = [
      { id: 1, npa: '201', nxx: '200', npanxx: '201200', stateCode: 'TX', interRate: 0.01, intraRate: 0.02, indetermRate: 0.03 },
    ];
    // geo says 201 is NJ, but the stored stateCode is TX → TX matches, NJ does not.
    expect(deck.filter(buildScopeFilter(params({ selectedState: 'TX' }))).map((r) => r.id)).toEqual([1]);
    expect(deck.filter(buildScopeFilter(params({ selectedState: 'NJ' }))).map((r) => r.id)).toEqual([]);
  });

  it('metro: keeps only rows whose NPA is in the metro set', () => {
    expect(matchIds(params({ metroNpas: ['310', '416'] }))).toEqual([3, 5]);
  });

  it('combines filters with AND (US group + search prefix)', () => {
    // US group → 1,2,3; search "2" → 201200, 212500 (310100 doesn't start with 2).
    expect(matchIds(params({ selectedState: 'GROUP_UNITED_STATES', searchTerms: ['2'] }))).toEqual([1, 2]);
  });

  it('treats NPAs missing from the geo map as non-matching for group filters', () => {
    const deck: PricingRecord[] = [
      { id: 99, npa: '999', nxx: '000', npanxx: '999000', stateCode: 'NJ', interRate: 0.01, intraRate: 0.02, indetermRate: 0.03 },
    ];
    expect(deck.filter(buildScopeFilter(params({ selectedState: 'GROUP_UNITED_STATES' })))).toEqual([]);
  });
});

describe('computeFilteredAverages', () => {
  it('averages each rate field over rows that have any numeric rate', () => {
    const avg = computeFilteredAverages(sampleDeck());
    // inter: (0.01+0.01+0.1+0.05)/4 = 0.0425
    expect(avg.inter).toBeCloseTo(0.0425, 10);
    // intra: (0.02+0.02+0.2+0.05)/4 = 0.0725
    expect(avg.intra).toBeCloseTo(0.0725, 10);
    // indeterm: (0.03+0.03+0.3+0.05)/4 = 0.1025
    expect(avg.indeterm).toBeCloseTo(0.1025, 10);
  });

  it('returns all-null for an empty set', () => {
    expect(computeFilteredAverages([])).toEqual({ inter: null, intra: null, indeterm: null });
  });

  it('excludes rows with no numeric rate from the denominator', () => {
    const deck: PricingRecord[] = [
      { id: 1, npa: '201', nxx: '200', npanxx: '201200', stateCode: 'NJ', interRate: 0.1, intraRate: 0.2, indetermRate: 0.3 },
      { id: 2, npa: '201', nxx: '201', npanxx: '201201', stateCode: 'NJ', interRate: null, intraRate: null, indetermRate: null },
    ];
    // Only row 1 counts → denominator 1.
    const avg = computeFilteredAverages(deck);
    expect(avg.inter).toBeCloseTo(0.1, 10);
    expect(avg.intra).toBeCloseTo(0.2, 10);
    expect(avg.indeterm).toBeCloseTo(0.3, 10);
  });
});
