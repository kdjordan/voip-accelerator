import { ref } from 'vue';
import { supabase } from '@/utils/supabase';

export interface NPARecord {
  npa: string;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific';
  country: string;
  region?: string;
  country_name?: string;
  region_name?: string;
  source?: 'lerg' | 'manual' | 'import';
  created_at?: string;
  updated_at?: string;
}

export interface NPAStats {
  total: number;
  us: number;
  canada: number;
  caribbean: number;
  pacific: number;
  last_updated: string;
}

export function useNANPManagement() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const allNPAs = ref<NPARecord[]>([]);
  const stats = ref<NPAStats | null>(null);
  const isEdgeFunctionAvailable = ref(false);

  const checkEdgeFunctionStatus = async () => {
    try {
      const { data, error: pingError } = await supabase.functions.invoke('ping-status');
      if (pingError) {
        isEdgeFunctionAvailable.value = false;
        return false;
      }
      isEdgeFunctionAvailable.value = data?.status === 'ok';
      return data?.status === 'ok';
    } catch (err) {
      isEdgeFunctionAvailable.value = false;
      return false;
    }
  };

  const loadNPAs = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available');
      }

      // Use existing get-lerg-data function to load NPAs
      const { data, error: loadError } = await supabase.functions.invoke('get-lerg-data');
      
      if (loadError) {
        throw new Error(loadError.message);
      }

      if (data?.data?.length > 0) {
        // Transform LERG data to NPA records
        const npaRecords: NPARecord[] = data.data.map((record: any) => ({
          npa: record.npa,
          category: determineCategory(record.country),
          country: record.country,
          region: record.state,
          country_name: getCountryName(record.country),
          region_name: getRegionName(record.state, record.country),
          source: 'lerg',
          created_at: record.created_at,
          updated_at: record.updated_at
        }));

        allNPAs.value = npaRecords;
        stats.value = calculateStats(npaRecords);
        
        console.log(`[useNANPManagement] Loaded ${npaRecords.length} NPAs from Supabase`);
      } else {
        allNPAs.value = [];
        stats.value = {
          total: 0,
          us: 0,
          canada: 0,
          caribbean: 0,
          pacific: 0,
          last_updated: new Date().toISOString()
        };
      }

    } catch (err) {
      console.error('[useNANPManagement] Error loading NPAs:', err);
      error.value = err instanceof Error ? err.message : 'Failed to load NPA data';
    } finally {
      isLoading.value = false;
    }
  };

  const addNPA = async (npaData: Omit<NPARecord, 'created_at' | 'updated_at'>): Promise<void> => {
    try {
      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available');
      }

      // Use existing add-lerg-record function for single NPA addition
      const { error: addError } = await supabase.functions.invoke('add-lerg-record', {
        body: {
          npa: npaData.npa,
          state: npaData.region || 'XX', // Default region if not provided
          country: npaData.country
        }
      });

      if (addError) {
        throw new Error(addError.message);
      }

      // Refresh data after successful addition
      await loadNPAs();
      
      console.log(`[useNANPManagement] Successfully added NPA ${npaData.npa}`);

    } catch (err) {
      console.error('[useNANPManagement] Error adding NPA:', err);
      throw err;
    }
  };

  const updateNPA = async (npa: string, updateData: Partial<NPARecord>): Promise<void> => {
    try {
      // TODO: Implement update-lerg-record edge function
      throw new Error('Update functionality requires new edge function implementation');
    } catch (err) {
      console.error('[useNANPManagement] Error updating NPA:', err);
      throw err;
    }
  };

  const deleteNPA = async (npa: string): Promise<void> => {
    try {
      // TODO: Implement delete-lerg-record edge function  
      throw new Error('Delete functionality requires new edge function implementation');
    } catch (err) {
      console.error('[useNANPManagement] Error deleting NPA:', err);
      throw err;
    }
  };

  const bulkImportNPAs = async (npaRecords: NPARecord[]): Promise<void> => {
    try {
      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available');
      }

      // Transform to LERG format for existing upload-lerg function
      const lergRecords = npaRecords.map(npa => ({
        npa: npa.npa,
        state: npa.region || 'XX',
        country: npa.country
      }));

      const { error: uploadError } = await supabase.functions.invoke('upload-lerg', {
        body: { records: lergRecords }
      });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Refresh data after successful bulk import
      await loadNPAs();
      
      console.log(`[useNANPManagement] Successfully imported ${npaRecords.length} NPAs`);

    } catch (err) {
      console.error('[useNANPManagement] Error bulk importing NPAs:', err);
      throw err;
    }
  };

  const exportNPAs = (): string => {
    if (allNPAs.value.length === 0) {
      throw new Error('No NPAs to export');
    }

    const headers = ['NPA', 'Category', 'Country', 'Region', 'Country Name', 'Region Name', 'Source'];
    const csvData = [
      headers.join(','),
      ...allNPAs.value.map(npa => [
        npa.npa,
        npa.category,
        npa.country,
        npa.region || '',
        npa.country_name || '',
        npa.region_name || '',
        npa.source || 'lerg'
      ].join(','))
    ].join('\n');

    return csvData;
  };

  // Helper functions
  const determineCategory = (countryCode: string): NPARecord['category'] => {
    switch (countryCode?.toUpperCase()) {
      case 'US':
        return 'us-domestic';
      case 'CA':
        return 'canadian';
      case 'AS': case 'GU': case 'MP':
        return 'pacific';
      default:
        return 'caribbean';
    }
  };

  const getCountryName = (countryCode: string): string => {
    const countryNames: Record<string, string> = {
      'US': 'United States',
      'CA': 'Canada',
      'BS': 'Bahamas',
      'BB': 'Barbados',
      'JM': 'Jamaica',
      'TT': 'Trinidad and Tobago',
      'GU': 'Guam',
      'AS': 'American Samoa',
      'MP': 'Northern Mariana Islands'
    };
    return countryNames[countryCode?.toUpperCase()] || countryCode || 'Unknown';
  };

  const getRegionName = (regionCode: string, countryCode: string): string => {
    if (!regionCode) return '';
    
    // For US states and Canadian provinces, you could add lookup tables here
    // For now, just return the code
    return regionCode;
  };

  const calculateStats = (npas: NPARecord[]): NPAStats => {
    const stats = {
      total: npas.length,
      us: 0,
      canada: 0,
      caribbean: 0,
      pacific: 0,
      last_updated: new Date().toISOString()
    };

    npas.forEach(npa => {
      switch (npa.category) {
        case 'us-domestic':
          stats.us++;
          break;
        case 'canadian':
          stats.canada++;
          break;
        case 'caribbean':
          stats.caribbean++;
          break;
        case 'pacific':
          stats.pacific++;
          break;
      }
    });

    return stats;
  };

  return {
    // State
    isLoading,
    error,
    allNPAs,
    stats,
    isEdgeFunctionAvailable,

    // Methods
    checkEdgeFunctionStatus,
    loadNPAs,
    addNPA,
    updateNPA,
    deleteNPA,
    bulkImportNPAs,
    exportNPAs
  };
}