import { defineStore } from 'pinia';
import type {
  NPAEntry,
  USStateNPAMap,
  CanadaProvinceNPAMap,
  CountryNPAMap,
  LERGStateInterface,
  StateWithNPAs,
  CountryLergData,
  NpaMap,
  CountryNpaMap,
  CountryStateNpaMap,
} from '@/types/domains/lerg-types';
import { COUNTRY_CODES } from '@/types/constants/country-codes';
import { STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';

export const useLergStore = defineStore('lerg', {
  state: (): LERGStateInterface => ({
    // Core data maps - use Maps for better performance and type safety
    usStates: new Map<string, NPAEntry[]>(),
    canadaProvinces: new Map<string, NPAEntry[]>(),
    otherCountries: new Map<string, NPAEntry[]>(),

    // Status tracking
    isLoaded: false,
    isProcessing: false,
    error: null,

    // Statistics
    stats: {
      totalNPAs: 0,
      countriesCount: 0,
      usTotalNPAs: 0,
      canadaTotalNPAs: 0,
      lastUpdated: null,
    },

    // Legacy compatibility properties
    npaRecords: new Map(),
    countriesMap: new Map(),
    countryStateMap: new Map(),
    stateNPAs: {},
    countryData: [],
  }),

  actions: {
    /**
     * Set the US states NPA mapping
     */
    setUSStates(usStates: USStateNPAMap) {
      this.usStates = usStates;
      // Update stats when setting US data
      this.stats.usTotalNPAs = this.calculateUSTotalNPAs();
    },

    /**
     * Set the Canadian provinces NPA mapping
     */
    setCanadaProvinces(canadaProvinces: CanadaProvinceNPAMap) {
      this.canadaProvinces = canadaProvinces;
      // Update stats when setting Canada data
      this.stats.canadaTotalNPAs = this.calculateCanadaTotalNPAs();
    },

    /**
     * Set the other countries NPA mapping
     */
    setOtherCountries(otherCountries: CountryNPAMap) {
      this.otherCountries = otherCountries;
      // Update stats when setting other countries data
      this.stats.countriesCount = this.otherCountries.size;
    },

    /**
     * Update last updated timestamp
     */
    setLastUpdated(date: Date | null) {
      this.stats.lastUpdated = date;
    },

    /**
     * Set error state
     */
    setError(error: string | null) {
      this.error = error;
    },

    /**
     * Set processing state
     */
    setProcessing(isProcessing: boolean) {
      this.isProcessing = isProcessing;
    },

    /**
     * Set loaded state
     */
    setLoaded(isLoaded: boolean) {
      this.isLoaded = isLoaded;
    },

    /**
     * Calculate total NPAs across all data maps
     */
    calculateTotalNPAs(): number {
      return (
        this.calculateUSTotalNPAs() +
        this.calculateCanadaTotalNPAs() +
        this.calculateOtherCountriesTotalNPAs()
      );
    },

    /**
     * Calculate total US NPAs
     */
    calculateUSTotalNPAs(): number {
      let total = 0;
      for (const npas of this.usStates.values()) {
        total += npas.length;
      }
      return total;
    },

    /**
     * Calculate total Canadian NPAs
     */
    calculateCanadaTotalNPAs(): number {
      let total = 0;
      for (const npas of this.canadaProvinces.values()) {
        total += npas.length;
      }
      return total;
    },

    /**
     * Calculate total NPAs for other countries
     */
    calculateOtherCountriesTotalNPAs(): number {
      let total = 0;
      for (const npas of this.otherCountries.values()) {
        total += npas.length;
      }
      return total;
    },

    /**
     * Update all statistics
     */
    updateStats() {
      this.stats.totalNPAs = this.calculateTotalNPAs();
      this.stats.usTotalNPAs = this.calculateUSTotalNPAs();
      this.stats.canadaTotalNPAs = this.calculateCanadaTotalNPAs();
      this.stats.countriesCount = this.otherCountries.size;
    },

    /**
     * Clear all LERG data
     */
    clearLergData() {
      this.usStates.clear();
      this.canadaProvinces.clear();
      this.otherCountries.clear();
      this.isLoaded = false;
      this.error = null;
      this.stats = {
        totalNPAs: 0,
        countriesCount: 0,
        usTotalNPAs: 0,
        canadaTotalNPAs: 0,
        lastUpdated: null,
      };
    },
  },

  getters: {
    /**
     * Get all US states with their NPAs
     */
    getUSStatesWithNPAs: (state): USStateNPAMap => {
      return state.usStates;
    },

    /**
     * Get all Canadian provinces with their NPAs
     */
    getCanadianProvincesWithNPAs: (state): CanadaProvinceNPAMap => {
      return state.canadaProvinces;
    },

    /**
     * Get all other countries with their NPAs
     */
    getOtherCountriesWithNPAs: (state): CountryNPAMap => {
      return state.otherCountries;
    },

    /**
     * Get total count of NPAs across all data
     */
    getTotalNPACount: (state): number => {
      return state.stats.totalNPAs;
    },

    /**
     * Get count of unique countries (excluding US and Canada)
     */
    getCountryCount: (state): number => {
      return state.stats.countriesCount;
    },

    /**
     * Get US state name from code
     */
    getStateNameByCode:
      () =>
      (stateCode: string): string => {
        return STATE_CODES[stateCode]?.name || stateCode;
      },

    /**
     * Get Canadian province name from code
     */
    getProvinceNameByCode:
      () =>
      (provinceCode: string): string => {
        return PROVINCE_CODES[provinceCode]?.name || provinceCode;
      },

    /**
     * Get country name from code
     */
    getCountryNameByCode:
      () =>
      (countryCode: string): string => {
        return COUNTRY_CODES[countryCode]?.name || countryCode;
      },

    /**
     * Check if NPA exists in US states
     */
    isNPAInUSStates:
      (state) =>
      (npa: string): boolean => {
        for (const npas of state.usStates.values()) {
          if (npas.some((entry) => entry.npa === npa)) {
            return true;
          }
        }
        return false;
      },

    /**
     * Check if NPA exists in Canadian provinces
     */
    isNPAInCanadianProvinces:
      (state) =>
      (npa: string): boolean => {
        for (const npas of state.canadaProvinces.values()) {
          if (npas.some((entry) => entry.npa === npa)) {
            return true;
          }
        }
        return false;
      },

    /**
     * Check if NPA exists in other countries
     */
    isNPAInOtherCountries:
      (state) =>
      (npa: string): boolean => {
        for (const npas of state.otherCountries.values()) {
          if (npas.some((entry) => entry.npa === npa)) {
            return true;
          }
        }
        return false;
      },

    /**
     * Check if NPA exists anywhere in data
     */
    isValidNPA:
      (state) =>
      (npa: string): boolean => {
        return (
          // Access other getters directly, not through state.getters
          // Direct implementation instead of calling other getters
          Array.from(state.usStates.values()).some((npas) =>
            npas.some((entry) => entry.npa === npa)
          ) ||
          Array.from(state.canadaProvinces.values()).some((npas) =>
            npas.some((entry) => entry.npa === npa)
          ) ||
          Array.from(state.otherCountries.values()).some((npas) =>
            npas.some((entry) => entry.npa === npa)
          )
        );
      },

    /**
     * Get state/province and country for a given NPA
     */
    getLocationByNPA:
      (state) =>
      (npa: string): { country: string; region: string } | null => {
        // Check US states first
        for (const [stateCode, npas] of state.usStates.entries()) {
          if (npas.some((entry) => entry.npa === npa)) {
            return { country: 'US', region: stateCode };
          }
        }

        // Check Canadian provinces next
        for (const [provinceCode, npas] of state.canadaProvinces.entries()) {
          if (npas.some((entry) => entry.npa === npa)) {
            return { country: 'CA', region: provinceCode };
          }
        }

        // Check other countries
        for (const [countryCode, npas] of state.otherCountries.entries()) {
          if (npas.some((entry) => entry.npa === npa)) {
            return { country: countryCode, region: '' };
          }
        }

        return null;
      },

    /**
     * Format for AdminView: Get all US states in StateWithNPAs format
     */
    getUSStates: (state): StateWithNPAs[] => {
      return Array.from(state.usStates.entries())
        .map(([code, npaEntries]) => ({
          code,
          country: 'US',
          npas: npaEntries.map((entry) => entry.npa).sort(),
        }))
        .sort((a, b) => b.npas.length - a.npas.length);
    },

    /**
     * Format for AdminView: Get all Canadian provinces in StateWithNPAs format
     */
    getCanadianProvinces: (state): StateWithNPAs[] => {
      return Array.from(state.canadaProvinces.entries())
        .map(([code, npaEntries]) => ({
          code,
          country: 'CA',
          npas: npaEntries.map((entry) => entry.npa).sort(),
        }))
        .sort((a, b) => b.npas.length - a.npas.length);
    },

    /**
     * Format for AdminView: Get all other countries data
     */
    getDistinctCountries: (state): CountryLergData[] => {
      return Array.from(state.otherCountries.entries())
        .filter(([country]) => country !== 'US' && country !== 'CA')
        .map(([country, npaEntries]) => ({
          country,
          npaCount: npaEntries.length,
          npas: npaEntries.map((entry) => entry.npa).sort(),
        }))
        .sort((a, b) => b.npaCount - a.npaCount);
    },

    /**
     * Format for AdminView: Get all country data including US and Canada
     */
    getCountryData: (state): CountryLergData[] => {
      const countries: CountryLergData[] = [];

      // Add US data
      if (state.usStates.size > 0) {
        const usNPAs: string[] = [];
        for (const npas of state.usStates.values()) {
          usNPAs.push(...npas.map((entry) => entry.npa));
        }

        countries.push({
          country: 'US',
          npaCount: usNPAs.length,
          npas: usNPAs.sort(),
        });
      }

      // Add CA data
      if (state.canadaProvinces.size > 0) {
        const caNPAs: string[] = [];
        for (const npas of state.canadaProvinces.values()) {
          caNPAs.push(...npas.map((entry) => entry.npa));
        }

        countries.push({
          country: 'CA',
          npaCount: caNPAs.length,
          npas: caNPAs.sort(),
          provinces: Array.from(state.canadaProvinces.entries()).map(([code, npaEntries]) => ({
            code,
            npas: npaEntries.map((entry) => entry.npa).sort(),
          })),
        });
      }

      // Add other countries
      for (const [country, npaEntries] of state.otherCountries.entries()) {
        countries.push({
          country,
          npaCount: npaEntries.length,
          npas: npaEntries.map((entry) => entry.npa).sort(),
        });
      }

      return countries.sort((a, b) => b.npaCount - a.npaCount);
    },

    /**
     * Get total number of US NPAs
     */
    getTotalUSNPAs: (state): number => {
      return state.stats.usTotalNPAs;
    },

    /**
     * Get state information by NPA
     */
    getStateByNpa: (state) => (npa: string) => {
      // Check US states first
      for (const [stateCode, npas] of state.usStates.entries()) {
        if (npas.some((entry) => entry.npa === npa)) {
          return { country: 'US', state: stateCode };
        }
      }

      // Check Canadian provinces next
      for (const [provinceCode, npas] of state.canadaProvinces.entries()) {
        if (npas.some((entry) => entry.npa === npa)) {
          return { country: 'CA', state: provinceCode };
        }
      }

      // Check other countries
      for (const [countryCode, npas] of state.otherCountries.entries()) {
        if (npas.some((entry) => entry.npa === npa)) {
          return { country: countryCode, state: '' };
        }
      }

      return null;
    },

    /**
     * Get country by NPA
     */
    getCountryByNpa: (state) => (npa: string) => {
      // Check US states first
      for (const npas of state.usStates.values()) {
        if (npas.some((entry) => entry.npa === npa)) {
          return 'US';
        }
      }

      // Check Canadian provinces next
      for (const npas of state.canadaProvinces.values()) {
        if (npas.some((entry) => entry.npa === npa)) {
          return 'CA';
        }
      }

      // Check other countries
      for (const [countryCode, npas] of state.otherCountries.entries()) {
        if (npas.some((entry) => entry.npa === npa)) {
          return countryCode;
        }
      }

      return null;
    },

    /**
     * Get NPAs by state/province
     */
    getNpasByState: (state) => (country: string, stateCode: string) => {
      const npas = new Set<string>();

      if (country === 'US') {
        // Get NPAs for US state
        const stateNpas = state.usStates.get(stateCode);
        if (stateNpas) {
          stateNpas.forEach((entry) => npas.add(entry.npa));
        }
      } else if (country === 'CA') {
        // Get NPAs for Canadian province
        const provinceNpas = state.canadaProvinces.get(stateCode);
        if (provinceNpas) {
          provinceNpas.forEach((entry) => npas.add(entry.npa));
        }
      }

      return npas;
    },

    /**
     * Get NPAs by country
     */
    getNpasByCountry: (state) => (countryCode: string) => {
      const npas = new Set<string>();

      if (countryCode === 'US') {
        // Get all NPAs for US
        for (const stateNpas of state.usStates.values()) {
          stateNpas.forEach((entry) => npas.add(entry.npa));
        }
      } else if (countryCode === 'CA') {
        // Get all NPAs for Canada
        for (const provinceNpas of state.canadaProvinces.values()) {
          provinceNpas.forEach((entry) => npas.add(entry.npa));
        }
      } else {
        // Get NPAs for other country
        const countryNpas = state.otherCountries.get(countryCode);
        if (countryNpas) {
          countryNpas.forEach((entry) => npas.add(entry.npa));
        }
      }

      return npas;
    },
  },
});
