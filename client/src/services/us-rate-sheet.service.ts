import Papa from 'papaparse';
import { type USRateSheetEntry, type InvalidUsRow } from '@/types/domains/us-types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { DBNameType } from '@/types';
import type { DexieDBBase } from '@/composables/useDexieDB';
import Dexie, { type Table } from 'dexie';
import { useLergStore } from '@/stores/lerg-store';

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
  private lergStore: ReturnType<typeof useLergStore>;

  constructor() {
    // Get required functions from the composable
    const { getDB, loadFromDexieDB, storeInDexieDB, deleteDatabase } = useDexieDB();
    this.getDB = getDB;
    this.loadFromDexieDB = loadFromDexieDB;
    this.storeInDexieDB = storeInDexieDB;
    this.deleteDatabase = deleteDatabase;
    this.lergStore = useLergStore();

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
    // --- Add Guard: Ensure LERG data is loaded ---
    if (!this.lergStore.isLoaded) {
      const errorMsg =
        'LERG data is not loaded. Cannot process rate sheet without state information.';
      // console.error(`[USRateSheetService] ${errorMsg}`);
      return Promise.reject(new Error(errorMsg));
    }

    // --- Prepare Database and Table ONCE ---
    let db: DexieDBBase;
    let table: Table<USRateSheetEntry, any>; // Use 'any' for primary key type as it might be auto-incrementing
    try {
      // console.log(`[USRateSheetService] Getting DB instance for ${this.dbName}...`);
      db = await this.getDB(this.dbName);
      // console.log(`[USRateSheetService] Ensuring table 'entries' exists and clearing it...`);
      await this.storeInDexieDB([], this.dbName, 'entries', { replaceExisting: true });
      table = db.table('entries'); // Get table reference after ensuring it exists
      // console.log(`[USRateSheetService] DB and table 'entries' prepared and cleared.`);
    } catch (dbError) {
      // console.error('[USRateSheetService] Failed to prepare database/table:', dbError);
      return Promise.reject(dbError); // Reject if DB setup fails
    }
    // --- End DB Preparation ---

    const batchPromises: Promise<void>[] = [];
    const invalidRows: InvalidUsRow[] = [];
    let processingBatch: USRateSheetEntry[] = []; // Local batch for this run
    let totalRecords = 0;
    let totalChunks = 0; // Renamed from totalChunks for clarity, represents rows read
    const BATCH_SIZE = 1000; // Keep batch size

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
            const processRowStartTime = Date.now(); // <-- Start timer
            const processedRow = this.processRow(
              row,
              totalChunks, // Use the actual row number
              columnMapping,
              indeterminateDefinition,
              invalidRows
            );
            const processRowEndTime = Date.now(); // <-- End timer
            if (processRowEndTime - processRowStartTime > 50) {
              // Log if it takes more than 50ms
              // console.log(`[${new Date().toISOString()}] [USRateSheetService] processRow for row ${totalChunks} took ${processRowEndTime - processRowStartTime}ms`);
            }

            if (processedRow) {
              // No need for custom ID if using auto-incrementing primary key '++id'
              // const recordToBatch = { ...processedRow }; // Simplified
              processingBatch.push(processedRow);
              totalRecords++; // Increment only for valid, processed rows
            }

            // When we reach the batch size, store the batch directly
            if (processingBatch.length >= BATCH_SIZE) {
              const batchToStore = [...processingBatch];
              const batchStartIndex = totalChunks - batchToStore.length + 1;
              const batchEndIndex = totalChunks;
              processingBatch = []; // Reset local batch
              const storeStartTime = Date.now();
              // console.log(`[${new Date().toISOString()}] [USRateSheetService] Storing batch ${batchStartIndex}-${batchEndIndex} (${batchToStore.length} records)...`);
              // Use direct bulkPut on the prepared table reference
              const bulkPutPromise = table
                .bulkPut(batchToStore)
                .then(() => {
                  const storeEndTime = Date.now();
                  // console.log(`[${new Date().toISOString()}] [USRateSheetService] SUCCESS storing batch ${batchStartIndex}-${batchEndIndex} (${batchToStore.length} records). Duration: ${storeEndTime - storeStartTime}ms`);
                })
                .catch((batchError) => {
                  const storeEndTime = Date.now();
                  // console.error(`[${new Date().toISOString()}] [USRateSheetService] ERROR storing batch ${batchStartIndex}-${batchEndIndex}. Duration: ${storeEndTime - storeStartTime}ms`, batchError);
                  // Add failed rows to invalidRows or handle differently if needed
                  invalidRows.push(
                    ...batchToStore.map((r) => ({
                      rowIndex: totalChunks - batchToStore.length + batchToStore.indexOf(r), // Approximate row index
                      npanxx: r.npanxx,
                      npa: r.npa,
                      nxx: r.nxx,
                      interRate: String(r.interRate),
                      intraRate: String(r.intraRate),
                      indetermRate: String(r.indetermRate),
                      reason: `Failed to store batch: ${(batchError as Error).message}`,
                    }))
                  );
                  // Optionally re-throw or just log and add to invalid.
                });
              batchPromises.push(bulkPutPromise);
              // console.log(`[${new Date().toISOString()}] [USRateSheetService] Pushed bulkPut promise for batch ${batchStartIndex}-${batchEndIndex} onto queue.`); // <-- New Log
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
          // console.log('[USRateSheetService] PapaParse complete. Processing final batches...');
          // Wait for all intermediate batch storage operations to complete
          try {
            await Promise.all(batchPromises);
            // console.log('[USRateSheetService] Intermediate batches stored successfully.');
          } catch (batchError) {
            // Errors are now caught and logged within the bulkPut catch handler,
            // but we might still log a summary error here if needed.
            // console.error(`[USRateSheetService] One or more intermediate batches failed to store (see logs above).`, batchError // This might be the first error encountered by Promise.all);
            // Depending on requirements, we might reject here or allow final batch attempt
          }

          // Store any remaining rows in the final batch
          if (processingBatch.length > 0) {
            // console.log(`[USRateSheetService] Storing final batch of ${processingBatch.length} records...`);
            try {
              // Use direct bulkPut for the final batch
              await table.bulkPut(processingBatch);
              // console.log('[USRateSheetService] Final batch stored successfully.');
            } catch (finalBatchError) {
              // console.error('[USRateSheetService] Error storing final batch:', finalBatchError);
              // Add failed rows to invalidRows
              invalidRows.push(
                ...processingBatch.map((r) => ({
                  rowIndex: totalChunks - processingBatch.length + processingBatch.indexOf(r), // Approximate
                  npanxx: r.npanxx,
                  npa: r.npa,
                  nxx: r.nxx,
                  interRate: String(r.interRate),
                  intraRate: String(r.intraRate),
                  indetermRate: String(r.indetermRate),
                  reason: `Failed to store final batch: ${(finalBatchError as Error).message}`,
                }))
              );
              // Reject if the final batch fails? Or just resolve with invalid rows? Resolve for now.
            }
          }

          // console.log(`[USRateSheetService] Processing finished. Valid records processed: ${totalRecords}, Invalid/Skipped rows logged: ${invalidRows.length}`);
          // Resolve the promise with the results
          resolve({
            recordCount: totalRecords, // Use the count of successfully processed rows
            invalidRows: invalidRows.slice(0, 100), // Increased limit slightly
          });
        },
        error: (error: Error) => {
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
      /^[0-9]+$/.test(rawNpanxx)
    ) {
      npanxx = rawNpanxx.substring(1); // Remove leading '1'
      npa = npanxx.substring(0, 3);
      nxx = npanxx.substring(3, 6);
    } else if (rawNpanxx && rawNpanxx.length === 6 && /^[0-9]+$/.test(rawNpanxx)) {
      npanxx = rawNpanxx;
      npa = rawNpanxx.substring(0, 3);
      nxx = rawNpanxx.substring(3, 6);
    } else if (
      rawNpa &&
      rawNpa.length === 3 &&
      /^[0-9]+$/.test(rawNpa) &&
      rawNxx &&
      rawNxx.length === 3 &&
      /^[0-9]+$/.test(rawNxx)
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

    // Helper to parse rates, returns null if invalid
    const parseRate = (rateStr: string | undefined): number | null => {
      if (rateStr === undefined || rateStr === '' || rateStr === 'null' || rateStr === '-')
        return 0; // Treat empty/nullish as 0
      const num = parseFloat(rateStr);
      // Check if it's a valid number and non-negative
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

    // Get state code from LergStore using the optimized getter
    const location = this.lergStore.getOptimizedLocationByNPA(npa);
    const stateCode = location?.region || 'N/A';

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
}
