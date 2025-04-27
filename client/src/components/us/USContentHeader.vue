<template>
  <div class="w-full">
    <!-- Journey Message Section -->
    <div class="bg-gray-800 rounded-t-lg p-6">
      <div class="pb-4">
        <Transition name="fade" mode="out-in">
          <!-- User Journey Section -->
          <div :key="currentJourneyState" class="min-h-24">
            <!-- Title -->
            <h3 class="text-sizeLg tracking-wide text-white mb-2">{{ journeyMessage.title }}</h3>
            <!-- Message -->
            <p
              class="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-400"
              v-html="journeyMessage.message"
            ></p>
          </div>
        </Transition>
      </div>
      <div class="border-b border-gray-700/50 mx-2"></div>
    </div>

    <!-- Report Type Tabs -->
    <div class="bg-gray-800 px-6 pb-6">
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
          <!-- Adjust tab labels if needed -->
          <span v-if="type === 'code'">Code Compare</span>
          <span v-else-if="type === 'pricing'">Pricing Report</span>
          <span v-else>{{ type.charAt(0).toUpperCase() + type.slice(1) }}</span>
          <!-- Active Tab Indicator -->
          <div
            v-if="usStore.activeReportType === type"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
          ></div>
        </button>
        <!-- Use BaseButton for Reset -->
        <BaseButton
          v-if="usStore.filesUploaded.size > 0"
          variant="destructive"
          size="small"
          @click="handleReset"
          class="ml-auto"
          :is-loading="isResetting"
        >
          Reset
        </BaseButton>
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

// Update journey state logic based on new flags
const currentJourneyState = computed<JourneyState>(() => {
  // Use readiness flags for reports_ready state
  if (usStore.isCodeReportReady && usStore.isPricingReportReady) {
    return JOURNEY_STATE.REPORTS_READY;
  }
  // Maybe add a state for code ready, pricing pending?
  else if (usStore.isCodeReportReady) {
    // If code is ready but pricing isn't yet (and we have 2 files)
    if (usStore.filesUploaded.size === 2) {
      return JOURNEY_STATE.CODE_REPORT_READY; // Add this state to constants
    }
  }

  // Keep single file logic
  if (usStore.filesUploaded.size === 1) {
    // Check if file stats exist for the single file to determine ONE_FILE_REPORT
    const fileId = Array.from(usStore.filesUploaded.keys())[0];
    if (usStore.fileStats.has(fileId)) {
      return JOURNEY_STATE.ONE_FILE_REPORT;
    }
    return JOURNEY_STATE.ONE_FILE;
  }

  const uploadedCount = usStore.getNumberOfFilesUploaded;

  switch (uploadedCount) {
    case 0:
      return JOURNEY_STATE.INITIAL;
    case 2:
      // If code report isn't ready yet, we are in the TWO_FILES state (before processing)
      if (!usStore.isCodeReportReady) {
        return JOURNEY_STATE.TWO_FILES;
      }
      // Fallback if other states aren't met (shouldn't happen often)
      return JOURNEY_STATE.INITIAL;
    default:
      return JOURNEY_STATE.INITIAL;
  }
});

const journeyMessage = computed(() => {
  // Ensure the new state exists in messages or provide a fallback
  return (
    US_JOURNEY_MESSAGES[currentJourneyState.value] || US_JOURNEY_MESSAGES[JOURNEY_STATE.INITIAL]
  );
});

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
