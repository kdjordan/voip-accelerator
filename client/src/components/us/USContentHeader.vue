<template>
  <div class="w-full">
    <!-- Report Type Tabs -->
    <div class="bg-gray-800 px-6 pb-6 rounded-t-lg">
      <div class="flex items-center border-b border-gray-700">
        <button
          v-for="type in availableReportTypes"
          :key="type"
          @click="usStore.setActiveReportType(type)"
          class="mr-8 py-4 px-1 relative"
          :class="[
            'hover:text-white transition-colors',
            {
              'text-white': usStore.activeReportType === type,
              'text-gray-400': usStore.activeReportType !== type,
            },
          ]"
        >
          <span v-if="type === ReportTypes.CODE">Code Compare</span>
          <span v-else-if="type === ReportTypes.PRICING">Pricing Report</span>

          <span v-else>{{ type.charAt(0).toUpperCase() + type.slice(1) }}</span>
          <div
            v-if="usStore.activeReportType === type"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
          ></div>
        </button>
        <div class="ml-auto flex items-center space-x-2">
          <BaseButton
            v-if="usStore.filesUploaded.size === 2"
            variant="destructive"
            size="small"
            @click="handleReset"
            :is-loading="isResetting"
          >
            Reset
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUsStore } from '@/stores/us-store';
import { ReportTypes, type ReportType } from '@/types/app-types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types';
import { computed, watch, ref } from 'vue';
import BaseButton from '@/components/shared/BaseButton.vue';

const usStore = useUsStore();
const { deleteDatabase } = useDexieDB();
const isResetting = ref(false);

// Compute available report types based on the new readiness flags
const availableReportTypes = computed(() => {
  const types: ReportType[] = [ReportTypes.FILES]; // Files always available
  if (usStore.isCodeReportReady) {
    types.push(ReportTypes.CODE);
    // Show Pricing tab as soon as Code report is ready
    types.push(ReportTypes.PRICING);
  }
  return types;
});

// Watch for code report readiness and switch tab
watch(
  () => usStore.isCodeReportReady,
  (isReady) => {
    if (isReady && usStore.activeReportType !== ReportTypes.CODE) {
      console.log('[USContentHeader] Code report ready, switching to Code tab.');
      usStore.setActiveReportType(ReportTypes.CODE);
    }
  }
);

async function handleReset() {
  isResetting.value = true;
  try {
    console.log('Resetting the US report');

    // Reset store state first
    usStore.resetFiles();

    // --- Delete relevant Dexie Databases --- START ---
    console.log(`Attempting to delete Dexie database: ${DBName.US}`);
    await deleteDatabase(DBName.US)
      .then(() => console.log(`Successfully deleted database: ${DBName.US}`))
      .catch((err) => console.error(`Failed to delete database ${DBName.US}:`, err));

    console.log(`Attempting to delete Dexie database: ${DBName.US_PRICING_COMPARISON}`);
    await deleteDatabase(DBName.US_PRICING_COMPARISON)
      .then(() => console.log(`Successfully deleted database: ${DBName.US_PRICING_COMPARISON}`))
      .catch((err) =>
        console.error(`Failed to delete database ${DBName.US_PRICING_COMPARISON}:`, err)
      );
    // --- Delete relevant Dexie Databases --- END ---

    console.log('Reset completed successfully');
  } catch (error) {
    console.error('Error during reset:', error);
  } finally {
    isResetting.value = false;
  }
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
