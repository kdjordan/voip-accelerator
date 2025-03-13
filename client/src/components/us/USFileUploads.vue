<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- Upload Zones Box -->
    <div class="bg-gray-800 rounded-b-lg p-6">
      <div class="pb-4 mb-6">
        <div class="grid grid-cols-2 gap-8">
          <!-- Your Rates Upload Zone -->
          <div class="flex flex-col gap-2">
            <h2 class="text-base text-fbWhite mb-4 font-secondary text-center uppercase">Your Rates Here</h2>
            <div
              class="relative border-2 rounded-lg p-8 h-[160px] flex items-center justify-center"
              :class="[
                isDragging['us1']
                  ? 'border-accent bg-fbWhite/10'
                  : !usStore.isComponentDisabled('us1')
                  ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 dashed'
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
                  : 'border-fbWhite',
                uploadError.us1 ? 'border-red-500 border-solid border-2' : '',
              ]"
              @dragenter.prevent="e => handleDragEnter(e, 'us1')"
              @dragleave.prevent="e => handleDragLeave(e, 'us1')"
              @dragover.prevent
              @drop.prevent="e => handleDrop(e, 'us1')"
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
                @change="e => handleFileChange(e, 'us1')"
              />

              <div class="flex flex-col h-full">
                <!-- Empty/Processing States -->
                <template v-if="!usStore.isComponentDisabled('us1') && !usStore.isComponentUploading('us1')">
                  <div class="flex items-center justify-center w-full h-full">
                    <div class="text-center w-full">
                      <!-- Error notification when there is an error -->
                      <div v-if="uploadError.us1" class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full">
                        <p class="text-red-500 font-medium">{{ uploadError.us1 }}</p>
                      </div>
                      
                      <ArrowUpTrayIcon
                        class="w-12 h-12 mx-auto border rounded-full p-2"
                        :class="uploadError.us1 ? 'text-red-500 border-red-500/50 bg-red-500/10' : 'text-accent border-accent/50 bg-accent/10'"
                      />
                      <p class="mt-2 text-base" :class="uploadError.us1 ? 'text-red-500' : 'text-accent'">
                        {{ uploadError.us1 ? 'Please try again' : 'DRAG & DROP to upload or CLICK to select file' }}
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
                <template v-if="!usStore.isComponentDisabled('us1') && usStore.isComponentUploading('us2')">
                  <div class="flex-1 flex items-center justify-center w-full h-full absolute inset-0 bg-gray-900/30 backdrop-blur-sm z-10">
                    <p class="text-sizeMd text-accent/80">Please wait for the other file to finish processing...</p>
                  </div>
                </template>
              </div>
            </div>
            <!-- Remove File Button -->
            <button
              v-if="usStore.isComponentDisabled('us1')"
              @click="handleRemoveFile('us1')"
              class="ml-auto px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors"
            >
              <div class="flex items-center justify-center space-x-2">
                <TrashIcon class="w-3.5 h-3.5 text-red-400" />
                <span class="text-xs text-red-400">Remove</span>
              </div>
            </button>
          </div>

          <!-- Prospect's Rates Upload Zone -->
          <div class="flex flex-col gap-2">
            <h2 class="text-base text-fbWhite mb-4 font-secondary text-center uppercase">Prospect's Rates Here</h2>
            <div
              class="relative border-2 rounded-lg p-8 h-[160px] flex items-center justify-center"
              :class="[
                isDragging['us2']
                  ? 'border-accent bg-fbWhite/10'
                  : !usStore.isComponentDisabled('us2')
                  ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 '
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
                  : 'border-fbWhite',
                uploadError.us2 ? 'border-red-500 border-solid border-2' : '',
              ]"
              @dragenter.prevent="e => handleDragEnter(e, 'us2')"
              @dragleave.prevent="e => handleDragLeave(e, 'us2')"
              @dragover.prevent
              @drop.prevent="e => handleDrop(e, 'us2')"
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
                @change="e => handleFileChange(e, 'us2')"
              />

              <div class="flex flex-col h-full">
                <!-- Empty/Processing States -->
                <template v-if="!usStore.isComponentDisabled('us2') && !usStore.isComponentUploading('us2')">
                  <div class="flex items-center justify-center w-full h-full">
                    <div class="text-center w-full">
                      <!-- Error notification when there is an error -->
                      <div v-if="uploadError.us2" class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full">
                        <p class="text-red-500 font-medium">{{ uploadError.us2 }}</p>
                      </div>
                      
                      <ArrowUpTrayIcon
                        class="w-12 h-12 mx-auto border rounded-full p-2"
                        :class="uploadError.us2 ? 'text-red-500 border-red-500/50 bg-red-500/10' : 'text-accent border-accent/50 bg-accent/10'"
                      />
                      <p class="mt-2 text-base" :class="uploadError.us2 ? 'text-red-500' : 'text-accent'">
                        {{ uploadError.us2 ? 'Please try again' : 'DRAG & DROP to upload or CLICK to select file' }}
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
                <template v-if="!usStore.isComponentDisabled('us2') && usStore.isComponentUploading('us1')">
                  <div class="flex-1 flex items-center justify-center w-full h-full absolute inset-0 bg-gray-900/30 backdrop-blur-sm z-10">
                    <p class="text-sizeMd text-accent/80">Please wait for the other file to finish processing...</p>
                  </div>
                </template>
              </div>
            </div>
            <!-- Remove File Button -->
            <button
              v-if="usStore.isComponentDisabled('us2')"
              @click="handleRemoveFile('us2')"
              class="ml-auto px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors"
            >
              <div class="flex items-center justify-center space-x-2">
                <TrashIcon class="w-3.5 h-3.5 text-red-400" />
                <span class="text-xs text-red-400">Remove</span>
              </div>
            </button>
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
              <span class="text-sm text-accent">{{ isGeneratingReports ? 'GENERATING REPORTS' : 'Get Reports' }}</span>
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
      @update:mappings="handleMappingUpdate"
      @update:valid="isValid => (isModalValid = isValid)"
      @update:indeterminate-definition="definition => (indeterminateRateDefinition = definition)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue';
  import { ArrowUpTrayIcon, DocumentIcon, TrashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline';
  import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
  import { useUsStore } from '@/stores/us-store';
  // Comment out the worker import since it's not implemented yet
  // import USComparisonWorker from '@/workers/us-comparison.worker?worker';
  import { DBName } from '@/types/app-types';
  import { type USPricingReport, type USCodeReport, type USStandardizedData } from '@/types/domains/us-types';
  import { US_COLUMN_ROLE_OPTIONS } from '@/types/domains/us-types';
  import { USColumnRole } from '@/types/domains/us-types';
  import Papa from 'papaparse';
  import { USService } from '@/services/us.service';
  import { storageConfig } from '@/config/storage-config';

  // First, define a type for component IDs to ensure type safety
  type ComponentId = 'us1' | 'us2';

  // Define the USReportsInput interface inline since it might not exist in us-types.ts yet
  interface USReportsInput {
    fileName1: string;
    fileName2: string;
    file1Data: USStandardizedData[];
    file2Data: USStandardizedData[];
  }

  const usStore = useUsStore();
  const usService = new USService();
  
  // Component state
  const isGeneratingReports = ref<boolean>(false);
  const isDragging = reactive<Record<string, boolean>>({});
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
    us2: null
  });

  // Drag and drop handlers
  function handleDragEnter(event: DragEvent, componentId: ComponentId) {
    event.preventDefault();
    isDragging[componentId] = true;
    // Clear error when user initiates new drag
    uploadError[componentId] = null;
  }

  function handleDragLeave(event: DragEvent, componentId: ComponentId) {
    event.preventDefault();
    isDragging[componentId] = false;
  }

  function handleDrop(event: DragEvent, componentId: ComponentId) {
    event.preventDefault();
    isDragging[componentId] = false;

    // First check if there are files being dropped
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) {
      return;
    }

    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Clear any previous errors
    uploadError[componentId] = null;

    // Check if OTHER component is uploading (not this one)
    const otherComponent = componentId === 'us1' ? 'us2' : 'us1';
    if (usStore.isComponentUploading(otherComponent)) {
      uploadError[componentId] = "Please wait for the other file to finish uploading";
      return;
    }

    // Check file type first
    if (!file.name.toLowerCase().endsWith('.csv')) {
      uploadError[componentId] = 'Only CSV files are accepted';
      return;
    }

    // Check for duplicate filename
    if (usStore.hasExistingFile(file.name)) {
      console.log(`Error: File ${file.name} already exists`); // Debug log
      uploadError[componentId] = `A file with name "${file.name}" has already been uploaded`;
      return;
    }

    // Only proceed if component is ready for upload
    if (
      !usStore.isComponentUploading(componentId) &&
      !usStore.isComponentDisabled(componentId)
    ) {
      handleFileSelected(file, componentId);
    }
  }

  async function handleFileSelected(file: File, componentId: ComponentId) {
    if (usStore.isComponentUploading(componentId) || usStore.isComponentDisabled(componentId)) return;

    // Don't need to check for duplicates again - already done in handleDrop
    
    usStore.setComponentUploading(componentId, true);
    try {
      // Create a fake event object with the file
      const fakeEvent = {
        target: {
          files: [file]
        }
      } as unknown as Event;
      
      await handleFileChange(fakeEvent, componentId);
    } catch (error) {
      console.error('Error handling file:', error);
      uploadError[componentId] = 'Error processing file. Please try again.';
    } finally {
      usStore.setComponentUploading(componentId, false);
    }
  }

  async function handleFileUploaded(componentName: ComponentId, fileName: string) {
    console.log('adding file to store', componentName, fileName);
    usStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
  }

  async function handleReportsAction() {
    if (usStore.reportsGenerated) {
      usStore.showUploadComponents = false;
    } else {
      try {
        await generateReports();
        
        // Add a notification that reports are limited
        console.warn('Report generation is limited due to missing worker implementation');
        alert('Reports generated with limited functionality. Worker implementation is pending.');
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
      console.log('Starting report generation with files:', fileNames);

      const fileData = await Promise.all(
        fileNames.map(async fileName => {
          console.log('Loading data for file:', fileName);
          // Remove .csv extension for table name
          const tableName = fileName.toLowerCase().replace('.csv', '');
          const data = await usService.getData(tableName);
          if (!data || data.length === 0) {
            throw new Error(`No data found for file ${fileName}`);
          }
          return data;
        })
      );

      if (fileData.length === 2) {
        console.log('Making comparison with data lengths:', {
          file1Length: fileData[0].length,
          file2Length: fileData[1].length,
          storageType: storageConfig.storageType
        });

        // Ensure data is cloneable by creating a clean copy
        // This avoids issues with DataCloneError when using in-memory storage
        const cleanData1 = fileData[0].map(item => ({
          npanxx: item.npanxx,
          npa: item.npa,
          nxx: item.nxx,
          interRate: item.interRate,
          intraRate: item.intraRate,
          indetermRate: item.indetermRate
        }));
        
        const cleanData2 = fileData[1].map(item => ({
          npanxx: item.npanxx,
          npa: item.npa,
          nxx: item.nxx,
          interRate: item.interRate,
          intraRate: item.intraRate,
          indetermRate: item.indetermRate
        }));

        // Comment out worker-related code since the worker is not implemented yet
        /*
        // Create worker and process data
        const worker = new USComparisonWorker();
        const reports = await new Promise<{ pricingReport: USPricingReport; codeReport: USCodeReport }>(
          (resolve, reject) => {
            worker.onmessage = event => {
              const { pricingReport, codeReport } = event.data;
              resolve({ pricingReport, codeReport });
            };

            worker.onerror = error => {
              console.error('Worker error:', error);
              reject(error);
            };

            const input: USReportsInput = {
              fileName1: fileNames[0],
              fileName2: fileNames[1],
              file1Data: cleanData1,
              file2Data: cleanData2,
            };

            // Log the size of data being sent to worker
            console.log('Sending data to worker:', 
              `Clean data sizes: ${JSON.stringify(cleanData1).length}, ${JSON.stringify(cleanData2).length} bytes`);
              
            worker.postMessage(input);
          }
        );

        console.log('Reports generated:', {
          hasPricingReport: !!reports.pricingReport,
          hasCodeReport: !!reports.codeReport,
        });

        if (reports.pricingReport && reports.codeReport) {
          usStore.setReports(reports.pricingReport, reports.codeReport);
        }

        // Clean up worker
        worker.terminate();
        */
        
        // Add temporary placeholder for reports
        console.log('Worker not implemented yet - using placeholder reports');
        // TODO: Implement proper report generation when worker is available
        
        // Create placeholder file report that matches the USFileReport interface
        const createFileReport = (fileName: string): any => ({
          fileName,
          totalNPANXX: 0,
          uniqueNPA: 0,
          uniqueNXX: 0,
          coveragePercentage: 0,
          rateStats: {
            interstate: {
              average: 0,
              median: 0,
              min: 0,
              max: 0,
              count: 0
            },
            intrastate: {
              average: 0,
              median: 0,
              min: 0,
              max: 0,
              count: 0
            },
            indeterminate: {
              average: 0,
              median: 0,
              min: 0,
              max: 0,
              count: 0
            }
          }
        });
        
        // Create minimal placeholder reports that match the interfaces
        const placeholderPricingReport: USPricingReport = {
          file1: {
            fileName: fileNames[0],
            averageInterRate: 0,
            averageIntraRate: 0,
            averageIJRate: 0,
            medianInterRate: 0,
            medianIntraRate: 0,
            medianIJRate: 0
          },
          file2: {
            fileName: fileNames[1],
            averageInterRate: 0,
            averageIntraRate: 0,
            averageIJRate: 0,
            medianInterRate: 0,
            medianIntraRate: 0,
            medianIJRate: 0
          },
          comparison: {
            interRateDifference: 0,
            intraRateDifference: 0,
            ijRateDifference: 0,
            totalHigher: 0,
            totalLower: 0,
            totalEqual: 0
          }
        };
        
        const placeholderCodeReport: USCodeReport = {
          file1: createFileReport(fileNames[0]),
          file2: createFileReport(fileNames[1]),
          matchedCodes: 0,
          nonMatchedCodes: 0,
          matchedCodesPercentage: 0,
          nonMatchedCodesPercentage: 0
        };
        
        usStore.setReports(placeholderPricingReport, placeholderCodeReport);
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

  // File handling functions
  async function handleFileChange(event: Event, componentId: ComponentId) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    
    const file = target.files[0];
    
    // Clear file input so same file can be uploaded again after removal
    target.value = '';
    
    // Clear any previous errors
    uploadError[componentId] = null;
    
    if (usStore.hasExistingFile(file.name)) {
      uploadError[componentId] = `A file with name "${file.name}" has already been uploaded`;
      return;
    }
    
    await handleFileSelected(file, componentId);
  }

  // Modal handlers
  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }

  async function handleModalConfirm(mappings: Record<string, string>, indeterminateDefinition?: string) {
    const file = usStore.getTempFile(activeComponent.value);
    if (!file) return;

    showPreviewModal.value = false;
    usStore.setComponentUploading(activeComponent.value, true);

    try {
      // Convert mappings to column indices
      const columnMapping = {
        npanxx: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.NPANXX)?.[0] ?? -1),
        npa: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.NPA)?.[0] ?? -1),
        nxx: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.NXX)?.[0] ?? -1),
        interstate: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTERSTATE)?.[0] ?? -1),
        intrastate: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTRASTATE)?.[0] ?? -1),
        indeterminate: Number(
          Object.entries(mappings).find(([_, value]) => value === USColumnRole.INDETERMINATE)?.[0] ?? -1
        ),
      };

      console.log(`Processing file for component: ${activeComponent.value}, file: ${file.name}`);
      console.log('User selected column mapping:', mappings);
      console.log('Converted column mapping:', JSON.stringify(columnMapping, null, 2));
      
      // Log the first few lines of the file to debug format issues
      console.log('Reading file preview to verify format:');
      Papa.parse(file, {
        preview: 3,
        complete: (results) => {
          console.log('First 3 rows:', results.data);
        },
        error: (error) => {
          console.error('Error reading preview:', error);
        }
      });
      
      // Process file with mappings
      const result = await usService.processFile(file, columnMapping, startLine.value, indeterminateDefinition);
      console.log(`File processed. Valid records: ${result.records.length}`);
      
      // Make sure we're calling handleFileUploaded with the component ID
      await handleFileUploaded(activeComponent.value, result.fileName);
    } catch (error) {
      console.error('Error processing file:', error);
      uploadError[activeComponent.value] = `Error processing file: ${error instanceof Error ? error.message : String(error)}`;
      
      // If there was an error, make sure we clean up any partial data
      try {
        const tableName = file.name.toLowerCase().replace('.csv', '');
        await usService.removeTable(tableName);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
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
      await usService.removeTable(tableName);
      usStore.removeFile(componentName);
    } catch (error) {
      console.error('Error removing file:', error);
    }
  }

  // Add a debug function for testing errors
  function setTestError(componentId: ComponentId, message: string) {
    // For testing error states
    uploadError[componentId] = message;
    console.log(`Set error for ${componentId}: ${message}`);
  }

  async function checkDatabaseTables() {
    try {
      const tables = await usService.listTables();
      console.log('Current IndexedDB tables and record counts:');
      console.table(tables);
      
      // Check if tables is a Record or an array
      if (Object.keys(tables).length === 0) {
        console.warn('No tables found in the database.');
      } else {
        // Convert the tables object to array entries if it's not already an array
        const tableEntries = Array.isArray(tables) 
          ? tables 
          : Object.entries(tables).map(([tableName, recordCount]) => ({ 
              tableName, 
              recordCount 
            }));
        
        // Now iterate through the table entries
        tableEntries.forEach(table => {
          if (table.recordCount === 0) {
            console.warn(`Table '${table.tableName}' exists but contains no records.`);
          }
        });
      }
      
      return tables;
    } catch (error) {
      console.error('Error checking database tables:', error);
    }
  }
  
  // Let's run this check when components mount
  onMounted(async () => {
    await checkDatabaseTables();
  });

  async function clearAllData() {
    try {
      await usService.clearData();
      
      // Reset all component states
      inactivateAllComponents();
      
      // Clear errors and reset upload states
      Object.keys(uploadError).forEach(component => {
        const id = component as ComponentId;
        uploadError[id] = '';
      });
      
      await checkDatabaseTables();
      
      // Toast or notification
      console.log('All data has been cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  // Add missing inactivateAllComponents function
  function inactivateAllComponents() {
    // Reset states for all components
    Object.keys(isDragging).forEach(key => {
      const id = key as ComponentId;
      isDragging[id] = false;
    });
  }

  // Add back the handleFileInput function
  async function handleFileInput(event: Event, componentId: ComponentId) {
    console.log(`File input for component ${componentId}`);
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Clear any previous errors
    uploadError[componentId] = null;
    
    // Check if OTHER component is uploading (not this one)
    const otherComponent = componentId === 'us1' ? 'us2' : 'us1';
    if (usStore.isComponentUploading(otherComponent)) {
      uploadError[componentId] = "Please wait for the other file to finish uploading";
      return;
    }
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      uploadError[componentId] = 'Only CSV files are accepted';
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
      complete: results => {
        previewData.value = results.data.slice(1) as string[][];
        columns.value = results.data[0] as string[];
        activeComponent.value = componentId;
        showPreviewModal.value = true;
      },
      error: error => {
        console.error('Error parsing CSV:', error);
        usStore.clearTempFile(componentId);
        uploadError[componentId] = 'Error parsing CSV file. Please check the file format.';
      },
    });
  }
</script>
