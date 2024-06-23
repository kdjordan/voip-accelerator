<template>
  <TheHeader />
  <div class="container mx-auto p-6 space-y-6">
    <UploadComponent @file-selected="handleFile1" />
    <UploadComponent @file-selected="handleFile2" />
    <button @click="compareFiles" class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">
      Compare Files
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UploadComponent from './components/UploadComponent.vue';
import TheHeader from './components/TheHeader.vue';

interface FileEmit {
  file: File;
  dialCodeColumn: string;
  rateColumn: string;
}

const file1 = ref<FileEmit | null>(null);
const file2 = ref<FileEmit | null>(null);

function handleFile1(fileData: FileEmit) {
  file1.value = fileData;
}

function handleFile2(fileData: FileEmit) {
  file2.value = fileData;
}

function compareFiles() {
  console.log('file 1 in app is', file1)
  if (file1.value && file2.value) {
    // Add your comparison logic here using file1 and file2
    console.log('Comparing files', file1.value, file2.value);
  } else {
    alert('Please select both files');
  }
}
</script>

<style>
.container {
  max-width: 600px;
}
</style>
