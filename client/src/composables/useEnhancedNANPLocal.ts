import { ref, computed } from 'vue';
import { enhancedLergLocalService, type SyncStatus } from '@/services/enhanced-lerg-local.service';
import type { NPALocationInfo } from '@/composables/useEnhancedLERG';

/**
 * Enhanced NANP Local-First Composable
 * 
 * Provides local-first NANP categorization using IndexedDB for performance.
 * Automatically syncs with Supabase enhanced LERG system.
 * 
 * Key Benefits:
 * - Fast local lookups (no network calls)
 * - Offline capability
 * - Automatic sync management
 * - Intelligent fallback to Supabase
 */

export function useEnhancedNANPLocal() {
  const isInitializing = ref(false);
  const isSyncing = ref(false);
  const error = ref<string | null>(null);
  const syncStatus = ref<SyncStatus | null>(null);
  
  // Local cache for frequently accessed NPAs
  const npaCache = ref<Map<string, NPALocationInfo>>(new Map());
  
  /**
   * Initialize local LERG data (call on app startup/login)
   */
  const initializeLocalData = async (): Promise<void> => {
    if (isInitializing.value) return;
    
    isInitializing.value = true;
    error.value = null;
    
    try {
      console.log('[useEnhancedNANPLocal] Initializing local NANP data...');
      await enhancedLergLocalService.initializeLocalData();
      
      // Update sync status
      syncStatus.value = enhancedLergLocalService.getSyncStatus();
      
      console.log('[useEnhancedNANPLocal] Local NANP data initialized successfully');
    } catch (err) {
      console.error('[useEnhancedNANPLocal] Failed to initialize local data:', err);
      error.value = err instanceof Error ? err.message : 'Failed to initialize local data';
      throw err;
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * Fast local NPA lookup with caching
   */
  const getNPALocation = async (npa: string): Promise<NPALocationInfo | null> => {
    if (!npa || !/^[0-9]{3}$/.test(npa)) {
      throw new Error('Invalid NPA format - must be 3 digits');
    }

    // Check memory cache first
    if (npaCache.value.has(npa)) {
      return npaCache.value.get(npa)!;
    }

    try {
      // Get from local IndexedDB
      const location = await enhancedLergLocalService.getNPALocation(npa);
      
      if (location) {
        // Cache the result
        npaCache.value.set(npa, location);
        return location;
      }
      
      return null;
    } catch (err) {
      console.error(`[useEnhancedNANPLocal] Error looking up NPA ${npa}:`, err);
      throw err;
    }
  };

  /**
   * Categorize NPA with local data (replaces server calls)
   */
  const categorizeNPA = async (npa: string): Promise<{
    category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific' | 'unknown';
    confidence: number;
    location?: string;
    source: 'local' | 'fallback';
  }> => {
    try {
      const location = await getNPALocation(npa);
      
      if (location) {
        return {
          category: location.category,
          confidence: location.confidence_score,
          location: location.display_location,
          source: 'local'
        };
      }
      
      // Fallback categorization for unknown NPAs
      return {
        category: 'unknown',
        confidence: 0,
        source: 'fallback'
      };
    } catch (err) {
      console.error(`[useEnhancedNANPLocal] Error categorizing NPA ${npa}:`, err);
      return {
        category: 'unknown',
        confidence: 0,
        source: 'fallback'
      };
    }
  };

  /**
   * Batch categorize multiple NPAs (optimized for rate sheet processing)
   */
  const categorizeNPAs = async (npas: string[]): Promise<Map<string, {
    category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific' | 'unknown';
    confidence: number;
    location?: string;
    source: 'local' | 'fallback';
  }>> => {
    const results = new Map();
    
    // Process in batches to avoid overwhelming IndexedDB
    const batchSize = 100;
    for (let i = 0; i < npas.length; i += batchSize) {
      const batch = npas.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (npa) => {
        const result = await categorizeNPA(npa);
        return [npa, result] as const;
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(([npa, result]) => {
        results.set(npa, result);
      });
    }
    
    return results;
  };

  /**
   * Force sync from Supabase (admin function)
   */
  const forceSync = async (): Promise<void> => {
    if (isSyncing.value) return;
    
    isSyncing.value = true;
    error.value = null;
    
    try {
      console.log('[useEnhancedNANPLocal] Force sync requested...');
      await enhancedLergLocalService.forceSync();
      
      // Clear cache to force fresh lookups
      npaCache.value.clear();
      
      // Update sync status
      syncStatus.value = enhancedLergLocalService.getSyncStatus();
      
      console.log('[useEnhancedNANPLocal] Force sync completed');
    } catch (err) {
      console.error('[useEnhancedNANPLocal] Force sync failed:', err);
      error.value = err instanceof Error ? err.message : 'Force sync failed';
      throw err;
    } finally {
      isSyncing.value = false;
    }
  };

  /**
   * Get local data statistics
   */
  const getLocalStats = async () => {
    try {
      return await enhancedLergLocalService.getLocalStats();
    } catch (err) {
      console.error('[useEnhancedNANPLocal] Error getting local stats:', err);
      return null;
    }
  };

  /**
   * Clear all local data and cache
   */
  const clearLocalData = async (): Promise<void> => {
    try {
      await enhancedLergLocalService.clearLocalData();
      npaCache.value.clear();
      syncStatus.value = enhancedLergLocalService.getSyncStatus();
      console.log('[useEnhancedNANPLocal] Local data cleared');
    } catch (err) {
      console.error('[useEnhancedNANPLocal] Error clearing local data:', err);
      throw err;
    }
  };

  /**
   * Get current sync status
   */
  const getCurrentSyncStatus = () => {
    return enhancedLergLocalService.getSyncStatus();
  };

  // Computed properties
  const isDataReady = computed(() => {
    return !isInitializing.value && syncStatus.value && syncStatus.value.total_records > 0;
  });

  const needsSync = computed(() => {
    if (!syncStatus.value) return true;
    
    const lastSync = syncStatus.value.last_sync;
    if (!lastSync) return true;
    
    // Consider data stale after 24 hours
    const hoursOld = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursOld > 24;
  });

  const isHealthy = computed(() => {
    return isDataReady.value && !error.value && !needsSync.value;
  });

  return {
    // State
    isInitializing,
    isSyncing,
    error,
    syncStatus,
    
    // Computed
    isDataReady,
    needsSync,
    isHealthy,
    
    // Methods
    initializeLocalData,
    getNPALocation,
    categorizeNPA,
    categorizeNPAs,
    forceSync,
    getLocalStats,
    clearLocalData,
    getCurrentSyncStatus,
  };
}