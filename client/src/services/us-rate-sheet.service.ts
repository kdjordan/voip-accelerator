import Papa from 'papaparse';
import { type USRateSheetEntry, type InvalidUsRow } from '@/types/domains/us-types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { DBNameType } from '@/types';
import type { DexieDBBase } from '@/composables/useDexieDB';
import Dexie, { type Table } from 'dexie';
import { useLergStoreV2 } from '@/stores/lerg-store-v2';

// Define the structure for column mapping indices
interface USRateSheetColumnMapping {
  npanxx: number;
  npa: number;
  nxx: number;
  interstate: number;
  intrastate: number;
  indeterminate: number;
}

// Interface for the return type of processFile, now using the imported InvalidUsRow
interface ProcessFileResult {
  recordCount: number;
  invalidRows: InvalidUsRow[]; // Use the imported type from us-types
}

export class USRateSheetService {
  private getDB: (dbName: DBNameType) => Promise<DexieDBBase>;
  private loadFromDexieDB: <T>(dbName: DBNameType, storeName: string) => Promise<T[]>;
  private dbName = DBName.US_RATE_SHEET;
  private storeInDexieDB: <T>(
    data: T[],
    dbName: DBNameType,
    storeName: string,
    options?: { sourceFile?: string; replaceExisting?: boolean }
  ) => Promise<void>;
  private deleteDatabase: (dbName: DBNameType) => Promise<void>;
  private lergStore: ReturnType<typeof useLergStoreV2>;
  
  // Phase 1.1 Performance: Pre-compiled regex patterns
  private static readonly NUMERIC_REGEX = /^[0-9]+$/;
  private static readonly SIMPLE_RATE_REGEX = /^\d+(\.\d+)?$/;

  constructor() {
    // Get required functions from the composable
    const { getDB, loadFromDexieDB, storeInDexieDB, deleteDatabase } = useDexieDB();
    this.getDB = getDB;
    this.loadFromDexieDB = loadFromDexieDB;
    this.storeInDexieDB = storeInDexieDB;
    this.deleteDatabase = deleteDatabase;
    this.lergStore = useLergStoreV2();

    // Ensure LERG data is loaded before proceeding (optional but recommended)
    // Moved check to processFile as LERG might load after constructor

    // REMOVED: Automatic database initialization on service creation
    // this.initializeDatabase().catch((error) => {
    //   console.error('Error initializing US Rate Sheet database:', error);
    // });
  }

  /**
   * Initializes the database
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Get a reference to the database to create it with the proper schema if it doesn't exist
      const db = await this.getDB(this.dbName);
    } catch (error) {
      // Only log the error but don't throw - this allows the service to continue working
      // console.error(
      //   `[USRateSheetService] Error during database initialization (non-fatal):`,
      //   error
      // );
    }
  }

  /**
   * Clears all data from the database by deleting the database itself.
   */
  async clearData(): Promise<void> {
    try {
      await this.deleteDatabase(this.dbName); // Directly call deleteDatabase from the composable
    } catch (error) {
      // console.error(`[USRateSheetService] Error deleting database ${this.dbName}:`, error);
      // Rethrow the error so the store can potentially handle it
      throw error;
    }
  }

  /**
   * Gets the number of records currently stored in the Dexie table.
   */
  async getRecordCount(): Promise<number> {
    try {
      const db = await this.getDB(this.dbName);
      // Ensure table exists before counting, might be better to let it fail if table doesn't exist
      // but for safety, we can add a check or rely on initialization elsewhere
      if (!db.tables.some((t) => t.name === 'entries')) {
        // console.warn(
        //   `[USRateSheetService] Table 'entries' not found in ${this.dbName} during getRecordCount. Returning 0.`
        // );
        return 0;
      }
      const table: Table<USRateSheetEntry, number> = db.table('entries');
      return await table.count();
    } catch (error) {
      // console.error(`[USRateSheetService] Error getting record count for ${this.dbName}:`, error);
      // Return 0 or throw, depending on desired behavior on error
      return 0;
    }
  }

  /**
   * Processes the uploaded US Rate Sheet CSV file, parses it,
   * and stores the standardized data in the Dexie database.
   */
  async processFile(
    file: File,
    columnMapping: USRateSheetColumnMapping,
    startLine: number,
    indeterminateDefinition: string | undefined,
    effectiveDate?: string // Added effectiveDate parameter
  ): Promise<ProcessFileResult> {
    // Phase 1 Performance Timing
    const performanceStart = performance.now();
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    console.log(`[PERF] Phase 1 - Starting upload processing for ${fileSizeMB}MB file...`);

    // --- Add Guard: Ensure LERG data is loaded ---
    if (!this.lergStore.isInitialized) {
      const errorMsg =
        'LERG data is not loaded. Cannot process rate sheet without state information.';
      console.error(`[USRateSheetService] ${errorMsg}`);
      return Promise.reject(new Error(errorMsg));
    }

    // --- Prepare Database ONCE ---
    try {
      // console.log(`[USRateSheetService] Preparing database and clearing existing data...`);
      // Clear existing data using storeInDexieDB unified pattern
      await this.storeInDexieDB([], this.dbName, 'entries', { replaceExisting: true });
      // console.log(`[USRateSheetService] Database prepared and cleared.`);
    } catch (dbError) {
      // console.error('[USRateSheetService] Failed to prepare database:', dbError);
      return Promise.reject(dbError); // Reject if DB setup fails
    }
    // --- End DB Preparation ---

    const invalidRows: InvalidUsRow[] = [];
    let processingBatch: USRateSheetEntry[] = []; // Local batch for this run
    let totalRecords = 0;
    let totalChunks = 0; // Renamed from totalChunks for clarity, represents rows read
    
    // Phase 1.2: Optimize storage strategy
    const BATCH_SIZE = 5000; // Larger batches = fewer storage operations
    const allProcessedData: USRateSheetEntry[] = []; // Store all data in memory first

    return new Promise((resolve, reject) => {
      // Show progress indicators
      let lastProgressUpdate = Date.now();
      const PROGRESS_UPDATE_INTERVAL = 5000; // Update progress every 5 seconds

      // console.log('[USRateSheetService] Starting PapaParse streaming...');
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        worker: true, // Use worker thread for large files
        step: (results, parser) => {
          totalChunks++; // Increment row counter

          // Skip header rows based on user input
          if (totalChunks < startLine) return;

          // Update progress periodically
          const now = Date.now();
          if (now - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL) {
            lastProgressUpdate = now;
            // console.log(`[USRateSheetService] Processing progress: Row ${totalChunks}...`); // Progress log
          }

          try {
            const row = results.data as string[];
            // Process the row and add it to the current batch
            const processRowStartTime = performance.now(); // Use performance.now for better precision
            const processedRow = this.processRow(
              row,
              totalChunks, // Use the actual row number
              columnMapping,
              indeterminateDefinition,
              invalidRows
            );
            const processRowEndTime = performance.now();
            const rowProcessTime = processRowEndTime - processRowStartTime;
            
            // Log slow rows for debugging (Phase 1.1 optimization)
            if (rowProcessTime > 5) { // Lowered threshold to catch more issues
              console.log(`[PERF] Slow row ${totalChunks}: ${rowProcessTime.toFixed(2)}ms`);
            }

            if (processedRow) {
              // Phase 1.2: Store in memory first, write to IndexedDB later
              allProcessedData.push(processedRow);
              totalRecords++; // Increment only for valid, processed rows
              
              // Optional: Show progress for large files
              if (totalRecords % 10000 === 0) {
                console.log(`[PERF] Processed ${totalRecords} records...`);
              }
            }
          } catch (error) {
            // Log error processing a specific row but don't let it stop the stream
            // console.error(`[USRateSheetService] Error processing row ${totalChunks}:`, error);
            invalidRows.push({
              rowIndex: totalChunks,
              npanxx: '-',
              npa: '-',
              nxx: '-',
              interRate: '-',
              intraRate: '-',
              indetermRate: '-',
              reason: `Row processing error: ${(error as Error).message}`,
            });
          }
        },
        complete: async () => {
          console.log(`[PERF] CSV parsing complete. Storing ${allProcessedData.length} records to IndexedDB...`);
          
          // Phase 1.3: Store in optimized chunks for better IndexedDB performance
          if (allProcessedData.length > 0) {
            const storeStartTime = performance.now();
            try {
              await this.storeDataInOptimizedChunks(allProcessedData);
              const storeEndTime = performance.now();
              const storeDuration = (storeEndTime - storeStartTime) / 1000;
              console.log(`[PERF] IndexedDB storage completed in ${storeDuration.toFixed(2)}s for ${allProcessedData.length} records`);
            } catch (storageError) {
              console.error('[PERF] Storage error:', storageError);
              // Could add recovery logic here
            }
          }

          // Phase 1.3 Performance Timing - End
          const performanceEnd = performance.now();
          const duration = (performanceEnd - performanceStart) / 1000;
          const recordsPerSecond = duration > 0 ? Math.round(totalRecords / duration) : 0;
          console.log(`[PERF] Phase 1.3 - Total upload completed in ${duration.toFixed(2)}s`);
          console.log(`[PERF] Phase 1.3 - Processed ${totalRecords} records at ${recordsPerSecond} records/sec`);
          
          // console.log(`[USRateSheetService] Processing finished. Valid records processed: ${totalRecords}, Invalid/Skipped rows logged: ${invalidRows.length}`);
          // Resolve the promise with the results
          resolve({
            recordCount: totalRecords, // Use the count of successfully processed rows
            invalidRows: invalidRows.slice(0, 100), // Increased limit slightly
          });
        },
        error: (error: Error) => {
          // Phase 1 Performance Timing - Error case
          const performanceEnd = performance.now();
          const duration = (performanceEnd - performanceStart) / 1000;
          console.log(`[PERF] Phase 1 - Upload failed after ${duration.toFixed(2)}s`);
          
          // console.error('[USRateSheetService] PapaParse Streaming Error:', error);
          reject(new Error(`Failed to parse CSV file: ${error.message}`));
        },
      });
    });
  }

  // Process a single row of data
  private processRow(
    row: string[],
    rowIndex: number,
    columnMapping: USRateSheetColumnMapping,
    indeterminateDefinition: string | undefined,
    invalidRows: InvalidUsRow[] // This now expects the imported type
  ): USRateSheetEntry | null {
    // Helper function to safely get data from row using index
    const getData = (index: number): string | undefined => {
      return row && row.length > index ? row[index]?.trim() : undefined;
    };

    // Extract data using mapping
    const rawNpanxx = getData(columnMapping.npanxx);
    const rawNpa = getData(columnMapping.npa);
    const rawNxx = getData(columnMapping.nxx);
    const rawInterstate = getData(columnMapping.interstate);
    const rawIntrastate = getData(columnMapping.intrastate);
    const rawIndeterminate = getData(columnMapping.indeterminate);

    let npanxx: string | undefined;
    let npa: string | undefined;
    let nxx: string | undefined;

    // Validate and determine NPANXX, NPA, NXX
    if (
      rawNpanxx &&
      rawNpanxx.length === 7 &&
      rawNpanxx.startsWith('1') &&
      USRateSheetService.NUMERIC_REGEX.test(rawNpanxx)
    ) {
      npanxx = rawNpanxx.substring(1); // Remove leading '1'
      npa = npanxx.substring(0, 3);
      nxx = npanxx.substring(3, 6);
    } else if (rawNpanxx && rawNpanxx.length === 6 && USRateSheetService.NUMERIC_REGEX.test(rawNpanxx)) {
      npanxx = rawNpanxx;
      npa = rawNpanxx.substring(0, 3);
      nxx = rawNpanxx.substring(3, 6);
    } else if (
      rawNpa &&
      rawNpa.length === 3 &&
      USRateSheetService.NUMERIC_REGEX.test(rawNpa) &&
      rawNxx &&
      rawNxx.length === 3 &&
      USRateSheetService.NUMERIC_REGEX.test(rawNxx)
    ) {
      npanxx = rawNpa + rawNxx;
      npa = rawNpa;
      nxx = rawNxx;
    } else {
      // Add to invalid rows if NPANXX/NPA+NXX is missing or invalid
      invalidRows.push({
        rowIndex,
        npanxx: rawNpanxx ?? '-', // Use raw or placeholder
        npa: rawNpa ?? '-',
        nxx: rawNxx ?? '-',
        interRate: rawInterstate ?? '-',
        intraRate: rawIntrastate ?? '-',
        indetermRate: rawIndeterminate ?? '-',
        reason: 'Invalid or missing NPANXX/NPA+NXX format',
      });
      return null;
    }

    // Helper to parse rates - Phase 1.1 optimized for performance
    const parseRate = (rateStr: string | undefined): number | null => {
      // Fast path for common empty cases
      if (!rateStr || rateStr === '' || rateStr === 'null' || rateStr === '-') return 0;
      
      // Fast path for simple numbers (avoid parseFloat when possible)
      if (USRateSheetService.SIMPLE_RATE_REGEX.test(rateStr)) {
        const num = Number(rateStr);
        return num >= 0 ? num : null;
      }
      
      // Fallback to parseFloat for edge cases
      const num = parseFloat(rateStr);
      return !isNaN(num) && num >= 0 ? num : null;
    };

    const interRate = parseRate(rawInterstate);
    const intraRate = parseRate(rawIntrastate);
    let indetermRate: number | null = null;

    // Handle indeterminate rate based on definition
    if (indeterminateDefinition === 'intrastate') {
      // Use the already parsed and validated intraRate
      indetermRate = intraRate;
    } else if (indeterminateDefinition === 'interstate') {
      // Use the already parsed and validated interRate
      indetermRate = interRate;
    } else if (indeterminateDefinition === 'column') {
      // Use the value from the column mapped as Indeterminate
      indetermRate = parseRate(rawIndeterminate);
    } else {
      // Default: If definition is unexpected or column parsing failed, default to 0
      indetermRate = 0;
    }

    // Final null check after applying definition logic (especially for 'column' case)
    if (indetermRate === null) {
      indetermRate = 0; // Ensure it defaults to 0 if parseRate failed for the 'column' case
    }

    // Check if essential rates are valid numbers (inter/intra are needed regardless of indeterm definition)
    if (interRate === null || intraRate === null) {
      // Add to invalid rows if inter or intra rate is invalid
      invalidRows.push({
        rowIndex,
        npanxx: npanxx, // NPANXX is valid here
        npa: npa, // NPA is valid here
        nxx: nxx, // NXX is valid here
        interRate: rawInterstate ?? '-', // Show raw invalid value
        intraRate: rawIntrastate ?? '-', // Show raw invalid value
        indetermRate: rawIndeterminate ?? '-', // Show raw invalid value
        reason: 'Invalid rate format (non-numeric or negative)',
      });
      return null;
    }

    // Get state code from LergStore using the new simplified getter
    const npaInfo = this.lergStore.getNPAInfo(npa);
    const stateCode = npaInfo?.state_province_code || 'N/A';

    // Return the standardized entry
    // Removed the 'id' property as we assume auto-incrementing primary key '++id'
    return {
      npa,
      nxx,
      npanxx,
      interRate,
      intraRate,
      indetermRate, // Use the processed indetermRate
      stateCode,
    };
  }

  /**
   * Loads ALL USRateSheetEntry data from the database.
   * Note: This might load a large amount of data. Use cautiously.
   */
  async getData(): Promise<USRateSheetEntry[]> {
    // console.warn(
    //   `[USRateSheetService] Attempting to load ALL data from ${this.dbName}/'entries'. This could be memory intensive.`
    // );
    try {
      // Load data from the correct 'entries' table
      const data = await this.loadFromDexieDB<USRateSheetEntry>(this.dbName, 'entries');
      return data;
    } catch (error) {
      // console.error(
      //   `[USRateSheetService] Error loading data from ${this.dbName}/'entries':`,
      //   error
      // );
      return []; // Return empty array on error
    }
  }

  /**
   * Phase 1.3: Store data in optimized chunks for better IndexedDB performance
   */
  private async storeDataInOptimizedChunks(data: USRateSheetEntry[]): Promise<void> {
    const OPTIMAL_CHUNK_SIZE = 2500; // Sweet spot for IndexedDB performance
    const chunks = [];
    
    // Split data into chunks
    for (let i = 0; i < data.length; i += OPTIMAL_CHUNK_SIZE) {
      chunks.push(data.slice(i, i + OPTIMAL_CHUNK_SIZE));
    }
    
    console.log(`[PERF] Storing ${data.length} records in ${chunks.length} chunks of ${OPTIMAL_CHUNK_SIZE}`);
    
    // Store chunks with minimal delay between operations
    for (let i = 0; i < chunks.length; i++) {
      const chunkStartTime = performance.now();
      
      try {
        await this.storeInDexieDB(chunks[i], this.dbName, 'entries', { replaceExisting: i === 0 });
        
        const chunkEndTime = performance.now();
        const chunkDuration = chunkEndTime - chunkStartTime;
        
        // Only log slow chunks
        if (chunkDuration > 500) {
          console.log(`[PERF] Chunk ${i + 1}/${chunks.length}: ${chunkDuration.toFixed(2)}ms for ${chunks[i].length} records`);
        }
        
        // Small yield to prevent blocking UI (every 4 chunks)
        if (i % 4 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        
      } catch (error) {
        console.error(`[PERF] Error storing chunk ${i + 1}:`, error);
        throw error;
      }
    }
  }
}
