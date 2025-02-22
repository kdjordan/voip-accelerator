<template>
  <div class="w-full">
    <!-- Journey Message Section -->
    <div class="bg-gray-800 rounded-t-lg p-6">
      <div class="pb-4">
        <Transition
          name="fade"
          mode="out-in"
        >
          <!-- User Journey Section -->
          <div
            :key="currentJourneyState"
            class="min-h-24"
          >
            <!-- Title -->
            <h3 class="text-sizeLg tracking-wide text-white mb-2">{{ journeyMessage.title }}</h3>
            <!-- Message -->
            <p
              class="text-base text-gray-400"
              v-html="journeyMessage.message"
            ></p>
          </div>
        </Transition>
      </div>
      <div class="border-b border-gray-700/50 mx-2"></div>
    </div>

    <!-- Report Type Tabs -->
    <div
      v-if="azStore.reportsGenerated"
      class="bg-gray-800 px-6 pb-6"
    >
      <div class="flex items-center border-b border-gray-700">
        <button
          v-for="type in reportTypes"
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
          <span v-if="type !== 'files'">{{ type.charAt(0).toUpperCase() + type.slice(1) }} Report</span>
          <span v-else>{{ type.charAt(0).toUpperCase() + type.slice(1) }}</span>
          <!-- Active Tab Indicator -->
          <div
            v-if="azStore.activeReportType === type"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
          ></div>
        </button>
        <button
          @click="handleReset"
          class="px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors ml-auto text-red-400"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useAzStore } from '@/stores/az-store';
  import { ReportTypes, type ReportType } from '@/types';
  import useDexieDB from '@/composables/useDexieDB';
  import { DBName } from '@/types';
  import { computed } from 'vue';
  import { AZ_JOURNEY_MESSAGES, JOURNEY_STATE, type JourneyState } from '@/constants/messages';

  const azStore = useAzStore();
  const { deleteDatabase } = useDexieDB();

  const reportTypes: ReportType[] = [ReportTypes.FILES, ReportTypes.CODE, ReportTypes.PRICING];

  const currentJourneyState = computed<JourneyState>(() => {
    if (azStore.reportsGenerated) {
      return JOURNEY_STATE.REPORTS_READY;
    }

    const uploadedCount = azStore.getNumberOfFilesUploaded;

    switch (uploadedCount) {
      case 0:
        return JOURNEY_STATE.INITIAL;
      case 1:
        return JOURNEY_STATE.ONE_FILE;
      case 2:
        return JOURNEY_STATE.TWO_FILES;
      default:
        return JOURNEY_STATE.INITIAL;
    }
  });

  const journeyMessage = computed(() => {
    return AZ_JOURNEY_MESSAGES[currentJourneyState.value];
  });

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
        await Promise.all(fileNames.map(fileName => deleteDatabase(DBName.AZ)));
      }

      console.log('Reset completed successfully');
    } catch (error) {
      console.error('Error during reset:', error);
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
