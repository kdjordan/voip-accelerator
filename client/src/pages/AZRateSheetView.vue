<template>
  <!-- Main Page Content (No longer blocked) -->
  <div class="min-h-screen text-white pt-2 w-full">
    
    <!-- Service Expiry Banner -->
    <ServiceExpiryBanner 
      v-bind="bannerState"
      @upgrade-clicked="handleUpgradeFromExpiry"
    />
    
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

          <!-- Discrepancy Count -->
        </div>

        <!-- After the Stats Grid, before the File Upload Section -->
        <div
          v-if="store.hasInvalidRows"
          class="space-y-6 mt-6 border-t border-gray-700/50 pt-6 hidden"
        >
          <!-- Invalid Rows Section - This section is now hidden and replaced by the one above -->
          <div class="bg-gray-900/30 rounded-lg overflow-hidden">
            <div
              @click="toggleInvalidRowsDetails"
              class="p-4 w-full hover:bg-red-400/20 transition-colors cursor-pointer bg-red-900/20 border-b border-red-500/30"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium text-red-400">Invalid Rows Not Uploaded</span>
                <ChevronDownIcon
                  :class="{ 'transform rotate-180': showInvalidRowsDetails }"
                  class="w-4 h-4 transition-transform text-red-400"
                />
              </div>
            </div>

            <!-- Invalid Rows Content -->
            <div v-if="showInvalidRowsDetails" class="p-4 bg-gray-900/50">
              <table class="w-full min-w-full border-separate border-spacing-0">
                <thead class="bg-gray-800/80">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-300">ROW</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-300">NAME</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-300">PREFIX</th>
                    <th class="px-4 py-2 text-right text-xs font-medium text-gray-300">RATE</th>
                  </tr>
                </thead>
                <tbody class="bg-gray-900/80">
                  <tr
                    v-for="(row, index) in store.invalidRows"
                    :key="index + row.prefix"
                    class="hover:bg-gray-800/50"
                  >
                    <td class="px-4 py-2 text-sm text-gray-300 border-t border-gray-800/50">
                      {{ row.rowNumber }}
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-300 border-t border-gray-800/50">
                      {{ row.destinationName }}
                    </td>
                    <td
                      class="px-4 py-2 text-sm text-gray-300 font-mono border-t border-gray-800/50"
                    >
                      {{ row.prefix }}
                    </td>
                    <td
                      class="px-4 py-2 text-sm text-red-400 text-right font-mono border-t border-gray-800/50"
                    >
                      {{ row.invalidRate }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- File Upload Section -->
        <div v-if="!isLocallyStored" class="mt-6">
          <div
            @dragenter.prevent="
              (e) => {
                console.log('dragenter event');
                isDragging = true;
              }
            "
            @dragleave.prevent="
              (e) => {
                console.log('dragleave event');
                isDragging = false;
              }
            "
            @dragover.prevent="
              (e) => {
                console.log('dragover event');
              }
            "
            @drop.prevent="
              (e) => {
                console.log('drop event');
                isDragging = false;
                handleFileDrop(e);
              }
            "
            class="relative rounded-lg p-6 h-[120px] flex items-center justify-center transition-colors duration-200"
            :class="[
              // Dragging state (only when not processing)
              isDragging && !isProcessing
                ? 'border-2 border-solid border-accent bg-fbWhite/10'
                : 'border-2 border-dashed border-gray-600', // Default border

              // Hover state (only when not processing)
              !isProcessing ? 'hover:border-accent-hover hover:bg-fbWhite/10' : '',

              // Cursor state
              isProcessing ? 'cursor-not-allowed' : 'cursor-pointer',

              // Error state border
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

        <!-- Rate Sheet Table Section - Moved inside this bento box -->
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

    <!-- Info Modal (Added) -->
    <InfoModal :show-modal="showInfoModal" :type="'az_rate_sheet'" @close="closeInfoModal" />
    
    <!-- Plan Selector Modal -->
    <PlanSelectorModal
      v-if="showPlanSelectorModal"
      :is-trial-expired="true"
      @close="showPlanSelectorModal = false"
      @select-plan="handlePlanSelectorSelection"
    />
    
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue';
  import InfoModal from '@/components/shared/InfoModal.vue'; // Import InfoModal
  import ServiceExpiryBanner from '@/components/shared/ServiceExpiryBanner.vue';
  import PlanSelectorModal from '@/components/billing/PlanSelectorModal.vue';
  import InvalidRows from '@/components/shared/InvalidRows.vue';
  import type { InvalidRowEntry } from '@/types/components/invalid-rows-types';
  import type { SubscriptionTier } from '@/types/user-types';
  import { useBilling } from '@/composables/useBilling';

  import { useAzRateSheetStore } from '@/stores/az-rate-sheet-store';
  import { useUserStore } from '@/stores/user-store'; // Import user store
  import {
    ArrowUpTrayIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowPathIcon,
    InformationCircleIcon,
  } from '@heroicons/vue/24/outline';
  import RateSheetTable from '@/components/rate-sheet/az/AZRateSheetTable.vue';
  import PreviewModal from '@/components/shared/PreviewModal.vue';
  import { RF_COLUMN_ROLE_OPTIONS } from '@/types/domains/rate-sheet-types';
  import Papa from 'papaparse';
    import type { ParseResult } from 'papaparse';
  import { RateSheetService } from '@/services/az-rate-sheet.service';

  // Import memory monitoring utilities for Phase 1 testing
  import { memoryMonitor, logReactivityStatus } from '@/utils/memory-test';
  import { detectPlusOneDestinations } from '@/utils/plus-one-detector';

  const store = useAzRateSheetStore();
  const userStore = useUserStore(); // Initialize user store
  const rateSheetService = new RateSheetService();
  const isLocallyStored = computed(() => store.hasStoredData);
  const isDragging = ref(false);
  const isRFUploading = ref(false);
  const isRFRemoving = ref(false);
  const uploadError = ref<string | null>('');
  const rfUploadStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);
  const currentDiscrepancyCount = ref(0);
  const isProcessing = computed(() => isRFUploading.value || isRFRemoving.value);

  // Initialize the current discrepancy count
  currentDiscrepancyCount.value = store.getDiscrepancyCount;

  function updateDiscrepancyCount(count: number) {
    currentDiscrepancyCount.value = count;
  }

  // Handle data clearing event from the table component
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

  // Invalid Rows state
  const showInvalidRowsDetails = ref(false);

  // Info Modal state
  const showInfoModal = ref(false);
  const showPlanSelectorModal = ref(false);

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
    // Check if data is already stored in localStorage via the store
    if (!store.hasStoredData) {
      console.log('No rate sheet data found in localStorage');
    } else {
      console.log('Rate sheet data loaded from localStorage');
      // Log reactivity status for Phase 1 verification
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
        preview: 100, // Parse enough lines to detect +1 destinations
        complete: (results: ParseResult<string[]>) => {
          // Detect +1 destinations
          console.log('🧪 [AZ RATE SHEET] Testing +1 detection with real file...');
          const detection = detectPlusOneDestinations(results.data);
          console.log('📊 [AZ RATE SHEET] Detection results:', detection);
          
          if (detection.hasPlusOne && detection.suggestedAction === 'show-modal') {
            console.log('🚨 [AZ RATE SHEET] This file contains +1 destinations - NEED TO ADD MODAL HERE!');
            console.log('📋 [AZ RATE SHEET] Breakdown:', detection.plusOneBreakdown);
            console.log('💡 [AZ RATE SHEET] Suggested action:', detection.suggestedAction);
            // TODO: Add modal integration here
          } else {
            console.log('✅ [AZ RATE SHEET] No +1 destinations detected - proceeding normally');
          }
          
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

    // Take memory snapshot before processing
    memoryMonitor.takeSnapshot('Before File Processing');

    try {
      // Convert the new mappings format to the expected columnMapping format
      const columnMapping = {
        name: Number(Object.entries(mappings).find(([_, value]) => value === 'name')?.[0] ?? -1),
        prefix: Number(
          Object.entries(mappings).find(([_, value]) => value === 'prefix')?.[0] ?? -1
        ),
        rate: Number(Object.entries(mappings).find(([_, value]) => value === 'rate')?.[0] ?? -1),
        // effective is no longer mapped from CSV, it's auto-generated
        minDuration: Number(
          Object.entries(mappings).find(([_, value]) => value === 'minDuration')?.[0] ?? -1
        ),
        increments: Number(
          Object.entries(mappings).find(([_, value]) => value === 'increments')?.[0] ?? -1
        ),
      };

      // Validate required mappings
      if (columnMapping.name < 0 || columnMapping.prefix < 0 || columnMapping.rate < 0) {
        throw new Error('Required column mappings (name, prefix, rate) not found');
      }

      console.log('Processing file with column mapping:', columnMapping);

      // Attempt to process the file with retries if needed
      let attempts = 0;
      const maxAttempts = 3;
      let lastError;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          const result = await rateSheetService.processFile(file, columnMapping, startLine.value);
          store.setOptionalFields(mappings);
          console.log(`File processed successfully on attempt ${attempts}`);

          // Take memory snapshot after processing
          memoryMonitor.takeSnapshot('After File Processing');

          // Log reactivity status for Phase 1 verification
          logReactivityStatus('After Processing - groupedData', store.groupedData);
          logReactivityStatus('After Processing - originalData', store.originalData);

          // Compare memory usage
          memoryMonitor.compareSnapshots('Before File Processing', 'After File Processing');
          memoryMonitor.logSummary();

          rfUploadStatus.value = { type: 'success', message: 'Rate sheet processed successfully' };
          userStore.incrementUploadsToday(); // Increment upload count
          return;
        } catch (error) {
          console.error(`Attempt ${attempts} failed:`, error);
          lastError = error;
          // Wait a bit before retrying
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      // If we get here, all attempts failed
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

  function toggleInvalidRowsDetails() {
    showInvalidRowsDetails.value = !showInvalidRowsDetails.value;
  }

  // Function to handle opening the information modal
  function openInfoModal() {
    showInfoModal.value = true;
  }

  // Banner state from unified store logic
  const bannerState = computed(() => userStore.getServiceExpiryBanner);
  
  // Handler for upgrade clicked from expiry banner
  function handleUpgradeFromExpiry() {
    showPlanSelectorModal.value = true;
  }
  
  // Handler for plan selection from PlanSelectorModal  
  async function handlePlanSelectorSelection(tier: SubscriptionTier) {
    showPlanSelectorModal.value = false;
    
    try {
      const { createCheckoutSession } = useBilling();
      
      // Get the correct price ID based on selected tier
      const priceIds = {
        optimizer: import.meta.env.VITE_STRIPE_PRICE_OPTIMIZER,
        accelerator: import.meta.env.VITE_STRIPE_PRICE_ACCELERATOR
      };
      
      const priceId = priceIds[tier];
      
      if (!priceId) {
        throw new Error(`Price ID not found for ${tier} plan`);
      }
      
      console.log(`🚀 Creating checkout session for ${tier} upgrade`);
      await createCheckoutSession(priceId, tier);
      
    } catch (error: any) {
      console.error('Upgrade checkout error:', error);
      alert(`Failed to start checkout: ${error.message}`);
      // Reopen modal on error
      showPlanSelectorModal.value = true;
    }
  }

  // Function to handle closing the information modal
  function closeInfoModal() {
    showInfoModal.value = false;
  }
</script>
