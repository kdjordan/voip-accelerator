<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- Upload Zones Box -->
    <div class="bg-gray-800 rounded-b-lg p-6">
      <!-- Single File Analysis Section (Only visible when one file is uploaded) -->
      <div
        v-if="azStore.hasSingleFileReport && !azStore.isFull && !azStore.reportsGenerated"
        class="mb-6"
      ></div>

      <div class="pb-4 mb-6">
        <!-- Horizontal Layout for Upload Zones -->
        <div class="flex">
          <!-- Left Side: First Upload Zone and Single File Report -->
          <div class="w-1/2 pr-6">
            <!-- First Upload Zone (Always Visible) -->
            <div
              class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center"
              :class="[
                isDraggingAz1
                  ? 'border-accent bg-fbWhite/10 border-solid'
                  : !azStore.isComponentDisabled('az1')
                  ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600'
                  : '',
                azStore.isComponentUploading('az1')
                  ? 'animate-upload-pulse cursor-not-allowed'
                  : !azStore.isComponentDisabled('az1')
                  ? 'cursor-pointer'
                  : '',
                azStore.isComponentDisabled('az1')
                  ? 'bg-accent/20 border-2 border-solid border-accent/50'
                  : '',
                uploadError.az1 ? 'border-red-500 border-solid border-2' : '',
              ]"
              @dragenter.prevent="handleDragEnterAz1"
              @dragleave.prevent="handleDragLeaveAz1"
              @dragover.prevent="handleDragOverAz1"
              @drop.prevent="handleDropAz1"
            >
              <input
                type="file"
                accept=".csv"
                class="absolute inset-0 opacity-0"
                :class="{ 'pointer-events-none': azStore.isComponentDisabled('az1') }"
                :disabled="
                  azStore.isComponentUploading('az1') ||
                  azStore.isComponentUploading('az2') ||
                  azStore.isComponentDisabled('az1')
                "
                @change="(e) => handleFileInput(e, 'az1')"
              />

              <div class="flex flex-col h-full">
                <!-- Empty/Processing States -->
                <template
                  v-if="!azStore.isComponentDisabled('az1') && !azStore.isComponentUploading('az1')"
                >
                  <div class="flex items-center justify-center w-full h-full">
                    <div class="text-center w-full">
                      <!-- Error notification when there is an error -->
                      <div
                        v-if="uploadError.az1"
                        class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full"
                      >
                        <p class="text-red-500 font-medium">{{ uploadError.az1 }}</p>
                      </div>

                      <ArrowUpTrayIcon
                        v-if="!uploadError.az1"
                        class="w-10 h-10 mx-auto border rounded-full p-2 text-accent border-accent/50 bg-accent/10"
                      />
                      <p
                        class="mt-2 text-base"
                        :class="uploadError.az1 ? 'text-red-500' : 'text-accent'"
                      >
                        {{
                          uploadError.az1
                            ? 'Please try again'
                            : 'DRAG & DROP to upload or CLICK to select file'
                        }}
                      </p>
                    </div>
                  </div>
                </template>

                <template v-if="azStore.isComponentUploading('az1')">
                  <div
                    class="flex-1 flex items-center justify-center bg-accent/10 animate-upload-pulse w-full h-full absolute inset-0 min-h-[120px]"
                  >
                    <p class="text-sizeMd text-accent">Processing your file...</p>
                  </div>
                </template>

                <!-- File Uploaded State -->
                <template v-if="azStore.isComponentDisabled('az1')">
                  <!-- Centered File Info -->
                  <div class="flex-1 flex items-center justify-center">
                    <div class="flex items-center space-x-3">
                      <DocumentIcon class="w-6 h-6 text-accent" />
                      <p class="text-xl text-accent">
                        {{ azStore.getFileNameByComponent('az1') }}
                      </p>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Remove File Button -->
            <div class="flex justify-end mt-2" v-if="azStore.isComponentDisabled('az1')">
              <button
                @click="handleRemoveFile('az1')"
                class="px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors"
              >
                <div class="flex items-center justify-center space-x-2">
                  <TrashIcon class="w-3.5 h-3.5 text-red-400" />
                  <span class="text-xs text-red-400">Remove</span>
                </div>
              </button>
            </div>

            <!-- Single File Report Section (Only visible when one file is uploaded) -->
            <AzCodeSummary componentId="az1" />
          </div>

          <!-- Vertical Divider -->
          <div class="mx-4 border-l border-gray-700/50"></div>

          <!-- Right Side: Second Upload Zone (Only visible after first file is uploaded) -->
          <div class="w-1/2 pl-6">
            <div>
              <div
                class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center"
                :class="[
                  isDraggingAz2
                    ? 'border-accent bg-fbWhite/10 border-solid'
                    : !azStore.isComponentDisabled('az2')
                    ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600'
                    : '',
                  azStore.isComponentUploading('az2')
                    ? 'animate-upload-pulse cursor-not-allowed'
                    : !azStore.isComponentDisabled('az2')
                    ? 'cursor-pointer'
                    : '',
                  azStore.isComponentDisabled('az2')
                    ? 'bg-accent/20 border-2 border-solid border-accent/50'
                    : '',
                  uploadError.az2 ? 'border-red-500 border-solid border-2' : '',
                ]"
                @dragenter.prevent="handleDragEnterAz2"
                @dragleave.prevent="handleDragLeaveAz2"
                @dragover.prevent="handleDragOverAz2"
                @drop.prevent="handleDropAz2"
              >
                <input
                  type="file"
                  accept=".csv"
                  class="absolute inset-0 opacity-0"
                  :class="{ 'pointer-events-none': azStore.isComponentDisabled('az2') }"
                  :disabled="
                    azStore.isComponentUploading('az2') ||
                    azStore.isComponentUploading('az1') ||
                    azStore.isComponentDisabled('az2')
                  "
                  @change="(e) => handleFileInput(e, 'az2')"
                />

                <div class="flex flex-col h-full">
                  <!-- Empty/Processing States -->
                  <template
                    v-if="
                      !azStore.isComponentDisabled('az2') && !azStore.isComponentUploading('az2')
                    "
                  >
                    <div class="flex items-center justify-center w-full h-full">
                      <div class="text-center w-full">
                        <!-- Error notification when there is an error -->
                        <div
                          v-if="uploadError.az2"
                          class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full"
                        >
                          <p class="text-red-500 font-medium">{{ uploadError.az2 }}</p>
                        </div>

                        <ArrowUpTrayIcon
                          v-if="!uploadError.az2"
                          class="w-10 h-10 mx-auto border rounded-full p-2 text-accent border-accent/50 bg-accent/10"
                        />
                        <p
                          class="mt-2 text-base"
                          :class="uploadError.az2 ? 'text-red-500' : 'text-accent'"
                        >
                          {{
                            uploadError.az2
                              ? 'Please try again'
                              : 'DRAG & DROP to upload or CLICK to select file'
                          }}
                        </p>
                      </div>
                    </div>
                  </template>

                  <template v-if="azStore.isComponentUploading('az2')">
                    <div
                      class="flex-1 flex items-center justify-center bg-accent/10 animate-upload-pulse w-full h-full absolute inset-0 min-h-[120px]"
                    >
                      <p class="text-sizeMd text-accent">Processing your file...</p>
                    </div>
                  </template>

                  <!-- File Uploaded State -->
                  <template v-if="azStore.isComponentDisabled('az2')">
                    <!-- Centered File Info -->
                    <div class="flex-1 flex items-center justify-center">
                      <div class="flex items-center space-x-3">
                        <DocumentIcon class="w-6 h-6 text-accent" />
                        <p class="text-xl text-accent">
                          {{ azStore.getFileNameByComponent('az2') }}
                        </p>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <!-- Remove File Button -->
              <div class="flex justify-end mt-2" v-if="azStore.isComponentDisabled('az2')">
                <button
                  @click="handleRemoveFile('az2')"
                  class="px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors"
                >
                  <div class="flex items-center justify-center space-x-2">
                    <TrashIcon class="w-3.5 h-3.5 text-red-400" />
                    <span class="text-xs text-red-400">Remove</span>
                  </div>
                </button>
              </div>

              <!-- Single File Report Section for second file -->
              <AzCodeSummary componentId="az2" />
            </div>
          </div>
        </div>
      </div>

      <!-- Reports Button Section -->
      <div
        class="border-t border-gray-700/50 mt-8"
        v-if="azStore.isFull && !azStore.reportsGenerated"
      >
        <!-- Reports Button -->
        <div class="flex justify-end mt-8">
          <!-- Get Full Reports Button (Only when two files are uploaded) -->
          <button
            @click="handleReportsAction"
            :disabled="isGeneratingReports"
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

    <!-- New Preview Modal -->
    <PreviewModal
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :start-line="startLine"
      :column-options="AZ_COLUMN_ROLE_OPTIONS"
      :source="'AZ'"
      @update:mappings="handleMappingUpdate"
      @update:valid="(isValid) => (isModalValid = isValid)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  TrashIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline';
import PreviewModal from '@/components/shared/PreviewModal.vue';
import { useAzStore } from '@/stores/az-store';
import AzComparisonWorker from '@/workers/az-comparison.worker?worker';
import type {
  AzPricingReport,
  AzCodeReport,
  AZReportsInput,
  AZStandardizedData,
} from '@/types/domains/az-types';
import { AZ_COLUMN_ROLE_OPTIONS } from '@/types/domains/az-types';
import { DBName } from '@/types/app-types';
import { AZColumnRole } from '@/types/domains/az-types';
import Papa from 'papaparse';
import { AZService } from '@/services/az.service';
import { ReportTypes } from '@/types';
import AzCodeSummary from '@/components/az/AzCodeSummary.vue';
import { useDragDrop } from '@/composables/useDragDrop';

// Define the component ID type to avoid TypeScript errors
type ComponentId = 'az1' | 'az2';

const azStore = useAzStore();
const azService = new AZService();

const isGeneratingReports = ref(false);

// Preview state
const showPreviewModal = ref(false);
const previewData = ref<string[][]>([]);
const columns = ref<string[]>([]);
const startLine = ref(1);
const activeComponent = ref<ComponentId>('az1');

// Preview state
const isModalValid = ref(false);
const columnMappings = ref<Record<string, string>>({});

// Add new ref with proper typing
const uploadError = reactive<Record<ComponentId, string | null>>({
  az1: null,
  az2: null,
});

// Update the useDragDrop implementation with custom validator for AZ
const validateAzFile = (
  file: File,
  componentId: ComponentId
): { valid: boolean; errorMessage?: string } => {
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, errorMessage: 'Only CSV files are accepted' };
  }

  // Check if OTHER component is uploading (not this one)
  const otherComponent = componentId === 'az1' ? 'az2' : 'az1';
  if (azStore.isComponentUploading(otherComponent)) {
    return { valid: false, errorMessage: 'Please wait for the other file to finish uploading' };
  }

  // Check for duplicate filename
  if (azStore.hasExistingFile(file.name)) {
    return {
      valid: false,
      errorMessage: `A file with name "${file.name}" has already been uploaded`,
    };
  }

  return { valid: true };
};

// Component 1 drag handlers
const {
  isDragging: isDraggingAz1,
  handleDragEnter: handleDragEnterAz1,
  handleDragLeave: handleDragLeaveAz1,
  handleDragOver: handleDragOverAz1,
  handleDrop: handleDropAz1,
} = useDragDrop({
  fileValidator: (file) => validateAzFile(file, 'az1'),
  onDropCallback: (file) => handleFileSelected(file, 'az1'),
  onError: (message) => (uploadError['az1'] = message),
});

// Component 2 drag handlers
const {
  isDragging: isDraggingAz2,
  handleDragEnter: handleDragEnterAz2,
  handleDragLeave: handleDragLeaveAz2,
  handleDragOver: handleDragOverAz2,
  handleDrop: handleDropAz2,
} = useDragDrop({
  fileValidator: (file) => validateAzFile(file, 'az2'),
  onDropCallback: (file) => handleFileSelected(file, 'az2'),
  onError: (message) => (uploadError['az2'] = message),
});

// Now update the handleFileSelected function to work with our composable
async function handleFileSelected(file: File, componentId: ComponentId) {
  if (azStore.isComponentUploading(componentId) || azStore.isComponentDisabled(componentId)) return;

  // Clear any previous errors
  uploadError[componentId] = null;

  azStore.setComponentUploading(componentId, true);
  try {
    await handleFileInput({ target: { files: [file] } } as unknown as Event, componentId);
  } catch (error) {
    console.error('Error handling file:', error);
    uploadError[componentId] = 'Error processing file. Please try again.';
  } finally {
    azStore.setComponentUploading(componentId, false);
  }
}

async function handleFileUploaded(componentName: ComponentId, fileName: string) {
  console.log('adding file to store', componentName, fileName);
  azStore.addFileUploaded(componentName, fileName);
  console.log(`File uploaded for ${componentName}: ${fileName}`);
}

async function handleRemoveFile(componentName: ComponentId) {
  try {
    const fileName = azStore.getFileNameByComponent(componentName);
    if (!fileName) return;

    const tableName = fileName.toLowerCase().replace('.csv', '');

    // First, remove the data from the appropriate storage
    await azService.removeTable(tableName);

    // Then, remove the file from the store
    // Note: The removeFile method in the store now handles clearing fileStats
    azStore.removeFile(fileName);

    console.log(`File ${fileName} removed successfully from component ${componentName}`);
  } catch (error) {
    console.error('Error removing file:', error);
  }
}

async function handleReportsAction() {
  if (!azStore.isFull || isGeneratingReports.value) return;

  isGeneratingReports.value = true;
  try {
    const [fileName1, fileName2] = azStore.getFileNames;
    if (!fileName1 || !fileName2) {
      throw new Error('Two filenames are required to generate reports.');
    }

    console.log(`[AZFileUploads] Calling makeAzCombinedReport for ${fileName1} and ${fileName2}`);
    await azService.makeAzCombinedReport(fileName1, fileName2);
    console.log(`[AZFileUploads] Combined report generation complete (or started).`);
  } catch (error: unknown) {
    console.error('[AZFileUploads] Error generating reports:', error);
    // TODO: Maybe show a user-facing error notification
  } finally {
    isGeneratingReports.value = false;
  }
}

// Update the handleFileInput function to use our validation
async function handleFileInput(event: Event, componentId: ComponentId) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // Clear any previous errors
  uploadError[componentId] = null;

  // Use our validation logic
  const validationResult = validateAzFile(file, componentId);
  if (!validationResult.valid) {
    uploadError[componentId] = validationResult.errorMessage || 'Invalid file';
    return;
  }

  azStore.setTempFile(componentId, file);

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
      azStore.clearTempFile(componentId);
      uploadError[componentId] = 'Error parsing CSV file. Please check the file format.';
    },
  });
}

// Modal handlers
async function handleModalConfirm(mappings: Record<string, string>) {
  const file = azStore.getTempFile(activeComponent.value);
  if (!file) return;

  showPreviewModal.value = false;
  azStore.setComponentUploading(activeComponent.value, true);

  try {
    // Convert mappings to column indices (correct property names)
    const columnMapping = {
      destName: Number(
        Object.entries(mappings).find(([_, value]) => value === AZColumnRole.DESTINATION)?.[0] ?? -1
      ),
      code: Number(
        Object.entries(mappings).find(([_, value]) => value === AZColumnRole.DIALCODE)?.[0] ?? -1
      ),
      rate: Number(
        Object.entries(mappings).find(([_, value]) => value === AZColumnRole.RATE)?.[0] ?? -1
      ),
    };

    console.log(`[DEBUG] Column mappings prepared:`, columnMapping);

    const result = await azService.processFile(
      file,
      columnMapping,
      startLine.value,
      activeComponent.value
    );
    await handleFileUploaded(activeComponent.value, result.fileName);
  } catch (error) {
    console.error('Error processing file:', error);
    uploadError[activeComponent.value] = 'Error processing file. Please try again.';
  } finally {
    azStore.setComponentUploading(activeComponent.value, false);
    azStore.clearTempFile(activeComponent.value);
  }
}

function handleModalCancel() {
  showPreviewModal.value = false;
  azStore.clearTempFile(activeComponent.value);
  activeComponent.value = 'az1';
}

function handleMappingUpdate(newMappings: Record<string, string>) {
  columnMappings.value = newMappings;
}

// Add this debugging function after the existing handleDragEnter function
function setTestError(componentId: ComponentId, message: string) {
  // For testing error states
  uploadError[componentId] = message;
  console.log(`Set error for ${componentId}: ${message}`);
}

// Function to view the single file report
function viewSingleFileReport() {
  azStore.setActiveReportType(ReportTypes.CODE);
}
</script>
