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

    <!-- Report Type Buttons -->
    <div
      v-if="usStore.reportsGenerated"
      class="flex items-center space-x-4 mb-8"
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
  import { US_JOURNEY_MESSAGES, JOURNEY_STATE, type JourneyState } from '@/constants/messages';
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
