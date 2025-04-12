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
            v-if="usStore.activeReportType === ReportTypes.CODE && usStore.isCodeReportReady"
            :report="usStore.getCodeReport"
          />
          <USPricingReport
            v-if="usStore.activeReportType === ReportTypes.PRICING && usStore.isCodeReportReady"
            :report="usStore.getPricingReport"
          />
          <div
            v-else-if="
              usStore.activeReportType === ReportTypes.PRICING && !usStore.isCodeReportReady
            "
            class="text-center p-10 text-gray-400"
          >
            <p>Waiting for initial report generation...</p>
          </div>
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

const { initializeLergData, error: lergError } = useLergData();

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
    await initializeLergData();
    console.log('[UsView] Mounting component, checking LERG data');

    // Ping LERG data to ensure it's available for US operations
    const pingResult = await ping();
    console.log('[UsView] LERG data ping successful:', pingResult);

    // Check actual LERG data counts
    const usStates = lergStore.getUSStates;
    const canadaProvinces = lergStore.getCanadianProvinces;
    const countryData = lergStore.getCountryData;

    console.log('[UsView] LERG data loaded:', {
      usStatesCount: usStates.length,
      totalStateNPAs: usStates.reduce((sum, state) => sum + state.npas.length, 0),
      canadaProvincesCount: canadaProvinces.length,
      totalProvinceNPAs: canadaProvinces.reduce((sum, province) => sum + province.npas.length, 0),
      countriesCount: countryData.length,
      totalCountryNPAs: countryData.reduce((sum, country) => sum + country.npas.length, 0),
      lergTotalNPAs: lergStore.stats.totalNPAs,
    });

    // Check if files are already loaded before loading sample data
    const filesAlreadyUploaded = usStore.getNumberOfFilesUploaded === 2;

    if (filesAlreadyUploaded) {
      console.log('[UsView] Files already uploaded, skipping sample data loading');
    } else {
      // Only load sample decks if no files are already uploaded
      console.log('[UsView] No files uploaded, loading sample data');
      const sampleDecks = setTimeout(async () => {
        // await loadSampleDecks([DBName.US]);
      }, 1000);

      // Clear timeout on component unmount
      return () => clearTimeout(sampleDecks);
    }
  } catch (err) {
    console.error('[UsView] Error loading LERG data:', err);
    lergInitError.value = err instanceof Error ? err.message : 'Failed to initialize LERG service';
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
