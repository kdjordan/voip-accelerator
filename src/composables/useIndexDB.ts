import { ref } from 'vue';
import { type StandardizedData } from '../../types/app-types';
import { useDBstore } from '@/stores/db';

const DBstore = useDBstore()

export function useIndexedDB() {
  //local state for components
  const localDBloading = ref<boolean>(false)
  const localDBloaded = ref<boolean>(false)

  async function storeInIndexedDB(data: StandardizedData[], DBname: string, storeName: string) {
    console.log('running ', storeName, DBstore.globalDBVersion);
    const request = indexedDB.open(DBname, DBstore.globalDBVersion);

    request.onupgradeneeded = (event) => {
      localDBloading.value = true
      DBstore.setGlobalFileIsUploading(true)
      const db = (event.target as IDBOpenDBRequest).result;
      if (db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      }
    };

    request.onsuccess = (event) => {
      console.log('settting DBLoading to true')
      const db = (event.target as IDBOpenDBRequest).result as IDBDatabase;
      if (db) {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        data.forEach((row) => {
          store.add(row);
        });

        transaction.oncomplete = () => {
          DBstore.incrementGlobalDBVersion()
          DBstore.incrementAzFileCount()
          localDBloading.value = false
          localDBloaded.value = true
          DBstore.setGlobalFileIsUploading(false)
          console.log('Data stored successfully', localDBloaded.value );
          db.close();
        };

        transaction.onerror = (event) => {
          console.error('Transaction error:', transaction.error);
        };
      } else {
        console.error('Failed to open IndexedDB');
      }
    };

    request.onerror = (event) => {
      const requestError = (event.target as IDBRequest<IDBDatabase>).error;
      console.error('IndexedDB error:', requestError);
    };
  }

  async function loadFromIndexedDB(storeName: string, DBversion: number): Promise<StandardizedData[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CSVDatabase', DBversion);

      request.onupgradeneeded = function (event) {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, {
              keyPath: 'id',
              autoIncrement: true,
            });
          }
        }
      };

      request.onsuccess = function (event) {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db) {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const data: StandardizedData[] = [];

          store.openCursor().onsuccess = function (e) {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              data.push(cursor.value);
              cursor.continue();
            } else {
              resolve(data);
            }
          };

          transaction.oncomplete = function () {
            db.close();
          };
        } else {
          reject(new Error('Failed to open IndexedDB'));
        }
      };

      request.onerror = function (event) {
        const requestError = (event.target as IDBOpenDBRequest).error;
        console.error('IndexedDB error:', requestError);
        reject(requestError);
      };
    });
  }



  return {
    storeInIndexedDB,
    loadFromIndexedDB,
    localDBloading,
    localDBloaded
  };
}
