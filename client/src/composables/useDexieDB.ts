import Dexie, { Table, type IndexableType, type IndexSpec } from 'dexie';
import { type DBNameType, DBName } from '@/types';
import { useDBStore } from '@/stores/db-store';
import { DBSchemas, DynamicTableSchemas } from '@/types/app-types';

// Export DexieDBBase type alias
export type DexieDBBase = Dexie;

async function defineSchema(
  db: Dexie,
  dbName: DBNameType,
  initialSchemaDefinition: string | Record<string, string | null> | undefined
): Promise<void> {
  const baseSchema =
    typeof initialSchemaDefinition === 'string' && initialSchemaDefinition.includes(':')
      ? parseSchemaString(initialSchemaDefinition)
      : typeof initialSchemaDefinition === 'object' && initialSchemaDefinition !== null
        ? initialSchemaDefinition
        : {};

  console.log(`[useDexieDB] Defining Version 1 for ${dbName} with schema:`, baseSchema);
  if (Object.keys(baseSchema).length > 0) {
    db.version(1).stores(baseSchema as Record<string, string | null>);
  } else {
    db.version(1).stores({});
  }
}

function parseSchemaString(schemaString: string): Record<string, string | null> {
  try {
    const parts = schemaString.split(':');
    const tableName = parts[0].trim();
    const tableDefinition = parts.slice(1).join(':').trim();
    return { [tableName]: tableDefinition };
  } catch (e) {
    console.error(`[useDexieDB] Error parsing schema string:`, e, `Schema: ${schemaString}`);
    return {};
  }
}

async function addStore(db: Dexie, storeName: string): Promise<boolean> {
  // Ensure the database is open before checking tables or attempting upgrades
  if (!db.isOpen()) {
    try {
      await db.open();
      console.log(`[useDexieDB: ${db.name}] Opened DB before addStore check.`);
    } catch (e) {
      console.error(`[useDexieDB: ${db.name}] Failed to open DB in addStore:`, e);
      return false; // Cannot proceed if DB won't open
    }
  }

  if (db.tables.some((table) => table.name === storeName)) {
    console.log(`[useDexieDB] Store '${storeName}' already exists in ${db.name}.`);
    return true; // Indicate store already exists or no action needed
  }

  let dynamicSchemaDefinition = '++id'; // Default schema
  const dbName = db.name as DBNameType;

  if (dbName in DynamicTableSchemas) {
    dynamicSchemaDefinition = DynamicTableSchemas[dbName as keyof typeof DynamicTableSchemas];
  } else {
    console.warn(
      `[useDexieDB] addStore called for DB (${dbName}) without a defined dynamic schema in DynamicTableSchemas. Falling back to default '++id'.`
    );
  }

  const currentSchema = getSchemaDefinitionForVersion(db, db.verno);
  const newSchema = {
    ...currentSchema,
    [storeName]: dynamicSchemaDefinition,
  };

  console.log(
    `[useDexieDB] Adding store '${storeName}' to ${dbName} (v${db.verno + 1}) with schema:`,
    newSchema
  );

  db.close(); // Close before upgrading

  try {
    db.version(db.verno + 1).stores(newSchema);
    await db.open(); // Reopen after upgrade
    console.log(
      `[useDexieDB] Successfully added/updated store '${storeName}' in ${dbName} and reopened DB.`
    );
    return true;
  } catch (e) {
    console.error(
      `[useDexieDB] Error during schema upgrade or reopening for ${dbName} adding store ${storeName}:`,
      e
    );
    // Attempt to revert or handle the error gracefully
    // For simplicity, we just close and rethrow, but a real app might need rollback logic
    db.close();
    return false; // Indicate failure
  }
}

async function deleteStore(db: Dexie, storeName: string): Promise<boolean> {
  if (!db.tables.some((table) => table.name === storeName)) {
    console.log(`[useDexieDB] Store '${storeName}' does not exist in ${db.name}.`);
    return true; // Indicate store doesn't exist or no action needed
  }

  console.log(`[useDexieDB] Deleting store '${storeName}' from ${db.name}...`);
  const currentVersion = db.verno;
  const currentSchema = getSchemaDefinitionForVersion(db, currentVersion);

  // Setting store to null deletes it
  const nextSchema = { ...currentSchema, [storeName]: null };

  db.close(); // Close before upgrading

  try {
    db.version(currentVersion + 1).stores(nextSchema);
    await db.open(); // Reopen after schema change
    console.log(`[useDexieDB] Successfully deleted store '${storeName}' and reopened ${db.name}.`);
    return true;
  } catch (error) {
    console.error(`[useDexieDB] Error deleting store '${storeName}' from ${db.name}:`, error);
    db.close();
    return false; // Indicate failure
  }
}

function getSchemaDefinitionForVersion(
  db: Dexie,
  versionNumber: number
): { [tableName: string]: string | null } {
  const schemaDefinition: { [tableName: string]: string | null } = {};
  if (db.verno === 0) {
    console.warn(
      `[useDexieDB: ${db.name}] Attempting to get schema before DB is defined (version 0).`
    );
    return {};
  }

  // Dexie's internal _dbSchema might not be stable; access table schemas directly
  // This requires the DB to be open.
  if (!db.isOpen()) {
    console.warn(
      `[useDexieDB: ${db.name}] DB must be open to retrieve current schema definition. Returning empty.`
    );
    // Potentially try to open temporarily, but that adds complexity.
    // Best practice is to ensure DB is open before needing its schema.
    return {};
  }

  db.tables.forEach((table) => {
    // Reconstruct the schema string from table.schema
    const primKey = table.schema.primKey;
    const indexes = table.schema.indexes;
    let schemaString = primKey.src; // Start with primary key
    if (indexes.length > 0) {
      schemaString += ',' + indexes.map((idx: IndexSpec) => idx.src).join(','); // Add index sources
    }
    schemaDefinition[table.name] = schemaString;
  });

  console.log(
    `[useDexieDB: ${db.name}] Schema for existing stores at v${versionNumber} (derived):`,
    schemaDefinition
  );

  return schemaDefinition;
}

export default function useDexieDB() {
  const dbStore = useDBStore();

  async function getDB(dbName: DBNameType): Promise<Dexie> {
    let db = dbStore.activeConnections[dbName]; // Get existing connection if available

    if (!db) {
      console.log(`[useDexieDB] No active connection for ${dbName}. Creating new instance.`);
      db = new Dexie(dbName);
      const initialSchema = DBSchemas[dbName];
      // Define initial schema for brand new DB
      await defineSchema(db, dbName, initialSchema);

      try {
        await db.open();
        console.log(
          `[useDexieDB] Opened new DB ${dbName}. Version: ${db.verno}. Tables:`,
          db.tables.map((t) => t.name)
        );
        dbStore.registerConnection(dbName, db); // Register the new connection
      } catch (error) {
        console.error(`[useDexieDB] Failed to open database ${dbName}:`, error);
        db.close(); // Ensure closed on failure
        throw error; // Rethrow
      }
    } else {
      // DB instance exists, ensure it's open
      if (!db.isOpen()) {
        console.warn(`[useDexieDB] Connection for ${dbName} was closed. Attempting to reopen...`);
        try {
          await db.open(); // Dexie handles reopening correctly
          console.log(`[useDexieDB] Successfully reopened ${dbName}. Version: ${db.verno}`);
        } catch (reopenError) {
          console.error(`[useDexieDB] Failed to reopen database ${dbName}:`, reopenError);
          throw reopenError;
        }
      } else {
        console.log(
          `[useDexieDB] Using existing active connection for ${dbName}. Version: ${db.verno}`
        );
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

    // Add store dynamically if it doesn't exist
    const storeAdded = await addStore(db, storeName);
    if (!storeAdded) {
      console.error(
        `[useDexieDB] Failed to add or ensure store ${storeName} exists in ${dbName}. Aborting data storage.`
      );
      return; // Stop if store couldn't be added/ensured
    }

    // Wait a moment for schema changes potentially? Might not be needed.
    // await new Promise((resolve) => setTimeout(resolve, 50));

    const table = db.table(storeName);

    // Enrich data if sourceFile is provided
    const enrichedData = options?.sourceFile
      ? data.map((d) => ({ ...d, sourceFile: options.sourceFile }))
      : data;

    try {
      // Clear existing data if requested
      if (options?.replaceExisting) {
        console.log(`[useDexieDB: ${dbName}/${storeName}] Clearing existing data before bulkPut.`);
        await table.clear();
      }

      console.log(
        `[useDexieDB: ${dbName}/${storeName}] Starting bulkPut for ${enrichedData.length} records...`
      );
      // Store the data
      await table.bulkPut(enrichedData);
      console.log(
        `[useDexieDB: ${dbName}/${storeName}] Successfully stored ${enrichedData.length} records.`
      );
    } catch (error) {
      console.error(`[useDexieDB: ${dbName}/${storeName}] Error during bulkPut:`, error);
      // Consider more specific error handling or recovery here
      throw error; // Rethrow for upstream handling
    }
  }

  async function loadFromDexieDB<T>(dbName: DBNameType, storeName: string): Promise<T[]> {
    const db = await getDB(dbName);

    if (!db.tables.some((table) => table.name === storeName)) {
      console.warn(
        `[useDexieDB: ${dbName}] Store '${storeName}' does not exist. Returning empty array.`
      );
      return [];
    }

    const table: Table<T> = db.table(storeName);
    console.log(`[useDexieDB: ${dbName}/${storeName}] Loading all records...`);
    try {
      const results = await table.toArray();
      console.log(`[useDexieDB: ${dbName}/${storeName}] Loaded ${results.length} records.`);
      return results;
    } catch (error) {
      console.error(`[useDexieDB: ${dbName}/${storeName}] Error loading data:`, error);
      throw error;
    }
  }

  async function loadPagedFromDexieDB<T>(
    dbName: DBNameType,
    storeName: string,
    limit: number,
    offset: number
  ): Promise<T[]> {
    const db = await getDB(dbName);

    if (!db.tables.some((table) => table.name === storeName)) {
      console.warn(
        `[useDexieDB: ${dbName}] Store '${storeName}' does not exist. Returning empty array.`
      );
      return [];
    }

    const table: Table<T> = db.table(storeName);
    console.log(
      `[useDexieDB: ${dbName}/${storeName}] Loading ${limit} records starting from offset ${offset}...`
    );
    try {
      const results = await table.offset(offset).limit(limit).toArray();
      console.log(`[useDexieDB: ${dbName}/${storeName}] Loaded ${results.length} records (paged).`);
      return results;
    } catch (error) {
      console.error(`[useDexieDB: ${dbName}/${storeName}] Error loading paged data:`, error);
      throw error;
    }
  }

  async function deleteTableStore(dbName: DBNameType, storeName: string): Promise<boolean> {
    const db = await getDB(dbName);
    return await deleteStore(db, storeName);
  }

  async function deleteDatabase(dbName: DBNameType): Promise<void> {
    console.log(`[useDexieDB] Attempting to delete database: ${dbName}`);
    await dbStore.closeConnection(dbName); // Ensure connection is closed first
    try {
      await Dexie.delete(dbName);
      console.log(`[useDexieDB] Successfully deleted database: ${dbName}`);
    } catch (error) {
      console.error(`[useDexieDB] Error deleting database ${dbName}:`, error);
      // Might want to notify the user or attempt recovery
      throw error;
    }
  }

  async function closeAllConnections(): Promise<void> {
    console.log('[useDexieDB] Closing all active Dexie connections...');
    const activeDBNames = Object.keys(dbStore.activeConnections) as DBNameType[];
    for (const dbName of activeDBNames) {
      await dbStore.closeConnection(dbName);
    }
    console.log('[useDexieDB] All connections closed.');
  }

  async function getAllStoreNamesForDB(dbName: DBNameType): Promise<string[]> {
    const db = await getDB(dbName);
    if (!db.isOpen()) {
      console.warn(`[useDexieDB: ${dbName}] Cannot get store names, DB is not open.`);
      return [];
    }
    return db.tables.map((table) => table.name);
  }

  return {
    getDB,
    storeInDexieDB,
    loadFromDexieDB,
    loadPagedFromDexieDB,
    deleteTableStore,
    deleteDatabase,
    closeAllConnections,
    getAllStoreNamesForDB,
  };
}
