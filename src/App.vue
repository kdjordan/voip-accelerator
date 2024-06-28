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
        />
        <UploadComponent
          mssg="Upload your CLIENT rates as CSV. <br /><br /> You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer."
          v-if="file2 === null"
          
        />
        <!-- <button
          @click="dumpDB"
          class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition text-center"
        >
          DUMP
        </button> -->
        <button
          v-if="filesReady"
          
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
import GenerateReport from './components/GenerateReport.vue';
import TheHeader from './components/TheHeader.vue';
import { type ComparisonReport } from '../types/app-types';

const file1 = ref<File | null>(null);
const file2 = ref<File | null>(null);

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


</script>
