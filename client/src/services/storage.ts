/**
 * Consolidated Storage Service
 *
 * This file combines the functionality from:
 * - storage-factory.ts
 * - storage-strategy.ts
 * - storage.service.ts
 * - store-strategy.ts
 *
 * into a single, simplified in-memory storage implementation using Pinia.
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { DBNameType } from '@/types/app-types';

// ========================
// Storage Types
// ========================

/**
 * Options for data retrieval operations
 */
export interface DataRetrievalOptions<T> {
  /** Page number (1-based) for pagination */
  page?: number;

  /** Number of items per page */
  pageSize?: number;

  /** Optional filter function to apply to the data */
  filter?: (item: T) => boolean;
}

// ========================
// Pinia Store Implementation
// ========================

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
 */
function createStorageStore(dbName: DBNameType) {
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
      Object.keys(dbStorage).forEach((key) => {
        delete dbStorage[key];
      });
    }

    return {
      tableNames,
      getTableData,
      setTableData,
      removeTable,
      clearAllTables,
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

// ========================
// Storage Service
// ========================

/**
 * Storage Service for managing application data
 * Simplified to use in-memory Pinia storage only
 */
export class StorageService<T = any> {
  private store: ReturnType<ReturnType<typeof createStorageStore>> | null = null;
  private dbName: DBNameType;
  private isInitialized = ref(false);
  private initializing = ref(false);
  private error = ref<Error | null>(null);

  /**
   * Creates a new StorageService instance
   * @param dbName The database name to use
   */
  constructor(dbName: DBNameType) {
    this.dbName = dbName;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[StorageService] Created for database: ${dbName}`);
    }
  }

  /**
   * The current initialization status
   */
  public get initialized() {
    return computed(() => this.isInitialized.value);
  }

  /**
   * Whether initialization is currently in progress
   */
  public get loading() {
    return computed(() => this.initializing.value);
  }

  /**
   * The last error that occurred during storage operations, if any
   */
  public get lastError() {
    return computed(() => this.error.value);
  }

  /**
   * Initialize the storage service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized.value) {
      return;
    }

    try {
      this.initializing.value = true;
      this.error.value = null;

      // Initialize the store
      this.store = getStore(this.dbName);
      this.isInitialized.value = true;

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[StorageService] Initialized storage for database: ${this.dbName}`);
      }
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[StorageService] Failed to initialize storage for database: ${this.dbName}`,
        err
      );
      throw this.error.value;
    } finally {
      this.initializing.value = false;
    }
  }

  /**
   * Ensure the storage is initialized before proceeding
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized.value) {
      await this.initialize();
    }
  }

  /**
   * Store data in the specified table
   * @param tableName The table to store data in
   * @param data Array of records to store
   */
  public async storeData(tableName: string, data: T[]): Promise<void> {
    try {
      this.error.value = null;
      await this.ensureInitialized();

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[StorageService] Storing ${data.length} records in table: ${tableName}`);
      }

      // Get existing data if any
      const existingData = this.store!.getTableData<T>(tableName) || [];

      // Use chunking for large datasets
      const CHUNK_SIZE = 5000;

      if (data.length > CHUNK_SIZE) {
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

          // Allow UI to update and garbage collection to run
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      } else {
        // For smaller datasets, store all at once
        this.store!.setTableData(tableName, [...existingData, ...data]);
      }
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(`[StorageService] Failed to store data in table: ${tableName}`, err);
      throw this.error.value;
    }
  }

  /**
   * Retrieve data from the specified table
   * @param tableName The table to get data from
   * @param options Optional pagination and filtering options
   * @returns Promise resolving to an array of records
   */
  public async getData(tableName: string, options?: DataRetrievalOptions<T>): Promise<T[]> {
    try {
      this.error.value = null;
      await this.ensureInitialized();

      // Retrieve data
      const allData = this.store!.getTableData<T>(tableName) || [];

      // Apply filter if provided
      const filteredData = options?.filter ? allData.filter(options.filter) : allData;

      // Apply pagination if requested
      if (options?.page !== undefined && options?.pageSize) {
        const page = Math.max(1, options.page);
        const pageSize = Math.max(1, options.pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return filteredData.slice(startIndex, endIndex);
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[StorageService] Retrieved ${filteredData.length} records from table: ${tableName}`
        );
      }

      return filteredData;
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(`[StorageService] Failed to get data from table: ${tableName}`, err);
      throw this.error.value;
    }
  }

  /**
   * Remove a specific table and all its data
   * @param tableName The table to remove
   */
  public async removeData(tableName: string): Promise<void> {
    try {
      this.error.value = null;
      await this.ensureInitialized();
      this.store!.removeTable(tableName);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[StorageService] Removed table: ${tableName}`);
      }
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(`[StorageService] Failed to remove table: ${tableName}`, err);
      throw this.error.value;
    }
  }

  /**
   * Clear all data from all tables in this database
   */
  public async clearAllData(): Promise<void> {
    try {
      this.error.value = null;
      await this.ensureInitialized();
      this.store!.clearAllTables();

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[StorageService] Cleared all data for database: ${this.dbName}`);
      }
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(`[StorageService] Failed to clear all data for database: ${this.dbName}`, err);
      throw this.error.value;
    }
  }

  /**
   * Get the number of records in the specified table
   * @param tableName The table to count records in
   * @returns Promise resolving to the count of records
   */
  public async getCount(tableName: string): Promise<number> {
    try {
      this.error.value = null;
      await this.ensureInitialized();
      const data = this.store!.getTableData<T>(tableName) || [];

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[StorageService] Count for table ${tableName}: ${data.length}`);
      }

      return data.length;
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(`[StorageService] Failed to get count for table: ${tableName}`, err);
      throw this.error.value;
    }
  }

  /**
   * List all tables in the database with their record counts
   * @returns Promise resolving to an object mapping table names to record counts
   */
  public async listTables(): Promise<Record<string, number>> {
    try {
      this.error.value = null;
      await this.ensureInitialized();

      const tables: Record<string, number> = {};
      for (const tableName of this.store!.tableNames) {
        const count = (this.store!.getTableData(tableName) || []).length;
        tables[tableName] = count;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[StorageService] Listed ${Object.keys(tables).length} tables for database: ${
            this.dbName
          }`
        );
      }

      return tables;
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(`[StorageService] Failed to list tables for database: ${this.dbName}`, err);
      throw this.error.value;
    }
  }
}

/**
 * Create and return a StorageService instance for the specified database
 * @param dbName The database name to create a service for
 * @returns A new StorageService instance
 */
export function useStorage<T = any>(dbName: DBNameType): StorageService<T> {
  return new StorageService<T>(dbName);
}
