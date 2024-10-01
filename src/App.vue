<template>
  <div class="flex flex-col min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-foreground tracking-wider">
    <TheHeader class="w-full z-10 fixed top-0" />
    <div class="flex flex-grow overflow-hidden">
      <SideNav class="z-20" />
      <div class="flex flex-col flex-grow">
        <main class="flex-grow p-4 overflow-auto ml-[200px] mt-[60px]">
          <router-view />
        </main>
        <TheFooter class="ml-[200px]"/>
				<!-- {{ dbStore }} -->
				<br>
				<!-- {{ userStore }} -->
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
	import { useUserStore } from '@/stores/userStore';
	import { deleteAllDbsApi } from '@/API/api';
	import { PlanTier } from '../types/app-types';

	const dbStore = useDBstate();
	const userStore = useUserStore();

	const dbNames = ['az', 'us', 'can']; // List your database names here

	const handleBeforeUnload = () => {
		deleteAllDbsApi(dbNames);
	};

	onMounted(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		// setUser('free', true, ['az']);
	});

	onBeforeUnmount(() => {
		window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	// Function to process CSV text into an array of objects
	function processData(csvText, dataType) {
		const rows = csvText.trim().split('\n');
		return rows.map((row, index) => {
			const columns = row.split(',');
			if (dataType === 'az') {
				const [destName, dialCode, rate] = columns;
				return {
					destName: destName.trim(),
					dialCode: Number(dialCode.trim()),
					rate: Number(rate.trim()),
				};
			} else if (dataType === 'us') {
				const [, npa, nxx, interRate, intraRate, ijRate] = columns;
				let processedNpa = npa.trim();
				if (processedNpa.startsWith('1') && processedNpa.length === 4) {
					processedNpa = processedNpa.slice(1);
				}
				return {
					npa: Number(processedNpa),
					nxx: Number(nxx.trim()),
					interRate: Number(interRate.trim()),
					intraRate: Number(intraRate.trim()),
					ijRate: Number(ijRate.trim()),
				};
			}
		});
	}

	function setUser(plan, populateDb, dataTypes = []) {
		const userInfo = {
			email: plan === 'free' ? 'free@example.com' : 'pro@example.com',
			username: plan === 'free' ? 'FreeUser' : 'ProUser',
				planTier: plan === 'free' ? PlanTier.FREE : PlanTier.PRO,
		};
		userStore.setUser(userInfo);
		if (populateDb) {
			dataTypes.forEach(dataType => loadDb(dataType));
		}
	}

	async function loadDb(dataType) {
		try {
			const dbName = dataType === 'az' ? 'az' : 'us';
			const db = await openDB(dbName, 1, {
				upgrade(db) {
					if (dataType === 'az') {
						db.createObjectStore('AZtest1.csv', { keyPath: 'id', autoIncrement: true });
						db.createObjectStore('AZtest2.csv', { keyPath: 'id', autoIncrement: true });
					} else if (dataType === 'us') {
						db.createObjectStore('npa_nxx.csv', { keyPath: 'id', autoIncrement: true });
					}
				},
			});

			const DBstore = useDBstate();

			if (dataType === 'az') {
				const responseFile1 = await fetch('/src/data/AZtest1.csv');
				const csvTextFile1 = await responseFile1.text();
				DBstore.addFileUploaded('az1', 'az', 'AZtest1.csv');

				const responseFile2 = await fetch('/src/data/AZtest2.csv');
				const csvTextFile2 = await responseFile2.text();
				DBstore.addFileUploaded('az2', 'az', 'AZtest2.csv');

				const dataFile1 = processData(csvTextFile1, 'az');
				await storeData(db, 'AZtest1.csv', dataFile1);

				const dataFile2 = processData(csvTextFile2, 'az');
				await storeData(db, 'AZtest2.csv', dataFile2);
			} else if (dataType === 'us') {
				const responseFile = await fetch('/src/data/npa_nxx.csv');
				const csvTextFile = await responseFile.text();
				DBstore.addFileUploaded('us1', 'us', 'npa_nxx.csv');

				const dataFile = processData(csvTextFile, 'us');
				await storeData(db, 'npa_nxx.csv', dataFile);
			}
		} catch (error) {
			console.error(`Error loading ${dataType} CSV into IndexedDB:`, error);
		}
	}
	// Function to store data in the specified object store
	async function storeData(db, storeName, data) {
		const tx = db.transaction(storeName, 'readwrite');
		const store = tx.objectStore(storeName);
		data.forEach((item) => store.put(item));
		await tx.done; // Complete the transaction
	}
</script>

<style>
	.aborder {
		border: 1px solid red;
	}

</style>