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
} from '@/types/domains/lerg-types';
import { computed } from 'vue';
import { COUNTRY_CODES } from '@/types/constants/country-codes';
import { STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';

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
    npaRecords: undefined,
    countriesMap: undefined,
    countryStateMap: undefined,
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

    setNpaRecords(npaRecords: NpaMap) {
      this.npaRecords = npaRecords;
    },

    setCountriesMap(countriesMap: CountryNpaMap) {
      this.countriesMap = countriesMap;
    },

    setCountryStateMap(countryStateMap: CountryStateNpaMap) {
      this.countryStateMap = countryStateMap;
    },

    clearLergData() {
      this.stateNPAs = {};
      this.countryData = [];
      this.stats.totalRecords = 0;
      this.stats.lastUpdated = null;
      this.isLocallyStored = false;
      this.npaRecords = undefined;
      this.countriesMap = undefined;
      this.countryStateMap = undefined;
      this.error = null;
    },
  },

  getters: {
    sortedStatesWithNPAs: (state): StateWithNPAs[] => {
      return Object.entries(state.stateNPAs)
        .filter(([code]) => {
          return code in STATE_CODES;
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
      const usNPAs = new Set<string>();

      Object.entries(state.stateNPAs)
        .filter(([code]) => {
          return code in STATE_CODES;
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

    getNpaRecordByNpa:
      (state) =>
      (npa: string): NpaRecord | undefined => {
        return state.npaRecords?.get(npa);
      },

    getStateByNpa:
      (state) =>
      (npa: string): { country: string; state: string } | null => {
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

    getUSStates: (state): StateWithNPAs[] => {
      if (!state.countryStateMap?.has('US')) return [];

      const usStateMap = state.countryStateMap.get('US');
      if (!usStateMap) return [];

      return Array.from(usStateMap.entries())
        .filter(([stateCode]) => {
          return STATE_CODES.hasOwnProperty(stateCode);
        })
        .map(([stateCode, npas]) => ({
          code: stateCode,
          country: 'US',
          npas: Array.from(npas).sort(),
        }))
        .sort((a, b) => b.npas.length - a.npas.length);
    },

    getCanadianProvinces: (state): StateWithNPAs[] => {
      if (!state.countryStateMap?.has('CA')) return [];

      const caProvinceMap = state.countryStateMap.get('CA');
      if (!caProvinceMap) return [];

      return Array.from(caProvinceMap.entries())
        .filter(([provinceCode]) => {
          return PROVINCE_CODES.hasOwnProperty(provinceCode);
        })
        .map(([provinceCode, npas]) => ({
          code: provinceCode,
          country: 'CA',
          npas: Array.from(npas).sort(),
        }))
        .sort((a, b) => b.npas.length - a.npas.length);
    },

    getDistinctCountries: (state): CountryLergData[] => {
      if (!state.countriesMap) return [];

      return Array.from(state.countriesMap.entries())
        .filter(([country]) => country !== 'US' && country !== 'CA')
        .map(([country, npas]) => ({
          country,
          npaCount: npas.size,
          npas: Array.from(npas).sort(),
        }))
        .sort((a, b) => b.npaCount - a.npaCount);
    },
  },
});
