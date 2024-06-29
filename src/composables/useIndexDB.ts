import { ref, reactive } from 'vue';
import { type StandardizedData } from '../../types/app-types';

//global state - might become Pinia
const DBstate = reactive({
  globalDBVersion: 1,
  globalIsAfileUploading: false,
  AZFilesUploadedCount: 0
})

export function useIndexedDB() {
  //local state for components
  const DBloading = ref<boolean>(false)
  const DBloaded = ref<boolean>(false)

  async function storeInIndexedDB(data: StandardizedData[], DBname: string, storeName: string) {
    console.log('running ', storeName, DBstate.globalDBVersion);
    const request = indexedDB.open(DBname, DBstate.globalDBVersion);

    request.onupgradeneeded = (event) => {
      DBloading.value = true
      DBstate.globalIsAfileUploading = true
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
          DBstate.globalDBVersion++
          DBstate.AZFilesUploadedCount++
          DBstate.globalIsAfileUploading = false
          DBloading.value = false
          DBloaded.value = true
          console.log('Data stored successfully', DBloaded.value );
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
    DBstate,
    DBloading,
    DBloaded
  };
}
