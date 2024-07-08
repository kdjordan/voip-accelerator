<template>
	<button
		@click="dumpDB"
		class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition text-center ml-4"
	>
		DUMP
	</button>
</template>

<script setup lang="ts">
	function dumpDB() {
		deleteUS();
		deleteAZ();
		localStorage.clear();
		setTimeout(() => {
			window.location.reload();
		}, 1000);
	}

	function deleteUS() {
		const deleteRequest = window.indexedDB.deleteDatabase('us');

		deleteRequest.onsuccess = function () {
			console.log(`Deleted database US successfully.`);
		};

		deleteRequest.onerror = function (event) {
			console.error(
				`Error deleting database US:`,
				deleteRequest.error
			);
		};

		deleteRequest.onblocked = function () {
			console.warn(
				`Deletion of database US is blocked. Close all connections.`
			);
		};
	}

	function deleteAZ() {
		const deleteRequest = window.indexedDB.deleteDatabase('az');

		deleteRequest.onsuccess = function () {
			console.log(`Deleted database AZ successfully.`);
		};

		deleteRequest.onerror = function (event) {
			console.error(
				`Error deleting database AZ:`,
				deleteRequest.error
			);
		};

		deleteRequest.onblocked = function () {
			console.warn(
				`Deletion of database AZ is blocked. Close all connections.`
			);
		};
	}
</script>
