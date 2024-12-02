import { openDB } from 'idb';
import { useSharedStore } from '@/domains/shared/store';
import { useAzStore } from '@/domains/az/store';
import { useNpanxxStore } from '@/domains/npanxx/store';
import { DBName, type DBNameType } from '@/domains/shared/types/base-types';
import type { StandardizedData } from '@/domains/shared/types';

export default function useIndexedDB() {
  const sharedStore = useSharedStore();
  const azStore = useAzStore();
  const npanxxStore = useNpanxxStore();

  async function storeInIndexedDB(
    data: StandardizedData[],
    dbName: DBNameType,
    fileName: string,
    componentName: string
  ): Promise<void> {
    console.log('Storing in IndexedDB:', { dbName, fileName, componentName });
    
    try {
      // 1. Open/Create DB with version increment
      const db = await openDB(dbName, sharedStore.globalDBVersion + 1, {
        upgrade(db) {
          console.log('Upgrading IndexedDB');
          if (!db.objectStoreNames.contains(fileName)) {
            db.createObjectStore(fileName, {
              keyPath: 'id',
              autoIncrement: true,
            });
          }
        },
      });

      // 2. Store the data
      const transaction = db.transaction(fileName, 'readwrite');
      const store = transaction.objectStore(fileName);
      
      // Add each row
      for (const row of data) {
        await store.add(row);
      }

      // 3. Update the appropriate store based on dbName
      transaction.oncomplete = () => {
        if (dbName === DBName.AZ) {
          azStore.addFileUploaded(componentName, fileName);
        } else if (dbName === DBName.US) {
          npanxxStore.addFileUploaded(componentName, fileName);
        }
        
        sharedStore.incrementGlobalDBVersion();
        db.close();
      };

      transaction.onerror = (error) => {
        console.error('Transaction error:', error);
        throw new Error('Failed to store data in IndexedDB');
      };

    } catch (error) {
      console.error('Error in storeInIndexedDB:', error);
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

  async function deleteObjectStore(
    dbName: DBNameType,
    objectStoreName: string
  ): Promise<void> {
    try {
      const db = await openDB(dbName, undefined);
      
      if (db.objectStoreNames.contains(objectStoreName)) {
        db.close();
        
        const upgradeDb = await openDB(dbName, db.version + 1, {
          upgrade(db) {
            if (db.objectStoreNames.contains(objectStoreName)) {
              db.deleteObjectStore(objectStoreName);
              
              // Update stores based on dbName
              if (dbName === DBName.AZ) {
                azStore.removeFile(objectStoreName);
              } else if (dbName === DBName.US) {
                npanxxStore.removeFile(objectStoreName);
              }
              
              console.log(`Object store "${objectStoreName}" deleted`);
            }
          },
        });
        
        upgradeDb.close();
      }
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
