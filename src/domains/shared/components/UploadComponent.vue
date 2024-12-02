<template>
  <div class="upload-component">
    <div
      class="relative border-2 border-dashed rounded-lg p-6"
      :class="[
        isProcessing || disabled ? 'border-gray-500 bg-gray-800/50' : 'border-accent hover:border-accent-hover',
        isProcessing || disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      ]"
    >
      <!-- Upload Zone -->
      <div class="flex flex-col items-center justify-center space-y-2">
        <input
          type="file"
          accept=".csv"
          class="absolute inset-0 w-full h-full opacity-0"
          :disabled="isProcessing || disabled"
          @change="handleFileInput"
        />
        
        <!-- Upload Icon/Status -->
        <div class="text-center">
          <template v-if="!disabled && !isProcessing">
            <i class="fas fa-cloud-upload-alt text-2xl text-accent"></i>
            <p class="mt-2 text-sm text-foreground">
              Drop your {{ typeOfComponent }}'s CSV file here or click to browse
            </p>
          </template>
          <template v-if="isProcessing">
            <div class="animate-spin text-2xl text-accent">
              <i class="fas fa-circle-notch"></i>
            </div>
            <p class="mt-2 text-sm text-foreground">Processing file...</p>
          </template>
          <template v-if="disabled && !isProcessing">
            <i class="fas fa-check-circle text-2xl text-green-500"></i>
            <p class="mt-2 text-sm text-foreground">File uploaded successfully</p>
            <button 
              @click.stop="handleRemoveFile"
              class="mt-2 text-xs text-red-500 hover:text-red-400"
            >
              Remove File
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <TheModal
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="columns"
      :previewData="previewData"
      :columnRoles="columnRoles"
      :startLine="startLine"
      :columnRoleOptions="columnRoleOptions"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Papa from 'papaparse';
import TheModal from './PreviewModal.vue';
import { 
  type FileEmit, 
  type ParsedResults, 
  type StandardizedData,
  type DBNameType,
  DBName 
} from '../types';
import { useSharedStore } from '../store';
import useIndexedDB from '@/composables/useIndexDB';

interface ColumnRoleOption {
  value: string;
  label: string;
}

const props = defineProps<{
  typeOfComponent: 'owner' | 'carrier' | 'client';
  DBname: DBNameType;
  componentName: string;
  disabled: boolean;
  columnRoleOptions: ColumnRoleOption[];
}>();

const emit = defineEmits<{
  (e: 'fileUploaded', componentName: string, fileName: string): void;
}>();

const sharedStore = useSharedStore();
const isProcessing = ref(false);
const showPreviewModal = ref(false);
const file = ref<File | null>(null);
const columns = ref<string[]>([]);
const previewData = ref<string[][]>([]);
const columnRoles = ref<string[]>([]);
const startLine = ref(1);

async function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  isProcessing.value = true;
  file.value = target.files[0];

  try {
    await parseCSVForPreview(file.value);
    showPreviewModal.value = true;
  } catch (error) {
    console.error('Error handling file:', error);
    // TODO: Show error notification
  } finally {
    isProcessing.value = false;
  }
}

function parseCSVForPreview(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results: ParsedResults) => {
        previewData.value = results.data;
        columns.value = results.data[0];
        columnRoles.value = new Array(columns.value.length).fill('');
        resolve();
      },
      error: reject,
    });
  });
}

async function handleModalConfirm(confirmation: { 
  columnRoles: string[]; 
  startLine: number;
}) {
  showPreviewModal.value = false;
  isProcessing.value = true;

  try {
    if (!file.value) throw new Error('No file selected');
    
    // Get the appropriate transformer based on DBname
    const transformer = await import(`@/domains/${props.DBname}/services/${props.DBname}-transformer`);
    
    // Parse and transform the data
    const parsedData = await new Promise((resolve, reject) => {
      Papa.parse(file.value!, {
        skipEmptyLines: true,
        header: true,
        transform: (value) => value.trim(),
        complete: (results) => {
          const data = results.data
            .slice(confirmation.startLine - 1)
            .map((row: any) => {
              const mappedData = transformer.transform(row, confirmation.columnRoles);
              return mappedData;
            })
            .filter(data => transformer.validate(data));
          resolve(data);
        },
        error: reject,
      });
    });

    // Store in IndexedDB
    const { storeInIndexedDB } = useIndexedDB();
    await storeInIndexedDB(
      parsedData,
      props.DBname,
      file.value.name,
      props.componentName
    );

    emit('fileUploaded', props.componentName, file.value.name);
  } catch (error) {
    console.error('Error processing file:', error);
  } finally {
    isProcessing.value = false;
  }
}

function handleModalCancel() {
  showPreviewModal.value = false;
  file.value = null;
}

function handleRemoveFile() {
  // TODO: Implement file removal logic
  console.log('Removing file for component:', props.componentName);
}
</script>

<style scoped>
.upload-component {
  @apply w-full;
}
</style>
