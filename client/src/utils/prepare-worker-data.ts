import { useLergStore } from '@/stores/lerg-store';
import type {
  LergWorkerData,
  CountryLergData,
  LergNpaMapping,
  NPAEntry,
} from '@/types/domains/lerg-types';
import { STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';
import { COUNTRY_CODES } from '@/types/constants/country-codes';

/**
 * Prepare LERG data for use in a Web Worker
 * This converts the Map objects from the store into serializable plain objects
 * that can be transferred to a worker
 *
 * @returns A worker-compatible data structure with NPA mappings and valid NPAs
 */
export function prepareLergWorkerData(): LergWorkerData | null {
  const lergStore = useLergStore();
  console.log('[prepareLergWorkerData] Accessing LERG store data...');

  // Check if the *new* core data maps are populated
  if (
    lergStore.usStates.size === 0 &&
    lergStore.canadaProvinces.size === 0 &&
    lergStore.otherCountries.size === 0
  ) {
    console.warn(
      '[prepareLergWorkerData] Core LERG data maps (usStates, canadaProvinces, otherCountries) are empty. Cannot prepare worker data.'
    );
    return null;
  }

  console.log(
    `[prepareLergWorkerData] Found LERG data: US States(${lergStore.usStates.size}), CA Provinces(${lergStore.canadaProvinces.size}), Other Countries(${lergStore.otherCountries.size})`
  );

  const validNpas: string[] = [];
  const npaMappings: Record<string, LergNpaMapping> = {};
  const countryData: CountryLergData[] = [];
  const stateNPAs: Record<string, string[]> = {}; // Key: State/Province Code, Value: List of NPAs
  const countryGroups: Record<string, string[]> = {}; // Optional: Keep for compatibility if needed elsewhere

  // Helper function to process NPA entries from a map
  const processNpaMap = (
    map: Map<string, NPAEntry[]>,
    defaultCountry: string,
    isStateBased: boolean = false
  ) => {
    for (const [regionCode, npaEntries] of map.entries()) {
      const regionNpas: string[] = [];
      for (const entry of npaEntries) {
        validNpas.push(entry.npa);
        regionNpas.push(entry.npa);
        // Determine country and state/region code for mapping
        const country = defaultCountry || entry.meta?.source || 'Unknown'; // Assuming NPAEntry might have source
        const state = isStateBased ? regionCode : '';
        npaMappings[entry.npa] = { country, state };

        // Populate countryGroups
        if (!countryGroups[country]) {
          countryGroups[country] = [];
        }
        countryGroups[country].push(entry.npa);
      }
      // Populate stateNPAs if applicable
      if (isStateBased && regionNpas.length > 0) {
        stateNPAs[regionCode] = regionNpas;
      }
    }
  };

  // Process US States
  processNpaMap(lergStore.usStates, 'US', true);

  // Process Canadian Provinces
  processNpaMap(lergStore.canadaProvinces, 'CA', true);

  // Process Other Countries
  processNpaMap(lergStore.otherCountries, '', false); // Country code is the key here

  // Now, construct the countryData array from the populated countryGroups
  for (const [countryCode, npas] of Object.entries(countryGroups)) {
    // Filter out duplicates added during processing, although should be minimal if logic is correct
    const uniqueNpas = Array.from(new Set(npas));
    countryData.push({
      country: countryCode,
      npaCount: uniqueNpas.length,
      npas: uniqueNpas.sort(),
    });
  }

  // Add specific province data for CA if needed by worker (assuming worker uses it)
  const caData = countryData.find((c) => c.country === 'CA');
  if (caData) {
    caData.provinces = Array.from(lergStore.canadaProvinces.entries())
      .map(([code, npaEntries]) => ({
        code,
        npas: npaEntries.map((entry) => entry.npa).sort(),
      }))
      .sort((a, b) => b.npas.length - a.npas.length);
  }

  // Sort countryData for consistency
  countryData.sort((a, b) => b.npaCount - a.npaCount);

  // --- FIX: Filter out any "Unknown" country entry ---
  const finalCountryData = countryData.filter((c) => c.country !== 'Unknown');

  console.log(
    `[prepareLergWorkerData] Prepared data: ${validNpas.length} valid NPAs, ${
      Object.keys(npaMappings).length
    } mappings, ${finalCountryData.length} countries, ${
      Object.keys(stateNPAs).length
    } states/provinces.`
  );

  return {
    validNpas: Array.from(new Set(validNpas)), // Ensure unique
    npaMappings,
    countryGroups, // Keep populated countryGroups
    countryData: finalCountryData, // Return filtered data
    stateNPAs,
  };
}

/**
 * Get a summary of LERG data availability
 * Useful for debugging and logging
 */
export function getLergDataSummary(): {
  hasNpaRecords: boolean;
  npaRecordsCount: number;
  countriesCount: number;
  countryStateCount: Record<string, number>;
} {
  const lergStore = useLergStore();

  const countryStateCount: Record<string, number> = {};

  if (lergStore.countryStateMap) {
    for (const [country, stateMap] of lergStore.countryStateMap) {
      countryStateCount[country] = stateMap.size;
    }
  }

  return {
    hasNpaRecords: !!lergStore.npaRecords,
    npaRecordsCount: lergStore.npaRecords?.size || 0,
    countriesCount: lergStore.countriesMap?.size || 0,
    countryStateCount,
  };
}
