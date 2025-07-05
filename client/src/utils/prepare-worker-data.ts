import { useLergStoreV2 } from '@/stores/lerg-store-v2';
import type {
  LergWorkerData,
  CountryLergData,
  LergNpaMapping,
} from '@/types/domains/lerg-types';

/**
 * Prepare LERG data for use in a Web Worker
 * This converts the enhanced LERG data into serializable plain objects
 * that can be transferred to a worker
 */
export function prepareLergWorkerData(): LergWorkerData | null {
  const lergStore = useLergStoreV2();
  console.log('[prepareLergWorkerData] Accessing enhanced LERG store data...');

  // Check if the store has data
  if (!lergStore.isLoaded || lergStore.allNPAs.length === 0) {
    console.warn('[prepareLergWorkerData] Enhanced LERG data not loaded. Cannot prepare worker data.');
    return null;
  }

  console.log(`[prepareLergWorkerData] Found ${lergStore.allNPAs.length} enhanced NPA records`);

  const validNpas: string[] = [];
  const npaMappings: Record<string, LergNpaMapping> = {};
  const countryGroups: Record<string, string[]> = {};
  const stateNPAs: Record<string, string[]> = {};

  // Process all enhanced NPA records
  for (const npaRecord of lergStore.allNPAs) {
    validNpas.push(npaRecord.npa);
    
    // Create mapping for worker
    npaMappings[npaRecord.npa] = {
      country: npaRecord.country_code,
      state: npaRecord.state_province_code
    };

    // Group by country
    if (!countryGroups[npaRecord.country_code]) {
      countryGroups[npaRecord.country_code] = [];
    }
    countryGroups[npaRecord.country_code].push(npaRecord.npa);

    // Group by state/province for US/CA
    if (npaRecord.country_code === 'US' || npaRecord.country_code === 'CA') {
      const stateKey = npaRecord.state_province_code;
      if (!stateNPAs[stateKey]) {
        stateNPAs[stateKey] = [];
      }
      stateNPAs[stateKey].push(npaRecord.npa);
    }
  }

  // Build country data array
  const countryData: CountryLergData[] = [];
  for (const [countryCode, npas] of Object.entries(countryGroups)) {
    const uniqueNpas = Array.from(new Set(npas));
    countryData.push({
      country: countryCode,
      npaCount: uniqueNpas.length,
      npas: uniqueNpas.sort(),
    });
  }

  // Add province data for Canada
  const caData = countryData.find((c) => c.country === 'CA');
  if (caData) {
    const provinces = lergStore.getCanadianProvinces;
    caData.provinces = provinces.map(province => ({
      code: province.code,
      npas: province.npas.sort(),
    })).sort((a, b) => b.npas.length - a.npas.length);
  }

  // Sort by NPA count
  countryData.sort((a, b) => b.npaCount - a.npaCount);

  console.log(
    `[prepareLergWorkerData] Prepared data: ${validNpas.length} valid NPAs, ${countryData.length} countries`
  );

  return {
    validNpas: Array.from(new Set(validNpas)),
    npaMappings,
    countryGroups,
    countryData,
    stateNPAs,
  };
}

/**
 * Get a summary of LERG data availability
 */
export function getLergDataSummary(): {
  hasNpaRecords: boolean;
  npaRecordsCount: number;
  countriesCount: number;
  countryStateCount: Record<string, number>;
} {
  const lergStore = useLergStoreV2();

  const countryStateCount: Record<string, number> = {};

  // Count states/provinces per country
  const usStates = lergStore.getUSStates;
  const caProvinces = lergStore.getCanadianProvinces;
  
  countryStateCount['US'] = usStates.length;
  countryStateCount['CA'] = caProvinces.length;

  return {
    hasNpaRecords: lergStore.isLoaded,
    npaRecordsCount: lergStore.allNPAs.length,
    countriesCount: lergStore.getDistinctCountries.length,
    countryStateCount,
  };
}