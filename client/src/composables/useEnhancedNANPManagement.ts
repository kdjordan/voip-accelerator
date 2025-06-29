import { ref, computed } from 'vue';
import { useEnhancedLERG } from './useEnhancedLERG';
import { useNANPManagement } from './useNANPManagement';
import type { EnhancedLERGRecord, NPALocationInfo, AddEnhancedLERGRecordPayload } from './useEnhancedLERG';

/**
 * Enhanced NANP Management Composable
 * 
 * This composable provides a unified interface for NANP data management that:
 * 1. Uses the new enhanced LERG system when available
 * 2. Falls back to the old system during transition
 * 3. Provides migration utilities
 * 4. Maintains backward compatibility
 */

export interface UnifiedNPARecord {
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
  is_enhanced: boolean;          // True if from enhanced system
}

export interface UnifiedNANPStats {
  total: number;
  us_domestic: number;
  canadian: number;
  caribbean: number;
  pacific: number;
  last_updated: string | null;
  data_quality: {
    enhanced_records: number;
    legacy_records: number;
    high_confidence: number;
    medium_confidence: number;
    low_confidence: number;
  };
}

export function useEnhancedNANPManagement() {
  // Use both composables
  const enhancedLERG = useEnhancedLERG();
  const legacyNANP = useNANPManagement();
  
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const preferEnhanced = ref(true); // Prefer enhanced system when available
  const allRecords = ref<UnifiedNPARecord[]>([]);
  const stats = ref<UnifiedNANPStats | null>(null);

  /**
   * Check which systems are available
   */
  const systemStatus = computed(() => {
    return {
      enhanced_available: enhancedLERG.isEdgeFunctionAvailable.value,
      legacy_available: legacyNANP.isEdgeFunctionAvailable.value,
      using_enhanced: preferEnhanced.value && enhancedLERG.isEdgeFunctionAvailable.value,
      using_legacy: !preferEnhanced.value || !enhancedLERG.isEdgeFunctionAvailable.value
    };
  });

  /**
   * Transform enhanced LERG record to unified format
   */
  const transformEnhancedRecord = (record: EnhancedLERGRecord): UnifiedNPARecord => {
    return {
      npa: record.npa,
      country_code: record.country_code,
      country_name: record.country_name,
      state_province_code: record.state_province_code,
      state_province_name: record.state_province_name,
      region: record.region,
      category: record.category,
      display_location: `${record.state_province_name}, ${record.country_name}`,
      full_location: `${record.state_province_name}, ${record.country_name} (${record.state_province_code}, ${record.country_code})`,
      confidence_score: record.confidence_score,
      source: record.source,
      is_enhanced: true
    };
  };

  /**
   * Transform legacy NANP record to unified format
   */
  const transformLegacyRecord = (record: any): UnifiedNPARecord => {
    return {
      npa: record.npa,
      country_code: record.country || 'XX',
      country_name: record.country_name || record.country || 'Unknown',
      state_province_code: record.region || record.state || 'XX',
      state_province_name: record.region_name || record.state || 'Unknown',
      region: null,
      category: record.category || 'us-domestic',
      display_location: record.region_name ? `${record.region_name}, ${record.country_name}` : `${record.country || 'Unknown'}`,
      full_location: record.region_name ? `${record.region_name}, ${record.country_name} (${record.region}, ${record.country})` : `${record.country || 'Unknown'}`,
      confidence_score: 0.7, // Lower confidence for legacy data
      source: record.source || 'legacy',
      is_enhanced: false
    };
  };

  /**
   * Load NANP data from available system(s)
   */
  const loadNANPData = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      console.log('[useEnhancedNANPManagement] Loading NANP data...');
      
      // Try enhanced system first if preferred
      if (preferEnhanced.value) {
        try {
          await enhancedLERG.checkEnhancedEdgeFunctionStatus();
          
          if (enhancedLERG.isEdgeFunctionAvailable.value) {
            console.log('[useEnhancedNANPManagement] Using enhanced LERG system');
            await enhancedLERG.loadEnhancedLERGData();
            
            // Transform enhanced records
            allRecords.value = enhancedLERG.allRecords.value.map(transformEnhancedRecord);
            
            // Build unified stats
            if (enhancedLERG.stats.value) {
              stats.value = {
                total: enhancedLERG.stats.value.total,
                us_domestic: enhancedLERG.stats.value.us_domestic,
                canadian: enhancedLERG.stats.value.canadian,
                caribbean: enhancedLERG.stats.value.caribbean,
                pacific: enhancedLERG.stats.value.pacific,
                last_updated: enhancedLERG.stats.value.last_updated,
                data_quality: {
                  enhanced_records: enhancedLERG.stats.value.total,
                  legacy_records: 0,
                  high_confidence: enhancedLERG.stats.value.confidence_breakdown.high,
                  medium_confidence: enhancedLERG.stats.value.confidence_breakdown.medium,
                  low_confidence: enhancedLERG.stats.value.confidence_breakdown.low
                }
              };
            }
            
            console.log(`[useEnhancedNANPManagement] Loaded ${allRecords.value.length} records from enhanced system`);
            return;
          }
        } catch (enhancedError) {
          console.warn('[useEnhancedNANPManagement] Enhanced system failed, falling back to legacy:', enhancedError);
        }
      }

      // Fall back to legacy system
      console.log('[useEnhancedNANPManagement] Using legacy NANP system');
      await legacyNANP.loadNPAs();
      
      // Transform legacy records
      allRecords.value = legacyNANP.allNPAs.value.map(transformLegacyRecord);
      
      // Build unified stats from legacy data
      if (legacyNANP.stats.value) {
        stats.value = {
          total: legacyNANP.stats.value.total,
          us_domestic: legacyNANP.stats.value.us,
          canadian: legacyNANP.stats.value.canada,
          caribbean: legacyNANP.stats.value.caribbean,
          pacific: legacyNANP.stats.value.pacific,
          last_updated: legacyNANP.stats.value.last_updated,
          data_quality: {
            enhanced_records: 0,
            legacy_records: legacyNANP.stats.value.total,
            high_confidence: 0,
            medium_confidence: legacyNANP.stats.value.total,
            low_confidence: 0
          }
        };
      }
      
      console.log(`[useEnhancedNANPManagement] Loaded ${allRecords.value.length} records from legacy system`);

    } catch (err) {
      console.error('[useEnhancedNANPManagement] Error loading NANP data:', err);
      error.value = err instanceof Error ? err.message : 'Failed to load NANP data';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get location for a specific NPA with intelligent fallback
   */
  const getNPALocation = async (npa: string): Promise<NPALocationInfo | null> => {
    try {
      // Try enhanced system first
      if (enhancedLERG.isEdgeFunctionAvailable.value) {
        const enhancedResult = await enhancedLERG.getNPALocation(npa);
        if (enhancedResult) {
          return enhancedResult;
        }
      }

      // Fall back to searching loaded records
      const record = allRecords.value.find(r => r.npa === npa);
      if (record) {
        return {
          npa: record.npa,
          country_code: record.country_code,
          country_name: record.country_name,
          state_province_code: record.state_province_code,
          state_province_name: record.state_province_name,
          region: record.region,
          category: record.category,
          display_location: record.display_location,
          full_location: record.full_location,
          confidence_score: record.confidence_score,
          source: record.source,
          is_active: true
        };
      }

      return null;
    } catch (err) {
      console.error(`[useEnhancedNANPManagement] Error getting NPA location for ${npa}:`, err);
      throw err;
    }
  };

  /**
   * Add new NPA record (prefers enhanced system)
   */
  const addNPARecord = async (payload: AddEnhancedLERGRecordPayload): Promise<void> => {
    try {
      // Try enhanced system first
      if (enhancedLERG.isEdgeFunctionAvailable.value) {
        await enhancedLERG.addEnhancedLERGRecord(payload);
        console.log(`[useEnhancedNANPManagement] Added NPA ${payload.npa} via enhanced system`);
        return;
      }

      // Fall back to legacy system (transform payload)
      const legacyPayload = {
        npa: payload.npa,
        category: payload.category,
        country: payload.country_code,
        region: payload.state_province_code,
        source: payload.source || 'manual'
      };
      
      await legacyNANP.addNPA(legacyPayload);
      console.log(`[useEnhancedNANPManagement] Added NPA ${payload.npa} via legacy system`);

    } catch (err) {
      console.error('[useEnhancedNANPManagement] Error adding NPA record:', err);
      throw err;
    }
  };

  /**
   * Export unified data
   */
  const exportNANPData = (): string => {
    try {
      // Use enhanced export if available
      if (enhancedLERG.isEdgeFunctionAvailable.value && allRecords.value.every(r => r.is_enhanced)) {
        return enhancedLERG.exportEnhancedLERGData();
      }

      // Fall back to legacy export or build our own
      if (allRecords.value.length === 0) {
        throw new Error('No NANP data to export');
      }

      const headers = [
        'NPA', 'Country Code', 'Country Name', 'State/Province Code', 'State/Province Name', 
        'Region', 'Category', 'Display Location', 'Source', 'Confidence Score', 'System'
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
          `"${record.display_location}"`,
          record.source,
          record.confidence_score.toString(),
          record.is_enhanced ? 'enhanced' : 'legacy'
        ].join(','))
      ].join('\n');

      return csvData;
    } catch (err) {
      console.error('[useEnhancedNANPManagement] Export failed:', err);
      throw err;
    }
  };

  /**
   * Migration utility: Check what needs to be migrated
   */
  const getMigrationStatus = computed(() => {
    const enhanced = allRecords.value.filter(r => r.is_enhanced).length;
    const legacy = allRecords.value.filter(r => !r.is_enhanced).length;
    const total = allRecords.value.length;
    
    return {
      total_records: total,
      enhanced_records: enhanced,
      legacy_records: legacy,
      migration_progress: total > 0 ? Math.round((enhanced / total) * 100) : 0,
      needs_migration: legacy > 0,
      is_fully_migrated: legacy === 0 && enhanced > 0
    };
  });

  /**
   * Search unified records
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
   * Filter by category
   */
  const getRecordsByCategory = computed(() => {
    return (category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific') => {
      return allRecords.value.filter(record => record.category === category);
    };
  });

  return {
    // State
    isLoading,
    error,
    allRecords,
    stats,
    systemStatus,
    preferEnhanced,
    
    // Computed
    getMigrationStatus,
    searchRecords,
    getRecordsByCategory,
    
    // Methods
    loadNANPData,
    getNPALocation,
    addNPARecord,
    exportNANPData,
  };
}