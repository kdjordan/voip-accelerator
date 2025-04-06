import Dexie from 'dexie';

/**
 * Base Dexie Service providing generic CRUD operations for Dexie tables
 *
 * @template T The entity type
 * @template K The key type (string | number)
 */
export class BaseDexieService<T, K extends string | number = string> {
  protected db: Dexie;
  protected tableName: string;

  /**
   * Create a new instance of BaseDexieService
   *
   * @param db Dexie database instance
   * @param tableName Name of the table to operate on
   */
  constructor(db: Dexie, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  /**
   * Get all records from the table
   *
   * @returns Promise resolving to array of all records
   */
  async getAll(): Promise<T[]> {
    try {
      return await this.db.table<T>(this.tableName).toArray();
    } catch (error) {
      console.error(`Error getting all records from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get a record by its ID
   *
   * @param id The record ID
   * @returns Promise resolving to the record if found
   */
  async getById(id: K): Promise<T | undefined> {
    try {
      return await this.db.table<T>(this.tableName).get(id);
    } catch (error) {
      console.error(`Error getting record ${id} from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Add a new record
   *
   * @param item The record to add
   * @returns Promise resolving to the generated key
   */
  async add(item: T): Promise<K> {
    try {
      return (await this.db.table<T>(this.tableName).add(item)) as K;
    } catch (error) {
      console.error(`Error adding record to ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Add multiple records in a bulk operation
   *
   * @param items Array of records to add
   * @returns Promise resolving when the operation completes
   */
  async bulkAdd(items: T[]): Promise<void> {
    try {
      await this.db.table<T>(this.tableName).bulkAdd(items);
    } catch (error) {
      console.error(`Error bulk adding records to ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record
   *
   * @param id The record ID
   * @param changes Partial record with changes
   * @returns Promise resolving to number of updated records
   */
  async update(id: K, changes: Partial<T>): Promise<number> {
    try {
      return await this.db.table<T>(this.tableName).update(id, changes);
    } catch (error) {
      console.error(`Error updating record ${id} in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record
   *
   * @param id The record ID
   * @returns Promise resolving when the operation completes
   */
  async delete(id: K): Promise<void> {
    try {
      await this.db.table<T>(this.tableName).delete(id);
    } catch (error) {
      console.error(`Error deleting record ${id} from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Clear all records from the table
   *
   * @returns Promise resolving when the operation completes
   */
  async clear(): Promise<void> {
    try {
      await this.db.table(this.tableName).clear();
    } catch (error) {
      console.error(`Error clearing table ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get the table to perform custom queries
   *
   * @returns Dexie table instance
   */
  table(): Dexie.Table<T, K> {
    return this.db.table<T, K>(this.tableName);
  }

  /**
   * Filter records by a field value
   *
   * @param field The field to filter on
   * @param value The value to match
   * @returns Promise resolving to array of matching records
   */
  async where<F extends keyof T>(field: F, value: T[F]): Promise<T[]> {
    try {
      return await this.db
        .table<T>(this.tableName)
        .where(field as string)
        .equals(value)
        .toArray();
    } catch (error) {
      console.error(`Error querying ${this.tableName} where ${String(field)} = ${value}:`, error);
      throw error;
    }
  }

  /**
   * Count the number of records in the table
   *
   * @returns Promise resolving to the record count
   */
  async count(): Promise<number> {
    try {
      return await this.db.table<T>(this.tableName).count();
    } catch (error) {
      console.error(`Error counting records in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Execute code within a transaction scope
   *
   * @param mode Transaction mode ('r' for readonly, 'rw' for readwrite)
   * @param callback Function to execute within the transaction
   * @returns Promise resolving to the callback result
   */
  async transaction<R>(mode: 'r' | 'rw', callback: () => Promise<R>): Promise<R> {
    try {
      return await this.db.transaction(mode, this.db.table(this.tableName), callback);
    } catch (error) {
      console.error(`Error in ${this.tableName} transaction:`, error);
      throw error;
    }
  }
}
