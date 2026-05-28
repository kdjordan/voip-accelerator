import Papa from 'papaparse';
import { DBName } from '@/types/app-types';
import { useRateGenStore } from '@/stores/rate-gen-store';
import useDexieDB from '@/composables/useDexieDB';
import {
  selectionLabel,
  type RateGenRecord,
  type RateGenColumnMapping,
  type ProviderInfo,
  type LCRConfig,
  type GeneratedRateDeck,
  type InvalidRateGenRow,
  type LCRStrategy,
  type SelectionMode,
  type LeanGeneratedRecord
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

/**
 * Reason recorded for rows rejected at upload because the deck must be fully priced:
 * either the interstate or intrastate rate is missing/zero/negative.
 */
export const INCOMPLETE_RATE_REASON = 'Missing or non-positive interstate/intrastate rate';

/** Reason recorded for rows rejected at upload because the prefix is missing/invalid. */
export const INVALID_PREFIX_REASON = 'Invalid or missing NPANXX prefix';

/**
 * Resolve a record's provider name to the CURRENT store name (so post-upload renames
 * flow into generated output), falling back to the name baked into the record.
 */
export function currentProviderName(
  record: Pick<RateGenRecord, 'providerId' | 'providerName'>,
  namesById: Map<string, string>
): string {
  return namesById.get(record.providerId) ?? record.providerName;
}

/**
 * PURE: pick an output rate + provider attribution from a set of provider rates,
 * at a given DEPTH and MODE. Ignores zero/negative rates (filter first).
 *
 * - `position`: the depth-th cheapest rate (1-indexed) — one winning provider.
 *   This is exactly today's LCR1/2/3 behaviour.
 * - `average`: the mean of the cheapest `depth` rates — provider attribution is
 *   the joined set of contributors (e.g. "Alpha, Bravo").
 *
 * Per-prefix fallback for sparse coverage: depth is clamped to the number of
 * positive rates available, so depth never fails — it degrades to the deepest
 * available (position) / the available subset's mean (average). With depth 1 +
 * average this collapses to LCR1.
 */
export function selectRate(
  rates: Array<{ rate: number; provider: string }>,
  depth: number,
  mode: SelectionMode
): { rate: number; provider: string } {
  const sorted = rates.filter((r) => r.rate > 0).sort((a, b) => a.rate - b.rate);

  if (sorted.length === 0) {
    return { rate: 0, provider: 'None' };
  }

  const effectiveDepth = Math.min(Math.max(1, Math.floor(depth)), sorted.length);

  if (mode === 'average') {
    const top = sorted.slice(0, effectiveDepth);
    const avgRate = top.reduce((sum, r) => sum + r.rate, 0) / top.length;
    return { rate: avgRate, provider: top.map((r) => r.provider).join(', ') };
  }

  // position: the effectiveDepth-th cheapest.
  return sorted[effectiveDepth - 1];
}

/**
 * PURE compat wrapper over {@link selectRate} mapping the legacy LCR strategy
 * enum onto a depth+mode pair (LCRn → depth n position; Average → mean of all).
 * Retained so the legacy enum stays a valid selection input.
 */
export function selectByStrategy(
  rates: Array<{ rate: number; provider: string }>,
  strategy: LCRStrategy
): { rate: number; provider: string } {
  if (strategy === 'Average') {
    // Mean of ALL positive rates — depth is clamped down to the available count.
    return selectRate(rates, Number.MAX_SAFE_INTEGER, 'average');
  }
  const depth = Number(strategy.slice(3)) || 1; // 'LCR3' → 3
  return selectRate(rates, depth, 'position');
}

/**
 * PURE: apply markup to a rate. Fixed markup (additive) takes precedence over
 * percentage when present and > 0. Rounds to 6 decimal places (telecom convention).
 */
export function applyMarkup(rate: number, config: LCRConfig): number {
  const finalRate =
    config.markupFixed && config.markupFixed > 0
      ? rate + config.markupFixed
      : rate * (1 + config.markupPercentage / 100);
  return Math.round(finalRate * 1000000) / 1000000;
}

/**
 * PURE in-memory LCR selection over an arbitrary set of prefixes.
 *
 * Works for any subset — the Simulation sandbox passes a ~5,000-prefix sample;
 * a full generate passes every prefix. Provider data is supplied as an
 * already-built `Map<prefix, RateGenRecord[]>` (loaded once, NOT re-read from
 * IndexedDB per batch). Returns lean records (post-markup rates + the three
 * per-rate-type winner names); the heavy debug block is intentionally dropped.
 */
export function selectLeanRecords(
  prefixes: Iterable<string>,
  dataByPrefix: Map<string, RateGenRecord[]>,
  config: LCRConfig,
  namesById: Map<string, string> = new Map()
): LeanGeneratedRecord[] {
  const allowed = new Set(config.providerIds);
  const appliedMarkup = config.markupFixed ? config.markupFixed : config.markupPercentage;
  const results: LeanGeneratedRecord[] = [];

  for (const prefix of prefixes) {
    const records = dataByPrefix.get(prefix);
    if (!records) continue;

    const inter: Array<{ rate: number; provider: string }> = [];
    const intra: Array<{ rate: number; provider: string }> = [];
    const indet: Array<{ rate: number; provider: string }> = [];

    for (const record of records) {
      if (!allowed.has(record.providerId)) continue;
      const provider = currentProviderName(record, namesById);
      inter.push({ rate: record.rateInter, provider });
      intra.push({ rate: record.rateIntra, provider });
      indet.push({ rate: record.rateIndeterminate, provider });
    }

    if (inter.length === 0) continue;

    const selInter = selectRate(inter, config.depth, config.mode);
    const selIntra = selectRate(intra, config.depth, config.mode);
    const selIndet = selectRate(indet, config.depth, config.mode);

    results.push({
      prefix,
      rate: applyMarkup(selInter.rate, config),
      intrastate: applyMarkup(selIntra.rate, config),
      indeterminate: applyMarkup(selIndet.rate, config),
      interProvider: selInter.provider,
      intraProvider: selIntra.provider,
      indetProvider: selIndet.provider,
      appliedMarkup,
    });
  }

  return results;
}

export class RateGenService {
  private store: RateGenStore;
  private dexieDB = useDexieDB();
  private worker: Worker | null = null;
  // Committed generated decks held IN MEMORY (session-only), keyed by deck id.
  // Generated output is NO LONGER persisted to IndexedDB — provider uploads stay there.
  private generatedDeckRecords: Map<string, LeanGeneratedRecord[]> = new Map();
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

    // Distinct NPAs (first 3 digits) for LERG coverage %
    const distinctNpas = new Set<string>();

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
            
            if (typeof processedRow === 'string') {
              invalidRows.push({
                rowNumber: totalRows,
                data: row,
                reason: processedRow
              });
            } else {
              allProcessedData.push(processedRow);
              totalRecords++;

              // Sum rates for averages
              sumInterRate += processedRow.rateInter;
              sumIntraRate += processedRow.rateIntra;
              sumIndeterminateRate += processedRow.rateIndeterminate;
              distinctNpas.add(processedRow.prefix.slice(0, 3));
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
              avgIndeterminateRate: Math.round(avgIndeterminateRate * 1000000) / 1000000,
              npaCount: distinctNpas.size
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
   * Transform a CSV row into a RateGenRecord.
   * Returns the record on success, or a rejection-reason string when the row is invalid.
   */
  private transformRow(
    row: string[],
    columnMapping: RateGenColumnMapping,
    providerId: string,
    providerName: string,
    fileName: string,
    indeterminateDefinition?: string
  ): RateGenRecord | string {
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
      return INVALID_PREFIX_REASON;
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

    // Validate rates — the deck must be fully priced, so reject any row where
    // either the interstate or intrastate rate is missing, zero, or negative.
    if (rateInter <= 0 || rateIntra <= 0) {
      return INCOMPLETE_RATE_REASON;
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
      // Load provider data from IndexedDB ONCE and build the prefix map ONCE
      // (provider uploads stay in IndexedDB; generated output does NOT get persisted).
      const dataByPrefix = await this.loadProviderDataByPrefix();
      const allPrefixes = Array.from(dataByPrefix.keys());
      const totalPrefixes = allPrefixes.length;

      // Current provider names so post-upload renames flow into generated output.
      const namesById = new Map(this.store.providerList.map(p => [p.id, p.name]));

      console.log(`[RateGenService] Starting in-memory LCR generation for ${totalPrefixes} prefixes with selection: ${selectionLabel(config.depth, config.mode)}`);

      // Pure in-memory selection pass (no IndexedDB writes).
      const leanRecords = selectLeanRecords(allPrefixes, dataByPrefix, config, namesById);

      // Create generated deck metadata
      const deck: GeneratedRateDeck = {
        id: `rate-deck-${Date.now()}`,
        name: config.name || `Generated Deck ${new Date().toLocaleString()}`,
        depth: config.depth,
        mode: config.mode,
        markupPercentage: config.markupPercentage,
        markupFixed: config.markupFixed,
        providerIds: config.providerIds,
        generatedDate: new Date(),
        effectiveDate: config.effectiveDate,
        rowCount: leanRecords.length
      };

      this.store.setGenerationProgress(100);

      // Hold the committed deck's lean records IN MEMORY keyed by deck id.
      this.generatedDeckRecords.set(deck.id, leanRecords);

      this.store.setGeneratedDeck(deck);

      console.log(`[RateGenService] Generated ${leanRecords.length} lean records using ${selectionLabel(config.depth, config.mode)} (in memory, not persisted)`);

      // Log a few sample selections for validation
      console.log('[RateGenService] Sample LCR selections:', leanRecords.slice(0, 3).map(r => ({
        prefix: r.prefix,
        rate: r.rate,
        interProvider: r.interProvider,
        intraProvider: r.intraProvider,
        indetProvider: r.indetProvider,
        appliedMarkup: r.appliedMarkup
      })));

      // Run validation tests if in development mode
      if (import.meta.env.DEV) {
        this.runLCRValidationTests(config).catch(console.warn);
      }

      return deck;

    } catch (error) {
      console.error('[RateGenService] Error generating rate deck:', error);
      const userMessage = `Rate generation failed: ${(error as Error).message}`;
      this.store.addError(userMessage);
      throw error;
    } finally {
      this.store.setGenerating(false);
    }
  }

  /**
   * Load all provider records from IndexedDB ONCE and build a
   * `Map<prefix, RateGenRecord[]>` for in-memory selection. Provider uploads
   * remain the only data persisted in IndexedDB.
   */
  private async loadProviderDataByPrefix(): Promise<Map<string, RateGenRecord[]>> {
    const { loadFromDexieDB } = this.dexieDB;
    const allData = await loadFromDexieDB<RateGenRecord>(DBName.RATE_GEN, 'providers');

    const dataByPrefix = new Map<string, RateGenRecord[]>();
    for (const record of allData) {
      let bucket = dataByPrefix.get(record.prefix);
      if (!bucket) {
        bucket = [];
        dataByPrefix.set(record.prefix, bucket);
      }
      bucket.push(record);
    }
    return dataByPrefix;
  }

  /**
   * Read-only accessor for the Simulation sandbox: load provider uploads from
   * IndexedDB and build the same `Map<prefix, RateGenRecord[]>` that
   * generateRateDeck uses. The prefix universe is `Array.from(map.keys())`.
   * Pass it to selectLeanRecords / singleSourcedCount; does not mutate state.
   */
  async getProviderDataByPrefix(): Promise<Map<string, RateGenRecord[]>> {
    return this.loadProviderDataByPrefix();
  }

  /**
   * Lean records for a committed deck, held in memory for the session.
   * Returns undefined if the deck was never generated this session (e.g. after reload).
   */
  getGeneratedRecords(deckId: string): LeanGeneratedRecord[] | undefined {
    return this.generatedDeckRecords.get(deckId);
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
   * Run LCR validation tests in development mode
   */
  private async runLCRValidationTests(config: LCRConfig): Promise<void> {
    try {
      const { LCR_TEST_CASES, validateTestCase, manualLCRCalculation } = await import('@/utils/lcr-validation-tests');
      
      console.log('[RateGenService] Running LCR validation tests...');
      let passedTests = 0;
      let totalTests = 0;

      // Legacy test cases are keyed by the old strategy enum; map the current
      // depth+mode selection back onto it (position depth n → LCRn; average → Average).
      const legacyStrategy = config.mode === 'average' ? 'Average' : `LCR${config.depth}`;

      for (const testCase of LCR_TEST_CASES) {
        // Skip tests that don't match current selection
        if (testCase.strategy !== legacyStrategy) continue;
        
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
   * Delete a generated deck. Generated decks are session-only (held in memory,
   * never persisted) — deleting just drops the in-memory records and the store
   * metadata. Provider uploads in IndexedDB are untouched.
   */
  async deleteDeck(deckId: string): Promise<void> {
    // Drop the in-memory lean records for this deck (session-only store)
    this.generatedDeckRecords.delete(deckId);

    // Update store
    this.store.removeGeneratedDeck(deckId);

    // If this was the currently loaded deck, clear it
    if (this.store.generatedDeck?.id === deckId) {
      this.store.clearGeneratedDeck();
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