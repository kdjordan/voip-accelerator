<template>
  <div
    class="flex flex-col items-center"
    id="us-file-uploads"
  >
    <div class="mb-4 text-center">
      <p
        v-if="!usStore.isFull"
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
      v-if="usStore.reportsGenerated"
      class="flex justify-center my-4"
    >
      <button
        v-for="type in reportTypes"
        :key="type"
        @click="usStore.setActiveReportType(type)"
        :class="[
          'py-3 px-6 mx-2 rounded-lg transition-colors',
          {
            'btn-active': usStore.activeReportType === type,
            'btn-inactive': usStore.activeReportType !== type,
          },
        ]"
      >
        <span v-if="type !== ReportTypes.FILES"> {{ type.charAt(0).toUpperCase() + type.slice(1) }} Report </span>
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
  import { useUsStore } from '@/stores/us-store';
  import { ReportTypes, type ReportType } from '@/types/app-types';
  import useDexieDB from '@/composables/useDexieDB';
  import { DBName } from '@/types';

  const usStore = useUsStore();
  const { deleteObjectStore } = useDexieDB();

  const reportTypes: readonly ReportType[] = [ReportTypes.FILES, ReportTypes.CODE, ReportTypes.PRICING] as const;

  async function handleReset() {
    try {
      console.log('Resetting the US report');

      // Get current file names before resetting store
      const fileNames = usStore.getFileNames;
      console.log('Cleaning up stores:', fileNames);

      // Reset store state
      usStore.resetFiles();
      usStore.setActiveReportType(ReportTypes.FILES);

      // Clean up Dexie stores using actual file names
      if (fileNames.length > 0) {
        await Promise.all(fileNames.map(fileName => deleteObjectStore(DBName.US, fileName)));
      }

      console.log('Reset completed successfully');
    } catch (error) {
      console.error('Error during reset:', error);
    }
  }
</script>
