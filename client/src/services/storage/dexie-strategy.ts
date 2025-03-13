/**
 * DexieJS Storage Strategy
 * 
 * Adapts the existing DexieJS implementation to the storage strategy interface.
 * This ensures backward compatibility with the current codebase.
 */

import { BaseStorageStrategy, DataRetrievalOptions } from './storage-strategy';
import { DBNameType, DBSchemas } from '@/types/app-types';
import Dexie, { Table } from 'dexie';
import { storageConfig } from '@/config/storage-config';
import useDexieDB from '@/composables/useDexieDB';

export class DexieStrategy<T> extends BaseStorageStrategy<T> {
  private db: Dexie | null = null;
  private tables = new Set<string>();

  constructor(dbName: DBNameType) {
    super(dbName);
    this.logOperation('Constructor', { dbName });
  }

  /**
   * Initialize the DexieJS database
   */
  async initialize(): Promise<void> {
    try {
      if (this.db) {
        this.logOperation('Database already initialized');
        return;
      }

      this.logOperation('Initializing database', { dbName: this.dbName });
      
      // Use the existing DexieDB composable to maintain compatibility
      const { getDB } = useDexieDB();
      this.db = await getDB(this.dbName);
      
      // Get the current tables
      this.tables = new Set(this.db.tables.map(table => table.name));
      
      this.logOperation('Database initialized', { 
        tables: Array.from(this.tables),
        version: this.db.verno
      });
    } catch (error) {
      this.logOperation('Initialization error', error);
      throw new Error(`Failed to initialize DexieJS database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Store data in the database
   */
  async storeData(tableName: string, data: T[]): Promise<void> {
    if (storageConfig.enableLogging) {
      console.log(`[DexieStrategy] Storing ${data.length} records in ${tableName}`);
    }

    try {
      // Ensure DB is initialized
      await this.ensureInitialized();
      
      // Ensure table exists
      await this.ensureTableExists(tableName);
      
      // Store data in chunks for better performance
      const chunkSize = 1000;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.db!.table(tableName).bulkPut(chunk);
        
        if (storageConfig.enableLogging && i + chunkSize < data.length) {
          console.log(`[DexieStrategy] Stored chunk ${i/chunkSize + 1} of ${Math.ceil(data.length/chunkSize)}`);
        }
      }
      
      this.logOperation('Data stored successfully', { 
        tableName, 
        recordCount: data.length 
      });
    } catch (error) {
      this.logOperation('Store data error', { tableName, error });
      throw new Error(`Failed to store data in DexieJS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieve data from the database
   * Supports optional pagination and filtering
   */
  async getData(
    tableName: string, 
    options?: DataRetrievalOptions<T>
  ): Promise<T[] | null> {
    this.logOperation('Getting data', { tableName, options });
    
    try {
      // Ensure DB is initialized
      await this.ensureInitialized();
      
      // Check if table exists
      if (!this.tableExists(tableName)) {
        this.logOperation('Table not found', { tableName });
        return null;
      }
      
      // Get the table reference
      const table = this.db!.table(tableName);
      
      // If pagination is requested
      if (options?.page !== undefined && options?.pageSize) {
        const page = Math.max(1, options.page);
        const pageSize = Math.max(1, options.pageSize);
        const offset = (page - 1) * pageSize;
        
        // Get total count for logging
        const totalCount = await table.count();
        
        // Apply pagination using offset and limit
        const data = await table.offset(offset).limit(pageSize).toArray();
        
        // If filter is provided, apply it in memory
        // Note: Ideally, we would apply the filter before pagination,
        // but Dexie doesn't support complex filtering directly
        const filteredData = options.filter 
          ? data.filter(options.filter)
          : data;
        
        this.logOperation('Data retrieved with pagination', { 
          tableName, 
          page,
          pageSize,
          totalRecords: totalCount,
          returnedRecords: filteredData.length,
          totalPages: Math.ceil(totalCount / pageSize)
        });
        
        return filteredData;
      } else {
        // Retrieve all data
        const data = await table.toArray();
        
        // If filter is provided, apply it in memory
        const filteredData = options?.filter 
          ? data.filter(options.filter)
          : data;
        
        this.logOperation('Data retrieved', { 
          tableName, 
          recordCount: filteredData.length 
        });
        
        return filteredData;
      }
    } catch (error) {
      this.logOperation('Get data error', { tableName, error });
      throw new Error(`Failed to get data from DexieJS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a table from the database
   */
  async removeData(tableName: string): Promise<void> {
    this.logOperation('Removing data', { tableName });
    
    try {
      // Ensure DB is initialized
      await this.ensureInitialized();
      
      // Check if table exists
      if (!this.tableExists(tableName)) {
        this.logOperation('Table not found, nothing to remove', { tableName });
        return;
      }
      
      // Close the database to modify schema
      await this.db!.close();
      
      // Remove the table by setting it to null in the next version
      this.db!.version(this.db!.verno + 1).stores({
        [tableName]: null // This deletes the table
      });
      
      // Reopen the database
      await this.db!.open();
      
      // Update tables set
      this.tables.delete(tableName);
      
      this.logOperation('Table removed', { tableName });
    } catch (error) {
      this.logOperation('Remove data error', { tableName, error });
      throw new Error(`Failed to remove data from DexieJS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clear all data in the database
   */
  async clearAllData(): Promise<void> {
    this.logOperation('Clearing all data');
    
    try {
      // Ensure DB is initialized
      await this.ensureInitialized();
      
      // Get all table names
      const tableNames = Array.from(this.tables);
      
      // Clear each table
      for (const tableName of tableNames) {
        await this.db!.table(tableName).clear();
      }
      
      this.logOperation('All data cleared', { tableCount: tableNames.length });
    } catch (error) {
      this.logOperation('Clear all data error', error);
      throw new Error(`Failed to clear all data from DexieJS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the count of items in a table
   */
  async getCount(tableName: string): Promise<number> {
    this.logOperation('Getting count', { tableName });
    
    try {
      // Ensure DB is initialized
      await this.ensureInitialized();
      
      // Check if table exists
      if (!this.tableExists(tableName)) {
        this.logOperation('Table not found, count is 0', { tableName });
        return 0;
      }
      
      // Get count
      const count = await this.db!.table(tableName).count();
      this.logOperation('Count retrieved', { tableName, count });
      
      return count;
    } catch (error) {
      this.logOperation('Get count error', { tableName, error });
      throw new Error(`Failed to get count from DexieJS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all tables in the database with their record counts
   */
  async listTables(): Promise<{ tableName: string; recordCount: number }[]> {
    this.logOperation('Listing tables');
    
    try {
      // Ensure DB is initialized
      await this.ensureInitialized();
      
      // Get all table names
      const tableNames = Array.from(this.tables);
      
      // Get count for each table
      const result = await Promise.all(
        tableNames.map(async (tableName) => {
          const recordCount = await this.db!.table(tableName).count();
          return { tableName, recordCount };
        })
      );
      
      this.logOperation('Tables listed', { tableCount: result.length });
      
      return result;
    } catch (error) {
      this.logOperation('List tables error', error);
      throw new Error(`Failed to list tables from DexieJS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper method to ensure the database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  /**
   * Helper method to check if a table exists
   */
  private tableExists(tableName: string): boolean {
    return this.tables.has(tableName);
  }

  /**
   * Helper method to ensure a table exists
   */
  private async ensureTableExists(tableName: string): Promise<void> {
    if (this.tableExists(tableName)) {
      return;
    }
    
    try {
      this.logOperation('Creating table', { tableName });
      
      // Get the schema for this database type
      const schema = DBSchemas[this.dbName as keyof typeof DBSchemas] || '++id';
      
      // Close the database to modify schema
      await this.db!.close();
      
      // Create the table in the next version
      this.db!.version(this.db!.verno + 1).stores({
        [tableName]: schema
      });
      
      // Reopen the database
      await this.db!.open();
      
      // Update tables set
      this.tables.add(tableName);
      
      this.logOperation('Table created', { tableName, schema });
    } catch (error) {
      this.logOperation('Ensure table exists error', { tableName, error });
      throw new Error(`Failed to create table in DexieJS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Override log operation to use storage config setting
   */
  protected logOperation(operation: string, details?: any): void {
    if (storageConfig.enableLogging) {
      console.log(`[DexieStrategy] ${operation}`, details || '');
    }
  }
} 