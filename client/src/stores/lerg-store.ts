import { defineStore } from 'pinia';
import type { LergState, StateWithNPAs, StateNPAMapping, LergStats, CountryLergData } from '@/types/lerg-types';

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

    setLergStats(totalRecords: number) {
      this.stats.totalRecords = totalRecords;
      this.stats.lastUpdated = new Date().toISOString();
    },

    setError(error: string | null) {
      this.error = error;
    },
  },

  getters: {
    getLergStats: (state): LergStats => ({
      totalRecords: state.stats.totalRecords,
      lastUpdated: state.stats.lastUpdated,
    }),

    sortedStatesWithNPAs: (state): StateWithNPAs[] => {
      return Object.entries(state.stateNPAs)
        .map(([code, npas]) => ({
          code,
          npas: [...npas].sort(),
        }))
        .sort((a, b) => b.npas.length - a.npas.length);
    },

    getStateNPACount: state => (stateCode: string) => {
      if (!state.stateNPAs) return 0;
      return state.stateNPAs[stateCode]?.length || 0;
    },

    getTotalStates: (state): number => {
      return Object.keys(state.stateNPAs).length;
    },

    getCountryData: (state): CountryLergData[] => state.countryData,

    getCountryByCode: state => (countryCode: string) =>
      state.countryData.find(country => country.country === countryCode),

    getTotalNPAs: (state): number => state.countryData.reduce((sum, country) => sum + country.npaCount, 0),

    getCountryCount: (state): number => state.countryData.length,
  },
});
