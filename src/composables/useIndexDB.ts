import { ref } from 'vue';

export function useIndexedDB() {
  const DBversion = ref(1);

  const storeInIndexedDB = async (data, storeName) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CSVDatabase', DBversion.value);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        data.forEach((row) => {
          store.add(row);
        });

        transaction.oncomplete = () => {
          db.close();
          resolve(true);
        };

        transaction.onerror = (event) => {
          reject(transaction.error);
        };
      };

      request.onerror = (event) => {
        reject(request.error);
      };
    });
  };

  const loadFromIndexedDB = async (storeName) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CSVDatabase', DBversion.value);

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const data = [];

        store.openCursor().onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            data.push(cursor.value);
            cursor.continue();
          } else {
            resolve(data);
          }
        };

        transaction.onerror = (event) => {
          reject(transaction.error);
        };
      };

      request.onerror = (event) => {
        reject(request.error);
      };
    });
  };

  return {
    storeInIndexedDB,
    loadFromIndexedDB,
    DBversion,
  };
}
