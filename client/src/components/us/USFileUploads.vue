<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- Upload Zones Box -->
    <div class="bg-gray-800 rounded-b-lg p-6">
      <div class="pb-4 mb-6">
        <!-- Change from grid to flex layout -->
        <div class="flex">
          <!-- Left Side: First Upload Zone and Single File Report -->
          <div class="w-1/2 pr-6">
            <!-- Your Rates Upload Zone -->
            <div
              class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center"
              :class="[
                isDraggingUs1
                  ? 'border-accent bg-fbWhite/10 border-solid'
                  : !usStore.isComponentDisabled('us1')
                  ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600'
                  : '',
                usStore.isComponentUploading('us1')
                  ? 'animate-upload-pulse cursor-not-allowed'
                  : usStore.isComponentUploading('us2')
                  ? 'opacity-50 cursor-not-allowed border-gray-600'
                  : !usStore.isComponentDisabled('us1')
                  ? 'cursor-pointer'
                  : '',
                usStore.isComponentDisabled('us1')
                  ? 'bg-accent/20 border-2 border-solid border-accent/50'
                  : '',
                uploadError.us1 ? 'border-red-500 border-solid border-2' : '',
              ]"
              @dragenter.prevent="handleDragEnterUs1"
              @dragleave.prevent="handleDragLeaveUs1"
              @dragover.prevent="handleDragOverUs1"
              @drop.prevent="handleDropUs1"
            >
              <!-- File Input and Content -->
              <input
                type="file"
                accept=".csv"
                class="absolute inset-0 opacity-0"
                :class="{ 'pointer-events-none': usStore.isComponentDisabled('us1') }"
                :disabled="
                  usStore.isComponentUploading('us1') ||
                  usStore.isComponentUploading('us2') ||
                  usStore.isComponentDisabled('us1')
                "
                @change="(e) => handleFileChange(e, 'us1')"
              />

              <div class="flex flex-col h-full">
                <!-- Empty/Processing States -->
                <template
                  v-if="!usStore.isComponentDisabled('us1') && !usStore.isComponentUploading('us1')"
                >
                  <div class="flex items-center justify-center w-full h-full">
                    <div class="text-center w-full">
                      <!-- Error notification when there is an error -->
                      <div
                        v-if="uploadError.us1"
                        class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full"
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
                          uploadError.us1
                            ? 'Please try again'
                            : 'DRAG & DROP to upload or CLICK to select file'
                        }}
                      </p>
                    </div>
                  </div>
                </template>

                <!-- Uploading State -->
                <template v-if="usStore.isComponentUploading('us1')">
                  <div
                    class="flex-1 flex items-center justify-center bg-accent/10 animate-upload-pulse w-full h-full absolute inset-0 min-h-[120px]"
                  >
                    <p class="text-sizeMd text-accent">Processing your file...</p>
                  </div>
                </template>

                <!-- File Uploaded State -->
                <template v-if="usStore.isComponentDisabled('us1')">
                  <!-- Centered File Info -->
                  <div class="flex-1 flex items-center justify-center">
                    <div class="flex items-center space-x-3">
                      <DocumentIcon class="w-6 h-6 text-accent" />
                      <p class="text-xl text-accent">
                        {{ usStore.getFileNameByComponent('us1') }}
                      </p>
                    </div>
                  </div>
                </template>

                <!-- Add waiting state overlay for first upload zone when second is uploading -->
                <template
                  v-if="!usStore.isComponentDisabled('us1') && usStore.isComponentUploading('us2')"
                >
                  <div
                    class="flex-1 flex items-center justify-center w-full h-full absolute inset-0 bg-gray-900/30 backdrop-blur-sm z-10"
                  >
                    <p class="text-sizeMd text-accent/80">
                      Please wait for the other file to finish processing...
                    </p>
                  </div>
                </template>
              </div>
            </div>

            <!-- Remove File Button -->
            <div class="flex justify-end mt-2" v-if="usStore.isComponentDisabled('us1')">
              <button
                @click="handleRemoveFile('us1')"
                class="px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors"
              >
                <div class="flex items-center justify-center space-x-2">
                  <TrashIcon class="w-3.5 h-3.5 text-red-400" />
                  <span class="text-xs text-red-400">Remove</span>
                </div>
              </button>
            </div>

            <!-- Add Code Summary for first component -->
            <USCodeSummary v-if="usStore.isComponentDisabled('us1')" componentId="us1" />
          </div>

          <!-- Vertical Divider -->
          <div class="mx-4 border-l border-gray-700/50"></div>

          <!-- Right Side: Second Upload Zone -->
          <div class="w-1/2 pl-6">
            <!-- Prospect's Rates Upload Zone -->
            <div
              class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center"
              :class="[
                isDraggingUs2
                  ? 'border-accent bg-fbWhite/10 border-solid'
                  : !usStore.isComponentDisabled('us2')
                  ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600'
                  : '',
                usStore.isComponentUploading('us2')
                  ? 'animate-upload-pulse cursor-not-allowed'
                  : usStore.isComponentUploading('us1')
                  ? 'opacity-50 cursor-not-allowed border-gray-600'
                  : !usStore.isComponentDisabled('us2')
                  ? 'cursor-pointer'
                  : '',
                usStore.isComponentDisabled('us2')
                  ? 'bg-accent/20 border-2 border-solid border-accent/50'
                  : '',
                uploadError.us2 ? 'border-red-500 border-solid border-2' : '',
              ]"
              @dragenter.prevent="handleDragEnterUs2"
              @dragleave.prevent="handleDragLeaveUs2"
              @dragover.prevent="handleDragOverUs2"
              @drop.prevent="handleDropUs2"
            >
              <!-- File Input and Content -->
              <input
                type="file"
                accept=".csv"
                class="absolute inset-0 opacity-0"
                :class="{ 'pointer-events-none': usStore.isComponentDisabled('us2') }"
                :disabled="
                  usStore.isComponentUploading('us2') ||
                  usStore.isComponentUploading('us1') ||
                  usStore.isComponentDisabled('us2')
                "
                @change="(e) => handleFileChange(e, 'us2')"
              />

              <div class="flex flex-col h-full">
                <!-- Empty/Processing States -->
                <template
                  v-if="!usStore.isComponentDisabled('us2') && !usStore.isComponentUploading('us2')"
                >
                  <div class="flex items-center justify-center w-full h-full">
                    <div class="text-center w-full">
                      <!-- Error notification when there is an error -->
                      <div
                        v-if="uploadError.us2"
                        class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full"
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
                          uploadError.us2
                            ? 'Please try again'
                            : 'DRAG & DROP to upload or CLICK to select file'
                        }}
                      </p>
                    </div>
                  </div>
                </template>

                <template v-if="usStore.isComponentUploading('us2')">
                  <div
                    class="flex-1 flex items-center justify-center bg-accent/10 animate-upload-pulse w-full h-full absolute inset-0 min-h-[120px]"
                  >
                    <p class="text-sizeMd text-accent">Processing your file...</p>
                  </div>
                </template>

                <!-- File Uploaded State -->
                <template v-if="usStore.isComponentDisabled('us2')">
                  <!-- Centered File Info -->
                  <div class="flex-1 flex items-center justify-center">
                    <div class="flex items-center space-x-3">
                      <DocumentIcon class="w-6 h-6 text-accent" />
                      <p class="text-xl text-accent">
                        {{ usStore.getFileNameByComponent('us2') }}
                      </p>
                    </div>
                  </div>
                </template>

                <!-- Add waiting state overlay for second upload zone when first is uploading -->
                <template
                  v-if="!usStore.isComponentDisabled('us2') && usStore.isComponentUploading('us1')"
                >
                  <div
                    class="flex-1 flex items-center justify-center w-full h-full absolute inset-0 bg-gray-900/30 backdrop-blur-sm z-10"
                  >
                    <p class="text-sizeMd text-accent/80">
                      Please wait for the other file to finish processing...
                    </p>
                  </div>
                </template>
              </div>
            </div>

            <!-- Remove File Button -->
            <div class="flex justify-end mt-2" v-if="usStore.isComponentDisabled('us2')">
              <button
                @click="handleRemoveFile('us2')"
                class="px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors"
              >
                <div class="flex items-center justify-center space-x-2">
                  <TrashIcon class="w-3.5 h-3.5 text-red-400" />
                  <span class="text-xs text-red-400">Remove</span>
                </div>
              </button>
            </div>

            <!-- Add Code Summary for second component -->
            <USCodeSummary v-if="usStore.isComponentDisabled('us2')" componentId="us2" />
          </div>
        </div>
      </div>

      <!-- Reports Button -->
      <div class="border-t border-gray-700/50">
        <div class="flex justify-end mt-8">
          <button
            v-if="!(usStore.isCodeReportReady && usStore.isPricingReportReady)"
            @click="handleReportsAction"
            :disabled="!usStore.isFull || isGeneratingReports"
            class="px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:border disabled:border-gray-700"
            :class="{ 'animate-pulse': isGeneratingReports }"
          >
            <div class="flex items-center justify-center space-x-2">
              <span class="text-sm text-accent">{{
                isGeneratingReports ? 'GENERATING REPORTS' : 'Get Reports'
              }}</span>
              <ArrowRightIcon class="w-4 h-4 text-accent" />
            </div>
          </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  TrashIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline';
import PreviewModal from '@/components/shared/PreviewModal.vue';
import { useUsStore } from '@/stores/us-store';
import { USService } from '@/services/us.service';
import { USNPAAnalyzerService } from '@/services/us-npa-analyzer.service';
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
import { prepareLergWorkerData, getLergDataSummary } from '@/utils/prepare-worker-data';
import { ComponentId, DBName } from '@/types/app-types';
import type { RateStats } from '@/types/domains/us-types';

const usStore = useUsStore();
const service = new USService();
const lergStore = useLergStore();

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

// Replace the existing handleFileSelected function to work with our composable
async function handleFileSelected(file: File, componentId: ComponentId) {
  if (usStore.isComponentUploading(componentId) || usStore.isComponentDisabled(componentId)) return;

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
  console.error(`[Main] File uploaded: ${fileName} for component ${componentName}`);
  usStore.addFileUploaded(componentName, fileName);

  try {
    console.error(`[Main] Starting NPA analysis for ${fileName}`);
    const tableName = fileName.toLowerCase().replace('.csv', '');

    // Get the data from the service
    const data = await service.getData(tableName);
    if (!data || data.length === 0) {
      throw new Error(`No data found for file ${fileName}`);
    }

    // Create analyzer instance
    const analyzer = new USNPAAnalyzerService();

    // Analyze the table and get the enhanced report
    const enhancedReport = await analyzer.analyzeTableNPAs(tableName, fileName);
    console.error(`[Main] NPA analysis completed:`, enhancedReport);

    // Store the enhanced report
    usStore.setEnhancedCodeReport(enhancedReport);

    // Remove the creation of empty reports for single file
    // We'll only generate reports when explicitly requested or when we have two files
  } catch (error) {
    console.error(`[Main] Error in NPA analysis:`, error);
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
    console.log('[USFileUploads] Fetching final pricing report summary...');
    const pricingReportSummary = await service.fetchPricingReportSummary(
      fileNames[0],
      fileNames[1]
    );
    console.log('[USFileUploads] Pricing report summary fetched.');
    usStore.setPricingReport(pricingReportSummary);
    console.log('[USFileUploads] Pricing report set in store.');

    // Reports are generated, potentially hide upload components
    usStore.showUploadComponents = false;
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
async function generateEnhancedCodeReport(fileName: string, data: USStandardizedData[]) {
  console.error(`[Main] Creating worker for ${fileName}`);
  const codeReportWorker = new USCodeReportWorker();

  try {
    // Get LERG data efficiently using the optimized preparation
    const lergData = prepareLergWorkerData();
    // Ensure lergData is not null and access properties safely
    if (lergData) {
      // Accessing lergData properties that actually exist
      console.error(
        `[Main] LERG data prepared with ${lergData.validNpas?.length || 0} valid NPAs and ${
          Object.keys(lergData.countryGroups || {}).length
        } country groups.`
      );
    } else {
      console.error(`[Main] LERG data preparation returned null or undefined.`);
      // Handle the case where LERG data is not available, maybe reject or return default report
    }

    // Continue only if lergData is valid
    if (!lergData) {
      throw new Error('LERG data is not available for report generation');
    }

    return await new Promise<USEnhancedCodeReport>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error(`[Main] Worker timeout for ${fileName} after 10 seconds`);
        codeReportWorker.terminate();
        reject(new Error('Worker timeout after 10 seconds'));
      }, 10000);

      codeReportWorker.onmessage = (event) => {
        clearTimeout(timeout);
        console.error(`[Main] Worker message received for ${fileName}`);

        if (event.data?.error) {
          console.error(`[Main] Worker error: ${event.data.error}`);
          codeReportWorker.terminate();
          reject(new Error(event.data.error));
          return;
        }

        if (!event.data?.file1) {
          console.error(`[Main] Invalid report format from worker`);
          codeReportWorker.terminate();
          reject(new Error('Invalid report format received from worker'));
          return;
        }

        const report = event.data;
        if (!report.file1.fileName) {
          report.file1.fileName = fileName;
        }

        usStore.setEnhancedCodeReport(report);
        codeReportWorker.terminate();
        resolve(report);
      };

      codeReportWorker.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`[Main] Worker error event for ${fileName}:`, error);
        codeReportWorker.terminate();
        reject(error);
      };

      // Send data to worker
      const input = {
        fileName,
        fileData: data,
        lergData,
      };

      console.error(`[Main] Sending data to worker for ${fileName}`);
      codeReportWorker.postMessage(input);
    });
  } catch (error) {
    console.error(`[Main] Error in generateEnhancedCodeReport:`, error);
    codeReportWorker.terminate();
    return null;
  }
}

// File handling functions
async function handleFileChange(event: Event, componentId: ComponentId) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];

  // Clear file input so same file can be uploaded again after removal
  target.value = '';

  // TODO: Implement or find the validateUsFile function
  // Commenting out for now to fix build
  // const validationResult = validateUsFile(file, componentId);
  // if (!validationResult.valid) {
  //   uploadError[componentId] = validationResult.errorMessage || 'Invalid file';
  //   return;
  // }

  await handleFileSelected(file, componentId);
}

// Modal handlers
function handleMappingUpdate(newMappings: Record<string, string>) {
  columnMappings.value = newMappings;
}

async function handleModalConfirm(
  mappings: Record<string, string>,
  indeterminateDefinition?: string
) {
  const file = usStore.getTempFile(activeComponent.value);
  if (!file) return;

  showPreviewModal.value = false;
  usStore.setComponentUploading(activeComponent.value, true);

  try {
    console.log(`[DEBUG] Starting file processing for ${file.name}`);

    // Convert mappings to column indices
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

    console.log(`[DEBUG] Column mappings prepared:`, columnMapping);

    // Process file with mappings
    const result = await service.processFile(
      file,
      columnMapping,
      startLine.value,
      indeterminateDefinition
    );

    console.log(`[DEBUG] File processed successfully: ${result.fileName}`);

    // Call handleFileUploaded with the component ID, not the file.name
    await handleFileUploaded(activeComponent.value, result.fileName);
    console.log(`[DEBUG] File registered in store for component: ${activeComponent.value}`);

    // After file upload is successful, automatically generate the enhanced code report
    console.log(`[DEBUG] Starting enhanced code report generation for: ${result.fileName}`);

    // Get the data from the service
    const tableName = result.fileName.toLowerCase().replace('.csv', '');
    console.log(`[DEBUG] Getting data from table: ${tableName}`);
    const data = await service.getData(tableName);
    console.log(`[DEBUG] Retrieved ${data?.length || 0} records for enhanced report`);

    if (data && data.length > 0) {
      console.log(`[DEBUG] Preparing data for enhanced report worker`);
      // For very large datasets, sample the data
      const MAX_RECORDS = 200000;
      const cleanData = data.map((item) => ({
        npanxx: item.npanxx,
        npa: item.npa,
        nxx: item.nxx,
        interRate: item.interRate,
        intraRate: item.intraRate,
        indetermRate: item.indetermRate,
      }));

      const sampleData =
        cleanData.length > MAX_RECORDS ? cleanData.slice(0, MAX_RECORDS) : cleanData;
      console.log(`[DEBUG] Prepared ${sampleData.length} records for enhanced report`);

      try {
        // Generate the enhanced code report for this file
        console.log(`[DEBUG] Calling generateEnhancedCodeReport with ${sampleData.length} records`);
        const report = await generateEnhancedCodeReport(result.fileName, sampleData);
        console.log(`[DEBUG] Enhanced code report generation completed:`, !!report);

        // Double-check if report was stored
        setTimeout(() => {
          const storedReport = usStore.getEnhancedReportByFile(result.fileName);
          console.log(`[DEBUG] Report in store after delay:`, !!storedReport);
          console.log(`[DEBUG] Total reports in store:`, usStore.enhancedCodeReports.size);
          console.log(`[DEBUG] Store has any enhanced reports:`, usStore.hasEnhancedReports);
          console.log(
            `[DEBUG] Available report keys:`,
            Array.from(usStore.enhancedCodeReports.keys())
          );
        }, 500);

        // Set the active report type to 'code' to show the enhanced report
        if (!usStore.isCodeReportReady && !usStore.isPricingReportReady) {
          console.log(`[DEBUG] Setting up basic reports for single file`);
          // Construct a valid basic CodeReport for the single file
          const defaultRateStats: RateStats = {
            average: 0,
            median: 0,
            min: 0,
            max: 0,
            count: 0,
          };
          const file1RateStats = report?.file1?.rateStats;

          const basicCodeReport: USCodeReport = {
            file1: {
              fileName: result.fileName,
              totalNPANXX: data.length,
              uniqueNPA:
                report?.file1?.countries.reduce((sum, c) => sum + (c.npas?.length || 0), 0) || 0,
              uniqueNXX: 0,
              coveragePercentage: report?.file1?.countries[0]?.npaCoverage || 0,
              rateStats: {
                interstate: file1RateStats?.interstate
                  ? { ...defaultRateStats, ...file1RateStats.interstate }
                  : defaultRateStats,
                intrastate: file1RateStats?.intrastate
                  ? { ...defaultRateStats, ...file1RateStats.intrastate }
                  : defaultRateStats,
                indeterminate: file1RateStats?.indeterminate
                  ? { ...defaultRateStats, ...file1RateStats.indeterminate }
                  : defaultRateStats,
              },
            },
            file2: {
              fileName: '',
              totalNPANXX: 0,
              uniqueNPA: 0,
              uniqueNXX: 0,
              coveragePercentage: 0,
              rateStats: {
                interstate: defaultRateStats,
                intrastate: defaultRateStats,
                indeterminate: defaultRateStats,
              },
            },
            matchedCodes: 0,
            nonMatchedCodes: data.length,
            matchedCodesPercentage: 0,
            nonMatchedCodesPercentage: 100,
          };

          // Define emptyPricingReport here as well, if needed in this scope
          const emptyPricingReport: USPricingReport = {
            file1: {
              fileName: result.fileName,
              averageInterRate: 0,
              averageIntraRate: 0,
              averageIJRate: 0,
              medianInterRate: 0,
              medianIntraRate: 0,
              medianIJRate: 0,
            },
            file2: {
              fileName: '',
              averageInterRate: 0,
              averageIntraRate: 0,
              averageIJRate: 0,
              medianInterRate: 0,
              medianIntraRate: 0,
              medianIJRate: 0,
            },
            comparison: {
              interRateDifference: 0,
              intraRateDifference: 0,
              ijRateDifference: 0,
              totalHigher: 0,
              totalLower: 0,
              totalEqual: 0,
            },
          };

          // Replace setReports with individual calls
          usStore.setPricingReport(emptyPricingReport);
          usStore.setCodeReport(basicCodeReport);

          console.log(`[DEBUG] Updated reports for single file: ${result.fileName}`);
        }
      } catch (enhancedReportError) {
        console.error(`[DEBUG] Error generating enhanced report:`, enhancedReportError);
      }
    } else {
      console.warn(`[DEBUG] No data available for enhanced report generation`);
    }
  } catch (error) {
    console.error('Error processing file:', error);
    uploadError[activeComponent.value] = `Error processing file: ${
      error instanceof Error ? error.message : String(error)
    }`;
  } finally {
    usStore.setComponentUploading(activeComponent.value, false);
    usStore.clearTempFile(activeComponent.value);
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

  Papa.parse(file, {
    preview: 5,
    complete: (results) => {
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
</script>
