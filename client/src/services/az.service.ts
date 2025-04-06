import {
  type AZStandardizedData,
  type InvalidAzRow,
  type AzCodeReport,
} from '@/types/domains/az-types';
import { DBName } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB'; // Direct import of Dexie composable

export class AZService {
  private store = useAzStore();

  constructor() {
    console.log('Initializing simplified AZ service');
  }

  // Process file and store directly in Dexie
  async processFile(
    file: File,
    columnMapping: { destName: number; code: number; rate: number },
    startLine: number
  ): Promise<{ fileName: string; records: AZStandardizedData[] }> {
    // Use a consistent table name instead of creating a new table for each file
    const tableName = 'az_codes';
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

            // Store directly in Dexie - no storage strategy conditional logic
            if (validRecords.length > 0) {
              await storeInDexieDB(validRecords, DBName.AZ, tableName);
              console.log(
                `[AZService] Stored ${validRecords.length} records in Dexie for table: ${tableName}`
              );
            }

            this.store.addFileUploaded(file.name, tableName);

            // Get the correct component ID based on which upload zone is being used
            // We need to check the filesUploaded map to determine the correct component ID
            let componentId = '';

            // Check if this file was just added to az1 or az2
            if (this.store.getFileNameByComponent('az1') === file.name) {
              componentId = 'az1';
            } else if (this.store.getFileNameByComponent('az2') === file.name) {
              componentId = 'az2';
            } else {
              // If we can't determine the component ID, default to az1 if it's empty
              componentId = this.store.getFileNameByComponent('az1') ? 'az2' : 'az1';
            }

            console.log(`[AZService] Determined component ID for ${file.name}: ${componentId}`);

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
      // Use Dexie directly to delete the database
      const { deleteDatabase } = useDexieDB();
      await deleteDatabase(DBName.AZ);
      console.log('[AZService] Cleared all Dexie data for AZ');

      // Reset the file tracking in the store
      this.store.resetFiles();
    } catch (error) {
      console.error('Failed to clear AZ data:', error);
      throw error;
    }
  }

  async removeTable(tableName: string): Promise<void> {
    try {
      // Find the component ID associated with this table
      const fileName = tableName + '.csv';
      let componentId = '';

      if (this.store.getFileNameByComponent('az1') === fileName) {
        componentId = 'az1';
      } else if (this.store.getFileNameByComponent('az2') === fileName) {
        componentId = 'az2';
      }

      if (componentId) {
        // Clear file stats for this component
        this.store.clearFileStats(componentId);
      }

      // Use DexieDB directly
      const { getDB } = useDexieDB();
      const db = await getDB(DBName.AZ);

      if (db.hasStore(tableName)) {
        await db.deleteStore(tableName);
        console.log(`Table ${tableName} removed successfully from Dexie`);
      }
    } catch (error) {
      console.error(`Failed to remove table ${tableName}:`, error);
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
}
