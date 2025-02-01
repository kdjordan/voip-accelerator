import { defineStore } from 'pinia';
import type { LergState, SpecialAreaCode } from '@/types/lerg-types';

export const useLergStore = defineStore('lerg', {
  state: (): LergState => ({
    error: null,
    lerg: {
      isProcessing: false,
      progress: 0,
      isLocallyStored: false,
      stats: {
        totalRecords: 0,
        lastUpdated: null,
      },
    },
    specialCodes: {
      isProcessing: false,
      progress: 0,
      isLocallyStored: false,
      data: [] as SpecialAreaCode[],
      stats: {
        totalCodes: 0,
        lastUpdated: null,
        countryBreakdown: [],
      },
    },
  }),

  actions: {
    setLergLocallyStored(value: boolean) {
      this.$patch(state => {
        state.lerg.isLocallyStored = value;
      });
    },

    setSpecialCodesLocallyStored(value: boolean) {
      this.specialCodes.isLocallyStored = value;
    },

    setSpecialCodes(codes: SpecialAreaCode[]) {
      this.specialCodes.data = codes;
    },

    $patch(partialState: Partial<LergState>) {
      console.log('Patching store with:', partialState);
      // Deep merge to preserve nested structure
      if (partialState.lerg) {
        this.lerg = { ...this.lerg, ...partialState.lerg };
      }
      if (partialState.specialCodes) {
        this.specialCodes = { ...this.specialCodes, ...partialState.specialCodes };
      }
      if (partialState.error !== undefined) {
        this.error = partialState.error;
      }
    },

    updateSpecialCodesForCountry(country: string, codes: SpecialAreaCode[]) {
      // Update the store's data for a specific country
      const otherCodes = this.specialCodes.data.filter(code => code.country !== country);
      this.specialCodes.data = [...otherCodes, ...codes];
    },
  },

  getters: {
    filterSpecialCodesByCountry: state => (country: string) => {
      return state.specialCodes.data.filter(code => code.country === country);
    },

    getCountryList: state => {
      return [...new Set(state.specialCodes.data.map(code => code.country))];
    },

    getLergStats: state => {
      return {
        totalRecords: state.lerg.stats.totalRecords,
        lastUpdated: state.lerg.stats.lastUpdated,
        specialCodes: {
          totalCodes: state.specialCodes.stats.totalCodes,
          countryBreakdown: state.specialCodes.stats.countryBreakdown,
        },
      };
    },

    getCountryBreakdown: state => {
      // Calculate breakdown from data
      const breakdown = state.specialCodes.data.reduce((acc, code) => {
        const existing = acc.find(item => item.countryCode === code.country);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ countryCode: code.country, count: 1 });
        }
        return acc;
      }, [] as Array<{ countryCode: string; count: number }>);

      // Sort by country code
      return breakdown.sort((a, b) => a.countryCode.localeCompare(b.countryCode));
    },
  },
});
