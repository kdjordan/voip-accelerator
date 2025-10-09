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
  LCRStrategy,
  RateGenExportOptions,
  EnhancedGeneratedRate
} from '@/types/domains/rate-gen-types';

import { useLergStoreV2 } from '@/stores/lerg-store-v2';

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
    startLine: number = 1,
    indeterminateDefinition?: string
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
              file.name,
              indeterminateDefinition
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
            const userMessage = this.getUserFriendlyError(error as Error, 'storage');
            this.store.setUploadError(providerId, userMessage);
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
          const userMessage = error.message.includes('Too few fields') 
            ? 'Invalid file format. Please ensure your CSV has the required columns (prefix, rate, provider).'
            : `File parsing error: ${error.message}`;
          this.store.setUploadError(providerId, userMessage);
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
    fileName: string,
    indeterminateDefinition?: string
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

    // Handle indeterminate rate based on user's definition choice (matching US service logic)
    let rateIndeterminate: number;

    if (indeterminateDefinition === 'interstate') {
      // User chose to use interstate rate for indeterminate
      rateIndeterminate = rateInter;
    } else if (indeterminateDefinition === 'intrastate') {
      // User chose to use intrastate rate for indeterminate
      rateIndeterminate = rateIntra;
    } else if (indeterminateDefinition === 'column' && columnMapping.rateIndeterminate !== undefined) {
      // User chose to use the indeterminate column value
      const parsedIndeterm = parseFloat(getData(columnMapping.rateIndeterminate));
      // If empty/invalid, default to interstate rate
      rateIndeterminate = (parsedIndeterm && parsedIndeterm > 0) ? parsedIndeterm : rateInter;
    } else if (columnMapping.rateIndeterminate !== undefined) {
      // Column is mapped but no definition provided - parse and default to interstate if empty
      const parsedIndeterm = parseFloat(getData(columnMapping.rateIndeterminate));
      rateIndeterminate = (parsedIndeterm && parsedIndeterm > 0) ? parsedIndeterm : rateInter;
    } else {
      // No column mapped and no definition - default to interstate
      rateIndeterminate = rateInter;
    }

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
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyError(error: Error, context: 'storage' | 'parse' | 'generate'): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('quota') || message.includes('storage')) {
      return 'Storage limit reached. Please clear some browser data or reduce the file size.';
    }
    
    if (message.includes('network') || message.includes('offline')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (message.includes('permission')) {
      return 'Permission denied. Please check your browser settings.';
    }
    
    if (context === 'storage') {
      return `Unable to save data: ${error.message}`;
    }
    
    if (context === 'parse') {
      return `Invalid file format: ${error.message}`;
    }
    
    return `Operation failed: ${error.message}`;
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
        markupFixed: config.markupFixed,
        providerIds: config.providerIds,
        generatedDate: new Date(),
        effectiveDate: config.effectiveDate,
        rowCount: generatedRates.length
      };

      // Set progress to 100% to trigger "Finalizing" message
      this.store.setGenerationProgress(100);
      
      // Store deck metadata first
      console.log(`[RateGenService] Storing deck metadata...`);
      await this.storeDeckMetadata(deck);
      
      // Store generated rates in IndexedDB and temporarily for export
      console.log(`[RateGenService] Storing ${generatedRates.length} rates to database...`);
      await this.storeGeneratedRates(deck.id, generatedRates);
      this.temporaryGeneratedRates = generatedRates;
      
      this.store.setGeneratedDeck(deck);
      
      console.log(`[RateGenService] Generated ${generatedRates.length} rates using ${config.strategy} strategy`);
      
      // Log sample calculations for validation
      const sampleRates = generatedRates.slice(0, 3);
      console.log('[RateGenService] Sample LCR calculations for validation:', sampleRates.map(r => ({
        prefix: r.prefix,
        strategy: r.debug?.strategy,
        finalRate: r.rate,
        selectedProvider: r.selectedProvider,
        providerInputs: r.debug?.providerRates?.map(p => `${p.provider}: $${p.interRate.toFixed(6)}`),
        selectedRate: r.debug?.selectedRates?.inter,
        markup: r.debug?.appliedMarkup
      })));
      
      // Run validation tests if in development mode
      if (import.meta.env.DEV) {
        this.runLCRValidationTests(config).catch(console.warn);
      }
      
      return deck;

    } catch (error) {
      console.error('[RateGenService] Error generating rate deck:', error);
      const userMessage = (error as Error).message.includes('QuotaExceededError')
        ? 'Not enough storage space. Please clear some browser data or use a smaller dataset.'
        : `Rate generation failed: ${(error as Error).message}`;
      this.store.addError(userMessage);
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
      
      // Apply markup (either percentage or fixed)
      const finalInterRate = this.applyMarkupToRate(selectedInterRate.rate, config);
      const finalIntraRate = this.applyMarkupToRate(selectedIntraRate.rate, config);
      const finalIndeterminateRate = this.applyMarkupToRate(selectedIndeterminateRate.rate, config);
      
      results.push({
        prefix,
        rate: finalInterRate,
        intrastate: finalIntraRate,
        indeterminate: finalIndeterminateRate,
        selectedProvider: selectedInterRate.provider,
        appliedMarkup: config.markupFixed ? config.markupFixed : config.markupPercentage,
        // Debug information for LCR validation
        debug: {
          strategy: config.strategy,
          providerRates: providerRates.map(p => ({ 
            provider: p.provider, 
            interRate: p.rate,
            intraRate: p.intraRate,
            indeterminateRate: p.indeterminateRate
          })),
          selectedRates: {
            inter: { rate: selectedInterRate.rate, provider: selectedInterRate.provider },
            intra: { rate: selectedIntraRate.rate, provider: selectedIntraRate.provider },
            indeterminate: { rate: selectedIndeterminateRate.rate, provider: selectedIndeterminateRate.provider }
          },
          appliedMarkup: {
            type: config.markupFixed ? 'fixed' : 'percentage',
            value: config.markupFixed || config.markupPercentage,
            originalRates: {
              inter: selectedInterRate.rate,
              intra: selectedIntraRate.rate,
              indeterminate: selectedIndeterminateRate.rate
            }
          }
        }
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
        
      case 'LCR4':
        return sorted[3] || sorted[2] || sorted[1] || sorted[0];
        
      case 'LCR5':
        return sorted[4] || sorted[3] || sorted[2] || sorted[1] || sorted[0];

      case 'LCR6':
        return sorted[5] || sorted[4] || sorted[3] || sorted[2] || sorted[1] || sorted[0];

      case 'Average':
        const avgRate = sorted.reduce((sum, r) => sum + r.rate, 0) / sorted.length;
        return {
          rate: avgRate,
          provider: sorted.map(r => r.provider).join(', ')
        };

      default:
        return sorted[0];
    }
  }

  /**
   * Apply markup to rate based on config (percentage or fixed)
   */
  private applyMarkupToRate(rate: number, config: LCRConfig): number {
    let finalRate: number;
    
    if (config.markupFixed && config.markupFixed > 0) {
      // Fixed markup - add the fixed amount
      finalRate = rate + config.markupFixed;
    } else {
      // Percentage markup - multiply by percentage
      finalRate = rate * (1 + config.markupPercentage / 100);
    }
    
    // Round to 6 decimal places (typical for telecom rates)
    return Math.round(finalRate * 1000000) / 1000000;
  }

  /**
   * Apply markup to rate (deprecated - kept for backward compatibility)
   */
  private applyMarkup(rate: number, markupMultiplier: number): number {
    // Round to 6 decimal places (typical for telecom rates)
    return Math.round(rate * markupMultiplier * 1000000) / 1000000;
  }

  /**
   * Store deck metadata in IndexedDB
   */
  private async storeDeckMetadata(deck: GeneratedRateDeck): Promise<void> {
    try {
      const { storeInDexieDB } = this.dexieDB;
      
      // Store deck metadata
      const deckMetadata = {
        id: deck.id,
        name: deck.name,
        strategy: deck.lcrStrategy,
        rowCount: deck.rowCount,
        providerCount: deck.providerIds.length,
        markupType: deck.markupFixed ? 'fixed' : 'percentage',
        markupValue: deck.markupFixed || deck.markupPercentage,
        generatedAt: deck.generatedDate,
        providerNames: this.store.providerList
          .filter(p => deck.providerIds.includes(p.id))
          .map(p => p.name)
          .join(', ')
      };
      
      await storeInDexieDB(
        [deckMetadata],
        DBName.RATE_GEN_DECKS,
        'rate_decks',
        { replaceExisting: false }
      );
      
      console.log(`[RateGenService] Stored deck metadata for ${deck.id}`);
      
    } catch (error) {
      console.error('[RateGenService] Error storing deck metadata:', error);
      throw new Error('Failed to store rate deck metadata');
    }
  }

  /**
   * Store generated rates in IndexedDB
   */
  private async storeGeneratedRates(deckId: string, rates: GeneratedRateRecord[]): Promise<void> {
    try {
      const { storeInDexieDB } = this.dexieDB;
      
      // Transform rates to include deckId and generatedDate
      const ratesWithMetadata = rates.map(rate => ({
        ...rate,
        deckId,
        generatedDate: new Date()
      }));
      
      // Store in chunks for better performance
      const CHUNK_SIZE = 5000;
      const totalChunks = Math.ceil(ratesWithMetadata.length / CHUNK_SIZE);
      console.log(`[RateGenService] Storing rates in ${totalChunks} chunks of ${CHUNK_SIZE} each...`);
      
      for (let i = 0; i < ratesWithMetadata.length; i += CHUNK_SIZE) {
        const chunk = ratesWithMetadata.slice(i, i + CHUNK_SIZE);
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
        console.log(`[RateGenService] Storing chunk ${chunkNumber}/${totalChunks}...`);
        
        await storeInDexieDB(
          chunk,
          DBName.RATE_GEN_RESULTS,
          'generated_rates',
          { replaceExisting: false }
        );
      }
      
      console.log(`[RateGenService] Stored ${rates.length} generated rates for deck ${deckId}`);
      
    } catch (error) {
      console.error('[RateGenService] Error storing generated rates:', error);
      throw new Error('Failed to store generated rates');
    }
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
  /**
   * Export generated rate deck with options
   */
  async exportRateDeck(deckId: string, format: 'csv' | 'excel', options?: RateGenExportOptions): Promise<Blob> {
    console.log(`[RateGenService] Exporting deck ${deckId} as ${format}`);
    
    // Load rates from IndexedDB instead of using temporary storage
    const rates = await this.loadRatesForDeck(deckId);
    
    if (rates.length === 0) {
      throw new Error('No rates found for this deck');
    }
    
    // Get deck metadata for effective date
    const { loadFromDexieDB } = this.dexieDB;
    const decks = await loadFromDexieDB(DBName.RATE_GEN_DECKS, 'rate_decks');
    const deck = decks.find((d: any) => d.id === deckId);
    const effectiveDate = deck?.effectiveDate || deck?.generatedAt || new Date();
    
    console.log(`[RateGenService] Found ${rates.length} rates for export`);
    
    if (format === 'csv') {
      return this.exportAsCSV(rates, options, effectiveDate);
    } else {
      throw new Error('Excel export not yet implemented');
    }
  }

  /**
   * Load rates for a specific deck from IndexedDB
   */
  async loadRatesForDeck(deckId: string): Promise<GeneratedRateRecord[]> {
    try {
      const { loadFromDexieDB } = this.dexieDB;
      const allRates = await loadFromDexieDB(DBName.RATE_GEN_RESULTS, 'generated_rates');
      
      // Filter rates for this specific deck
      const deckRates = allRates.filter((rate: any) => rate.deckId === deckId);
      
      console.log(`[RateGenService] Loaded ${deckRates.length} rates for deck ${deckId}`);
      return deckRates;
    } catch (error) {
      console.error('[RateGenService] Error loading rates:', error);
      throw new Error('Failed to load rates from database');
    }
  }

  /**
   * Enrich rates with geographic data from LERG
   */
  private enrichWithGeographicData(rates: GeneratedRateRecord[]): EnhancedGeneratedRate[] {
    const lergStore = useLergStoreV2();
    
    return rates.map(rate => {
      // Extract NPA from prefix (first 3 digits)
      const npa = rate.prefix?.substring(0, 3);
      
      // O(1) LERG lookup
      const npaInfo = npa ? lergStore.getNPAInfo(npa) : null;
      
      return {
        ...rate,
        npa,
        state: npaInfo?.state_province_name,
        stateCode: npaInfo?.state_province_code,
        country: npaInfo?.country_name || 'United States',
        countryCode: npaInfo?.country_code || 'US',
        region: npaInfo?.region
      };
    });
  }

  /**
   * Filter rates by country if specified in options
   */
  private filterRatesByCountry(rates: EnhancedGeneratedRate[], options: RateGenExportOptions): EnhancedGeneratedRate[] {
    // If no countries are selected for exclusion, return all records
    if (!options.excludeCountries || options.selectedCountries.length === 0) {
      return rates;
    }
    
    // Filter out excluded countries
    return rates.filter(rate => {
      const country = rate.countryCode || 'US';
      return !options.selectedCountries.includes(country);
    });
  }

  /**
   * Export generated rates as CSV with options
   */
  private exportAsCSV(rates: GeneratedRateRecord[], options?: RateGenExportOptions, effectiveDate?: Date): Blob {
    // Enrich with geographic data if needed
    const shouldEnrichGeo = options?.includeStateColumn || options?.includeCountryColumn || options?.includeRegionColumn;
    const enrichedRates = shouldEnrichGeo ? this.enrichWithGeographicData(rates) : rates;
    
    // Filter by country if specified
    const filteredRates = options ? this.filterRatesByCountry(enrichedRates as EnhancedGeneratedRate[], options) : enrichedRates;
    
    // Build headers based on options
    let headers: string[] = [];
    
    // NPANXX format
    if (options?.npanxxFormat === 'split') {
      headers.push('npa', 'nxx');
    } else {
      // Always use 'npanxx' as the header name
      headers.push('npanxx');
    }
    
    // Rate columns - 'rate' is the interstate rate
    headers.push('interstate', 'intrastate', 'indeterminate');
    
    // Always include effective date
    headers.push('effective_date');
    
    // Optional columns
    if (options?.includeProviderColumn) {
      headers.push('selectedProvider');
    }
    if (options?.includeStateColumn) {
      headers.push('state');
    }
    if (options?.includeCountryColumn) {
      headers.push('country');
    }
    if (options?.includeRegionColumn) {
      headers.push('region');
    }
    
    // Transform data for CSV export
    const csvData = filteredRates.map(rate => {
      const row: any = {};
      
      // Handle NPANXX format
      if (options?.npanxxFormat === 'split') {
        const npa = rate.prefix?.substring(0, 3) || '';
        const nxx = rate.prefix?.substring(3, 6) || '';
        row.npa = options?.includeCountryCode ? `1${npa}` : npa;
        row.nxx = nxx;
      } else {
        // Use npanxx as the field name, optionally add country code
        row.npanxx = options?.includeCountryCode ? `1${rate.prefix}` : rate.prefix;
      }
      
      // Rate columns - 'rate' field is the interstate rate
      row.interstate = rate.rate;
      row.intrastate = rate.intrastate;
      row.indeterminate = rate.indeterminate;
      
      // Effective date - format as MM/DD/YYYY
      const dateStr = effectiveDate ? 
        `${(effectiveDate.getMonth() + 1).toString().padStart(2, '0')}/${effectiveDate.getDate().toString().padStart(2, '0')}/${effectiveDate.getFullYear()}` : 
        `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getDate().toString().padStart(2, '0')}/${new Date().getFullYear()}`;
      row.effective_date = dateStr;
      
      // Optional columns
      if (options?.includeProviderColumn) {
        row.selectedProvider = rate.selectedProvider;
      }
      if (options?.includeStateColumn && 'stateCode' in rate) {
        row.state = (rate as EnhancedGeneratedRate).stateCode;
      }
      if (options?.includeCountryColumn && 'countryCode' in rate) {
        row.country = (rate as EnhancedGeneratedRate).countryCode;
      }
      if (options?.includeRegionColumn && 'region' in rate) {
        row.region = (rate as EnhancedGeneratedRate).region;
      }
      
      return row;
    });
    
    const csv = Papa.unparse(csvData, {
      columns: headers,
      header: true
    });
    
    console.log(`[RateGenService] Generated CSV with ${filteredRates.length} rows, ${headers.length} columns`);
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Run LCR validation tests in development mode
   */
  private async runLCRValidationTests(config: LCRConfig): Promise<void> {
    try {
      const { LCR_TEST_CASES, validateTestCase, manualLCRCalculation } = await import('@/utils/lcr-validation-tests');
      
      console.log('[RateGenService] Running LCR validation tests...');
      let passedTests = 0;
      let totalTests = 0;
      
      for (const testCase of LCR_TEST_CASES) {
        // Skip tests that don't match current strategy
        if (testCase.strategy !== config.strategy) continue;
        
        totalTests++;
        const manual = manualLCRCalculation(testCase);
        const validation = validateTestCase(testCase, {
          selectedProvider: manual.selectedProvider,
          selectedRate: manual.selectedRate,
          finalRate: manual.finalRate
        });
        
        if (validation.passed) {
          passedTests++;
          console.log(`✓ ${testCase.name}: PASSED`);
        } else {
          console.warn(`✗ ${testCase.name}: FAILED`, validation.errors);
        }
      }
      
      console.log(`[RateGenService] LCR validation: ${passedTests}/${totalTests} tests passed`);
      
    } catch (error) {
      console.warn('[RateGenService] Could not run LCR validation tests:', error);
    }
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

  /**
   * Get all generated rate decks
   */
  async getAllDecks(): Promise<any[]> {
    try {
      const { loadFromDexieDB } = this.dexieDB;
      const decks = await loadFromDexieDB(DBName.RATE_GEN_DECKS, 'rate_decks');
      return decks.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    } catch (error) {
      console.error('[RateGenService] Error loading decks:', error);
      return [];
    }
  }

  /**
   * Load a specific rate deck
   */
  async loadDeck(deckId: string): Promise<void> {
    try {
      const { loadFromDexieDB } = this.dexieDB;
      
      // Load deck metadata
      const decks = await loadFromDexieDB(DBName.RATE_GEN_DECKS, 'rate_decks');
      const deckMetadata = decks.find((d: any) => d.id === deckId);
      
      if (!deckMetadata) {
        throw new Error('Rate deck not found');
      }
      
      // Load the rates for this deck
      const allRates = await loadFromDexieDB(DBName.RATE_GEN_RESULTS, 'generated_rates');
      const deckRates = allRates.filter((r: any) => r.deckId === deckId);
      
      // Update temporary rates for export
      this.temporaryGeneratedRates = deckRates;
      
      // Create GeneratedRateDeck from metadata
      const deck: GeneratedRateDeck = {
        id: deckMetadata.id,
        name: deckMetadata.name,
        lcrStrategy: deckMetadata.strategy,
        markupPercentage: deckMetadata.markupType === 'percentage' ? deckMetadata.markupValue : 0,
        markupFixed: deckMetadata.markupType === 'fixed' ? deckMetadata.markupValue : 0,
        providerIds: [], // We'll need to store this in metadata if needed
        generatedDate: new Date(deckMetadata.generatedAt),
        rowCount: deckMetadata.rowCount
      };
      
      this.store.setGeneratedDeck(deck);
      
      console.log(`[RateGenService] Loaded deck ${deckId} with ${deckRates.length} rates`);
      
    } catch (error) {
      console.error('[RateGenService] Error loading deck:', error);
      throw new Error('Failed to load rate deck');
    }
  }

  /**
   * Delete a specific rate deck
   */
  async deleteDeck(deckId: string): Promise<void> {
    try {
      const { loadFromDexieDB, clearDexieTable, storeInDexieDB } = this.dexieDB;

      // Delete all rates for this deck
      const allRates = await loadFromDexieDB(DBName.RATE_GEN_RESULTS, 'generated_rates');
      const remainingRates = allRates.filter((rate: any) => rate.deckId !== deckId);

      await clearDexieTable(DBName.RATE_GEN_RESULTS, 'generated_rates');

      if (remainingRates.length > 0) {
        await storeInDexieDB(remainingRates, DBName.RATE_GEN_RESULTS, 'generated_rates', { replaceExisting: false });
      }

      // Delete deck metadata
      const allDecks = await loadFromDexieDB(DBName.RATE_GEN_DECKS, 'rate_decks');
      const remainingDecks = allDecks.filter((deck: any) => deck.id !== deckId);

      await clearDexieTable(DBName.RATE_GEN_DECKS, 'rate_decks');

      if (remainingDecks.length > 0) {
        await storeInDexieDB(remainingDecks, DBName.RATE_GEN_DECKS, 'rate_decks', { replaceExisting: false });
      }

      // Update store
      this.store.removeGeneratedDeck(deckId);

      // If this was the currently loaded deck, clear it
      if (this.store.generatedDeck?.id === deckId) {
        this.store.clearGeneratedDeck();
        this.temporaryGeneratedRates = [];
      }

    } catch (error) {
      console.error('[RateGenService] Error deleting deck:', error);
      throw new Error(`Failed to delete deck: ${(error as Error).message}`);
    }
  }

  /**
   * Clear only provider data, keeping generated decks
   */
  async clearProvidersOnly(): Promise<void> {
    try {
      const { clearDexieTable } = this.dexieDB;
      await clearDexieTable(DBName.RATE_GEN, 'providers');
      
      // Reset provider-related store data but keep generated decks
      this.store.clearAllProviders();
      
    } catch (error) {
      console.error('[RateGenService] Error clearing providers:', error);
      throw new Error('Failed to clear provider data');
    }
  }
}