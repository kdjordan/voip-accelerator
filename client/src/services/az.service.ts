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
            
            // Generate single-file report after successful upload
            await this.generateSingleFileReport(file.name, validRecords);
            
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
   * Generate a code report for a single file
   * @param fileName The name of the file
   * @param data The standardized data for the file
   */
  async generateSingleFileReport(fileName: string, records: AZStandardizedData[]): Promise<AzCodeReport> {
    const totalCodes = records.length;
    const destinations = new Set(records.map(r => r.destination));
    const totalDestinations = destinations.size;
    const uniqueDestinationsPercentage = Math.round((totalDestinations / totalCodes) * 100);

    return {
      fileName,
      totalCodes,
      totalDestinations,
      uniqueDestinationsPercentage,
      matchedCodes: 0,
      nonMatchedCodes: 0,
    };
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
