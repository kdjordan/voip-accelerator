<template>
  <!-- Main Page Content -->
  <div class="text-white pt-2 w-full">
    <h1 class="mb-2 relative">
      <span class="text-xl md:text-2xl text-accent uppercase rounded-lg px-4 py-2 font-secondary"
        >AZ Rate Sheet Wizard
      </span>
      <!-- Info Icon Button -->
      <button
        @click="openInfoModal"
        class="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors duration-150"
        aria-label="Show A-Z Rate Sheet information"
      >
        <!-- Apply dashboard styling -->
        <div class="p-1 bg-blue-900/40 rounded-lg border border-blue-400/50 animate-pulse-info">
          <InformationCircleIcon class="w-5 h-5 text-blue-400" />
        </div>
      </button>
    </h1>

    <!-- Stats Dashboard - Single Unified Bento Box -->
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
                      ? 'bg-accent animate-status-pulse-success'
                      : 'bg-warning animate-status-pulse-warning',
                  ]"
                ></div>
                <span>{{ isLocallyStored ? 'Data Stored' : 'No Data' }}</span>
              </div>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Total Records</h3>
              <div class="text-xl">{{ store.getTotalRecords }}</div>
            </div>
            <!-- Invalid Rows Status -->
            <InvalidRows
              v-if="store.hasInvalidRows"
              :items="azInvalidRowEntries"
              title="Invalid Rows Not Uploaded"
            />
            <div>
              <div class="flex justify-between items-center mt-2">
                <h3 class="text-gray-400">Destinations with Rate Discrepancies</h3>
                <div class="text-xl">{{ currentDiscrepancyCount }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- File Upload Section -->
        <div v-if="!isLocallyStored" class="mt-6">
          <div
            @dragenter.prevent="
              (e) => {
                isDragging = true;
              }
            "
            @dragleave.prevent="
              (e) => {
                isDragging = false;
              }
            "
            @dragover.prevent
            @drop.prevent="
              (e) => {
                isDragging = false;
                handleFileDrop(e);
              }
            "
            class="relative rounded-lg p-6 h-[120px] flex items-center justify-center transition-colors duration-200"
            :class="[
              isDragging && !isProcessing
                ? 'border-2 border-solid border-accent bg-fbWhite/10'
                : 'border-2 border-dashed border-gray-600',
              !isProcessing ? 'hover:border-accent-hover hover:bg-fbWhite/10' : '',
              isProcessing ? 'cursor-not-allowed' : 'cursor-pointer',
              uploadError ? 'border-2 border-solid border-red-500' : '',
            ]"
          >
            <input
              type="file"
              accept=".csv"
              class="absolute inset-0 opacity-0"
              :class="{ 'pointer-events-none': isProcessing }"
              :disabled="isProcessing"
              @change="handleFileChange"
            />

            <div class="flex flex-col h-full w-full">
              <!-- Normal state -->
              <template v-if="!isRFUploading">
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
                <div class="flex-1 flex flex-col items-center justify-center w-full space-y-2">
                  <ArrowPathIcon class="w-8 h-8 text-accent animate-spin" />
                  <p class="text-sm text-accent">Processing your file...</p>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Rate Sheet Table Section -->
        <div v-if="isLocallyStored" class="mt-6 pt-6">
          <RateSheetTable
            @update:discrepancy-count="updateDiscrepancyCount"
            @data-cleared="handleDataCleared"
          />
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <PreviewModal
      v-if="showPreviewModal"
      :show-modal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :column-options="RF_COLUMN_ROLE_OPTIONS"
      :start-line="startLine"
      :validate-required="true"
      :source="'AZ'"
      @update:mappings="handleMappingUpdate"
      @update:valid="(newValid) => (isValid = newValid)"
      @update:start-line="(newStartLine) => (startLine = newStartLine)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

    <!-- Info Modal -->
    <InfoModal :show-modal="showInfoModal" :type="'az_rate_sheet'" @close="closeInfoModal" />
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue';
  import InfoModal from '@/components/shared/InfoModal.vue';
  import InvalidRows from '@/components/shared/InvalidRows.vue';
  import type { InvalidRowEntry } from '@/types/components/invalid-rows-types';

  import { useAzRateSheetStore } from '@/stores/az-rate-sheet-store';
  import {
    ArrowUpTrayIcon,
    ArrowPathIcon,
    InformationCircleIcon,
  } from '@heroicons/vue/24/outline';
  import RateSheetTable from '@/components/rate-sheet/az/AZRateSheetTable.vue';
  import PreviewModal from '@/components/shared/PreviewModal.vue';
  import { RF_COLUMN_ROLE_OPTIONS } from '@/types/domains/rate-sheet-types';
  import Papa from 'papaparse';
  import type { ParseResult } from 'papaparse';
  import { RateSheetService } from '@/services/az-rate-sheet.service';

  import { memoryMonitor, logReactivityStatus } from '@/utils/memory-test';
  import { detectPlusOneDestinations } from '@/utils/plus-one-detector';

  const store = useAzRateSheetStore();
  const rateSheetService = new RateSheetService();
  const isLocallyStored = computed(() => store.hasStoredData);
  const isDragging = ref(false);
  const isRFUploading = ref(false);
  const isRFRemoving = ref(false);
  const uploadError = ref<string | null>('');
  const rfUploadStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);
  const currentDiscrepancyCount = ref(0);
  const isProcessing = computed(() => isRFUploading.value || isRFRemoving.value);

  currentDiscrepancyCount.value = store.getDiscrepancyCount;

  function updateDiscrepancyCount(count: number) {
    currentDiscrepancyCount.value = count;
  }

  function handleDataCleared() {
    currentDiscrepancyCount.value = 0;
  }

  // Preview Modal state
  const showPreviewModal = ref(false);
  const previewData = ref<string[][]>([]);
  const columns = ref<string[]>([]);
  const startLine = ref(1);
  const columnMappings = ref<Record<string, string>>({});
  const isValid = ref(false);
  const selectedFile = ref<File | null>(null);

  // Info Modal state
  const showInfoModal = ref(false);

  const azInvalidRowEntries = computed((): InvalidRowEntry[] => {
    if (!store.invalidRows) return [];
    return store.invalidRows.map((row: any) => ({
      rowNumber: row.rowNumber || 'N/A',
      name: row.destinationName || 'N/A',
      identifier: row.prefix || 'N/A',
      problemValue: row.invalidRate || 'N/A',
    }));
  });

  onMounted(() => {
    if (!store.hasStoredData) {
      console.log('No rate sheet data found in localStorage');
    } else {
      console.log('Rate sheet data loaded from localStorage');
      logReactivityStatus('Mounted - groupedData', store.groupedData);
      logReactivityStatus('Mounted - originalData', store.originalData);
    }
  });

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    uploadError.value = '';
    const file = input.files[0];
    processFile(file);
  }

  async function handleFileDrop(event: DragEvent) {
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
    isRFUploading.value = true;

    try {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        preview: 100,
        complete: (results: ParseResult<string[]>) => {
          console.log('[AZ RATE SHEET] Testing +1 detection with real file...');
          const detection = detectPlusOneDestinations(results.data);
          console.log('[AZ RATE SHEET] Detection results:', detection);

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
          isRFUploading.value = false;
        },
      });
    } catch (error) {
      console.error('Error handling file:', error);
      uploadError.value =
        'Failed to process file: ' + (error instanceof Error ? error.message : String(error));
      isRFUploading.value = false;
    }
  }

  async function handleModalConfirm(mappings: Record<string, string>) {
    showPreviewModal.value = false;
    const file = selectedFile.value;
    if (!file) return;

    isRFUploading.value = true;
    uploadError.value = null;

    memoryMonitor.takeSnapshot('Before File Processing');

    try {
      const columnMapping = {
        name: Number(Object.entries(mappings).find(([_, value]) => value === 'name')?.[0] ?? -1),
        prefix: Number(
          Object.entries(mappings).find(([_, value]) => value === 'prefix')?.[0] ?? -1
        ),
        rate: Number(Object.entries(mappings).find(([_, value]) => value === 'rate')?.[0] ?? -1),
        minDuration: Number(
          Object.entries(mappings).find(([_, value]) => value === 'minDuration')?.[0] ?? -1
        ),
        increments: Number(
          Object.entries(mappings).find(([_, value]) => value === 'increments')?.[0] ?? -1
        ),
      };

      if (columnMapping.name < 0 || columnMapping.prefix < 0 || columnMapping.rate < 0) {
        throw new Error('Required column mappings (name, prefix, rate) not found');
      }

      console.log('Processing file with column mapping:', columnMapping);

      let attempts = 0;
      const maxAttempts = 3;
      let lastError;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          const result = await rateSheetService.processFile(file, columnMapping, startLine.value);
          store.setOptionalFields(mappings);
          console.log(`File processed successfully on attempt ${attempts}`);

          memoryMonitor.takeSnapshot('After File Processing');

          logReactivityStatus('After Processing - groupedData', store.groupedData);
          logReactivityStatus('After Processing - originalData', store.originalData);

          memoryMonitor.compareSnapshots('Before File Processing', 'After File Processing');
          memoryMonitor.logSummary();

          rfUploadStatus.value = { type: 'success', message: 'Rate sheet processed successfully' };
          return;
        } catch (error) {
          console.error(`Attempt ${attempts} failed:`, error);
          lastError = error;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      throw lastError || new Error('Failed to process rate sheet after multiple attempts');
    } catch (error) {
      console.error('Failed to process rate sheet:', error);
      uploadError.value = error instanceof Error ? error.message : 'Failed to process rate sheet';
      rfUploadStatus.value = {
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to process rate sheet',
      };
    } finally {
      isRFUploading.value = false;
      selectedFile.value = null;
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    selectedFile.value = null;
    isRFUploading.value = false;
  }

  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }

  function openInfoModal() {
    showInfoModal.value = true;
  }

  function closeInfoModal() {
    showInfoModal.value = false;
  }
</script>
