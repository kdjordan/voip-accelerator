<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-foreground tracking-wider">
    <TheHeader class="w-full z-10" />
    <div class="flex flex-grow overflow-hidden">
      <SideNav class="z-20" />
      <div class="flex flex-col flex-grow">
        <main class="flex-grow p-4 overflow-auto ml-[200px]">
          <router-view />
        </main>
        <TheFooter class="ml-[200px]"/>
      </div>
    </div>
  </div>
</template>

<script setup>
	import SideNav from './components/SideNav.vue';
	import TheHeader from './components/TheHeader.vue';
	import TheFooter from './components/TheFooter.vue';
	import { openDB } from 'idb';
	import { onMounted, onBeforeUnmount } from 'vue';
	import { useDBstate } from '@/stores/dbStore';

	const dbNames = ['az', 'us', 'can']; // List your database names here

	onMounted(async () => {
		// await loadDb();
	});

	// Function to process CSV text into an array of objects
	function processData(csvText) {
		const rows = csvText.trim().split('\n');
		return rows.map((row, index) => {
			const [destName, dialCode, rate] = row.split(',');
			return {
				destName: destName.trim(),
				dialCode: Number(dialCode.trim()),
				rate: Number(rate.trim()),
			};
		});
	}

	async function loadDb() {
		try {
			// Open or create the 'az' IndexedDB database
			const db = await openDB('az', 1, {
				upgrade(db) {
					// Create object stores for file1.csv and file2.csv
					db.createObjectStore('AZtest1.csv', {
						keyPath: 'id',
						autoIncrement: true,
					});
					db.createObjectStore('AZtest2.csv', {
						keyPath: 'id',
						autoIncrement: true,
					});
				},
			});

			// Fetch file1.csv
			const DBstore = useDBstate();
			const responseFile1 = await fetch('/src/data/AZtest1.csv');
			
			const csvTextFile1 = await responseFile1.text();
			// console.log('got file 1', csvTextFile1)
			DBstore.addFileUploaded('az1', 'az', 'AZtest1.csv');

			// Fetch file2.csv
			const responseFile2 = await fetch('/src/data/AZtest2.csv');
			const csvTextFile2 = await responseFile2.text();
			DBstore.addFileUploaded('az2', 'az', 'AZtest2.csv');

			// Process and store file1.csv in IndexedDB 'file1' object store
			const dataFile1 = processData(csvTextFile1);
			console.log('sending data1 ', dataFile1)
			await storeData(db, 'AZtest1.csv', dataFile1);

			// Process and store file2.csv in IndexedDB 'file2' object store
			const dataFile2 = processData(csvTextFile2);
			await storeData(db, 'AZtest2.csv', dataFile2);
		} catch (error) {
			console.error('Error loading CSV into IndexedDB:', error);
		}
	}
	// Function to store data in the specified object store
	async function storeData(db, storeName, data) {
		const tx = db.transaction(storeName, 'readwrite');
		const store = tx.objectStore(storeName);
		data.forEach((item) => store.put(item));
		await tx.done; // Complete the transaction
	}

	// const handleBeforeUnload = () => {
	// 	deleteIndexedDBDatabases(dbNames);
	// };

	// window.addEventListener('beforeunload', handleBeforeUnload);

	// // Cleanup event listener when component is unmounted
	// onBeforeUnmount(() => {
	// 	window.removeEventListener('beforeunload', handleBeforeUnload);
	// });
</script>

<style>
	.aborder {
		border: 1px solid red;
	}

</style>
