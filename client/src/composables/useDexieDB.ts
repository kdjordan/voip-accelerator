import Dexie, { Table, type IndexSpec } from 'dexie';
import { type DBNameType } from '@/types';
import { useDBStore } from '@/stores/db-store';
import { DBSchemas, DynamicTableSchemas } from '@/types/app-types';

// Export DexieDBBase type alias
export type DexieDBBase = Dexie;

async function defineSchema(
  db: Dexie,
  dbName: DBNameType,
  initialSchemaDefinition: string | Record<string, string | null> | undefined
): Promise<void> {
  let schemaToDefine: Record<string, string | null> = {};

  if (typeof initialSchemaDefinition === 'string') {
    if (initialSchemaDefinition.includes(':')) {
      // Handle format "tableName: schema"
      schemaToDefine = parseSchemaString(initialSchemaDefinition);
    } else if (initialSchemaDefinition.trim() !== '') {
      // Handle simple schema string, assume default table name 'data'
      // (Adjust 'data' if a different convention is preferred)
      schemaToDefine = { data: initialSchemaDefinition };
    } else {
      // Handle empty string case
      console.warn(`[useDexieDB] Received empty schema string for ${dbName}. Defining no stores.`);
      schemaToDefine = {};
    }
  } else if (typeof initialSchemaDefinition === 'object' && initialSchemaDefinition !== null) {
    // Handle schema provided as an object
    schemaToDefine = initialSchemaDefinition;
  } else {
    // Handle undefined or null case
    console.warn(
      `[useDexieDB] Received undefined or null schema for ${dbName}. Defining no stores.`
    );
    schemaToDefine = {};
  }

  if (Object.keys(schemaToDefine).length > 0) {
    db.version(1).stores(schemaToDefine);
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
    } catch (e) {
      console.error(`[useDexieDB: ${db.name}] Failed to open DB in addStore:`, e);
      return false; // Cannot proceed if DB won't open
    }
  }

  if (db.tables.some((table) => table.name === storeName)) {
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

  db.close(); // Close before upgrading

  try {
    db.version(db.verno + 1).stores(newSchema);
    await db.open(); // Reopen after upgrade
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
    return true; // Indicate store doesn't exist or no action needed
  }

  const currentVersion = db.verno;
  const currentSchema = getSchemaDefinitionForVersion(db, currentVersion);

  // Setting store to null deletes it
  const nextSchema = { ...currentSchema, [storeName]: null };

  db.close(); // Close before upgrading

  try {
    db.version(currentVersion + 1).stores(nextSchema);
    await db.open(); // Reopen after schema change
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

  return schemaDefinition;
}

export default function useDexieDB() {
  const dbStore = useDBStore();
  const creatingDB = new Set<DBNameType>(); // Track DBs currently being created

  async function getDB(dbName: DBNameType): Promise<Dexie> {
    let db = dbStore.activeConnections[dbName];

    // Check if DB is already being created
    while (creatingDB.has(dbName)) {
      await new Promise((resolve) => setTimeout(resolve, 50)); // Wait briefly
      db = dbStore.activeConnections[dbName]; // Re-check if it exists now
      if (db) break; // Exit loop if found
    }

    if (!db) {
      // Mark this DB name as being created
      creatingDB.add(dbName);
      db = new Dexie(dbName);
      const initialSchema = DBSchemas[dbName as keyof typeof DBSchemas];
      // Define initial schema for brand new DB
      await defineSchema(db, dbName, initialSchema);

      try {
        await db.open();
        dbStore.registerConnection(dbName, db); // Register the new connection
      } catch (error) {
        console.error(`[useDexieDB] Failed to open database ${dbName}:`, error);
        db.close(); // Ensure closed on failure
        throw error; // Rethrow
      } finally {
        // Ensure the flag is removed whether creation succeeded or failed
        creatingDB.delete(dbName);
      }
    } else {
      // DB instance exists, ensure it's open
      if (!db.isOpen()) {
        console.warn(`[useDexieDB] Connection for ${dbName} was closed. Attempting to reopen...`);
        try {
          await db.open(); // Dexie handles reopening correctly
        } catch (reopenError) {
          console.error(`[useDexieDB] Failed to reopen database ${dbName}:`, reopenError);
          throw reopenError;
        }
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

    const table = db.table(storeName);

    // Enrich data if sourceFile is provided
    const enrichedData = options?.sourceFile
      ? data.map((d) => ({ ...d, sourceFile: options.sourceFile }))
      : data;

    try {
      // Clear existing data if requested
      if (options?.replaceExisting) {
        await table.clear();
      }

      // Store the data
      await table.bulkPut(enrichedData);
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
    try {
      const results = await table.toArray();
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
    try {
      const results = await table.offset(offset).limit(limit).toArray();
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
    await dbStore.closeConnection(dbName); // Ensure connection is closed first
    try {
      await Dexie.delete(dbName);
    } catch (error) {
      console.error(`[useDexieDB] Error deleting database ${dbName}:`, error);
      // Might want to notify the user or attempt recovery
      throw error;
    }
  }

  async function closeAllConnections(): Promise<void> {
    const activeDBNames = Object.keys(dbStore.activeConnections) as DBNameType[];
    for (const dbName of activeDBNames) {
      await dbStore.closeConnection(dbName);
    }
  }

  async function getAllStoreNamesForDB(dbName: DBNameType): Promise<string[]> {
    const db = await getDB(dbName);
    if (!db.isOpen()) {
      console.warn(`[useDexieDB: ${dbName}] Cannot get store names, DB is not open.`);
      return [];
    }
    return db.tables.map((table) => table.name);
  }

  async function clearDexieTable(dbName: DBNameType, storeName: string): Promise<void> {
    const db = await getDB(dbName);
    
    if (!db.tables.some((table) => table.name === storeName)) {
      console.warn(`[useDexieDB: ${dbName}] Store '${storeName}' does not exist. Nothing to clear.`);
      return;
    }

    const table = db.table(storeName);
    try {
      await table.clear();
    } catch (error) {
      console.error(`[useDexieDB: ${dbName}/${storeName}] Error clearing table:`, error);
      throw error;
    }
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
    clearDexieTable,
  };
}
