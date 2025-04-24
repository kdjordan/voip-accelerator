import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import { USColumnRole, type USRateSheetEntry } from '@/types/domains/us-types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { DBNameType } from '@/types';
import type { DexieDBBase } from '@/composables/useDexieDB';
import Dexie from 'dexie';

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

  constructor() {
    // Get required functions from the composable
    const { getDB, loadFromDexieDB, storeInDexieDB, deleteDatabase } = useDexieDB();
    this.getDB = getDB;
    this.loadFromDexieDB = loadFromDexieDB;
    this.storeInDexieDB = storeInDexieDB;
    this.deleteDatabase = deleteDatabase;
    console.log('USRateSheetService initialized');

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
   * Processes the uploaded US Rate Sheet CSV file, parses it,
   * and stores the standardized data in the Dexie database.
   */
  async processFile(
    file: File,
    columnMapping: USRateSheetColumnMapping,
    startLine: number,
    indeterminateDefinition: string | undefined,
    effectiveDate: string | undefined
  ): Promise<{ recordCount: number; invalidRows: InvalidUSRateSheetRow[] }> {
    console.log('USRateSheetService processing file:', { fileName: file.name, startLine });

    try {
      // First try to clear the existing data without deleting the database
      const db = await this.getDB(this.dbName);
      try {
        await db.clear(); // This clears all tables without deleting the database
        console.log(`[USRateSheetService] Cleared existing data`);
      } catch (clearError) {
        console.warn(`[USRateSheetService] Error clearing data:`, clearError);

        // Only delete the database if clearing failed
        console.log(`[USRateSheetService] Attempting to recreate database due to error...`);
        await this.deleteDatabase(this.dbName);
        await this.initializeDatabase();
      }
    } catch (error) {
      console.warn('[USRateSheetService] Error preparing database:', error);
      // Continue despite the error - we'll handle errors during data storage
    }

    const standardizedData: USRateSheetEntry[] = [];
    const invalidRows: InvalidUSRateSheetRow[] = [];

    return new Promise((resolve, reject) => {
      let currentRowIndex = 0; // Track overall row index for error reporting

      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        worker: true, // Use worker thread for large files
        chunk: (results: ParseResult<string[]>, parser) => {
          console.log(`Processing chunk of ${results.data.length} rows...`);
          const chunkData = results.data;

          for (let i = 0; i < chunkData.length; i++) {
            currentRowIndex++; // Increment for each row processed
            const rowIndexForUser = currentRowIndex; // Row number user sees (1-based)

            // Skip header rows based on user input
            if (rowIndexForUser < startLine) continue;

            const row = chunkData[i];
            console.log(`[Debug Row ${rowIndexForUser}] Raw Data:`, JSON.stringify(row));

            let isValidRow = true;
            let npa = '';
            let nxx = '';
            let npanxx = '';
            let interRate: number | null = null;
            let intraRate: number | null = null;
            let ijRate: number | null = null;
            let errorReason = '';

            try {
              // --- Extract and Validate NPA/NXX/NPANXX ---
              if (columnMapping.npanxx !== -1) {
                npanxx = row[columnMapping.npanxx]?.trim() || '';
                console.log(
                  `[Debug Row ${rowIndexForUser}] Extracted NPANXX: '${npanxx}' from index ${columnMapping.npanxx}`
                );

                // --- Add 7-digit handling from us.service.ts --- START ---
                if (npanxx.length === 7 && npanxx.startsWith('1')) {
                  console.log(
                    `[Debug Row ${rowIndexForUser}] Detected 7-digit NPANXX starting with 1. Stripping leading '1'.`
                  );
                  npanxx = npanxx.substring(1); // Remove leading "1"
                  console.log(`[Debug Row ${rowIndexForUser}] Modified NPANXX: '${npanxx}'`);
                }
                // --- Add 7-digit handling from us.service.ts --- END ---

                if (npanxx.length === 6 && /^[0-9]+$/.test(npanxx)) {
                  npa = npanxx.substring(0, 3);
                  nxx = npanxx.substring(3, 6);
                  console.log(`[Debug Row ${rowIndexForUser}] NPANXX validated successfully.`);
                } else {
                  isValidRow = false;
                  errorReason = `Invalid NPANXX format (expected 6 digits): ${npanxx}`;
                  console.log(
                    `[Debug Row ${rowIndexForUser}] Failed NPANXX validation. Reason: ${errorReason}`
                  );
                }
              } else if (columnMapping.npa !== -1 && columnMapping.nxx !== -1) {
                // --- Handle separate NPA/NXX columns ---
                npa = row[columnMapping.npa]?.trim() || '';
                nxx = row[columnMapping.nxx]?.trim() || '';
                console.log(
                  `[Debug Row ${rowIndexForUser}] Extracted NPA: '${npa}' from index ${columnMapping.npa}, NXX: '${nxx}' from index ${columnMapping.nxx}`
                );

                // --- Add NPA startsWith('1') handling --- START ---
                if (npa.startsWith('1') && npa.length === 4) {
                  console.log(
                    `[Debug Row ${rowIndexForUser}] Detected 4-digit NPA starting with 1. Stripping leading '1'.`
                  );
                  npa = npa.substring(1); // Remove leading "1"
                  console.log(`[Debug Row ${rowIndexForUser}] Modified NPA: '${npa}'`);
                }
                // --- Add NPA startsWith('1') handling --- END ---

                if (
                  npa.length === 3 &&
                  /^[0-9]+$/.test(npa) &&
                  nxx.length === 3 &&
                  /^[0-9]+$/.test(nxx)
                ) {
                  npanxx = npa + nxx;
                  console.log(
                    `[Debug Row ${rowIndexForUser}] NPA/NXX validated successfully. Combined NPANXX: '${npanxx}'`
                  );
                } else {
                  isValidRow = false;
                  errorReason = `Invalid NPA/NXX format: NPA=${npa}, NXX=${nxx}`;
                  console.log(
                    `[Debug Row ${rowIndexForUser}] Failed NPA/NXX validation. Reason: ${errorReason}`
                  );
                }
              } else {
                isValidRow = false;
                errorReason = 'Missing required NPA/NXX or NPANXX mapping.';
                console.log(
                  `[Debug Row ${rowIndexForUser}] Failed mapping validation. Reason: ${errorReason}`
                );
              }

              // --- Extract and Validate Rates (only if NPA/NXX was valid so far) ---
              if (isValidRow) {
                const parseRate = (rateStr: string | undefined): number | null => {
                  console.log(`[Debug Row ${rowIndexForUser}] Parsing Rate: '${rateStr}'`);

                  if (rateStr === undefined || rateStr === null || rateStr.trim() === '') {
                    errorReason = 'Missing rate value';
                    console.log(
                      `[Debug Row ${rowIndexForUser}] Failed rate parsing (missing). Reason: ${errorReason}`
                    );
                    return null;
                  }
                  const cleanedRate = rateStr.replace(/[^\d.-]/g, '');
                  const rate = parseFloat(cleanedRate);
                  if (isNaN(rate) || !isFinite(rate)) {
                    errorReason = `Invalid rate format: ${rateStr}`;
                    console.log(
                      `[Debug Row ${rowIndexForUser}] Failed rate parsing (format). Reason: ${errorReason}, Cleaned: '${cleanedRate}', Parsed: ${rate}`
                    );
                    return null;
                  }
                  console.log(`[Debug Row ${rowIndexForUser}] Parsed rate successfully: ${rate}`);
                  return rate;
                };

                interRate = parseRate(row[columnMapping.interstate]);
                if (interRate === null && columnMapping.interstate !== -1) isValidRow = false;
                else if (columnMapping.interstate === -1) {
                  isValidRow = false;
                  errorReason = 'Interstate rate column not mapped.';
                  console.log(
                    `[Debug Row ${rowIndexForUser}] Failed rate validation (Interstate not mapped). Reason: ${errorReason}`
                  );
                }

                if (isValidRow && columnMapping.intrastate !== -1) {
                  intraRate = parseRate(row[columnMapping.intrastate]);
                  if (intraRate === null) isValidRow = false;
                } else if (isValidRow) {
                  // Intrastate is required if column is mapped
                  isValidRow = false;
                  errorReason = 'Intrastate rate column not mapped.';
                  console.log(
                    `[Debug Row ${rowIndexForUser}] Failed rate validation (Intrastate not mapped). Reason: ${errorReason}`
                  );
                }

                // Handle Indeterminate Rate
                if (isValidRow) {
                  if (indeterminateDefinition === 'column') {
                    if (columnMapping.indeterminate !== -1) {
                      ijRate = parseRate(row[columnMapping.indeterminate]);
                      if (ijRate === null) isValidRow = false;
                    } else {
                      isValidRow = false;
                      errorReason =
                        "Indeterminate rate definition set to 'column', but column not mapped.";
                    }
                  } else if (indeterminateDefinition === 'intrastate') {
                    ijRate = intraRate; // Use intrastate rate
                    if (ijRate === null) isValidRow = false; // Should already be false if intraRate was invalid
                  } else if (indeterminateDefinition === 'interstate') {
                    ijRate = interRate; // Use interstate rate
                    if (ijRate === null) isValidRow = false; // Should already be false if interRate was invalid
                  } else {
                    isValidRow = false;
                    errorReason = 'Invalid indeterminate rate definition specified.';
                  }
                }
              }

              // --- Add to standardized data if valid ---
              if (isValidRow && interRate !== null && intraRate !== null && ijRate !== null) {
                standardizedData.push({
                  npa,
                  nxx,
                  npanxx,
                  interRate,
                  intraRate,
                  ijRate,
                });
              } else if (!isValidRow) {
                invalidRows.push({ rowIndex: rowIndexForUser, rowData: row, reason: errorReason });
                console.log(
                  `[Debug Row ${rowIndexForUser}] Final validation failed. Reason: ${errorReason}`
                );
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              console.error(`Error processing row ${rowIndexForUser}:`, message, row);
              invalidRows.push({
                rowIndex: rowIndexForUser,
                rowData: row,
                reason: `Processing error: ${message}`,
              });
            }
          }
        },
        complete: async (results) => {
          console.log(
            `[USRateSheetService] Parsing complete. Processing ${standardizedData.length} standardized entries.`
          );

          try {
            // Store the standardized data in the database
            if (standardizedData.length > 0) {
              await this.storeInDexieDB(standardizedData, this.dbName, '', {
                replaceExisting: true,
              });
              console.log(
                `[USRateSheetService] Successfully stored ${standardizedData.length} records in ${this.dbName}`
              );
            } else {
              console.log(`[USRateSheetService] No valid records to store.`);
            }

            // Resolve the promise
            resolve({
              recordCount: standardizedData.length,
              invalidRows,
            });
          } catch (error) {
            console.error(`[USRateSheetService] Error during data storage:`, error);
            reject(error);
          }
        },
        error: (error: Error) => {
          console.error('PapaParse Error:', error);
          reject(new Error(`Failed to parse CSV file: ${error.message}`));
        },
      });
    });
  }

  /**
   * Loads all USRateSheetEntry data from the database.
   */
  async getData(): Promise<USRateSheetEntry[]> {
    console.log(`[USRateSheetService] Attempting to load data from ${this.dbName}`);
    try {
      const data = await this.loadFromDexieDB<USRateSheetEntry>(this.dbName, '');
      console.log(`[USRateSheetService] Loaded ${data.length} records.`);
      return data;
    } catch (error) {
      console.error(`[USRateSheetService] Error loading data from ${this.dbName}:`, error);
      return []; // Return empty array on error
    }
  }

  /**
   * Clears all data from the database.
   */
  async clearData(): Promise<void> {
    console.log(`[USRateSheetService] Clearing US Rate Sheet data`);
    try {
      // First try to just clear the data without deleting the database
      const db = await this.getDB(this.dbName);
      await db.clear();
      console.log(`[USRateSheetService] Data cleared successfully.`);
    } catch (error) {
      console.warn(
        `[USRateSheetService] Error clearing data, attempting to delete database:`,
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
        throw deleteError;
      }
    }
  }
}
