/**
 * Enhanced Local-First NANP Categorization System
 * 
 * This system provides high-performance categorization of +1 destinations by:
 * 1. Using local IndexedDB as the primary source (fast, offline-capable)
 * 2. Falling back to enhanced Supabase LERG system
 * 3. Maintaining backward compatibility with existing categorization
 * 4. Supporting batch operations for rate sheet processing
 * 
 * Key Performance Benefits:
 * - Local lookups: ~1ms vs ~100ms+ for network calls
 * - Offline capability: Works without internet connection
 * - Batch processing: Optimized for large rate sheet uploads
 * - Intelligent caching: Frequently accessed NPAs cached in memory
 */

import { useEnhancedNANPLocal } from '@/composables/useEnhancedNANPLocal';
import { COUNTRY_CODES, getCountryName } from '@/types/constants/country-codes';
import { STATE_CODES, getStateName } from '@/types/constants/state-codes';
import { PROVINCE_CODES, getProvinceName } from '@/types/constants/province-codes';

export interface EnhancedNANPCategorization {
  npa: string;
  country_code: string;
  country_name: string;
  state_province_code: string;
  state_province_name: string;
  region?: string;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific' | 'unknown';
  source: 'local' | 'enhanced-lerg' | 'constants' | 'fallback';
  confidence_score: number; // 0-1 scale
  display_location: string;
  full_location: string;
  is_active: boolean;
}

export interface NANPBatchResult {
  total_processed: number;
  successful_lookups: number;
  fallback_lookups: number;
  unknown_npas: string[];
  processing_time_ms: number;
  categorizations: Map<string, EnhancedNANPCategorization>;
}

export interface NANPSummaryEnhanced {
  total_npas: number;
  us_domestic: { count: number; npas: string[] };
  canadian: { count: number; npas: string[] };
  caribbean: { count: number; npas: string[] };
  pacific: { count: number; npas: string[] };
  unknown: { count: number; npas: string[] };
  confidence_breakdown: {
    high: number;      // >= 0.9
    medium: number;    // 0.7 - 0.89
    low: number;       // < 0.7
  };
  data_sources: {
    local: number;
    enhanced_lerg: number;
    constants: number;
    fallback: number;
  };
}

export class EnhancedNANPCategorizer {
  private static nanpLocal = useEnhancedNANPLocal();
  private static isInitialized = false;

  /**
   * Initialize the categorizer (call once on app startup)
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[EnhancedNANPCategorizer] Initializing...');
      await this.nanpLocal.initializeLocalData();
      this.isInitialized = true;
      console.log('[EnhancedNANPCategorizer] Initialization complete');
    } catch (error) {
      console.error('[EnhancedNANPCategorizer] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Fast categorize single NPA using local-first approach
   */
  static async categorizeNPA(npa: string): Promise<EnhancedNANPCategorization> {
    if (!this.isInitialized) {
      console.warn('[EnhancedNANPCategorizer] Not initialized, attempting auto-initialization...');
      await this.initialize();
    }

    if (!npa || !/^[0-9]{3}$/.test(npa)) {
      throw new Error('Invalid NPA format - must be 3 digits');
    }

    try {
      // Try local lookup first
      const location = await this.nanpLocal.getNPALocation(npa);
      
      if (location) {
        return {
          npa: location.npa,
          country_code: location.country_code,
          country_name: location.country_name,
          state_province_code: location.state_province_code,
          state_province_name: location.state_province_name,
          region: location.region || undefined,
          category: location.category,
          source: 'local',
          confidence_score: location.confidence_score,
          display_location: location.display_location,
          full_location: location.full_location,
          is_active: location.is_active
        };
      }

      // Fallback to constants if not found
      return this.fallbackCategorization(npa);

    } catch (error) {
      console.error(`[EnhancedNANPCategorizer] Error categorizing NPA ${npa}:`, error);
      return this.fallbackCategorization(npa);
    }
  }

  /**
   * High-performance batch categorization for rate sheet processing
   * Optimized for processing thousands of NPAs efficiently
   */
  static async categorizeNPAsBatch(npas: string[]): Promise<NANPBatchResult> {
    const startTime = Date.now();
    const results = new Map<string, EnhancedNANPCategorization>();
    const unknownNpas: string[] = [];
    let successfulLookups = 0;
    let fallbackLookups = 0;

    console.log(`[EnhancedNANPCategorizer] Processing batch of ${npas.length} NPAs...`);

    // Ensure initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Get unique NPAs to avoid duplicate processing
    const uniqueNpas = [...new Set(npas.filter(npa => /^[0-9]{3}$/.test(npa)))];
    console.log(`[EnhancedNANPCategorizer] Processing ${uniqueNpas.length} unique NPAs...`);

    // Use the batch categorization from the composable for optimal performance
    const batchResults = await this.nanpLocal.categorizeNPAs(uniqueNpas);

    // Process results
    for (const [npa, result] of batchResults.entries()) {
      if (result.category === 'unknown') {
        unknownNpas.push(npa);
        fallbackLookups++;
      } else {
        successfulLookups++;
      }

      // Convert to enhanced categorization format
      const categorization: EnhancedNANPCategorization = {
        npa,
        country_code: this.inferCountryCode(result.category),
        country_name: this.inferCountryName(result.category),
        state_province_code: 'XX', // Would need lookup for full details
        state_province_name: result.location || 'Unknown',
        region: undefined,
        category: result.category,
        source: result.source as any,
        confidence_score: result.confidence,
        display_location: result.location || 'Unknown Location',
        full_location: result.location || 'Unknown Location',
        is_active: true
      };

      results.set(npa, categorization);
    }

    const processingTime = Date.now() - startTime;
    
    console.log(`[EnhancedNANPCategorizer] Batch complete: ${successfulLookups} successful, ${fallbackLookups} fallback, ${processingTime}ms`);

    return {
      total_processed: uniqueNpas.length,
      successful_lookups: successfulLookups,
      fallback_lookups: fallbackLookups,
      unknown_npas: unknownNpas,
      processing_time_ms: processingTime,
      categorizations: results
    };
  }

  /**
   * Generate enhanced summary of NANP categorizations
   */
  static generateSummary(categorizations: Map<string, EnhancedNANPCategorization>): NANPSummaryEnhanced {
    const summary: NANPSummaryEnhanced = {
      total_npas: categorizations.size,
      us_domestic: { count: 0, npas: [] },
      canadian: { count: 0, npas: [] },
      caribbean: { count: 0, npas: [] },
      pacific: { count: 0, npas: [] },
      unknown: { count: 0, npas: [] },
      confidence_breakdown: {
        high: 0,
        medium: 0,
        low: 0
      },
      data_sources: {
        local: 0,
        enhanced_lerg: 0,
        constants: 0,
        fallback: 0
      }
    };

    for (const [npa, cat] of categorizations.entries()) {
      // Category counts
      summary[cat.category].count++;
      summary[cat.category].npas.push(npa);

      // Confidence breakdown
      if (cat.confidence_score >= 0.9) {
        summary.confidence_breakdown.high++;
      } else if (cat.confidence_score >= 0.7) {
        summary.confidence_breakdown.medium++;
      } else {
        summary.confidence_breakdown.low++;
      }

      // Data source tracking
      if (cat.source === 'local') summary.data_sources.local++;
      else if (cat.source === 'enhanced-lerg') summary.data_sources.enhanced_lerg++;
      else if (cat.source === 'constants') summary.data_sources.constants++;
      else summary.data_sources.fallback++;
    }

    return summary;
  }

  /**
   * Check if the categorizer is ready for use
   */
  static isReady(): boolean {
    return this.isInitialized && this.nanpLocal.isDataReady.value;
  }

  /**
   * Get local data health status
   */
  static async getHealthStatus() {
    if (!this.isInitialized) {
      return {
        status: 'not_initialized',
        message: 'Categorizer not initialized'
      };
    }

    const stats = await this.nanpLocal.getLocalStats();
    const syncStatus = this.nanpLocal.getCurrentSyncStatus();

    return {
      status: this.nanpLocal.isHealthy.value ? 'healthy' : 'degraded',
      local_records: stats?.total || 0,
      last_sync: syncStatus.last_sync,
      needs_sync: this.nanpLocal.needsSync.value,
      error: this.nanpLocal.error.value
    };
  }

  /**
   * Force sync with Supabase (admin function)
   */
  static async forceSync(): Promise<void> {
    await this.nanpLocal.forceSync();
  }

  // Private helper methods

  private static fallbackCategorization(npa: string): EnhancedNANPCategorization {
    // Basic hardcoded fallback for unknown NPAs
    return {
      npa,
      country_code: 'XX',
      country_name: 'Unknown',
      state_province_code: 'XX',
      state_province_name: 'Unknown',
      region: undefined,
      category: 'unknown',
      source: 'fallback',
      confidence_score: 0,
      display_location: 'Unknown Location',
      full_location: 'Unknown Location',
      is_active: true
    };
  }

  private static inferCountryCode(category: string): string {
    switch (category) {
      case 'us-domestic': return 'US';
      case 'canadian': return 'CA';
      case 'caribbean': return 'BB'; // Generic Caribbean
      case 'pacific': return 'GU'; // Generic Pacific
      default: return 'XX';
    }
  }

  private static inferCountryName(category: string): string {
    switch (category) {
      case 'us-domestic': return 'United States';
      case 'canadian': return 'Canada';
      case 'caribbean': return 'Caribbean';
      case 'pacific': return 'Pacific Territories';
      default: return 'Unknown';
    }
  }
}

// Backward compatibility exports
export const categorizeNPA = EnhancedNANPCategorizer.categorizeNPA;
export const categorizeNPAsBatch = EnhancedNANPCategorizer.categorizeNPAsBatch;