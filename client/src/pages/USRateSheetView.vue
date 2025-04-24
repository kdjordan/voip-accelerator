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
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 gap-3">
          <!-- Storage Status -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Storage Status</h3>
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="[
                    isLocallyStored
                      ? 'bg-green-500 animate-status-pulse-success'
                      : 'bg-red-500 animate-status-pulse-error',
                  ]"
                ></div>
                <span class="text-sm">{{ isLocallyStored ? 'Data Loaded' : 'No Data' }}</span>
              </div>
            </div>
          </div>

          <!-- Total Records -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Total Records Processed</h3>
              <div class="text-xl font-medium">
                {{ store.getTotalRecords }}
              </div>
            </div>
          </div>

          <!-- Effective Date -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Effective Date</h3>
              <div class="text-xl font-medium">
                {{ new Date().toLocaleDateString() }}
              </div>
            </div>
          </div>

          <!-- Removed Discrepancy Count -->
          <!-- Removed Invalid Rows Status/Details -->
        </div>

        <!-- File Upload Section -->
        <div v-if="!isLocallyStored" class="mt-6">
          <div
            @dragenter.prevent="handleDragEnter"
            @dragleave.prevent="handleDragLeave"
            @dragover.prevent="handleDragOver"
            @drop.prevent="handleDrop"
            class="relative rounded-lg p-6 h-[120px] flex items-center justify-center transition-colors duration-200"
            :class="[
              isDragging && !showPreviewModal && !isProcessing
                ? 'border-2 border-solid border-accent bg-fbWhite/10'
                : 'border-2 border-dashed border-gray-600',
              !showPreviewModal && !isProcessing
                ? 'hover:border-accent-hover hover:bg-fbWhite/10'
                : 'opacity-50',
              isProcessing
                ? 'animate-pulse cursor-not-allowed'
                : !showPreviewModal
                ? 'cursor-pointer'
                : 'cursor-default',
              uploadError ? 'border-2 border-solid border-red-500' : '',
            ]"
          >
            <input
              type="file"
              accept=".csv"
              class="absolute inset-0 opacity-0 w-full h-full"
              :class="{ 'pointer-events-none': isProcessing || showPreviewModal }"
              :disabled="isProcessing || showPreviewModal"
              @change="handleFileChange"
            />
            <div class="text-center">
              <ArrowUpTrayIcon
                class="w-10 h-10 mx-auto border rounded-full p-2"
                :class="
                  uploadError
                    ? 'text-red-500 border-red-500/50 bg-red-500/10'
                    : 'text-accent border-accent/50 bg-accent/10'
                "
              />
              <p class="mt-2 text-base" :class="uploadError ? 'text-red-500' : 'text-accent'">
                <template v-if="uploadError">
                  <span>{{ uploadError }}</span>
                </template>
                <template v-else-if="isProcessing">
                  <span>Processing your file...</span>
                </template>
                <template v-else>
                  <span>DRAG & DROP to upload or CLICK to select file</span>
                </template>
              </p>
              <p v-if="uploadError" class="mt-1 text-xs text-red-400">
                Please try again with a CSV file
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
      <div v-if="isLocallyStored" class="mt-8">
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
import { useDragDrop } from '@/composables/useDragDrop';

const store = useUsRateSheetStore();
const usRateSheetService = new USRateSheetService();
const isLocallyStored = computed(() => store.getHasUsRateSheetData);
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

// --- Drag and Drop Setup ---
const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, clearError } =
  useDragDrop({
    acceptedExtensions: ['.csv'],
    onDropCallback: (file: File) => {
      uploadError.value = null;
      clearError();
      processFile(file);
    },
    onError: (message: string) => {
      uploadError.value = message;
      store.setError(message);
    },
  });

// --- End Drag and Drop Setup ---

onMounted(async () => {
  // Load initial data state from Dexie via the store
  await store.loadRateSheetData();
});

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  uploadError.value = null;
  clearError();
  const file = input.files[0];
  processFile(file);
}

function processFile(file: File) {
  console.log('[processFile] Started processing file:', file.name);
  selectedFile.value = file;

  try {
    console.log('[processFile] Calling Papa.parse...');
    Papa.parse(file, {
      preview: 20,
      skipEmptyLines: true,
      complete: (results: ParseResult<string[]>) => {
        console.log('[processFile] Papa.parse complete callback reached.');
        if (results.data.length === 0) {
          console.log('[processFile] Papa.parse complete: No data found.');
          const emptyErrorMessage = 'CSV file appears to be empty or invalid.';
          uploadError.value = emptyErrorMessage;
          store.setError(emptyErrorMessage);
          showPreviewModal.value = false;
          return;
        }
        console.log('[processFile] Papa.parse complete: Data found, processing for modal.');
        columns.value = results.data[0].map((h) => h?.trim() || '');
        previewData.value = results.data
          .slice(1, 11)
          .map((row) => (Array.isArray(row) ? row.map((cell) => cell?.trim() || '') : []));
        startLine.value = 1;
        console.log('[processFile] Setting showPreviewModal = true');
        showPreviewModal.value = true;
      },
      error: (error) => {
        console.error('[processFile] Papa.parse error callback reached:', error);
        const parseErrorMessage = 'Failed to parse CSV file: ' + error.message;
        uploadError.value = parseErrorMessage;
        store.setError(parseErrorMessage);
        showPreviewModal.value = false;
      },
    });
  } catch (error) {
    console.error('[processFile] Error during Papa.parse try/catch:', error);
    const processErrorMessage =
      'Failed to process file: ' + (error instanceof Error ? error.message : String(error));
    uploadError.value = processErrorMessage;
    store.setError(processErrorMessage);
    showPreviewModal.value = false;
  }
}

async function handleModalConfirm(
  mappings: Record<string, string>,
  indeterminateDefinition?: string
) {
  // Hide modal immediately to show processing state in drop zone
  showPreviewModal.value = false;
  uploadError.value = null;
  store.setError(null);

  // Return if no file selected
  if (!selectedFile.value) {
    console.error('[handleModalConfirm] No file selected.');
    uploadError.value = 'No file selected.';
    store.setError('No file selected.');
    return;
  }

  // Set loading state
  store.setLoading(true);
  console.log('[handleModalConfirm] Started processing', { file: selectedFile.value.name });

  try {
    // Prepare column mapping
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

    console.log('[handleModalConfirm] Calling service.processFile with', {
      mappings: columnMapping,
      startLine: startLine.value,
      indeterminate: indeterminateDefinition || 'column',
    });

    try {
      const result = await usRateSheetService.processFile(
        selectedFile.value,
        columnMapping,
        startLine.value,
        indeterminateDefinition || 'column',
        undefined // effectiveDate is optional
      );

      console.log('[handleModalConfirm] Service.processFile returned:', result);
      // Handle successful upload
      store.handleUploadSuccess(result.recordCount, selectedFile.value.name);

      // Clear the selected file
      selectedFile.value = null;
    } catch (processError) {
      console.error('[handleModalConfirm] Error processing file:', processError);

      // If the error is related to Dexie or table not found, attempt to recover
      if (
        processError.name === 'InvalidTableError' ||
        (processError.message && processError.message.includes('Table entries does not exist'))
      ) {
        console.log('[handleModalConfirm] Detected InvalidTableError, attempting to recover...');
        // Clear data to potentially rebuild the table structure
        try {
          await usRateSheetService.clearData();
          // Try processing again - if still fails, it will be caught by the outer catch block
          const retryResult = await usRateSheetService.processFile(
            selectedFile.value,
            columnMapping,
            startLine.value,
            indeterminateDefinition || 'column',
            undefined // effectiveDate is optional
          );
          console.log('[handleModalConfirm] Retry successful:', retryResult);
          store.handleUploadSuccess(retryResult.recordCount, selectedFile.value.name);
          selectedFile.value = null;
          return; // Exit if retry succeeds
        } catch (retryError) {
          console.error('[handleModalConfirm] Retry failed:', retryError);
          // Continue to the error handling below
        }
      }

      // Set appropriate error message
      const errorMessage = processError.message || 'Unknown error processing file';
      uploadError.value = errorMessage;
      store.setError(errorMessage);

      // Clear any potentially corrupted data
      store.clearUsRateSheetData();
    }
  } catch (error) {
    console.error('[handleModalConfirm] Unexpected error:', error);
    uploadError.value = error instanceof Error ? error.message : 'Unexpected error occurred';
    store.setError(uploadError.value);
    store.clearUsRateSheetData();
  } finally {
    store.setLoading(false);
    console.log('[handleModalConfirm] Processing completed.');
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
