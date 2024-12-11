import { openDB } from 'idb';
import { useSharedStore } from '@/domains/shared/store';
import { useAzStore } from '@/domains/az/store';
import { useNpanxxStore } from '@/domains/npanxx/store';
import { DBName, type DBNameType } from '@/domains/shared/types';
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
    const storeName = `${componentName}-store`;
    console.log('Attempting to store in IndexedDB:', { 
      dbName, 
      fileName, 
      componentName,
      storeName,
      dataLength: data.length,
      currentVersion: sharedStore.globalDBVersion 
    });
    
    try {
      // Always increment version to ensure upgrade
      sharedStore.incrementGlobalDBVersion();
      
      const db = await openDB(dbName as DBNameType, sharedStore.globalDBVersion, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            console.log('Creating store:', storeName);
            db.createObjectStore(storeName, {
              keyPath: 'id',
              autoIncrement: true,
            });
          }
        }
      });

      console.log('Database opened, stores:', Array.from(db.objectStoreNames));

      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      await Promise.all([
        ...data.map(row => store.add(row)),
        transaction.done
      ]);

      if (dbName === DBName.AZ as DBNameType) {
        azStore.addFileUploaded(componentName, fileName);
      } else if (dbName === DBName.US as DBNameType) {
        npanxxStore.addFileUploaded(componentName, fileName);
      }

      db.close();

    } catch (error) {
      console.error('Error storing data in IndexedDB:', error);
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
