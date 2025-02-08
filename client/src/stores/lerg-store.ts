import { defineStore } from 'pinia';
import type { LergState, SpecialAreaCode, CountryBreakdown, StateWithNPAs, StateNPAMapping } from '@/types/lerg-types';

interface CountryWithNPAs {
  name: string;
  npas: string[];
}

export const useLergStore = defineStore('lerg', {
  state: (): LergState => ({
    error: null,
    lerg: {
      isProcessing: false,
      isLocallyStored: false,
      stateNPAs: {},
      stats: {
        totalRecords: 0,
        lastUpdated: null,
      },
    },
  }),

  actions: {
    setLergLocallyStored(value: boolean) {
      this.lerg.isLocallyStored = value;
    },

    setStateNPAs(stateNPAs: StateNPAMapping) {
      this.lerg.stateNPAs = stateNPAs;
    },

    setLergStats(totalRecords: number) {
      this.lerg.stats.totalRecords = totalRecords;
      this.lerg.stats.lastUpdated = new Date().toISOString();
    },

    setError(error: string | null) {
      this.error = error;
    },

    updateSpecialCodesForCountry(country: string, codes: SpecialAreaCode[]) {
      // Update the store's data for a specific country
      const otherCodes = this.specialCodes.data.filter(code => code.country !== country);
      this.specialCodes.data = [...otherCodes, ...codes];
    },
  },

  getters: {
    getLergStats: (state): LERGStats => {
      return {
        totalRecords: state.lerg.stats.totalRecords,
        lastUpdated: state.lerg.stats.lastUpdated,
      };
    },

    getCountryList: state => {
      return [...new Set(state.specialCodes.data.map(code => code.country))];
    },

    getCountryBreakdown: state => {
      // Transform the data to match CountryBreakdown interface
      return state.specialCodes.data
        .reduce((acc, code) => {
          const existing = acc.find(item => item.countryCode === code.country);
          if (existing) {
            existing.count++;
            existing.npaCodes.push(code.npa);
          } else {
            acc.push({
              countryCode: code.country,
              count: 1,
              npaCodes: [code.npa],
            });
          }
          return acc;
        }, [] as CountryBreakdown[])
        .sort((a, b) => a.countryCode.localeCompare(b.countryCode));
    },

    sortedStatesWithNPAs: (state): StateWithNPAs[] => {
      return Object.entries(state.lerg.stateNPAs)
        .map(([code, npas]) => ({
          code,
          npas: [...npas].sort(),
        }))
        .sort((a, b) => b.npas.length - a.npas.length);
    },

    getStateNPACount: state => (stateCode: string) => {
      if (!state.lerg.stateNPAs) return 0;
      return state.lerg.stateNPAs[stateCode]?.length || 0;
    },

    getTotalStates: (state): number => {
      return Object.keys(state.lerg.stateNPAs).length;
    },
  },
});
