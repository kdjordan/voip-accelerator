import Dexie, { Table } from 'dexie';
import { useSharedStore } from '@/domains/shared/store';
import { type DBNameType } from '@/domains/shared/types';
import type { StandardizedData } from '@/domains/shared/types';

// Define database structure
class RateDeckDB extends Dexie {
  [key: string]: Table<StandardizedData> | any; // Dynamic stores

  constructor(dbName: DBNameType) {
    super(dbName);
  }

  // Method to create/update store schema
  createStore(storeName: string) {
    const newVersion = this.verno + 1;
    this.version(newVersion).stores({
      [storeName]: '++id, dialCode, rate', // Index on dialCode and rate
    });
  }
}

export default function useIndexedDB() {
  const sharedStore = useSharedStore();
  const dbInstances = new Map<DBNameType, RateDeckDB>();

  function getDB(dbName: DBNameType): RateDeckDB {
    if (!dbInstances.has(dbName)) {
      dbInstances.set(dbName, new RateDeckDB(dbName));
    }
    return dbInstances.get(dbName)!;
  }

  async function storeInIndexedDB(
    data: StandardizedData[],
    DBname: DBNameType,
    fileName: string,
    componentName: string,
    forceCreate = false
  ) {
    try {
      const storeName = fileName.replace('.csv', '');
      const db = getDB(DBname);

      // Create or update store schema
      db.createStore(storeName);
      await db.open();

      // Store data
      await db.table(storeName).bulkPut(data);

      // Update global version
      sharedStore.globalDBVersion = db.verno;
    } catch (error) {
      console.error('Error storing in IndexedDB:', error);
      throw error;
    }
  }

  async function loadFromIndexedDB(
    dbName: DBNameType,
    storeName: string,
    dbVersion: number
  ): Promise<StandardizedData[]> {
    try {
      const db = getDB(dbName);
      return await db.table(storeName).toArray();
    } catch (error) {
      console.error('Error loading from IndexedDB:', error);
      throw error;
    }
  }

  async function deleteObjectStore(dbName: DBNameType, objectStoreName: string): Promise<void> {
    try {
      const db = getDB(dbName);
      const newVersion = db.verno + 1;

      db.version(newVersion).stores({
        [objectStoreName]: null, // This deletes the store
      });

      await db.open();
      sharedStore.globalDBVersion = db.verno;
    } catch (error) {
      console.error('Error deleting object store:', error);
      throw error;
    }
  }

  return {
    storeInIndexedDB,
    loadFromIndexedDB,
    deleteObjectStore,
  };
}
