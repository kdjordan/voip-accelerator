import { useLergStore } from '@/stores/lerg-store';
import type { LergWorkerData, CountryLergData, LergNpaMapping } from '@/types/domains/lerg-types';

/**
 * Prepare LERG data for use in a Web Worker
 * This converts the Map objects from the store into serializable plain objects
 * that can be transferred to a worker
 *
 * @returns A worker-compatible data structure with NPA mappings and valid NPAs
 */
export function prepareLergWorkerData(): LergWorkerData | null {
  const lergStore = useLergStore();

  // Check if we have the necessary data
  if (!lergStore.npaRecords || !lergStore.countriesMap || !lergStore.countryStateMap) {
    console.warn('LERG data not available for worker preparation');
    return null;
  }

  // Extract serializable data
  const validNpas: string[] = [];
  const npaMappings: Record<string, LergNpaMapping> = {};
  const countryGroups: Record<string, string[]> = {};
  const countryData: CountryLergData[] = [];
  const stateNPAs: Record<string, string[]> = {};

  // Convert NPA records to mappings
  for (const [npa, record] of lergStore.npaRecords) {
    validNpas.push(npa);
    npaMappings[npa] = {
      country: record.country,
      state: record.state,
    };
  }

  // Convert country maps to countryData and countryGroups
  for (const [country, npasSet] of lergStore.countriesMap) {
    const npasArray = Array.from(npasSet);
    countryGroups[country] = npasArray;
    countryData.push({
      country: country,
      npaCount: npasArray.length,
      npas: npasArray,
    });
  }

  // Convert countryStateMap to stateNPAs
  for (const [_country, stateMap] of lergStore.countryStateMap) {
    for (const [state, npasSet] of stateMap) {
      stateNPAs[state] = Array.from(npasSet);
    }
  }

  return {
    validNpas,
    npaMappings,
    countryGroups,
    countryData,
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
