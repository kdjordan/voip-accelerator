/**
 * StorageStrategy Interface
 * 
 * Defines the contract for different storage implementations (in-memory and IndexedDB).
 * All storage strategies must implement these core methods.
 */

import { DBNameType } from '@/types/app-types';

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

export interface StorageStrategy<T> {
  /**
   * Initialize the storage mechanism
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;
  
  /**
   * Store data with the given key
   * @param tableName The name of the table/collection to store the data in
   * @param data The data array to store
   * @returns Promise that resolves when data has been stored
   */
  storeData(tableName: string, data: T[]): Promise<void>;
  
  /**
   * Retrieve data by key
   * @param tableName The name of the table/collection to retrieve from
   * @param options Optional pagination and filtering options
   * @returns Promise that resolves with the data array, or null if not found
   */
  getData(tableName: string, options?: DataRetrievalOptions<T>): Promise<T[] | null>;
  
  /**
   * Remove data for a specific key
   * @param tableName The name of the table/collection to remove
   * @returns Promise that resolves when data has been removed
   */
  removeData(tableName: string): Promise<void>;
  
  /**
   * Clear all data for this storage strategy
   * @returns Promise that resolves when all data has been cleared
   */
  clearAllData(): Promise<void>;
  
  /**
   * Get the count of items in a table
   * @param tableName The name of the table/collection
   * @returns Promise that resolves with the count
   */
  getCount(tableName: string): Promise<number>;
  
  /**
   * List all tables/collections in this storage
   * @returns Promise that resolves with a list of table information
   */
  listTables(): Promise<{ tableName: string; recordCount: number }[]>;
}

/**
 * Base storage context with common functionality
 */
export abstract class BaseStorageStrategy<T> implements StorageStrategy<T> {
  protected dbName: DBNameType;
  
  constructor(dbName: DBNameType) {
    this.dbName = dbName;
  }
  
  abstract initialize(): Promise<void>;
  abstract storeData(tableName: string, data: T[]): Promise<void>;
  abstract getData(tableName: string, options?: DataRetrievalOptions<T>): Promise<T[] | null>;
  abstract removeData(tableName: string): Promise<void>;
  abstract clearAllData(): Promise<void>;
  abstract getCount(tableName: string): Promise<number>;
  abstract listTables(): Promise<{ tableName: string; recordCount: number }[]>;
  
  /**
   * Log a storage operation if logging is enabled
   * @param operation The name of the operation
   * @param details Additional details about the operation
   */
  protected logOperation(operation: string, details?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${this.constructor.name}] ${operation}`, details || '');
    }
  }
} 