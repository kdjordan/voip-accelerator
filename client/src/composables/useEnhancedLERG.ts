import { ref, computed } from 'vue';
import { supabase } from '@/utils/supabase';

// Enhanced LERG types matching our new database structure
export interface EnhancedLERGRecord {
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

export interface EnhancedLERGStats {
  total: number;
  us_domestic: number;
  canadian: number;
  caribbean: number;
  pacific: number;
  last_updated: string | null;
  confidence_breakdown: {
    high: number;      // >= 0.9
    medium: number;    // 0.7 - 0.89
    low: number;       // < 0.7
  };
}

export interface NPALocationInfo {
  npa: string;
  country_code: string;
  country_name: string;
  state_province_code: string;
  state_province_name: string;
  region: string | null;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific';
  display_location: string;      // "New York, United States"
  full_location: string;         // "New York, United States (NY, US)"
  confidence_score: number;
  source: string;
  is_active: boolean;
}

export interface AddEnhancedLERGRecordPayload {
  npa: string;
  country_code: string;
  country_name: string;
  state_province_code: string;
  state_province_name: string;
  region?: string;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific';
  source?: 'lerg' | 'manual' | 'import' | 'seed';
  confidence_score?: number;
  notes?: string;
}

export function useEnhancedLERG() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const allRecords = ref<EnhancedLERGRecord[]>([]);
  const stats = ref<EnhancedLERGStats | null>(null);
  const isEdgeFunctionAvailable = ref(false);
  
  // Cache for individual NPA lookups
  const npaLocationCache = ref<Map<string, NPALocationInfo>>(new Map());
  
  /**
   * Check if enhanced edge functions are available
   */
  const checkEnhancedEdgeFunctionStatus = async (): Promise<boolean> => {
    try {
      const { data, error: pingError } = await supabase.functions.invoke('ping-status');
      if (pingError) {
        isEdgeFunctionAvailable.value = false;
        return false;
      }
      isEdgeFunctionAvailable.value = data?.status === 'ok';
      return data?.status === 'ok';
    } catch (err) {
      console.error('[useEnhancedLERG] Error checking edge function status:', err);
      isEdgeFunctionAvailable.value = false;
      return false;
    }
  };

  /**
   * Load all enhanced LERG data with full geographic context
   */
  const loadEnhancedLERGData = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const isAvailable = await checkEnhancedEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Enhanced edge functions are not available');
      }

      console.log('[useEnhancedLERG] Loading enhanced LERG data...');
      const { data, error: loadError } = await supabase.functions.invoke('get-enhanced-lerg-data');
      
      if (loadError) {
        throw new Error(loadError.message);
      }

      if (data?.data) {
        allRecords.value = data.data;
        stats.value = data.stats;
        
        // Clear NPA cache when we load fresh data
        npaLocationCache.value.clear();
        
        console.log(`[useEnhancedLERG] Loaded ${data.data.length} enhanced LERG records`);
        console.log(`[useEnhancedLERG] Stats: ${data.stats.total} total, ${data.stats.us_domestic} US, ${data.stats.canadian} CA`);
      } else {
        allRecords.value = [];
        stats.value = {
          total: 0,
          us_domestic: 0,
          canadian: 0,
          caribbean: 0,
          pacific: 0,
          last_updated: null,
          confidence_breakdown: { high: 0, medium: 0, low: 0 }
        };
      }

    } catch (err) {
      console.error('[useEnhancedLERG] Error loading enhanced LERG data:', err);
      error.value = err instanceof Error ? err.message : 'Failed to load enhanced LERG data';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get location information for a specific NPA (with caching)
   */
  const getNPALocation = async (npa: string): Promise<NPALocationInfo | null> => {
    if (!npa || !/^[0-9]{3}$/.test(npa)) {
      throw new Error('Invalid NPA format - must be 3 digits');
    }

    // Check cache first
    if (npaLocationCache.value.has(npa)) {
      return npaLocationCache.value.get(npa)!;
    }

    try {
      const isAvailable = await checkEnhancedEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Enhanced edge functions are not available');
      }

      const { data, error: lookupError } = await supabase.functions.invoke('get-npa-location', {
        body: { npa }
      });
      
      if (lookupError) {
        throw new Error(lookupError.message);
      }

      if (data?.found && data?.location) {
        // Cache the result
        npaLocationCache.value.set(npa, data.location);
        return data.location;
      } else {
        // NPA not found
        return null;
      }

    } catch (err) {
      console.error(`[useEnhancedLERG] Error looking up NPA ${npa}:`, err);
      throw err;
    }
  };

  /**
   * Add a new enhanced LERG record
   */
  const addEnhancedLERGRecord = async (payload: AddEnhancedLERGRecordPayload): Promise<void> => {
    try {
      const isAvailable = await checkEnhancedEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Enhanced edge functions are not available');
      }

      const { error: addError } = await supabase.functions.invoke('add-enhanced-lerg-record', {
        body: payload
      });

      if (addError) {
        throw new Error(addError.message);
      }

      // Clear cache for this NPA since we just added/updated it
      npaLocationCache.value.delete(payload.npa);
      
      console.log(`[useEnhancedLERG] Successfully added enhanced LERG record for NPA ${payload.npa}`);

    } catch (err) {
      console.error('[useEnhancedLERG] Error adding enhanced LERG record:', err);
      throw err;
    }
  };

  /**
   * Update an existing enhanced LERG record
   */
  const updateEnhancedLERGRecord = async (npa: string, updates: Partial<AddEnhancedLERGRecordPayload>): Promise<void> => {
    try {
      const isAvailable = await checkEnhancedEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Enhanced edge functions are not available');
      }

      const { error: updateError } = await supabase.functions.invoke('update-enhanced-lerg-record', {
        body: { npa, ...updates }
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Clear cache for this NPA since we just updated it
      npaLocationCache.value.delete(npa);
      
      console.log(`[useEnhancedLERG] Successfully updated enhanced LERG record for NPA ${npa}`);

    } catch (err) {
      console.error('[useEnhancedLERG] Error updating enhanced LERG record:', err);
      throw err;
    }
  };

  /**
   * Export enhanced LERG data as CSV
   */
  const exportEnhancedLERGData = (): string => {
    if (allRecords.value.length === 0) {
      throw new Error('No enhanced LERG data to export');
    }

    const headers = [
      'NPA', 'Country Code', 'Country Name', 'State/Province Code', 'State/Province Name', 
      'Region', 'Category', 'Display Location', 'Source', 'Confidence Score', 'Notes'
    ];
    
    const csvData = [
      headers.join(','),
      ...allRecords.value.map(record => [
        record.npa,
        record.country_code,
        `"${record.country_name}"`,
        record.state_province_code,
        `"${record.state_province_name}"`,
        record.region ? `"${record.region}"` : '',
        record.category,
        `"${record.state_province_name}, ${record.country_name}"`,
        record.source,
        record.confidence_score.toString(),
        record.notes ? `"${record.notes}"` : ''
      ].join(','))
    ].join('\n');

    return csvData;
  };

  /**
   * Get records filtered by category
   */
  const getRecordsByCategory = computed(() => {
    return (category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific') => {
      return allRecords.value.filter(record => record.category === category);
    };
  });

  /**
   * Get records by country
   */
  const getRecordsByCountry = computed(() => {
    return (countryCode: string) => {
      return allRecords.value.filter(record => record.country_code === countryCode.toUpperCase());
    };
  });

  /**
   * Search records by NPA, location, or region
   */
  const searchRecords = computed(() => {
    return (searchTerm: string) => {
      if (!searchTerm.trim()) return allRecords.value;
      
      const term = searchTerm.toLowerCase();
      return allRecords.value.filter(record => 
        record.npa.includes(term) ||
        record.country_name.toLowerCase().includes(term) ||
        record.state_province_name.toLowerCase().includes(term) ||
        record.region?.toLowerCase().includes(term) ||
        record.category.toLowerCase().includes(term)
      );
    };
  });

  /**
   * Get data quality summary
   */
  const dataQualitySummary = computed(() => {
    if (!stats.value) return null;
    
    const total = stats.value.total;
    const confidence = stats.value.confidence_breakdown;
    
    return {
      total_records: total,
      high_confidence: {
        count: confidence.high,
        percentage: total > 0 ? Math.round((confidence.high / total) * 100) : 0
      },
      medium_confidence: {
        count: confidence.medium,
        percentage: total > 0 ? Math.round((confidence.medium / total) * 100) : 0
      },
      low_confidence: {
        count: confidence.low,
        percentage: total > 0 ? Math.round((confidence.low / total) * 100) : 0
      }
    };
  });

  return {
    // State
    isLoading,
    error,
    allRecords,
    stats,
    isEdgeFunctionAvailable,
    
    // Computed
    getRecordsByCategory,
    getRecordsByCountry,
    searchRecords,
    dataQualitySummary,
    
    // Methods
    checkEnhancedEdgeFunctionStatus,
    loadEnhancedLERGData,
    getNPALocation,
    addEnhancedLERGRecord,
    updateEnhancedLERGRecord,
    exportEnhancedLERGData,
  };
}