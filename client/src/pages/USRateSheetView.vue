<template>
  <!-- Main Page Content -->
  <div class="text-white pt-2 w-full">
    <h1 class="mb-2 relative">
      <span class="text-xl md:text-2xl text-accent uppercase rounded-lg px-4 py-2 font-secondary"
        >US Rate Sheet Wizard
      </span>
      <!-- Info Icon Button -->
      <button
        @click="openInfoModal"
        class="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors duration-150"
        aria-label="Show usage information"
      >
        <!-- Apply dashboard styling -->
        <div class="p-1 bg-blue-900/40 rounded-lg border border-blue-400/50 animate-pulse-info">
          <InformationCircleIcon class="w-5 h-5 text-blue-400" />
        </div>
      </button>
    </h1>

    <!-- Stats Dashboard -->
    <div class="bg-gray-800 rounded-lg overflow-hidden">
      <!-- Header Section -->
      <div class="p-6 border-b border-gray-700/50">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 gap-4 mb-6">
          <!-- Storage Status -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Storage Status</h3>
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="[
                    isLocallyStored
                      ? 'bg-accent animate-status-pulse-success'
                      : 'bg-warning animate-status-pulse-warning',
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
          <!-- Invalid Rows Section -->
          <InvalidRows
            v-if="store.hasInvalidRateSheetRows"
            :items="usInvalidRowEntries"
            title="Invalid Rows Not Uploaded"
          />

          <!-- Effective Date - Integrated Picker -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Effective Date</h3>
              <!-- Right side: Date Picker -->
              <div v-if="isLocallyStored" class="flex flex-col items-end gap-1">
                <input
                  type="date"
                  id="effective-date"
                  v-model="selectedEffectiveDate"
                  class="bg-gray-800 border border-gray-700 rounded text-sm px-3 py-2 text-white w-full"
                  :min="minDate"
                />
                <BaseButton
                  variant="primary"
                  size="small"
                  :disabled="!isDateChanged || store.isLoading"
                  :icon="ArrowRightIcon"
                  @click="handleApplyEffectiveDate"
                  class="whitespace-nowrap"
                >
                  Apply
                </BaseButton>
              </div>
              <div v-else class="text-sm text-gray-500 italic">Upload data first</div>
            </div>
          </div>
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
              isDragging && !isProcessing && !showPreviewModal
                ? 'border-2 border-solid border-accent bg-fbWhite/10'
                : 'border-2 border-dashed border-gray-600',
              !isProcessing && !showPreviewModal
                ? 'hover:border-accent-hover hover:bg-fbWhite/10'
                : '',
              isProcessing
                ? 'cursor-not-allowed'
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
            <div class="flex flex-col h-full w-full">
              <!-- Normal state -->
              <template v-if="!isProcessing">
                <div class="flex items-center justify-center w-full h-full">
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
                      <template v-else>
                        <span>DRAG & DROP to upload or CLICK to select file</span>
                      </template>
                    </p>
                    <p v-if="uploadError" class="mt-1 text-xs text-red-400">
                      Please try again with a CSV file
                    </p>
                  </div>
                </div>
              </template>

              <!-- Uploading state -->
              <template v-else>
                <RealTimeProgressIndicator
                  :is-uploading="store.getUploadProgress.isUploading"
                  :progress="store.getUploadProgress.progress"
                  :stage="store.getUploadProgress.stage"
                  :rows-processed="store.getUploadProgress.rowsProcessed"
                  :total-rows="store.getUploadProgress.totalRows"
                />
              </template>
            </div>
          </div>
        </div>

        <!-- Data Table Section -->
        <div v-if="isLocallyStored" class="mt-6">
          <USRateSheetTable />
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

    <!-- Info Modal -->
    <InfoModal :show-modal="showInfoModal" :type="'us_rate_sheet'" @close="closeInfoModal" />
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, watch } from 'vue';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import InfoModal from '@/components/shared/InfoModal.vue';
  import InvalidRows from '@/components/shared/InvalidRows.vue';
  import type { InvalidRowEntry } from '@/types/components/invalid-rows-types';

  import {
    ArrowUpTrayIcon,
    ArrowRightIcon,
    InformationCircleIcon,
  } from '@heroicons/vue/24/outline';
  import USRateSheetTable from '@/components/rate-sheet/us/USRateSheetTable.vue';
  import PreviewModal from '@/components/shared/PreviewModal.vue';
  import RealTimeProgressIndicator from '@/components/shared/RealTimeProgressIndicator.vue';
  import { US_COLUMN_ROLE_OPTIONS } from '@/types/domains/us-types';
  import Papa from 'papaparse';
  import type { ParseResult } from 'papaparse';
  import { USRateSheetService } from '@/services/us-rate-sheet.service';
  import { USColumnRole } from '@/types/domains/us-types';
  import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
  import { useDragDrop } from '@/composables/useDragDrop';

  const store = useUsRateSheetStore();
  const usRateSheetService = new USRateSheetService();
  const isLocallyStored = computed(() => store.getHasUsRateSheetData);
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

  // Progress tracking
  const uploadingFileRowCount = ref(0);

  // Effective Date State
  const selectedEffectiveDate = ref<string>('');
  const minDate = computed(() => new Date().toISOString().split('T')[0]);

  const isDateChanged = computed(() => {
    const currentDate = store.getCurrentEffectiveDate;
    const selectedDate = selectedEffectiveDate.value;
    const isValidDateString = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate);
    return isValidDateString && selectedDate !== currentDate;
  });

  watch(
    () => store.getCurrentEffectiveDate,
    (newDate) => {
      if (newDate && newDate !== selectedEffectiveDate.value) {
        selectedEffectiveDate.value = newDate;
      }
    },
    { immediate: true }
  );

  // Drag and Drop Setup
  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, clearError } =
    useDragDrop({
      acceptedExtensions: ['.csv'],
      onDropCallback: async (file: File) => {
        uploadError.value = null;
        clearError();
        processFile(file);
      },
      onError: (message: string) => {
        uploadError.value = message;
        store.setError(message);
      },
    });

  onMounted(async () => {
    console.log('[USRateSheetView] Skipping automatic data loading to prevent partial data display');
    store.setLoading(false);
  });

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    uploadError.value = null;
    clearError();
    const file = input.files[0];
    processFile(file);
  }

  function processFile(file: File) {
    selectedFile.value = file;

    try {
      Papa.parse(file, {
        preview: 20,
        skipEmptyLines: true,
        complete: (results: ParseResult<string[]>) => {
          if (results.data.length === 0) {
            const emptyErrorMessage = 'CSV file appears to be empty or invalid.';
            uploadError.value = emptyErrorMessage;
            store.setError(emptyErrorMessage);
            showPreviewModal.value = false;
            return;
          }
          columns.value = results.data[0].map((h) => h?.trim() || '');
          previewData.value = results.data
            .slice(0, 11)
            .map((row) => (Array.isArray(row) ? row.map((cell) => cell?.trim() || '') : []));
          startLine.value = 1;
          showPreviewModal.value = true;
        },
        error: (error) => {
          const parseErrorMessage = 'Failed to parse CSV file: ' + error.message;
          uploadError.value = parseErrorMessage;
          store.setError(parseErrorMessage);
          showPreviewModal.value = false;
        },
      });
    } catch (error) {
      const processErrorMessage =
        'Failed to process file: ' + (error instanceof Error ? error.message : String(error));
      uploadError.value = processErrorMessage;
      store.setError(processErrorMessage);
      showPreviewModal.value = false;
    }
  }

  // Info Modal State
  const showInfoModal = ref(false);

  async function handleModalConfirm(
    mappings: Record<string, string>,
    indeterminateDefinition?: string,
    effectiveDate?: string
  ) {
    if (!selectedFile.value) {
      return;
    }

    store.setLoading(true);
    store.setError(null);
    store.setUploadInProgress(true);
    uploadError.value = null;
    rfUploadStatus.value = null;

    try {
      const fileToProcess = selectedFile.value;

      // Count rows for progress tracking
      let rowCount = 0;
      await new Promise<void>((resolve) => {
        Papa.parse(fileToProcess, {
          step: (results) => {
            rowCount++;
          },
          complete: () => {
            uploadingFileRowCount.value = Math.max(0, rowCount - startLine.value);
            resolve();
          },
          skipEmptyLines: true,
        });
      });

      showPreviewModal.value = false;

      store.startUploadProgress(uploadingFileRowCount.value);

      const mappedColumns = Object.entries(mappings).reduce(
        (acc, [indexStr, role]) => {
          if (role) {
            const index = parseInt(indexStr, 10);
            switch (role) {
              case USColumnRole.NPANXX:
                acc.npanxx = index;
                break;
              case USColumnRole.NPA:
                acc.npa = index;
                break;
              case USColumnRole.NXX:
                acc.nxx = index;
                break;
              case USColumnRole.INTERSTATE:
                acc.interstate = index;
                break;
              case USColumnRole.INTRASTATE:
                acc.intrastate = index;
                break;
              case USColumnRole.INDETERMINATE:
                acc.indeterminate = index;
                break;
            }
          }
          return acc;
        },
        {
          npanxx: -1,
          npa: -1,
          nxx: -1,
          interstate: -1,
          intrastate: -1,
          indeterminate: -1,
        }
      );

      if (
        mappedColumns.interstate === -1 ||
        mappedColumns.intrastate === -1 ||
        (mappedColumns.npanxx === -1 && (mappedColumns.npa === -1 || mappedColumns.nxx === -1))
      ) {
        throw new Error(
          'Required columns (NPANXX/NPA+NXX, Interstate, Intrastate) are not mapped.'
        );
      }

      const processedData = await usRateSheetService.processFile(
        fileToProcess,
        mappedColumns,
        startLine.value,
        indeterminateDefinition,
        effectiveDate,
        (progress, stage, rowsProcessed, totalRows) => {
          store.setUploadProgress(progress, stage, rowsProcessed, totalRows);
        }
      );

      await store.handleUploadSuccess(processedData);

      store.completeUploadProgress();

      store.setUploadInProgress(false);
      selectedFile.value = null;
      uploadingFileRowCount.value = 0;
      rfUploadStatus.value = { type: 'success', message: 'File processed successfully!' };
    } catch (error: any) {
      uploadError.value = `Error processing file: ${error.message || 'Unknown error'}`;
      await store.clearUsRateSheetData();
      store.resetUploadProgress();
      selectedFile.value = null;
      uploadingFileRowCount.value = 0;
      rfUploadStatus.value = { type: 'error', message: 'File processing failed.' };
    } finally {
      store.setLoading(false);
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    selectedFile.value = null;
    uploadingFileRowCount.value = 0;
    store.resetUploadProgress();
  }

  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }

  async function handleApplyEffectiveDate() {
    if (!selectedEffectiveDate.value || !isDateChanged.value) {
      return;
    }
    await store.updateEffectiveDate(selectedEffectiveDate.value);
  }

  function openInfoModal() {
    showInfoModal.value = true;
  }

  function closeInfoModal() {
    showInfoModal.value = false;
  }

  const usInvalidRowEntries = computed((): InvalidRowEntry[] => {
    if (!store.invalidRateSheetRows) return [];
    return store.invalidRateSheetRows.map((row: any) => {
      let problemValue = 'N/A';

      if (typeof row.interRate === 'string' && isNaN(parseFloat(row.interRate)))
        problemValue = row.interRate;
      else if (typeof row.intraRate === 'string' && isNaN(parseFloat(row.intraRate)))
        problemValue = row.intraRate;
      else if (typeof row.indetermRate === 'string' && isNaN(parseFloat(row.indetermRate)))
        problemValue = row.indetermRate;
      else if (row.interRate !== undefined && row.interRate !== null)
        problemValue = String(row.interRate);
      else if (row.intraRate !== undefined && row.intraRate !== null)
        problemValue = String(row.intraRate);
      else if (row.indetermRate !== undefined && row.indetermRate !== null)
        problemValue = String(row.indetermRate);

      return {
        rowNumber: row.rowIndex,
        name: row.reason || 'No reason provided',
        identifier: row.npanxx || 'N/A',
        problemValue: problemValue,
      };
    });
  });
</script>
