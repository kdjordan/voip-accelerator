import {
  type AZStandardizedData,
  type InvalidAzRow,
  type AzCodeReport,
  type AZDetailedComparisonEntry,
  type AZEnhancedCodeReport,
  type AZReportsInput,
  type AzPricingReport,
  type AZDetailedComparisonFilters,
  type MarginBucketDetailAZ,
  type MarginAnalysisAZ,
  type ZeroMarginDetailAZ,
  type AzCodeReportEnhanced,
} from '@/types/domains/az-types';
import { DBName } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB';
import Dexie from 'dexie';
import { INT_COUNTRY_CODES } from '@/types/constants/int-country-codes';
import AzAnalyzerWorker from '@/workers/az-analyzer.worker.ts?worker';
import AzComparisonWorker from '@/workers/az-comparison.worker.ts?worker';
import { UploadStage } from '@/types/components/upload-progress-types';

export class AZService {
  private store = useAzStore();
  private dexieDB = useDexieDB();

  constructor() {
    console.log('[AZService] Initializing AZ service');
  }

  // Process file and store directly in Dexie
  async processFile(
    file: File,
    columnMapping: { destName: number; code: number; rate: number },
    startLine: number,
    componentId: string,
    progressCallback?: (progress: number, stage: import('@/types/components/upload-progress-types').UploadStage, rowsProcessed: number, totalRows?: number) => void
  ): Promise<{ fileName: string; records: AZStandardizedData[] }> {
    // Use a consistent table name instead of creating a new table for each file
    // const tableName = 'az_codes'; // Revert to original incorrect table name for now
    const { storeInDexieDB } = this.dexieDB;
    const derivedTableName = file.name.toLowerCase().replace('.csv', '');

    // Clear any existing invalid rows for this file
    this.store.clearInvalidRowsForFile(file.name);

    return new Promise((resolve, reject) => {
      const performanceStart = performance.now();
      
      // Start progress tracking
      progressCallback?.(0, UploadStage.PARSING, 0);
      
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: async (results: { data: string[][] }) => {
          try {
            // Skip to user-specified start line
            const dataRows = results.data.slice(startLine - 1);
            const validRecords: AZStandardizedData[] = [];
            let totalRecords = 0;
            
            // Update progress after parsing
            progressCallback?.(30, UploadStage.VALIDATING, 0, dataRows.length);

            dataRows.forEach((row, index) => {
              totalRecords++;
              const destName = row[columnMapping.destName]?.trim() || '';
              const dialCode = row[columnMapping.code]?.trim() || '';
              const rateStr = row[columnMapping.rate];
              const rate = parseFloat(rateStr);

              // Update progress during validation (30-70%)
              if (index % 1000 === 0) {
                const validationProgress = 30 + ((index / dataRows.length) * 40);
                progressCallback?.(validationProgress, UploadStage.VALIDATING, index, dataRows.length);
              }

              // Validate the rate - if not a valid number, add to invalid rows
              if (isNaN(rate) || !destName || !dialCode) {
                const invalidRow: InvalidAzRow = {
                  rowIndex: startLine + index,
                  destName,
                  dialCode,
                  invalidRate: rateStr || '',
                  reason: isNaN(rate)
                    ? 'Invalid rate'
                    : !destName
                      ? 'Missing destination name'
                      : 'Missing dial code',
                };
                this.store.addInvalidRow(file.name, invalidRow);
              } else {
                validRecords.push({
                  destName,
                  dialCode,
                  rate,
                });
              }
            });

            // Store directly in Dexie - this uses the incorrect schema via addStore
            if (validRecords.length > 0) {
              // Update progress to storing stage
              progressCallback?.(85, UploadStage.STORING, totalRecords, dataRows.length);
              
              await storeInDexieDB(validRecords, DBName.AZ, derivedTableName, {
                replaceExisting: true,
              });
              console.log(
                `[AZService] Stored ${validRecords.length} records in Dexie for table: ${derivedTableName}`
              );

              // --- Trigger Enhanced Code Report Generation --- Start ---
              try {
                const analyzerWorker = new AzAnalyzerWorker();

                analyzerWorker.onmessage = (event) => {
                  if (event.data.error) {
                    console.error('[AZService] Error from AZ Analyzer Worker:', event.data.error);
                  } else {
                    const report = event.data as AZEnhancedCodeReport;
                    console.log('[AZService] Received Enhanced Code Report from worker:', report);
                    this.store.setEnhancedCodeReport(file.name, report);
                  }
                  analyzerWorker.terminate(); // Clean up worker
                };

                analyzerWorker.onerror = (error) => {
                  console.error('[AZService] Unhandled error in AZ Analyzer Worker:', error);
                  analyzerWorker.terminate(); // Clean up worker
                };

                // Prepare data for the worker
                const workerInput = {
                  fileName: file.name,
                  fileData: validRecords, // Send the processed valid records
                  intCountryData: INT_COUNTRY_CODES, // Send the constant
                };

                analyzerWorker.postMessage(workerInput);
                console.log('[AZService] Posted data to AZ Analyzer Worker');
              } catch (workerError) {
                console.error(
                  '[AZService] Failed to initialize or post to AZ Analyzer Worker:',
                  workerError
                );
                // Decide if this should reject the main promise or just log
              }
              // --- Trigger Enhanced Code Report Generation --- End -----
            }

            // Update the store with the component ID and the original filename
            this.store.addFileUploaded(componentId, file.name);

            console.log(
              `[AZService] Processing file ${file.name} for component ID: ${componentId}`
            );

            // Calculate stats after storing data
            await this.calculateFileStats(componentId, file.name);

            // Final progress update
            progressCallback?.(100, UploadStage.FINALIZING, totalRecords, dataRows.length);

            // Performance logging
            const performanceEnd = performance.now();
            const duration = (performanceEnd - performanceStart) / 1000;
            const recordsPerSecond = duration > 0 ? Math.round(totalRecords / duration) : 0;
            console.log(`[PERF] AZ Service - Total upload completed in ${duration.toFixed(2)}s`);
            console.log(`[PERF] AZ Service - Processed ${totalRecords} records at ${recordsPerSecond} records/sec`);

            resolve({ fileName: file.name, records: validRecords });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(new Error(`Failed to process CSV: ${error.message}`)),
      });
    });
  }

  /**
   * Calculate file statistics and store them in the store
   */
  async calculateFileStats(componentId: string, fileName: string): Promise<void> {
    try {
      const tableName = fileName.toLowerCase().replace('.csv', '');
      const data = await this.getData(tableName);

      if (!data || data.length === 0) return;

      // Calculate stats
      const totalCodes = data.length;
      const uniqueDestinations = new Set(data.map((item) => item.destName)).size;
      const uniquePercentage = ((uniqueDestinations / totalCodes) * 100).toFixed(2);

      // Update store
      this.store.setFileStats(componentId, {
        totalCodes,
        totalDestinations: uniqueDestinations,
        uniqueDestinationsPercentage: parseFloat(uniquePercentage),
      });

      console.log(`[AZService] Updated file stats for ${componentId} (${fileName}):`, {
        totalCodes,
        totalDestinations: uniqueDestinations,
        uniqueDestinationsPercentage: parseFloat(uniquePercentage),
      });
    } catch (error) {
      console.error('Error calculating file stats:', error);
    }
  }

  async clearData(): Promise<void> {
    try {
      const { getDB, getAllStoreNamesForDB, deleteTableStore } = this.dexieDB;

      // Clear all tables from az_rate_deck_db ONLY
      const azDb = await getDB(DBName.AZ);
      const azTableNames = await getAllStoreNamesForDB(DBName.AZ);
      if (azTableNames.length > 0) {
        for (const tableName of azTableNames) {
          await deleteTableStore(DBName.AZ, tableName);
          console.log(`[AZService] Deleted table ${tableName} from ${DBName.AZ}`);
        }
        console.log(`[AZService] Cleared all tables from ${DBName.AZ}`);
      } else {
        console.log(`[AZService] No tables found to clear in ${DBName.AZ}`);
      }

      // --- Removed clearing of AZ_PRICING_COMPARISON DB from here ---
    } catch (error) {
      console.error('[AZService] Failed to clear AZ rate deck data:', error);
      throw error;
    }
  }

  // New function specifically for clearing comparison data
  async clearComparisonData(): Promise<void> {
    try {
      const { getDB, getAllStoreNamesForDB, deleteTableStore } = this.dexieDB;
      // Clear all tables from az_pricing_comparison_db
      const comparisonDb = await getDB(DBName.AZ_PRICING_COMPARISON);
      const comparisonTableNames = await getAllStoreNamesForDB(DBName.AZ_PRICING_COMPARISON);
      if (comparisonTableNames.length > 0) {
        for (const tableName of comparisonTableNames) {
          await deleteTableStore(DBName.AZ_PRICING_COMPARISON, tableName);
          console.log(
            `[AZService] Deleted table ${tableName} from ${DBName.AZ_PRICING_COMPARISON}`
          );
        }
        console.log(`[AZService] Cleared all tables from ${DBName.AZ_PRICING_COMPARISON}`);
      } else {
        console.log(`[AZService] No tables found to clear in ${DBName.AZ_PRICING_COMPARISON}`);
      }
    } catch (error) {
      console.error('[AZService] Failed to clear AZ comparison data:', error);
      throw error;
    }
  }

  async removeTable(tableName: string): Promise<void> {
    try {
      // Use the instance-level dexieDB
      const { getDB, deleteTableStore } = this.dexieDB;
      // tableName is the derived name (e.g., 'azfile1')
      const fileName = tableName + '.csv';
      let componentId = '';
      const fileEntries = Array.from(this.store.filesUploaded.entries());

      // Find the component ID of the file being removed
      const removedFileEntry = fileEntries.find(([_, value]) => value.fileName === fileName);
      if (removedFileEntry) {
        componentId = removedFileEntry[0];
        // Clear file stats for this component
        this.store.clearFileStats(componentId);
      }

      // Use DexieDB directly to remove the main rate deck table
      const azDb = await getDB(DBName.AZ);
      if (azDb.tables.some((table) => table.name === tableName)) {
        // Clear the table data. Consider if deleting the store is intended.
        // If deleting store: await deleteTableStore(DBName.AZ, tableName);
        await azDb.table(tableName).clear();
        console.log(`[AZService] Table ${tableName} cleared successfully in ${DBName.AZ}`);
      } else {
        console.log(`[AZService] Table ${tableName} not found in ${DBName.AZ}, skipping clear.`);
      }

      // --- Delete corresponding comparison table ---
      // Example: Determine comparison table name based on the removed table
      const comparisonTableName = `comparison_${tableName}`; // This naming needs confirmation
      const comparisonDb = await getDB(DBName.AZ_PRICING_COMPARISON);

      // Use standard Dexie check for table existence
      if (comparisonDb.tables.some((table) => table.name === comparisonTableName)) {
        // Use deleteTableStore from the composable
        await deleteTableStore(DBName.AZ_PRICING_COMPARISON, comparisonTableName);
        console.log(
          `[AZService] Corresponding comparison table ${comparisonTableName} deleted from ${DBName.AZ_PRICING_COMPARISON}.`
        );
      } else {
        console.log(
          `[AZService] Corresponding comparison table ${comparisonTableName} not found in ${DBName.AZ_PRICING_COMPARISON}, skipping delete.`
        );
      }

      // Note: Resetting reports and detailedComparisonTableName is handled by the store's removeFile action
    } catch (error) {
      console.error(`[AZService] Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }

  async getData(tableName: string): Promise<AZStandardizedData[]> {
    try {
      // Use the instance-level dexieDB
      const { loadFromDexieDB } = this.dexieDB;
      return await loadFromDexieDB<AZStandardizedData>(DBName.AZ, tableName);
    } catch (error) {
      console.error(`[AZService] Failed to get data from table ${tableName}:`, error);
      return []; // Return empty array on error
    }
  }

  async getRecordCount(tableName: string): Promise<number> {
    try {
      // Use the instance-level dexieDB
      const { getDB } = this.dexieDB;
      const db = await getDB(DBName.AZ);
      // Use standard Dexie check
      if (!db.tables.some((table) => table.name === tableName)) {
        console.warn(`[AZService] Table ${tableName} does not exist in ${DBName.AZ} for count.`);
        return 0;
      }
      const count = await db.table(tableName).count();
      console.log(`[AZService] Record count for ${tableName}: ${count}`);
      return count;
    } catch (error) {
      console.error(`[AZService] Failed to get record count for table ${tableName}:`, error);
      return 0;
    }
  }

  async listTables(): Promise<Record<string, number>> {
    try {
      // Use the instance-level dexieDB
      const { getAllStoreNamesForDB } = this.dexieDB;
      const tableNames = await getAllStoreNamesForDB(DBName.AZ);
      const tableCounts: Record<string, number> = {};
      for (const name of tableNames) {
        tableCounts[name] = await this.getRecordCount(name);
      }
      console.log('[AZService] Listed tables:', tableCounts);
      return tableCounts;
    } catch (error) {
      console.error('[AZService] Failed to list tables:', error);
      return {};
    }
  }

  /**
   * Generates combined pricing and code reports for two AZ files.
   */
  async makeAzCombinedReport(fileName1: string, fileName2: string): Promise<void> {
    console.log(`[AZService] Generating combined report for ${fileName1} and ${fileName2}`);

    try {
      // 1. Load data for both files
      const tableName1 = fileName1.toLowerCase().replace('.csv', '');
      const tableName2 = fileName2.toLowerCase().replace('.csv', '');

      const [file1Data, file2Data] = await Promise.all([
        this.getData(tableName1),
        this.getData(tableName2),
      ]);

      if (!file1Data || file1Data.length === 0 || !file2Data || file2Data.length === 0) {
        throw new Error('Could not load data for one or both files.');
      }

      // 2. Instantiate and run the worker
      const worker = new AzComparisonWorker();
      const workerInput: AZReportsInput = {
        fileName1,
        fileName2,
        // Pass data directly as it should be cloneable from Dexie
        file1Data: file1Data,
        file2Data: file2Data,
      };

      const reports = await new Promise<{
        pricingReport: AzPricingReport;
        codeReport: AzCodeReport;
        detailedComparisonData: AZDetailedComparisonEntry[];
      }>((resolve, reject) => {
        worker.onmessage = (event: MessageEvent) => {
          const { pricingReport, codeReport, detailedComparisonData } = event.data;
          console.log('[AZService] Received reports from worker');
          resolve({ pricingReport, codeReport, detailedComparisonData });
        };
        worker.onerror = (error: ErrorEvent) => {
          console.error('[AZService] Worker error:', error);
          reject(error);
        };

        worker.postMessage(workerInput);
      });

      // 3. Update store with summary reports
      if (reports.pricingReport && reports.codeReport) {
        this.store.setReports(reports.pricingReport, reports.codeReport);
      }

      // 4. Handle storage of detailedComparisonData
      const detailedData = reports.detailedComparisonData;
      console.log(`[AZService] Received ${detailedData.length} detailed comparison entries.`);

      // --- Store detailed data directly into the FIXED table ---
      const fixedTableName = 'az_comparison_results';

      if (detailedData && detailedData.length > 0) {
        // Get the specific DB instance directly
        const { getDB } = this.dexieDB;

        try {
          const comparisonDb = await getDB(DBName.AZ_PRICING_COMPARISON);

          // Ensure DB is open
          if (!comparisonDb.isOpen()) {
            console.warn(`[AZService] Comparison DB ${comparisonDb.name} was closed. Reopening...`);
            await comparisonDb.open();
          }

          // Define expected schema (matching DBSchemas)
          const schemaDefinition = {
            [fixedTableName]:
              '++id, &dialCode, rate1, rate2, diff, destName1, destName2, matchStatus, diffPercent, cheaperFile',
          };

          // Check if table exists and upgrade schema if necessary (mirroring us.service)
          // This shouldn't be strictly necessary if DBSchemas worked perfectly on init, but safer
          if (!comparisonDb.tables.some((t) => t.name === fixedTableName)) {
            console.warn(
              `[AZService] Table ${fixedTableName} not found in ${comparisonDb.name}. Attempting schema upgrade.`
            );
            const currentVersion = comparisonDb.verno;
            comparisonDb.close();
            const newVersion = currentVersion + 1;
            console.log(
              `[AZService] Upgrading ${comparisonDb.name} DB to v${newVersion} for table ${fixedTableName}`
            );
            comparisonDb.version(newVersion).stores(schemaDefinition);
            await comparisonDb.open(); // Re-open DB with new schema
            console.log(`[AZService] DB ${comparisonDb.name} opened with new schema.`);
          } else {
            console.log(
              `[AZService] Table ${fixedTableName} already exists in ${comparisonDb.name}.`
            );
          }

          // Get table reference and perform operations
          const comparisonTable = comparisonDb.table<AZDetailedComparisonEntry>(fixedTableName);

          console.log(
            `[AZService] Clearing existing data in ${comparisonDb.name}/${fixedTableName}...`
          );
          await comparisonTable.clear(); // Clear existing data first

          console.log(
            `[AZService] Storing ${detailedData.length} detailed comparison records in ${comparisonDb.name}/${fixedTableName}...`
          );
          await comparisonTable.bulkPut(detailedData); // Store new data

          console.log(`[AZService] Successfully stored ${detailedData.length} comparison records.`);

          // Update the store with the FIXED table name
          this.store.setDetailedComparisonTableName(fixedTableName);
        } catch (dbError) {
          console.error(
            `[AZService] Failed to store detailed comparison data directly in table ${fixedTableName}:`,
            dbError
          );
          // Optionally clear the table name in the store if saving failed
          this.store.setDetailedComparisonTableName(null);
        }
      } else {
        // If no detailed data, ensure the table name is cleared in the store
        this.store.setDetailedComparisonTableName(null);
      }

      // Clean up worker
      worker.terminate();
    } catch (error) {
      console.error('[AZService] Error generating combined AZ report:', error);
      // Potentially update store with error state
      throw error; // Re-throw for the caller to handle
    }
  }

  /**
   * Retrieves detailed comparison data from a specific table in the comparison DB.
   */
  async getDetailedComparisonData(
    detailedComparisonTableName: string
  ): Promise<AZDetailedComparisonEntry[]> {
    if (!detailedComparisonTableName) {
      console.warn('[AZService] getDetailedComparisonData called with no table name.');
      return [];
    }

    console.log(
      `[AZService] Getting detailed comparison data from table: ${detailedComparisonTableName}`
    );
    try {
      // Use the instance-level dexieDB
      const { loadFromDexieDB } = this.dexieDB;
      return await loadFromDexieDB<AZDetailedComparisonEntry>(
        DBName.AZ_PRICING_COMPARISON,
        detailedComparisonTableName
      );
    } catch (error) {
      console.error(
        `[AZService] Failed to get detailed comparison data from table ${detailedComparisonTableName}:`,
        error
      );
      throw error; // Re-throw for the caller to handle
    }
  }

  // AZ Margin Analysis Helper Methods (adapted from US version for single-rate comparison)

  /**
   * Helper function to initialize MarginBucketDetailAZ
   */
  private createMarginBucketDetailAZ(): MarginBucketDetailAZ {
    return {
      matchCount: 0,
      percentOfComparable: 0,
    };
  }

  /**
   * Helper function to initialize MarginAnalysisAZ
   */
  private createMarginAnalysisAZ(): MarginAnalysisAZ {
    return {
      lessThan10: this.createMarginBucketDetailAZ(),
      between10And20: this.createMarginBucketDetailAZ(),
      between20And30: this.createMarginBucketDetailAZ(),
      between30And40: this.createMarginBucketDetailAZ(),
      between40And50: this.createMarginBucketDetailAZ(),
      between50And60: this.createMarginBucketDetailAZ(),
      between60And70: this.createMarginBucketDetailAZ(),
      between70And80: this.createMarginBucketDetailAZ(),
      between80And90: this.createMarginBucketDetailAZ(),
      between90And100: this.createMarginBucketDetailAZ(),
      greaterThan100: this.createMarginBucketDetailAZ(),
      totalMatches: 0,
      totalPercent: 0,
    };
  }

  /**
   * Helper function to initialize ZeroMarginDetailAZ
   */
  private createZeroMarginDetailAZ(): ZeroMarginDetailAZ {
    return {
      matchCount: 0,
      percentOfComparable: 0,
    };
  }

  /**
   * Helper method to categorize margin into buckets for AZ
   */
  private categorizeMarginAZ(margin: number, analysis: MarginAnalysisAZ) {
    const marginPercent = margin * 100;
    let bucket: MarginBucketDetailAZ | null = null;

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
      bucket = analysis.between90And100; // Include 100%
    else bucket = analysis.greaterThan100;

    if (bucket) {
      bucket.matchCount++;
    }
  }

  /**
   * Helper method to calculate percentages for all buckets in an AZ analysis
   */
  private calculateBucketPercentagesAZ(
    analysis: MarginAnalysisAZ | undefined,
    totalComparable: number
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
      bucket.percentOfComparable =
        totalComparable > 0 ? (bucket.matchCount / totalComparable) * 100 : 0;
    }
  }

  /**
   * Helper method to sum total matches and percentages for an AZ analysis
   */
  private sumAnalysisTotalsAZ(analysis: MarginAnalysisAZ | undefined) {
    if (!analysis) return;
    analysis.totalMatches = 0;
    analysis.totalPercent = 0;

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
      analysis.totalMatches += bucket.matchCount;
      analysis.totalPercent += bucket.percentOfComparable;
    }
  }

  /**
   * Enhanced AZ Code Report with margin analysis
   */
  async makeAzCodeReportWithMarginAnalysis(
    fileName1: string,
    fileName2: string
  ): Promise<AzCodeReportEnhanced> {
    try {
      const tableName1 = fileName1.toLowerCase().replace('.csv', '');
      const tableName2 = fileName2 ? fileName2.toLowerCase().replace('.csv', '') : '';

      const file1Data = await this.getData(tableName1);
      let file2Data: AZStandardizedData[] = [];
      if (tableName2) {
        file2Data = await this.getData(tableName2);
      }

      // Basic file stats
      const file1Info = {
        fileName: fileName1,
        totalCodes: file1Data.length,
        totalDestinations: new Set(file1Data.map((r) => r.destName)).size,
        uniqueDestinationsPercentage:
          file1Data.length > 0
            ? (new Set(file1Data.map((r) => r.destName)).size / file1Data.length) * 100
            : 0,
      };

      let file2Info: typeof file1Info | undefined = undefined;
      if (file2Data.length > 0 && fileName2) {
        file2Info = {
          fileName: fileName2,
          totalCodes: file2Data.length,
          totalDestinations: new Set(file2Data.map((r) => r.destName)).size,
          uniqueDestinationsPercentage:
            file2Data.length > 0
              ? (new Set(file2Data.map((r) => r.destName)).size / file2Data.length) * 100
              : 0,
        };
      }

      let matchedCodes = 0;
      let nonMatchedCodes = 0;
      let matchedCodesPercentage = 0;
      let nonMatchedCodesPercentage = 0;

      let sellToAnalysis: MarginAnalysisAZ | undefined = undefined;
      let buyFromAnalysis: MarginAnalysisAZ | undefined = undefined;
      let zeroMarginDetail: ZeroMarginDetailAZ | undefined = undefined;
      let totalComparableCodes = 0;

      if (file1Data.length > 0 && file2Data.length > 0) {
        console.log(`[AZService] Both files have data, starting margin analysis...`);
        sellToAnalysis = this.createMarginAnalysisAZ();
        buyFromAnalysis = this.createMarginAnalysisAZ();
        zeroMarginDetail = this.createZeroMarginDetailAZ();

        const file2Map = new Map<string, AZStandardizedData>();
        file2Data.forEach((record) => file2Map.set(record.dialCode, record));

        const allDialCodesFile1 = new Set(file1Data.map((r) => r.dialCode));
        const allDialCodesFile2 = new Set(file2Data.map((r) => r.dialCode));
        const allUniqueDialCodesCombined = new Set([...allDialCodesFile1, ...allDialCodesFile2]);

        for (const record1 of file1Data) {
          const record2 = file2Map.get(record1.dialCode);
          if (record2) {
            matchedCodes++;

            // Single rate comparison for AZ
            if (typeof record1.rate === 'number' && typeof record2.rate === 'number') {
              totalComparableCodes++;
              const margin = (record2.rate - record1.rate) / record1.rate;

              if (record1.rate < record2.rate) {
                // SELL TO opportunity
                this.categorizeMarginAZ(margin, sellToAnalysis);
              } else if (record1.rate > record2.rate) {
                // BUY FROM opportunity
                const buyMargin = (record1.rate - record2.rate) / record1.rate;
                this.categorizeMarginAZ(buyMargin, buyFromAnalysis);
              } else {
                // Zero margin
                zeroMarginDetail.matchCount++;
              }
            }
          }
        }

        nonMatchedCodes = allUniqueDialCodesCombined.size - matchedCodes;
        matchedCodesPercentage =
          allUniqueDialCodesCombined.size > 0
            ? (matchedCodes / allUniqueDialCodesCombined.size) * 100
            : 0;
        nonMatchedCodesPercentage =
          allUniqueDialCodesCombined.size > 0
            ? (nonMatchedCodes / allUniqueDialCodesCombined.size) * 100
            : 0;

        // Calculate percentages for each bucket
        this.calculateBucketPercentagesAZ(sellToAnalysis, totalComparableCodes);
        this.calculateBucketPercentagesAZ(buyFromAnalysis, totalComparableCodes);
        if (zeroMarginDetail) {
          zeroMarginDetail.percentOfComparable =
            totalComparableCodes > 0
              ? (zeroMarginDetail.matchCount / totalComparableCodes) * 100
              : 0;
        }

        // Calculate total matches and percentages
        this.sumAnalysisTotalsAZ(sellToAnalysis);
        this.sumAnalysisTotalsAZ(buyFromAnalysis);

        console.log(`[AZService] Margin analysis completed:`, {
          matchedCodes,
          totalComparableCodes,
          sellToMatches: sellToAnalysis.totalMatches,
          buyFromMatches: buyFromAnalysis.totalMatches,
          zeroMarginMatches: zeroMarginDetail.matchCount,
        });
      }

      const report: AzCodeReportEnhanced = {
        file1: file1Info,
        file2: file2Info,
        matchedCodes,
        nonMatchedCodes,
        matchedCodesPercentage,
        nonMatchedCodesPercentage,
        sellToAnalysis,
        buyFromAnalysis,
        zeroMarginDetail,
        totalComparableCodes,
      };

      return report;
    } catch (error) {
      console.error('[AZService] Error generating AZ code report with margin analysis:', error);
      throw error;
    }
  }

  /**
   * Retrieves paged and filtered detailed comparison data from the comparison DB.
   */
  async getPagedDetailedComparisonData(
    tableName: string,
    limit: number,
    offset: number,
    filters: AZDetailedComparisonFilters
  ): Promise<AZDetailedComparisonEntry[]> {
    try {
      const { getDB } = this.dexieDB;
      const db = await getDB(DBName.AZ_PRICING_COMPARISON);

      if (!db.tables.some((table) => table.name === tableName)) {
        console.warn(
          `[AZService] Table ${tableName} does not exist in ${DBName.AZ_PRICING_COMPARISON} for paged data.`
        );
        return [];
      }

      let collection:
        | Dexie.Collection<AZDetailedComparisonEntry, number>
        | Dexie.Table<AZDetailedComparisonEntry, number> = db.table(tableName);

      // Apply filtering
      if (filters) {
        if (filters.search) {
          const searchTermLower = filters.search.toLowerCase();
          collection = collection.filter((item) => {
            const dialCodeMatch = item.dialCode.toLowerCase().startsWith(searchTermLower);
            const destName1Match = item.destName1?.toLowerCase().includes(searchTermLower) ?? false;
            const destName2Match = item.destName2?.toLowerCase().includes(searchTermLower) ?? false;
            return dialCodeMatch || destName1Match || destName2Match;
          });
        }
        if (filters.cheaper) {
          collection = collection.filter((item) => item.cheaperFile === filters.cheaper);
        }
        if (filters.matchStatus) {
          collection = collection.filter((item) => item.matchStatus === filters.matchStatus);
        }
      }

      // Apply sorting before pagination (offset and limit)
      if (
        filters.sortKey &&
        db.tables.some(
          (t) =>
            t.name === tableName && t.schema.indexes.some((idx) => idx.name === filters.sortKey)
        )
      ) {
        // Only apply orderBy if the sortKey is an actual index on the table
        // This is a basic check; more robust validation might be needed depending on schema complexity
        try {
          collection = (collection as Dexie.Table<AZDetailedComparisonEntry, number>).orderBy(
            filters.sortKey as string
          );
          if (filters.sortDir === 'desc') {
            collection = collection.reverse();
          }
        } catch (e) {
          console.warn(
            `[AZService] Failed to apply DB sort for key "${filters.sortKey}". It might not be an index.`,
            e
          );
          // Potentially fall back to client-side sorting later if this happens, or ensure keys are always valid indices.
        }
      } else if (filters.sortKey) {
        console.warn(
          `[AZService] Sort key "${filters.sortKey}" is not an index on table "${tableName}". Cannot apply DB sort.`
        );
      }

      // Apply offset and limit for pagination
      const results = await collection.offset(offset).limit(limit).toArray();

      console.log(
        `[AZService] Loaded ${results.length} paged comparison records from ${tableName} (offset: ${offset}, limit: ${limit}, sortKey: ${filters.sortKey}, sortDir: ${filters.sortDir})`
      );
      return results;
    } catch (error) {
      console.error(
        `[AZService] Failed to get paged detailed comparison data from table ${tableName}:`,
        error
      );
      return [];
    }
  }
}
