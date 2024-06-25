<template>
  <TheHeader />
  <div class="mx-auto p-6 space-y-6 pt-32">
    <div v-if="!isReporting" class="max-w-[1200px] mx-auto flex flex-col gap-4">
      <UploadComponent
        mssg="Upload YOUR rates as CSV. <br /><br /> You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer."
        v-if="file1 === null"
        @file-selected="handleFile1"
      />
      <CompleteUpload
        v-if="file1 !== null"
        mssg="Your rates have been accepted"
      />
      <UploadComponent
        mssg="Upload your CLIENT rates as CSV. <br /><br /> You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer."
        v-if="file2 === null"
        @file-selected="handleFile2"
      />
      <CompleteUpload
        v-if="file2 !== null"
        mssg="The carrier rates been accepted"
      />
      <button
        v-if="filesReady"
        @click="compareFiles"
        class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition text-center"
      >
        Compare Files
      </button>
    </div>
    <div v-else>
      <GenerateReport v-if="report" :report="report" :details="details" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import UploadComponent from './components/UploadComponent.vue';
import CompleteUpload from './components/CompleteUpload.vue';
import GenerateReport from './components/GenerateReport.vue';
import TheHeader from './components/TheHeader.vue';
import {
  FileEmit,
  ComparisonReport,
  StandardizedData,
} from '@/types/app-types';

const file1 = ref<FileEmit | null>(null);
const file2 = ref<FileEmit | null>(null);

const isReporting = ref<boolean>(false);
const report = ref<ComparisonReport | null>(null);
const details = ref<{
  fileName1: string;
  fileName2: string;
} | null>(null);

const filesReady = computed(
  () => file1.value !== null && file2.value !== null
);

function handleFile1(fileData: FileEmit) {
  console.log('got file 1', fileData);
  file1.value = fileData;
}

function handleFile2(fileData: FileEmit) {
  console.log('got file 2', fileData);
  file2.value = fileData;
}

function convertToMap(fileData: StandardizedData[]): [string, StandardizedData][] {
  return fileData.map((item) => [item.dialCode, item]);
}

function compareFiles() {
  isReporting.value = true;
  if (!filesReady.value) {
    alert('Please select both files');
    return;
  }

  const map1Data = convertToMap(file1.value!.data);
  const map2Data = convertToMap(file2.value!.data);

  const worker = new Worker(new URL('./compareWorker.ts', import.meta.url), { type: 'module' });

  worker.onmessage = function (event) {
    if (event.data.type === 'ready') {
      // Send chunks to worker
      const chunkSize = 10000; // Adjust the chunk size as needed
      for (let i = 0; i < map1Data.length; i += chunkSize) {
        worker.postMessage({
          type: 'map1Chunk',
          data: map1Data.slice(i, i + chunkSize)
        });
      }
      for (let i = 0; i < map2Data.length; i += chunkSize) {
        worker.postMessage({
          type: 'map2Chunk',
          data: map2Data.slice(i, i + chunkSize)
        });
      }
      worker.postMessage({ type: 'done' });
    } else if (event.data.type === 'result') {
      report.value = event.data.data;
      details.value = {
        fileName1: file1.value!.file.name.split('.')[0],
        fileName2: file2.value!.file.name.split('.')[0],
      };
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

  // Notify worker to prepare for receiving data
  worker.postMessage({ type: 'start' });
}



</script>

<style>
.container {
  max-width: 600px;
}
</style>
