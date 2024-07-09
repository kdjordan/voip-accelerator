<template>
	<div id="app">
		<!-- Header Component -->
		<Header />

		<!-- Main Content Area where routed components will be displayed -->
		<router-view />
	</div>
</template>

<script setup>
	import Header from './components/TheHeader.vue';
	import { openDB } from 'idb';
	import { onMounted, onBeforeUnmount } from 'vue';
	import { deleteIndexedDBDatabases } from './utils/resetIndexDb.ts';
	import { useDBstate } from '@/stores/dbStore';

	const dbNames = ['az', 'us', 'can']; // List your database names here

	onMounted(async () => {
		await loadDb()
     
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
          id: index + 1,
        };
      });
    }

    // Function to store data in the specified object store
    async function storeData(db, storeName, data) {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      data.forEach((item) => store.put(item));
      await tx.done; // Complete the transaction
    }

		async function loadDb() {
			try {
        // Open or create the 'az' IndexedDB database
        const db = await openDB('az', 1, {
          upgrade(db) {
            // Create object stores for file1.csv and file2.csv
            db.createObjectStore('file1.csv', { keyPath: 'id', autoIncrement: true });
            db.createObjectStore('file2.csv', { keyPath: 'id', autoIncrement: true });
          },
        });

        // Fetch file1.csv
				const DBstore = useDBstate();
        const responseFile1 = await fetch('/src/data/file1.csv');
        const csvTextFile1 = await responseFile1.text();
				DBstore.addFileUploaded('az1', 'az', 'file1.csv')

        // Fetch file2.csv
        const responseFile2 = await fetch('/src/data/file2.csv');
        const csvTextFile2 = await responseFile2.text();
				DBstore.addFileUploaded('az2', 'az', 'file2.csv')

        // Process and store file1.csv in IndexedDB 'file1' object store
        const dataFile1 = processData(csvTextFile1);
        await storeData(db, 'file1.csv', dataFile1);


        // Process and store file2.csv in IndexedDB 'file2' object store
        const dataFile2 = processData(csvTextFile2);
        await storeData(db, 'file2.csv', dataFile2);

      } catch (error) {
        console.error('Error loading CSV into IndexedDB:', error);
      }
		}
		// const handleBeforeUnload = () => {
		// 	deleteIndexedDBDatabases(dbNames);
		// };

		// window.addEventListener('beforeunload', handleBeforeUnload);

		// // Cleanup event listener when component is unmounted
		// onBeforeUnmount(() => {
		// 	window.removeEventListener('beforeunload', handleBeforeUnload);
		// });
	// });
</script>

<style>
	.aborder {
		border: 1px solid red;
	}
	.bg-background {
		background-color: #f9f9f9;
	}

	.text-primary {
		color: #0070f3;
	}

	.text-secondary {
		color: #ff4081;
	}

	.bg-card {
		background-color: #fff;
	}

	.bg-green-100 {
		background-color: #d4f1c6;
	}

	.bg-blue-500 {
		background-color: #0070f3;
	}

	.text-muted-foreground {
		color: #6b7280;
	}

	.border-primary {
		border-color: #0070f3;
	}

	.border-secondary {
		border-color: #ff4081;
	}

	.hover\:bg-blue-600:hover {
		background-color: #005bb5;
	}
</style>
