import { type USStandardizedData, type InvalidUsRow } from '@/types/domains/us-types';
import { DBName } from '@/types/app-types';
import { useUsStore } from '@/stores/us-store';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB'; // Direct import of Dexie composable
import { useLergStore } from '@/stores/lerg-store';
import { COUNTRY_CODES } from '@/types/constants/country-codes';
import { DBSchemas } from '@/types/app-types';

import type {
  USPricingReport,
  USCodeReport,
  USComparisonData as USComparison,
  RateStats,
  USPricingComparisonRecord,
  MarginBucketDetail,
  MarginAnalysis,
  ZeroMarginDetail,
  USFileReport,
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
  }

  // Helper to extract the table name from a Dexie schema string
  private _extractTableNameFromSchema(schemaString?: string): string | null {
    if (!schemaString || !schemaString.includes(':')) {
      console.error(
        '[USService] Invalid or missing schema string for table name extraction:',
        schemaString
      );
      return null;
    }
    return schemaString.substring(0, schemaString.indexOf(':')).trim();
  }

  // Process file and store directly in Dexie
  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number,
    indeterminateDefinition?: string
  ): Promise<{ fileName: string; records: USStandardizedData[]; tableName: string }> {
    // Derive table name from file name (removing .csv extension)
    const tableName = file.name.toLowerCase().replace('.csv', '');
    const { storeInDexieDB } = this.dexieDB;

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

            // Register file with component
            this.store.addFileUploaded(componentId, file.name);

            // Calculate and store file stats
            await this.calculateFileStats(componentId, file.name);

            // Resolve with fileName, records, and tableName
            resolve({ fileName: file.name, records: validRecords, tableName });
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

        // If fileName is provided, filter the results to only include records from that file
        if (fileName) {
          const filteredData = data.filter((record) => record.sourceFile === fileName);
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
      for (const npaFromFile of allFileNPAs) {
        const location = this.lergStore.getOptimizedLocationByNPA(npaFromFile);
        if (location && location.country === 'US') {
          validUSNPAsInFile++;
        }
      }

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
      // Find the component ID based on the table name
      const fileName = tableName + '.csv';
      let componentId = '';
      if (this.store.getFileNameByComponent('us1') === fileName) {
        componentId = 'us1';
      } else if (this.store.getFileNameByComponent('us2') === fileName) {
        componentId = 'us2';
      }
      if (componentId) {
        this.store.clearFileStats(componentId);
      }

      // Use the instance-level dexieDB
      const { getDB, deleteTableStore } = this.dexieDB;
      const db = await getDB(DBName.US);

      // Use standard Dexie check for table existence
      if (db.tables.some((table) => table.name === tableName)) {
        // Use deleteTableStore from the composable
        await deleteTableStore(DBName.US, tableName);
      }
    } catch (error) {
      console.error(`[USService] Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }

  // Clear all US data
  async clearData(): Promise<void> {
    try {
      // Use the instance-level dexieDB
      const { getDB, getAllStoreNamesForDB, deleteTableStore } = this.dexieDB;
      const db = await getDB(DBName.US);

      // Use getAllStoreNamesForDB from the composable
      const tableNames = await getAllStoreNamesForDB(DBName.US);
      if (tableNames.length > 0) {
        for (const tableName of tableNames) {
          // Use deleteTableStore from the composable
          await deleteTableStore(DBName.US, tableName);
        }
      }

      // Also clear any associated comparison data
      await this.clearPricingComparisonData();

      // Reset the store state as well
      this.store.resetFiles();
    } catch (error) {
      console.error('[USService] Failed to clear US data:', error);
      throw error;
    }
  }

  // Get record count for a table
  async getRecordCount(tableName: string): Promise<number> {
    try {
      // Use the instance-level dexieDB
      const { getDB } = this.dexieDB;
      const db = await getDB(DBName.US);
      // Use standard Dexie check
      if (!db.tables.some((table) => table.name === tableName)) {
        console.warn(`[USService] Table ${tableName} does not exist in ${DBName.US} for count.`);
        return 0;
      }
      const count = await db.table(tableName).count();
      return count;
    } catch (error) {
      console.error(`[USService] Failed to get record count for table ${tableName}:`, error);
      return 0;
    }
  }

  // List all tables and their record counts
  async listTables(): Promise<Record<string, number>> {
    try {
      // Use the instance-level dexieDB
      const { getAllStoreNamesForDB } = this.dexieDB;
      const tableNames = await getAllStoreNamesForDB(DBName.US);
      const tableCounts: Record<string, number> = {};
      for (const name of tableNames) {
        // Use standard Dexie check before counting (safer)
        const db = await this.dexieDB.getDB(DBName.US);
        if (db.tables.some((table) => table.name === name)) {
          tableCounts[name] = await db.table(name).count();
        } else {
          tableCounts[name] = 0; // Should not happen if getAllStoreNamesForDB is accurate
        }
      }
      return tableCounts;
    } catch (error) {
      console.error('[USService] Failed to list tables:', error);
      return {};
    }
  }

  async getTableCount(tableName: string): Promise<number> {
    try {
      // Use the instance-level dexieDB
      const { getDB } = this.dexieDB;
      const db = await getDB(DBName.US);
      // Use standard Dexie check
      if (!db.tables.some((table) => table.name === tableName)) {
        console.warn(`[USService] Table ${tableName} does not exist in ${DBName.US} for count.`);
        return 0;
      }
      return await db.table(tableName).count();
    } catch (error) {
      console.error(`[USService] Error getting record count for table ${tableName}:`, error);
      return 0;
    }
  }

  async processComparisons(file1Name: string, file2Name: string): Promise<void> {
    const { loadFromDexieDB, getDB } = this.dexieDB;
    const lergStore = useLergStore();

    // Derive table names from file names
    const table1Name = file1Name.toLowerCase().replace('.csv', '');
    const table2Name = file2Name.toLowerCase().replace('.csv', '');

    // Dynamically get the comparison table name from the central schema definition
    const comparisonSchemaString = DBSchemas[DBName.US_PRICING_COMPARISON];
    const comparisonTableName = this._extractTableNameFromSchema(comparisonSchemaString);

    if (!comparisonTableName) {
      // Throw an error if the table name couldn't be extracted (indicates bad schema def)
      throw new Error(
        `Could not extract table name from DBSchemas for ${DBName.US_PRICING_COMPARISON}`
      );
    }

    this.store.setPricingReportProcessing(true);

    try {
      // 1. Load source data from the US rate deck database
      const data1 = await loadFromDexieDB<USStandardizedData>(DBName.US, table1Name);
      const data2 = await loadFromDexieDB<USStandardizedData>(DBName.US, table2Name);

      if (data1.length === 0 || data2.length === 0) {
        console.warn('[USService] One or both source tables are empty. Skipping comparison.');
        this.store.setPricingReportProcessing(false);
        return;
      }

      // 2. Prepare the target database and table for comparison results
      const comparisonDb = await getDB(DBName.US_PRICING_COMPARISON);
      // No need to define schema locally - getDB handles it

      // Ensure DB is open after potential initialization from getDB
      if (!comparisonDb.isOpen()) await comparisonDb.open();

      // Ensure the table exists after getDB initialization
      if (!comparisonDb.tables.some((t) => t.name === comparisonTableName)) {
        console.error(
          `[USService] CRITICAL: Table ${comparisonTableName} does not exist in ${comparisonDb.name} even after getDB.`
        );
        // Handle this critical error - maybe throw, maybe return
        this.store.setPricingReportProcessing(false);
        throw new Error(`Comparison table ${comparisonTableName} could not be initialized.`);
      }

      // Use the extracted table name here
      const comparisonTable = comparisonDb.table<USPricingComparisonRecord>(comparisonTableName);

      // 4. Clear existing comparison data
      await comparisonTable.clear();

      // 5. Create lookup map for faster processing
      const table2Map = new Map<string, USStandardizedData>();
      data2.forEach((record) => table2Map.set(record.npanxx, record));

      const comparisonResults: USPricingComparisonRecord[] = [];
      let matchCount = 0;
      let processedCount = 0;
      const processedNpanxx = new Set<string>(); // Add a Set to track processed NPANXX

      // 6. Iterate through file1, find matches in file2, calculate results
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
            // LERG Lookup - USE OPTIMIZED GETTER
            const location = lergStore.getOptimizedLocationByNPA(record1.npa);
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
        }
      } // End for loop

      // 7. Bulk insert results into the comparison table
      if (comparisonResults.length > 0) {
        await comparisonTable.bulkPut(comparisonResults);
      }
    } catch (error) {
      console.error('[USService] Critical error during US pricing comparison process:', error);
      // Update store or notify user of failure
    } finally {
      this.store.setPricingReportProcessing(false); // Ensure processing state is always reset
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

  // Helper function to initialize MarginBucketDetail
  private createMarginBucketDetail(): MarginBucketDetail {
    return {
      matchInter: 0,
      percentInter: 0,
      matchIntra: 0,
      percentIntra: 0,
    };
  }

  // Helper function to initialize MarginAnalysis
  private createMarginAnalysis(): MarginAnalysis {
    return {
      lessThan10: this.createMarginBucketDetail(),
      between10And20: this.createMarginBucketDetail(),
      between20And30: this.createMarginBucketDetail(),
      between30And40: this.createMarginBucketDetail(),
      between40And50: this.createMarginBucketDetail(),
      between50And60: this.createMarginBucketDetail(),
      between60And70: this.createMarginBucketDetail(),
      between70And80: this.createMarginBucketDetail(),
      between80And90: this.createMarginBucketDetail(),
      between90And100: this.createMarginBucketDetail(),
      greaterThan100: this.createMarginBucketDetail(),
      totalInterMatches: 0,
      totalIntraMatches: 0,
      totalPercentInter: 0,
      totalPercentIntra: 0,
    };
  }

  // Helper function to initialize ZeroMarginDetail
  private createZeroMarginDetail(): ZeroMarginDetail {
    return {
      matchInter: 0,
      percentInter: 0,
      matchIntra: 0,
      percentIntra: 0,
    };
  }

  // Helper method to categorize margin into buckets
  private categorizeMargin(margin: number, analysis: MarginAnalysis, type: 'inter' | 'intra') {
    const marginPercent = margin * 100;
    let bucket: MarginBucketDetail | null = null;

    if (marginPercent < 10) bucket = analysis.lessThan10;
    else if (marginPercent < 20) bucket = analysis.between10And20;
    else if (marginPercent < 30) bucket = analysis.between20And30;
    else if (marginPercent < 40) bucket = analysis.between30And40;
    else if (marginPercent < 50) bucket = analysis.between40And50;
    else if (marginPercent < 60) bucket = analysis.between50And60;
    else if (marginPercent < 70) bucket = analysis.between60And70;
    else if (marginPercent < 80) bucket = analysis.between70And80;
    else if (marginPercent < 90) bucket = analysis.between80And90;
    else if (marginPercent <= 100)
      bucket = analysis.between90And100; // Adjusted to include 100%
    else bucket = analysis.greaterThan100;

    if (bucket) {
      if (type === 'inter') bucket.matchInter++;
      else bucket.matchIntra++;
    }
  }

  // Helper method to calculate percentages for all buckets in an analysis
  private calculateBucketPercentages(
    analysis: MarginAnalysis | undefined,
    totalComparableInter: number,
    totalComparableIntra: number
  ) {
    if (!analysis) return;
    const buckets = [
      analysis.lessThan10,
      analysis.between10And20,
      analysis.between20And30,
      analysis.between30And40,
      analysis.between40And50,
      analysis.between50And60,
      analysis.between60And70,
      analysis.between70And80,
      analysis.between80And90,
      analysis.between90And100,
      analysis.greaterThan100,
    ];

    for (const bucket of buckets) {
      bucket.percentInter =
        totalComparableInter > 0 ? (bucket.matchInter / totalComparableInter) * 100 : 0;
      bucket.percentIntra =
        totalComparableIntra > 0 ? (bucket.matchIntra / totalComparableIntra) * 100 : 0;
    }
  }

  // Helper method to sum total matches and percentages for an analysis
  private sumAnalysisTotals(analysis: MarginAnalysis | undefined) {
    if (!analysis) return;
    analysis.totalInterMatches = 0;
    analysis.totalIntraMatches = 0;
    analysis.totalPercentInter = 0;
    analysis.totalPercentIntra = 0;

    const buckets = [
      analysis.lessThan10,
      analysis.between10And20,
      analysis.between20And30,
      analysis.between30And40,
      analysis.between40And50,
      analysis.between50And60,
      analysis.between60And70,
      analysis.between70And80,
      analysis.between80And90,
      analysis.between90And100,
      analysis.greaterThan100,
    ];

    for (const bucket of buckets) {
      analysis.totalInterMatches += bucket.matchInter;
      analysis.totalIntraMatches += bucket.matchIntra;
      analysis.totalPercentInter += bucket.percentInter;
      analysis.totalPercentIntra += bucket.percentIntra;
    }
  }

  async makeUsCodeReport(file1Name: string, file2Name: string): Promise<USCodeReport> {
    try {
      const table1Name = file1Name.toLowerCase().replace('.csv', '');
      const table2Name = file2Name ? file2Name.toLowerCase().replace('.csv', '') : '';

      const { getDB } = this.dexieDB;
      const usDb = await getDB(DBName.US);

      const file1Data = await usDb.table<USStandardizedData>(table1Name).toArray();
      let file2Data: USStandardizedData[] = [];
      if (table2Name) {
        file2Data = await usDb.table<USStandardizedData>(table2Name).toArray();
      }

      // --- Basic File Stats (largely existing logic) ---
      const file1NPAs = new Set<string>(file1Data.map((r) => r.npa));
      const file1StatsData = {
        inter: this.calculateRateStats(file1Data.map((r) => r.interRate)),
        intra: this.calculateRateStats(file1Data.map((r) => r.intraRate)),
        indeterm: this.calculateRateStats(file1Data.map((r) => r.indetermRate)),
      };
      const reportFile1: USFileReport = {
        fileName: file1Name,
        totalNPANXX: file1Data.length,
        uniqueNPA: file1NPAs.size,
        uniqueNXX: new Set(file1Data.map((r) => r.nxx)).size,
        coveragePercentage: 0, // TODO: Define coverage
        rateStats: {
          interstate: file1StatsData.inter,
          intrastate: file1StatsData.intra,
          indeterminate: file1StatsData.indeterm,
        },
      };

      let reportFile2: USFileReport | undefined = undefined;
      let file2NPAs = new Set<string>();
      if (file2Data.length > 0 && file2Name) {
        file2NPAs = new Set<string>(file2Data.map((r) => r.npa));
        const file2StatsData = {
          inter: this.calculateRateStats(file2Data.map((r) => r.interRate)),
          intra: this.calculateRateStats(file2Data.map((r) => r.intraRate)),
          indeterm: this.calculateRateStats(file2Data.map((r) => r.indetermRate)),
        };
        reportFile2 = {
          fileName: file2Name,
          totalNPANXX: file2Data.length,
          uniqueNPA: file2NPAs.size,
          uniqueNXX: new Set(file2Data.map((r) => r.nxx)).size,
          coveragePercentage: 0, // TODO: Define coverage
          rateStats: {
            interstate: file2StatsData.inter,
            intrastate: file2StatsData.intra,
            indeterminate: file2StatsData.indeterm,
          },
        };
      }

      let matchedCodes = 0;
      let nonMatchedCodes = 0;
      let matchedCodesPercentage = 0;
      let nonMatchedCodesPercentage = 0;
      let matchedNPAs = 0;
      let totalUniqueNPAs = 0;

      let sellToAnalysis: MarginAnalysis | undefined = undefined;
      let buyFromAnalysis: MarginAnalysis | undefined = undefined;
      let zeroMarginDetail: ZeroMarginDetail | undefined = undefined;
      let totalComparableInterCodes = 0;
      let totalComparableIntraCodes = 0;

      if (file1Data.length > 0 && file2Data.length > 0) {
        sellToAnalysis = this.createMarginAnalysis();
        buyFromAnalysis = this.createMarginAnalysis();
        zeroMarginDetail = this.createZeroMarginDetail();

        const file2Map = new Map<string, USStandardizedData>();
        file2Data.forEach((record) => file2Map.set(record.npanxx, record));

        const allNpanxxFile1 = new Set(file1Data.map((r) => r.npanxx));
        const allNpanxxFile2 = new Set(file2Data.map((r) => r.npanxx));
        const allUniqueNpanxxCombined = new Set([...allNpanxxFile1, ...allNpanxxFile2]);

        for (const record1 of file1Data) {
          const record2 = file2Map.get(record1.npanxx);
          if (record2) {
            matchedCodes++;

            // Inter-state rate comparison
            if (typeof record1.interRate === 'number' && typeof record2.interRate === 'number') {
              totalComparableInterCodes++;
              const marginInter = (record2.interRate - record1.interRate) / record1.interRate;

              if (record1.interRate < record2.interRate) {
                // SELL TO opportunity
                this.categorizeMargin(marginInter, sellToAnalysis, 'inter');
              } else if (record1.interRate > record2.interRate) {
                // BUY FROM opportunity
                // For BUY FROM, margin is (R1 - R2) / R1 (how much cheaper we buy than they sell)
                const buyMarginInter = (record1.interRate - record2.interRate) / record1.interRate;
                this.categorizeMargin(buyMarginInter, buyFromAnalysis, 'inter');
              } else {
                // Zero margin
                zeroMarginDetail.matchInter++;
              }
            }

            // Intra-state rate comparison
            if (typeof record1.intraRate === 'number' && typeof record2.intraRate === 'number') {
              totalComparableIntraCodes++;
              const marginIntra = (record2.intraRate - record1.intraRate) / record1.intraRate;

              if (record1.intraRate < record2.intraRate) {
                // SELL TO opportunity
                this.categorizeMargin(marginIntra, sellToAnalysis, 'intra');
              } else if (record1.intraRate > record2.intraRate) {
                // BUY FROM opportunity
                const buyMarginIntra = (record1.intraRate - record2.intraRate) / record1.intraRate;
                this.categorizeMargin(buyMarginIntra, buyFromAnalysis, 'intra');
              } else {
                // Zero margin
                zeroMarginDetail.matchIntra++;
              }
            }
          }
        }
        nonMatchedCodes = allUniqueNpanxxCombined.size - matchedCodes;
        matchedCodesPercentage =
          allUniqueNpanxxCombined.size > 0
            ? (matchedCodes / allUniqueNpanxxCombined.size) * 100
            : 0;
        nonMatchedCodesPercentage =
          allUniqueNpanxxCombined.size > 0
            ? (nonMatchedCodes / allUniqueNpanxxCombined.size) * 100
            : 0;

        // Calculate percentages for each bucket
        this.calculateBucketPercentages(
          sellToAnalysis,
          totalComparableInterCodes,
          totalComparableIntraCodes
        );
        this.calculateBucketPercentages(
          buyFromAnalysis,
          totalComparableInterCodes,
          totalComparableIntraCodes
        );
        if (zeroMarginDetail) {
          zeroMarginDetail.percentInter =
            totalComparableInterCodes > 0
              ? (zeroMarginDetail.matchInter / totalComparableInterCodes) * 100
              : 0;
          zeroMarginDetail.percentIntra =
            totalComparableIntraCodes > 0
              ? (zeroMarginDetail.matchIntra / totalComparableIntraCodes) * 100
              : 0;
        }

        // Calculate total matches and percentages for sellToAnalysis and buyFromAnalysis
        this.sumAnalysisTotals(sellToAnalysis);
        this.sumAnalysisTotals(buyFromAnalysis);
      }

      // Matched NPAs and Total Unique NPAs (existing logic adjusted)
      const allFileNPAsSet = new Set([...file1NPAs, ...file2NPAs]);
      totalUniqueNPAs = allFileNPAsSet.size;
      const matchedNPAsSet = new Set<string>();
      if (file1Data.length > 0 && file2Data.length > 0) {
        const file2NpaMap = new Map<string, string[]>(); // NPANXX -> NPA
        file2Data.forEach((r) => {
          if (!file2NpaMap.has(r.npanxx)) file2NpaMap.set(r.npanxx, []);
          file2NpaMap.get(r.npanxx)!.push(r.npa);
        });

        file1Data.forEach((r1) => {
          if (file2NpaMap.has(r1.npanxx)) {
            // An NPANXX match. Now check if NPA also matches.
            if (file2NpaMap.get(r1.npanxx)!.includes(r1.npa)) {
              matchedNPAsSet.add(r1.npa);
            }
          }
        });
      }
      matchedNPAs = matchedNPAsSet.size;

      const report: USCodeReport = {
        file1: reportFile1,
        file2: reportFile2!, // Will be undefined if no file2, handle in UI
        matchedCodes,
        nonMatchedCodes,
        matchedCodesPercentage,
        nonMatchedCodesPercentage,
        matchedNPAs,
        totalUniqueNPAs,
        sellToAnalysis,
        buyFromAnalysis,
        zeroMarginDetail,
        totalComparableInterCodes,
        totalComparableIntraCodes,
      };
      return report;
    } catch (error) {
      console.error('[USService] Error generating US code report:', error);
      throw error; // Rethrow or handle as appropriate
    }
  }

  // Add method to clear US comparison data
  async clearPricingComparisonData(): Promise<void> {
    try {
      // Only need getDB from dexieDB
      const { getDB } = this.dexieDB;
      const comparisonDb = await getDB(DBName.US_PRICING_COMPARISON);

      // Get the specific comparison table name
      const comparisonSchemaString = DBSchemas[DBName.US_PRICING_COMPARISON];
      const comparisonTableName = this._extractTableNameFromSchema(comparisonSchemaString);

      if (!comparisonTableName) {
        console.warn(
          `[USService] Could not determine comparison table name in clearPricingComparisonData. Skipping clear.`
        );
        return;
      }

      // Check if the table exists before trying to clear
      if (comparisonDb.tables.some((t) => t.name === comparisonTableName)) {
        const comparisonTable = comparisonDb.table(comparisonTableName);
        await comparisonTable.clear(); // Use clear() instead of deleteTableStore
      }
    } catch (error) {
      console.error('[USService] Failed to clear US pricing comparison data:', error);
      // Decide if error should be thrown or just logged
      // throw error;
    }
  }

  async generateAndStoreEnhancedReport(componentId: string, fileName: string): Promise<void> {
    if (!fileName) {
      console.error('[USService] Cannot generate enhanced report: file name is missing.');
      return;
    }

    try {
      // We are generating a report for a single file here.
      // makeUsCodeReport can accept two filenames, for the second one we'll pass an empty string or null
      // if it expects a string, and handle null/undefined cases within makeUsCodeReport or its data processing.
      // For now, assuming it can handle one filename and an empty/null second one.
      const rawReportData = await this.makeUsCodeReport(fileName, ''); // Pass empty for file2Name

      if (!rawReportData || !rawReportData.file1Report) {
        console.error(
          `[USService] Failed to generate raw data for enhanced report for file: ${fileName}`
        );
        return;
      }

      // Transform rawReportData (USCodeReport) into USEnhancedCodeReport format
      const enhancedReport: USEnhancedCodeReport = {
        file1: {
          fileName: rawReportData.file1Report.fileName || fileName,
          totalCodes: rawReportData.file1Report.totalCodes,
          npaCount: rawReportData.file1Report.npaCount,
          uniqueNpaCount: rawReportData.file1Report.uniqueNpaCount,
          npaCoverage: rawReportData.file1Report.npaCoverage,
          avgInterRate: rawReportData.file1Report.avgInterRate,
          avgIntraRate: rawReportData.file1Report.avgIntraRate,
          avgIndetermRate: rawReportData.file1Report.avgIndetermRate,
          countries: rawReportData.file1Report.countries.map((country) => ({
            countryCode: country.countryCode,
            countryName: country.countryName,
            npaCount: country.npaCount,
            npaCoverage: country.npaCoverage,
            states: country.states.map((state) => ({
              stateCode: state.stateCode,
              stateName: state.stateName, // Ensure stateName is populated if available
              coverage: state.coverage,
              npas: state.npas,
              rateStats: state.rateStats,
            })),
          })),
        },
        file2: null, // No second file for this operation
        comparisonSummary: null, // No comparison for a single file report
      };

      this.store.setEnhancedCodeReport(enhancedReport);
      console.log(`[USService] Successfully generated and stored enhanced report for ${fileName}`);
    } catch (error) {
      console.error(
        `[USService] Error generating or storing enhanced report for ${fileName}:`,
        error
      );
      // Optionally, re-throw or handle the error further if needed
    }
  }
}
