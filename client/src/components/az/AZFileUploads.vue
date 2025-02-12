<template>
  <div class="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
    <FileUploadZone
      v-for="(component, index) in ['az1', 'az2']"
      :key="component"
      :disabled="azStore.isComponentDisabled(component)"
      :is-processing="isProcessing[component]"
      :is-uploading="isUploading[component]"
      :file-name="files[component]?.name"
      @fileSelected="file => handleFileSelected(file, component)"
      @remove="() => handleRemoveFile(component)"
    >
      <template #default="{ isProcessing, isUploading, isDisabled, fileName }">
        <div class="flex flex-col items-center justify-center space-y-2">
          <div class="text-center">
            <template v-if="!azStore.isComponentDisabled(component) && !isProcessing && !isUploading">
              <ArrowUpTrayIcon class="w-6 h-6 text-accent mx-auto" />
              <p class="mt-2 text-sm text-foreground">Drop your AZ rate deck here or click to browse</p>
            </template>

            <template v-if="isUploading">
              <p class="mt-2 text-sm text-mutedForeground">Uploading file...</p>
            </template>

            <template v-if="isProcessing">
              <p class="text-sm text-muted">Processing your file...</p>
            </template>

            <template v-if="azStore.isComponentDisabled(component) && !isProcessing && !isUploading">
              <p class="mt-2 text-sm text-foreground">
                {{ fileName || 'File uploaded successfully' }}
              </p>
              <div class="relative z-10">
                <button
                  @click="() => handleRemoveFile(component)"
                  class="border border-white/20 hover:bg-muted/80 transition-all text-xl rounded-md px-2 mt-4"
                >
                  &times;
                </button>
              </div>
            </template>
          </div>
        </div>
      </template>
    </FileUploadZone>

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
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline';
  import PreviewModal from '@/components/shared/PreviewModal.vue';
  import { useAzStore } from '@/stores/az-store';
  import { useFileUpload } from '@/composables/useFileUpload';
  import { useAZFileHandler } from '@/composables/useAZFileHandler';
  import useDexieDB from '@/composables/useDexieDB';
  import AzComparisonWorker from '@/workers/az-comparison.worker?worker';
  import type { AzPricingReport, AzCodeReport, AZReportsInput, AZStandardizedData } from '@/types/az-types';
  import { DBName } from '@/types/app-types';
  import FileUploadZone from '@/components/shared/FileUploadZone.vue';

  const azStore = useAzStore();
  const { loadFromDexieDB } = useDexieDB();

  // Component state
  const component1 = ref<string>('az1');
  const component2 = ref<string>('az2');
  const isGeneratingReports = ref<boolean>(false);

  const { isDragging, isProcessing, isUploading, handleDragEnter, handleDragLeave, setProcessing, setUploading } =
    useFileUpload({
      onFileAccepted: async (file: File, componentId: string) => {
        try {
          await handleFileInput({ target: { files: [file] } } as unknown as Event, componentId);
        } catch (error) {
          console.error('Error handling dropped file:', error);
        }
      },
    });

  const {
    files,
    showPreviewModal,
    previewData,
    columns,
    columnRoles,
    columnRoleOptions,
    startLine,
    activeComponent,
    handleFileInput,
    handleModalConfirm,
    handleModalCancel,
  } = useAZFileHandler();

  async function handleFileSelected(file: File, componentId: string) {
    setProcessing(componentId, true);
    try {
      await handleFileInput({ target: { files: [file] } } as unknown as Event, componentId);
    } catch (error) {
      console.error('Error handling selected file:', error);
    } finally {
      setProcessing(componentId, false);
    }
  }

  async function handleFileUploaded(componentName: string, fileName: string) {
    console.log('adding file to store', componentName, fileName);
    azStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
  }

  async function handleRemoveFile(componentName: string) {
    try {
      azStore.removeFile(componentName);
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
  // Modal handling implementation...
  // Report generation implementation...
</script>
