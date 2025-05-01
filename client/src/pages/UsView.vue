<template>
  <div class="min-h-screen text-white pt-2 w-full">
    <h1 class="mb-2 relative">
      <span class="text-3xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
        US Rate Deck Analyzer
      </span>
      <!-- Info Icon Button -->
     <button
        @click="openInfoModal"
        class="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors duration-150"
        aria-label="Show AZ Rate Deck Analyzer information"
      >
        <!-- Apply dashboard styling -->
        <div class="p-1 bg-blue-900/40 rounded-lg border border-blue-400/50 animate-pulse-info">
          <InformationCircleIcon class="w-5 h-5 text-blue-400" />
        </div>
      </button>
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

    <!-- Info Modal -->
    <InfoModal :show-modal="showInfoModal" :type="'us_comparison'" @close="closeInfoModal" />
  </div>
</template>

<script setup lang="ts">
import USFileUploads from '@/components/us/USFileUploads.vue';
import USCodeReport from '@/components/us/USCodeReport.vue';
import USPricingReport from '@/components/us/USPricingReport.vue';
import USContentHeader from '@/components/us/USContentHeader.vue';
import InfoModal from '@/components/shared/InfoModal.vue';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import { useUsStore } from '@/stores/us-store';
import { ReportTypes } from '@/types/app-types';
import { onMounted, watch, ref } from 'vue';
import { useLergData } from '@/composables/useLergData';
import { loadSampleDecks } from '@/utils/load-sample-data';
import { DBName } from '@/types/app-types';
import { useLergStore } from '@/stores/lerg-store';

const usStore = useUsStore();
const { ping, error } = useLergData();
const lergStore = useLergStore();

// Info Modal state
const showInfoModal = ref(false);

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

// Info Modal functions
function openInfoModal() {
  showInfoModal.value = true;
}

function closeInfoModal() {
  showInfoModal.value = false;
}

onMounted(async () => {
  // Ensure LERG data is loaded first, before anything else happens
  try {
    // Ping LERG data to ensure it's available for US operations
    const pingResult = await ping();

    await initializeLergData();
    console.log('[UsView] Mounting component, checking LERG data');

    // Check actual LERG data counts
    const usStates = lergStore.getUSStates;
    const canadaProvinces = lergStore.getCanadianProvinces;
    const countryData = lergStore.getCountryData;

    console.log('[UsView] LERG loaded');

    // Check if files are already loaded before loading sample data
    const filesAlreadyUploaded = usStore.getNumberOfFilesUploaded === 2;

    if (filesAlreadyUploaded) {
      console.log('[UsView] Files already uploaded, skipping sample data loading');
    } else {
      // Only load sample decks if no files are already uploaded
      // console.log('[UsView] No files uploaded, loading sample data');
      const sampleDecks = setTimeout(async () => {
        // await loadSampleDecks([DBName.US]);
      }, 1000);

      // Clear timeout on component unmount
      return () => clearTimeout(sampleDecks);
    }
  } catch (err) {
    console.error('[UsView] Error loading LERG data:', err);
    lergError.value = err instanceof Error ? err.message : 'Failed to initialize LERG service';
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
