<template>
  <div class="w-full">
    <!-- Report Type Tabs -->
    <div class="bg-gray-800 px-6 pb-6 rounded-t-lg">
      <div class="flex items-center border-b border-gray-700">
        <button
          v-for="type in availableReportTypes"
          :key="type"
          @click="azStore.setActiveReportType(type)"
          class="mr-8 py-4 px-1 relative"
          :class="[
            'hover:text-white transition-colors',
            {
              'text-white': azStore.activeReportType === type,
              'text-gray-400': azStore.activeReportType !== type,
            },
          ]"
        >
          <span v-if="type === 'code' && azStore.reportsGenerated">Code Compare</span>
          <span v-else-if="type !== 'files'"
            >{{ type.charAt(0).toUpperCase() + type.slice(1) }} Report</span
          >
          <span v-else>{{ type.charAt(0).toUpperCase() + type.slice(1) }}</span>
          <!-- Active Tab Indicator -->
          <div
            v-if="azStore.activeReportType === type"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
          ></div>
        </button>
        <!-- Use BaseButton for Reset -->
        <div class="ml-auto flex items-center space-x-2">
          <BaseButton
            v-if="azStore.filesUploaded.size === 2"
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
import { useAzStore } from '@/stores/az-store';
import { ReportTypes, type ReportType } from '@/types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types';
import { computed, ref } from 'vue';
import BaseButton from '@/components/shared/BaseButton.vue';

const azStore = useAzStore();
const { deleteDatabase } = useDexieDB();
const isResetting = ref(false);

const reportTypes: ReportType[] = [ReportTypes.FILES, ReportTypes.CODE, ReportTypes.PRICING];

// Compute available report types based on the current state
const availableReportTypes = computed(() => {
  if (azStore.reportsGenerated) {
    return [ReportTypes.FILES, ReportTypes.CODE, ReportTypes.PRICING];
  }
  return [ReportTypes.FILES];
});

async function handleReset() {
  isResetting.value = true;
  try {
    console.log('Resetting the AZ report...');

    // Reset store state - this will now trigger DB deletion internally
    await azStore.resetFiles();

    azStore.setActiveReportType('files');

    console.log('Reset completed successfully');
  } catch (error) {
    console.error('Error during reset:', error);
  } finally {
    isResetting.value = false;
  }
}

// Log on component mount
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
