<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="mb-8">
      <span class="text-sizeXl tracking-wide text-accent uppercase px-4 py-2 font-secondary"> Rate Sheet Wizard </span>
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
                <span>{{ isLocallyStored ? 'Data Stored' : 'No Data' }}</span>
              </div>
            </div>
          </div>
          <!-- Invalid Rows Status -->
          <div v-if="store.hasInvalidRows">
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Invalid Rows Processed</h3>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full bg-accent animate-status-pulse-success"></div>
                <span class="text-2xl font-bold">{{ store.getGroupedInvalidRows.length }}</span>
              </div>
            </div>
          </div>
          <!-- Discrepancy Count -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Destinations with Rate Discrepancies</h3>
              <div class="text-2xl font-bold">{{ store.getDiscrepancyCount }}</div>
            </div>
          </div>
        </div>

        <!-- After the Stats Grid, before the File Upload Section -->
        <div
          v-if="store.hasInvalidRows"
          class="space-y-6 mt-6 border-t border-gray-700/50 pt-6"
        >
          <!-- Invalid Rows Section -->
          <div class="bg-gray-900/30 rounded-lg overflow-hidden">
            <div
              @click="toggleInvalidRowsDetails"
              class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium">Invalid Rows</span>
                <ChevronDownIcon
                  :class="{ 'transform rotate-180': showInvalidRowsDetails }"
                  class="w-4 h-4 transition-transform"
                />
              </div>
            </div>

            <!-- Invalid Rows Content -->
            <div
              v-if="showInvalidRowsDetails"
              class="p-4 space-y-4"
            >
              <div class="space-y-2">
                <div
                  v-for="group in store.getGroupedInvalidRows"
                  :key="group.destinationName"
                  @click="toggleExpandInvalidRow(group.destinationName)"
                  class="bg-gray-900/80 p-4 rounded-lg w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
                >
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{{ group.destinationName }}</span>
                    <div class="flex items-center space-x-4">
                      <div class="flex items-center space-x-2 px-2 py-1 rounded">
                        <span class="text-sm text-gray-400">{{ group.count }} invalid rates</span>
                        <ChevronDownIcon
                          :class="{ 'transform rotate-180': expandedInvalidRows.includes(group.destinationName) }"
                          class="w-4 h-4 transition-transform"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Expanded invalid rates list -->
                  <div
                    v-if="expandedInvalidRows.includes(group.destinationName)"
                    class="mt-3 pl-4"
                  >
                    <div class="space-y-2">
                      <div
                        v-for="row in group.rows"
                        :key="row.prefix"
                        class="flex justify-between items-center bg-gray-800/50 px-3 py-2 rounded"
                      >
                        <span class="text-gray-300">{{ row.prefix }}</span>
                        <span class="text-red-400">{{ row.invalidRate }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- File Upload Section -->
        <div
          v-if="!isLocallyStored"
          class="mt-6"
        >
          <div
            @dragenter.prevent="handleDragEnter"
            @dragleave.prevent="handleDragLeave"
            @dragover.prevent
            @drop.prevent="handleRfFileDrop"
            class="border-2 border-dashed border-gray-600 p-8 text-center relative"
            :class="[
              isDragging ? 'border-accent bg-fbWhite/10' : '',
              rfUploadStatus?.type === 'error' ? 'border-red-500' : '',
              isRFUploading ? 'border-accent/20 animate-upload-pulse' : 'hover:border-accent-hover hover:bg-fbWhite/10',
            ]"
          >
            <input
              type="file"
              accept=".csv"
              class="absolute inset-0 h-full opacity-0 cursor-pointer"
              :disabled="isProcessing"
              @change="handleFileChange"
            />
            <div class="text-center">
              <ArrowUpTrayIcon
                class="w-12 h-12 text-accent mx-auto border border-accent/50 rounded-full p-2 bg-accent/10"
                :class="uploadError ? 'text-red-500' : 'text-accent'"
              />
              <p class="mt-2 text-base text-foreground">
                <template v-if="uploadError">
                  <span class="text-red-400">{{ uploadError }}</span>
                </template>
                <template v-else-if="isRFUploading">
                  <span class="text-accent">Processing your file...</span>
                </template>
                <template v-else>
                  <span class="text-accent">DRAG & DROP to upload or CLICK to select file</span>
                </template>
              </p>
              <p
                v-if="uploadError"
                class="mt-1 text-xs text-red-400"
              >
                Please try again with a CSV file
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div
        v-if="isLocallyStored"
        class="mt-8"
      >
        <RateSheetTable />
      </div>
    </div>

    <!-- Preview Modal -->
    <PreviewModal2
      v-if="showPreviewModal"
      :show-modal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :column-options="RF_COLUMN_ROLE_OPTIONS"
      :start-line="startLine"
      :validate-required="true"
      @update:mappings="handleMappingUpdate"
      @update:valid="newValid => (isValid = newValid)"
      @update:start-line="newStartLine => (startLine = newStartLine)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';

  import { useRateSheetStore } from '@/stores/rate-sheet-store';
  import { ArrowUpTrayIcon, TrashIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
  import RateSheetTable from '@/components/rate-sheet/RateSheetTable.vue';
  import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
  import { RF_COLUMN_ROLE_OPTIONS } from '@/types/domains/rate-sheet-types';
  import Papa from 'papaparse';
  import type { ParseResult } from 'papaparse';
  import { RateSheetService } from '@/services/rate-sheet.service';

  const store = useRateSheetStore();
  const rateSheetService = new RateSheetService();
  const isLocallyStored = computed(() => store.isLocallyStored);
  const isDragging = ref(false);
  const isProcessing = ref(false);
  const uploadError = ref<string | null>(null);
  const rfUploadStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);
  const isRFUploading = ref(false);

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
  const expandedInvalidRows = ref<string[]>([]);

  async function handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      uploadError.value = 'Only CSV files are accepted';
      return;
    }

    selectedFile.value = file;

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: ParseResult<string[]>) => {
        columns.value = results.data[0].map(h => h.trim());
        previewData.value = results.data
          .slice(0, 10)
          .map(row => (Array.isArray(row) ? row.map(cell => cell?.trim() || '') : []));
        startLine.value = 1;
        showPreviewModal.value = true;
      },
    });
  }

  async function handleRfFileDrop(event: DragEvent) {
    event.preventDefault();
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (!file) return;

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      uploadError.value = 'Only CSV files are accepted';
      return;
    }

    await handleFileChange({ target: { files: [file] } } as unknown as Event);
  }

  async function handleModalConfirm(mappings: Record<string, string>) {
    showPreviewModal.value = false;
    const file = selectedFile.value;
    if (!file) return;

    isRFUploading.value = true;

    try {
      // Convert the new mappings format to the expected columnMapping format
      const columnMapping = {
        name: Number(Object.entries(mappings).find(([_, value]) => value === 'name')?.[0] ?? -1),
        prefix: Number(Object.entries(mappings).find(([_, value]) => value === 'prefix')?.[0] ?? -1),
        rate: Number(Object.entries(mappings).find(([_, value]) => value === 'rate')?.[0] ?? -1),
        effective: Number(Object.entries(mappings).find(([_, value]) => value === 'effective')?.[0] ?? -1),
        minDuration: Number(Object.entries(mappings).find(([_, value]) => value === 'minDuration')?.[0] ?? -1),
        increments: Number(Object.entries(mappings).find(([_, value]) => value === 'increments')?.[0] ?? -1),
      };

      const result = await rateSheetService.processFile(file, columnMapping, startLine.value);
      store.setOptionalFields(mappings);
      rfUploadStatus.value = { type: 'success', message: 'Rate sheet processed successfully' };
    } catch (error) {
      console.error('Failed to process rate sheet:', error);
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
  }

  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    isDragging.value = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging.value = false;
  }

  function toggleInvalidRowsDetails() {
    showInvalidRowsDetails.value = !showInvalidRowsDetails.value;
  }

  function toggleExpandInvalidRow(destinationName: string) {
    const index = expandedInvalidRows.value.indexOf(destinationName);
    if (index === -1) {
      expandedInvalidRows.value.push(destinationName);
    } else {
      expandedInvalidRows.value.splice(index, 1);
    }
  }
</script>
