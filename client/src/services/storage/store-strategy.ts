/**
 * Store Strategy
 * 
 * Implements the storage strategy interface using Pinia store for in-memory storage.
 * This provides a fast, memory-based alternative to IndexedDB.
 */

import { BaseStorageStrategy } from './storage-strategy';
import { DBNameType } from '@/types/app-types';
import { storageConfig } from '@/config/storage-config';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * Global in-memory storage that persists for the lifetime of the application
 */
const dataStorage = ref<Record<string, Record<string, any[]>>>({});

/**
 * Helper function to get or create a database storage section
 */
function getOrCreateDbStorage(dbName: string): Record<string, any[]> {
  if (!dataStorage.value[dbName]) {
    dataStorage.value[dbName] = {};
  }
  return dataStorage.value[dbName];
}

/**
 * Create a Pinia store for each database type
 * This allows reactive access to the storage data
 * @param dbName The database name to create a store for
 */
export function createStorageStore(dbName: DBNameType) {
  return defineStore(`${dbName}-storage`, () => {
    // Get the database section from global storage
    const dbStorage = getOrCreateDbStorage(dbName);
    
    // Computed to get all table names in this database
    const tableNames = computed(() => Object.keys(dbStorage));
    
    // Function to get data for a specific table
    function getTableData<T>(tableName: string): T[] {
      return (dbStorage[tableName] || []) as T[];
    }
    
    // Function to set data for a specific table
    function setTableData<T>(tableName: string, data: T[]): void {
      dbStorage[tableName] = [...data];
    }
    
    // Function to remove a table
    function removeTable(tableName: string): void {
      delete dbStorage[tableName];
    }
    
    // Function to clear all tables
    function clearAllTables(): void {
      Object.keys(dbStorage).forEach(key => {
        delete dbStorage[key];
      });
    }
    
    return {
      tableNames,
      getTableData,
      setTableData,
      removeTable,
      clearAllTables
    };
  });
}

// Cache for store instances
const storeCache: Record<string, ReturnType<ReturnType<typeof createStorageStore>>> = {};

/**
 * Get or create a store instance for a database
 */
function getStore(dbName: DBNameType) {
  if (!storeCache[dbName]) {
    const storeCreator = createStorageStore(dbName);
    storeCache[dbName] = storeCreator();
  }
  return storeCache[dbName];
}

/**
 * Implementation of the storage strategy using Pinia store
 */
export class StoreStrategy<T> extends BaseStorageStrategy<T> {
  private store: ReturnType<ReturnType<typeof createStorageStore>> | null = null;
  
  constructor(dbName: DBNameType) {
    super(dbName);
    this.logOperation('Constructor', { dbName });
  }
  
  /**
   * Initialize the store
   */
  async initialize(): Promise<void> {
    try {
      if (this.store) {
        this.logOperation('Store already initialized');
        return;
      }
      
      this.logOperation('Initializing store', { dbName: this.dbName });
      
      // Get the store instance
      this.store = getStore(this.dbName);
      
      this.logOperation('Store initialized', { 
        tables: this.store.tableNames
      });
    } catch (error) {
      this.logOperation('Initialization error', error);
      throw new Error(`Failed to initialize store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Store data in the store
   * Implements chunking for large datasets to optimize memory usage
   */
  async storeData(tableName: string, data: T[]): Promise<void> {
    if (storageConfig.enableLogging) {
      console.log(`[StoreStrategy] Storing ${data.length} records in ${tableName}`);
    }
    
    try {
      // Ensure store is initialized
      await this.ensureInitialized();
      
      // For large datasets, use chunking to avoid memory spikes
      const CHUNK_SIZE = 5000; // Adjust based on performance testing
      
      if (data.length > CHUNK_SIZE) {
        this.logOperation('Using chunked storage for large dataset', { 
          tableName, 
          totalRecords: data.length,
          chunkSize: CHUNK_SIZE,
          chunks: Math.ceil(data.length / CHUNK_SIZE)
        });
        
        // Get existing data if any
        const existingData = this.store!.getTableData<T>(tableName) || [];
        
        // Process in chunks
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          
          // For the first chunk, we combine with existing data
          if (i === 0) {
            this.store!.setTableData(tableName, [...existingData, ...chunk]);
          } else {
            // For subsequent chunks, we append to the table
            const currentData = this.store!.getTableData<T>(tableName) || [];
            this.store!.setTableData(tableName, [...currentData, ...chunk]);
          }
          
          this.logOperation('Chunk processed', { 
            tableName, 
            chunkIndex: Math.floor(i / CHUNK_SIZE) + 1,
            chunkSize: chunk.length,
            progress: `${Math.min(i + CHUNK_SIZE, data.length)}/${data.length}`
          });
          
          // Allow UI to update and garbage collection to run
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } else {
        // For smaller datasets, store all at once
        const existingData = this.store!.getTableData<T>(tableName) || [];
        this.store!.setTableData(tableName, [...existingData, ...data]);
      }
      
      this.logOperation('Data stored successfully', { 
        tableName, 
        recordCount: data.length 
      });
    } catch (error) {
      this.logOperation('Store data error', { tableName, error });
      throw new Error(`Failed to store data in store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Retrieve data from the store
   * Supports optional pagination for large datasets
   * @param tableName The table to retrieve data from
   * @param options Optional pagination options
   * @returns The data from the table, or null if the table doesn't exist
   */
  async getData(
    tableName: string, 
    options?: { 
      page?: number; 
      pageSize?: number;
      filter?: (item: T) => boolean;
    }
  ): Promise<T[] | null> {
    this.logOperation('Getting data', { tableName, options });
    
    try {
      // Ensure store is initialized
      await this.ensureInitialized();
      
      // Check if table exists
      if (!this.tableExists(tableName)) {
        this.logOperation('Table not found', { tableName });
        return null;
      }
      
      // Retrieve data
      const allData = this.store!.getTableData<T>(tableName);
      
      // Apply filter if provided
      const filteredData = options?.filter 
        ? allData.filter(options.filter)
        : allData;
      
      // If pagination is requested
      if (options?.page !== undefined && options?.pageSize) {
        const page = Math.max(1, options.page);
        const pageSize = Math.max(1, options.pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        this.logOperation('Data retrieved with pagination', { 
          tableName, 
          page,
          pageSize,
          totalRecords: filteredData.length,
          returnedRecords: paginatedData.length,
          totalPages: Math.ceil(filteredData.length / pageSize)
        });
        
        return paginatedData;
      }
      
      this.logOperation('Data retrieved', { 
        tableName, 
        recordCount: filteredData.length 
      });
      
      return filteredData;
    } catch (error) {
      this.logOperation('Get data error', { tableName, error });
      throw new Error(`Failed to get data from store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Remove a table from the store
   */
  async removeData(tableName: string): Promise<void> {
    this.logOperation('Removing data', { tableName });
    
    try {
      // Ensure store is initialized
      await this.ensureInitialized();
      
      // Check if table exists
      if (!this.tableExists(tableName)) {
        this.logOperation('Table not found, nothing to remove', { tableName });
        return;
      }
      
      // Remove table
      this.store!.removeTable(tableName);
      
      this.logOperation('Table removed', { tableName });
    } catch (error) {
      this.logOperation('Remove data error', { tableName, error });
      throw new Error(`Failed to remove data from store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Clear all data in the store
   */
  async clearAllData(): Promise<void> {
    this.logOperation('Clearing all data');
    
    try {
      // Ensure store is initialized
      await this.ensureInitialized();
      
      // Clear all tables
      this.store!.clearAllTables();
      
      this.logOperation('All data cleared');
    } catch (error) {
      this.logOperation('Clear all data error', error);
      throw new Error(`Failed to clear all data from store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get the count of items in a table
   */
  async getCount(tableName: string): Promise<number> {
    this.logOperation('Getting count', { tableName });
    
    try {
      // Ensure store is initialized
      await this.ensureInitialized();
      
      // Check if table exists
      if (!this.tableExists(tableName)) {
        this.logOperation('Table not found, count is 0', { tableName });
        return 0;
      }
      
      // Get count
      const data = this.store!.getTableData(tableName);
      const count = data.length;
      
      this.logOperation('Count retrieved', { tableName, count });
      
      return count;
    } catch (error) {
      this.logOperation('Get count error', { tableName, error });
      throw new Error(`Failed to get count from store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List all tables in the store with their record counts
   */
  async listTables(): Promise<{ tableName: string; recordCount: number }[]> {
    this.logOperation('Listing tables');
    
    try {
      // Ensure store is initialized
      await this.ensureInitialized();
      
      // Get all table names
      const tableNames = this.store!.tableNames;
      
      // Get count for each table
      const result = tableNames.map(tableName => {
        const data = this.store!.getTableData(tableName);
        return { tableName, recordCount: data.length };
      });
      
      this.logOperation('Tables listed', { tableCount: result.length });
      
      return result;
    } catch (error) {
      this.logOperation('List tables error', error);
      throw new Error(`Failed to list tables from store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Helper method to ensure the store is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.store) {
      await this.initialize();
    }
  }
  
  /**
   * Helper method to check if a table exists
   */
  private tableExists(tableName: string): boolean {
    return this.store!.tableNames.includes(tableName);
  }
  
  /**
   * Override log operation to use storage config setting
   */
  protected logOperation(operation: string, details?: any): void {
    if (storageConfig.enableLogging) {
      console.log(`[StoreStrategy] ${operation}`, details || '');
    }
  }
  
  /**
   * Calculate the memory usage of the store
   * @returns The memory usage in MB
   */
  async getMemoryUsage(): Promise<number> {
    try {
      await this.ensureInitialized();
      
      // Get all data from all tables
      const allData: any[] = [];
      for (const tableName of this.store!.tableNames) {
        const data = this.store!.getTableData(tableName);
        allData.push(...data);
      }
      
      // Estimate size by serializing to JSON and measuring string length
      // This is a rough estimate, but gives a general idea of memory usage
      const jsonString = JSON.stringify(allData);
      const bytes = new TextEncoder().encode(jsonString).length;
      const megabytes = bytes / (1024 * 1024);
      
      this.logOperation('Memory usage calculated', { megabytes });
      
      return megabytes;
    } catch (error) {
      this.logOperation('Get memory usage error', error);
      return 0;
    }
  }
} 