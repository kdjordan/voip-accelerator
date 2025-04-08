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
      const totalUSNPAs = lergStore.getTotalUSNPAs;

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
      console.log('[USService] Starting comparison process with files:', file1Name, file2Name);

      // Get table names by removing .csv extension
      const table1 = file1Name.toLowerCase().replace('.csv', '');
      const table2 = file2Name.toLowerCase().replace('.csv', '');

      console.log(`[USService] Comparing tables: ${table1} and ${table2}`);

      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);

      const stats = {
        processedCount: 0,
        matchCount: 0,
        uniqueNPAs: new Set<string>(),
        matchedNPAs: new Set<string>(),
        totalInter: 0,
        totalIntra: 0,
        totalIndeterm: 0,
        interCount: 0,
        intraCount: 0,
        indetermCount: 0,
      };

      // Initialize reports with proper structure
      const pricingReport: USPricingReport = {
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

      const codeReport: USCodeReport = {
        file1: {
          fileName: file1Name,
          totalNPANXX: 0,
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
          totalNPANXX: 0,
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

      // Track unique NPAs and NXXs for each file
      const file1NPAs = new Set<string>();
      const file1NXXs = new Set<string>();
      const file2NPAs = new Set<string>();
      const file2NXXs = new Set<string>();

      // Arrays to store rates for calculations
      const file1Rates = {
        inter: [] as number[],
        intra: [] as number[],
        indeterm: [] as number[],
      };
      const file2Rates = {
        inter: [] as number[],
        intra: [] as number[],
        indeterm: [] as number[],
      };

      // Get total records for both files
      const file1Count = await db.table(table1).count();
      const file2Count = await db.table(table2).count();

      console.log(`[USService] File counts - ${table1}: ${file1Count}, ${table2}: ${file2Count}`);

      // Use a regular for...of loop instead of each() to handle async properly
      const records = await db.table(table1).toArray();
      console.log(`[USService] Processing ${records.length} records from ${table1}`);

      for (const record1 of records) {
        // Add rates from file1
        file1Rates.inter.push(record1.interRate);
        file1Rates.intra.push(record1.intraRate);
        file1Rates.indeterm.push(record1.indetermRate);

        // Look up matching record in table2
        const record2 = await db.table(table2).get(record1.npanxx);

        if (record2) {
          // Add rates from file2 when we find a match
          file2Rates.inter.push(record2.interRate);
          file2Rates.intra.push(record2.intraRate);
          file2Rates.indeterm.push(record2.indetermRate);

          // Compare rates
          if (
            record2.interRate > record1.interRate ||
            record2.intraRate > record1.intraRate ||
            record2.indetermRate > record1.indetermRate
          ) {
            pricingReport.comparison.totalHigher++;
          } else if (
            record2.interRate < record1.interRate ||
            record2.intraRate < record1.intraRate ||
            record2.indetermRate < record1.indetermRate
          ) {
            pricingReport.comparison.totalLower++;
          } else {
            pricingReport.comparison.totalEqual++;
          }

          stats.matchCount++;
        }
      }

      // Calculate averages and medians for file1
      const file1InterTotal = file1Rates.inter.reduce((sum, rate) => sum + rate, 0);
      const file1IntraTotal = file1Rates.intra.reduce((sum, rate) => sum + rate, 0);
      const file1IndetermTotal = file1Rates.indeterm.reduce((sum, rate) => sum + rate, 0);

      pricingReport.file1.averageInterRate = file1InterTotal / file1Rates.inter.length;
      pricingReport.file1.averageIntraRate = file1IntraTotal / file1Rates.intra.length;
      pricingReport.file1.averageIJRate = file1IndetermTotal / file1Rates.indeterm.length;

      // Sort arrays for median calculation
      file1Rates.inter.sort((a, b) => a - b);
      file1Rates.intra.sort((a, b) => a - b);
      file1Rates.indeterm.sort((a, b) => a - b);

      pricingReport.file1.medianInterRate = this.calculateMedian(file1Rates.inter);
      pricingReport.file1.medianIntraRate = this.calculateMedian(file1Rates.intra);
      pricingReport.file1.medianIJRate = this.calculateMedian(file1Rates.indeterm);

      // Calculate averages and medians for file2
      const file2InterTotal = file2Rates.inter.reduce((sum, rate) => sum + rate, 0);
      const file2IntraTotal = file2Rates.intra.reduce((sum, rate) => sum + rate, 0);
      const file2IndetermTotal = file2Rates.indeterm.reduce((sum, rate) => sum + rate, 0);

      pricingReport.file2.averageInterRate = file2InterTotal / file2Rates.inter.length;
      pricingReport.file2.averageIntraRate = file2IntraTotal / file2Rates.intra.length;
      pricingReport.file2.averageIJRate = file2IndetermTotal / file2Rates.indeterm.length;

      // Sort arrays for median calculation
      file2Rates.inter.sort((a, b) => a - b);
      file2Rates.intra.sort((a, b) => a - b);
      file2Rates.indeterm.sort((a, b) => a - b);

      pricingReport.file2.medianInterRate = this.calculateMedian(file2Rates.inter);
      pricingReport.file2.medianIntraRate = this.calculateMedian(file2Rates.intra);
      pricingReport.file2.medianIJRate = this.calculateMedian(file2Rates.indeterm);

      // Calculate rate differences
      pricingReport.comparison.interRateDifference =
        pricingReport.file2.averageInterRate - pricingReport.file1.averageInterRate;
      pricingReport.comparison.intraRateDifference =
        pricingReport.file2.averageIntraRate - pricingReport.file1.averageIntraRate;
      pricingReport.comparison.ijRateDifference =
        pricingReport.file2.averageIJRate - pricingReport.file1.averageIJRate;

      // Calculate code report statistics
      codeReport.file1.totalNPANXX = records.length;
      codeReport.file2.totalNPANXX = await db.table(table2).count();
      codeReport.matchedCodes = stats.matchCount;
      codeReport.nonMatchedCodes = records.length - stats.matchCount;
      codeReport.matchedCodesPercentage = (stats.matchCount / records.length) * 100;
      codeReport.nonMatchedCodesPercentage =
        ((records.length - stats.matchCount) / records.length) * 100;

      console.log('==================== FINAL REPORTS ====================');
      console.log('PRICING REPORT:', JSON.stringify(pricingReport, null, 2));
      console.log('CODE REPORT:', JSON.stringify(codeReport, null, 2));
      console.log('=====================================================');

      // Update store with both reports
      this.store.setReports(pricingReport, codeReport);

      console.log(
        `[USService] Comparison completed. Processed ${stats.processedCount} records with ${stats.matchCount} matches`
      );
    } catch (error) {
      console.error('[USService] Error during comparison:', error);
      throw error;
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

      // Get table names by removing .csv extension
      const table1 = file1Name.toLowerCase().replace('.csv', '');
      const table2 = file2Name.toLowerCase().replace('.csv', '');

      const { getDB } = useDexieDB();
      const db = await getDB(DBName.US);

      // Get total counts for both tables
      const table1Count = await db.table(table1).count();
      const table2Count = await db.table(table2).count();

      console.log(
        `[USService] Table counts - ${table1}: ${table1Count}, ${table2}: ${table2Count}`
      );

      // Initialize report structure
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

      // Get all NPANXXs from table2 for efficient lookup
      const table2NPANXXs = new Set();
      await db.table(table2).each((record) => {
        table2NPANXXs.add(record.npanxx);
      });

      console.log(`[USService] Loaded ${table2NPANXXs.size} NPANXXs from ${table2} for comparison`);

      // Process table1 and check against table2's NPANXXs
      let matchCount = 0;
      await db.table(table1).each((record) => {
        if (table2NPANXXs.has(record.npanxx)) {
          matchCount++;
        }
      });

      console.log(`[USService] Found ${matchCount} matches between tables`);

      // Calculate statistics
      report.matchedCodes = matchCount;
      report.nonMatchedCodes = table1Count - matchCount;
      report.matchedCodesPercentage = (matchCount / table1Count) * 100;
      report.nonMatchedCodesPercentage = ((table1Count - matchCount) / table1Count) * 100;

      console.log('[USService] Code Report Generated:', {
        totalRecords: {
          file1: table1Count,
          file2: table2Count,
        },
        matches: matchCount,
        matchPercentage: report.matchedCodesPercentage.toFixed(2) + '%',
      });

      return report;
    } catch (error) {
      console.error('[USService] Error generating code report:', error);
      throw error;
    }
  }
}
