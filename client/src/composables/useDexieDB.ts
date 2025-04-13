import Dexie, { Table } from 'dexie';
import { type DBNameType } from '@/types';
import { useDBStore } from '@/stores/db-store';
import { DBSchemas, DynamicTableSchemas } from '@/types/app-types';

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

    if (this.verno === 0 && this.schema.includes(':')) {
      try {
        const schemaParts = this.schema.split(':');
        const tableName = schemaParts[0].trim();
        const tableDefinition = schemaParts.slice(1).join(':').trim();

        const version1Schema = { [tableName]: tableDefinition };
        console.log(
          `[useDexieDB] Defining Version 1 for ${this.dbName} with schema:`,
          version1Schema
        );
        this.version(1).stores(version1Schema);
      } catch (e) {
        console.error(
          `[useDexieDB] Error parsing schema for ${this.dbName}:`,
          e,
          `Schema: ${this.schema}`
        );
        this.version(1).stores({});
      }
    } else if (this.verno === 0) {
      this.version(1).stores({});
    }
  }

  async addStore(storeName: string): Promise<void> {
    if (this.stores.has(storeName)) return;

    // Determine the correct schema for the dynamic table
    let dynamicSchemaDefinition = '++id'; // Default minimal schema
    if (this.dbName in DynamicTableSchemas) {
      dynamicSchemaDefinition =
        DynamicTableSchemas[this.dbName as keyof typeof DynamicTableSchemas];
    } else {
      console.warn(
        `[useDexieDB] addStore called for DB (${this.dbName}) without a defined dynamic schema in DynamicTableSchemas. Falling back to default.`
      );
      // Fallback or specific handling if needed, currently using default
    }

    const schema = {
      [storeName]: dynamicSchemaDefinition,
    };

    console.log(`[useDexieDB] Adding store '${storeName}' to ${this.dbName} with schema:`, schema);

    // IMPORTANT: Ensure database is closed *before* defining the new version.
    // Dexie handles reopening internally when accessing the database after a version change.
    this.close();

    // Define the new version and immediately try to open.
    // The 'await' ensures we wait for the version change and reopening attempt to complete.
    try {
      this.version(this.verno + 1).stores(schema);
      await this.open(); // Dexie automatically opens the database on access if closed, but explicitly opening ensures readiness.
      this.stores.add(storeName); // Add to internal tracking only after successful open
      console.log(
        `[useDexieDB] Successfully added/updated store '${storeName}' in ${this.dbName} and reopened DB.`
      );
    } catch (e) {
      console.error(
        `[useDexieDB] Error during schema upgrade or reopening for ${this.dbName} adding store ${storeName}:`,
        e
      );
      // Attempt to revert or handle the error state if necessary
      // For now, just rethrowing might be appropriate, or specific recovery logic.
      throw e; // Rethrow the error so the caller (storeInDexieDB) knows it failed.
    }
  }

  hasStore(storeName: string): boolean {
    return this.tables.some((table) => table.name === storeName);
  }

  async deleteStore(storeName: string): Promise<void> {
    if (!this.hasStore(storeName)) return;

    console.log(`[useDexieDB] Deleting store '${storeName}' from ${this.dbName}...`);
    const currentVersion = this.verno;

    // Close the connection before changing the schema
    this.close();

    try {
      // Define the schema change on the *current* instance
      this.version(currentVersion + 1).stores({ [storeName]: null });

      // Explicitly reopen the database to apply the schema change and ensure readiness
      await this.open();

      // Update internal tracking *after* successful reopen
      this.stores.delete(storeName);
      console.log(
        `[useDexieDB] Successfully deleted store '${storeName}' and reopened ${this.dbName}.`
      );
    } catch (error) {
      console.error(`[useDexieDB] Error deleting store '${storeName}' from ${this.dbName}:`, error);
      // Attempt to revert or simply rethrow
      // Reopening the *previous* version might be complex/risky.
      // For now, rethrowing seems safest.
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
      const schema = DBSchemas[dbName] ?? '';

      if (!schema.includes(':')) {
        db = new DexieDBBase(dbName, '');
      } else {
        db = new DexieDBBase(dbName, schema);
      }

      try {
        await db.open();
        console.log(
          `[useDexieDB] Opened ${dbName}. Tables:`,
          db.tables.map((t) => t.name)
        );
        dbStore.registerConnection(dbName, db);
      } catch (error) {
        console.error(`[useDexieDB] Failed to open database ${dbName}:`, error);
        throw error;
      }
    } else if (!db.isOpen()) {
      // If the connection exists but is closed (e.g., after deleteStore),
      // attempt to reopen it before returning.
      console.warn(`[useDexieDB] Connection for ${dbName} was closed. Attempting to reopen...`);
      try {
        await db.open();
        console.log(`[useDexieDB] Successfully reopened ${dbName}.`);
      } catch (reopenError) {
        console.error(`[useDexieDB] Failed to reopen database ${dbName}:`, reopenError);
        // If reopen fails, just rethrow the error
        throw reopenError; // Rethrow the error so the caller knows reopening failed
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

    // Ensure addStore completes fully (including schema update and DB reopen) before proceeding
    try {
      await db.addStore(storeName); // Await the addStore operation
    } catch (error) {
      console.error(
        `[useDexieDB] Failed to add store ${storeName} to ${dbName}. Aborting data storage.`,
        error
      );
      return; // Stop execution if adding the store failed
    }

    // Introduce a small delay AFTER addStore finishes and BEFORE bulkPut.
    // This might help stabilize the DB connection after schema changes.
    await new Promise((resolve) => setTimeout(resolve, 50)); // Wait 50ms

    const enriched = options?.sourceFile
      ? data.map((d) => ({ ...d, sourceFile: options.sourceFile }))
      : data;

    try {
      if (options?.replaceExisting) {
        await db.table(storeName).clear();
      }
      await db.table(storeName).bulkPut(enriched);
      console.log(
        `[useDexieDB] Successfully stored ${enriched.length} records in ${dbName}/${storeName}.`
      );
    } catch (error) {
      console.error(`[useDexieDB] Error storing data in ${dbName}/${storeName}:`, error);
      // Consider if specific error handling or retry logic is needed here
    }
  }

  async function loadFromDexieDB<T>(dbName: DBNameType, storeName: string): Promise<T[]> {
    const db = await getDB(dbName);
    if (!db.hasStore(storeName)) return [];
    return db.table(storeName).toArray();
  }

  async function loadPagedFromDexieDB<T>(
    dbName: DBNameType,
    storeName: string,
    limit: number,
    offset: number
  ): Promise<T[]> {
    const db = await getDB(dbName);
    if (!db.hasStore(storeName)) return [];
    return db.table<T>(storeName).offset(offset).limit(limit).toArray();
  }

  async function deleteDatabase(dbName: DBNameType): Promise<void> {
    await dbStore.closeConnection(dbName);
    await Dexie.delete(dbName);
  }

  async function closeAllConnections(): Promise<void> {
    const connections = Object.keys(dbStore.activeConnections) as DBNameType[];
    for (const dbName of connections) {
      await dbStore.closeConnection(dbName);
    }
  }

  return {
    getDB,
    storeInDexieDB,
    loadFromDexieDB,
    loadPagedFromDexieDB,
    deleteDatabase,
    closeAllConnections,
  };
}
