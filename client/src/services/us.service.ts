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
      const lergStore = useLergStore();
      if (!lergStore.isLoaded) {
        console.warn('[USService] LERG data might not be loaded. Proceeding anyway.');
      }

      // Create a set of all NPAs from the file
      const allFileNPAs = new Set(data.map((item) => item.npa));

      // Count how many valid US NPAs are in our file (those that exist in LERG data)
      let validUSNPAsInFile = 0;

      // Get all US NPAs from LERG data
      const lergUSNPAs = new Set<string>();
      Object.entries(lergStore.stateNPAs)
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
      const totalUSNPAs = lergStore.getTotalUSNPAs;
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
      const lergStore = useLergStore();
      if (!lergStore.isLoaded) {
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
          const locationInfo = lergStore.getStateByNpa(npa);
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

  private createFileReport(fileName: string, totalCodes: number, stats: RateStats): USFileReport {
    return {
      fileName,
      totalNPANXX: totalCodes,
      uniqueNPA: 0, // These will be calculated separately
      uniqueNXX: 0,
      coveragePercentage: 0,
      rateStats: {
        interstate: stats,
        intrastate: stats,
        indeterminate: stats,
      },
    };
  }

  async makeUsCodeReport(file1Name: string, file2Name: string): Promise<USCodeReport> {
    try {
      console.log('[USService] Starting code report generation');

      const table1 = file1Name.toLowerCase().replace('.csv', '');
      const table2 = file2Name.toLowerCase().replace('.csv', '');

      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);

      const table1Count = await db.table(table1).count();
      const table2Count = await db.table(table2).count();

      console.log(
        `[USService] Table counts - ${table1}: ${table1Count}, ${table2}: ${table2Count}`
      );

      const report: USCodeReport = {
        file1: {
          fileName: file1Name,
          totalNPANXX: table1Count,
          uniqueNPA: 0,
          uniqueNXX: 0,
          coveragePercentage: 0,
          rateStats: {
            interstate: { average: 0, median: 0, min: 0, max: 0, count: 0 },
            intrastate: { average: 0, median: 0, min: 0, max: 0, count: 0 },
            indeterminate: { average: 0, median: 0, min: 0, max: 0, count: 0 },
          },
        },
        file2: {
          fileName: file2Name,
          totalNPANXX: table2Count,
          uniqueNPA: 0,
          uniqueNXX: 0,
          coveragePercentage: 0,
          rateStats: {
            interstate: { average: 0, median: 0, min: 0, max: 0, count: 0 },
            intrastate: { average: 0, median: 0, min: 0, max: 0, count: 0 },
            indeterminate: { average: 0, median: 0, min: 0, max: 0, count: 0 },
          },
        },
        matchedCodes: 0,
        nonMatchedCodes: 0,
        matchedCodesPercentage: 0,
        nonMatchedCodesPercentage: 0,
        matchedNPAs: 0,
        totalUniqueNPAs: 0,
      };

      // Sets to track NPAs
      const file1NPAs = new Set<string>();
      const file2NPAs = new Set<string>();
      const matchedNPAsSet = new Set<string>();
      const allUniqueNPAsSet = new Set<string>();

      // Get all records from table2 for efficient lookup (NPANXX and NPA)
      const table2Data = new Map<string, { npa: string }>();
      await db.table(table2).each((record) => {
        table2Data.set(record.npanxx, { npa: record.npa });
        file2NPAs.add(record.npa); // Track unique NPAs from file 2
        allUniqueNPAsSet.add(record.npa); // Add to overall unique NPAs
      });

      console.log(
        `[USService] Loaded ${table2Data.size} NPANXXs and ${file2NPAs.size} unique NPAs from ${table2}`
      );

      // Process table1, track NPAs, and check against table2's data
      let matchCount = 0;
      await db.table(table1).each((record) => {
        file1NPAs.add(record.npa); // Track unique NPAs from file 1
        allUniqueNPAsSet.add(record.npa); // Add to overall unique NPAs

        const matchInFile2 = table2Data.get(record.npanxx);
        if (matchInFile2) {
          matchCount++;
          // If NPANXX matches, check if NPA also matches (it should, but good practice)
          // And add the NPA to the matched set
          if (record.npa === matchInFile2.npa) {
            matchedNPAsSet.add(record.npa);
          }
        }
      });

      console.log(`[USService] Found ${matchCount} NPANXX matches between tables`);
      console.log(`[USService] Found ${matchedNPAsSet.size} matched unique NPAs`);
      console.log(`[USService] Found ${allUniqueNPAsSet.size} total unique NPAs across both files`);

      // Calculate and populate statistics
      report.matchedCodes = matchCount;
      report.nonMatchedCodes = table1Count - matchCount; // Based on file1's perspective
      report.matchedCodesPercentage = table1Count > 0 ? (matchCount / table1Count) * 100 : 0;
      report.nonMatchedCodesPercentage =
        table1Count > 0 ? ((table1Count - matchCount) / table1Count) * 100 : 0;

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
}
