import { defineStore } from 'pinia';
import { supabase } from '@/services/supabase.service';

// Enhanced NPA Record type matching Supabase enhanced_lerg table
export interface EnhancedNPARecord {
  npa: string;
  country_code: string;
  country_name: string;
  state_province_code: string;
  state_province_name: string;
  region: string | null;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific';
  source: 'lerg' | 'manual' | 'import' | 'seed';
  confidence_score: number;
  created_at: string;
  updated_at: string;
  notes: string | null;
  is_active: boolean;
}

export interface LergStats {
  total: number;
  us_domestic: number;
  canadian: number;
  caribbean: number;
  pacific: number;
  last_updated: string | null;
  confidence_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
}

interface StateProvince {
  code: string;
  name: string;
  npas: string[];
  count: number;
}

interface CountryData {
  code: string;
  name: string;
  npas: string[];
  count: number;
}

export const useLergStoreV2 = defineStore('lerg-v2', {
  state: () => ({
    allNPAs: [] as EnhancedNPARecord[],
    lastUpdated: null as Date | null,
    isLoaded: false,
    isLoading: false,
    error: null as string | null,
    // Phase 1 Optimization: NPA Index for O(1) lookups
    _npaIndex: null as Map<string, EnhancedNPARecord> | null,
  }),

  getters: {
    // Stats
    stats(): LergStats {
      const initialStats = {
        us_domestic: 0,
        canadian: 0,
        caribbean: 0,
        pacific: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      const calculatedStats = this.allNPAs.reduce((acc, npa) => {
        // Increment category count, checking for valid category keys
        if (npa.category && Object.prototype.hasOwnProperty.call(acc, npa.category)) {
          (acc as any)[npa.category]++;
        }

        // Increment confidence breakdown
        if (npa.confidence_score >= 0.9) {
          acc.high++;
        } else if (npa.confidence_score >= 0.7) {
          acc.medium++;
        } else {
          acc.low++;
        }

        return acc;
      }, initialStats);

      return {
        total: this.allNPAs.length,
        us_domestic: calculatedStats.us_domestic,
        canadian: calculatedStats.canadian,
        caribbean: calculatedStats.caribbean,
        pacific: calculatedStats.pacific,
        last_updated: this.lastUpdated?.toISOString() || null,
        confidence_breakdown: {
          high: calculatedStats.high,
          medium: calculatedStats.medium,
          low: calculatedStats.low,
        },
      };
    },

    // Total counts
    totalNPAs(): number {
      return this.allNPAs.length;
    },

    usTotalNPAs(): number {
      return this.allNPAs.filter((n) => n.country_code === 'US').length;
    },

    canadaTotalNPAs(): number {
      return this.allNPAs.filter((n) => n.country_code === 'CA').length;
    },

    caribbeanTotalNPAs(): number {
      return this.allNPAs.filter((n) => n.category === 'caribbean').length;
    },

    // US States
    getUSStates(): StateProvince[] {
      const grouped = this.allNPAs
        .filter((npa) => npa.country_code === 'US')
        .reduce(
          (acc, npa) => {
            if (!acc[npa.state_province_code]) {
              acc[npa.state_province_code] = {
                code: npa.state_province_code,
                name: npa.state_province_name,
                npas: [],
              };
            }
            acc[npa.state_province_code].npas.push(npa.npa);
            return acc;
          },
          {} as Record<string, { code: string; name: string; npas: string[] }>
        );

      return Object.values(grouped)
        .map((state) => ({
          ...state,
          count: state.npas.length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    // Canadian Provinces
    getCanadianProvinces(): StateProvince[] {
      const grouped = this.allNPAs
        .filter((npa) => npa.country_code === 'CA')
        .reduce(
          (acc, npa) => {
            if (!acc[npa.state_province_code]) {
              acc[npa.state_province_code] = {
                code: npa.state_province_code,
                name: npa.state_province_name,
                npas: [],
              };
            }
            acc[npa.state_province_code].npas.push(npa.npa);
            return acc;
          },
          {} as Record<string, { code: string; name: string; npas: string[] }>
        );

      return Object.values(grouped)
        .map((province) => ({
          ...province,
          count: province.npas.length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    // Other Countries (Caribbean, Pacific, etc.)
    getDistinctCountries(): CountryData[] {
      const grouped = this.allNPAs
        .filter((npa) => npa.country_code !== 'US' && npa.country_code !== 'CA')
        .reduce(
          (acc, npa) => {
            if (!acc[npa.country_code]) {
              acc[npa.country_code] = {
                code: npa.country_code,
                name: npa.country_name,
                npas: [],
              };
            }
            acc[npa.country_code].npas.push(npa.npa);
            return acc;
          },
          {} as Record<string, { code: string; name: string; npas: string[] }>
        );

      return Object.values(grouped)
        .map((country) => ({
          ...country,
          npaCount: country.npas.length, // For compatibility
          count: country.npas.length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    // State NPAs Map (for compatibility)
    stateNPAs(): Record<string, string[]> {
      const map: Record<string, string[]> = {};

      // Add US states
      this.getUSStates.forEach((state) => {
        map[state.code] = state.npas;
      });

      // Add Canadian provinces
      this.getCanadianProvinces.forEach((province) => {
        map[province.code] = province.npas;
      });

      return map;
    },

    // Other countries Map (for compatibility)
    otherCountries(): Map<string, string[]> {
      const map = new Map<string, string[]>();

      this.getDistinctCountries.forEach((country) => {
        map.set(country.code, country.npas);
      });

      return map;
    },

    // LERG data structure (for worker compatibility)
    lergData() {
      return {
        stateNPAs: this.stateNPAs,
        countryData: this.getDistinctCountries.map((country) => ({
          country: country.code,
          npaCount: country.npas.length,
          npas: country.npas,
        })),
      };
    },

    // NPA Lookup - Phase 1 Optimized with O(1) Map lookup
    getNPAInfo: (state) => (npa: string) => {
      // Lazy initialize index for performance
      if (!state._npaIndex) {
        console.log('[LergStoreV2] Initializing NPA index for O(1) lookups...');
        state._npaIndex = new Map(state.allNPAs.map((record) => [record.npa, record]));
        console.log(`[LergStoreV2] NPA index created with ${state._npaIndex.size} entries`);
      }
      return state._npaIndex.get(npa) || null;
    },

    // Phase 1: Add missing optimized method referenced in us.service.ts
    getOptimizedLocationByNPA: (state) => (npa: string) => {
      // Lazy initialize index for performance (same as getNPAInfo)
      if (!state._npaIndex) {
        state._npaIndex = new Map(state.allNPAs.map((record) => [record.npa, record]));
      }
      const record = state._npaIndex.get(npa) || null;
      if (!record) return null;
      return {
        country: record.country_code,
        region: record.state_province_code,
        state: record.state_province_name,
        category: record.category,
        confidence: record.confidence_score,
      };
    },

    // Get NPAs by state/province
    getStateNPAs: (state) => (stateCode: string) => {
      return state.allNPAs
        .filter((npa) => npa.state_province_code === stateCode)
        .map((npa) => npa.npa);
    },

    // Get NPAs by country
    getCountryNPAs: (state) => (countryCode: string) => {
      return state.allNPAs.filter((npa) => npa.country_code === countryCode).map((npa) => npa.npa);
    },

    // Check if data is ready
    isInitialized(): boolean {
      return this.isLoaded && this.allNPAs.length > 0;
    },

    // Get state/province name
    getStateName: (state) => (stateCode: string) => {
      const npa = state.allNPAs.find((n) => n.state_province_code === stateCode);
      return npa?.state_province_name || stateCode;
    },

    // Get country name
    getCountryName: (state) => (countryCode: string) => {
      const npa = state.allNPAs.find((n) => n.country_code === countryCode);
      return npa?.country_name || countryCode;
    },
  },

  actions: {
    async loadFromSupabase() {
      if (this.isLoading) {
        console.log('[LergStoreV2] Already loading, skipping duplicate request');
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        console.log('[LergStoreV2] Loading enhanced LERG data from Supabase...');

        const { data, error } = await supabase.functions.invoke('get-enhanced-lerg-data');

        if (error) {
          throw new Error(error.message || 'Failed to load LERG data');
        }

        if (!data || !data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid data format received from Supabase');
        }

        this.allNPAs = data.data;
        this.lastUpdated = new Date();
        this.isLoaded = true;
        // Phase 1: Clear index cache when data updates
        this._npaIndex = null;

        console.log(`[LergStoreV2] Successfully loaded ${this.allNPAs.length} NPAs`);
        console.log('[LergStoreV2] Category breakdown:', {
          'US Domestic': this.stats.us_domestic,
          Canadian: this.stats.canadian,
          Caribbean: this.stats.caribbean,
          Pacific: this.stats.pacific,
        });
      } catch (err) {
        console.error('[LergStoreV2] Error loading LERG data:', err);
        this.error = err instanceof Error ? err.message : 'Failed to load LERG data';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    // Add a single NPA record (admin function)
    async addNPA(record: Partial<EnhancedNPARecord>) {
      // This will be implemented in the operations composable
      // For now, just add to local state
      const newRecord = {
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as EnhancedNPARecord;

      this.allNPAs.push(newRecord);
      // Phase 1: Clear index cache when data changes
      this._npaIndex = null;
    },

    // Clear all data
    clearData() {
      this.allNPAs = [];
      this.lastUpdated = null;
      this.isLoaded = false;
      this.error = null;
      // Phase 1: Clear index cache
      this._npaIndex = null;
    },

    // Refresh data from Supabase
    async refresh() {
      this.isLoaded = false; // Force reload
      await this.loadFromSupabase();
    },
  },
});
