import Dexie, { Table } from 'dexie';
import { useSharedStore } from '@/stores/shared-store';
import { type DBNameType } from '@/types';
import type { StandardizedData } from '@/types';

class RateDeckDB extends Dexie {
  [key: string]: Table<StandardizedData> | any;

  constructor(dbName: DBNameType) {
    super(dbName);
    this.version(1).stores({});
  }

  async addStore(storeName: string) {
    // Close existing connections
    await this.close();

    // Create new version with store schema
    this.version(this.verno + 1).stores({
      [storeName]: '++id, destName, dialCode, rate',
    });

    // Reopen database with new schema
    await this.open();
  }
}

export default function useDexieDB() {
  const sharedStore = useSharedStore();
  let dbInstance: RateDeckDB | null = null;

  function getDB(dbName: DBNameType): RateDeckDB {
    if (!dbInstance) {
      dbInstance = new RateDeckDB(dbName);
    }
    return dbInstance;
  }

  async function closeDB() {
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
    }
  }

  async function storeInDexieDB(data: StandardizedData[], DBname: DBNameType, fileName: string) {
    try {
      const storeName = fileName;
      const db = getDB(DBname);

      // Wait for store to be added and DB to be ready
      await db.addStore(storeName);

      // Ensure DB is open before attempting to write
      await db.open();

      // Wait for data to be written
      await db.table(storeName).bulkPut(data);

      sharedStore.incrementGlobalDBVersion();
    } catch (error) {
      console.error('Error storing in DexieDB:', error);
      throw error;
    }
  }

  async function loadFromDexieDB(dbName: DBNameType, storeName: string): Promise<StandardizedData[]> {
    try {
      const db = getDB(dbName);

      // Close any existing connections
      await closeDB();

      // Get fresh instance and open connection
      const freshDb = getDB(dbName);
      await freshDb.open();

      // Get data
      const data = await freshDb.table(storeName).toArray();

      // Close connection after getting data
      await closeDB();

      return data;
    } catch (error) {
      console.error('Error loading from DexieDB:', error);
      throw error;
    }
  }

  async function deleteObjectStore(dbName: DBNameType, objectStoreName: string): Promise<void> {
    try {
      const db = getDB(dbName);
      db.version(db.verno + 1).stores({
        [objectStoreName]: null,
      });
      await db.open();
      sharedStore.incrementGlobalDBVersion();
    } catch (error) {
      console.error('Error deleting object store:', error);
      throw error;
    }
  }

  return {
    storeInDexieDB,
    loadFromDexieDB,
    deleteObjectStore,
    closeDB,
  };
}
