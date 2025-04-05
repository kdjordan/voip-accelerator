<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="mb-8">
      <span class="text-sizeXl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
        US Rate Deck Analyzer
      </span>
    </h1>
    <USContentHeader />

    <div>
      <transition name="fade" mode="out-in" appear>
        <div :key="usStore.getActiveReportType">
          <USFileUploads v-if="usStore.activeReportType === ReportTypes.FILES" />
          <USCodeReport
            v-if="
              usStore.activeReportType === ReportTypes.CODE &&
              (usStore.hasSingleFileReport || usStore.reportsGenerated)
            "
            :report="usStore.getCodeReport"
          />
          <USEnhancedCodeReport
            v-if="usStore.activeReportType === ReportTypes.CODE && usStore.enhancedCodeReport"
            :report="usStore.getEnhancedCodeReport"
          />
          <USPricingReport
            v-if="usStore.activeReportType === ReportTypes.PRICING && usStore.reportsGenerated"
            :report="usStore.getPricingReport"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import USFileUploads from '@/components/us/USFileUploads.vue';
import USCodeReport from '@/components/us/USCodeReport.vue';
import USPricingReport from '@/components/us/USPricingReport.vue';
import USContentHeader from '@/components/us/USContentHeader.vue';
import USEnhancedCodeReport from '@/components/us/USEnhancedCodeReport.vue';
import { useUsStore } from '@/stores/us-store';
import { ReportTypes } from '@/types/app-types';
import { onMounted } from 'vue';
import { useLergData } from '@/composables/useLergData';
import { loadSampleDecks } from '@/utils/load-sample-data';
import { DBName } from '@/types/app-types';

const usStore = useUsStore();
const { ping, error } = useLergData();

onMounted(async () => {
  try {
    console.log('UsView mounted, checking LERG data status...');
    const isOnline = await ping();
    if (!isOnline) {
      console.warn('LERG data is not available');
    }
    console.log('LERG data status checked successfully');
  } catch (error) {
    console.error('Failed to check LERG data status:', error);
  }
});

/**
 * Format error message based on error source and details
 */
function formatErrorMessage(
  error: Error,
  source?: string,
  details?: Record<string, any>
): {
  message: string;
  details?: string;
  source?: string;
} {
  let message = error.message || 'An unknown error occurred';
  let detailsMessage = '';
  let sourceLabel = source || 'System Error';

  // Add details if available
  if (details) {
    const detailsArray = [];

    if (details.errorType) {
      detailsArray.push(`Type: ${details.errorType}`);
    }

    if (details.errorMessage && details.errorMessage !== message) {
      detailsArray.push(`Details: ${details.errorMessage}`);
    }

    detailsMessage = detailsArray.join(' | ');
  }

  return {
    message,
    details: detailsMessage,
    source: sourceLabel,
  };
}
</script>
