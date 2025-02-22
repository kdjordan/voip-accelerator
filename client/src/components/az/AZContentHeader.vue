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

    <!-- Report Type Buttons -->
    <div
      v-if="azStore.reportsGenerated"
      class="flex items-center space-x-4 mb-8"
    >
      <button
        v-for="type in reportTypes"
        :key="type"
        @click="azStore.setActiveReportType(type)"
        :class="[
          'py-2 px-4 rounded-lg transition-colors',
          {
            'btn-active': azStore.activeReportType === type,
            'btn-inactive': azStore.activeReportType !== type,
          },
        ]"
      >
        <span v-if="type !== 'files'">{{ type.charAt(0).toUpperCase() + type.slice(1) }} Report</span>
        <span v-else>{{ type.charAt(0).toUpperCase() + type.slice(1) }}</span>
      </button>
      <button
        @click="handleReset"
        class="btn-lg btn-destructive ml-auto"
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
