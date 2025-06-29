import { DBName } from '@/types/app-types';
import useDexieDB from '@/composables/useDexieDB';
import { useEnhancedLERG, type EnhancedLERGRecord, type NPALocationInfo } from '@/composables/useEnhancedLERG';

/**
 * Enhanced LERG Local Service
 * 
 * Implements local-first architecture by syncing enhanced LERG data 
 * from Supabase to IndexedDB for fast offline lookups.
 * 
 * Key Features:
 * - Sync enhanced LERG data on login
 * - Fast local NPA lookups from IndexedDB
 * - Intelligent fallback to Supabase when needed
 * - Automatic sync management
 */

export interface EnhancedLERGLocalRecord {
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
  // Additional local fields
  synced_at: string;
  last_accessed: string;
}

export interface SyncStatus {
  last_sync: Date | null;
  total_records: number;
  sync_in_progress: boolean;
  last_error: string | null;
}

export class EnhancedLergLocalService {
  private static instance: EnhancedLergLocalService;
  private dexie = useDexieDB();
  private enhancedLerg = useEnhancedLERG();
  private syncStatus: SyncStatus = {
    last_sync: null,
    total_records: 0,
    sync_in_progress: false,
    last_error: null
  };

  // Singleton pattern for service
  public static getInstance(): EnhancedLergLocalService {
    if (!EnhancedLergLocalService.instance) {
      EnhancedLergLocalService.instance = new EnhancedLergLocalService();
    }
    return EnhancedLergLocalService.instance;
  }

  /**
   * Initialize and sync enhanced LERG data to local IndexedDB
   * Called on user login to ensure fresh local data
   */
  async initializeLocalData(): Promise<void> {
    console.log('[EnhancedLergLocal] Initializing local LERG data...');
    
    try {
      // Check if we need to sync (no local data or data is stale)
      const shouldSync = await this.shouldSyncData();
      
      if (shouldSync) {
        await this.syncFromSupabase();
      } else {
        console.log('[EnhancedLergLocal] Local data is fresh, skipping sync');
        await this.updateSyncStatus();
      }
    } catch (error) {
      console.error('[EnhancedLergLocal] Failed to initialize local data:', error);
      this.syncStatus.last_error = error instanceof Error ? error.message : 'Initialization failed';
      throw error;
    }
  }

  /**
   * Sync enhanced LERG data from Supabase to IndexedDB
   */
  async syncFromSupabase(): Promise<void> {
    if (this.syncStatus.sync_in_progress) {
      console.log('[EnhancedLergLocal] Sync already in progress, skipping...');
      return;
    }

    this.syncStatus.sync_in_progress = true;
    this.syncStatus.last_error = null;

    try {
      console.log('[EnhancedLergLocal] Starting sync from Supabase...');
      
      // Load enhanced LERG data from Supabase
      await this.enhancedLerg.loadEnhancedLERGData();
      const supabaseRecords = this.enhancedLerg.allRecords.value;

      if (supabaseRecords.length === 0) {
        throw new Error('No enhanced LERG data received from Supabase');
      }

      // Convert to local format with sync metadata
      const localRecords: EnhancedLERGLocalRecord[] = supabaseRecords.map(record => ({
        ...record,
        synced_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      }));

      // Store in IndexedDB with replace existing data
      await this.dexie.storeInDexieDB(
        localRecords,
        DBName.LERG,
        'enhanced_lerg',
        { replaceExisting: true }
      );

      // Update sync status
      this.syncStatus.last_sync = new Date();
      this.syncStatus.total_records = localRecords.length;
      this.syncStatus.last_error = null;

      console.log(`[EnhancedLergLocal] Sync complete: ${localRecords.length} records stored locally`);

    } catch (error) {
      console.error('[EnhancedLergLocal] Sync failed:', error);
      this.syncStatus.last_error = error instanceof Error ? error.message : 'Sync failed';
      throw error;
    } finally {
      this.syncStatus.sync_in_progress = false;
    }
  }

  /**
   * Fast local NPA lookup from IndexedDB
   * Returns complete geographic information with confidence scoring
   */
  async getNPALocation(npa: string): Promise<NPALocationInfo | null> {
    if (!npa || !/^[0-9]{3}$/.test(npa)) {
      throw new Error('Invalid NPA format - must be 3 digits');
    }

    try {
      // Load all local records (cached by Dexie)
      const localRecords = await this.dexie.loadFromDexieDB<EnhancedLERGLocalRecord>(
        DBName.LERG,
        'enhanced_lerg'
      );

      // Find the NPA
      const record = localRecords.find(r => r.npa === npa);

      if (record) {
        // Update last accessed time
        await this.updateLastAccessed(npa);

        // Convert to NPALocationInfo format
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
          is_active: record.is_active
        };
      }

      // Fallback: Try Supabase if not found locally
      console.log(`[EnhancedLergLocal] NPA ${npa} not found locally, trying Supabase fallback...`);
      return await this.enhancedLerg.getNPALocation(npa);

    } catch (error) {
      console.error(`[EnhancedLergLocal] Error looking up NPA ${npa}:`, error);
      
      // Ultimate fallback: Try Supabase
      try {
        return await this.enhancedLerg.getNPALocation(npa);
      } catch (fallbackError) {
        console.error(`[EnhancedLergLocal] Fallback lookup failed for NPA ${npa}:`, fallbackError);
        throw error; // Throw original error
      }
    }
  }

  /**
   * Get all local LERG records for admin/management purposes
   */
  async getAllLocalRecords(): Promise<EnhancedLERGLocalRecord[]> {
    try {
      return await this.dexie.loadFromDexieDB<EnhancedLERGLocalRecord>(
        DBName.LERG,
        'enhanced_lerg'
      );
    } catch (error) {
      console.error('[EnhancedLergLocal] Error loading all local records:', error);
      return [];
    }
  }

  /**
   * Get local data statistics
   */
  async getLocalStats() {
    try {
      const records = await this.getAllLocalRecords();
      const stats = {
        total: records.length,
        us_domestic: records.filter(r => r.category === 'us-domestic').length,
        canadian: records.filter(r => r.category === 'canadian').length,
        caribbean: records.filter(r => r.category === 'caribbean').length,
        pacific: records.filter(r => r.category === 'pacific').length,
        confidence_breakdown: {
          high: records.filter(r => r.confidence_score >= 0.9).length,
          medium: records.filter(r => r.confidence_score >= 0.7 && r.confidence_score < 0.9).length,
          low: records.filter(r => r.confidence_score < 0.7).length
        },
        oldest_sync: records.length > 0 ? 
          Math.min(...records.map(r => new Date(r.synced_at).getTime())) : null,
        sync_status: this.syncStatus
      };

      return stats;
    } catch (error) {
      console.error('[EnhancedLergLocal] Error getting local stats:', error);
      return null;
    }
  }

  /**
   * Force resync from Supabase (admin function)
   */
  async forceSync(): Promise<void> {
    console.log('[EnhancedLergLocal] Force sync requested...');
    await this.syncFromSupabase();
  }

  /**
   * Clear all local LERG data
   */
  async clearLocalData(): Promise<void> {
    try {
      await this.dexie.deleteTableStore(DBName.LERG, 'enhanced_lerg');
      this.syncStatus = {
        last_sync: null,
        total_records: 0,
        sync_in_progress: false,
        last_error: null
      };
      console.log('[EnhancedLergLocal] Local data cleared');
    } catch (error) {
      console.error('[EnhancedLergLocal] Error clearing local data:', error);
      throw error;
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Private helper methods

  private async shouldSyncData(): Promise<boolean> {
    try {
      const records = await this.getAllLocalRecords();
      
      // No local data
      if (records.length === 0) {
        return true;
      }

      // Data is older than 24 hours
      const oldestSync = Math.min(...records.map(r => new Date(r.synced_at).getTime()));
      const hoursOld = (Date.now() - oldestSync) / (1000 * 60 * 60);
      
      if (hoursOld > 24) {
        console.log(`[EnhancedLergLocal] Local data is ${hoursOld.toFixed(1)} hours old, needs sync`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[EnhancedLergLocal] Error checking sync status:', error);
      return true; // Sync on error to be safe
    }
  }

  private async updateSyncStatus(): Promise<void> {
    const records = await this.getAllLocalRecords();
    this.syncStatus.total_records = records.length;
    if (records.length > 0) {
      const oldestSync = Math.min(...records.map(r => new Date(r.synced_at).getTime()));
      this.syncStatus.last_sync = new Date(oldestSync);
    }
  }

  private async updateLastAccessed(npa: string): Promise<void> {
    // Note: This would require a more complex IndexedDB update
    // For now, we'll skip this optimization but could implement it later
    // to track which NPAs are accessed most frequently
  }
}

// Export singleton instance
export const enhancedLergLocalService = EnhancedLergLocalService.getInstance();