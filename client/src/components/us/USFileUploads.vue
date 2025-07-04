<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- Upload Zones Box -->
    <div class="overflow-x-auto">
      <div class="bg-gray-800 rounded-b-lg p-6">
        <div class="pb-4 mb-6">
          <!-- Change from grid to flex layout -->
          <div class="flex w-full gap-6">
            <!-- Left Side: First Upload Zone and Single File Report -->
            <div class="w-1/2 pr-6">
              <!-- Conditionally render Drop Zone or Code Summary -->
              <template v-if="usStore.isComponentDisabled('us1')">
                <USCodeSummary componentId="us1" @remove-file="handleRemoveFile" />
              </template>
              <template v-else>
                <!-- Your Rates Upload Zone (Drop Zone Content) -->
                <div
                  class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center"
                  :class="[
                    isDraggingUs1
                      ? 'border-accent bg-fbWhite/10 border-solid'
                      : !usStore.isComponentDisabled('us1') /* Keep hover state for dropzone */
                        ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600'
                        : '',
                    usStore.isComponentUploading('us1')
                      ? 'cursor-not-allowed'
                      : usStore.isComponentUploading('us2')
                        ? 'opacity-50 cursor-not-allowed border-gray-600' /* Dim if other is uploading */
                        : !usStore.isComponentDisabled('us1')
                          ? 'cursor-pointer'
                          : '',
                    /* Removed isComponentDisabled check for background as it's handled by v-if now */
                    uploadError.us1 ? 'border-red-500 border-solid border-2' : '',
                  ]"
                  @dragenter.prevent="handleDragEnterUs1"
                  @dragleave.prevent="handleDragLeaveUs1"
                  @dragover.prevent="handleDragOverUs1"
                  @drop.prevent="handleDropUs1"
                >
                  <!-- File Input -->
                  <input
                    type="file"
                    accept=".csv"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    :disabled="
                      usStore.isComponentUploading('us1') ||
                      usStore.isComponentUploading('us2') ||
                      usStore.isComponentDisabled(
                        'us1'
                      ) /* Should not be reachable if disabled, but for safety */
                    "
                    @change="(e) => handleFileChange(e, 'us1')"
                  />

                  <div class="flex flex-col items-center justify-center w-full h-full text-center">
                    <!-- Uploading State -->
                    <template v-if="usStore.isComponentUploading('us1')">
                      <div
                        class="flex-1 flex flex-col items-center justify-center w-full space-y-2"
                      >
                        <ArrowPathIcon class="w-8 h-8 text-accent animate-spin" />
                        <p class="text-sm text-accent">Processing your file...</p>
                      </div>
                    </template>

                    <!-- Waiting State (if other is uploading) -->
                    <template
                      v-else-if="
                        !usStore.isComponentDisabled('us1') && usStore.isComponentUploading('us2')
                      "
                    >
                      <div class="flex-1 flex items-center justify-center w-full">
                        <p class="text-sizeMd text-accent/80">
                          Please wait for the other file to finish processing...
                        </p>
                      </div>
                    </template>

                    <!-- Default/Empty State -->
                    <template v-else>
                      <!-- Error notification -->
                      <div
                        v-if="uploadError.us1"
                        class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full max-w-xs mx-auto"
                      >
                        <p class="text-red-500 font-medium">{{ uploadError.us1 }}</p>
                      </div>

                      <ArrowUpTrayIcon
                        class="w-10 h-10 mx-auto border rounded-full p-2"
                        :class="
                          uploadError.us1
                            ? 'text-red-500 border-red-500/50 bg-red-500/10'
                            : 'text-accent border-accent/50 bg-accent/10'
                        "
                      />
                      <p
                        class="mt-2 text-base"
                        :class="uploadError.us1 ? 'text-red-500' : 'text-accent'"
                      >
                        {{
                          uploadError.us1 ? 'Please try again' : 'DRAG & DROP or CLICK to upload'
                        }}
                      </p>
                    </template>
                  </div>
                </div>
              </template>
            </div>

            <!-- Vertical Divider -->
            <div class="mx-4 border-l border-gray-700/50"></div>

            <!-- Right Side: Second Upload Zone -->
            <div class="w-1/2 pl-6">
              <!-- Conditionally render Drop Zone or Code Summary for us2 -->
              <template v-if="usStore.isComponentDisabled('us2')">
                <USCodeSummary componentId="us2" @remove-file="handleRemoveFile" />
              </template>
              <template v-else>
                <!-- Prospect's Rates Upload Zone (Drop Zone Content) -->
                <div
                  class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center"
                  :class="[
                    isDraggingUs2
                      ? 'border-accent bg-fbWhite/10 border-solid'
                      : !usStore.isComponentDisabled('us2') /* Keep hover state for dropzone */
                        ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600'
                        : '',
                    usStore.isComponentUploading('us2')
                      ? 'cursor-not-allowed'
                      : usStore.isComponentUploading('us1')
                        ? 'opacity-50 cursor-not-allowed border-gray-600' /* Dim if other is uploading */
                        : !usStore.isComponentDisabled('us2')
                          ? 'cursor-pointer'
                          : '',
                    /* Removed isComponentDisabled check for background as it's handled by v-if now */
                    uploadError.us2 ? 'border-red-500 border-solid border-2' : '',
                  ]"
                  @dragenter.prevent="handleDragEnterUs2"
                  @dragleave.prevent="handleDragLeaveUs2"
                  @dragover.prevent="handleDragOverUs2"
                  @drop.prevent="handleDropUs2"
                >
                  <!-- File Input -->
                  <input
                    type="file"
                    accept=".csv"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    :disabled="
                      usStore.isComponentUploading('us2') ||
                      usStore.isComponentUploading('us1') ||
                      usStore.isComponentDisabled('us2')
                    "
                    @change="(e) => handleFileChange(e, 'us2')"
                  />

                  <div class="flex flex-col items-center justify-center w-full h-full text-center">
                    <!-- Uploading State -->
                    <template v-if="usStore.isComponentUploading('us2')">
                      <div
                        class="flex-1 flex flex-col items-center justify-center w-full space-y-2"
                      >
                        <ArrowPathIcon class="w-8 h-8 text-accent animate-spin" />
                        <p class="text-sm text-accent">Processing your file...</p>
                      </div>
                    </template>

                    <!-- Waiting State (if other is uploading) -->
                    <template
                      v-else-if="
                        !usStore.isComponentDisabled('us2') && usStore.isComponentUploading('us1')
                      "
                    >
                      <div class="flex-1 flex items-center justify-center w-full">
                        <p class="text-sizeMd text-accent/80">
                          Please wait for the other file to finish processing...
                        </p>
                      </div>
                    </template>

                    <!-- Default/Empty State -->
                    <template v-else>
                      <!-- Error notification -->
                      <div
                        v-if="uploadError.us2"
                        class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full max-w-xs mx-auto"
                      >
                        <p class="text-red-500 font-medium">{{ uploadError.us2 }}</p>
                      </div>

                      <ArrowUpTrayIcon
                        class="w-10 h-10 mx-auto border rounded-full p-2"
                        :class="
                          uploadError.us2
                            ? 'text-red-500 border-red-500/50 bg-red-500/10'
                            : 'text-accent border-accent/50 bg-accent/10'
                        "
                      />
                      <p
                        class="mt-2 text-base"
                        :class="uploadError.us2 ? 'text-red-500' : 'text-accent'"
                      >
                        {{
                          uploadError.us2 ? 'Please try again' : 'DRAG & DROP or CLICK to upload'
                        }}
                      </p>
                    </template>
                  </div>
                </div>
              </template>
              <!-- Remove File Button & Old Summary (Removed) -->
              <!--
                <div class=\"flex justify-end mt-2\" v-if=\"usStore.isComponentDisabled(\'us2\')\">
                   <button @click=\"handleRemoveFile(\'us2\')\" class=\"...\">...</button>
                </div>
                <USCodeSummary v-if=\"usStore.isComponentDisabled(\'us2\')\" componentId=\"us2\" />
              -->
            </div>
          </div>
        </div>

        <!-- Reports Button Container -->
        <div v-if="usStore.isFull" class="border-t border-gray-700/50">
          <div class="flex justify-end mt-8">
            <!-- Use BaseButton for Get Reports -->
            <BaseButton
              variant="primary"
              size="standard"
              :icon="ArrowRightIcon"
              @click="handleReportsAction"
              :loading="isGeneratingReports"
            >
              {{ reportsButtonText }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <PreviewModal
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :start-line="startLine"
      :column-options="US_COLUMN_ROLE_OPTIONS"
      :source="'US'"
      @update:mappings="handleMappingUpdate"
      @update:valid="(isValid) => (isModalValid = isValid)"
      @update:indeterminate-definition="(definition) => (indeterminateRateDefinition = definition)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
    
    <!-- Plus One Handling Modal - REMOVED: Analysis moved to USCodeReport -->
    <!-- <PlusOneHandlingModal
      v-if="showPlusOneModal"
      :showModal="showPlusOneModal"
      :analysis="plusOneAnalysis"
      @handle-choice="handlePlusOneChoice"
      @cancel="cancelPlusOneModal"
    /> -->
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed } from 'vue';
  import {
    ArrowUpTrayIcon,
    DocumentIcon,
    TrashIcon,
    ArrowRightIcon,
    ArrowPathIcon,
  } from '@heroicons/vue/24/outline';
  import PreviewModal from '@/components/shared/PreviewModal.vue';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import { useUsStore } from '@/stores/us-store';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  import { USService } from '@/services/us.service';
  import {
    USReportsInput,
    type USPricingReport,
    type USCodeReport,
    type USStandardizedData,
    USColumnRole,
    USColumnMappings,
    InvalidUsRow,
    USEnhancedCodeReport,
  } from '@/types/domains/us-types';
  import { US_COLUMN_ROLE_OPTIONS } from '@/types/domains/us-types';
  import Papa from 'papaparse';
  import USCodeSummary from '@/components/us/USCodeSummary.vue';
  import USComparisonWorker from '@/workers/us-comparison.worker?worker';
  import USCodeReportWorker from '@/workers/us-code-report.worker?worker';
  import { useLergStore } from '@/stores/lerg-store';
  import { useDragDrop } from '@/composables/useDragDrop';
  // import PlusOneHandlingModal from '@/components/shared/PlusOneHandlingModal.vue';
  // import { detectPlusOneDestinations, filterByPlusOneChoice } from '@/utils/plus-one-detector';
  import { prepareLergWorkerData, getLergDataSummary } from '@/utils/prepare-worker-data';
  import { ComponentId, DBName, ReportTypes } from '@/types/app-types';
  import type { RateStats } from '@/types/domains/us-types';
  import { useUserStore } from '@/stores/user-store';
  import useDexieDB from '@/composables/useDexieDB';

  const usStore = useUsStore();
  const service = new USService();
  const lergStore = useLergStoreV2();
  const userStore = useUserStore();

  // Computed property for the reports button text
  const reportsButtonText = computed(() => {
    return isGeneratingReports.value ? 'GENERATING REPORTS' : 'Get Reports';
  });

  // Component state
  const isGeneratingReports = ref<boolean>(false);
  const showPreviewModal = ref(false);
  const isModalValid = ref(false);
  const columnMappings = ref<Record<string, string>>({});
  const indeterminateRateDefinition = ref('');

  // Preview state
  const previewData = ref<string[][]>([]);
  const columns = ref<string[]>([]);
  const startLine = ref(1);
  const activeComponent = ref<ComponentId>('us1');

  // Properly type the uploadError object with ComponentId keys
  const uploadError = reactive<Record<ComponentId, string | null>>({
    us1: null,
    us2: null,
    az1: null,
    az2: null,
  });
  
  // Plus One handling state - DEPRECATED: Analysis moved to USCodeReport
  // const showPlusOneModal = ref(false);
  // const plusOneAnalysis = ref<any>(null);
  // const originalFileData = ref<string[][]>([]);

  // Replace the existing handleFileSelected function to work with our composable
  async function handleFileSelected(file: File, componentId: ComponentId) {
    if (usStore.isComponentUploading(componentId) || usStore.isComponentDisabled(componentId))
      return;

    // Clear any previous errors
    uploadError[componentId] = null;

    // Check if OTHER component is uploading (not this one)
    const otherComponent = componentId === 'us1' ? 'us2' : 'us1';
    if (usStore.isComponentUploading(otherComponent)) {
      uploadError[componentId] = 'Please wait for the other file to finish uploading';
      return;
    }

    usStore.setComponentUploading(componentId, true);
    try {
      // Create a mock event with the file
      const mockEvent = {
        target: {
          files: [file],
        },
      };
      await handleFileInput(mockEvent, componentId);
    } catch (error) {
      console.error('Error handling file:', error);
      uploadError[componentId] = 'Error processing file. Please try again.';
    } finally {
      usStore.setComponentUploading(componentId, false);
    }
  }

  // Replace the existing useDragDrop implementation with updated ones that use our custom validator
  const {
    isDragging: isDraggingUs1,
    handleDragEnter: handleDragEnterUs1,
    handleDragLeave: handleDragLeaveUs1,
    handleDragOver: handleDragOverUs1,
    handleDrop: handleDropUs1,
  } = useDragDrop({
    acceptedExtensions: ['.csv'],
    fileValidator: (file) => {
      // Check if OTHER component is uploading (not this one)
      const otherComponent = 'us2';
      if (usStore.isComponentUploading(otherComponent)) {
        return { valid: false, errorMessage: 'Please wait for the other file to finish uploading' };
      }

      // Check for duplicate filename
      if (usStore.hasExistingFile(file.name)) {
        return {
          valid: false,
          errorMessage: `A file with name "${file.name}" has already been uploaded`,
        };
      }

      return { valid: true };
    },
    onDropCallback: (file) => handleFileSelected(file, 'us1'),
    onError: (message) => (uploadError['us1'] = message),
  });

  const {
    isDragging: isDraggingUs2,
    handleDragEnter: handleDragEnterUs2,
    handleDragLeave: handleDragLeaveUs2,
    handleDragOver: handleDragOverUs2,
    handleDrop: handleDropUs2,
  } = useDragDrop({
    acceptedExtensions: ['.csv'],
    fileValidator: (file) => {
      // Check if OTHER component is uploading (not this one)
      const otherComponent = 'us1';
      if (usStore.isComponentUploading(otherComponent)) {
        return { valid: false, errorMessage: 'Please wait for the other file to finish uploading' };
      }

      // Check for duplicate filename
      if (usStore.hasExistingFile(file.name)) {
        return {
          valid: false,
          errorMessage: `A file with name "${file.name}" has already been uploaded`,
        };
      }

      return { valid: true };
    },
    onDropCallback: (file) => handleFileSelected(file, 'us2'),
    onError: (message) => (uploadError['us2'] = message),
  });

  async function handleFileUploaded(componentName: ComponentId, fileName: string) {
    console.log(`[Main] File uploaded: ${fileName} for component ${componentName}`);
    usStore.addFileUploaded(componentName, fileName);

    try {
      console.log(`[USFileUploads] Starting NPA analysis for ${fileName}`);
      const tableName = fileName.toLowerCase().replace('.csv', '');

      // Get the data from the service
      // REMOVED: No longer getting data here just to pass to analyzer
      // const data = await service.getData(tableName);
      // if (!data || data.length === 0) {
      //   throw new Error(`No data found for file ${fileName}`);
      // }

      // REMOVED: Analyzer instantiation and call
      // const enhancedReport = await analyzer.analyzeTableNPAs(tableName, fileName);
      // console.log(`[USFileUploads] NPA analysis completed:`, enhancedReport);

      // REMOVED: Storing the enhanced report
      // usStore.setEnhancedCodeReport(enhancedReport);

      // Keep the log indicating successful upload registration
      console.log(
        `[USFileUploads] File ${fileName} processed and registered for component ${componentName}.`
      );

      userStore.incrementUploadsToday();
    } catch (error) {
      // Updated error message context
      console.error(`[Main] Error during post-upload processing for ${fileName}:`, error);
    }
  }

  async function handleReportsAction() {
    if (usStore.isCodeReportReady && usStore.isPricingReportReady) {
      usStore.showUploadComponents = false;
      return;
    }

    if (!usStore.isFull) {
      console.warn('[USFileUploads] Cannot generate reports: Two files are required.');
      return;
    }

    const fileNames = usStore.getFileNames;
    if (fileNames.length !== 2) {
      console.error('[USFileUploads] Expected 2 file names, but got:', fileNames);
      return;
    }

    // Derive table names before starting the process
    const table1Name = fileNames[0].toLowerCase().replace('.csv', '');
    const table2Name = fileNames[1].toLowerCase().replace('.csv', '');

    isGeneratingReports.value = true;
    usStore.setComponentUploading('us1', true); // Indicate processing state
    usStore.setComponentUploading('us2', true);

    try {
      console.log('[USFileUploads] Generating reports...');

      // --- Generate Code Report FIRST ---
      console.log(`[USFileUploads] Triggering code report for ${fileNames[0]} and ${fileNames[1]}`);
      const codeReportResult = await service.makeUsCodeReport(fileNames[0], fileNames[1]);
      console.log('[USFileUploads] Code report generated successfully.');

      // --- Set Code Report in Store IMMEDIATELY ---
      usStore.setCodeReport(codeReportResult);
      console.log('[USFileUploads] Code report set in store.');

      // --- Generate Detailed Pricing Comparison ---
      usStore.setPricingReportProcessing(true); // Set processing state TRUE
      console.log(
        `[USFileUploads] Triggering and awaiting detailed pricing comparison for ${table1Name} and ${table2Name}`
      );

      try {
        // Call the correct function to generate comparison data
        await service.processComparisons(table1Name, table2Name);
        console.log('[USFileUploads] Detailed pricing comparison completed successfully.');
        // Set pricing report as ready since comparison data is now available
        usStore.setPricingReportReady();
        console.log('[USFileUploads] Pricing report marked as ready.');
      } catch (comparisonError) {
        console.error('[USFileUploads] Detailed pricing comparison failed:', comparisonError);
        // Handle comparison-specific error if needed, e.g., show a specific message
        // Re-throw to be caught by the outer catch block for general error handling
        throw comparisonError;
      } finally {
        usStore.setPricingReportProcessing(false); // Set processing state FALSE
        console.log('[USFileUploads] Pricing comparison processing finished.');
      }

      // --- Fetch and Set Pricing Report Summary (only after comparison is done) ---
      // TODO: Implement fetching or generating the pricing report summary.
      // The data is available in the 'comparison_results' table in the
      // DBName.US_PRICING_COMPARISON database after processComparisons runs.
      // We need to either fetch and summarize here, or add a dedicated service function.
      console.log(
        '[USFileUploads] Skipping pricing report summary fetch (function not implemented).'
      );
      // const pricingReportSummary = await service.fetchPricingReportSummary(
      //   fileNames[0],
      //   fileNames[1]
      // );
      // console.log('[USFileUploads] Pricing report summary fetched.');
      // usStore.setPricingReport(pricingReportSummary);
      // console.log('[USFileUploads] Pricing report set in store.');

      // Reports are generated, switch to code report view
      usStore.showUploadComponents = false;
      usStore.setActiveReportType(ReportTypes.CODE); // Switch to code report view
    } catch (error) {
      console.error('[USFileUploads] Error during report generation process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      uploadError.us1 = `Report Generation Failed: ${errorMessage}`;
      uploadError.us2 = `Report Generation Failed: ${errorMessage}`;
    } finally {
      isGeneratingReports.value = false;
      usStore.setComponentUploading('us1', false); // Clear processing state
      usStore.setComponentUploading('us2', false);
      console.log('[USFileUploads] Report generation process finished.');
    }
  }

  // Optimize the enhanced code report generation
  async function generateEnhancedCodeReport(
    fileName: string,
    data: USStandardizedData[]
  ): Promise<USEnhancedCodeReport> {
    const codeReportWorker = new USCodeReportWorker();

    try {
      // Get LERG data efficiently using the optimized preparation
      const lergData = prepareLergWorkerData();

      // Continue only if lergData is valid
      if (!lergData) {
        throw new Error('LERG data is not available for report generation');
      }

      return await new Promise<USEnhancedCodeReport>((resolve, reject) => {
        const timeout = setTimeout(() => {
          codeReportWorker.terminate();
          reject(new Error('Worker timeout after 10 seconds'));
        }, 10000);

        codeReportWorker.onmessage = (event) => {
          clearTimeout(timeout);

          if (event.data?.error) {
            codeReportWorker.terminate();
            reject(new Error(event.data.error));
            return;
          }

          if (!event.data?.file1) {
            codeReportWorker.terminate();
            reject(new Error('Invalid report format received from worker'));
            return;
          }

          const report = event.data;
          if (!report.file1.fileName) {
            report.file1.fileName = fileName;
          }

          codeReportWorker.terminate();
          resolve(report);
        };

        codeReportWorker.onerror = (error) => {
          clearTimeout(timeout);
          codeReportWorker.terminate();
          reject(error);
        };

        // Send data to worker
        const input = {
          fileName,
          fileData: data,
          lergData,
        };

        codeReportWorker.postMessage(input);
      });
    } catch (error) {
      codeReportWorker.terminate();
      throw error;
    }
  }

  // File handling functions
  async function handleFileChange(event: Event, componentId: ComponentId) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];

    // Clear file input so same file can be uploaded again after removal
    target.value = '';

    await handleFileSelected(file, componentId);
  }

  // Modal handlers
  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }

  // Helper function for polling
  function pollUntilDataReady(
    checkFn: () => Promise<boolean>,
    timeout = 15000, // 15 seconds timeout
    interval = 500 // Check every 500ms
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let elapsedTime = 0;
      const timer = setInterval(async () => {
        elapsedTime += interval;
        console.log(`[Polling] Checking data readiness... (Elapsed: ${elapsedTime / 1000}s)`);
        try {
          const isReady = await checkFn();
          if (isReady) {
            console.log(`[Polling] Data is ready!`);
            clearInterval(timer);
            resolve();
          } else if (elapsedTime >= timeout) {
            console.error(`[Polling] Timeout reached (${timeout / 1000}s). Data not ready.`);
            clearInterval(timer);
            reject(new Error('Timeout waiting for data processing to complete in database.'));
          }
        } catch (error) {
          console.error('[Polling] Error during check function:', error);
          clearInterval(timer);
          reject(error);
        }
      }, interval);
    });
  }

  async function handleModalConfirm(
    mappings: Record<string, string>,
    indeterminateDefinition?: string
  ) {
    const file = usStore.getTempFile(activeComponent.value);
    if (!file) return;

    showPreviewModal.value = false;
    usStore.setComponentUploading(activeComponent.value, true);
    // Clear previous errors for this component
    uploadError[activeComponent.value] = null;

    const tableName = file.name.toLowerCase().replace('.csv', '');
    // console.log(`[DEBUG] handleModalConfirm started for ${file.name}, target table: ${tableName}`);

    try {
      // console.log(`[DEBUG] Defining column mappings for ${file.name}`);
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
          Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTERSTATE)?.[0] ??
            -1
        ),
        intrastate: Number(
          Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTRASTATE)?.[0] ??
            -1
        ),
        indeterminate: Number(
          Object.entries(mappings).find(
            ([_, value]) => value === USColumnRole.INDETERMINATE
          )?.[0] ?? -1
        ),
      };
      // console.log(`[DEBUG] Column mappings prepared:`, columnMapping);

      // console.log(`[DEBUG] Calling service.processFile for ${file.name} (writes to Dexie)`);
      // Call processFile - this still writes to Dexie but resolves when PapaParse is complete
      const processResult = await service.processFile(
        file,
        columnMapping,
        startLine.value,
        indeterminateDefinition
      );
      // console.log(`[DEBUG] service.processFile finished for ${processResult.fileName}.`);

      // --- Polling for Dexie Data --- //
      // console.log(`[DEBUG] Starting polling for Dexie table: ${tableName}`);
      const checkTableCount = async () => {
        const count = await service.getTableCount(tableName);
        // console.log(`[Polling Check] Table ${tableName} count: ${count}`);
        // Consider resolving if count > 0, or maybe add a check against expected count if available
        return count > 0;
      };

      try {
        await pollUntilDataReady(checkTableCount, 20000, 1000); // Poll for up to 20s
        // console.log(`[DEBUG] Polling successful. Proceeding to get data for ${tableName}.`);
      } catch (pollingError) {
        // console.error(`[DEBUG] Polling failed for ${tableName}:`, pollingError);
        throw new Error('Data did not become available in the database within the time limit.');
      }
      // --- End Polling --- //

      // Now that polling confirmed data exists, get it from Dexie
      // console.log(`[DEBUG] Calling service.getData for table: ${tableName}`);
      const data = await service.getData(tableName);
      // console.log(`[DEBUG] Retrieved ${data?.length || 0} records from Dexie for ${tableName}.`);

      // Register file in the store (associates componentId with fileName)
      await handleFileUploaded(activeComponent.value, processResult.fileName);
      // console.log(`[DEBUG] File registered in store for component: ${activeComponent.value}`);

      // Generate enhanced report if data was retrieved successfully
      if (data && data.length > 0) {
        // console.log(
        //   `[DEBUG] Proceeding with enhanced report generation for ${processResult.fileName} using ${data.length} records from Dexie.`
        // );

        // Data Cleaning & Sampling (Keep sampling for large datasets)
        const MAX_RECORDS_FOR_WORKER = 300000; // Limit data sent to worker
        const cleanData = data.map((item) => ({
          npanxx: item.npanxx,
          npa: item.npa,
          nxx: item.nxx,
          interRate: item.interRate,
          intraRate: item.intraRate,
          indetermRate: item.indetermRate,
        }));

        const dataForWorker =
          cleanData.length > MAX_RECORDS_FOR_WORKER
            ? cleanData.slice(0, MAX_RECORDS_FOR_WORKER)
            : cleanData;
        // console.log(`[DEBUG] Prepared ${dataForWorker.length} records for worker.`);

        // --- DEBUGGING STEP 2 START ---
        // if (dataForWorker.length > 0) {
        //   console.log(
        //     `[DEBUG][USFileUploads] First 5 records for worker:`,
        //     JSON.stringify(dataForWorker.slice(0, 5))
        //   );
        // }
        // --- DEBUGGING STEP 2 END ---

        try {
          // console.log(`[DEBUG] Calling generateEnhancedCodeReport for ${processResult.fileName}.`);
          const report = await generateEnhancedCodeReport(processResult.fileName, dataForWorker);
          // console.log(`[DEBUG] Worker finished report generation for: ${processResult.fileName}`);

          if (report) {
            usStore.setEnhancedCodeReport(report);
            // console.log(`[DEBUG] Enhanced report stored successfully for: ${processResult.fileName}`);
          } else {
            // console.warn(`[DEBUG] generateEnhancedCodeReport returned null/undefined.`);
          }
        } catch (enhancedReportError) {
          // console.error(
          //   `[DEBUG] Error during generateEnhancedCodeReport for ${processResult.fileName}:`,
          //   enhancedReportError
          // );
          uploadError[activeComponent.value] = `Failed to generate code analysis report: ${
            enhancedReportError instanceof Error
              ? enhancedReportError.message
              : String(enhancedReportError)
          }`;
        }
      } else {
        // console.warn(
        //   `[DEBUG] No data retrieved from Dexie table ${tableName}. Skipping enhanced report generation.`
        // );
        // Set error if data retrieval failed after polling succeeded (should be rare)
        if (!uploadError[activeComponent.value]) {
          // Avoid overwriting polling timeout error
          uploadError[activeComponent.value] = 'Failed to retrieve processed data from database.';
        }
      }
    } catch (error) {
      // console.error(`[DEBUG] Error in handleModalConfirm for ${file?.name}:`, error);
      // Ensure error message reflects the actual error source (processing, polling, etc.)
      uploadError[activeComponent.value] = `Error processing file or generating report: ${
        error instanceof Error ? error.message : String(error)
      }`;
    } finally {
      usStore.setComponentUploading(activeComponent.value, false);
      usStore.clearTempFile(activeComponent.value);
      // console.log(`[DEBUG] Finished handleModalConfirm for component ${activeComponent.value}`);
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    usStore.clearTempFile(activeComponent.value);
    activeComponent.value = 'us1';
  }

  async function handleRemoveFile(componentName: ComponentId) {
    try {
      const fileName = usStore.getFileNameByComponent(componentName);
      if (!fileName) return;

      const tableName = fileName.toLowerCase().replace('.csv', '');

      // First, remove the data from the appropriate storage
      await service.removeTable(tableName);

      // Delete comparison database since comparison data will be obsolete
      const { deleteDatabase } = useDexieDB();
      try {
        await deleteDatabase(DBName.US_PRICING_COMPARISON);
        console.log('[USFileUploads] Deleted obsolete comparison database after file removal.');
      } catch (dbError) {
        console.warn('[USFileUploads] Failed to delete comparison database:', dbError);
      }

      // Then, remove the file from the store
      // Note: The removeFile method in the store now handles clearing fileStats
      usStore.removeFile(componentName);
    } catch (error) {
      console.error('Error removing file:', error);
    }
  }

  // Add this before the existing handleRfFileDrop function
  async function handleFileInput(
    eventOrFile: Event | { target: { files: File[] } },
    componentId: ComponentId
  ) {
    // Handle different parameters - either an Event or a mocked event with files
    let file: File | null = null;

    if (eventOrFile instanceof Event) {
      const target = eventOrFile.target as HTMLInputElement;
      file = target.files?.[0] || null;
    } else if (eventOrFile && 'target' in eventOrFile && eventOrFile.target.files) {
      file = eventOrFile.target.files[0] || null;
    }

    if (!file) {
      console.error('No file found in event');
      return;
    }

    // Clear any previous errors
    uploadError[componentId] = null;

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      uploadError[componentId] = 'Only CSV files are accepted';
      return;
    }

    // Check if OTHER component is uploading
    const otherComponent = componentId === 'us1' ? 'us2' : 'us1';
    if (usStore.isComponentUploading(otherComponent)) {
      uploadError[componentId] = 'Please wait for the other file to finish uploading';
      return;
    }

    // Check for duplicate filename
    if (usStore.hasExistingFile(file.name)) {
      uploadError[componentId] = `A file with name "${file.name}" has already been uploaded`;
      return;
    }

    usStore.setTempFile(componentId, file);
    console.log('[USFileUploads] is launching preview modal');
    Papa.parse(file, {
      preview: 100, // Preview for column mapping only
      complete: (results) => {
        // Proceed directly to preview modal - comprehensive +1 analysis moved to USCodeReport
        previewData.value = results.data.slice(1) as string[][];
        columns.value = results.data[0] as string[];
        activeComponent.value = componentId;
        showPreviewModal.value = true;
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        usStore.clearTempFile(componentId);
        uploadError[componentId] = 'Error parsing CSV file. Please check the file format.';
      },
    });
  }
  
  // Plus One Modal Handlers - REMOVED: Analysis moved to USCodeReport
  // function handlePlusOneChoice(choice: 'include-all' | 'filter-plus-one' | 'extract-plus-one') {
  //   // Implementation moved to USCodeReport.vue
  // }
  // 
  // function cancelPlusOneModal() {
  //   // Implementation moved to USCodeReport.vue
  // }
</script>
