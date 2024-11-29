import { type StandardizedData, DBName } from "@/types/app-types";
import { useDBstate } from "@/stores/dbStore";
import { openDB } from "idb";

const DBstore = useDBstate();

export default function useIndexedDB() {
  async function storeInIndexedDB(
    data: StandardizedData[],
    dbName: DBName,
    fileName: string,
    componentName: string
  ): Promise<void> {
    console.log("storing");
    try {
      const db = await openDB(dbName, DBstore.globalDBVersion + 1, {
        upgrade(db) {
          // Perform upgrade actions if needed
          console.log("Upgrade needed for IndexedDB");
          DBstore.setGlobalFileIsUploading(true);

          if (!db.objectStoreNames.contains(fileName)) {
            db.createObjectStore(fileName, {
              keyPath: "id",
              autoIncrement: true,
            });
          }
        },
      });

      const transaction = db.transaction(fileName, "readwrite");
      const store = transaction.objectStore(fileName);
      data.forEach((row) => {
        store.add(row);
      });

      transaction.oncomplete = () => {
        DBstore.addFileUploaded(componentName, dbName, fileName);
        DBstore.setGlobalFileIsUploading(false);
        DBstore.setComponentFileIsUploading(undefined);
        db.close();
      };

      transaction.onerror = () => {
        DBstore.setGlobalFileIsUploading(false);
        DBstore.setComponentFileIsUploading(undefined);
        console.error("Transaction error:", transaction.error);
      };
    } catch (error) {
      console.error("Error opening IndexedDB:", error);
    }
  }

  async function loadFromIndexedDB(
    dbName: string,
    storeName: string,
    DBversion: number
  ): Promise<StandardizedData[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, DBversion);

      request.onupgradeneeded = function (event) {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, {
              keyPath: "id",
              autoIncrement: true,
            });
          }
        }
      };

      request.onsuccess = function (event) {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db) {
          const transaction = db.transaction(storeName, "readonly");
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
          reject(new Error("Failed to open IndexedDB"));
        }
      };

      request.onerror = function (event) {
        const requestError = (event.target as IDBOpenDBRequest).error;
        console.error("IndexedDB error:", requestError);
        reject(requestError);
      };
    });
  }

  async function deleteObjectStore(
    dbName: string,
    objectStoreName: string
  ): Promise<void> {
    console.log("called delete", dbName, objectStoreName);
    try {
      // Open the database
      const db = await openDB(dbName, undefined);

      // Check if the object store exists
      if (db.objectStoreNames.contains(objectStoreName)) {
        // Close the database to prepare for version change
        db.close();

        // Open a new connection with a higher version to delete the object store
        const upgradeDb = await openDB(dbName, db.version + 1, {
          upgrade(upgradeDb) {
            if (upgradeDb.objectStoreNames.contains(objectStoreName)) {
              upgradeDb.deleteObjectStore(objectStoreName);
              //delete from Pinia
              DBstore.removeFileNameFilesUploaded(objectStoreName);
              console.log(`Object store "${objectStoreName}" deleted.`);
            } else {
              console.log(`Object store "${objectStoreName}" does not exist.`);
            }
          },
        });

        // Close the upgraded database connection
        upgradeDb.close();
      } else {
        console.log(
          `Object store "${objectStoreName}" does not exist in database "${dbName}".`
        );
      }
    } catch (error) {
      console.error("Error deleting object store:", error);
      throw error; // Rethrow the error to handle it at the caller level if needed
    }
  }

  return {
    storeInIndexedDB,
    loadFromIndexedDB,
    deleteObjectStore,
  };
}
