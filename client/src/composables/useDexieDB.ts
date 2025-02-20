import Dexie, { Table } from 'dexie';
import { type DBNameType } from '@/types';
import type { StandardizedData } from '@/types';
import { useDBStore } from '@/stores/db-store';
import { DBSchemas, isSchemaSupported } from '@/types/app-types';

export class RateDeckDB extends Dexie {
  [key: string]: Table<StandardizedData> | any;
  private stores: Set<string>;
  private schema: string;

  constructor(dbName: DBNameType) {
    super(dbName);
    if (!isSchemaSupported(dbName)) {
      throw new Error(`Database ${dbName} does not have a defined schema`);
    }
    this.schema = DBSchemas[dbName];
    // Initialize stores from existing tables
    this.stores = new Set(this.tables.map(table => table.name));
    console.log(`Initializing ${dbName} with schema:`, this.schema);
    // Only initialize schema if it's a new database
    if (this.verno === 0) {
      this.version(1).stores({});
    }
  }

  async addStore(storeName: string) {
    try {
      // Log initial state
      console.log('=== Store Creation Start ===');
      console.log('Current version:', this.verno);
      console.log(
        'Current tables:',
        this.tables.map(t => t.name)
      );
      console.log('Current stores set:', Array.from(this.stores));

      console.log(`[${this.name}] Adding store:`, storeName, 'Current stores:', Array.from(this.stores));
      if (this.stores.has(storeName)) {
        console.log(`[${this.name}] Store already exists:`, storeName);
        return;
      }

      this.stores.add(storeName);
      // Keep track of all stores in the database
      const existingStores = await this.tables.map(table => table.name);
      console.log(`[${this.name}] Existing stores:`, existingStores);
      const schema = Array.from(this.stores).reduce(
        (acc, store) => ({
          ...acc,
          [store]: this.schema,
        }),
        {}
      );
      console.log(`[${this.name}] New schema:`, schema);

      // Close current connection before schema update
      await this.close();
      console.log('=== After Close ===');
      console.log('Is open:', this.isOpen());
      console.log(
        'Tables after close:',
        this.tables.map(t => t.name)
      );

      // Update schema with new version
      const newVersion = this.verno + 1;
      console.log(`[${this.name}] Creating version ${newVersion} for store:`, storeName);
      this.version(newVersion).stores(schema);
      console.log('=== After Version Update ===');
      console.log('New version:', this.verno);
      console.log('Schema applied:', schema);

      // Reopen with new schema
      await this.open();
      console.log('=== After Reopen ===');
      console.log('Is open:', this.isOpen());
      console.log(
        'Final tables:',
        this.tables.map(t => t.name)
      );
      console.log('=== Store Creation End ===');
    } catch (error) {
      console.error('Error adding store:', error);
      throw error;
    }
  }

  hasStore(storeName: string): boolean {
    const hasStore = this.tables.some(table => table.name === storeName);
    console.log(
      'Checking for store:',
      storeName,
      'Result:',
      hasStore,
      'Available tables:',
      this.tables.map(t => t.name)
    );
    return hasStore;
  }
}

export default function useDexieDB() {
  const dbStore = useDBStore();

  async function getDB(dbName: DBNameType): Promise<RateDeckDB> {
    let db = dbStore.activeConnections[dbName] as RateDeckDB;

    if (!db) {
      db = new RateDeckDB(dbName);
      dbStore.registerConnection(dbName, db);
      console.log(`Creating new ${dbName} database instance`);
      await db.open();
    } else {
      console.log(`Using existing ${dbName} database instance`);
    }

    return db;
  }

  async function storeInDexieDB(data: StandardizedData[], dbName: DBNameType, storeName: string) {
    const db = await getDB(dbName);

    try {
      console.log('Adding store:', storeName);
      await db.addStore(storeName);
      await db.table(storeName).bulkPut(data);
      console.log(`Data stored successfully in ${dbName}/${storeName}`);
    } catch (error) {
      console.error(`Error storing data in ${dbName}/${storeName}:`, error);
      throw error;
    }
  }

  async function loadFromDexieDB(dbName: DBNameType, storeName: string): Promise<StandardizedData[]> {
    console.log('Loading data from DexieDB:', { dbName, storeName });
    const db = await getDB(dbName);
    console.log('Got db:', { db });

    try {
      const stores = db.tables.map(table => table.name);
      console.log('Available stores:', stores);
      if (!db.hasStore(storeName)) {
        throw new Error(`Store ${storeName} not found in database ${dbName}`);
      }

      const data = await db.table(storeName).toArray();
      console.log(`Successfully loaded ${data.length} records from ${dbName}/${storeName}`);
      return data;
    } catch (error) {
      console.error(`Error loading data from ${dbName}/${storeName}:`, error);
      throw error;
    }
  }

  async function deleteObjectStore(dbName: DBNameType, storeName: string): Promise<void> {
    const db = await getDB(dbName);

    try {
      if (!db.hasStore(storeName)) {
        console.log(`Store ${storeName} already deleted or doesn't exist`);
        return;
      }

      await db.close();
      const freshDb = new RateDeckDB(dbName);
      freshDb.version(db.verno + 1).stores({
        [storeName]: null,
      });

      await freshDb.open();
      dbStore.registerConnection(dbName, freshDb);
      console.log(`Store ${storeName} deleted from ${dbName}`);
    } catch (error) {
      console.error(`Error deleting store ${storeName} from ${dbName}:`, error);
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

  return {
    getDB,
    storeInDexieDB,
    loadFromDexieDB,
    deleteObjectStore,
    deleteDatabase,
    closeAllConnections,
  };
}
