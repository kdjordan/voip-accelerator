import Dexie, { Table } from 'dexie';
import { type DBNameType } from '@/types';
import type { StandardizedData } from '@/types';
import { useDBStore } from '@/stores/db-store';
import { DBSchemas, isSchemaSupported } from '@/types/app-types';

class RateDeckDB extends Dexie {
  [key: string]: Table<StandardizedData> | any;
  private stores: Set<string> = new Set();
  private schema: string;

  constructor(dbName: DBNameType) {
    super(dbName);
    if (!isSchemaSupported(dbName)) {
      throw new Error(`Database ${dbName} does not have a defined schema`);
    }
    this.schema = DBSchemas[dbName];
    this.version(1).stores({});
  }

  async addStore(storeName: string) {
    try {
      if (this.stores.has(storeName)) {
        return;
      }

      this.stores.add(storeName);
      const schema = Array.from(this.stores).reduce(
        (acc, store) => ({
          ...acc,
          [store]: this.schema,
        }),
        {}
      );

      // Close current connection before schema update
      await this.close();

      // Update schema with new version
      const newVersion = this.verno + 1;
      this.version(newVersion).stores(schema);

      // Reopen with new schema
      await this.open();
      console.log(`Store ${storeName} added in version ${newVersion}`);
    } catch (error) {
      console.error('Error adding store:', error);
      throw error;
    }
  }

  hasStore(storeName: string): boolean {
    return this.tables.some(table => table.name === storeName);
  }
}

export default function useDexieDB() {
  const dbStore = useDBStore();

  async function getDB(dbName: DBNameType): Promise<RateDeckDB> {
    let db = dbStore.activeConnections[dbName] as RateDeckDB;

    if (!db) {
      db = new RateDeckDB(dbName);
      dbStore.registerConnection(dbName, db);
      await db.open();
    }

    return db;
  }

  async function storeInDexieDB(data: StandardizedData[], dbName: DBNameType, storeName: string) {
    const db = await getDB(dbName);

    try {
      await db.addStore(storeName);
      await db.table(storeName).bulkPut(data);
      console.log(`Data stored successfully in ${dbName}/${storeName}`);
    } catch (error) {
      console.error(`Error storing data in ${dbName}/${storeName}:`, error);
      throw error;
    }
  }

  async function loadFromDexieDB(dbName: DBNameType, storeName: string): Promise<StandardizedData[]> {
    const db = await getDB(dbName);

    try {
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
    storeInDexieDB,
    loadFromDexieDB,
    deleteObjectStore,
    deleteDatabase,
    closeAllConnections,
  };
}
