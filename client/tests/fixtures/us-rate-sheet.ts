import type { PricingRecord } from '@/utils/pricing-engine';

/** Build a PricingRecord, deriving npa/nxx from npanxx and defaulting rates. */
export function makeRecord(
  partial: Partial<PricingRecord> & { npanxx: string }
): PricingRecord {
  const npanxx = partial.npanxx;
  return {
    id: partial.id,
    npa: partial.npa ?? npanxx.slice(0, 3),
    nxx: partial.nxx ?? npanxx.slice(3, 6),
    npanxx,
    stateCode: partial.stateCode ?? 'XX',
    interRate: partial.interRate ?? 0.01,
    intraRate: partial.intraRate ?? 0.02,
    indetermRate: partial.indetermRate ?? 0.03,
  };
}

/**
 * Small deterministic deck: 4 rows across 3 NPAs (201 NJ ×2, 212 NY, 310 CA).
 * Distinct rates so per-row deltas are easy to reason about in assertions.
 */
export function sampleDeck(): PricingRecord[] {
  return [
    makeRecord({ id: 1, npanxx: '201200', stateCode: 'NJ', interRate: 0.01, intraRate: 0.02, indetermRate: 0.03 }),
    makeRecord({ id: 2, npanxx: '201201', stateCode: 'NJ', interRate: 0.01, intraRate: 0.02, indetermRate: 0.03 }),
    makeRecord({ id: 3, npanxx: '212500', stateCode: 'NY', interRate: 0.1, intraRate: 0.2, indetermRate: 0.3 }),
    makeRecord({ id: 4, npanxx: '310100', stateCode: 'CA', interRate: 0.05, intraRate: 0.05, indetermRate: 0.05 }),
  ];
}

/**
 * Deck spanning the regions the scope filter branches on: US states, a US
 * territory (PR — excluded from GROUP_UNITED_STATES), Canada, and another
 * country. Pairs with sampleNpaGeoMap() below.
 */
export function geoSampleDeck(): PricingRecord[] {
  return [
    makeRecord({ id: 1, npanxx: '201200', stateCode: 'NJ' }), // US — NJ
    makeRecord({ id: 2, npanxx: '212500', stateCode: 'NY' }), // US — NY
    makeRecord({ id: 3, npanxx: '310100', stateCode: 'CA' }), // US — CA
    makeRecord({ id: 4, npanxx: '787300', stateCode: 'PR' }), // US territory — PR
    makeRecord({ id: 5, npanxx: '416700', stateCode: 'ON' }), // Canada — ON
    makeRecord({ id: 6, npanxx: '876900', stateCode: 'JM' }), // Other country — Jamaica
  ];
}

/** NPA → geo, mirroring lergStore.getNPAInfo's shape, for scope-filter tests. */
export function sampleNpaGeoMap(): Record<
  string,
  { country_code: string; state_province_code: string }
> {
  return {
    '201': { country_code: 'US', state_province_code: 'NJ' },
    '212': { country_code: 'US', state_province_code: 'NY' },
    '310': { country_code: 'US', state_province_code: 'CA' },
    '787': { country_code: 'US', state_province_code: 'PR' },
    '416': { country_code: 'CA', state_province_code: 'ON' },
    '876': { country_code: 'JM', state_province_code: 'JM' },
  };
}
