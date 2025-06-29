import { ref, computed } from 'vue';
import { useLergData } from './useLergData';
import { useEnhancedLERG } from './useEnhancedLERG';
import type { AddEnhancedLERGRecordPayload } from './useEnhancedLERG';

/**
 * Enhanced LERG Data Composable
 * 
 * This composable provides a unified interface for LERG operations that:
 * 1. Uses enhanced LERG system when available
 * 2. Falls back to legacy system during transition
 * 3. Provides seamless migration path
 * 4. Maintains compatibility with existing components
 */

export function useEnhancedLergData() {
  // Use both composables
  const legacyLerg = useLergData();
  const enhancedLerg = useEnhancedLERG();
  
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const preferEnhanced = ref(true);

  /**
   * Initialize LERG data from available system
   */
  const initializeLergData = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // Try enhanced system first
      if (preferEnhanced.value) {
        await enhancedLerg.checkEnhancedEdgeFunctionStatus();
        
        if (enhancedLerg.isEdgeFunctionAvailable.value) {
          console.log('[useEnhancedLergData] Initializing with enhanced LERG system');
          await enhancedLerg.loadEnhancedLERGData();
          return;
        }
      }

      // Fall back to legacy system
      console.log('[useEnhancedLergData] Falling back to legacy LERG system');
      await legacyLerg.initializeLergData();

    } catch (err) {
      console.error('[useEnhancedLergData] Error initializing LERG data:', err);
      error.value = err instanceof Error ? err.message : 'Failed to initialize LERG data';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Upload LERG file with enhanced processing when available
   */
  const uploadLerg = async (
    file: File | null,
    options?: { mappings?: Record<string, string>; startLine?: number }
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      // For now, use legacy system for file uploads since enhanced system
      // doesn't yet have bulk upload capabilities
      console.log('[useEnhancedLergData] Using legacy system for file upload');
      const result = await legacyLerg.uploadLerg(file, options);
      
      // After successful legacy upload, refresh enhanced system if available
      if (enhancedLerg.isEdgeFunctionAvailable.value) {
        console.log('[useEnhancedLergData] Refreshing enhanced system after legacy upload');
        try {
          await enhancedLerg.loadEnhancedLERGData();
        } catch (refreshError) {
          console.warn('[useEnhancedLergData] Could not refresh enhanced system:', refreshError);
        }
      }
      
      return result;
    } catch (err) {
      console.error('[useEnhancedLergData] Error uploading LERG file:', err);
      error.value = err instanceof Error ? err.message : 'Failed to upload LERG file';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Add single LERG record with enhanced validation
   */
  const addSingleLergRecord = async (record: {
    npa: string;
    state: string;
    country: string;
  }) => {
    try {
      // Try enhanced system first if available
      if (enhancedLerg.isEdgeFunctionAvailable.value) {
        console.log('[useEnhancedLergData] Adding record via enhanced system');
        
        // Transform legacy format to enhanced format
        const enhancedPayload: AddEnhancedLERGRecordPayload = {
          npa: record.npa,
          country_code: record.country.toUpperCase(),
          country_name: getCountryName(record.country.toUpperCase()),
          state_province_code: record.state.toUpperCase(),
          state_province_name: getStateName(record.state.toUpperCase(), record.country.toUpperCase()),
          category: determineCategory(record.country.toUpperCase()),
          source: 'manual',
          confidence_score: 1.0
        };

        await enhancedLerg.addEnhancedLERGRecord(enhancedPayload);
        
        // Refresh enhanced data
        await enhancedLerg.loadEnhancedLERGData();
        return;
      }

      // Fall back to legacy system
      console.log('[useEnhancedLergData] Adding record via legacy system');
      await legacyLerg.addAndRefreshLergRecord(record);

    } catch (err) {
      console.error('[useEnhancedLergData] Error adding single LERG record:', err);
      throw err;
    }
  };

  /**
   * Check edge function status for both systems
   */
  const checkEdgeFunctionStatus = async () => {
    await Promise.all([
      enhancedLerg.checkEnhancedEdgeFunctionStatus(),
      legacyLerg.checkEdgeFunctionStatus()
    ]);
  };

  /**
   * Clear LERG data from both systems
   */
  const clearLerg = async () => {
    try {
      // Clear from legacy system (which handles the database)
      await legacyLerg.clearLerg();
      
      // Refresh enhanced system if available
      if (enhancedLerg.isEdgeFunctionAvailable.value) {
        await enhancedLerg.loadEnhancedLERGData();
      }
    } catch (err) {
      console.error('[useEnhancedLergData] Error clearing LERG data:', err);
      throw err;
    }
  };

  // Helper functions for transforming legacy to enhanced format
  const getCountryName = (countryCode: string): string => {
    const countryNames: Record<string, string> = {
      'US': 'United States',
      'CA': 'Canada',
      'BS': 'Bahamas',
      'BB': 'Barbados',
      'JM': 'Jamaica',
      'TT': 'Trinidad and Tobago',
      'DO': 'Dominican Republic',
      'PR': 'Puerto Rico',
      'VI': 'U.S. Virgin Islands',
      'GU': 'Guam',
      'AS': 'American Samoa',
      'MP': 'Northern Mariana Islands'
    };
    return countryNames[countryCode] || countryCode;
  };

  const getStateName = (stateCode: string, countryCode: string): string => {
    // This is a simplified version - in practice, you'd use the full STATE_CODES
    // and PROVINCE_CODES mappings from the constants files
    const usStates: Record<string, string> = {
      'NY': 'New York',
      'CA': 'California',
      'TX': 'Texas',
      'FL': 'Florida',
      'IL': 'Illinois'
      // ... more states
    };

    const canadianProvinces: Record<string, string> = {
      'ON': 'Ontario',
      'QC': 'Quebec',
      'BC': 'British Columbia',
      'AB': 'Alberta'
      // ... more provinces
    };

    if (countryCode === 'US') {
      return usStates[stateCode] || stateCode;
    } else if (countryCode === 'CA') {
      return canadianProvinces[stateCode] || stateCode;
    }
    
    return stateCode;
  };

  const determineCategory = (countryCode: string): 'us-domestic' | 'canadian' | 'caribbean' | 'pacific' => {
    switch (countryCode) {
      case 'US':
        return 'us-domestic';
      case 'CA':
        return 'canadian';
      case 'AS':
      case 'GU':
      case 'MP':
        return 'pacific';
      default:
        return 'caribbean';
    }
  };

  return {
    // State (delegate to appropriate system)
    isLoading: computed(() => isLoading.value || (enhancedLerg.isEdgeFunctionAvailable.value ? enhancedLerg.isLoading.value : legacyLerg.isLoading.value)),
    error: computed(() => error.value || (enhancedLerg.isEdgeFunctionAvailable.value ? enhancedLerg.error.value : legacyLerg.error.value)),
    isEdgeFunctionAvailable: computed(() => enhancedLerg.isEdgeFunctionAvailable.value || legacyLerg.isEdgeFunctionAvailable.value),
    
    // Enhanced system availability
    isEnhancedAvailable: enhancedLerg.isEdgeFunctionAvailable,
    isUsingEnhanced: computed(() => enhancedLerg.isEdgeFunctionAvailable.value && preferEnhanced.value),
    
    // Methods
    initializeLergData,
    uploadLerg,
    addSingleLergRecord,
    checkEdgeFunctionStatus,
    clearLerg,
    
    // Legacy method compatibility
    addAndRefreshLergRecord: addSingleLergRecord, // Alias for backward compatibility
    
    // Enhanced system access
    enhancedSystem: enhancedLerg,
    legacySystem: legacyLerg
  };
}