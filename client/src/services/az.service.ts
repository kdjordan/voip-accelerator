import {
  type AZStandardizedData,
  type InvalidAzRow,
  type AzCodeReport,
  type AZDetailedComparisonEntry,
} from '@/types/domains/az-types';
import { DBName } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB'; // Direct import of Dexie composable
import Dexie from 'dexie'; // Import Dexie static methods

export class AZService {
  private store = useAzStore();

  constructor() {
    console.log('[AZService] Initializing AZ service');
  }

  // Process file and store directly in Dexie
  async processFile(
    file: File,
    columnMapping: { destName: number; code: number; rate: number },
    startLine: number,
    componentId: string
  ): Promise<{ fileName: string; records: AZStandardizedData[] }> {
    // Use a consistent table name instead of creating a new table for each file
    // const tableName = 'az_codes'; // Revert to original incorrect table name for now
    const { storeInDexieDB } = useDexieDB();
    const derivedTableName = file.name.toLowerCase().replace('.csv', '');

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
            const validRecords: AZStandardizedData[] = [];

            dataRows.forEach((row, index) => {
              const destName = row[columnMapping.destName]?.trim() || '';
              const dialCode = row[columnMapping.code]?.trim() || '';
              const rateStr = row[columnMapping.rate];
              const rate = parseFloat(rateStr);

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
              await storeInDexieDB(validRecords, DBName.AZ, derivedTableName, {
                replaceExisting: true,
              });
              console.log(
                `[AZService] Stored ${validRecords.length} records in Dexie for table: ${derivedTableName}`
              );
            }

            // Update the store with the component ID and the original filename
            this.store.addFileUploaded(componentId, file.name);

            console.log(
              `[AZService] Processing file ${file.name} for component ID: ${componentId}`
            );

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
      const { getDB } = useDexieDB();

      // Clear all tables from az_rate_deck_db ONLY
      const azDb = await getDB(DBName.AZ);
      const azTableNames = await azDb.getAllStoreNames();
      if (azTableNames.length > 0) {
        for (const tableName of azTableNames) {
          await azDb.deleteStore(tableName);
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
      const { getDB } = useDexieDB();
      // Clear all tables from az_pricing_comparison_db
      const comparisonDb = await getDB(DBName.AZ_PRICING_COMPARISON);
      const comparisonTableNames = await comparisonDb.getAllStoreNames();
      if (comparisonTableNames.length > 0) {
        for (const tableName of comparisonTableNames) {
          await comparisonDb.deleteStore(tableName);
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
      const { getDB } = useDexieDB();
      const azDb = await getDB(DBName.AZ);
      if (azDb.hasStore(tableName)) {
        await azDb.table(tableName).clear();
        console.log(`[AZService] Table ${tableName} cleared successfully in ${DBName.AZ}`);
      }

      // --- Delete corresponding comparison table ---

      // Check if the comparison database exists before attempting to interact with it
      const dbExists = await Dexie.exists(DBName.AZ_PRICING_COMPARISON);

      if (dbExists) {
        // Check if there was another file uploaded
        const otherFileEntry = fileEntries.find(([key, _]) => key !== componentId);

        if (otherFileEntry) {
          const otherFileName = otherFileEntry[1].fileName;
          const otherTableName = otherFileName.toLowerCase().replace('.csv', '');

          // Construct possible comparison table names
          const comparisonTableName1 = `${tableName}_vs_${otherTableName}`;
          const comparisonTableName2 = `${otherTableName}_vs_${tableName}`;

          // Get the comparison DB instance ONLY if the DB exists
          const { getDB } = useDexieDB();
          const comparisonDb = await getDB(DBName.AZ_PRICING_COMPARISON);

          // Attempt to delete the first possible name
          if (comparisonDb.hasStore(comparisonTableName1)) {
            await comparisonDb.deleteStore(comparisonTableName1);
            console.log(
              `[AZService] Table ${comparisonTableName1} removed successfully from ${DBName.AZ_PRICING_COMPARISON}`
            );
          }

          // Attempt to delete the second possible name
          if (comparisonDb.hasStore(comparisonTableName2)) {
            await comparisonDb.deleteStore(comparisonTableName2);
            console.log(
              `[AZService] Table ${comparisonTableName2} removed successfully from ${DBName.AZ_PRICING_COMPARISON}`
            );
          }
        }
      }
      // Note: Resetting reports and detailedComparisonTableName is handled by the store's removeFile action
    } catch (error) {
      console.error(`[AZService] Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }

  async getData(tableName: string): Promise<AZStandardizedData[]> {
    try {
      // Get data directly from Dexie
      const { loadFromDexieDB } = useDexieDB();
      const data = await loadFromDexieDB<AZStandardizedData>(DBName.AZ, tableName);
      console.log(`[AZService] Retrieved ${data.length} records from Dexie table: ${tableName}`);
      return data;
    } catch (error) {
      console.error(`Failed to get data from table ${tableName}:`, error);
      throw error;
    }
  }

  async getRecordCount(tableName: string): Promise<number> {
    try {
      // Count records directly from Dexie
      const { getDB } = useDexieDB();
      const db = await getDB(DBName.AZ);

      if (db.hasStore(tableName)) {
        const count = await db.table(tableName).count();
        console.log(`[AZService] Count for Dexie table ${tableName}: ${count}`);
        return count;
      }
      return 0;
    } catch (error) {
      console.error(`Failed to get record count for table ${tableName}:`, error);
      return 0;
    }
  }

  async listTables(): Promise<Record<string, number>> {
    try {
      // Get all tables and their counts directly from Dexie
      const { getDB } = useDexieDB();
      const db = await getDB(DBName.AZ);

      const result: Record<string, number> = {};
      for (const table of db.tables) {
        const count = await table.count();
        result[table.name] = count;
      }

      console.log(`[AZService] Listed ${Object.keys(result).length} Dexie tables`);
      return result;
    } catch (error) {
      console.error('Failed to list tables:', error);
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
        worker.onmessage = (event) => {
          const { pricingReport, codeReport, detailedComparisonData } = event.data;
          console.log('[AZService] Received reports from worker');
          resolve({ pricingReport, codeReport, detailedComparisonData });
        };
        worker.onerror = (error) => {
          console.error('[AZService] Worker error:', error);
          reject(error);
        };

        worker.postMessage(workerInput);
      });

      // 3. Update store with summary reports
      if (reports.pricingReport && reports.codeReport) {
        this.store.setReports(reports.pricingReport, reports.codeReport);
      }

      // 4. Handle storage of detailedComparisonData (Section 5 logic goes here)
      const detailedData = reports.detailedComparisonData;
      console.log(`[AZService] Received ${detailedData.length} detailed comparison entries.`);
      // TODO: Store detailedData in az_pricing_comparison_db
      // TODO: Update azStore.setDetailedComparisonTableName

      if (detailedData && detailedData.length > 0) {
        const { storeInDexieDB } = useDexieDB();
        const derivedTableName = `${tableName1}_vs_${tableName2}`;

        try {
          await storeInDexieDB(detailedData, DBName.AZ_PRICING_COMPARISON, derivedTableName, {
            replaceExisting: true,
          });
          console.log(
            `[AZService] Stored ${detailedData.length} detailed comparison records in Dexie table: ${derivedTableName}`
          );

          // Update the store with the name of the table containing detailed results
          this.store.setDetailedComparisonTableName(derivedTableName);
        } catch (dbError) {
          console.error(
            `[AZService] Failed to store detailed comparison data in table ${derivedTableName}:`,
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
      const { loadFromDexieDB } = useDexieDB();
      const data = await loadFromDexieDB<AZDetailedComparisonEntry>(
        DBName.AZ_PRICING_COMPARISON,
        detailedComparisonTableName
      );
      console.log(
        `[AZService] Retrieved ${data.length} detailed records from ${detailedComparisonTableName}`
      );
      return data;
    } catch (error) {
      console.error(
        `[AZService] Failed to get detailed comparison data from table ${detailedComparisonTableName}:`,
        error
      );
      throw error; // Re-throw for the caller to handle
    }
  }
}
