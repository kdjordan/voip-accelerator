<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="mb-8">
      <span class="text-sizeXl tracking-wide text-accent uppercase px-4 py-2 font-secondary"
        >US Rate Sheet Wizard
      </span>
    </h1>

    <!-- Stats Dashboard -->
    <div class="bg-gray-800 rounded-lg overflow-hidden">
      <!-- Header Section -->
      <div class="p-6 border-b border-gray-700/50">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-fbWhite">Overview</h2>
          <!-- Add Clear Button -->
          <button
            v-if="isLocallyStored"
            @click="handleClearData"
            :disabled="isProcessing"
            class="flex items-center px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrashIcon class="w-4 h-4 text-red-400 mr-1.5" />
            <span class="text-sm text-red-400">Clear Data</span>
          </button>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Storage Status -->
          <div class="bg-gray-900/50 p-4 rounded-lg">
            <div class="flex justify-between items-center">
              <h3 class="text-sm text-gray-400">Storage Status</h3>
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="[isLocallyStored ? 'bg-green-500 animate-pulse' : 'bg-red-500']"
                ></div>
                <span class="text-sm">{{ isLocallyStored ? 'Data Loaded' : 'No Data' }}</span>
              </div>
            </div>
          </div>

          <!-- Effective Date -->
          <div class="bg-gray-900/50 p-4 rounded-lg">
            <div class="flex justify-between items-center">
              <h3 class="text-sm text-gray-400">Effective Date</h3>
              <div class="text-sm font-medium">
                {{ store.getUsRateSheetEffectiveDate || 'N/A' }}
              </div>
            </div>
          </div>

          <!-- Total Records - Conditionally Rendered -->
          <div v-if="isLocallyStored" class="bg-gray-900/50 p-4 rounded-lg md:col-span-2">
            <div class="flex justify-between items-center">
              <h3 class="text-sm text-gray-400">Total Records Processed</h3>
              <!-- TODO: Get actual record count from Dexie via store or service -->
              <div class="text-base font-semibold">{{ '---' /* store.getTotalRecords */ }}</div>
            </div>
          </div>

          <!-- Removed Discrepancy Count -->
          <!-- Removed Invalid Rows Status/Details -->
        </div>

        <!-- File Upload Section -->
        <div v-if="!isLocallyStored" class="mt-6 border-t border-gray-700/50 pt-6">
          <h3 class="text-lg font-medium text-fbWhite mb-4">Upload Rate Sheet</h3>
          <div
            @dragenter.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
            class="relative rounded-lg p-6 h-[120px] flex items-center justify-center transition-colors duration-200"
            :class="[
              isDragging
                ? 'border-2 border-solid border-accent bg-fbWhite/10'
                : 'border-2 border-dashed border-gray-600 hover:border-accent-hover hover:bg-fbWhite/10',
              isProcessing ? 'animate-pulse cursor-not-allowed' : 'cursor-pointer',
              store.getError ? 'border-2 border-solid border-red-500' : '',
            ]"
          >
            <input
              type="file"
              accept=".csv"
              class="absolute inset-0 opacity-0 w-full h-full"
              :class="{ 'pointer-events-none': isProcessing }"
              :disabled="isProcessing"
              @change="handleFileChange"
            />
            <div class="text-center">
              <ArrowUpTrayIcon
                class="w-10 h-10 mx-auto border rounded-full p-2 mb-2"
                :class="
                  store.getError
                    ? 'text-red-500 border-red-500/50 bg-red-500/10'
                    : 'text-accent border-accent/50 bg-accent/10'
                "
              />
              <p
                class="text-base font-medium"
                :class="store.getError ? 'text-red-500' : 'text-accent'"
              >
                <template v-if="store.getError">
                  <span>{{ store.getError }}</span>
                </template>
                <template v-else-if="isProcessing">
                  <span>Processing your file...</span>
                </template>
                <template v-else>
                  <span>DRAG & DROP or CLICK to upload CSV</span>
                </template>
              </p>
              <p v-if="store.getError" class="mt-1 text-xs text-red-400">
                Please check the file and try again.
              </p>
            </div>
          </div>
          <!-- Display success message -->
          <div
            v-if="rfUploadStatus?.type === 'success'"
            class="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md text-sm text-green-400"
          >
            {{ rfUploadStatus.message }}
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div v-if="isLocallyStored" class="p-6">
        <USRateSheetTable />
        <!-- Removed discrepancy count prop -->
      </div>
    </div>

    <!-- Preview Modal -->
    <PreviewModal
      v-if="showPreviewModal"
      :show-modal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :column-options="US_COLUMN_ROLE_OPTIONS"
      :start-line="startLine"
      :validate-required="false"
      :source="'US'"
      @update:mappings="handleMappingUpdate"
      @update:valid="(newValid) => (isValid = newValid)"
      @update:start-line="(newStartLine) => (startLine = newStartLine)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

import {
  ArrowUpTrayIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/vue/24/outline';
import USRateSheetTable from '@/components/rate-sheet/us/USRateSheetTable.vue';
import PreviewModal from '@/components/shared/PreviewModal.vue';
import { US_COLUMN_ROLE_OPTIONS } from '@/types/domains/us-types';
import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import { USRateSheetService } from '@/services/us-rate-sheet.service.ts';
import { USColumnRole } from '@/types/domains/us-types';
import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';

const store = useUsRateSheetStore();
const usRateSheetService = new USRateSheetService();
const isLocallyStored = computed(() => store.getHasUsRateSheetData);
const isDragging = ref(false);
const isRFUploading = ref(false);
const isRFRemoving = ref(false);
const uploadError = ref<string | null>(store.getError);
const rfUploadStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);
const isProcessing = computed(() => store.isLoading);

// Preview Modal state
const showPreviewModal = ref(false);
const previewData = ref<string[][]>([]);
const columns = ref<string[]>([]);
const startLine = ref(1);
const columnMappings = ref<Record<string, string>>({});
const isValid = ref(false);
const selectedFile = ref<File | null>(null);

// Invalid Rows state
const showInvalidRowsDetails = ref(false);

onMounted(async () => {
  // Load initial data state from Dexie via the store
  await store.loadRateSheetData();
});

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  uploadError.value = '';
  const file = input.files[0];
  processFile(file);
}

function handleFileDrop(event: DragEvent) {
  if (!event.dataTransfer) return;

  const file = event.dataTransfer.files?.[0];
  if (!file) return;

  uploadError.value = '';
  processFile(file);
}

function processFile(file: File) {
  if (!file.name.endsWith('.csv')) {
    uploadError.value = 'Invalid file type. Please upload a CSV file.';
    return;
  }

  selectedFile.value = file;

  try {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: ParseResult<string[]>) => {
        columns.value = results.data[0].map((h) => h.trim());
        previewData.value = results.data
          .slice(0, 10)
          .map((row) => (Array.isArray(row) ? row.map((cell) => cell?.trim() || '') : []));
        startLine.value = 1;
        showPreviewModal.value = true;
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        uploadError.value = 'Failed to parse CSV file: ' + error.message;
      },
    });
  } catch (error) {
    console.error('Error handling file:', error);
    uploadError.value =
      'Failed to process file: ' + (error instanceof Error ? error.message : String(error));
  }
}

async function handleModalConfirm(
  mappings: Record<string, string>,
  indeterminateDefinition?: string,
  effectiveDate?: string
) {
  showPreviewModal.value = false;
  const file = selectedFile.value;
  if (!file || !effectiveDate) {
    store.setError('File or Effective Date missing from modal confirmation.');
    selectedFile.value = null;
    return;
  }

  store.setLoading(true);
  store.setError(null);
  rfUploadStatus.value = null;

  try {
    console.log('Starting US Rate Sheet processing...', {
      mappings,
      indeterminateDefinition,
      effectiveDate,
    });

    const columnMapping = {
      npanxx: Number(
        Object.entries(mappings).find(([_, value]) => value === USColumnRole.NPANXX)?.[0] ?? -1
      ),
      npa: Number(
        Object.entries(mappings).find(([_, value]) => value === USColumnRole.NPA)?.[0] ?? -1
      ),
      nxx: Number(
        Object.entries(mappings).find(([_, value]) => value === USColumnRole.NXX)?.[0] ?? -1
      ),
      interstate: Number(
        Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTERSTATE)?.[0] ?? -1
      ),
      intrastate: Number(
        Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTRASTATE)?.[0] ?? -1
      ),
      indeterminate: Number(
        Object.entries(mappings).find(([_, value]) => value === USColumnRole.INDETERMINATE)?.[0] ??
          -1
      ),
    };

    console.log('Processing file with column mapping:', columnMapping);

    const result = await usRateSheetService.processFile(
      file,
      columnMapping,
      startLine.value,
      indeterminateDefinition,
      effectiveDate
    );

    console.log('File processed by service:', result);
    rfUploadStatus.value = {
      type: 'success',
      message: `Successfully processed ${result.recordCount} records from ${file.name}. Found ${result.invalidRows.length} invalid rows.`,
    };

    await store.handleUploadSuccess(effectiveDate);
  } catch (error) {
    console.error('Failed to process US rate sheet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process rate sheet';
    store.setError(errorMessage);
    rfUploadStatus.value = { type: 'error', message: errorMessage };
    store.clearUsRateSheetData();
  } finally {
    store.setLoading(false);
    selectedFile.value = null;
  }
}

function handleModalCancel() {
  showPreviewModal.value = false;
  selectedFile.value = null;
}

function handleMappingUpdate(newMappings: Record<string, string>) {
  columnMappings.value = newMappings;
}

function toggleInvalidRowsDetails() {
  showInvalidRowsDetails.value = !showInvalidRowsDetails.value;
}

// Update handleClearData to use the store action
async function handleClearData() {
  if (confirm('Are you sure you want to clear all US Rate Sheet data?')) {
    await store.clearUsRateSheetData();
  }
}
</script>
