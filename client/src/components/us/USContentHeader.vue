<template>
  <div class="w-full">
    <!-- Journey Message Section -->
    <div class="bg-gray-800 rounded-t-lg p-6">
      <div class="pb-4">
        <Transition
          name="fade"
          mode="out-in"
        >
          <div
            :key="currentJourneyState"
            class="min-h-24"
          >
            <h3 class="text-sizeLg tracking-wide text-white mb-2">
              {{ journeyMessage.title }}
            </h3>
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
      v-if="usStore.reportsGenerated"
      class="bg-gray-800 px-6"
    >
      <div class="flex items-center border-b border-gray-700">
        <button
          v-for="type in reportTypes"
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
          <span v-if="type !== ReportTypes.FILES">{{ type.charAt(0).toUpperCase() + type.slice(1) }} Report</span>
          <span v-else>{{ type.charAt(0).toUpperCase() + type.slice(1) }}</span>
          <!-- Active Tab Indicator -->
          <div
            v-if="usStore.activeReportType === type"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
          ></div>
        </button>
        <button
          @click="handleReset"
          class="btn-destructive ml-auto mb-2"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUsStore } from '@/stores/us-store';
  import { ReportTypes, type ReportType } from '@/types/app-types';
  import useDexieDB from '@/composables/useDexieDB';
  import { DBName } from '@/types';
  import { US_JOURNEY_MESSAGES, JOURNEY_STATE, type JourneyState } from '@/types/constants/messages';
  import { computed } from 'vue';

  const usStore = useUsStore();
  const { deleteDatabase } = useDexieDB();

  const reportTypes: readonly ReportType[] = [ReportTypes.FILES, ReportTypes.CODE, ReportTypes.PRICING] as const;

  const currentJourneyState = computed<JourneyState>(() => {
    if (usStore.reportsGenerated) {
      return JOURNEY_STATE.REPORTS_READY;
    }

    const uploadedCount = usStore.getNumberOfFilesUploaded;

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
    return US_JOURNEY_MESSAGES[currentJourneyState.value];
  });

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
        await Promise.all(fileNames.map(fileName => deleteDatabase(DBName.US)));
      }

      console.log('Reset completed successfully');
    } catch (error) {
      console.error('Error during reset:', error);
    }
  }
</script>
