<template>
  <div class="drop-zone" @dragover.prevent @drop.prevent="onDrop" @click="selectFile">
    <p v-if="!file">Drag and drop a CSV file here, or click to select a file</p>
    <p v-else>{{ file.name }}</p>
    <input ref="fileInput" type="file" @change="onFileChange" class="hidden" />
  </div>
  <div v-if="showModal" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
    <div class="bg-white p-6 rounded-lg space-y-4">
      <h2 class="text-xl font-semibold">Select Column Roles</h2>
      <p>Select the starting line:</p>
      <select v-model="startLine" class="mb-4 border border-gray-300 p-2">
        <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
      </select>
      <table class="min-w-full border">
        <thead>
          <tr>
            <th class="border px-4 py-2">#</th>
            <th v-for="(col, index) in columns" :key="index" class="border px-4 py-2">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
            <td class="border px-4 py-2">{{ rowIndex + 1 }}</td>
            <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="border px-4 py-2">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
      <div class="flex justify-end space-x-2">
        <button @click="cancelModal" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">Cancel</button>
        <button @click="confirmColumnRoles" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import Papa from 'papaparse';

interface FileEmit {
  file: File;
  data: Array<{ [key: string]: string | number }>;
}

const fileInput = ref<HTMLInputElement | null>(null);
const file = ref<File | null>(null);
const showModal = ref(false);
const loading = ref(false);
const startLine = ref(1);
const columns = ref<string[]>([]);
const rows = ref<string[][]>([]);

const emit = defineEmits<{
  'file-selected': (payload: FileEmit) => void;
}>();

function onDrop(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer?.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
}

function selectFile() {
  const input = fileInput.value;
  if (input) {
    input.click();
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    handleFile(input.files[0]);
  }
}

function handleFile(selectedFile: File) {
  loading.value = true;
  file.value = selectedFile;

  Papa.parse(selectedFile, {
    header: true,
    complete: (results) => {
      columns.value = Object.keys(results.data[0]);
      rows.value = results.data.map((row: string ) => Object.values(row)).slice(0, 10); // Limit preview to first 10 rows
      loading.value = false;
      showModal.value = true;
    },
    error: () => {
      loading.value = false;
      alert('Error parsing file');
    }
  });
}

function confirmColumnRoles() {
  if (file.value) {
    const standardizedData = rows.value.slice(startLine.value - 1).map(row => {
      const rowObj: { [key: string]: string | number } = {};
      columns.value.forEach((col, index) => {
        rowObj[col] = col === 'rate' ? parseFloat(row[index]) : row[index];
      });
      return rowObj;
    });

    emit('file-selected', {
      file: file.value,
      data: standardizedData
    });
  }
  showModal.value = false;
}

function cancelModal() {
  showModal.value = false;
}
</script>

<style>
.drop-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  border: 2px dashed #ddd;
  border-radius: 10px;
  transition: border-color 0.3s ease;
}

.drop-zone:hover {
  border-color: #999;
}

.loader {
  border-top-color: #3498db;
  -webkit-animation: spinner 0.6s linear infinite;
  animation: spinner 0.6s linear infinite;
}

@-webkit-keyframes spinner {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes spinner {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
}
</style>
