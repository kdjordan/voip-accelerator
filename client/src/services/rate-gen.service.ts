import Papa from 'papaparse';
import { DBName } from '@/types/app-types';
import { useRateGenStore } from '@/stores/rate-gen-store';
import useDexieDB from '@/composables/useDexieDB';
import type {
  RateGenRecord,
  RateGenColumnMapping,
  ProviderInfo,
  LCRConfig,
  GeneratedRateDeck,
  GeneratedRateRecord,
  InvalidRateGenRow,
  LCRStrategy
} from '@/types/domains/rate-gen-types';

interface RateGenStore {
  setComponentUploading: (componentId: any, isUploading: boolean) => void;
  setUploadProgress: (providerId: string, progress: number) => void;
  setUploadError: (providerId: string, error: string | null) => void;
  addProvider: (provider: ProviderInfo) => void;
  addInvalidRow: (providerId: string, row: InvalidRateGenRow) => void;
  clearInvalidRowsForProvider: (providerId: string) => void;
  removeProvider: (providerId: string) => void;
  setGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setGeneratedDeck: (deck: GeneratedRateDeck) => void;
  addError: (error: string) => void;
  providerList: ProviderInfo[];
}

export class RateGenService {
  private store: RateGenStore;
  private dexieDB = useDexieDB();
  private worker: Worker | null = null;
  private temporaryGeneratedRates: GeneratedRateRecord[] = [];
  private progressTimers: Map<string, number> = new Map(); // Store timer IDs by providerId (browser timers return numbers)

  constructor() {
    this.store = useRateGenStore() as unknown as RateGenStore;
  }

  /**
   * Process provider file following USService patterns
   */
  async processProviderFile(
    file: File,
    providerId: string,
    providerName: string,
    columnMapping: RateGenColumnMapping,
    startLine: number = 1
  ): Promise<void> {
    const performanceStart = performance.now();
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    console.log(`[RateGenService] Starting upload processing for ${fileSizeMB}MB file: ${file.name}`);

    // Check if already uploading
    if (this.store.isComponentUploading && this.store.isComponentUploading(providerId as any)) {
      throw new Error('Upload already in progress for this provider');
    }

    try {
      this.store.setComponentUploading(providerId as any, true);
      this.store.setUploadProgress(providerId, 0);
      this.store.setUploadError(providerId, null);
    } catch (error) {
      console.error('[RateGenService] Error setting initial state:', error);
      throw error;
    }
    
    // Set initial progress to show immediate feedback
    setTimeout(() => {
      this.store.setUploadProgress(providerId, 5);
    }, 100);

    // Clear any previous data for this provider
    await this.removeProviderData(providerId);

    const allProcessedData: RateGenRecord[] = [];
    const invalidRows: InvalidRateGenRow[] = [];
    let totalRecords = 0;
    let totalRows = 0;
    
    // For calculating averages
    let sumInterRate = 0;
    let sumIntraRate = 0;
    let sumIndeterminateRate = 0;

    // Start approximated progress timer
    this.startApproximatedProgress(providerId, fileSizeMB);
    
    return new Promise((resolve, reject) => {
      console.log('[RateGenService] Starting PapaParse streaming...');
      console.log(`[RateGenService] File size: ${fileSizeMB}MB`);
      
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        worker: true,
        step: (results, parser) => {
          totalRows++;

          // Skip header rows based on user input
          if (totalRows < startLine) return;

          try {
            const row = results.data as string[];
            const processedRow = this.transformRow(
              row,
              columnMapping,
              providerId,
              providerName,
              file.name
            );
            
            if (processedRow) {
              allProcessedData.push(processedRow);
              totalRecords++;
              
              // Sum rates for averages
              sumInterRate += processedRow.rateInter;
              sumIntraRate += processedRow.rateIntra;
              sumIndeterminateRate += processedRow.rateIndeterminate;
            } else {
              invalidRows.push({
                rowNumber: totalRows,
                data: row,
                reason: 'Invalid prefix or rate data'
              });
            }

          } catch (error) {
            invalidRows.push({
              rowNumber: totalRows,
              data: results.data as string[],
              reason: `Processing error: ${(error as Error).message}`
            });
          }
        },
        complete: async () => {
          try {
            console.log(`[RateGenService] *** PAPA PARSE COMPLETE *** Processing ${totalRecords} valid records...`);
            
            // Don't clear the timer - let it finish naturally and override with our progress
            // Just make sure we wait for smooth transition
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Store all data using optimized chunks
            await this.storeDataInOptimizedChunks(allProcessedData, providerId, file.name);
            
            console.log('[DEBUG] Data storage completed');
            
            // Store invalid rows
            invalidRows.forEach(row => {
              this.store.addInvalidRow(providerId, row);
            });
            
            // Calculate averages
            const avgInterRate = totalRecords > 0 ? sumInterRate / totalRecords : 0;
            const avgIntraRate = totalRecords > 0 ? sumIntraRate / totalRecords : 0;
            const avgIndeterminateRate = totalRecords > 0 ? sumIndeterminateRate / totalRecords : 0;
            
            // Update store with provider info
            const providerInfo = {
              id: providerId,
              name: providerName,
              fileName: file.name,
              rowCount: totalRecords,
              invalidRowCount: invalidRows.length,
              uploadDate: new Date(),
              avgInterRate: Math.round(avgInterRate * 1000000) / 1000000, // Round to 6 decimal places
              avgIntraRate: Math.round(avgIntraRate * 1000000) / 1000000,
              avgIndeterminateRate: Math.round(avgIndeterminateRate * 1000000) / 1000000
            };
            
            // Complete the process - set progress beyond 100% to show "Processing complete!"
            this.store.setUploadProgress(providerId, 110); // Beyond 100% to indicate true completion
            console.log('[DEBUG] Adding provider info:', providerInfo);
            this.store.addProvider(providerInfo);
            this.store.setComponentUploading(providerId as any, false);
            
            const performanceEnd = performance.now();
            const totalTime = (performanceEnd - performanceStart) / 1000;
            console.log(`[RateGenService] Successfully processed ${totalRecords} records for ${providerName} in ${totalTime.toFixed(2)}s`);
            
            resolve();
            
          } catch (error) {
            console.error('[RateGenService] Error during final processing:', error);
            console.error('[DEBUG] Final processing error details:', {
              name: (error as Error).name,
              message: (error as Error).message,
              stack: (error as Error).stack
            });
            
            // Clear the approximated progress timer on error
            const timer = this.progressTimers.get(providerId);
            if (timer) {
              clearInterval(timer);
              this.progressTimers.delete(providerId);
            }
            
            this.store.setComponentUploading(providerId as any, false);
            this.store.setUploadProgress(providerId, 0);
            this.store.setUploadError(providerId, `Storage error: ${(error as Error).message}`);
            reject(error);
          }
        },
        error: (error) => {
          console.error('[RateGenService] Papa Parse error:', error);
          console.error('[DEBUG] Papa Parse error details:', {
            type: error.type,
            code: error.code,
            message: error.message,
            row: error.row
          });
          
          // Clear the approximated progress timer on error
          const timer = this.progressTimers.get(providerId);
          if (timer) {
            clearInterval(timer);
            this.progressTimers.delete(providerId);
          }
          
          this.store.setComponentUploading(providerId as any, false);
          this.store.setUploadProgress(providerId, 0);
          this.store.setUploadError(providerId, `CSV parsing error: ${error.message}`);
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Transform a CSV row into a RateGenRecord
   */
  private transformRow(
    row: string[],
    columnMapping: RateGenColumnMapping,
    providerId: string, 
    providerName: string,
    fileName: string
  ): RateGenRecord | null {
    // Helper function to get data from row
    const getData = (index: number) => index >= 0 ? (row[index] || '').toString().trim() : '';
    
    // Extract prefix using same logic as existing US service
    let prefix = '';
    const NUMERIC_REGEX = /^\d+$/;
    
    // Check for combined NPANXX first
    if (columnMapping.npanxx !== undefined) {
      const rawNpanxx = getData(columnMapping.npanxx);
      
      // Handle 7-digit NPANXX with leading "1" (same as US service)
      if (rawNpanxx && rawNpanxx.length === 7 && rawNpanxx.startsWith('1') && NUMERIC_REGEX.test(rawNpanxx)) {
        prefix = rawNpanxx.substring(1); // Remove leading '1'
      } else if (rawNpanxx && rawNpanxx.length === 6 && NUMERIC_REGEX.test(rawNpanxx)) {
        prefix = rawNpanxx;
      }
    } 
    // Otherwise, try separate NPA+NXX columns
    else if (columnMapping.npa !== undefined && columnMapping.nxx !== undefined) {
      const rawNpa = getData(columnMapping.npa);
      const rawNxx = getData(columnMapping.nxx);
      
      if (rawNpa && rawNpa.length === 3 && NUMERIC_REGEX.test(rawNpa) && 
          rawNxx && rawNxx.length === 3 && NUMERIC_REGEX.test(rawNxx)) {
        prefix = rawNpa + rawNxx;
      }
    }
    
    // Validate prefix
    if (!prefix || prefix.length !== 6) {
      return null;
    }
    
    // Extract rates
    const rateInter = parseFloat(getData(columnMapping.rateInter)) || 0;
    const rateIntra = parseFloat(getData(columnMapping.rateIntra)) || 0;
    const rateIndeterminate = columnMapping.rateIndeterminate !== undefined 
      ? parseFloat(getData(columnMapping.rateIndeterminate)) || 0
      : rateInter; // Default to interstate if not specified

    // Validate rates
    if (rateInter === 0 && rateIntra === 0) {
      return null;
    }

    return {
      prefix,
      providerId,
      providerName,
      fileName,
      rateInter,
      rateIntra,
      rateIndeterminate,
      uploadDate: new Date()
    };
  }

  /**
   * Start approximated progress timer (like USService)
   */
  private startApproximatedProgress(providerId: string, fileSizeMB: string): void {
    let currentProgress = 5;
    const fileSizeNum = parseFloat(fileSizeMB);
    
    // Estimate total time based on file size (rough approximation)
    const estimatedSeconds = Math.max(3, Math.min(fileSizeNum * 0.5, 15));
    const incrementInterval = 200; // Update every 200ms
    const totalIncrements = (estimatedSeconds * 1000) / incrementInterval;
    const progressIncrement = 85 / totalIncrements; // Go from 5% to 90%
    
    console.log(`[RateGenService] Starting approximated progress timer for ${providerId}:`, {
      fileSizeMB,
      estimatedSeconds,
      progressIncrement,
      totalIncrements
    });
    
    const timer = setInterval(() => {
      currentProgress += progressIncrement;
      console.log(`[RateGenService] Timer tick for ${providerId}: ${currentProgress.toFixed(1)}%`);
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        console.log(`[RateGenService] Timer reached 100% for ${providerId}, clearing timer`);
        clearInterval(timer);
        this.progressTimers.delete(providerId); // Clean up timer reference
      }
      
      try {
        this.store.setUploadProgress(providerId, Math.min(currentProgress, 100));
      } catch (error) {
        console.error(`[RateGenService] Error updating progress for ${providerId}:`, error);
      }
    }, incrementInterval);
    
    // Store timer ID so we can clear it when Papa Parse completes
    this.progressTimers.set(providerId, timer);
  }

  /**
   * Wait for approximated progress to reach minimum threshold
   */
  private async waitForMinimumProgress(providerId: string, minProgress: number): Promise<void> {
    return new Promise((resolve) => {
      const checkProgress = () => {
        // Get current progress from store
        const currentProgress = this.store.getUploadProgress ? this.store.getUploadProgress(providerId) : 0;
        console.log(`[RateGenService] Waiting for progress - current: ${currentProgress}%, target: ${minProgress}%`);
        
        if (currentProgress >= minProgress) {
          console.log(`[RateGenService] Minimum progress ${minProgress}% reached, proceeding with completion`);
          resolve();
        } else {
          // Check again in 100ms
          setTimeout(checkProgress, 100);
        }
      };
      
      checkProgress();
    });
  }

  /**
   * Store data in optimized chunks - revert to working approach
   */
  private async storeDataInOptimizedChunks(
    data: RateGenRecord[], 
    providerId: string, 
    fileName: string
  ): Promise<void> {
    console.log('[DEBUG] Starting optimized chunk storage for', data.length, 'records');
    const OPTIMAL_CHUNK_SIZE = 10000; // Larger chunks for better performance
    const totalChunks = Math.ceil(data.length / OPTIMAL_CHUNK_SIZE);
    const { storeInDexieDB } = this.dexieDB;
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkStart = i * OPTIMAL_CHUNK_SIZE;
      const chunkEnd = Math.min(chunkStart + OPTIMAL_CHUNK_SIZE, data.length);
      const chunk = data.slice(chunkStart, chunkEnd);
      
      try {
        // Use the existing storeInDexieDB which properly handles the database
        await storeInDexieDB(
          chunk,
          DBName.RATE_GEN,
          'providers',
          { 
            replaceExisting: false,
            sourceFile: `${providerId}:${fileName}`
          }
        );
      } catch (error) {
        console.error(`[DEBUG] Storage failed for chunk ${i + 1}:`, error);
        throw error; // Propagate error to handle it properly
      }
      
      // Minimal yield for UI responsiveness
      if (i % 2 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    console.log('[DEBUG] All chunks stored successfully');
  }

  /**
   * Generate rate deck using LCR strategy
   */
  async generateRateDeck(config: LCRConfig): Promise<GeneratedRateDeck> {
    this.store.setGenerationProgress(0);
    this.store.setGenerating(true);

    try {
      // Get all unique prefixes across all providers
      const allPrefixes = await this.getUniquePrefixes();
      const totalPrefixes = allPrefixes.length;
      const generatedRates: GeneratedRateRecord[] = [];

      console.log(`[RateGenService] Starting LCR generation for ${totalPrefixes} prefixes with strategy: ${config.strategy}`);

      // Process in batches for better performance
      const batchSize = 5000;
      for (let i = 0; i < totalPrefixes; i += batchSize) {
        const batchPrefixes = allPrefixes.slice(i, i + batchSize);
        const batchRates = await this.processPrefixBatch(batchPrefixes, config);
        generatedRates.push(...batchRates);
        
        this.store.setGenerationProgress(Math.min((i + batchSize) / totalPrefixes * 100, 100));
      }

      // Create generated deck metadata
      const deck: GeneratedRateDeck = {
        id: `rate-deck-${Date.now()}`,
        name: config.name || `Generated Deck ${new Date().toLocaleString()}`,
        lcrStrategy: config.strategy,
        markupPercentage: config.markupPercentage,
        providerIds: config.providerIds,
        generatedDate: new Date(),
        rowCount: generatedRates.length
      };

      // Store generated rates temporarily for export
      this.temporaryGeneratedRates = generatedRates;
      
      this.store.setGeneratedDeck(deck);
      
      console.log(`[RateGenService] Generated ${generatedRates.length} rates using ${config.strategy} strategy`);
      
      return deck;

    } catch (error) {
      console.error('[RateGenService] Error generating rate deck:', error);
      this.store.addError(`Failed to generate rates: ${(error as Error).message}`);
      throw error;
    } finally {
      this.store.setGenerating(false);
    }
  }

  /**
   * Get unique prefixes across all providers
   */
  private async getUniquePrefixes(): Promise<string[]> {
    const allPrefixes = new Set<string>();
    const { loadFromDexieDB } = this.dexieDB;
    
    // Get all data from IndexedDB
    const allData = await loadFromDexieDB<RateGenRecord>(DBName.RATE_GEN, 'providers');
    
    // Get unique prefixes from all providers
    allData.forEach(record => allPrefixes.add(record.prefix));
    
    return Array.from(allPrefixes);
  }

  /**
   * Process a batch of prefixes with LCR strategy
   */
  private async processPrefixBatch(
    prefixes: string[], 
    config: LCRConfig
  ): Promise<GeneratedRateRecord[]> {
    const results: GeneratedRateRecord[] = [];
    const { loadFromDexieDB } = this.dexieDB;
    
    // Load all data once for this batch
    const allData = await loadFromDexieDB<RateGenRecord>(DBName.RATE_GEN, 'providers');
    
    // Create a map for quick lookup by prefix
    const dataByPrefix = new Map<string, RateGenRecord[]>();
    allData.forEach(record => {
      if (!dataByPrefix.has(record.prefix)) {
        dataByPrefix.set(record.prefix, []);
      }
      dataByPrefix.get(record.prefix)!.push(record);
    });
    
    for (const prefix of prefixes) {
      // Get rates for this prefix from all providers
      const records = dataByPrefix.get(prefix) || [];
      const providerRates: Array<{ rate: number; intraRate: number; indeterminateRate: number; provider: string }> = [];
      
      records.forEach(record => {
        if (config.providerIds.includes(record.providerId)) {
          providerRates.push({
            rate: record.rateInter,
            intraRate: record.rateIntra,
            indeterminateRate: record.rateIndeterminate,
            provider: record.providerName
          });
        }
      });
      
      if (providerRates.length === 0) continue;
      
      // Apply LCR strategy for each rate type
      const selectedInterRate = this.applyLCRStrategy(
        providerRates.map(r => ({ rate: r.rate, provider: r.provider })),
        config.strategy
      );
      
      const selectedIntraRate = this.applyLCRStrategy(
        providerRates.map(r => ({ rate: r.intraRate, provider: r.provider })),
        config.strategy
      );
      
      const selectedIndeterminateRate = this.applyLCRStrategy(
        providerRates.map(r => ({ rate: r.indeterminateRate, provider: r.provider })),
        config.strategy
      );
      
      // Apply markup
      const markupMultiplier = 1 + (config.markupPercentage / 100);
      
      results.push({
        prefix,
        rate: this.applyMarkup(selectedInterRate.rate, markupMultiplier),
        intrastate: this.applyMarkup(selectedIntraRate.rate, markupMultiplier),
        indeterminate: this.applyMarkup(selectedIndeterminateRate.rate, markupMultiplier),
        selectedProvider: selectedInterRate.provider,
        appliedMarkup: config.markupPercentage
      });
    }
    
    return results;
  }

  /**
   * Apply LCR strategy to select rate
   */
  private applyLCRStrategy(
    rates: Array<{ rate: number; provider: string }>,
    strategy: LCRStrategy
  ): { rate: number; provider: string } {
    // Sort rates by value (ascending)
    const sorted = rates
      .filter(r => r.rate > 0)
      .sort((a, b) => a.rate - b.rate);
    
    if (sorted.length === 0) {
      return { rate: 0, provider: 'None' };
    }
    
    switch (strategy) {
      case 'LCR1':
        return sorted[0];
        
      case 'LCR2':
        return sorted[1] || sorted[0];
        
      case 'LCR3':
        return sorted[2] || sorted[1] || sorted[0];
        
      case 'Average':
        const top3 = sorted.slice(0, 3);
        const avgRate = top3.reduce((sum, r) => sum + r.rate, 0) / top3.length;
        return {
          rate: avgRate,
          provider: top3.map(r => r.provider).join(', ')
        };
        
      default:
        return sorted[0];
    }
  }

  /**
   * Apply markup to rate
   */
  private applyMarkup(rate: number, markupMultiplier: number): number {
    // Round to 6 decimal places (typical for telecom rates)
    return Math.round(rate * markupMultiplier * 1000000) / 1000000;
  }

  /**
   * Remove provider data
   */
  async removeProvider(providerId: string): Promise<void> {
    try {
      const { loadFromDexieDB, clearDexieTable } = this.dexieDB;
      
      // Get all data to filter out this provider's records
      const allData = await loadFromDexieDB<RateGenRecord>(DBName.RATE_GEN, 'providers');
      const filteredData = allData.filter(record => record.providerId !== providerId);
      
      // Clear and rebuild table without this provider's data
      await clearDexieTable(DBName.RATE_GEN, 'providers');
      
      if (filteredData.length > 0) {
        const { storeInDexieDB } = this.dexieDB;
        await storeInDexieDB(filteredData, DBName.RATE_GEN, 'providers', { replaceExisting: true });
      }
      
      // Update store
      this.store.removeProvider(providerId);
      
    } catch (error) {
      console.error('[RateGenService] Error removing provider:', error);
      throw new Error('Failed to remove provider data');
    }
  }

  /**
   * Remove all provider data for a specific provider (used during re-upload)
   */
  private async removeProviderData(providerId: string): Promise<void> {
    this.store.clearInvalidRowsForProvider(providerId);
  }

  /**
   * Export rate deck as CSV
   */
  async exportRateDeck(deckId: string, format: 'csv' | 'excel'): Promise<Blob> {
    if (format === 'csv') {
      return this.exportAsCSV(this.temporaryGeneratedRates);
    } else {
      throw new Error('Excel export not yet implemented');
    }
  }

  /**
   * Export generated rates as CSV
   */
  private exportAsCSV(rates: GeneratedRateRecord[]): Blob {
    const csv = Papa.unparse(rates, {
      columns: ['prefix', 'rate', 'intrastate', 'indeterminate', 'selectedProvider', 'appliedMarkup'],
      header: true
    });
    
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    try {
      const { clearDexieTable } = this.dexieDB;
      await clearDexieTable(DBName.RATE_GEN, 'providers');
      
      // Clear store
      this.store.reset();
      
    } catch (error) {
      console.error('[RateGenService] Error clearing data:', error);
      throw new Error('Failed to clear all data');
    }
  }
}