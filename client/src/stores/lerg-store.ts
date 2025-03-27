import { defineStore } from 'pinia';
import type {
  LergState,
  StateWithNPAs,
  StateNPAMapping,
  CountryLergData,
  NpaMap,
  CountryNpaMap,
  CountryStateNpaMap,
  NpaRecord,
  LergDataProvider,
} from '@/types/domains/lerg-types';
import { computed } from 'vue';
import { COUNTRY_CODES } from '@/types/constants/country-codes';

export const useLergStore = defineStore('lerg', {
  state: (): LergState => ({
    error: null,
    isProcessing: false,
    isLocallyStored: false,
    stateNPAs: {},
    countryData: [],
    stats: {
      totalRecords: 0,
      lastUpdated: null,
    },
  }),

  actions: {
    setLergLocallyStored(value: boolean) {
      this.isLocallyStored = value;
    },

    setStateNPAs(stateNPAs: StateNPAMapping) {
      this.stateNPAs = stateNPAs;
    },

    setCountryData(countryData: CountryLergData[]) {
      this.countryData = countryData;
    },

    setLergStats(totalRecords: number, lastUpdated?: string | null) {
      this.stats.totalRecords = totalRecords;
      this.stats.lastUpdated = lastUpdated || new Date().toISOString();
    },

    setError(error: string | null) {
      this.error = error;
    },

    // New actions for NPA-focused implementation
    setNpaRecords(npaRecords: NpaMap) {
      this.npaRecords = npaRecords;
    },

    setCountriesMap(countriesMap: CountryNpaMap) {
      this.countriesMap = countriesMap;
    },

    setCountryStateMap(countryStateMap: CountryStateNpaMap) {
      this.countryStateMap = countryStateMap;
    },

    // Clear all data
    clearLergData() {
      this.stateNPAs = {};
      this.countryData = [];
      this.stats.totalRecords = 0;
      this.stats.lastUpdated = null;
      this.isLocallyStored = false;
      this.npaRecords = undefined;
      this.countriesMap = undefined;
      this.countryStateMap = undefined;
    },
  },

  getters: {
    sortedStatesWithNPAs: (state): StateWithNPAs[] => {
      return Object.entries(state.stateNPAs)
        .filter(([code, npas]) => {
          return (
            !COUNTRY_CODES[code] ||
            (code === 'CA' &&
              state.countryData
                .find((c) => c.country === 'US')
                ?.npas.some((npa) => npas.includes(npa)))
          );
        })
        .map(([code, npas]) => ({
          code,
          country: 'US',
          npas: [...npas].sort(),
        }))
        .sort((a, b) => b.npas.length - a.npas.length);
    },

    getStateNPACount: (state) => (stateCode: string) => {
      return state.stateNPAs[stateCode]?.length || 0;
    },

    getTotalStates: (state): number => {
      return Object.keys(state.stateNPAs).length;
    },

    getTotalUSNPAs: (state): number => {
      // Create a Set to ensure we count each NPA only once
      const usNPAs = new Set<string>();

      // Add NPAs only from US states (filtering out country codes except US)
      Object.entries(state.stateNPAs)
        .filter(([code]) => {
          // Only include US state codes and the US country code itself
          // Exclude any other country codes (like CA for Canada)
          return (!COUNTRY_CODES[code] && code !== 'CA') || code === 'US';
        })
        .forEach(([_, npas]) => {
          npas.forEach((npa) => usNPAs.add(npa));
        });

      return usNPAs.size;
    },

    getCountryData: (state): CountryLergData[] => {
      const territoryData = Object.entries(state.stateNPAs)
        .filter(([code]) => COUNTRY_CODES[code])
        .map(([code, npas]) => ({
          country: code,
          npaCount: npas.length,
          npas: [...npas].sort(),
        }));

      return [...territoryData, ...state.countryData].sort((a, b) => b.npaCount - a.npaCount);
    },

    getCountryByCode: (state) => (countryCode: string) =>
      state.countryData.find((country) => country.country === countryCode),

    getTotalNPAs: (state): number =>
      state.countryData.reduce((sum, country) => sum + country.npaCount, 0),

    getCountryCount: (state): number => state.countryData.length,

    // New getters for NPA-focused implementation
    getNpaRecordByNpa:
      (state) =>
      (npa: string): NpaRecord | undefined => {
        return state.npaRecords?.get(npa);
      },

    getStateByNpa:
      (state) =>
      (npa: string): { country: string; state: string } | null => {
        if (!state.countryStateMap) return null;

        // Check each country and state for the NPA
        for (const [country, stateMap] of state.countryStateMap.entries()) {
          for (const [stateCode, npas] of stateMap.entries()) {
            if (npas.has(npa)) {
              return { country, state: stateCode };
            }
          }
        }
        return null;
      },

    getCountryByNpa:
      (state) =>
      (npa: string): string | null => {
        if (!state.countriesMap) return null;

        for (const [country, npas] of state.countriesMap.entries()) {
          if (npas.has(npa)) {
            return country;
          }
        }
        return null;
      },

    getNpasByCountry:
      (state) =>
      (country: string): Set<string> => {
        return state.countriesMap?.get(country) || new Set<string>();
      },

    getNpasByState:
      (state) =>
      (country: string, stateCode: string): Set<string> => {
        return state.countryStateMap?.get(country)?.get(stateCode) || new Set<string>();
      },

    isValidNpa:
      (state) =>
      (npa: string): boolean => {
        return state.npaRecords?.has(npa) ?? false;
      },

    // Data provider implementation
    lergDataProvider: (state): LergDataProvider => {
      return {
        getNpaRecord: (npa: string) => state.npaRecords?.get(npa),

        getStateByNpa: (npa: string) => {
          if (!state.countryStateMap) return null;

          for (const [country, stateMap] of state.countryStateMap.entries()) {
            for (const [stateCode, npas] of stateMap.entries()) {
              if (npas.has(npa)) {
                return { country, state: stateCode };
              }
            }
          }
          return null;
        },

        getCountryByNpa: (npa: string) => {
          if (!state.countriesMap) return null;

          for (const [country, npas] of state.countriesMap.entries()) {
            if (npas.has(npa)) {
              return country;
            }
          }
          return null;
        },

        getNpasByCountry: (country: string) => {
          return state.countriesMap?.get(country) || new Set<string>();
        },

        getNpasByState: (country: string, stateCode: string) => {
          return state.countryStateMap?.get(country)?.get(stateCode) || new Set<string>();
        },

        isValidNpa: (npa: string) => {
          return state.npaRecords?.has(npa) ?? false;
        },
      };
    },

    // Method to prepare worker-friendly data
    getWorkerData: (state) => {
      if (!state.npaRecords || !state.countriesMap) {
        return null;
      }

      // Create serializable data for worker
      const validNpas = Array.from(state.npaRecords.keys());
      const npaMappings: Record<string, { country: string; state: string }> = {};
      const countryGroups: Record<string, string[]> = {};

      // Populate NPA mappings
      for (const [npa, record] of state.npaRecords.entries()) {
        npaMappings[npa] = {
          country: record.country,
          state: record.state,
        };
      }

      // Populate country groups
      for (const [country, npas] of state.countriesMap.entries()) {
        countryGroups[country] = Array.from(npas);
      }

      return {
        validNpas,
        npaMappings,
        countryGroups,
      };
    },
  },
});
