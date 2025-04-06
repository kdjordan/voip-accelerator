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
              (usStore.hasSingleFileReport || usStore.reportsGenerated) &&
              !usStore.hasEnhancedReports
            "
            :report="usStore.getCodeReport"
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
import { useUsStore } from '@/stores/us-store';
import { ReportTypes } from '@/types/app-types';
import { onMounted, watch } from 'vue';
import { useLergData } from '@/composables/useLergData';
import { loadSampleDecks } from '@/utils/load-sample-data';
import { DBName } from '@/types/app-types';
import { useLergStore } from '@/stores/lerg-store';

const usStore = useUsStore();
const { ping, error } = useLergData();
const lergStore = useLergStore();

// Add watchers to debug state changes
watch(
  () => usStore.activeReportType,
  (newValue) => {
    console.log(`[UsView] Active report type changed to: ${newValue}`);
  }
);

watch(
  () => usStore.hasEnhancedReports,
  (hasReports) => {
    console.log(`[UsView] Enhanced reports available: ${hasReports}`);
    if (hasReports) {
      console.log(`[UsView] Report count: ${usStore.enhancedCodeReports.size}`);
      console.log(`[UsView] Report files: ${Array.from(usStore.enhancedCodeReports.keys())}`);
    }
  }
);

onMounted(async () => {
  // Ensure LERG data is loaded first, before anything else happens
  try {
    console.log('[UsView] Mounting component, checking LERG data');

    // Ping LERG data to ensure it's available for US operations
    const pingResult = await ping();
    console.log('[UsView] LERG data ping successful:', pingResult);

    // Check actual LERG data counts
    const usStates = lergStore.getUSStates;
    const canadaProvinces = lergStore.getCanadianProvinces;
    const countryData = lergStore.getCountryData;

    // Update the statistics in the LERG store
    lergStore.updateStats();

    console.log('[UsView] LERG data loaded:', {
      usStatesCount: usStates.length,
      totalStateNPAs: usStates.reduce((sum, state) => sum + state.npas.length, 0),
      canadaProvincesCount: canadaProvinces.length,
      totalProvinceNPAs: canadaProvinces.reduce((sum, province) => sum + province.npas.length, 0),
      countriesCount: countryData.length,
      totalCountryNPAs: countryData.reduce((sum, country) => sum + country.npas.length, 0),
      lergTotalNPAs: lergStore.stats.totalNPAs,
    });

    // Only then load sample decks
    const sampleDecks = setTimeout(async () => {
      await loadSampleDecks([DBName.US]);
    }, 1000);

    // Clear timeout on component unmount
    return () => clearTimeout(sampleDecks);
  } catch (e) {
    console.error('[UsView] Error loading LERG data:', e);
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
