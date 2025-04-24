import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import { USColumnRole, type USRateSheetEntry } from '@/types/domains/us-types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { DBNameType } from '@/types';
import type { DexieDBBase } from '@/composables/useDexieDB';

// Define the structure for column mapping indices
interface USRateSheetColumnMapping {
  npanxx: number;
  npa: number;
  nxx: number;
  interstate: number;
  intrastate: number;
  indeterminate: number;
}

// Define structure for invalid rows (example)
interface InvalidUSRateSheetRow {
  rowIndex: number;
  rowData: string[];
  reason: string;
}

export class USRateSheetService {
  private getDB: (dbName: DBNameType) => Promise<DexieDBBase>;
  private loadFromDexieDB: <T>(dbName: DBNameType, storeName: string) => Promise<T[]>;
  // Use the dedicated DB and a fixed table name within it
  private dbName = DBName.US_RATE_SHEET;
  private tableName = 'entries'; // Fixed table name within the dedicated DB
  private storeInDexieDB: <T>(
    data: T[],
    dbName: DBNameType,
    storeName: string,
    options?: { sourceFile?: string; replaceExisting?: boolean }
  ) => Promise<void>;

  constructor() {
    // Get required functions from the composable
    const { getDB, loadFromDexieDB, storeInDexieDB } = useDexieDB();
    this.getDB = getDB;
    this.loadFromDexieDB = loadFromDexieDB;
    this.storeInDexieDB = storeInDexieDB;
    console.log('USRateSheetService initialized');

    // Initialize the database
    this.initializeDatabase().catch((error) => {
      console.error('Error initializing US Rate Sheet database:', error);
    });
  }

  /**
   * Initializes the database and ensures the 'entries' table exists
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Get a reference to the database - this should create it if it doesn't exist
      const db = await this.getDB(this.dbName);
      console.log(`[USRateSheetService] Database ${this.dbName} initialized`);

      // Check if the table exists - if not, we'll create it with a minimal entry to ensure it's registered
      if (!db.hasStore(this.tableName)) {
        console.log(
          `[USRateSheetService] Table '${this.tableName}' not found, attempting to create it`
        );
        // Store a minimal entry to create the table
        await this.storeInDexieDB([], this.dbName, this.tableName);
        console.log(`[USRateSheetService] Successfully created table '${this.tableName}'`);
      } else {
        console.log(`[USRateSheetService] Table '${this.tableName}' already exists`);
      }
    } catch (error) {
      console.error(`[USRateSheetService] Error initializing database:`, error);
      throw error;
    }
  }

  /**
   * Processes the uploaded US Rate Sheet CSV file, parses it,
   * and stores the standardized data in the Dexie table.
   *
   * @param file The CSV file object.
   * @param columnMapping The mapping of column roles to their indices.
   * @param startLine The 1-based index of the line where data starts.
   * @param indeterminateDefinition How to handle indeterminate rates ('column', 'intrastate', 'interstate').
   * @param effectiveDate The single effective date for the entire file (YYYY-MM-DD).
   * @returns A promise that resolves with the count of valid records processed and invalid rows.
   */
  async processFile(
    file: File,
    columnMapping: USRateSheetColumnMapping,
    startLine: number,
    indeterminateDefinition: string | undefined,
    effectiveDate: string | undefined // TODO: Use this effective date?
  ): Promise<{ recordCount: number; invalidRows: InvalidUSRateSheetRow[] }> {
    console.log('USRateSheetService processing file:', { fileName: file.name, startLine });

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
            // --- Debugging Start ---
            console.log(`[Debug Row ${rowIndexForUser}] Raw Data:`, JSON.stringify(row));
            // --- Debugging End ---
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
                  // --- Debugging Start ---
                  console.log(`[Debug Row ${rowIndexForUser}] Parsing Rate: '${rateStr}'`);
                  // --- Debugging End ---
                  if (rateStr === undefined || rateStr === null || rateStr.trim() === '') {
                    errorReason = 'Missing rate value';
                    // --- Debugging Start ---
                    console.log(
                      `[Debug Row ${rowIndexForUser}] Failed rate parsing (missing). Reason: ${errorReason}`
                    );
                    // --- Debugging End ---
                    return null;
                  }
                  const cleanedRate = rateStr.replace(/[^\d.-]/g, '');
                  const rate = parseFloat(cleanedRate);
                  if (isNaN(rate) || !isFinite(rate)) {
                    errorReason = `Invalid rate format: ${rateStr}`;
                    // --- Debugging Start ---
                    console.log(
                      `[Debug Row ${rowIndexForUser}] Failed rate parsing (format). Reason: ${errorReason}, Cleaned: '${cleanedRate}', Parsed: ${rate}`
                    );
                    // --- Debugging End ---
                    return null;
                  }
                  // --- Debugging Start ---
                  console.log(`[Debug Row ${rowIndexForUser}] Parsed rate successfully: ${rate}`);
                  // --- Debugging End ---
                  return rate;
                };

                interRate = parseRate(row[columnMapping.interstate]);
                if (interRate === null && columnMapping.interstate !== -1) isValidRow = false;
                else if (columnMapping.interstate === -1) {
                  isValidRow = false;
                  errorReason = 'Interstate rate column not mapped.';
                  // --- Debugging Start ---
                  console.log(
                    `[Debug Row ${rowIndexForUser}] Failed rate validation (Interstate not mapped). Reason: ${errorReason}`
                  );
                  // --- Debugging End ---
                }

                if (isValidRow && columnMapping.intrastate !== -1) {
                  intraRate = parseRate(row[columnMapping.intrastate]);
                  if (intraRate === null) isValidRow = false;
                } else if (isValidRow) {
                  // Intrastate is required if column is mapped
                  isValidRow = false;
                  errorReason = 'Intrastate rate column not mapped.';
                  // --- Debugging Start ---
                  console.log(
                    `[Debug Row ${rowIndexForUser}] Failed rate validation (Intrastate not mapped). Reason: ${errorReason}`
                  );
                  // --- Debugging End ---
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
                  // TODO: Add effectiveDate? ChangeCode?
                });
              } else if (!isValidRow) {
                invalidRows.push({ rowIndex: rowIndexForUser, rowData: row, reason: errorReason });
                // console.warn(`Invalid row skipped at index ${rowIndexForUser}: ${errorReason}`, row);
                // --- Debugging Start ---
                console.log(
                  `[Debug Row ${rowIndexForUser}] Final validation failed. Reason: ${errorReason}`
                );
                // --- Debugging End ---
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
            // Ensure the database and table are initialized
            await this.initializeDatabase();

            // Clear existing data before adding new data
            const db = await this.getDB(this.dbName);
            if (db.hasStore(this.tableName)) {
              await db.table(this.tableName).clear();
              console.log(`[USRateSheetService] Cleared existing data from ${this.tableName}`);
            }

            // Store the standardized data
            if (standardizedData.length > 0) {
              await this.storeInDexieDB(standardizedData, this.dbName, this.tableName, {
                replaceExisting: false,
              });
              console.log(
                `[USRateSheetService] Successfully stored ${standardizedData.length} records in ${this.tableName}`
              );
            } else {
              console.log(`[USRateSheetService] No valid records to store.`);
            }

            // Resolve the promise
            resolve({
              recordCount: standardizedData.length,
              invalidRows,
              fileName: file.name,
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
   * Loads all USRateSheetEntry data from the Dexie table.
   * @returns A promise that resolves with an array of USRateSheetEntry.
   */
  async getData(): Promise<USRateSheetEntry[]> {
    // Use the correct DB name and table name
    console.log(
      `[USRateSheetService] Attempting to load data from ${this.dbName}/${this.tableName}`
    );
    try {
      const data = await this.loadFromDexieDB<USRateSheetEntry>(this.dbName, this.tableName);
      console.log(`[USRateSheetService] Loaded ${data.length} records.`);
      return data;
    } catch (error) {
      console.error(
        `[USRateSheetService] Error loading data from ${this.dbName}/${this.tableName}:`,
        error
      );
      return []; // Return empty array on error
    }
  }

  /**
   * Clears all data from the US Rate Sheet Dexie table.
   */
  async clearData(): Promise<void> {
    console.log(`[USRateSheetService] Clearing data from table: ${this.tableName}`);
    try {
      const db = await this.getDB(this.dbName);

      // Check if table exists before attempting to clear it
      if (db.hasStore(this.tableName)) {
        await db.table(this.tableName).clear();
        console.log(`[USRateSheetService] Data cleared from ${this.tableName} table.`);
      } else {
        console.log(
          `[USRateSheetService] Table ${this.tableName} does not exist. Nothing to clear.`
        );
        // Initialize the table here in case it's needed
        await this.initializeDatabase();
      }
    } catch (error) {
      console.error(`[USRateSheetService] Error clearing data:`, error);
      // If the table doesn't exist, try to initialize it
      if (error.name === 'InvalidTableError') {
        console.log(
          `[USRateSheetService] Table ${this.tableName} does not exist. Initializing database.`
        );
        await this.initializeDatabase();
      } else {
        throw error;
      }
    }
  }
}
