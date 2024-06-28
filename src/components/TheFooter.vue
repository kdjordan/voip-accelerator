<template>
	<button
		@click="dumpDB"
		class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition text-center"
	>
		DUMP
	</button>
</template>
<script setup lang="ts">

function dumpDB() {
  const deleteRequest = indexedDB.deleteDatabase('CSVDatabase');

  deleteRequest.onsuccess = function () {
    console.log(`Deleted database 'CSVDatabase' successfully.`);
  };

  deleteRequest.onerror = function (event) {
    console.error(`Error deleting database 'CSVDatabase':`, deleteRequest.error);
  };

  deleteRequest.onblocked = function () {
    console.warn(`Deletion of database 'CSVDatabase' is blocked. Close all connections.`);
    indexedDB.close();
  };
}
</script>