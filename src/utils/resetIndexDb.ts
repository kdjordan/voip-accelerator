export async function deleteIndexedDBDatabase(dbName: string) {
  const request = indexedDB.deleteDatabase(dbName);
  request.onsuccess = () => {
    console.log(`Database ${dbName} deleted successfully.`);
  };
  request.onerror = (event) => {
    console.error(`Error deleting database ${dbName}:`, (event.target as IDBRequest).error);
  };


}
