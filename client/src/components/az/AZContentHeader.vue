<template>
  <div class="w-full">
    <!-- Report Type Tabs -->
    <div class="bg-gray-800 px-6 pb-6 rounded-t-lg">
      <div class="flex items-center border-b border-gray-700">
        <ReportTabButton
          v-for="type in availableReportTypes"
          :key="type"
          :label="getReportLabel(type)"
          :is-active="azStore.activeReportType === type"
          @click="azStore.setActiveReportType(type)"
        />

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
  import { computed, ref, watchEffect } from 'vue';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import ReportTabButton from '@/components/shared/ReportsTabButton.vue';

  const azStore = useAzStore();
  const { deleteDatabase } = useDexieDB();
  const isResetting = ref(false);

  // Defensive + debugged report types list
  const availableReportTypes = computed((): ReportType[] => {
    const raw = azStore.reportsGenerated
      ? [ReportTypes.FILES, ReportTypes.CODE, ReportTypes.PRICING]
      : [ReportTypes.FILES];

    // Filter to ensure all are non-null valid strings
    const safe = raw.filter((t): t is ReportType => typeof t === 'string' && !!t);

    return safe;
  });

  // Debug logger to see what's in the computed array
  watchEffect(() => {
    console.log('[availableReportTypes]', availableReportTypes.value);
  });

  // Label rendering logic
  function getReportLabel(type: ReportType): string {
    if (type === ReportTypes.CODE && azStore.reportsGenerated) return 'Code Compare';
    if (type === ReportTypes.FILES) return 'Files';
    return `${type.charAt(0).toUpperCase()}${type.slice(1)} Report`;
  }

  // Reset logic
  async function handleReset() {
    isResetting.value = true;
    try {
      console.log('Resetting the AZ report...');
      await azStore.resetFiles();
      azStore.setActiveReportType(ReportTypes.FILES);
      console.log('Reset completed successfully');
    } catch (error) {
      console.error('Error during reset:', error);
    } finally {
      isResetting.value = false;
    }
  }
</script>
