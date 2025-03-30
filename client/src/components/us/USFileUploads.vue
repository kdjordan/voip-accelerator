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
            v-if="!usStore.reportsGenerated"
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
    <PreviewModal2
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
import { ref, reactive, onMounted } from 'vue';
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  TrashIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline';
import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
import { useUsStore } from '@/stores/us-store';
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
import { storageConfig } from '@/config/storage-config';
import USCodeSummary from '@/components/us/USCodeSummary.vue';
import USComparisonWorker from '@/workers/us-comparison.worker?worker';
import USCodeReportWorker from '@/workers/us-code-report.worker?worker';
import { useLergStore } from '@/stores/lerg-store';
import { useDragDrop } from '@/composables/useDragDrop';
import { prepareLergWorkerData, getLergDataSummary } from '@/utils/prepare-worker-data';

// First, define a type for component IDs to ensure type safety
type ComponentId = 'us1' | 'us2';

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

// Update the useDragDrop implementation with custom validator
const validateUsFile = (
  file: File,
  componentId: ComponentId
): { valid: boolean; errorMessage?: string } => {
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, errorMessage: 'Only CSV files are accepted' };
  }

  // Check if OTHER component is uploading (not this one)
  const otherComponent = componentId === 'us1' ? 'us2' : 'us1';
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
};

// Replace the previous useDragDrop calls with updated ones that use our custom validator
const {
  isDragging: isDraggingUs1,
  handleDragEnter: handleDragEnterUs1,
  handleDragLeave: handleDragLeaveUs1,
  handleDragOver: handleDragOverUs1,
  handleDrop: handleDropUs1,
} = useDragDrop({
  fileValidator: (file) => validateUsFile(file, 'us1'),
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
  fileValidator: (file) => validateUsFile(file, 'us2'),
  onDropCallback: (file) => handleFileSelected(file, 'us2'),
  onError: (message) => (uploadError['us2'] = message),
});

async function handleFileUploaded(componentName: ComponentId, fileName: string) {
  usStore.addFileUploaded(componentName, fileName);
}

async function handleReportsAction() {
  if (usStore.reportsGenerated) {
    usStore.showUploadComponents = false;
  } else {
    try {
      await generateReports();
    } catch (error) {
      console.error('Failed to generate reports:', error);
      alert('Failed to generate reports. Please try again later.');
    }
  }
}

async function generateReports() {
  isGeneratingReports.value = true;
  try {
    // Load data using the USService which handles both storage strategies
    const fileNames = usStore.getFileNames;

    const fileData = await Promise.all(
      fileNames.map(async (fileName) => {
        // Remove .csv extension for table name
        const tableName = fileName.toLowerCase().replace('.csv', '');
        const data = await service.getData(tableName);
        if (!data || data.length === 0) {
          throw new Error(`No data found for file ${fileName}`);
        }
        return data;
      })
    );

    if (fileData.length === 2) {
      // Ensure data is cloneable by creating a clean copy
      // This avoids issues with DataCloneError when using in-memory storage
      const cleanData1 = fileData[0].map((item) => ({
        npanxx: item.npanxx,
        npa: item.npa,
        nxx: item.nxx,
        interRate: item.interRate,
        intraRate: item.intraRate,
        indetermRate: item.indetermRate,
      }));

      const cleanData2 = fileData[1].map((item) => ({
        npanxx: item.npanxx,
        npa: item.npa,
        nxx: item.nxx,
        interRate: item.interRate,
        intraRate: item.intraRate,
        indetermRate: item.indetermRate,
      }));

      // For very large datasets, we might need to sample the data to avoid browser issues
      // Only process the first 200,000 records to avoid memory issues
      const MAX_RECORDS = 200000;
      const sampleData1 =
        cleanData1.length > MAX_RECORDS ? cleanData1.slice(0, MAX_RECORDS) : cleanData1;
      const sampleData2 =
        cleanData2.length > MAX_RECORDS ? cleanData2.slice(0, MAX_RECORDS) : cleanData2;

      // Create worker and process data for comparison
      const comparisonWorker = new USComparisonWorker();
      const reports = await new Promise<{
        pricingReport: USPricingReport;
        codeReport: USCodeReport;
      }>((resolve, reject) => {
        comparisonWorker.onmessage = (event) => {
          const { pricingReport, codeReport, status } = event.data;

          // Handle the worker's status response
          if (status === 'lergDataReceived') {
            return;
          }

          resolve({ pricingReport, codeReport });
        };

        comparisonWorker.onerror = (error) => {
          console.error('Worker error:', error);
          reject(error);
        };

        // First, send LERG data to the worker
        const lergData = prepareLergWorkerData();
        if (lergData) {
          comparisonWorker.postMessage({ lergData });
        }

        // Then, send the file data for comparison
        const input: USReportsInput = {
          fileName1: fileNames[0],
          fileName2: fileNames[1],
          file1Data: sampleData1,
          file2Data: sampleData2,
        };

        comparisonWorker.postMessage(input);
      });

      if (reports.pricingReport && reports.codeReport) {
        usStore.setReports(reports.pricingReport, reports.codeReport);
      }

      // Clean up worker
      comparisonWorker.terminate();

      // After comparison is done, generate enhanced code report for each file
      // Process a sample of the data for the enhanced code report as well
      await generateEnhancedCodeReport(fileNames[0], sampleData1);
      if (fileNames.length > 1) {
        await generateEnhancedCodeReport(fileNames[1], sampleData2);
      }
    } else if (fileData.length === 1) {
      // Only one file, just generate enhanced code report
      const cleanData = fileData[0].map((item) => ({
        npanxx: item.npanxx,
        npa: item.npa,
        nxx: item.nxx,
        interRate: item.interRate,
        intraRate: item.intraRate,
        indetermRate: item.indetermRate,
      }));

      // For very large datasets, we might need to sample the data
      const MAX_RECORDS = 200000;
      const sampleData =
        cleanData.length > MAX_RECORDS ? cleanData.slice(0, MAX_RECORDS) : cleanData;

      await generateEnhancedCodeReport(fileNames[0], sampleData);
    }
  } catch (error: unknown) {
    console.error('Error generating reports:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
  } finally {
    isGeneratingReports.value = false;
  }
}

// New function to generate enhanced code report
async function generateEnhancedCodeReport(fileName: string, data: USStandardizedData[]) {
  try {
    // Create code report worker
    const codeReportWorker = new USCodeReportWorker();

    // Create a serializable version of the LERG data
    // This avoids DataCloneError by only sending simple serializable data
    const stateNPAs: Record<string, string[]> = {};
    Object.keys(lergStore.$state.stateNPAs).forEach((key) => {
      stateNPAs[key] = [...lergStore.$state.stateNPAs[key]]; // Create a new array with primitive values
    });

    const countryData = lergStore.$state.countryData.map((country) => ({
      country: country.country,
      npaCount: country.npaCount,
      npas: [...country.npas], // Create a new array with primitive values
      // Omit provinces or other complex properties that might cause issues
    }));

    const lergData = {
      stateNPAs,
      countryData,
    };

    // Create a promise to handle the worker
    const report = await new Promise<USEnhancedCodeReport>((resolve, reject) => {
      codeReportWorker.onmessage = (event) => {
        resolve(event.data);
      };

      codeReportWorker.onerror = (error) => {
        console.error('Code report worker error:', error);
        reject(error);
      };

      const input = {
        fileName,
        fileData: data,
        lergData,
      };

      codeReportWorker.postMessage(input);
    });

    // Store the report
    usStore.setEnhancedCodeReport(report);

    // Clean up worker
    codeReportWorker.terminate();
  } catch (error) {
    console.error('Error generating enhanced code report:', error);
  }
}

// File handling functions
async function handleFileChange(event: Event, componentId: ComponentId) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];

  // Clear file input so same file can be uploaded again after removal
  target.value = '';

  // Use the same validation logic from our composable
  const validationResult = validateUsFile(file, componentId);
  if (!validationResult.valid) {
    uploadError[componentId] = validationResult.errorMessage || 'Invalid file';
    return;
  }

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

    // Process file with mappings
    const result = await service.processFile(
      file,
      columnMapping,
      startLine.value,
      indeterminateDefinition
    );

    // Call handleFileUploaded with the component ID, not the file.name
    await handleFileUploaded(activeComponent.value, result.fileName);
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

  // Validate the file
  const validationResult = validateUsFile(file, componentId);
  if (!validationResult.valid) {
    uploadError[componentId] = validationResult.errorMessage || 'Invalid file';
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
