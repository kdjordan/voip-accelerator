<template>
  <div
    class="flex flex-col items-center"
    id="az-file-uploads"
  >
    <div class="mb-4 text-center">
      <p
        v-if="!azStore.isFull"
        class="text-center text-sizeBase text-foreground mb-8"
      >
        Upload
        <span class="uppercase text-white">your</span>
        current rates and the rates of your
        <span class="uppercase text-white">prospective carrier.</span>
        <br />
        We will generate you a report showing the best opportunities for you to buy and sell.
      </p>
    </div>
    <div
      v-if="azStore.reportsGenerated"
      class="flex justify-center my-4"
    >
      <button
        v-for="type in reportTypes"
        :key="type"
        @click="azStore.setActiveReportType(type)"
        :class="[
          'py-3 px-6 mx-2 rounded-lg transition-colors',
          {
            'btn-active': azStore.activeReportType === type,
            'btn-inactive': azStore.activeReportType !== type,
          },
        ]"
      >
        <span v-if="type !== 'files'"> {{ type.charAt(0).toUpperCase() + type.slice(1) }} Report </span>
        <span v-else>
          {{ type.charAt(0).toUpperCase() + type.slice(1) }}
        </span>
      </button>
      <button
        @click="handleReset"
        class="btn-lg btn-destructive"
      >
        Reset
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useAzStore } from '@/stores/az-store';
  import { ReportTypes, type ReportType } from '@/types';
  import useDexieDB from '@/composables/useDexieDB';
  import { DBName } from '@/types';

  const azStore = useAzStore();
  const { deleteObjectStore, deleteDatabase } = useDexieDB();

  const reportTypes: ReportType[] = [ReportTypes.FILES, ReportTypes.CODE, ReportTypes.PRICING];

  async function handleReset() {
    try {
      console.log('Resetting the AZ report');

      // Get current file names before resetting store
      const fileNames = azStore.getFileNames;
      console.log('Cleaning up stores:', fileNames);

      // Reset store state
      azStore.resetFiles();
      azStore.setActiveReportType('files');

      // Clean up Dexie stores using actual file names
      if (fileNames.length > 0) {
        await Promise.all(fileNames.map(fileName => deleteObjectStore(DBName.AZ, fileName)));
      }

      console.log('Reset completed successfully');
    } catch (error) {
      console.error('Error during reset:', error);
    }
  }
</script>
