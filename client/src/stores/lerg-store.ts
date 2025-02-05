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
      stats: {
        totalRecords: 0,
        lastUpdated: null,
        stateNPAs: {},
      },
    },
    specialCodes: {
      isProcessing: false,
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
      this.specialCodes.stats.totalCodes = codes.length;
      this.specialCodes.isLocallyStored = true;
    },

    $patch(partialState: Partial<LergState>) {
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

    setStateNPAs(stateNPAs: StateNPAMapping) {
      console.log('🔵 Setting state NPAs, incoming data:', stateNPAs);
      // Force a full state update
      this.$state = {
        ...this.$state,
        lerg: {
          ...this.lerg,
          stats: {
            ...this.lerg.stats,
            stateNPAs,
          },
        },
      };
      console.log('🔵 Store state after update:', this.lerg.stats.stateNPAs);
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

    sortedCountriesWithNPAs(): CountryWithNPAs[] {
      const countryMap = new Map<string, string[]>();

      this.specialCodes.data.forEach(code => {
        if (!countryMap.has(code.country)) {
          countryMap.set(code.country, []);
        }
        countryMap.get(code.country)?.push(code.npa);
      });

      return Array.from(countryMap.entries())
        .map(([name, npas]) => ({
          name,
          npas: npas.sort(),
        }))
        .sort((a, b) => b.npas.length - a.npas.length);
    },

    sortedStatesWithNPAs(): StateWithNPAs[] {
      if (!this.lerg.stats.stateNPAs) return [];
      const stateMap = this.lerg.stats.stateNPAs;
      return Object.entries(stateMap)
        .map(([code, npas]) => ({
          code,
          npas: npas.sort(),
        }))
        .sort((a, b) => b.npas.length - a.npas.length);
    },

    getStateNPACount: state => (stateCode: string) => {
      if (!state.lerg.stats.stateNPAs) return 0;
      return state.lerg.stats.stateNPAs[stateCode]?.length || 0;
    },

    getTotalStates: state => {
      if (!state.lerg.stats.stateNPAs) return 0;
      return Object.keys(state.lerg.stats.stateNPAs).length;
    },
  },
});
