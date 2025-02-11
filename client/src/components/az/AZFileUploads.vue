<template>
  <div class="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
    <UploadComponent
      typeOfComponent="owner"
      :DBname="DBName.AZ"
      :componentName="component1"
      :disabled="azStore.isComponentDisabled(component1)"
      :columnRoleOptions="columnRoleOptions"
      deckType="az"
      class="flex-1 flex flex-col"
      @fileUploaded="handleFileUploaded"
      @fileDeleted="handleRemoveFile"
    />

    <UploadComponent
      typeOfComponent="carrier"
      :DBname="DBName.AZ"
      :componentName="component2"
      :disabled="azStore.isComponentDisabled(component2)"
      :columnRoleOptions="columnRoleOptions"
      class="flex-1 flex flex-col"
      @fileUploaded="handleFileUploaded"
      @fileDeleted="handleRemoveFile"
    />
  </div>

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
  import { ref } from 'vue';
  import { AZColumnRole, type AZStandardizedData } from '@/types/az-types';
  import { DBName, type DBNameType } from '@/types/app-types';
  import UploadComponent from '@/components/shared/UploadComponent.vue';
  import useIndexedDB from '@/composables/xxuseIndexDB';
  import AzComparisonWorker from '@/workers/az-comparison.worker?worker';
  import type { AzPricingReport, AzCodeReport, AZReportsInput } from '@/types/az-types';
  import { useAzStore } from '@/stores/az-store';
  import useDexieDB from '@/composables/useDexieDB';

  const azStore = useAzStore();
  const { loadFromDexieDB } = useDexieDB();

  const component1 = ref<string>('az1');
  const component2 = ref<string>('az2');
  const isGeneratingReports = ref<boolean>(false);

  const columnRoleOptions = [
    { value: AZColumnRole.DESTINATION, label: 'Destination Name' },
    { value: AZColumnRole.DIALCODE, label: 'Dial Code' },
    { value: AZColumnRole.RATE, label: 'Rate' },
  ];

  async function handleFileUploaded(componentName: string, fileName: string) {
    console.log('adding file to store', componentName, fileName);
    azStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
  }

  async function handleRemoveFile(componentName: string, DBname: DBNameType) {
    try {
      const { deleteObjectStore } = useIndexedDB();
      const storeName = `${componentName}-store`;
      await deleteObjectStore(DBname, storeName);
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
</script>
