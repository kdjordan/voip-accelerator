export async function deleteIndexedDBDatabases(dbNames: string[]) {
  dbNames.forEach((dbName) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => {
      console.log(`Database ${dbName} deleted successfully.`);
    };
    request.onerror = (event) => {
      console.error(`Error deleting database ${dbName}:`, (event.target as IDBRequest).error);
    };
  });
  if (dbNames.length > 1) {
    window.location.reload();
  }
}
