import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import { USColumnRole, type USRateSheetEntry, type InvalidUsRow } from '@/types/domains/us-types';
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
    console.log('USRateSheetService initialized');

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
      console.log(`[USRateSheetService] Database ${this.dbName} initialized. Ready for data.`);
    } catch (error) {
      // Only log the error but don't throw - this allows the service to continue working
      console.error(
        `[USRateSheetService] Error during database initialization (non-fatal):`,
        error
      );
    }
  }

  /**
   * Clears all data from the database by deleting the database itself.
   */
  async clearData(): Promise<void> {
    console.log(
      `[USRateSheetService] Clearing US Rate Sheet data by deleting database ${this.dbName}`
    );
    try {
      await this.deleteDatabase(this.dbName); // Directly call deleteDatabase from the composable
      console.log(`[USRateSheetService] Database ${this.dbName} deleted successfully.`);
    } catch (error) {
      console.error(`[USRateSheetService] Error deleting database ${this.dbName}:`, error);
      // Rethrow the error so the store can potentially handle it
      throw error;
    }
  }

  // Optimize the database for bulk operations
  private async optimizeDBForBulkOperations(): Promise<void> {
    try {
      // Simply ensure the database is initialized
      await this.initializeDatabase();
      console.log(`[USRateSheetService] Database optimized for bulk operations`);
    } catch (error) {
      console.warn(`[USRateSheetService] Error optimizing database:`, error);
    }
  }

  // Store the current batch using the composable's function for better handling
  private async storeBatch(): Promise<void> {
    if (this.processingBatch.length === 0) return;

    const batchToStore = [...this.processingBatch];
    this.processingBatch = []; // Reset the batch

    try {
      // Use the composable function which handles table creation
      await this.storeInDexieDB(batchToStore, this.dbName, 'entries', {
        replaceExisting: false, // Don't replace, just add
      });
      console.log(
        `[USRateSheetService] Stored batch of ${batchToStore.length} records in 'entries' table via storeInDexieDB.`
      );
    } catch (error) {
      console.error(`[USRateSheetService] Error storing batch via storeInDexieDB:`, error);
      // Consider how to handle failed batches - re-adding to processingBatch,
      // adding to invalidRows, or rejecting the main promise.
      // For now, just log the error.
      // Example: Add failed rows back to invalidRows if possible
      // this.addFailedBatchToInvalidRows(batchToStore, error);
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
    indeterminateDefinition: string | undefined
  ): Promise<ProcessFileResult> {
    console.log('USRateSheetService processing file:', { fileName: file.name, startLine });

    // --- Add Guard: Ensure LERG data is loaded --- START ---
    if (!this.lergStore.isLoaded) {
      const errorMsg =
        'LERG data is not loaded. Cannot process rate sheet without state information.';
      console.error(`[USRateSheetService] ${errorMsg}`);
      // Reject the promise to stop processing and inform the caller
      return Promise.reject(new Error(errorMsg));
    }
    // --- Add Guard: Ensure LERG data is loaded --- END ---

    // Calculate effective date (7 days from now)
    const effectiveDate = new Date();
    effectiveDate.setDate(effectiveDate.getDate() + 7);
    const effectiveDateString = effectiveDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Wrap the entire processing logic in a try/catch to handle promise rejection
    try {
      // --- Prepare Database --- START ---
      // REMOVED: Explicit deletion and re-initialization. DexieDB handles initialization,
      // and data clearing can be managed via options in storeInDexieDB if needed.
      // try {
      // // Delete existing database for a clean slate
      // await this.deleteDatabase(this.dbName);
      // console.log(`[USRateSheetService] Deleted database ${this.dbName} to start fresh`);
      //
      // // Initialize a new database instance - this should create the tables based on the schema in useDexieDB
      // await this.initializeDatabase(); // This opens the DB
      // console.log(`[USRateSheetService] Initialized new database ${this.dbName}`);
      // } catch (dbPrepError) {
      //   console.error('[USRateSheetService] Critical error preparing database:', dbPrepError);
      //   // Reject the main promise if DB preparation fails
      //   return Promise.reject(new Error('Failed to prepare database table.'));
      // }
      // --- Prepare Database --- END ---

      // Reset the batch in case there's anything left from a previous operation
      this.processingBatch = [];

      // Array to hold promises for batch storage operations
      const batchPromises: Promise<void>[] = [];

      const invalidRows: InvalidUsRow[] = [];
      let totalRecords = 0;
      let totalChunks = 0;
      const BATCH_SIZE = 1000; // Smaller batch size for more reliable processing

      return new Promise((resolve, reject) => {
        // Show progress indicators
        let lastProgressUpdate = Date.now();
        const PROGRESS_UPDATE_INTERVAL = 5000; // Update progress every 5 seconds

        // Use step function for better memory efficiency with large files
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          worker: true, // Use worker thread for large files
          step: (results, parser) => {
            // Process each row individually rather than in chunks
            const row = results.data as string[];
            totalChunks++;

            // Update progress periodically
            const now = Date.now();
            if (now - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL) {
              console.log(
                `[USRateSheetService] Processing progress: ${totalChunks} rows, ${totalRecords} valid records`
              );
              lastProgressUpdate = now;
            }

            // Skip header rows based on user input
            if (totalChunks < startLine) return;

            try {
              // Process the row and add it to the current batch
              const processedRow = this.processRow(
                row,
                totalChunks,
                columnMapping,
                indeterminateDefinition,
                invalidRows,
                effectiveDateString // Pass calculated effective date
              );
              if (processedRow) {
                // Add id to each record for better indexing
                this.processingBatch.push({
                  ...processedRow,
                  id: Date.now() + totalRecords, // Using timestamp + counter as ID
                });
                totalRecords++;
              }

              // When we reach the batch size, store the batch and start a new one
              if (this.processingBatch.length >= BATCH_SIZE) {
                // Push the promise returned by storeBatch to the array
                batchPromises.push(this.storeBatch());
              }
            } catch (error) {
              // Log but don't let it stop processing
              console.error(`Error processing row ${totalChunks}:`, error);
            }
          },
          complete: async () => {
            // Wait for all intermediate batch storage operations to complete
            try {
              console.log(
                `[USRateSheetService] Waiting for ${batchPromises.length} intermediate batch stores to finish...`
              );
              await Promise.all(batchPromises);
              console.log('[USRateSheetService] Intermediate batch stores finished.');
            } catch (batchError) {
              console.error(
                '[USRateSheetService] Error during intermediate batch storage:',
                batchError
              );
              // Reject the main promise if any batch failed
              reject(new Error('Failed to store one or more data batches.'));
              return; // Stop further processing
            }

            // Store any remaining rows in the final batch
            if (this.processingBatch.length > 0) {
              try {
                await this.storeBatch();
              } catch (finalBatchError) {
                console.error('[USRateSheetService] Error storing final batch:', finalBatchError);
                reject(new Error('Failed to store the final data batch.'));
                return; // Stop further processing
              }
            }

            console.log(
              `[USRateSheetService] Parsing complete. Processed ${totalRecords} valid records out of ${totalChunks} total rows.`
            );

            // Resolve the promise with the results
            resolve({
              recordCount: totalRecords,
              invalidRows: invalidRows.slice(0, 50), // Only return first 50 invalid rows to avoid memory issues
            });
          },
          error: (error: Error) => {
            console.error('PapaParse Error:', error);
            reject(new Error(`Failed to parse CSV file: ${error.message}`));
          },
        });
      });
    } catch (error) {
      console.error('[USRateSheetService] Error processing file:', error);
      return Promise.reject(new Error('Failed to process file.'));
    }
  }

  // Batch of records to be stored
  private processingBatch: USRateSheetEntry[] = [];

  // Process a single row of data
  private processRow(
    row: string[],
    rowIndex: number,
    columnMapping: USRateSheetColumnMapping,
    indeterminateDefinition: string | undefined,
    invalidRows: InvalidUsRow[], // This now expects the imported type
    effectiveDate: string // Accept calculated effective date
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
      console.log(`[processRow ${rowIndex}] Stripped leading '1' from 7-digit NPANXX: ${npanxx}`);
    } else if (rawNpanxx && rawNpanxx.length === 6 && /^[0-9]+$/.test(rawNpanxx)) {
      npanxx = rawNpanxx;
      npa = rawNpanxx.substring(0, 3);
      nxx = rawNpanxx.substring(3, 6);
      console.log(`[processRow ${rowIndex}] Using 6-digit NPANXX: ${npanxx}`);
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
    if (indeterminateDefinition === 'highest') {
      indetermRate = Math.max(interRate ?? 0, intraRate ?? 0);
    } else if (indeterminateDefinition === 'provided') {
      indetermRate = parseRate(rawIndeterminate);
    } else {
      // Default: Assume 0 if not provided or definition is unclear
      indetermRate = parseRate(rawIndeterminate) ?? 0;
    }

    // Check if rates are valid numbers
    if (interRate === null || intraRate === null || indetermRate === null) {
      // Add to invalid rows if any rate is invalid
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

    // Get state code from LergStore
    const stateCode = this.lergStore.getLocationByNPA(npa)?.region || 'N/A';

    // Return the standardized entry
    return {
      npa,
      nxx,
      npanxx,
      interRate,
      intraRate,
      indetermRate, // Use the processed indetermRate
      stateCode,
      effectiveDate, // Use the calculated effective date
    };
  }

  /**
   * Gets the effective date from the first record in the table.
   * Assumes all records currently have the same effective date.
   */
  async getCurrentEffectiveDate(): Promise<string | null> {
    console.log(
      `[USRateSheetService] Getting current effective date from ${this.dbName}/'entries'`
    );
    try {
      // Check if DB exists before trying to open it
      const dbExists = await Dexie.exists(this.dbName);
      if (!dbExists) {
        console.log(
          `[USRateSheetService] Database ${this.dbName} does not exist. Cannot get effective date.`
        );
        return null;
      }

      // DB exists, now open it and query
      const db = await this.getDB(this.dbName);
      // Check if the table exists within the opened DB
      if (!db.tables.some((table) => table.name === 'entries')) {
        console.warn('[USRateSheetService] Entries table not found, cannot get effective date.');
        return null;
      }
      const firstRecord = await db.table<USRateSheetEntry>('entries').limit(1).first();
      return firstRecord?.effectiveDate || null;
    } catch (error) {
      console.error(`[USRateSheetService] Error getting current effective date:`, error);
      return null; // Return null on error
    }
  }

  /**
   * Updates the effectiveDate for all records in the 'entries' table.
   * @param newDate The new effective date string (YYYY-MM-DD).
   */
  async updateAllEffectiveDates(newDate: string): Promise<void> {
    console.log(`[USRateSheetService] Updating all effective dates to ${newDate}`);
    try {
      const db = await this.getDB(this.dbName);
      // REVERTED: Simplified table existence check
      if (!db.tables.some((table) => table.name === 'entries')) {
        throw new Error('Entries table not found, cannot update effective dates.');
      }

      const table = db.table<USRateSheetEntry>('entries');
      const recordCount = await table.count();
      console.log(`[USRateSheetService] Found ${recordCount} records to update.`);

      if (recordCount === 0) {
        console.warn('[USRateSheetService] No records found to update effective date.');
        return; // Nothing to do
      }

      // REVERTED: Less efficient fetch-modify-put cycle
      const allRecords = await table.toArray();
      const updatedRecords = allRecords.map((record) => ({
        ...record,
        effectiveDate: newDate,
      }));
      await table.bulkPut(updatedRecords);

      console.log(
        `[USRateSheetService] Successfully updated effective date for ${updatedRecords.length} records.`
      );
    } catch (error) {
      console.error(`[USRateSheetService] Error updating all effective dates:`, error);
      throw new Error('Failed to update effective dates in the database.'); // Re-throw for the store to catch
    }
  }

  /**
   * Loads ALL USRateSheetEntry data from the database.
   * Note: This might load a large amount of data. Use cautiously.
   */
  async getData(): Promise<USRateSheetEntry[]> {
    console.warn(
      `[USRateSheetService] Attempting to load ALL data from ${this.dbName}/'entries'. This could be memory intensive.`
    );
    try {
      // Load data from the correct 'entries' table
      const data = await this.loadFromDexieDB<USRateSheetEntry>(this.dbName, 'entries');
      console.log(`[USRateSheetService] Loaded ${data.length} records from 'entries' table.`);
      return data;
    } catch (error) {
      console.error(
        `[USRateSheetService] Error loading data from ${this.dbName}/'entries':`,
        error
      );
      return []; // Return empty array on error
    }
  }
}
