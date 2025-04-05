import { type USStandardizedData, type InvalidUsRow } from '@/types/domains/us-types';
import { DBName } from '@/types/app-types';
import { useUsStore } from '@/stores/us-store';
import Papa from 'papaparse';
import { StorageService, useStorage } from '@/services/storage/storage.service';
import { useLergStore } from '@/stores/lerg-store';
import { COUNTRY_CODES } from '@/types/constants/country-codes';

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
}

export class USService {
  private store: UsStore;
  private storageService: StorageService<USStandardizedData>;

  constructor() {
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
    return true;
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

            // Store valid records based on storage strategy
            if (validRecords.length > 0) {
              if (this.isUsingMemoryStorage()) {
                // Store in-memory
                this.store.storeInMemoryData(tableName, validRecords);
              } else {
                // Store using the storage service
                const chunkSize = 1000;
                for (let i = 0; i < validRecords.length; i += chunkSize) {
                  const chunk = validRecords.slice(i, i + chunkSize);

                  // Add a small delay between chunks to ensure proper DB processing
                  if (i > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                  }

                  await this.storageService.storeData(tableName, chunk);
                }
              }
            }

            // Determine the component ID for the file that was just processed
            let componentId = '';
            if (this.store.getFileNameByComponent('us1') === file.name) {
              componentId = 'us1';
            } else if (this.store.getFileNameByComponent('us2') === file.name) {
              componentId = 'us2';
            } else {
              // If we can't determine the component ID, default to us1 if it's empty
              componentId = this.store.getFileNameByComponent('us1') ? 'us2' : 'us1';
            }

            // Calculate and store file stats
            await this.calculateFileStats(componentId, file.name);

            resolve({ fileName: file.name, records: validRecords });
          } catch (error) {
            console.error('Error in processFile:', error);
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
      console.error(`Error calculating file stats for ${componentId}:`, error);
    }
  }

  async clearData(): Promise<void> {
    try {
      if (this.isUsingMemoryStorage()) {
        // Clear in-memory data
        this.store.clearAllInMemoryData();
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
      } else {
        // Remove from database
        await this.initializeStorage();
        await this.storageService.removeData(tableName);
      }
    } catch (error) {
      console.error(`Failed to remove table ${tableName}:`, error);
      throw error;
    }
  }

  async getData(tableName: string): Promise<USStandardizedData[]> {
    try {
      if (this.isUsingMemoryStorage()) {
        // Get from in-memory
        return this.store.getInMemoryData(tableName);
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
        return this.store.getInMemoryDataCount(tableName);
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
        return this.store.getInMemoryTables;
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
    if (newStrategy === 'memory') {
      return;
    }

    try {
      // Switching from memory to IndexedDB
      // First, get all in-memory tables
      const tables = this.store.getInMemoryTables;

      // For each table, get the data and store it in IndexedDB
      for (const tableName of Object.keys(tables)) {
        const data = this.store.getInMemoryData(tableName);
        await this.storageService.storeData(tableName, data);
      }
    } catch (error) {
      console.error(`Failed to switch storage strategy to ${newStrategy}:`, error);
      throw error;
    }
  }
}
