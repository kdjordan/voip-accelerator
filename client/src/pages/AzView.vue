<template>
  <div class="min-h-screen text-white pt-2 w-full">
    <h1 class="mb-2 relative">
      <span class="text-3xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
        AZ Rate Deck Analyzer
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
    <AZContentHeader />

    <div>
      <transition name="fade" mode="out-in" appear>
        <div :key="azStore.getActiveReportType">
          <AZFileUploads v-if="azStore.getActiveReportType === ReportTypes.FILES" />
          <CodeReportAZ
            v-if="
              azStore.getActiveReportType === ReportTypes.CODE &&
              (azStore.hasSingleFileReport || azStore.reportsGenerated)
            "
            :report="azStore.getCodeReport"
          />
          <PricingReportAZ
            v-if="azStore.getActiveReportType === ReportTypes.PRICING && azStore.reportsGenerated"
            :report="azStore.getPricingReport"
          />
        </div>
      </transition>
    </div>

    <!-- Info Modal -->
    <InfoModal
      :show-modal="showInfoModal"
      :type="'az_comparison'"
      @close="closeInfoModal"
    />
  </div>
</template>

<script setup lang="ts">
import AZFileUploads from '@/components/az/AZFileUploads.vue';
import CodeReportAZ from '@/components/az/AZCodeReport.vue';
import PricingReportAZ from '@/components/az/AZPricingReport.vue';
import AZContentHeader from '@/components/az/AZContentHeader.vue';
import InfoModal from '@/components/shared/InfoModal.vue';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import { useAzStore } from '@/stores/az-store';
import { ReportTypes } from '@/types/app-types';
import { onMounted, ref } from 'vue';
import { loadSampleDecks } from '@/utils/load-sample-data';
import { DBName } from '@/types/app-types';

const azStore = useAzStore();

// Info Modal state
const showInfoModal = ref(false);

// Info Modal functions
function openInfoModal() {
  showInfoModal.value = true;
}

function closeInfoModal() {
  showInfoModal.value = false;
}

onMounted(async () => {
  const filesAlreadyUploaded = azStore.getNumberOfFilesUploaded > 0;

  if (filesAlreadyUploaded) {
    console.log('[AzView] Files already uploaded, skipping sample data loading');
  } else {
    const sampleDecks = setTimeout(async () => {
      // await loadSampleDecks([DBName.AZ]);
    }, 1000);
    return () => clearTimeout(sampleDecks);
  }
});
</script>
