import { openDB } from 'idb';
import { useSharedStore } from '@/stores/shared-store';
import { type DBNameType } from '@/types';
import type { StandardizedData } from '@/types';

export default function useIndexedDB() {
  const sharedStore = useSharedStore();

  async function storeInIndexedDB(
    data: StandardizedData[],
    DBname: DBNameType,
    fileName: string,
    componentName: string,
    forceCreate = false
  ) {
    try {
      const storeName = fileName.replace('.csv', '');

      const currentDB = await openDB(DBname, undefined);
      const newVersion = currentDB.version + 1;
      currentDB.close();

      const db = await openDB(DBname, newVersion, {
        upgrade(db) {
          if (db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
          }
          db.createObjectStore(storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });
        },
      });

      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      for (const item of data) {
        await store.add(item);
      }

      await tx.done;
      db.close();

      // Update the global version in the store
      // sharedStore.globalDBVersion = newVersion;
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
      const db = await openDB(dbName, dbVersion);
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const data = await store.getAll();
      db.close();
      return data;
    } catch (error) {
      console.error('Error loading from IndexedDB:', error);
      throw error;
    }
  }

  async function deleteObjectStore(dbName: DBNameType, objectStoreName: string): Promise<void> {
    try {
      const currentDB = await openDB(dbName, undefined);
      const newVersion = currentDB.version + 1;
      currentDB.close();

      const db = await openDB(dbName, newVersion, {
        upgrade(db) {
          if (db.objectStoreNames.contains(objectStoreName)) {
            db.deleteObjectStore(objectStoreName);
          }
        },
      });

      db.close();

      // Update the global version in the store
      // sharedStore.globalDBVersion = newVersion;

      console.log(`Object store "${objectStoreName}" deleted`);
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
