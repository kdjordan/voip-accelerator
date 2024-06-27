import { ref } from 'vue';
import { type StandardizedData } from '../../types/app-types';

export function useIndexedDB() {
  const DBversion = ref<number>(1);

  async function storeInIndexedDB(data: StandardizedData[], storeName: string) {
    console.log('running ', data, storeName);
    const request = indexedDB.open('CSVDatabase', DBversion.value);
    DBversion.value++;

    request.onupgradeneeded = (event) => {
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
      const db = (event.target as IDBOpenDBRequest).result as IDBDatabase;
      if (db) {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        data.forEach((row) => {
          store.add(row);
        });

        transaction.oncomplete = () => {
          console.log('Data stored successfully');
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

  async function loadFromIndexedDB(storeName: string): Promise<StandardizedData[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CSVDatabase', DBversion.value);

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
    DBversion,
  };
}
