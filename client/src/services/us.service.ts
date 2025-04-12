import { type USStandardizedData, type InvalidUsRow } from '@/types/domains/us-types';
import { DBName } from '@/types/app-types';
import { useUsStore } from '@/stores/us-store';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB'; // Direct import of Dexie composable
import { useLergStore } from '@/stores/lerg-store';
import { COUNTRY_CODES } from '@/types/constants/country-codes';

import type {
  USPricingReport,
  USCodeReport,
  USComparisonData as USComparison,
  RateStats,
  USPricingComparisonRecord,
} from '@/types/domains/us-types';

// Define the store type to avoid type mismatch
interface UsStore {
  addInvalidRow: (fileName: string, row: InvalidUsRow) => void;
  clearInvalidRowsForFile: (fileName: string) => void;
  resetFiles: () => void;
  addFileUploaded: (componentName: string, fileName: string) => void;
  // In-memory storage methods
  storeInMemoryData: (tableName: string, data: USStandardizedData[]) => void;
  getInMemoryData: (tableName: string) => USStandardizedData[];
  getInMemoryDataCount: (tableName: string) => number;
  removeInMemoryData: (tableName: string) => void;
  clearAllInMemoryData: () => void;
  getInMemoryTables: Record<string, number>;
  setFileStats: (
    componentName: string,
    stats: {
      totalCodes: number;
      totalDestinations: number;
      uniqueDestinationsPercentage: number;
      usNPACoveragePercentage: number;
      avgInterRate: number;
      avgIntraRate: number;
      avgIndetermRate: number;
    }
  ) => void;
  getFileNameByComponent: (componentName: string) => string;
  clearFileStats: (componentName: string) => void;
  setReports: (pricing: USPricingReport, code: USCodeReport) => void;
  getFileNames: string[];
  setPricingReportProcessing: (processing: boolean) => void;
}

export class USService {
  private store: UsStore;
  private lergStore = useLergStore(); // Add instance of lergStore
  private dexieDB = useDexieDB(); // Add instance of dexieDB composable

  constructor() {
    this.store = useUsStore() as unknown as UsStore;
    console.log('[USService] Initializing US service');
  }

  // Process file and store directly in Dexie
  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number,
    indeterminateDefinition?: string
  ): Promise<{ fileName: string; records: USStandardizedData[] }> {
    // Derive table name from file name (removing .csv extension)
    const tableName = file.name.toLowerCase().replace('.csv', '');
    const { storeInDexieDB } = useDexieDB();

    // Clear any existing invalid rows for this file
    this.store.clearInvalidRowsForFile(file.name);

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: async (results: { data: string[][] }) => {
          try {
            // Skip to user-specified start line
            const dataRows = results.data.slice(startLine - 1);
            const validRecords: USStandardizedData[] = [];

            dataRows.forEach((row, index) => {
              // Extract values based on column mapping
              let npanxx = '';
              let npa = '';
              let nxx = '';

              // Handle NPANXX extraction - either directly or from NPA and NXX
              if (columnMapping.npanxx >= 0) {
                npanxx = row[columnMapping.npanxx]?.trim() || '';

                // Handle 7-digit NPANXX with leading "1"
                if (npanxx.length === 7 && npanxx.startsWith('1')) {
                  npanxx = npanxx.substring(1); // Remove leading "1"
                }

                // If we have NPANXX but not NPA/NXX, extract them
                if (npanxx.length === 6) {
                  npa = npanxx.substring(0, 3);
                  nxx = npanxx.substring(3, 6);
                }
                // Handle abnormal NPANXX values
                else if (npanxx) {
                  if (npanxx.length >= 3) {
                    npa = npanxx.substring(0, Math.min(3, npanxx.length));
                    nxx = npanxx.length > 3 ? npanxx.substring(3) : '';
                  }
                }
              } else if (columnMapping.npa >= 0 && columnMapping.nxx >= 0) {
                npa = row[columnMapping.npa]?.trim() || '';
                nxx = row[columnMapping.nxx]?.trim() || '';

                // Special handling for NPA with country code prefix ("1")
                if (npa.startsWith('1') && npa.length === 4) {
                  npa = npa.substring(1); // Remove leading "1"
                }

                npanxx = npa + nxx;
              }

              // Extract rate values
              const interRateStr =
                columnMapping.interstate >= 0 ? row[columnMapping.interstate] : '';
              const intraRateStr =
                columnMapping.intrastate >= 0 ? row[columnMapping.intrastate] : '';
              const indetermRateStr =
                columnMapping.indeterminate >= 0 ? row[columnMapping.indeterminate] : '';

              // Parse rates
              const interRate = parseFloat(interRateStr);
              const intraRate = parseFloat(intraRateStr);
              let indetermRate = parseFloat(indetermRateStr);

              // Handle indeterminate rate based on user selection
              if (isNaN(indetermRate) && indeterminateDefinition) {
                indetermRate = indeterminateDefinition === 'interstate' ? interRate : intraRate;
              }

              // --- DEBUGGING STEP 1 START ---
              // Log parsed rates for the first 5 rows
              if (index < 5) {
                console.log(
                  `[DEBUG][us.service] Row ${
                    startLine + index
                  }: Parsed Rates -> inter: ${interRate}, intra: ${intraRate}, indeterm: ${indetermRate}`
                );
              }
              // --- DEBUGGING STEP 1 END ---

              // Validate the data
              if (
                !npanxx ||
                npanxx.length !== 6 ||
                isNaN(interRate) ||
                isNaN(intraRate) ||
                isNaN(indetermRate)
              ) {
                const reason = !npanxx
                  ? 'NPANXX is empty'
                  : npanxx.length !== 6
                  ? `NPANXX length (${npanxx.length}) is not 6 digits`
                  : isNaN(interRate)
                  ? 'Invalid interstate rate'
                  : isNaN(intraRate)
                  ? 'Invalid intrastate rate'
                  : 'Invalid indeterminate rate';

                const invalidRow: InvalidUsRow = {
                  rowIndex: startLine + index,
                  npanxx,
                  npa,
                  nxx,
                  interRate: isNaN(interRate) ? interRateStr : interRate,
                  intraRate: isNaN(intraRate) ? intraRateStr : intraRate,
                  indetermRate: isNaN(indetermRate) ? indetermRateStr : indetermRate,
                  reason,
                };
                this.store.addInvalidRow(file.name, invalidRow);
              } else {
                validRecords.push({
                  npanxx,
                  npa,
                  nxx,
                  interRate,
                  intraRate,
                  indetermRate,
                });
              }
            });

            // Store directly in Dexie with file source metadata and without replacing existing data
            if (validRecords.length > 0) {
              await storeInDexieDB(validRecords, DBName.US, tableName, {
                sourceFile: file.name,
                replaceExisting: false, // Append to existing data
              });
              console.log(
                `[USService] Stored ${validRecords.length} records in Dexie for table: ${tableName}`
              );
            }

            // Determine component ID for file registration
            let componentId = '';

            // Check if the file is already registered
            const currentUs1File = this.store.getFileNameByComponent('us1');
            const currentUs2File = this.store.getFileNameByComponent('us2');

            if (currentUs1File === file.name) {
              componentId = 'us1';
            } else if (currentUs2File === file.name) {
              componentId = 'us2';
            } else {
              // If not registered yet, assign to an available slot
              componentId = !currentUs1File ? 'us1' : 'us2';
            }

            console.log(`[USService] Registering file ${file.name} with component ${componentId}`);

            // Register file with component
            this.store.addFileUploaded(componentId, file.name);

            // Calculate and store file stats
            await this.calculateFileStats(componentId, file.name);

            resolve({ fileName: file.name, records: validRecords });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(new Error(`Failed to process CSV: ${error.message}`)),
      });
    });
  }

  // Get data directly from Dexie
  async getData(tableName: string, fileName?: string): Promise<USStandardizedData[]> {
    try {
      const { loadFromDexieDB } = useDexieDB();

      try {
        // Use the specific table name provided
        const data = await loadFromDexieDB<USStandardizedData & { sourceFile?: string }>(
          DBName.US,
          tableName
        );
        console.log(`[USService] Retrieved ${data.length} records from Dexie table: ${tableName}`);

        // If fileName is provided, filter the results to only include records from that file
        if (fileName) {
          const filteredData = data.filter((record) => record.sourceFile === fileName);
          console.log(
            `[USService] Filtered to ${filteredData.length} records from file: ${fileName}`
          );
          return filteredData;
        }

        return data;
      } catch (error) {
        console.error(`Error retrieving data from ${tableName}:`, error);
        return [];
      }
    } catch (error) {
      console.error(`Failed to get data from table ${tableName}:`, error);
      return [];
    }
  }

  // Calculate file statistics
  async calculateFileStats(componentId: string, fileName: string): Promise<void> {
    try {
      // Derive table name from filename
      const tableName = fileName.toLowerCase().replace('.csv', '');

      // Pass fileName to getData to filter records by source file
      const data = await this.getData(tableName, fileName);

      // --- DEBUGGING START ---
      // console.log(
      //   `[DEBUG][USService][calculateFileStats] Retrieved ${
      //     data?.length || 0
      //   } records for ${fileName}`
      // );
      // if (data && data.length > 0) {
      //   console.log(
      //     `[DEBUG][USService][calculateFileStats] First 5 records: `,
      //     JSON.stringify(data.slice(0, 5))
      //   );
      // }
      // --- DEBUGGING END ---

      if (!data || data.length === 0) return;

      // Calculate stats
      const totalCodes = data.length;

      // Calculate unique NPAs (area codes)
      const uniqueNPAs = new Set(data.map((item) => item.npa)).size;

      // Calculate unique percentage - for US, we use NPA uniqueness
      const uniquePercentage = ((uniqueNPAs / totalCodes) * 100).toFixed(2);

      // Calculate US NPA coverage using LERG data
      if (!this.lergStore.isLoaded) {
        console.warn('[USService] LERG data might not be loaded. Proceeding anyway.');
      }

      // Create a set of all NPAs from the file
      const allFileNPAs = new Set(data.map((item) => item.npa));

      // Count how many valid US NPAs are in our file (those that exist in LERG data)
      let validUSNPAsInFile = 0;

      // Get all US NPAs from LERG data
      const lergUSNPAs = new Set<string>();
      Object.entries(this.lergStore.stateNPAs)
        .filter(([code]) => (!COUNTRY_CODES[code] && code !== 'CA') || code === 'US')
        .forEach(([_, npas]) => {
          npas.forEach((npa) => {
            lergUSNPAs.add(npa);
            // Count if this NPA is also in our file
            if (allFileNPAs.has(npa)) {
              validUSNPAsInFile++;
            }
          });
        });

      // Calculate coverage based on valid US NPAs found in the file against total US NPAs
      const totalUSNPAs = this.lergStore.getTotalUSNPAs;
      const usNPACoveragePercentage =
        totalUSNPAs > 0 ? ((validUSNPAsInFile / totalUSNPAs) * 100).toFixed(2) : '0.00';

      // Calculate average rates
      const avgInterRate = data.reduce((sum, item) => sum + item.interRate, 0) / totalCodes;
      const avgIntraRate = data.reduce((sum, item) => sum + item.intraRate, 0) / totalCodes;
      const avgIndetermRate = data.reduce((sum, item) => sum + item.indetermRate, 0) / totalCodes;

      // Format rates to 4 decimal places
      const formattedAvgInterRate = parseFloat(avgInterRate.toFixed(4));
      const formattedAvgIntraRate = parseFloat(avgIntraRate.toFixed(4));
      const formattedAvgIndetermRate = parseFloat(avgIndetermRate.toFixed(4));

      // --- DEBUGGING START ---
      // console.log(
      //   `[DEBUG][USService][calculateFileStats] Calculated Averages -> inter: ${formattedAvgInterRate}, intra: ${formattedAvgIntraRate}, indeterm: ${formattedAvgIndetermRate}`
      // );
      // --- DEBUGGING END ---

      // Update store
      this.store.setFileStats(componentId, {
        totalCodes,
        totalDestinations: uniqueNPAs,
        uniqueDestinationsPercentage: parseFloat(uniquePercentage),
        usNPACoveragePercentage: parseFloat(usNPACoveragePercentage),
        avgInterRate: formattedAvgInterRate,
        avgIntraRate: formattedAvgIntraRate,
        avgIndetermRate: formattedAvgIndetermRate,
      });
    } catch (error) {
      console.error('Error calculating file stats:', error);
    }
  }

  // Remove a table directly from Dexie
  async removeTable(tableName: string): Promise<void> {
    try {
      // Find the component ID associated with this table
      const fileName = tableName + '.csv';
      let componentId = '';

      if (this.store.getFileNameByComponent('us1') === fileName) {
        componentId = 'us1';
      } else if (this.store.getFileNameByComponent('us2') === fileName) {
        componentId = 'us2';
      }

      if (componentId) {
        // Clear file stats for this component
        this.store.clearFileStats(componentId);
      }

      // Use DexieDB directly
      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);

      if (db.hasStore(tableName)) {
        await db.deleteStore(tableName);
        console.log(`Table ${tableName} removed successfully from Dexie`);
      }
    } catch (error) {
      console.error(`Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }

  // Clear all US data
  async clearData(): Promise<void> {
    try {
      // Get all table names
      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);
      const tableNames = await db.getAllStoreNames();

      // Delete each table
      for (const tableName of tableNames) {
        await db.deleteStore(tableName);
        console.log(`Table ${tableName} deleted during clearData`);
      }

      // Reset the store state
      this.store.resetFiles();
      console.log('All US data cleared successfully');
    } catch (error) {
      console.error('Failed to clear US data:', error);
      throw error;
    }
  }

  // Get record count for a table
  async getRecordCount(tableName: string): Promise<number> {
    try {
      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);

      if (db.hasStore(tableName)) {
        const count = await db.table(tableName).count();
        console.log(`[USService] Count for Dexie table ${tableName}: ${count}`);
      }
      return 0;
    } catch (error) {
      console.error(`Failed to get record count for table ${tableName}:`, error);
      return 0;
    }
  }

  // List all tables and their record counts
  async listTables(): Promise<Record<string, number>> {
    try {
      // Get all tables and their counts directly from Dexie
      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);

      const result: Record<string, number> = {};
      for (const table of db.tables) {
        const count = await table.count();
        result[table.name] = count;
      }

      console.log(`[USService] Listed ${Object.keys(result).length} Dexie tables`);
      return result;
    } catch (error) {
      console.error('Failed to list tables:', error);
      return {};
    }
  }

  async getTableCount(tableName: string): Promise<number> {
    try {
      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);
      if (db.hasStore(tableName)) {
        return await db.table(tableName).count();
      }
      return 0;
    } catch (error) {
      console.error(`Failed to get count for table ${tableName}:`, error);
      return 0;
    }
  }

  async processComparisons(file1Name: string, file2Name: string): Promise<void> {
    const { loadFromDexieDB, getDB } = useDexieDB();
    const lergStore = useLergStore();

    // Derive table names from file names
    const table1Name = file1Name.toLowerCase().replace('.csv', '');
    const table2Name = file2Name.toLowerCase().replace('.csv', '');
    // Use a fixed table name for comparison results
    const comparisonTableName = 'comparison_results';

    console.log(`[USService] Starting comparison: ${table1Name} vs ${table2Name}`);
    console.log(
      `[USService] Results -> DB: ${DBName.US_PRICING_COMPARISON}, Table: ${comparisonTableName}`
    );
    this.store.setPricingReportProcessing(true);

    try {
      // 1. Load source data from the US rate deck database
      console.log(`[USService] Loading source data from ${DBName.US}/${table1Name}...`);
      const data1 = await loadFromDexieDB<USStandardizedData>(DBName.US, table1Name);
      console.log(`[USService] Loading source data from ${DBName.US}/${table2Name}...`);
      const data2 = await loadFromDexieDB<USStandardizedData>(DBName.US, table2Name);
      console.log(
        `[USService] Loaded ${data1.length} from ${table1Name}, ${data2.length} from ${table2Name}`
      );

      if (data1.length === 0 || data2.length === 0) {
        console.warn('[USService] One or both source tables are empty. Skipping comparison.');
        this.store.setPricingReportProcessing(false);
        return;
      }

      // 2. Prepare the target database and table for comparison results
      const comparisonDb = await getDB(DBName.US_PRICING_COMPARISON);
      const schemaDefinition = {
        // Define schema for the fixed table name
        // Use fixed name here
        [comparisonTableName]:
          '++id, npanxx, npa, nxx, stateCode, countryCode, cheaper_inter, cheaper_intra, cheaper_indeterm, diff_inter_pct, diff_intra_pct, diff_indeterm_pct, diff_inter_abs, diff_intra_abs, diff_indeterm_abs',
      };

      // 3. Ensure schema exists, upgrade if necessary
      console.log(
        `[USService] Checking/defining schema for ${comparisonTableName} in ${comparisonDb.name}...`
      );
      if (!comparisonDb.tables.some((t) => t.name === comparisonTableName)) {
        const currentVersion = comparisonDb.verno;
        comparisonDb.close();
        const newVersion = currentVersion + 1;
        console.log(
          `[USService] Upgrading ${comparisonDb.name} DB to v${newVersion} for table ${comparisonTableName}`
        );
        comparisonDb.version(newVersion).stores(schemaDefinition);
        await comparisonDb.open(); // Re-open DB with new schema
        console.log(`[USService] DB ${comparisonDb.name} opened with new schema.`);
      } else {
        if (!comparisonDb.isOpen()) await comparisonDb.open(); // Ensure DB is open
        console.log(
          `[USService] Table ${comparisonTableName} schema already exists in ${comparisonDb.name}.`
        );
      }

      const comparisonTable = comparisonDb.table<USPricingComparisonRecord>(comparisonTableName);

      // 4. Clear existing comparison data
      console.log(
        `[USService] Clearing existing data in ${comparisonDb.name}/${comparisonTableName}...`
      );
      await comparisonTable.clear();

      // 5. Create lookup map for faster processing
      const table2Map = new Map<string, USStandardizedData>();
      data2.forEach((record) => table2Map.set(record.npanxx, record));
      console.log(`[USService] Built lookup map for ${table2Name} (${table2Map.size} entries).`);

      const comparisonResults: USPricingComparisonRecord[] = [];
      let matchCount = 0;
      let processedCount = 0;
      const processedNpanxx = new Set<string>(); // Add a Set to track processed NPANXX

      // 6. Iterate through file1, find matches in file2, calculate results
      console.log(
        `[USService] Comparing records from ${table1Name} against map of ${table2Name}...`
      );
      for (const record1 of data1) {
        processedCount++;

        // Skip if this NPANXX has already been processed
        if (processedNpanxx.has(record1.npanxx)) {
          continue; // Go to the next record1
        }

        const record2 = table2Map.get(record1.npanxx);

        // --- Process only if a match is found in file2 ---
        if (record2) {
          matchCount++;
          processedNpanxx.add(record1.npanxx); // Mark NPANXX as processed
          try {
            // LERG Lookup
            const location = lergStore.getLocationByNPA(record1.npa);
            const stateCode =
              location?.country === 'US' || location?.country === 'CA' ? location.region : '';
            const countryCode = location?.country || 'Unknown';

            // Rate Comparison
            const rates1 = {
              inter: record1.interRate,
              intra: record1.intraRate,
              indeterm: record1.indetermRate,
            };
            const rates2 = {
              inter: record2.interRate,
              intra: record2.intraRate,
              indeterm: record2.indetermRate,
            };

            const cheaper_inter =
              rates1.inter < rates2.inter
                ? 'file1'
                : rates1.inter > rates2.inter
                ? 'file2'
                : 'same';
            const cheaper_intra =
              rates1.intra < rates2.intra
                ? 'file1'
                : rates1.intra > rates2.intra
                ? 'file2'
                : 'same';
            const cheaper_indeterm =
              rates1.indeterm < rates2.indeterm
                ? 'file1'
                : rates1.indeterm > rates2.indeterm
                ? 'file2'
                : 'same';

            // Absolute Differences (File2 - File1)
            const diff_inter_abs = rates2.inter - rates1.inter;
            const diff_intra_abs = rates2.intra - rates1.intra;
            const diff_indeterm_abs = rates2.indeterm - rates1.indeterm;

            // Percentage Differences (relative to cheaper rate)
            const calculatePctDiff = (
              rate1: number,
              rate2: number,
              cheaper: 'file1' | 'file2' | 'same'
            ): number => {
              if (cheaper === 'same') return 0;
              const cheaperRate = cheaper === 'file1' ? rate1 : rate2;
              const moreExpensiveRate = cheaper === 'file1' ? rate2 : rate1;
              if (cheaperRate === 0) return 0; // Handle division by zero
              return ((moreExpensiveRate - cheaperRate) / cheaperRate) * 100;
            };

            const diff_inter_pct = calculatePctDiff(rates1.inter, rates2.inter, cheaper_inter);
            const diff_intra_pct = calculatePctDiff(rates1.intra, rates2.intra, cheaper_intra);
            const diff_indeterm_pct = calculatePctDiff(
              rates1.indeterm,
              rates2.indeterm,
              cheaper_indeterm
            );

            // Construct Result Record
            const comparisonRecord: USPricingComparisonRecord = {
              npanxx: record1.npanxx,
              npa: record1.npa,
              nxx: record1.nxx,
              stateCode,
              countryCode,
              file1_inter: rates1.inter,
              file1_intra: rates1.intra,
              file1_indeterm: rates1.indeterm,
              file2_inter: rates2.inter,
              file2_intra: rates2.intra,
              file2_indeterm: rates2.indeterm,
              diff_inter_abs,
              diff_intra_abs,
              diff_indeterm_abs,
              diff_inter_pct,
              diff_intra_pct,
              diff_indeterm_pct,
              cheaper_inter,
              cheaper_intra,
              cheaper_indeterm,
            };
            comparisonResults.push(comparisonRecord);
          } catch (error) {
            console.error(`[USService] Error processing matched NPANXX ${record1.npanxx}:`, error);
            // Log details for debugging
            console.error(`   Record1: ${JSON.stringify(record1)}`);
            console.error(`   Record2: ${JSON.stringify(record2)}`);
            // Skip this problematic record
          }
        } // End if(record2)

        // Log progress
        if (processedCount % 10000 === 0) {
          console.log(
            `[USService] Processed ${processedCount}/${data1.length} records from ${table1Name}... (${matchCount} matches)`
          );
        }
      } // End for loop

      console.log(
        `[USService] Finished processing ${processedCount} records. Found ${matchCount} total matching NPANXX.`
      );

      // 7. Bulk insert results into the comparison table
      if (comparisonResults.length > 0) {
        console.log(
          `[USService] Storing ${comparisonResults.length} comparison results in ${comparisonDb.name}/${comparisonTableName}...`
        );
        await comparisonTable.bulkPut(comparisonResults);
        console.log(
          `[USService] Successfully stored ${comparisonResults.length} comparison results.`
        );
      }

      console.log('[USService] Comparison process completed successfully.');
    } catch (error) {
      console.error('[USService] Critical error during US pricing comparison process:', error);
      // Update store or notify user of failure
    } finally {
      this.store.setPricingReportProcessing(false); // Ensure processing state is always reset
      console.log('[USService] Comparison processing state set to false.');
    }
  }

  private calculateRateStats(rates: number[]): RateStats {
    if (rates.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    const sorted = [...rates].sort((a, b) => a - b);
    return {
      average: rates.reduce((sum, n) => sum + (n || 0), 0) / rates.length,
      median: this.calculateMedian(sorted),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: rates.length,
    };
  }

  private calculateMedian(sorted: number[]): number {
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }

  async makeUsCodeReport(file1Name: string, file2Name: string): Promise<USCodeReport> {
    try {
      console.log('[USService] Starting code report generation');

      const table1Name = file1Name.toLowerCase().replace('.csv', '');
      const table2Name = file2Name.toLowerCase().replace('.csv', '');

      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);

      // --- Fetch Data for Rate Calculations ---
      console.log(`[USService] Fetching full data for ${table1Name}...`);
      const file1Data = await db.table<USStandardizedData>(table1Name).toArray();
      console.log(`[USService] Fetched ${file1Data.length} records from ${table1Name}`);

      console.log(`[USService] Fetching full data for ${table2Name}...`);
      const file2Data = await db.table<USStandardizedData>(table2Name).toArray();
      console.log(`[USService] Fetched ${file2Data.length} records from ${table2Name}`);

      const table1Count = file1Data.length;
      const table2Count = file2Data.length;

      // --- Calculate Rate Stats for File 1 ---
      const file1InterRates = file1Data.map((d) => d.interRate);
      const file1IntraRates = file1Data.map((d) => d.intraRate);
      const file1IndetermRates = file1Data.map((d) => d.indetermRate);

      const file1InterStats = this.calculateRateStats(file1InterRates);
      const file1IntraStats = this.calculateRateStats(file1IntraRates);
      const file1IndetermStats = this.calculateRateStats(file1IndetermRates);

      // --- Calculate Rate Stats for File 2 ---
      const file2InterRates = file2Data.map((d) => d.interRate);
      const file2IntraRates = file2Data.map((d) => d.intraRate);
      const file2IndetermRates = file2Data.map((d) => d.indetermRate);

      const file2InterStats = this.calculateRateStats(file2InterRates);
      const file2IntraStats = this.calculateRateStats(file2IntraRates);
      const file2IndetermStats = this.calculateRateStats(file2IndetermRates);

      // --- Initialize Report with Calculated Stats ---
      const report: USCodeReport = {
        file1: {
          fileName: file1Name,
          totalNPANXX: table1Count,
          uniqueNPA: 0, // Will be calculated below
          uniqueNXX: 0, // Can be added if needed
          coveragePercentage: 0, // Can be added if needed
          rateStats: {
            interstate: file1InterStats,
            intrastate: file1IntraStats,
            indeterminate: file1IndetermStats,
          },
        },
        file2: {
          fileName: file2Name,
          totalNPANXX: table2Count,
          uniqueNPA: 0, // Will be calculated below
          uniqueNXX: 0, // Can be added if needed
          coveragePercentage: 0, // Can be added if needed
          rateStats: {
            interstate: file2InterStats,
            intrastate: file2IntraStats,
            indeterminate: file2IndetermStats,
          },
        },
        matchedCodes: 0,
        nonMatchedCodes: 0,
        matchedCodesPercentage: 0,
        nonMatchedCodesPercentage: 0,
        matchedNPAs: 0,
        totalUniqueNPAs: 0,
      };

      // --- Calculate Matching and NPA Stats ---
      const file1NPAs = new Set<string>();
      const file2NPAs = new Set<string>();
      const matchedNPAsSet = new Set<string>();
      const allUniqueNPAsSet = new Set<string>();

      // Use fetched data instead of querying Dexie again
      const table2Map = new Map<string, { npa: string }>();
      file2Data.forEach((record) => {
        table2Map.set(record.npanxx, { npa: record.npa });
        file2NPAs.add(record.npa);
        allUniqueNPAsSet.add(record.npa);
      });

      let matchCount = 0;
      file1Data.forEach((record) => {
        file1NPAs.add(record.npa);
        allUniqueNPAsSet.add(record.npa);

        const matchInFile2 = table2Map.get(record.npanxx);
        if (matchInFile2) {
          matchCount++;
          if (record.npa === matchInFile2.npa) {
            matchedNPAsSet.add(record.npa);
          }
        }
      });

      // --- Populate Final Report Stats ---
      report.matchedCodes = matchCount;
      // Calculate non-matched based on total unique codes across both files
      const allNpanxx = new Set([
        ...file1Data.map((r) => r.npanxx),
        ...file2Data.map((r) => r.npanxx),
      ]);
      report.nonMatchedCodes = allNpanxx.size - matchCount;
      report.matchedCodesPercentage = allNpanxx.size > 0 ? (matchCount / allNpanxx.size) * 100 : 0;
      report.nonMatchedCodesPercentage =
        allNpanxx.size > 0 ? ((allNpanxx.size - matchCount) / allNpanxx.size) * 100 : 0;

      report.matchedNPAs = matchedNPAsSet.size;
      report.totalUniqueNPAs = allUniqueNPAsSet.size;

      report.file1.uniqueNPA = file1NPAs.size;
      report.file2.uniqueNPA = file2NPAs.size;
      // Note: uniqueNXX calculation would require similar tracking if needed

      console.log('[USService] Code Report Generated:', report);

      return report;
    } catch (error) {
      console.error('[USService] Error generating code report:', error);
      throw error;
    }
  }

  /**
   * Fetches the detailed comparison results from Dexie and calculates summary statistics.
   *
   * @param file1Name Name of the first file.
   * @param file2Name Name of the second file.
   * @returns Promise<USPricingReport>
   */
  async fetchPricingReportSummary(file1Name: string, file2Name: string): Promise<USPricingReport> {
    console.log('[USService] Fetching pricing report summary...');
    this.store.setPricingReportProcessing(true);
    const comparisonDbName = DBName.US_PRICING_COMPARISON;
    // Use the fixed table name
    const comparisonTableName = 'comparison_results';

    try {
      const comparisonDb = await this.dexieDB.getDB(comparisonDbName);

      // Check if the fixed table exists before trying to read from it
      if (!comparisonDb.tables.some((t) => t.name === comparisonTableName)) {
        console.warn(
          `[USService] Comparison table ${comparisonTableName} not found in ${comparisonDbName}. Cannot generate summary.`
        );
        // Return a default/empty report
        return {
          file1: {
            fileName: file1Name,
            averageInterRate: 0,
            averageIntraRate: 0,
            averageIJRate: 0,
            medianInterRate: 0,
            medianIntraRate: 0,
            medianIJRate: 0,
          },
          file2: {
            fileName: file2Name,
            averageInterRate: 0,
            averageIntraRate: 0,
            averageIJRate: 0,
            medianInterRate: 0,
            medianIntraRate: 0,
            medianIJRate: 0,
          },
          comparison: {
            interRateDifference: 0,
            intraRateDifference: 0,
            ijRateDifference: 0,
            totalHigher: 0,
            totalLower: 0,
            totalEqual: 0,
          },
        };
      }

      // Read from the fixed table name
      const comparisonData = await comparisonDb
        .table<USPricingComparisonRecord>(comparisonTableName) // Use fixed name
        .toArray();

      console.log(
        `[USService] Fetched ${comparisonData.length} comparison records from ${comparisonTableName}.`
      );

      // --- Calculate Summary Stats ---
      const file1InterRates: number[] = [];
      const file1IntraRates: number[] = [];
      const file1IndetermRates: number[] = [];
      const file2InterRates: number[] = [];
      const file2IntraRates: number[] = [];
      const file2IndetermRates: number[] = [];

      let totalHigher = 0; // File 1 is cheaper
      let totalLower = 0; // File 2 is cheaper
      let totalEqual = 0; // Rates are the same

      const matchedInterDiffs: number[] = [];
      const matchedIntraDiffs: number[] = [];
      const matchedIndetermDiffs: number[] = [];

      comparisonData.forEach((record) => {
        // Collect rates for File 1 (present in file 1)
        // Note: We are assuming records only contain matched data now
        file1InterRates.push(record.file1_inter);
        file1IntraRates.push(record.file1_intra);
        file1IndetermRates.push(record.file1_indeterm);

        // Collect rates for File 2 (present in file 2)
        file2InterRates.push(record.file2_inter);
        file2IntraRates.push(record.file2_intra);
        file2IndetermRates.push(record.file2_indeterm);

        // Analyze matched records for differences and cheaper file
        // Use cheaper_inter as the primary indicator for this summary count
        if (record.cheaper_inter === 'file1') totalHigher++;
        else if (record.cheaper_inter === 'file2') totalLower++;
        else if (record.cheaper_inter === 'same') totalEqual++;

        // Collect absolute differences for matched records
        // No null check needed as we only store matched records
        matchedInterDiffs.push(record.diff_inter_abs);
        matchedIntraDiffs.push(record.diff_intra_abs);
        matchedIndetermDiffs.push(record.diff_indeterm_abs);
      });

      // Calculate stats for File 1
      const file1InterStats = this.calculateRateStats(file1InterRates);
      const file1IntraStats = this.calculateRateStats(file1IntraRates);
      const file1IndetermStats = this.calculateRateStats(file1IndetermRates);

      // Calculate stats for File 2
      const file2InterStats = this.calculateRateStats(file2InterRates);
      const file2IntraStats = this.calculateRateStats(file2IntraRates);
      const file2IndetermStats = this.calculateRateStats(file2IndetermRates);

      // Calculate average differences (absolute)
      const avgInterDiff =
        matchedInterDiffs.reduce((s, v) => s + v, 0) / (matchedInterDiffs.length || 1);
      const avgIntraDiff =
        matchedIntraDiffs.reduce((s, v) => s + v, 0) / (matchedIntraDiffs.length || 1);
      const avgIndetermDiff =
        matchedIndetermDiffs.reduce((s, v) => s + v, 0) / (matchedIndetermDiffs.length || 1);

      // --- Construct the final report ---=
      const report: USPricingReport = {
        file1: {
          fileName: file1Name,
          averageInterRate: file1InterStats.average,
          averageIntraRate: file1IntraStats.average,
          averageIJRate: file1IndetermStats.average, // Using Indeterminate as IJRate
          medianInterRate: file1InterStats.median,
          medianIntraRate: file1IntraStats.median,
          medianIJRate: file1IndetermStats.median, // Using Indeterminate as IJRate
        },
        file2: {
          fileName: file2Name,
          averageInterRate: file2InterStats.average,
          averageIntraRate: file2IntraStats.average,
          averageIJRate: file2IndetermStats.average, // Using Indeterminate as IJRate
          medianInterRate: file2InterStats.median,
          medianIntraRate: file2IntraStats.median,
          medianIJRate: file2IndetermStats.median, // Using Indeterminate as IJRate
        },
        comparison: {
          // Average difference (File2 - File1)
          interRateDifference: avgInterDiff,
          intraRateDifference: avgIntraDiff,
          ijRateDifference: avgIndetermDiff, // Using Indeterminate as IJRate
          totalHigher, // Count where file1 is cheaper
          totalLower, // Count where file2 is cheaper
          totalEqual, // Count where rates are the same
        },
      };

      console.log('[USService] Calculated final pricing summary:', report);
      return report;
    } catch (error) {
      console.error('[USService] Error fetching pricing report summary:', error);
      this.store.setPricingReportProcessing(false); // Ensure loading state is reset on error
      // Consider returning a specific error object or re-throwing
      throw new Error(`Failed to fetch or process pricing summary: ${error}`);
    } finally {
      this.store.setPricingReportProcessing(false); // Ensure loading state is always reset
    }
  }
}
