<template>
  <div class="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
    <UploadComponent
      typeOfComponent="owner"
      :DBname="DBName.US"
      :componentName="component1"
      :disabled="usStore.isComponentDisabled(component1)"
      :columnRoleOptions="columnRoleOptions"
      :deckType="DBName.US"
      class="flex-1 flex flex-col"
      @fileUploaded="handleFileUploaded"
    />

    <UploadComponent
      typeOfComponent="carrier"
      :DBname="DBName.US"
      :componentName="component2"
      :disabled="usStore.isComponentDisabled(component2)"
      :columnRoleOptions="columnRoleOptions"
      :deckType="DBName.US"
      class="flex-1 flex flex-col"
      @fileUploaded="handleFileUploaded"
    />
  </div>

  <div class="text-center mt-8">
    <button
      v-if="!usStore.reportsGenerated"
      @click="handleReportsAction"
      :disabled="!usStore.isFull || isGeneratingReports"
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
  import { useUsStore } from '@/domains/us/store';
  import { DBName } from '@/domains/shared/types';
  import UploadComponent from '@/domains/shared/components/UploadComponent.vue';
  import useIndexedDB from '@/composables/useIndexDB';
  import { makeNpanxxReportsApi } from '@/API/api';
  import { USColumnRole, USStandardizedData } from '@/domains/us/types/us-types';
  import { useSharedStore } from '@/domains/shared/store';
  import { ColumnRoleOption } from '@/domains/shared/types';
  const usStore = useUsStore();
  const { loadFromIndexedDB } = useIndexedDB();

  const sharedStore = useSharedStore();

  const component1 = ref<string>('us1');
  const component2 = ref<string>('us2');
  const isGeneratingReports = ref<boolean>(false);

  const columnRoleOptions: ColumnRoleOption[] = [
    { value: USColumnRole.NPANXX, label: 'NPANXX' },
    { value: USColumnRole.NPA, label: 'NPA' },
    { value: USColumnRole.NXX, label: 'NXX' },
    { value: USColumnRole.INTERSTATE, label: 'InterState Rate' },
    { value: USColumnRole.INTRASTATE, label: 'IntraState Rate' },
    { value: USColumnRole.INDETERMINATE, label: 'Indeterminate Rate' },
  ];

  async function handleFileUploaded(componentName: string, fileName: string) {
    usStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
  }

  async function handleReportsAction() {
    if (usStore.reportsGenerated) {
      usStore.showUploadComponents = false;
    } else {
      await generateReports();
    }
  }

  async function generateReports() {
    isGeneratingReports.value = true;
    try {
      const fileNames = usStore.getFileNames;
      const file1Data = await loadFromIndexedDB(DBName.US, fileNames[0], sharedStore.globalDBVersion);
      const file2Data = await loadFromIndexedDB(DBName.US, fileNames[1], sharedStore.globalDBVersion);

      if (file1Data && file2Data) {
        const { pricing, code } = await makeNpanxxReportsApi({
          fileName1: fileNames[0].split('.')[0],
          fileName2: fileNames[1].split('.')[0],
          file1Data: file1Data as USStandardizedData[],
          file2Data: file2Data as USStandardizedData[],
        });

        if (pricing && code) {
          usStore.setReports(pricing, code);
        }
      }
    } catch (error) {
      console.error('Error generating reports:', error);
    } finally {
      isGeneratingReports.value = false;
    }
  }
</script>
