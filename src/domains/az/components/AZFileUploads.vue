<template>
  <div class="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
    <UploadComponent
      typeOfComponent="owner"
      :DBname="DBName.AZ"
      :componentName="component1"
      :disabled="azStore.isComponentDisabled(component1)"
      :columnRoleOptions="columnRoleOptions"
      class="flex-1 flex flex-col"
      @fileUploaded="handleFileUploaded"
      @fileDeleted="handleRemoveFile"
    />

    <UploadComponent
      typeOfComponent="client"
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
  import { AZColumnRole, type AZStandardizedData } from '@/domains/az/types/az-types';
  import { DBName, type DBNameType } from '@/domains/shared/types';
  import UploadComponent from '@/domains/shared/components/UploadComponent.vue';
  import useIndexedDB from '@/composables/useIndexDB';
  import { makeAzReportsApi } from '@/API/api';
  import { useAzStore } from '@/domains/az/store';
  import { useSharedStore } from '@/domains/shared/store';

  const azStore = useAzStore();
  const { loadFromIndexedDB } = useIndexedDB();
  const sharedStore = useSharedStore();

  const component1 = ref<string>('az1');
  const component2 = ref<string>('az2');
  const isGeneratingReports = ref<boolean>(false);

  const columnRoleOptions = [
    { value: AZColumnRole.Destination, label: 'Destination Name' },
    { value: AZColumnRole.DialCode, label: 'Dial Code' },
    { value: AZColumnRole.Rate, label: 'Rate' },
  ];

  async function handleFileUploaded(componentName: string, fileName: string) {
    console.log('adding file to store', componentName, fileName);
    azStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
  }

  async function handleRemoveFile(componentName: string, DBname: DBNameType) {
    console.log('Removing file for component:', componentName);
    try {
      const { deleteObjectStore } = useIndexedDB();
      const storeName = `${componentName}-store`;

      // Remove from IndexedDB
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
      const file1Data = await loadFromIndexedDB(
        DBName.AZ as DBNameType,
        fileNames[0],
        sharedStore.globalDBVersion
      );
      const file2Data = await loadFromIndexedDB(
        DBName.AZ as DBNameType,
        fileNames[1],
        sharedStore.globalDBVersion
      );

      if (file1Data && file2Data) {
        const { pricingReport, codeReport } = await makeAzReportsApi({
          fileName1: fileNames[0].split('.')[0],
          fileName2: fileNames[1].split('.')[0],
          file1Data: file1Data as AZStandardizedData[],
          file2Data: file2Data as AZStandardizedData[],
        });

        if (pricingReport && codeReport) {
          azStore.setReports(pricingReport, codeReport);
        }
      }
    } catch (error) {
      console.error('Error generating reports:', error);
    } finally {
      isGeneratingReports.value = false;
    }
  }
</script>
