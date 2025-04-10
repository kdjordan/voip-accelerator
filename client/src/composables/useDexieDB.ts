import Dexie, { Table } from 'dexie';
import { type DBNameType } from '@/types';
import { useDBStore } from '@/stores/db-store';
import { DBSchemas } from '@/types/app-types';

export class DexieDBBase extends Dexie {
  [key: string]: Table<any> | any;
  protected stores: Set<string>;
  protected schema: string;
  protected dbName: DBNameType;

  constructor(dbName: DBNameType, schema: string) {
    super(dbName);
    this.dbName = dbName;
    this.schema = schema;
    this.stores = new Set(this.tables.map((table) => table.name));
    console.log(`Initializing ${this.dbName} with schema:`, this.schema);
    if (this.verno === 0) {
      // If it's a new DB, define version 1 using the provided schema
      try {
        const schemaParts = this.schema.split(':');
        if (schemaParts.length >= 2) {
          const tableName = schemaParts[0].trim();
          const tableDefinition = schemaParts.slice(1).join(':').trim();
          const version1Schema = { [tableName]: tableDefinition };
          console.log(
            `[useDexieDB] Defining Version 1 for ${this.dbName} with schema:`,
            version1Schema
          );
          this.version(1).stores(version1Schema);
        } else {
          console.error(
            `[useDexieDB] Invalid schema format for ${this.dbName}: ${this.schema}. Expected 'tableName: fields...'. Defining empty version 1.`
          );
          this.version(1).stores({}); // Fallback to empty schema if format is wrong
        }
      } catch (e) {
        console.error(
          `[useDexieDB] Error parsing schema for ${this.dbName}:`,
          e,
          `Schema: ${this.schema}`
        );
        this.version(1).stores({}); // Fallback on error
      }
    }
  }

  async addStore(storeName: string) {
    try {
      console.log('=== Store Creation Start ===');
      console.log('Current version:', this.verno);
      console.log(
        'Current tables:',
        this.tables.map((t) => t.name)
      );
      console.log('Current stores set:', Array.from(this.stores));

      console.log(
        `[${this.name}] Adding store:`,
        storeName,
        'Current stores:',
        Array.from(this.stores)
      );
      if (this.stores.has(storeName)) {
        console.log(`[${this.name}] Store already exists:`, storeName);
        return;
      }

      this.stores.add(storeName);
      const existingStores = await this.tables.map((table) => table.name);
      console.log(`[${this.name}] Existing stores:`, existingStores);
      const schema = Array.from(this.stores).reduce(
        (acc, store) => ({
          ...acc,
          [store]: this.schema,
        }),
        {}
      );
      console.log(`[${this.name}] New schema:`, schema);

      await this.close();
      console.log('=== After Close ===');
      console.log('Is open:', this.isOpen());
      console.log(
        'Tables after close:',
        this.tables.map((t) => t.name)
      );

      const newVersion = this.verno + 1;
      console.log(`[${this.name}] Creating version ${newVersion} for store:`, storeName);
      this.version(newVersion).stores(schema);
      console.log('=== After Version Update ===');
      console.log('New version:', this.verno);
      console.log('Schema applied:', schema);

      await this.open();
      console.log('=== After Reopen ===');
      console.log('Is open:', this.isOpen());
      console.log(
        'Final tables:',
        this.tables.map((t) => t.name)
      );
      console.log('=== Store Creation End ===');
    } catch (error) {
      console.error('Error adding store:', error);
      throw error;
    }
  }

  hasStore(storeName: string): boolean {
    const hasStore = this.tables.some((table) => table.name === storeName);
    console.log(
      'Checking for store:',
      storeName,
      'Result:',
      hasStore,
      'Available tables:',
      this.tables.map((t) => t.name)
    );
    return hasStore;
  }

  async deleteStore(storeName: string): Promise<void> {
    try {
      if (!this.hasStore(storeName)) {
        console.log(`Store ${storeName} already deleted or doesn't exist`);
        return;
      }

      await this.close();
      const freshDb = new DexieDBBase(this.dbName, this.schema);
      freshDb.version(this.verno + 1).stores({
        [storeName]: null,
      });

      await freshDb.open();
      this.stores.delete(storeName);
      console.log(`Store ${storeName} deleted from ${this.dbName}`);
    } catch (error) {
      console.error(`Error deleting store ${storeName} from ${this.dbName}:`, error);
      throw error;
    }
  }

  async getAllStoreNames(): Promise<string[]> {
    return this.tables.map((table) => table.name);
  }
}

export default function useDexieDB() {
  const dbStore = useDBStore();

  async function getDB(dbName: DBNameType): Promise<DexieDBBase> {
    let db = dbStore.activeConnections[dbName] as DexieDBBase;

    if (!db) {
      // Ensure schema exists before proceeding
      if (!DBSchemas[dbName]) {
        throw new Error(`[useDexieDB] No schema defined for database: ${dbName}`);
      }
      const schema = DBSchemas[dbName];

      console.log(`[useDexieDB] Creating new DexieDBBase instance for ${dbName}`);
      db = new DexieDBBase(dbName, schema); // Constructor should define v1 schema if verno is 0

      console.log(`[useDexieDB] Attempting to open ${dbName} (Version: ${db.verno})...`);
      try {
        await db.open(); // Explicitly await open to ensure schema/version is applied
        console.log(
          `[useDexieDB] Successfully opened ${dbName}. Tables:`,
          db.tables.map((t) => t.name)
        );
        dbStore.registerConnection(dbName, db); // Register connection only after successful open
      } catch (error) {
        console.error(`[useDexieDB] Failed to open database ${dbName}:`, error);
        throw error; // Rethrow critical error - prevents using an unopened DB
      }
    } else {
      console.log(`Using existing ${dbName} database instance`);
      // Ensure existing connection is open
      if (!db.isOpen()) {
        console.log(`[useDexieDB] Re-opening existing connection for ${dbName}`);
        await db.open();
      }
    }

    return db;
  }

  async function storeInDexieDB<T>(
    data: T[],
    dbName: DBNameType,
    storeName: string,
    options?: { sourceFile?: string; replaceExisting?: boolean }
  ) {
    const db = await getDB(dbName);

    try {
      console.log('Adding store:', storeName);
      await db.addStore(storeName);

      // Add sourceFile property to each record if provided
      const enrichedData = options?.sourceFile
        ? data.map((item) => ({ ...item, sourceFile: options.sourceFile }))
        : data;

      // Replace existing data if requested
      if (options?.replaceExisting) {
        await db.table(storeName).clear();
        console.log(`Cleared existing data in ${dbName}/${storeName}`);
      }

      await db.table(storeName).bulkPut(enrichedData);
      console.log(`Data stored successfully in ${dbName}/${storeName}`);
    } catch (error) {
      console.error(`Error storing data in ${dbName}/${storeName}:`, error);
      throw error;
    }
  }

  async function loadFromDexieDB<T>(dbName: DBNameType, storeName: string): Promise<T[]> {
    console.log('Loading data from DexieDB:', { dbName, storeName });
    const db = await getDB(dbName);
    console.log('Got db:', { db });

    try {
      const stores = db.tables.map((table) => table.name);
      console.log('Available tables:', stores);

      // Check if the store exists and return empty array if not
      if (!db.hasStore(storeName)) {
        console.warn(`Store ${storeName} not found in database ${dbName}. Returning empty array.`);
        return [];
      }

      const data = await db.table(storeName).toArray();
      console.log(`Successfully loaded ${data.length} records from ${dbName}/${storeName}`);
      return data;
    } catch (error) {
      console.error(`Error loading data from ${dbName}/${storeName}:`, error);
      throw error;
    }
  }

  async function deleteDatabase(dbName: DBNameType): Promise<void> {
    try {
      await dbStore.closeConnection(dbName);
      await Dexie.delete(dbName);
      console.log(`Database ${dbName} deleted`);
    } catch (error) {
      console.error(`Error deleting database ${dbName}:`, error);
      throw error;
    }
  }

  async function closeAllConnections(): Promise<void> {
    try {
      const connections = Object.keys(dbStore.activeConnections) as DBNameType[];
      for (const dbName of connections) {
        await dbStore.closeConnection(dbName);
      }
    } catch (error) {
      console.error('Error closing database connections:', error);
      throw error;
    }
  }

  /**
   * Consolidates data from multiple tables into a single table
   * @param dbName The database name
   * @param targetTableName The table to consolidate data into
   * @param sourceTables Optional array of tables to consolidate from (if not provided, all tables except the target will be used)
   * @param keyField Field to use for deduplication (if null, no deduplication is performed)
   */
  async function consolidateData(
    dbName: DBNameType,
    targetTableName: string,
    sourceTables?: string[],
    keyField?: string | null
  ): Promise<{ total: number; deduplicated: number }> {
    const db = await getDB(dbName);
    let stats = { total: 0, deduplicated: 0 };

    try {
      // Ensure target table exists
      if (!db.hasStore(targetTableName)) {
        await db.addStore(targetTableName);
      }

      // If no source tables provided, use all tables except target
      const allTables = await db.getAllStoreNames();
      const tablesToConsolidate =
        sourceTables || allTables.filter((name) => name !== targetTableName);

      console.log(
        `Consolidating data from [${tablesToConsolidate.join(', ')}] into ${targetTableName}`
      );

      // Process each source table
      for (const sourceTable of tablesToConsolidate) {
        if (sourceTable === targetTableName || !db.hasStore(sourceTable)) continue;

        // Load data from source table
        const sourceData = await db.table(sourceTable).toArray();
        stats.total += sourceData.length;

        // Add metadata to track source
        const enrichedData = sourceData.map((item) => ({
          ...item,
          sourceTable: sourceTable,
          consolidatedAt: new Date().toISOString(),
        }));

        // Deduplicate if needed
        if (keyField) {
          // Get existing data in target table
          const existingData = await db.table(targetTableName).toArray();
          const existingKeys = new Set(existingData.map((item) => item[keyField]));

          // Filter out duplicates
          const uniqueData = enrichedData.filter((item) => {
            const isDuplicate = existingKeys.has(item[keyField]);
            if (isDuplicate) stats.deduplicated++;
            return !isDuplicate;
          });

          // Add unique data to target table
          if (uniqueData.length > 0) {
            await db.table(targetTableName).bulkAdd(uniqueData);
          }
        } else {
          // Add all data to target table without deduplication
          await db.table(targetTableName).bulkAdd(enrichedData);
        }
      }

      console.log(
        `Consolidated ${stats.total} records (${stats.deduplicated} duplicates removed) into ${targetTableName}`
      );
      return stats;
    } catch (error) {
      console.error(`Error consolidating data into ${targetTableName}:`, error);
      throw error;
    }
  }

  /**
   * Clean up duplicate tables after consolidation
   * @param dbName The database name
   * @param tablesToKeep Array of table names to preserve
   */
  async function cleanupDuplicateTables(
    dbName: DBNameType,
    tablesToKeep: string[]
  ): Promise<string[]> {
    const db = await getDB(dbName);
    const deletedTables: string[] = [];

    try {
      const allTables = await db.getAllStoreNames();
      const tablesToDelete = allTables.filter((name) => !tablesToKeep.includes(name));

      console.log(`Will delete these tables: [${tablesToDelete.join(', ')}]`);
      console.log(`Will preserve these tables: [${tablesToKeep.join(', ')}]`);

      for (const tableName of tablesToDelete) {
        await db.deleteStore(tableName);
        deletedTables.push(tableName);
      }

      return deletedTables;
    } catch (error) {
      console.error(`Error cleaning up duplicate tables in ${dbName}:`, error);
      throw error;
    }
  }

  return {
    getDB,
    storeInDexieDB,
    loadFromDexieDB,
    deleteDatabase,
    closeAllConnections,
    consolidateData,
    cleanupDuplicateTables,
  };
}
