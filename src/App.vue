<template>
  <div>
    <TheHeader />
    <div class="mx-auto p-6 space-y-6 pt-32">
      <div
        v-if="!isReporting"
        class="max-w-[1200px] mx-auto flex flex-col gap-4"
      >
        <UploadComponent
          mssg="Upload YOUR rates as CSV. <br /><br /> You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer."
          v-if="file1 === null"
          @file-selected="handleFile"
        />
        <CompleteUpload
          v-if="file1 !== null"
          :mssg="`Your rates from ${details?.fileName1} have been accepted`"
        />
        <UploadComponent
          mssg="Upload your CLIENT rates as CSV. <br /><br /> You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer."
          v-if="file2 === null"
          @file-selected="handleFile"
        />
        <CompleteUpload
          v-if="file2 !== null"
          :mssg="`The carrier rates from ${details?.fileName2} have been accepted`"
        />
        <button
          @click="dumpDB"
          class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition text-center"
        >
          DUMP
        </button>
        <button
          v-if="filesReady"
          @click="compareFiles"
          class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition text-center"
        >
          Compare Files
        </button>
      </div>
      <div v-else>
        <GenerateReport
          v-if="report"
          :report="report"
          :details="details"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import UploadComponent from './components/UploadComponent.vue';
import CompleteUpload from './components/CompleteUpload.vue';
import GenerateReport from './components/GenerateReport.vue';
import TheHeader from './components/TheHeader.vue';
import { ComparisonReport, StandardizedData } from './types';

const file1 = ref<File | null>(null);
const file2 = ref<File | null>(null);

const DBversion = ref<number>(1);

const isReporting = ref<boolean>(false);
const report = ref<ComparisonReport | null>(null);
const details = ref<{
  fileName1: string;
  fileName2: string;
} | null>(null);

const filesReady = computed(
  () => file1.value !== null && file2.value !== null
);

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

async function handleFile(fileData: { file: File; data: StandardizedData[]; }) {
  if (!details.value || !details.value.fileName1) {
    details.value = {
      fileName1: fileData.file.name.split('.')[0],
      fileName2: '',
    };
    await storeInIndexedDB(fileData.data, details.value.fileName1);
  } else if (!details.value.fileName2) {
    details.value = {
      fileName1: details.value.fileName1,
      fileName2: fileData.file.name.split('.')[0],
    };
    await storeInIndexedDB(fileData.data, details.value.fileName2);
  }
}

async function compareFiles() {
  isReporting.value = true;
  if (!filesReady.value) {
    alert('Please select both files');
    return;
  }

  const worker = new Worker(
    new URL('./compareWorker.ts', import.meta.url),
    { type: 'module' }
  );

  const map1Data = await loadFromIndexedDB(file1.value!.name.split('.')[0]);
  const map2Data = await loadFromIndexedDB(file2.value!.name.split('.')[0]);

  worker.onmessage = function (event) {
    if (event.data.type === 'result') {
      report.value = event.data.data;
      isReporting.value = false;
    } else if (event.data.type === 'error') {
      console.error('Worker error:', event.data.data);
      isReporting.value = false;
    }
  };

  worker.onerror = function (error) {
    console.error('Worker error:', error);
    isReporting.value = false;
  };

  worker.postMessage({
    type: 'start',
    map1Data,
    map2Data,
  });
}

async function loadFromIndexedDB(storeName: string): Promise<StandardizedData[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CSVDatabase', DBversion.value);

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

async function storeInIndexedDB(data: StandardizedData[], storeName: string) {
  const request = indexedDB.open('CSVDatabase', DBversion.value);
  DBversion.value++;

  request.onupgradeneeded = (event) => {
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
    const db = (event.target as IDBOpenDBRequest).result as IDBDatabase;
    if (db) {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      data.forEach((row) => {
        store.add(row);
      });

      transaction.oncomplete = () => {
        console.log('Data stored successfully');
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

</script>

<style>
.container {
  max-width: 600px;
}
</style>
