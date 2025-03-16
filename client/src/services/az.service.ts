import { type AZStandardizedData, type InvalidAzRow, type AzCodeReport } from '@/types/domains/az-types';
import { DBName } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import Papa from 'papaparse';
import { StorageService, useStorage } from '@/services/storage/storage.service';
import { storageConfig } from '@/config/storage-config';

export class AZService {
  private store = useAzStore();
  private storageService: StorageService<AZStandardizedData>;

  constructor() {
    console.log('Initializing AZ service');
    this.storageService = useStorage<AZStandardizedData>(DBName.AZ);
    this.initializeStorage();
  }

  async initializeStorage(): Promise<StorageService<AZStandardizedData>> {
    await this.storageService.initialize();
    return this.storageService;
  }

  /**
   * Check if we're using in-memory storage
   */
  private isUsingMemoryStorage(): boolean {
    return storageConfig.storageType === 'memory';
  }

  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number
  ): Promise<{ fileName: string; records: AZStandardizedData[] }> {
    const tableName = file.name.toLowerCase().replace('.csv', '');

    // Clear any existing invalid rows for this file
    this.store.clearInvalidRowsForFile(file.name);

    // Ensure storage is initialized
    await this.initializeStorage();

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
              const destName = row[columnMapping.destination]?.trim() || '';
              const dialCode = row[columnMapping.dialcode]?.trim() || '';
              const rateStr = row[columnMapping.rate];
              const rate = parseFloat(rateStr);

              // Validate the rate - if not a valid number, add to invalid rows
              if (isNaN(rate) || !destName || !dialCode) {
                const invalidRow: InvalidAzRow = {
                  rowIndex: startLine + index,
                  destName,
                  dialCode,
                  invalidRate: rateStr || '',
                  reason: isNaN(rate) ? 'Invalid rate' : !destName ? 'Missing destination name' : 'Missing dial code',
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

            // Store valid records based on storage strategy
            if (validRecords.length > 0) {
              if (this.isUsingMemoryStorage()) {
                // Store in-memory
                this.store.storeInMemoryData(tableName, validRecords);
                console.log(`[AZService] Stored ${validRecords.length} records in memory for table: ${tableName}`);
              } else {
                // Store using IndexedDB
                await this.storageService.storeData(tableName, validRecords);
              }
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
        error: error => reject(new Error(`Failed to process CSV: ${error.message}`)),
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
      const uniqueDestinations = new Set(data.map(item => item.destName)).size;
      const uniquePercentage = ((uniqueDestinations / totalCodes) * 100).toFixed(2);
      
      // Update store
      this.store.setFileStats(componentId, {
        totalCodes,
        totalDestinations: uniqueDestinations,
        uniqueDestinationsPercentage: parseFloat(uniquePercentage)
      });
      
      console.log(`[AZService] Updated file stats for ${componentId} (${fileName}):`, {
        totalCodes,
        totalDestinations: uniqueDestinations,
        uniqueDestinationsPercentage: parseFloat(uniquePercentage)
      });
    } catch (error) {
      console.error('Error calculating file stats:', error);
    }
  }

  async clearData(): Promise<void> {
    try {
      if (this.isUsingMemoryStorage()) {
        // Clear in-memory data
        this.store.clearAllInMemoryData();
        console.log('[AZService] Cleared all in-memory data');
      } else {
        // Clear database data
        await this.initializeStorage();
        await this.storageService.clearAllData();
      }
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
      
      if (this.isUsingMemoryStorage()) {
        // Remove from in-memory
        this.store.removeInMemoryData(tableName);
        console.log(`[AZService] Removed in-memory table: ${tableName}`);
      } else {
        // Remove from database
        await this.initializeStorage();
        await this.storageService.removeData(tableName);
      }
      console.log(`Table ${tableName} removed successfully`);
    } catch (error) {
      console.error(`Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }

  async getData(tableName: string): Promise<AZStandardizedData[]> {
    try {
      if (this.isUsingMemoryStorage()) {
        // Get from in-memory
        const data = this.store.getInMemoryData(tableName);
        console.log(`[AZService] Retrieved ${data.length} records from in-memory table: ${tableName}`);
        return data;
      } else {
        // Get from database
        await this.initializeStorage();
        return await this.storageService.getData(tableName);
      }
    } catch (error) {
      console.error(`Failed to get data from table ${tableName}:`, error);
      throw error;
    }
  }

  async getRecordCount(tableName: string): Promise<number> {
    try {
      if (this.isUsingMemoryStorage()) {
        // Count from in-memory
        const count = this.store.getInMemoryDataCount(tableName);
        console.log(`[AZService] Count for in-memory table ${tableName}: ${count}`);
        return count;
      } else {
        // Count from database
        await this.initializeStorage();
        return await this.storageService.getCount(tableName);
      }
    } catch (error) {
      console.error(`Failed to get record count for table ${tableName}:`, error);
      return 0;
    }
  }

  async listTables(): Promise<Record<string, number>> {
    try {
      if (this.isUsingMemoryStorage()) {
        // List in-memory tables
        const tables = this.store.getInMemoryTables;
        console.log(`[AZService] Listed ${Object.keys(tables).length} in-memory tables`);
        return tables;
      } else {
        // List database tables
        await this.initializeStorage();
        return await this.storageService.listTables();
      }
    } catch (error) {
      console.error('Failed to list tables:', error);
      return {};
    }
  }

  /**
   * Switch storage strategy at runtime
   * This will migrate all data between strategies
   */
  async switchStorageStrategy(newStrategy: 'memory' | 'indexeddb'): Promise<void> {
    if (newStrategy === storageConfig.storageType) {
      console.log(`[AZService] Already using ${newStrategy} strategy, no change needed`);
      return;
    }

    console.log(`[AZService] Switching storage strategy from ${storageConfig.storageType} to ${newStrategy}`);
    
    try {
      if (newStrategy === 'memory') {
        // Switching from IndexedDB to memory
        // First, get all data from IndexedDB
        await this.initializeStorage();
        const tables = await this.storageService.listTables();
        
        // For each table, get the data and store it in memory
        for (const tableName of Object.keys(tables)) {
          const data = await this.storageService.getData(tableName);
          this.store.storeInMemoryData(tableName, data);
          console.log(`[AZService] Migrated ${data.length} records from IndexedDB to memory for table: ${tableName}`);
        }
      } else {
        // Switching from memory to IndexedDB
        // First, get all in-memory tables
        const tables = this.store.getInMemoryTables;
        
        // For each table, get the data and store it in IndexedDB
        for (const tableName of Object.keys(tables)) {
          const data = this.store.getInMemoryData(tableName);
          await this.storageService.storeData(tableName, data);
          console.log(`[AZService] Migrated ${data.length} records from memory to IndexedDB for table: ${tableName}`);
        }
      }
      
      // Update the storage config
      storageConfig.storageType = newStrategy;
      console.log(`[AZService] Storage strategy switched to ${newStrategy}`);
    } catch (error) {
      console.error(`Failed to switch storage strategy to ${newStrategy}:`, error);
      throw error;
    }
  }
}
