<template>
  <div class="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
    <!-- Carrier A Upload Zone -->
    <div
      class="relative border-2 border-dashed rounded-lg p-6 min-h-[160px]"
      :class="[
        isDragging['az1'] ? 'border-accent bg-fbWhite/10' : 'hover:border-accent-hover hover:bg-fbWhite/10',
        isProcessing['az1'] ? 'animate-pulse border-muted bg-muted/30 cursor-not-allowed' : 'cursor-pointer',
        azStore.isComponentDisabled('az1') ? 'border-gray-500 bg-gray-800/50' : 'border-fbWhite',
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
        :disabled="isProcessing['az1'] || azStore.isComponentDisabled('az1')"
        @change="e => handleFileInput(e, 'az1')"
      />

      <div class="flex flex-col h-full">
        <!-- Empty/Processing States -->
        <template v-if="!azStore.isComponentDisabled('az1') && !isProcessing['az1']">
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <ArrowUpTrayIcon class="w-6 h-6 text-accent mx-auto" />
              <p class="mt-2 text-sm text-foreground">Drop Carrier A rate deck here or click to browse</p>
            </div>
          </div>
        </template>

        <template v-if="isProcessing['az1']">
          <div class="flex-1 flex items-center justify-center">
            <p class="text-sm text-muted animate-pulse">Processing your file...</p>
          </div>
        </template>

        <!-- File Uploaded State -->
        <template v-if="azStore.isComponentDisabled('az1')">
          <!-- Centered File Info -->
          <div class="flex-1 flex items-center justify-center">
            <div class="flex items-center space-x-2">
              <DocumentIcon class="w-5 h-5 text-accent" />
              <p class="text-sm text-foreground">{{ files['az1']?.name }}</p>
            </div>
          </div>

          <!-- Bottom Remove Button -->
          <div class="flex justify-center mt-4">
            <button
              @click="handleRemoveFile('az1')"
              class="flex items-center space-x-2 px-3 py-1.5 rounded-md border border-red-500/20 hover:bg-red-500/10 transition-all duration-200"
            >
              <TrashIcon class="w-4 h-4 text-red-500" />
              <span class="text-sm text-red-500">Remove File</span>
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- Carrier B Upload Zone -->
    <div
      class="relative border-2 border-dashed rounded-lg p-6 min-h-[160px]"
      :class="[
        isDragging['az2'] ? 'border-accent bg-fbWhite/10' : 'hover:border-accent-hover hover:bg-fbWhite/10',
        isProcessing['az2'] ? 'animate-pulse border-muted bg-muted/30 cursor-not-allowed' : 'cursor-pointer',
        azStore.isComponentDisabled('az2') ? 'border-gray-500 bg-gray-800/50' : 'border-fbWhite',
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
        :disabled="isProcessing['az2'] || azStore.isComponentDisabled('az2')"
        @change="e => handleFileInput(e, 'az2')"
      />

      <div class="flex flex-col h-full">
        <!-- Empty/Processing States -->
        <template v-if="!azStore.isComponentDisabled('az2') && !isProcessing['az2']">
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <ArrowUpTrayIcon class="w-6 h-6 text-accent mx-auto" />
              <p class="mt-2 text-sm text-foreground">Drop Carrier B rate deck here or click to browse</p>
            </div>
          </div>
        </template>

        <template v-if="isProcessing['az2']">
          <div class="flex-1 flex items-center justify-center">
            <p class="text-sm text-muted animate-pulse">Processing your file...</p>
          </div>
        </template>

        <!-- File Uploaded State -->
        <template v-if="azStore.isComponentDisabled('az2')">
          <!-- Centered File Info -->
          <div class="flex-1 flex items-center justify-center">
            <div class="flex items-center space-x-2">
              <DocumentIcon class="w-5 h-5 text-accent" />
              <p class="text-sm text-foreground">{{ files['az2']?.name }}</p>
            </div>
          </div>

          <!-- Bottom Remove Button -->
          <div class="flex justify-center mt-4">
            <button
              @click="handleRemoveFile('az2')"
              class="flex items-center space-x-2 px-3 py-1.5 rounded-md border border-red-500/20 hover:bg-red-500/10 transition-all duration-200"
            >
              <TrashIcon class="w-4 h-4 text-red-500" />
              <span class="text-sm text-red-500">Remove File</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- Preview Modal -->
  <PreviewModal
    v-if="showPreviewModal"
    :showModal="showPreviewModal"
    :columns="columns"
    :previewData="previewData"
    :columnRoles="columnRoles"
    :startLine="startLine"
    :columnRoleOptions="columnRoleOptions"
    :deckType="DBName.AZ"
    @confirm="handleModalConfirm"
    @cancel="handleModalCancel"
  />

  <!-- Reports Button -->
  <div class="text-center mt-8">
    <button
      v-if="!azStore.reportsGenerated"
      @click="handleReportsAction"
      :disabled="!azStore.isFull || isGeneratingReports"
      :class="[
        'btn-accent btn-lg',
        isGeneratingReports && 'animate-pulse',
        'disabled:bg-transparent',
        'disabled:opacity-50',
        'disabled:cursor-not-allowed',
      ]"
    >
      {{ isGeneratingReports ? 'GENERATING REPORTS' : 'Get Reports' }}
    </button>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue';
  import { ArrowUpTrayIcon, DocumentIcon, TrashIcon } from '@heroicons/vue/24/outline';
  import PreviewModal from '@/components/shared/PreviewModal.vue';
  import { useAzStore } from '@/stores/az-store';
  import useDexieDB from '@/composables/useDexieDB';
  import AzComparisonWorker from '@/workers/az-comparison.worker?worker';
  import type { AzPricingReport, AzCodeReport, AZReportsInput, AZStandardizedData } from '@/types/az-types';
  import { DBName } from '@/types/app-types';
  import { AZColumnRole } from '@/types/az-types';
  import Papa from 'papaparse';
  import { AZService } from '@/services/az.service';

  const azStore = useAzStore();
  const { loadFromDexieDB } = useDexieDB();
  const azService = new AZService();

  // Component state
  const files = reactive<Record<string, File | null>>({});
  const isDragging = reactive<Record<string, boolean>>({});
  const isProcessing = reactive<Record<string, boolean>>({});
  const isUploading = reactive<Record<string, boolean>>({});
  const isGeneratingReports = ref(false);

  // Preview state
  const showPreviewModal = ref(false);
  const previewData = ref<string[][]>([]);
  const columns = ref<string[]>([]);
  const columnRoles = ref<string[]>([]);
  const startLine = ref(1);
  const activeComponent = ref<string>('');

  // AZ-specific column options
  const columnRoleOptions = [
    { value: AZColumnRole.DESTINATION, label: 'Destination Name' },
    { value: AZColumnRole.DIALCODE, label: 'Dial Code' },
    { value: AZColumnRole.RATE, label: 'Rate' },
  ];

  onMounted(() => {
    // azService.value = new AZService();
  });

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

    if (!isProcessing[componentId] && event.dataTransfer?.files) {
      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileSelected(file, componentId);
      }
    }
  }

  async function handleFileSelected(file: File, componentId: string) {
    if (isProcessing[componentId]) return;

    isProcessing[componentId] = true;
    try {
      await handleFileInput({ target: { files: [file] } } as unknown as Event, componentId);
    } catch (error) {
      console.error('Error handling file:', error);
    } finally {
      isProcessing[componentId] = false;
    }
  }

  async function handleFileUploaded(componentName: string, fileName: string) {
    console.log('adding file to store', componentName, fileName);
    azStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
  }

  async function handleRemoveFile(componentName: string) {
    console.log('removing file from store', componentName);
    try {
      const fileName = files[componentName]?.name;
      if (!fileName) return;

      // Get table name that was created for this file
      const tableName = fileName.toLowerCase().replace('.csv', '');

      // Remove from Dexie
      await azService.removeTable(tableName);

      // Remove from store
      azStore.removeFile(componentName);

      // Reset file state
      files[componentName] = null;
    } catch (error) {
      console.error('Error removing file:', error);
    }
  }

  async function handleReportsAction() {
    if (azStore.reportsGenerated) {
      azStore.showUploadComponents = false;
    } else {
      await generateReports();
    }
  }

  async function generateReports() {
    isGeneratingReports.value = true;
    try {
      const fileNames = azStore.getFileNames;
      console.log('File names from store:', fileNames);

      const file1Data = await loadFromDexieDB(DBName.AZ, fileNames[0]);
      console.log('File 1 data loaded:', { length: file1Data?.length, sample: file1Data?.[0] });

      const file2Data = await loadFromDexieDB(DBName.AZ, fileNames[1]);
      console.log('File 2 data loaded:', { length: file2Data?.length, sample: file2Data?.[0] });

      if (file1Data && file2Data) {
        console.log('Making comparison with data lengths:', {
          file1Length: file1Data.length,
          file2Length: file2Data.length,
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
              fileName1: fileNames[0],
              fileName2: fileNames[1],
              file1Data: file1Data as AZStandardizedData[],
              file2Data: file2Data as AZStandardizedData[],
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

    files[componentId] = file;

    // Generate preview using Papa Parse
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
      },
    });
  }

  // Modal handlers
  async function handleModalConfirm(confirmation: { columnRoles: string[]; startLine: number }) {
    const file = files[activeComponent.value];
    if (!file) return;

    // Close modal immediately
    showPreviewModal.value = false;

    // Show processing state
    isProcessing[activeComponent.value] = true;
    isUploading[activeComponent.value] = true;

    try {
      const columnMapping = {
        destination: confirmation.columnRoles.indexOf(AZColumnRole.DESTINATION),
        dialcode: confirmation.columnRoles.indexOf(AZColumnRole.DIALCODE),
        rate: confirmation.columnRoles.indexOf(AZColumnRole.RATE),
      };

      // Process file independently
      const result = await azService.processFile(file, columnMapping, confirmation.startLine);

      // Update store after successful processing
      await handleFileUploaded(activeComponent.value, result.fileName);
    } catch (error) {
      console.error('Error processing file:', error);
      // TODO: Show error state in upload zone
    } finally {
      isUploading[activeComponent.value] = false;
      isProcessing[activeComponent.value] = false;
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    files[activeComponent.value] = null;
    activeComponent.value = '';
  }
</script>
