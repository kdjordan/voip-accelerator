<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- Upload Zones Box -->
    <div class="bg-gray-800 rounded-b-lg p-6">
      <div class="pb-4 mb-6">
        <div class="grid grid-cols-2 gap-8">
          <!-- Carrier A Upload Zone -->
          <div class="flex flex-col gap-2">
            <h2 class="text-base text-fbWhite mb-4">Your Rates Here</h2>
            <div
              class="relative border-2 rounded-lg p-8 min-h-[120px] flex items-center justify-center"
              :class="[
                isDragging['az1']
                  ? 'border-accent bg-fbWhite/10'
                  : !azStore.isComponentDisabled('az1')
                  ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 dashed'
                  : '',
                azStore.isComponentUploading('az1')
                  ? 'animate-upload-pulse cursor-not-allowed'
                  : !azStore.isComponentDisabled('az1')
                  ? 'cursor-pointer'
                  : '',
                azStore.isComponentDisabled('az1')
                  ? 'bg-accent/20 border-2 border-solid border-accent/50'
                  : 'border-fbWhite',
                uploadError ? 'border-red-500' : '',
              ]"
              @dragenter.prevent="e => handleDragEnter(e, 'az1')"
              @dragleave.prevent="e => handleDragLeave(e, 'az1')"
              @dragover.prevent
              @drop.prevent="e => handleDrop(e, 'az1')"
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
                @change="e => handleFileInput(e, 'az1')"
              />

              <div class="flex flex-col h-full">
                <!-- Empty/Processing States -->
                <template v-if="!azStore.isComponentDisabled('az1') && !azStore.isComponentUploading('az1')">
                  <div class="flex-1 flex items-center justify-center">
                    <div class="text-center">
                      <ArrowUpTrayIcon class="w-6 h-6 text-accent mx-auto" />
                      <p class="mt-2 text-base text-foreground">Drop YOUR rate deck here or click to select</p>
                    </div>
                  </div>
                </template>

                <template v-if="azStore.isComponentUploading('az1')">
                  <div
                    class="flex-1 flex items-center justify-center bg-accent/10 animate-upload-pulse w-full h-full absolute inset-0"
                  >
                    <p class="text-sizeMd text-accent">Processing your file...</p>
                  </div>
                </template>

                <!-- File Uploaded State -->
                <template v-if="azStore.isComponentDisabled('az1')">
                  <!-- Centered File Info -->
                  <div class="flex-1 flex items-center justify-center">
                    <div class="flex items-center space-x-2">
                      <DocumentIcon class="w-5 h-5 text-accent" />
                      <p class="text-sizeLg text-accent">
                        {{ azStore.getFileNameByComponent('az1') }}
                      </p>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <!-- Remove File Button -->
            <button
              v-if="azStore.isComponentDisabled('az1')"
              @click="handleRemoveFile('az1')"
              class="ml-auto px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors"
            >
              <div class="flex items-center justify-center space-x-2">
                <TrashIcon class="w-3.5 h-3.5 text-red-400" />
                <span class="text-xs text-red-400">Remove</span>
              </div>
            </button>
          </div>

          <!-- Carrier B Upload Zone -->
          <div class="flex flex-col gap-2">
            <h2 class="text-base text-fbWhite mb-4">Prospect's Rates Here</h2>
            <div
              class="relative border-2 rounded-lg p-8 min-h-[120px] flex items-center justify-center"
              :class="[
                isDragging['az2']
                  ? 'border-accent bg-fbWhite/10'
                  : !azStore.isComponentDisabled('az2')
                  ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 '
                  : '',
                azStore.isComponentUploading('az2')
                  ? 'animate-upload-pulse cursor-not-allowed'
                  : !azStore.isComponentDisabled('az2')
                  ? 'cursor-pointer'
                  : '',
                azStore.isComponentDisabled('az2')
                  ? 'bg-accent/20 border-2 border-solid border-accent/50'
                  : 'border-fbWhite',
                uploadError ? 'border-red-500' : '',
              ]"
              @dragenter.prevent="e => handleDragEnter(e, 'az2')"
              @dragleave.prevent="e => handleDragLeave(e, 'az2')"
              @dragover.prevent
              @drop.prevent="e => handleDrop(e, 'az2')"
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
                @change="e => handleFileInput(e, 'az2')"
              />

              <div class="flex flex-col h-full">
                <!-- Empty/Processing States -->
                <template v-if="!azStore.isComponentDisabled('az2') && !azStore.isComponentUploading('az2')">
                  <div class="flex-1 flex items-center justify-center">
                    <div class="text-center">
                      <ArrowUpTrayIcon class="w-6 h-6 text-accent mx-auto" />
                      <p class="mt-2 text-base text-foreground">
                        Drop the PROSPECT'S rate deck here or click to browse
                      </p>
                    </div>
                  </div>
                </template>

                <template v-if="azStore.isComponentUploading('az2')">
                  <div
                    class="flex-1 flex items-center justify-center bg-accent/10 animate-upload-pulse w-full h-full absolute inset-0"
                  >
                    <p class="text-sizeMd text-accent">Processing your file...</p>
                  </div>
                </template>

                <!-- File Uploaded State -->
                <template v-if="azStore.isComponentDisabled('az2')">
                  <!-- Centered File Info -->
                  <div class="flex-1 flex items-center justify-center">
                    <div class="flex items-center space-x-2">
                      <DocumentIcon class="w-5 h-5 text-accent" />
                      <p class="text-sizeLg text-accent">
                        {{ azStore.getFileNameByComponent('az2') }}
                      </p>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <!-- Remove File Button -->
            <button
              v-if="azStore.isComponentDisabled('az2')"
              @click="handleRemoveFile('az2')"
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
      <div class="border-t border-gray-700/50">
        <!-- Reports Button -->
        <div class="flex justify-end mt-8">
          <button
            v-if="!azStore.reportsGenerated"
            @click="handleReportsAction"
            :disabled="!azStore.isFull || isGeneratingReports"
            class="px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:border disabled:border-gray-700"
            :class="{ 'animate-pulse': isGeneratingReports }"
          >
            <div class="flex items-center justify-center space-x-2">
              <ArrowRightIcon class="w-4 h-4 text-accent" />
              <span class="text-sm text-accent">{{ isGeneratingReports ? 'GENERATING REPORTS' : 'Get Reports' }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- New Preview Modal -->
    <PreviewModal2
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :start-line="startLine"
      :column-options="AZ_COLUMN_ROLE_OPTIONS"
      @update:mappings="handleMappingUpdate"
      @update:valid="isValid => (isModalValid = isValid)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import { ArrowUpTrayIcon, DocumentIcon, TrashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline';
  import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
  import { useAzStore } from '@/stores/az-store';
  import useDexieDB from '@/composables/useDexieDB';
  import AzComparisonWorker from '@/workers/az-comparison.worker?worker';
  import type { AzPricingReport, AzCodeReport, AZReportsInput, AZStandardizedData } from '@/types/az-types';
  import { AZ_COLUMN_ROLE_OPTIONS } from '@/types/az-types';
  import { DBName } from '@/types/app-types';
  import { AZColumnRole } from '@/types/az-types';
  import Papa from 'papaparse';
  import { AZService } from '@/services/az.service';

  const azStore = useAzStore();
  const { loadFromDexieDB } = useDexieDB();
  const azService = new AZService();

  const isDragging = reactive<Record<string, boolean>>({});

  const isGeneratingReports = ref(false);

  // Preview state
  const showPreviewModal = ref(false);
  const previewData = ref<string[][]>([]);
  const columns = ref<string[]>([]);
  const startLine = ref(1);
  const activeComponent = ref<string>('');

  // Preview state
  const isModalValid = ref(false);
  const columnMappings = ref<Record<string, string>>({});

  // Add new ref
  const uploadError = ref<string | null>(null);

  // Drag and drop handlers
  function handleDragEnter(event: DragEvent, componentId: string) {
    event.preventDefault();
    isDragging[componentId] = true;
  }

  function handleDragLeave(event: DragEvent, componentId: string) {
    event.preventDefault();
    isDragging[componentId] = false;
  }

  function handleDrop(event: DragEvent, componentId: string) {
    event.preventDefault();
    isDragging[componentId] = false;

    // Add check for disabled state and other processing
    if (
      !azStore.isComponentUploading(componentId) &&
      !azStore.isComponentDisabled(componentId) &&
      !azStore.isComponentUploading('az1') &&
      !azStore.isComponentUploading('az2') &&
      event.dataTransfer?.files
    ) {
      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileSelected(file, componentId);
      }
    }
  }

  async function handleFileSelected(file: File, componentId: string) {
    if (azStore.isComponentUploading(componentId) || azStore.isComponentDisabled(componentId)) return;

    // Clear previous errors
    uploadError.value = null;

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      uploadError.value = 'Only CSV files are accepted';
      return;
    }

    if (azStore.hasExistingFile(file.name)) {
      uploadError.value = 'A file with this name has already been uploaded';
      return;
    }

    azStore.setComponentUploading(componentId, true);
    try {
      await handleFileInput({ target: { files: [file] } } as unknown as Event, componentId);
    } catch (error) {
      console.error('Error handling file:', error);
    } finally {
      azStore.setComponentUploading(componentId, false);
    }
  }

  async function handleFileUploaded(componentName: string, fileName: string) {
    console.log('adding file to store', componentName, fileName);
    azStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
  }

  async function handleRemoveFile(componentName: string) {
    try {
      const fileName = azStore.getFileNameByComponent(componentName);
      if (!fileName) return;

      const tableName = fileName.toLowerCase().replace('.csv', '');
      await azService.removeTable(tableName);
      azStore.removeFile(componentName);
    } catch (error) {
      console.error('Error removing file:', error);
    }
  }

  async function handleReportsAction() {
    if (!azStore.isFull || isGeneratingReports.value) return;

    isGeneratingReports.value = true;
    try {
      console.log('Starting report generation with files:', azStore.getFileNames);

      // Load data from DexieDB
      const fileData = await Promise.all(
        azStore.getFileNames.map(async fileName => {
          console.log('Loading data for file:', fileName);
          // Remove .csv extension for store name
          const storeName = fileName.toLowerCase().replace('.csv', '');
          const data = await loadFromDexieDB(DBName.AZ, storeName);
          if (!data) {
            throw new Error(`No data found for file ${fileName}`);
          }
          return data as AZStandardizedData[];
        })
      );

      if (fileData.length === 2) {
        console.log('Making comparison with data lengths:', {
          file1Length: fileData[0].length,
          file2Length: fileData[1].length,
        });

        // Create worker and process data
        const worker = new AzComparisonWorker();
        const reports = await new Promise<{ pricingReport: AzPricingReport; codeReport: AzCodeReport }>(
          (resolve, reject) => {
            worker.onmessage = event => {
              const { pricingReport, codeReport } = event.data;
              resolve({ pricingReport, codeReport });
            };

            worker.onerror = error => {
              console.error('Worker error:', error);
              reject(error);
            };

            const input: AZReportsInput = {
              fileName1: azStore.getFileNames[0],
              fileName2: azStore.getFileNames[1],
              file1Data: fileData[0],
              file2Data: fileData[1],
            };

            worker.postMessage(input);
          }
        );

        console.log('Reports generated:', {
          hasPricingReport: !!reports.pricingReport,
          hasCodeReport: !!reports.codeReport,
        });

        if (reports.pricingReport && reports.codeReport) {
          azStore.setReports(reports.pricingReport, reports.codeReport);
        }

        // Clean up worker
        worker.terminate();
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

  // File handling implementation...
  async function handleFileInput(event: Event, componentId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    azStore.setTempFile(componentId, file);

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
        azStore.clearTempFile(componentId);
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
      // Convert the new mappings format to the expected columnMapping format
      const columnMapping = {
        destination: Number(
          Object.entries(mappings).find(([_, value]) => value === AZColumnRole.DESTINATION)?.[0] ?? -1
        ),
        dialcode: Number(Object.entries(mappings).find(([_, value]) => value === AZColumnRole.DIALCODE)?.[0] ?? -1),
        rate: Number(Object.entries(mappings).find(([_, value]) => value === AZColumnRole.RATE)?.[0] ?? -1),
      };

      const result = await azService.processFile(file, columnMapping, startLine.value);
      await handleFileUploaded(activeComponent.value, result.fileName);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      azStore.setComponentUploading(activeComponent.value, false);
      azStore.clearTempFile(activeComponent.value);
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    azStore.clearTempFile(activeComponent.value);
    activeComponent.value = '';
  }

  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }
</script>
