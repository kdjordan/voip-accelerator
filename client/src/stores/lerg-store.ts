import { defineStore } from 'pinia';
import type {
  LergState,
  StateWithNPAs,
  StateNPAMapping,
  CountryLergData,
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
  },
});
