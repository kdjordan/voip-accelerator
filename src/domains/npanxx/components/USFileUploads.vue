<template>
  <div class="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
    <UploadComponent
      typeOfComponent="owner"
      :DBname="DBName.US"
      :componentName="component1"
      :disabled="npanxxStore.isComponentDisabled(component1)"
      :columnRoleOptions="columnRoleOptions"
      :deckType="DBName.US"
      class="flex-1 flex flex-col"
      @fileUploaded="handleFileUploaded"
    />

    <UploadComponent
      typeOfComponent="carrier"
      :DBname="DBName.US"
      :componentName="component2"
      :disabled="npanxxStore.isComponentDisabled(component2)"
      :columnRoleOptions="columnRoleOptions"
      :deckType="DBName.US"
      class="flex-1 flex flex-col"
      @fileUploaded="handleFileUploaded"
    />
  </div>

  <div class="text-center mt-8">
    <button
      v-if="!npanxxStore.reportsGenerated"
      @click="handleReportsAction"
      :disabled="!npanxxStore.isFull || isGeneratingReports"
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
  import { useNpanxxStore } from '@/domains/npanxx/store';
  import { DBName } from '@/domains/shared/types/base-types';
  import UploadComponent from '@/domains/shared/components/UploadComponent.vue';
  import useIndexedDB from '@/composables/useIndexDB';
  import type { USStandardizedData } from '@/domains/npanxx/types/npanxx-types';
  import { makeNpanxxReportsApi } from '@/API/api';
  import { USColumnRole, type ColumnRoleOption } from '@/domains/npanxx/types/npanxx-types';
  import { useSharedStore } from '@/domains/shared/store';
  const npanxxStore = useNpanxxStore();
  const { loadFromIndexedDB } = useIndexedDB();

  const sharedStore = useSharedStore();

  const component1 = ref<string>('us1');
  const component2 = ref<string>('us2');
  const isGeneratingReports = ref<boolean>(false);

  const columnRoleOptions: ColumnRoleOption[] = [
    { value: USColumnRole.NPANXX, label: 'NPANXX' },
    { value: USColumnRole.NPA, label: 'NPA' },
    { value: USColumnRole.NXX, label: 'NXX' },
    { value: USColumnRole.InterRate, label: 'InterState Rate' },
    { value: USColumnRole.IntraRate, label: 'IntraState Rate' },
    { value: USColumnRole.IJRate, label: 'Indeterminate Rate' },
  ];

  async function handleFileUploaded(componentName: string, fileName: string) {
    npanxxStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
  }

  async function handleReportsAction() {
    if (npanxxStore.reportsGenerated) {
      npanxxStore.showUploadComponents = false;
    } else {
      await generateReports();
    }
  }

  async function generateReports() {
    isGeneratingReports.value = true;
    try {
      const fileNames = npanxxStore.getFileNames;
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
          npanxxStore.setReports(pricing, code);
        }
      }
    } catch (error) {
      console.error('Error generating reports:', error);
    } finally {
      isGeneratingReports.value = false;
    }
  }
</script>
