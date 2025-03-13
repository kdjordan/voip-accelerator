import { type USStandardizedData, type InvalidUsRow } from '@/types/domains/us-types';
import { DBName } from '@/types/app-types';
import { useUsStore } from '@/stores/us-store';
import Papa from 'papaparse';
import { StorageService, useStorage } from '@/services/storage/storage.service';
import { storageConfig } from '@/config/storage-config';

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
}

export class USService {
  private store: UsStore;
  private storageService: StorageService<USStandardizedData>;

  constructor() {
    console.log('Initializing US service');
    this.store = useUsStore() as unknown as UsStore;
    this.storageService = useStorage<USStandardizedData>(DBName.US);
    this.initializeStorage();
  }

  async initializeStorage(): Promise<StorageService<USStandardizedData>> {
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
    startLine: number,
    indeterminateDefinition?: string
  ): Promise<{ fileName: string; records: USStandardizedData[] }> {
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
            const validRecords: USStandardizedData[] = [];

            dataRows.forEach((row, index) => {
              // Extract values based on column mapping
              let npanxx = '';
              let npa = '';
              let nxx = '';
              
              // Handle NPANXX extraction - either directly or from NPA and NXX
              if (columnMapping.npanxx >= 0) {
                npanxx = row[columnMapping.npanxx]?.trim() || '';
                // If we have NPANXX but not NPA/NXX, extract them
                if (npanxx.length === 6) {
                  npa = npanxx.substring(0, 3);
                  nxx = npanxx.substring(3, 6);
                } 
                // Log information about abnormal NPANXX values without modifying them
                else if (npanxx) {
                  console.log(`Found NPANXX with abnormal length: "${npanxx}" (length: ${npanxx.length})`);
                  // We don't modify the data, just log it for debugging
                  if (npanxx.length >= 3) {
                    npa = npanxx.substring(0, Math.min(3, npanxx.length));
                    nxx = npanxx.length > 3 ? npanxx.substring(3) : '';
                    console.log(`Extracted NPA: "${npa}", NXX: "${nxx}" for analysis purposes`);
                  }
                }
              } else if (columnMapping.npa >= 0 && columnMapping.nxx >= 0) {
                npa = row[columnMapping.npa]?.trim() || '';
                nxx = row[columnMapping.nxx]?.trim() || '';
                
                // Special handling for NPA with country code prefix ("1")
                if (npa.startsWith('1') && npa.length === 4) {
                  console.log(`Found NPA with country code: "${npa}", removing leading "1"`);
                  npa = npa.substring(1); // Remove leading "1" 
                }
                
                npanxx = npa + nxx;
                
                // Log the resulting NPANXX
                console.log(`Constructed NPANXX from NPA+NXX: "${npanxx}" (NPA: "${npa}", NXX: "${nxx}")`);
              }

              // Log full row data for debugging the first few rows
              if (index < 5) {
                console.log(`Row ${index} raw data:`, JSON.stringify(row));
                console.log(`Column mapping being used:`, JSON.stringify(columnMapping));
              }

              // Extract rate values
              const interRateStr = columnMapping.interstate >= 0 ? row[columnMapping.interstate] : '';
              const intraRateStr = columnMapping.intrastate >= 0 ? row[columnMapping.intrastate] : '';
              const indetermRateStr = columnMapping.indeterminate >= 0 ? row[columnMapping.indeterminate] : '';

              // Parse rates
              const interRate = parseFloat(interRateStr);
              const intraRate = parseFloat(intraRateStr);
              let indetermRate = parseFloat(indetermRateStr);

              // Handle indeterminate rate based on user selection
              if (isNaN(indetermRate) && indeterminateDefinition) {
                indetermRate = indeterminateDefinition === 'interstate' ? interRate : intraRate;
              }

              // Debug log for this row
              console.debug(`Row data - NPANXX: "${npanxx}", InterRate: ${interRate}, IntraRate: ${intraRate}, IndetermRate: ${indetermRate}`);

              // Validate the data
              if (!npanxx || npanxx.length !== 6 || isNaN(interRate) || isNaN(intraRate) || isNaN(indetermRate)) {
                const reason = !npanxx 
                  ? 'NPANXX is empty' 
                  : npanxx.length !== 6 
                    ? `NPANXX length (${npanxx.length}) is not 6 digits` 
                    : isNaN(interRate) 
                      ? 'Invalid interstate rate' 
                      : isNaN(intraRate) 
                        ? 'Invalid intrastate rate' 
                        : 'Invalid indeterminate rate';
                
                console.warn(`Row ${startLine + index} invalid: ${reason}. Values: NPANXX="${npanxx}", interstate="${interRateStr}", intrastate="${intraRateStr}"`);
                
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

            // Store valid records based on storage strategy
            if (validRecords.length > 0) {
              if (this.isUsingMemoryStorage()) {
                // Store in-memory
                this.store.storeInMemoryData(tableName, validRecords);
                console.log(`[USService] Stored ${validRecords.length} records in memory for table: ${tableName}`);
              } else {
                // Store using the storage service
                const chunkSize = 1000;
                for (let i = 0; i < validRecords.length; i += chunkSize) {
                  const chunk = validRecords.slice(i, i + chunkSize);
                  console.log(`Inserting chunk ${i / chunkSize + 1}/${Math.ceil(validRecords.length/chunkSize)}, size: ${chunk.length}`);
                  
                  // Add a small delay between chunks to ensure proper DB processing
                  if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                  
                  await this.storageService.storeData(tableName, chunk);
                }
              }
            } else {
              console.warn(`No valid records to store for file '${file.name}'`);
            }
            
            // Tell the store which file was uploaded
            this.store.addFileUploaded(file.name, tableName);
            resolve({ fileName: file.name, records: validRecords });
          } catch (error) {
            console.error('Error in processFile:', error);
            reject(error);
          }
        },
        error: error => reject(new Error(`Failed to process CSV: ${error.message}`)),
      });
    });
  }

  async clearData(): Promise<void> {
    try {
      if (this.isUsingMemoryStorage()) {
        // Clear in-memory data
        this.store.clearAllInMemoryData();
        console.log('[USService] Cleared all in-memory data');
      } else {
        // Clear database data
        await this.initializeStorage();
        await this.storageService.clearAllData();
      }
      this.store.resetFiles();
    } catch (error) {
      console.error('Failed to clear US data:', error);
      throw error;
    }
  }

  async removeTable(tableName: string): Promise<void> {
    try {
      if (this.isUsingMemoryStorage()) {
        // Remove from in-memory
        this.store.removeInMemoryData(tableName);
        console.log(`[USService] Removed in-memory table: ${tableName}`);
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

  async getData(tableName: string): Promise<USStandardizedData[]> {
    try {
      if (this.isUsingMemoryStorage()) {
        // Get from in-memory
        const data = this.store.getInMemoryData(tableName);
        console.log(`[USService] Retrieved ${data.length} records from in-memory table: ${tableName}`);
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
        console.log(`[USService] Count for in-memory table ${tableName}: ${count}`);
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
        console.log(`[USService] Listed ${Object.keys(tables).length} in-memory tables`);
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
      console.log(`[USService] Already using ${newStrategy} strategy, no change needed`);
      return;
    }

    console.log(`[USService] Switching storage strategy from ${storageConfig.storageType} to ${newStrategy}`);
    
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
          console.log(`[USService] Migrated ${data.length} records from IndexedDB to memory for table: ${tableName}`);
        }
      } else {
        // Switching from memory to IndexedDB
        // First, get all in-memory tables
        const tables = this.store.getInMemoryTables;
        
        // For each table, get the data and store it in IndexedDB
        for (const tableName of Object.keys(tables)) {
          const data = this.store.getInMemoryData(tableName);
          await this.storageService.storeData(tableName, data);
          console.log(`[USService] Migrated ${data.length} records from memory to IndexedDB for table: ${tableName}`);
        }
      }
      
      // Update the storage config
      storageConfig.storageType = newStrategy;
      console.log(`[USService] Storage strategy switched to ${newStrategy}`);
    } catch (error) {
      console.error(`Failed to switch storage strategy to ${newStrategy}:`, error);
      throw error;
    }
  }
}
