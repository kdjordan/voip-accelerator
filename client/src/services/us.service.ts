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
  USFileReport,
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

interface ComparisonProgress {
  processedCount: number;
  matchCount: number;
}

declare global {
  interface Window {
    db: any;
  }
}

export class USService {
  private store: UsStore;
  private lergStore = useLergStore(); // Add instance of lergStore
  private dexieDB = useDexieDB(); // Add instance of dexieDB composable

  constructor() {
    this.store = useUsStore() as unknown as UsStore;
    console.log('Initializing simplified US service');
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
        return count;
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
    return await window.db.table(tableName).count();
  }

  async processComparisons(file1Name: string, file2Name: string): Promise<void> {
    try {
      console.log(
        '[USService] Starting detailed comparison process with files:',
        file1Name,
        file2Name
      );

      // Get table names by removing .csv extension
      const table1Name = file1Name.toLowerCase().replace('.csv', '');
      const table2Name = file2Name.toLowerCase().replace('.csv', '');

      console.log(`[USService] Comparing tables: ${table1Name} and ${table2Name}`);

      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);
      const comparisonTable = db.table<USPricingComparisonRecord, string>('us_pricing_comparison');

      // Clear existing comparison data
      console.log('[USService] Clearing existing comparison data...');
      await comparisonTable.clear();
      console.log('[USService] Existing comparison data cleared.');

      // Load LERG data (NPA -> State mapping, etc.)
      if (!this.lergStore.isLoaded) {
        console.warn('[USService] LERG data might not be loaded. Proceeding anyway.');
      }

      // Load all data from table2 into a Map for efficient lookup
      console.log(`[USService] Loading data from table: ${table2Name}...`);
      const table2Data = await db.table<USStandardizedData>(table2Name).toArray();
      const table2Map = new Map<string, USStandardizedData>();
      table2Data.forEach((record) => table2Map.set(record.npanxx, record));
      console.log(`[USService] Loaded ${table2Map.size} records from ${table2Name} into map.`);

      // Prepare array for bulk insertion
      const resultsToInsert: USPricingComparisonRecord[] = [];
      let processedCount = 0;

      // Iterate through table1
      console.log(`[USService] Iterating through table: ${table1Name} and comparing...`);
      await db.table<USStandardizedData>(table1Name).each((record1) => {
        processedCount++;
        const npanxx = record1.npanxx;
        const record2 = table2Map.get(npanxx);

        if (record2) {
          // Match found, perform comparison
          const diff_inter_abs = record2.interRate - record1.interRate;
          const diff_intra_abs = record2.intraRate - record1.intraRate;
          const diff_indeterm_abs = record2.indetermRate - record1.indetermRate;

          // Calculate percentage differences (handle division by zero)
          const diff_inter_pct =
            record1.interRate === 0
              ? diff_inter_abs === 0
                ? 0
                : Infinity * Math.sign(diff_inter_abs)
              : (diff_inter_abs / record1.interRate) * 100;
          const diff_intra_pct =
            record1.intraRate === 0
              ? diff_intra_abs === 0
                ? 0
                : Infinity * Math.sign(diff_intra_abs)
              : (diff_intra_abs / record1.intraRate) * 100;
          const diff_indeterm_pct =
            record1.indetermRate === 0
              ? diff_indeterm_abs === 0
                ? 0
                : Infinity * Math.sign(diff_indeterm_abs)
              : (diff_indeterm_abs / record1.indetermRate) * 100;

          // Determine cheaper file (simplified - could be more granular per rate type)
          // For now, let's base it on the sum of rates or a primary rate like interRate
          let cheaper_file: 'file1' | 'file2' | 'same' = 'same';
          if (diff_inter_abs > 0) cheaper_file = 'file1';
          else if (diff_inter_abs < 0) cheaper_file = 'file2';
          // Add more complex logic if needed based on intra/indeterm rates

          // Lookup LERG data
          const npa = record1.npa;
          const locationInfo = this.lergStore.getStateByNpa(npa);
          const stateCode = locationInfo?.state ?? 'N/A';
          const countryCode = locationInfo?.country ?? 'N/A';
          const nxx = record1.nxx;

          // Construct result object
          const comparisonRecord: USPricingComparisonRecord = {
            npanxx,
            npa,
            nxx,
            stateCode,
            countryCode,
            diff_inter_pct: parseFloat(diff_inter_pct.toFixed(4)), // Store as number
            diff_intra_pct: parseFloat(diff_intra_pct.toFixed(4)),
            diff_indeterm_pct: parseFloat(diff_indeterm_pct.toFixed(4)),
            diff_inter_abs: parseFloat(diff_inter_abs.toFixed(6)), // Store with precision
            diff_intra_abs: parseFloat(diff_intra_abs.toFixed(6)),
            diff_indeterm_abs: parseFloat(diff_indeterm_abs.toFixed(6)),
            file1_inter: record1.interRate,
            file1_intra: record1.intraRate,
            file1_indeterm: record1.indetermRate,
            file2_inter: record2.interRate,
            file2_intra: record2.intraRate,
            file2_indeterm: record2.indetermRate,
            cheaper_file,
          };

          resultsToInsert.push(comparisonRecord);
        }
        // If no match in table2, record1.npanxx is unique to file1. Decide if/how to handle this.
        // Current plan focuses on matched NPANXX.

        // Optional: Log progress periodically
        if (processedCount % 10000 === 0) {
          console.log(`[USService] Processed ${processedCount} records from ${table1Name}...`);
        }
      });

      // Bulk insert results
      if (resultsToInsert.length > 0) {
        console.log(
          `[USService] Inserting ${resultsToInsert.length} comparison records into us_pricing_comparison table...`
        );
        await comparisonTable.bulkPut(resultsToInsert);
        console.log('[USService] Comparison records inserted successfully.');
      } else {
        console.log('[USService] No matching NPANXX found between the two files to compare.');
      }

      console.log(
        `[USService] Comparison process completed. Processed ${processedCount} records from ${table1Name}. Found ${resultsToInsert.length} matches.`
      );

      // TODO: Update overall summary stats in the Pinia store if needed,
      // based on the generated comparison data or separate calculations.
      // The old calculation logic below is now replaced.
    } catch (error) {
      console.error('[USService] Error during detailed comparison process:', error);
      // Consider updating Pinia store with error state
      throw error; // Re-throw error for handling upstream
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
   * Generates a detailed NPANXX-level pricing comparison between two rate decks.
   *
   * @param table1Name The Dexie table name for the first file.
   * @param table2Name The Dexie table name for the second file.
   */
  async generatePricingComparison(table1Name: string, table2Name: string): Promise<void> {
    console.log(`[USService] Starting pricing comparison between ${table1Name} and ${table2Name}`);
    const comparisonTableName = DBName.US_PRICING_COMPARISON; // This is the DB name
    const comparisonResultsTableName = 'comparison_results'; // This is the TABLE name
    const comparisonResults: USPricingComparisonRecord[] = [];
    const matchedFile2Npanxx = new Set<string>();

    try {
      // 0. Get DB instances
      const usDb = await this.dexieDB.getDB(DBName.US);
      const comparisonDb = await this.dexieDB.getDB(comparisonTableName); // Get DB using DB name

      // 1. Clear previous comparison results
      console.log(`[USService] Clearing old data from ${comparisonResultsTableName}...`);
      await comparisonDb.table(comparisonResultsTableName).clear(); // Use TABLE name here

      // 2. Iterate through file 1 (table1Name)
      console.log(`[USService] Iterating through ${table1Name}...`);
      await usDb.table(table1Name).each(async (record1: USStandardizedData) => {
        const npanxx = record1.npanxx;

        // 3. Query file 2 (table2Name) for a match
        const record2 = await usDb.table(table2Name).get(npanxx);

        // 4. LERG Lookup (needed for both matched and unmatched)
        const location = this.lergStore.getLocationByNPA(record1.npa);
        const stateCode =
          location?.country === 'US' || location?.country === 'CA' ? location.region : '';
        const countryCode = location?.country || '';

        if (record2) {
          // 4a. Match found
          matchedFile2Npanxx.add(npanxx); // Track matched NPANXX from file 2

          // *** START DEBUG LOGS ***
          // Log details for the first few matches found
          if (comparisonResults.length < 5) {
            console.log(`[DEBUG ${npanxx}] Match found. Record1:`, record1);
            console.log(`[DEBUG ${npanxx}] Match found. Record2:`, record2);
            console.log(
              `[DEBUG ${npanxx}] Rates: file1_inter=${record1.interRate}, file2_inter=${record2.interRate}`
            );
          }
          // *** END DEBUG LOGS ***

          // Calculate differences (handle division by zero)
          const diff_inter_abs = record2.interRate - record1.interRate;
          const diff_intra_abs = record2.intraRate - record1.intraRate;
          const diff_indeterm_abs = record2.indetermRate - record1.indetermRate;

          // *** START DEBUG LOGS ***
          // Log details for the first few matches found
          if (comparisonResults.length < 5) {
            console.log(`[DEBUG ${npanxx}] Calculated diff_inter_abs:`, diff_inter_abs);
          }
          // *** END DEBUG LOGS ***

          const diff_inter_pct =
            record1.interRate !== 0
              ? (diff_inter_abs / record1.interRate) * 100
              : diff_inter_abs > 0
              ? Infinity
              : diff_inter_abs < 0
              ? -Infinity
              : 0;
          const diff_intra_pct =
            record1.intraRate !== 0
              ? (diff_intra_abs / record1.intraRate) * 100
              : diff_intra_abs > 0
              ? Infinity
              : diff_intra_abs < 0
              ? -Infinity
              : 0;
          const diff_indeterm_pct =
            record1.indetermRate !== 0
              ? (diff_indeterm_abs / record1.indetermRate) * 100
              : diff_indeterm_abs > 0
              ? Infinity
              : diff_indeterm_abs < 0
              ? -Infinity
              : 0;

          // Determine cheaper file (simple comparison for now)
          let cheaper_file: 'file1' | 'file2' | 'same' = 'same';
          // Add logic to compare rates if needed, e.g., based on average or specific rate types
          // For now, just marking as 'same' or based on a primary rate like interstate
          if (diff_inter_abs < 0) cheaper_file = 'file1';
          else if (diff_inter_abs > 0) cheaper_file = 'file2';

          comparisonResults.push({
            npanxx,
            npa: record1.npa,
            nxx: record1.nxx,
            stateCode,
            countryCode,
            file1_inter: record1.interRate,
            file1_intra: record1.intraRate,
            file1_indeterm: record1.indetermRate,
            file2_inter: record2.interRate,
            file2_intra: record2.intraRate,
            file2_indeterm: record2.indetermRate,
            diff_inter_abs,
            diff_intra_abs,
            diff_indeterm_abs,
            diff_inter_pct,
            diff_intra_pct,
            diff_indeterm_pct,
            cheaper_file,
          });

          // *** START DEBUG LOGS ***
          // Log details for the first few matches found
          if (comparisonResults.length < 5) {
            console.log(
              `[DEBUG ${npanxx}] Pushed record:`,
              comparisonResults[comparisonResults.length - 1]
            );
          }
          // *** END DEBUG LOGS ***
        } else {
          // 4b. No match found (unique to file 1)
          comparisonResults.push({
            npanxx,
            npa: record1.npa,
            nxx: record1.nxx,
            stateCode,
            countryCode,
            file1_inter: record1.interRate,
            file1_intra: record1.intraRate,
            file1_indeterm: record1.indetermRate,
            file2_inter: null,
            file2_intra: null,
            file2_indeterm: null,
            diff_inter_abs: null,
            diff_intra_abs: null,
            diff_indeterm_abs: null,
            diff_inter_pct: null,
            diff_intra_pct: null,
            diff_indeterm_pct: null,
            cheaper_file: 'file1_only',
          });
        }
      });

      // 5. Iterate through file 2 (table2Name) for unmatched records
      console.log(`[USService] Checking ${table2Name} for unique records...`);
      await usDb.table(table2Name).each(async (record2: USStandardizedData) => {
        if (!matchedFile2Npanxx.has(record2.npanxx)) {
          // 5a. Unique to File 2
          const location = this.lergStore.getLocationByNPA(record2.npa);
          const stateCode =
            location?.country === 'US' || location?.country === 'CA' ? location.region : '';
          const countryCode = location?.country || '';

          comparisonResults.push({
            npanxx: record2.npanxx,
            npa: record2.npa,
            nxx: record2.nxx,
            stateCode,
            countryCode,
            file1_inter: null,
            file1_intra: null,
            file1_indeterm: null,
            file2_inter: record2.interRate,
            file2_intra: record2.intraRate,
            file2_indeterm: record2.indetermRate,
            diff_inter_abs: null,
            diff_intra_abs: null,
            diff_indeterm_abs: null,
            diff_inter_pct: null,
            diff_intra_pct: null,
            diff_indeterm_pct: null,
            cheaper_file: 'file2_only',
          });
        }
      });

      // 6. Bulk insert results
      console.log(
        `[USService] Bulk inserting ${comparisonResults.length} records into ${comparisonResultsTableName}...`
      );
      await comparisonDb.table(comparisonResultsTableName).bulkPut(comparisonResults); // Use TABLE name here
      console.log(`[USService] Pricing comparison completed successfully.`);
    } catch (error) {
      console.error('[USService] Error generating pricing comparison:', error);
      // Optionally, set an error state in the store
      // this.store.setError('Failed to generate pricing comparison');
      throw error; // Re-throw the error to be caught by the caller
    }
  }

  /**
   * Fetches the detailed comparison results from Dexie and calculates summary statistics.
   *
   * @param file1Name The filename of the first uploaded file.
   * @param file2Name The filename of the second uploaded file.
   * @returns A promise that resolves with the USPricingReport summary.
   */
  async fetchPricingReportSummary(file1Name: string, file2Name: string): Promise<USPricingReport> {
    console.log('[USService] Fetching pricing report summary...');
    this.store.setPricingReportProcessing(true); // Set loading state to true
    const comparisonTableName = DBName.US_PRICING_COMPARISON;
    const comparisonResultsTableName = 'comparison_results';

    try {
      const comparisonDb = await this.dexieDB.getDB(comparisonTableName);
      const comparisonData = await comparisonDb
        .table<USPricingComparisonRecord>(comparisonResultsTableName)
        .toArray();

      console.log(`[USService] Fetched ${comparisonData.length} comparison records.`);

      // Placeholder for actual calculation logic
      // TODO: Implement detailed calculations based on comparisonData
      //       - Calculate averages/medians for file1 rates where file1_inter is not null
      //       - Calculate averages/medians for file2 rates where file2_inter is not null
      //       - Calculate differences based on matched records ('same', 'file1', 'file2')
      //       - Count higher/lower/equal based on 'cheaper_file' or rate diffs

      const placeholderReport: USPricingReport = {
        file1: {
          fileName: file1Name,
          averageInterRate: 0,
          averageIntraRate: 0,
          averageIJRate: 0, // Use IJRate to match type
          medianInterRate: 0,
          medianIntraRate: 0,
          medianIJRate: 0, // Use IJRate to match type
        },
        file2: {
          fileName: file2Name,
          averageInterRate: 0,
          averageIntraRate: 0,
          averageIJRate: 0, // Use IJRate to match type
          medianInterRate: 0,
          medianIntraRate: 0,
          medianIJRate: 0, // Use IJRate to match type
        },
        comparison: {
          interRateDifference: 0,
          intraRateDifference: 0,
          ijRateDifference: 0, // Use IJRate to match type
          totalHigher: 0, // Count where cheaper_file is 'file1'
          totalLower: 0, // Count where cheaper_file is 'file2'
          totalEqual: 0, // Count where cheaper_file is 'same'
        },
      };

      console.log('[USService] Returning placeholder pricing summary.');
      return placeholderReport;
    } catch (error) {
      console.error('[USService] Error fetching pricing report summary:', error);
      throw error;
    } finally {
      this.store.setPricingReportProcessing(false); // Set loading state to false
    }
  }
}
