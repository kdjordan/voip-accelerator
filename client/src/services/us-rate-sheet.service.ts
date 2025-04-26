import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import { USColumnRole, type USRateSheetEntry } from '@/types/domains/us-types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { DBNameType } from '@/types';
import type { DexieDBBase } from '@/composables/useDexieDB';
import Dexie from 'dexie';
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

// Define structure for invalid rows
interface InvalidUSRateSheetRow {
  rowIndex: number;
  rowData: string[];
  reason: string;
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

    // Only initialize the database but don't delete it automatically
    this.initializeDatabase().catch((error) => {
      console.error('Error initializing US Rate Sheet database:', error);
    });
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
   * Clears all data from the database.
   */
  async clearData(): Promise<void> {
    console.log(`[USRateSheetService] Clearing US Rate Sheet data`);
    try {
      // Get the database instance
      const db = await this.getDB(this.dbName);

      // Check if the 'entries' table exists and clear it if it does
      if (db.hasStore('entries')) {
        await db.table('entries').clear();
        console.log(`[USRateSheetService] Cleared 'entries' table in database ${this.dbName}`);
      } else {
        console.log(`[USRateSheetService] 'entries' table not found. No data to clear.`);
      }
    } catch (error) {
      console.warn(
        `[USRateSheetService] Error clearing 'entries' table, attempting to recreate database:`,
        error
      );

      // Fallback: Delete and recreate the database
      try {
        await this.deleteDatabase(this.dbName);
        console.log(`[USRateSheetService] Database deleted successfully.`);

        // Reinitialize the database so it's ready for new data
        await this.initializeDatabase();
      } catch (deleteError) {
        console.error(`[USRateSheetService] Error deleting database:`, deleteError);
        throw deleteError; // Rethrow critical error
      }
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

  // Store the current batch in a transaction for better performance
  private async storeBatch(): Promise<void> {
    if (this.processingBatch.length === 0) return;

    const batchToStore = [...this.processingBatch];
    this.processingBatch = []; // Reset the batch

    try {
      const db = await this.getDB(this.dbName);
      // Directly use bulkPut as the store is guaranteed to exist now
      await db.table('entries').bulkPut(batchToStore);
      console.log(
        `[USRateSheetService] Stored batch of ${batchToStore.length} records in 'entries' table.`
      );
    } catch (error) {
      console.error(`[USRateSheetService] Error storing batch directly to table 'entries':`, error);
      // Continue processing - don't want to lose subsequent data
      // Future enhancement: Add failed rows to invalidRows list
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
  ): Promise<{ recordCount: number; invalidRows: InvalidUSRateSheetRow[] }> {
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
      try {
        // Delete existing database for a clean slate
        await this.deleteDatabase(this.dbName);
        console.log(`[USRateSheetService] Deleted database ${this.dbName} to start fresh`);

        // Initialize a new database instance - this should create the tables based on the schema in useDexieDB
        await this.initializeDatabase(); // This opens the DB
        console.log(`[USRateSheetService] Initialized new database ${this.dbName}`);

        // Get DB instance AFTER initialization
        // const db = await this.getDB(this.dbName); // No longer needed just for addStore

        // REMOVED: Ensure the 'entries' table exists BEFORE starting parsing
        // The initializeDatabase call handles this based on the defined schema
        // await db.addStore('entries');
        // console.log(`[USRateSheetService] Ensured 'entries' store exists in ${this.dbName}.`);
      } catch (dbPrepError) {
        console.error('[USRateSheetService] Critical error preparing database:', dbPrepError);
        // Reject the main promise if DB preparation fails
        return Promise.reject(new Error('Failed to prepare database table.'));
      }
      // --- Prepare Database --- END ---

      // Reset the batch in case there's anything left from a previous operation
      this.processingBatch = [];

      const invalidRows: InvalidUSRateSheetRow[] = [];
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
                this.storeBatch();
              }
            } catch (error) {
              // Log but don't let it stop processing
              console.error(`Error processing row ${totalChunks}:`, error);
            }
          },
          complete: async () => {
            // Store any remaining rows in the final batch
            if (this.processingBatch.length > 0) {
              await this.storeBatch();
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
    invalidRows: InvalidUSRateSheetRow[],
    effectiveDate: string // Accept calculated effective date
  ): USRateSheetEntry | null {
    let isValidRow = true;
    let npa = '';
    let nxx = '';
    let npanxx = '';
    let interRate: number | null = null;
    let intraRate: number | null = null;
    let ijRate: number | null = null;
    let stateCode: string | null = null; // Initialize stateCode to null
    let errorReason = '';

    try {
      // --- Extract and Validate NPA/NXX/NPANXX ---
      if (columnMapping.npanxx !== -1) {
        npanxx = row[columnMapping.npanxx]?.trim() || '';

        // --- Add 7-digit handling from us.service.ts --- START ---
        if (npanxx.length === 7 && npanxx.startsWith('1')) {
          npanxx = npanxx.substring(1); // Remove leading "1"
        }
        // --- Add 7-digit handling from us.service.ts --- END ---

        if (npanxx.length === 6 && /^[0-9]+$/.test(npanxx)) {
          npa = npanxx.substring(0, 3);
          nxx = npanxx.substring(3, 6);
        } else {
          isValidRow = false;
          errorReason = `Invalid NPANXX format (expected 6 digits): ${npanxx}`;
        }
      } else if (columnMapping.npa !== -1 && columnMapping.nxx !== -1) {
        // --- Handle separate NPA/NXX columns ---
        npa = row[columnMapping.npa]?.trim() || '';
        nxx = row[columnMapping.nxx]?.trim() || '';

        // --- Add NPA startsWith('1') handling --- START ---
        if (npa.startsWith('1') && npa.length === 4) {
          npa = npa.substring(1); // Remove leading "1"
        }
        // --- Add NPA startsWith('1') handling --- END ---

        if (npa.length === 3 && /^[0-9]+$/.test(npa) && nxx.length === 3 && /^[0-9]+$/.test(nxx)) {
          npanxx = npa + nxx;
        } else {
          isValidRow = false;
          errorReason = `Invalid NPA/NXX format: NPA=${npa}, NXX=${nxx}`;
        }
      } else {
        isValidRow = false;
        errorReason = 'Missing required NPA/NXX or NPANXX mapping.';
      }

      // --- Get State Code from LERG (if row is valid so far) ---
      if (isValidRow && npa) {
        try {
          const location = this.lergStore.getLocationByNPA(npa);
          if (location?.region) {
            // Accept any region code found
            stateCode = location.region;
          } else {
            // Handle cases where NPA is not found
            isValidRow = false; // Make row invalid if no location found
            errorReason = `NPA ${npa} not found in LERG data.`;
            console.warn(`Row ${rowIndex}: ${errorReason}`);
          }
        } catch (lergError) {
          isValidRow = false; // Make row invalid on lookup error
          errorReason = `LERG lookup error for NPA ${npa}.`;
          console.error(`Row ${rowIndex}: Error looking up NPA ${npa} in LERG store:`, lergError);
        }
      }

      // --- Extract and Validate Rates (only if row is valid so far) ---
      if (isValidRow) {
        const parseRate = (rateStr: string | undefined): number | null => {
          if (rateStr === undefined || rateStr === null || rateStr.trim() === '') {
            errorReason = 'Missing rate value';
            return null;
          }
          const cleanedRate = rateStr.replace(/[^\d.-]/g, '');
          const rate = parseFloat(cleanedRate);
          if (isNaN(rate) || !isFinite(rate)) {
            errorReason = `Invalid rate format: ${rateStr}`;
            return null;
          }
          return rate;
        };

        interRate = parseRate(row[columnMapping.interstate]);
        if (interRate === null && columnMapping.interstate !== -1) isValidRow = false;
        else if (columnMapping.interstate === -1) {
          isValidRow = false;
          errorReason = 'Interstate rate column not mapped.';
        }

        if (isValidRow && columnMapping.intrastate !== -1) {
          intraRate = parseRate(row[columnMapping.intrastate]);
          if (intraRate === null) isValidRow = false;
        } else if (isValidRow) {
          // Intrastate is required if column is mapped
          isValidRow = false;
          errorReason = 'Intrastate rate column not mapped.';
        }

        // Handle Indeterminate Rate
        if (isValidRow) {
          ijRate = null; // Start with null

          // 1. Check if Indeterminate column is mapped and valid
          if (columnMapping.indeterminate !== -1) {
            ijRate = parseRate(row[columnMapping.indeterminate]);
            if (ijRate === null) {
              // If column mapped but value invalid/missing, try deriving
              console.warn(
                `Row ${rowIndex}: Indeterminate column mapped but value invalid/missing. Attempting derivation.`
              );
              ijRate = null; // Reset to null before deriving
            }
          }

          // 2. If ijRate is still null (column not mapped or value was invalid), derive it
          if (ijRate === null) {
            if (interRate !== null && intraRate !== null) {
              // Default derivation: Use the minimum of Inter and Intra
              ijRate = Math.min(interRate, intraRate);
              console.log(
                `Row ${rowIndex}: Derived Indeterminate Rate as min(Inter, Intra): ${ijRate}`
              );
            } else {
              // Cannot derive if Inter or Intra is invalid
              isValidRow = false;
              errorReason =
                'Cannot derive Indeterminate Rate because Interstate or Intrastate rate is invalid.';
            }
          }
        }
      }

      // Return the data if valid, otherwise add to invalidRows
      if (
        isValidRow &&
        interRate !== null &&
        intraRate !== null &&
        ijRate !== null &&
        stateCode !== null
      ) {
        return {
          npa,
          nxx,
          npanxx,
          stateCode,
          interRate,
          intraRate,
          ijRate,
          effectiveDate, // Assign the calculated effective date
        };
      } else if (!isValidRow) {
        // Ensure errorReason is set if validation failed earlier but wasn't caught
        if (!errorReason) errorReason = 'Unknown validation error';
        invalidRows.push({ rowIndex, rowData: row, reason: errorReason });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      invalidRows.push({
        rowIndex,
        rowData: row,
        reason: `Processing error: ${message}`,
      });
    }

    return null; // Row wasn't valid
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
      const db = await this.getDB(this.dbName);
      if (!db.hasStore('entries')) {
        console.warn('Entries table not found, cannot get effective date.');
        return null;
      }
      const firstRecord = await db.table('entries').limit(1).first();
      return firstRecord?.effectiveDate || null;
    } catch (error) {
      console.error(`[USRateSheetService] Error getting current effective date:`, error);
      return null;
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
      if (!db.hasStore('entries')) {
        throw new Error('Entries table not found, cannot update effective dates.');
      }

      const table = db.table<USRateSheetEntry>('entries');
      const recordCount = await table.count();
      console.log(`[USRateSheetService] Found ${recordCount} records to update.`);

      if (recordCount === 0) {
        console.warn('[USRateSheetService] No records found to update effective date.');
        return; // Nothing to do
      }

      // Fetch all records (consider batching for very large datasets if needed)
      const allRecords = await table.toArray();

      // Update the effectiveDate field
      const updatedRecords = allRecords.map((record) => ({
        ...record,
        effectiveDate: newDate,
      }));

      // Perform bulk update
      console.log(`[USRateSheetService] Performing bulkPut to update effective dates...`);
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
   * Loads all USRateSheetEntry data from the database.
   */
  async getData(): Promise<USRateSheetEntry[]> {
    console.log(`[USRateSheetService] Attempting to load data from ${this.dbName}/'entries'`);
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
