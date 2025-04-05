import { ref, computed } from 'vue';
import { StorageStrategy } from './storage-strategy';
import { getStorageStrategy } from './storage-factory';
import { DBNameType } from '@/types/app-types';

/**
 * Central service for managing application storage using the configured strategy.
 * Provides methods for storing, retrieving, and managing data with automatic
 * strategy selection based on application configuration.
 */
export class StorageService<T = any> {
  private strategy: StorageStrategy<T>;
  private dbName: DBNameType;
  private isInitialized = ref(false);
  private initializing = ref(false);
  private error = ref<Error | null>(null);

  /**
   * Creates a new StorageService instance for the specified database.
   *
   * @param dbName - The database name to use for this storage service
   */
  constructor(dbName: DBNameType) {
    this.dbName = dbName;
    // Store a placeholder initially, it will be properly initialized during initialize()
    this.strategy = {} as StorageStrategy<T>;

    if (true) {
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
   * Initialize the storage service and underlying strategy
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized.value) {
      return;
    }

    try {
      this.initializing.value = true;
      this.error.value = null;

      // Initialize the actual strategy here
      this.strategy = await getStorageStrategy<T>(this.dbName);
      this.isInitialized.value = true;

      if (true) {
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
   *
   * @param tableName - The table to store data in
   * @param data - Array of records to store
   */
  public async storeData(tableName: string, data: T[]): Promise<void> {
    try {
      this.error.value = null;
      await this.ensureInitialized();
      await this.strategy.storeData(tableName, data);

      if (true) {
        console.log(`[StorageService] Stored ${data.length} records in table: ${tableName}`);
      }
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(`[StorageService] Failed to store data in table: ${tableName}`, err);
      throw this.error.value;
    }
  }

  /**
   * Retrieve data from the specified table
   *
   * @param tableName - The table to get data from
   * @returns Promise resolving to an array of records
   */
  public async getData(tableName: string): Promise<T[]> {
    try {
      this.error.value = null;
      await this.ensureInitialized();
      const data = await this.strategy.getData(tableName);

      if (true) {
        console.log(
          `[StorageService] Retrieved ${data?.length || 0} records from table: ${tableName}`
        );
      }

      return data || [];
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(`[StorageService] Failed to get data from table: ${tableName}`, err);
      throw this.error.value;
    }
  }

  /**
   * Remove a specific table and all its data
   *
   * @param tableName - The table to remove
   */
  public async removeData(tableName: string): Promise<void> {
    try {
      this.error.value = null;
      await this.ensureInitialized();
      await this.strategy.removeData(tableName);

      if (true) {
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
      await this.strategy.clearAllData();

      if (true) {
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
   *
   * @param tableName - The table to count records in
   * @returns Promise resolving to the count of records
   */
  public async getCount(tableName: string): Promise<number> {
    try {
      this.error.value = null;
      await this.ensureInitialized();
      const count = await this.strategy.getCount(tableName);

      if (true) {
        console.log(`[StorageService] Count for table ${tableName}: ${count}`);
      }

      return count;
    } catch (err) {
      this.error.value = err instanceof Error ? err : new Error(String(err));
      console.error(`[StorageService] Failed to get count for table: ${tableName}`, err);
      throw this.error.value;
    }
  }

  /**
   * List all tables in the database with their record counts
   *
   * @returns Promise resolving to an object mapping table names to record counts
   */
  public async listTables(): Promise<Record<string, number>> {
    try {
      this.error.value = null;
      await this.ensureInitialized();
      const tablesArray = await this.strategy.listTables();

      // Convert the array format to the Record format
      const tables: Record<string, number> = {};
      for (const item of tablesArray) {
        tables[item.tableName] = item.recordCount;
      }

      if (true) {
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

  /**
   * Get the current storage strategy instance
   */
  public getStrategy(): StorageStrategy<T> {
    return this.strategy;
  }

  /**
   * Change the storage strategy at runtime
   *
   * @param newStrategy - The new storage strategy to use
   */
  public async changeStrategy(newStrategy: StorageStrategy<T>): Promise<void> {
    if (true) {
      console.log(`[StorageService] Changing strategy for database: ${this.dbName}`);
    }

    // Get all tables and their data from the current strategy
    const tablesResult = await this.strategy.listTables();
    const dataToMigrate: Record<string, T[]> = {};

    // Collect all data from each table
    for (const { tableName } of tablesResult) {
      const data = await this.strategy.getData(tableName);
      if (data) {
        dataToMigrate[tableName] = data;

        if (true) {
          console.log(
            `[StorageService] Collected ${data.length} records from table ${tableName} for migration`
          );
        }
      }
    }

    // Update the strategy
    this.strategy = newStrategy;
    this.isInitialized.value = false;
    await this.initialize();

    // Migrate data to the new strategy
    for (const tableName of Object.keys(dataToMigrate)) {
      if (dataToMigrate[tableName].length > 0) {
        await this.strategy.storeData(tableName, dataToMigrate[tableName]);

        if (true) {
          console.log(
            `[StorageService] Migrated ${dataToMigrate[tableName].length} records to table ${tableName} in new strategy`
          );
        }
      }
    }

    if (true) {
      console.log(`[StorageService] Strategy migration completed for database: ${this.dbName}`);
    }
  }
}

/**
 * Create and return a StorageService instance for the specified database
 *
 * @param dbName - The database name to use
 * @returns A new StorageService instance
 */
export function useStorage<T = any>(dbName: DBNameType): StorageService<T> {
  return new StorageService<T>(dbName);
}
