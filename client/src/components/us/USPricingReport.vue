<template>
  <!-- Message for single file scenario -->
  <div v-if="!hasTwoFiles" class="bg-gray-800 p-6 rounded-lg">
    <div class="text-center py-12">
      <h3 class="text-xl text-accent mb-4">Pricing Comparison Not Available</h3>
      <p class="text-gray-300 max-w-lg mx-auto">
        The pricing comparison report requires two files to be uploaded. Please upload a second file
        to see pricing opportunities.
      </p>
      <button
        @click="goToFilesTab"
        class="mt-6 px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors"
      >
        <span class="text-sm text-accent">Upload Another File</span>
      </button>
    </div>
  </div>

  <div v-else-if="report" class="space-y-6 bg-gray-800 p-6 rounded-lg">
    <h2 class="text-xl text-white font-semibold">US Pricing Comparison</h2>

    <!-- Overall Stats Section -->
    <div class="grid grid-cols-2 gap-6">
      <div class="bg-gray-900/50 p-4 rounded-lg">
        <h3 class="text-lg text-accent mb-3">{{ report.file1.fileName }}</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Interstate</div>
            <div class="text-lg text-white">${{ report.file1.averageInterRate.toFixed(4) }}</div>
          </div>
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Intrastate</div>
            <div class="text-lg text-white">${{ report.file1.averageIntraRate.toFixed(4) }}</div>
          </div>
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Indeterminate</div>
            <div class="text-lg text-white">${{ report.file1.averageIJRate.toFixed(4) }}</div>
          </div>
        </div>
      </div>

      <div class="bg-gray-900/50 p-4 rounded-lg">
        <h3 class="text-lg text-accent mb-3">{{ report.file2.fileName }}</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Interstate</div>
            <div class="text-lg text-white">${{ report.file2.averageInterRate.toFixed(4) }}</div>
          </div>
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Intrastate</div>
            <div class="text-lg text-white">${{ report.file2.averageIntraRate.toFixed(4) }}</div>
          </div>
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Indeterminate</div>
            <div class="text-lg text-white">${{ report.file2.averageIJRate.toFixed(4) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison Stats -->
    <div class="bg-gray-900/50 p-4 rounded-lg">
      <h3 class="text-lg text-white mb-3">Rate Difference</h3>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 text-sm mb-1">Interstate</div>
          <div
            class="text-lg"
            :class="report.comparison.interRateDifference > 0 ? 'text-red-400' : 'text-green-400'"
          >
            {{ report.comparison.interRateDifference > 0 ? '+' : ''
            }}{{ report.comparison.interRateDifference.toFixed(2) }}%
          </div>
        </div>
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 text-sm mb-1">Intrastate</div>
          <div
            class="text-lg"
            :class="report.comparison.intraRateDifference > 0 ? 'text-red-400' : 'text-green-400'"
          >
            {{ report.comparison.intraRateDifference > 0 ? '+' : ''
            }}{{ report.comparison.intraRateDifference.toFixed(2) }}%
          </div>
        </div>
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 text-sm mb-1">Indeterminate</div>
          <div
            class="text-lg"
            :class="report.comparison.ijRateDifference > 0 ? 'text-red-400' : 'text-green-400'"
          >
            {{ report.comparison.ijRateDifference > 0 ? '+' : ''
            }}{{ report.comparison.ijRateDifference.toFixed(2) }}%
          </div>
        </div>
      </div>
    </div>

    <div class="bg-gray-900/50 p-6 rounded-lg text-center">
      <p class="text-lg text-accent">Coming Soon: Advanced NPA-Level Rate Comparison</p>
      <p class="text-gray-300 mt-2">
        We're working on a more detailed rate comparison view with state and NPA breakdowns.
      </p>
    </div>
  </div>

  <div v-else class="text-center text-xl text-muted-foreground">
    No pricing report data available.
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { USPricingReport } from '@/types/domains/us-types';
import { useUsStore } from '@/stores/us-store';
import { ReportTypes } from '@/types/app-types';

const props = defineProps<{
  report: USPricingReport | null;
}>();

const usStore = useUsStore();

// Check if we have two files for comparison
const hasTwoFiles = computed(() => {
  return usStore.reportsGenerated && props.report !== null;
});

// Function to navigate to the files tab
function goToFilesTab() {
  usStore.setActiveReportType(ReportTypes.FILES);
}
</script>
