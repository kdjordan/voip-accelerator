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

  <!-- Display when two files are ready and reports are generated -->
  <div v-else-if="file1Report && file2Report" class="space-y-6 bg-gray-800 p-6 rounded-lg">
    <h2 class="text-xl text-white font-semibold">US Pricing Summary</h2>

    <!-- Overall Stats Section -->
    <div class="grid grid-cols-2 gap-6">
      <!-- File 1 Stats -->
      <div v-if="file1Report.file1" class="bg-gray-900/50 p-4 rounded-lg">
        <h3 class="text-lg text-accent mb-3">{{ file1Report.file1.fileName }}</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Interstate Avg</div>
            <div class="text-lg text-white">
              ${{ file1Report.file1.rateStats?.interstate?.average?.toFixed(4) ?? '0.0000' }}
            </div>
          </div>
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Intrastate Avg</div>
            <div class="text-lg text-white">
              ${{ file1Report.file1.rateStats?.intrastate?.average?.toFixed(4) ?? '0.0000' }}
            </div>
          </div>
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Indeterminate Avg</div>
            <div class="text-lg text-white">
              ${{ file1Report.file1.rateStats?.indeterminate?.average?.toFixed(4) ?? '0.0000' }}
            </div>
          </div>
        </div>
      </div>
      <!-- Placeholder if file 1 report is missing -->
      <div v-else class="bg-gray-900/50 p-4 rounded-lg text-center text-gray-500">
        Loading File 1 Stats...
      </div>

      <!-- File 2 Stats -->
      <div v-if="file2Report.file1" class="bg-gray-900/50 p-4 rounded-lg">
        <h3 class="text-lg text-accent mb-3">{{ file2Report.file1.fileName }}</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Interstate Avg</div>
            <div class="text-lg text-white">
              ${{ file2Report.file1.rateStats?.interstate?.average?.toFixed(4) ?? '0.0000' }}
            </div>
          </div>
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Intrastate Avg</div>
            <div class="text-lg text-white">
              ${{ file2Report.file1.rateStats?.intrastate?.average?.toFixed(4) ?? '0.0000' }}
            </div>
          </div>
          <div class="bg-gray-800 p-3 rounded-lg">
            <div class="text-gray-400 text-sm mb-1">Indeterminate Avg</div>
            <div class="text-lg text-white">
              ${{ file2Report.file1.rateStats?.indeterminate?.average?.toFixed(4) ?? '0.0000' }}
            </div>
          </div>
        </div>
      </div>
      <!-- Placeholder if file 2 report is missing -->
      <div v-else class="bg-gray-900/50 p-4 rounded-lg text-center text-gray-500">
        Loading File 2 Stats...
      </div>
    </div>

    <!-- Removed Comparison Stats section -->
    <!-- <div class="bg-gray-900/50 p-4 rounded-lg"> ... </div> -->

    <div class="bg-gray-900/50 p-6 rounded-lg text-center">
      <p class="text-lg text-accent">Coming Soon: Detailed NPA-Level Rate Comparison</p>
      <p class="text-gray-300 mt-2">
        We're working on implementing the detailed rate comparison view with filtering and sorting.
      </p>
    </div>
  </div>

  <div v-else class="text-center text-xl text-muted-foreground">
    Generating pricing summary... Please wait.
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// import type { USPricingReport } from '@/types/domains/us-types'; // No longer needed
import { useUsStore } from '@/stores/us-store';
import { ReportTypes } from '@/types/app-types';
import type { USEnhancedCodeReport } from '@/types/domains/us-types'; // Import the correct type

// const props = defineProps<{ // Remove props definition
//   report: USPricingReport | null;
// }>();

const usStore = useUsStore();

// Get file names from the store
const fileNames = computed(() => usStore.getFileNames);

// Get the enhanced report data for each file
const file1Report = computed<USEnhancedCodeReport | null>(() => {
  if (fileNames.value.length > 0) {
    return usStore.getEnhancedReportByFile(fileNames.value[0]);
  }
  return null;
});

const file2Report = computed<USEnhancedCodeReport | null>(() => {
  if (fileNames.value.length > 1) {
    return usStore.getEnhancedReportByFile(fileNames.value[1]);
  }
  return null;
});

// Check if we have two files ready for comparison summary
const hasTwoFiles = computed(() => {
  // Check if reports are marked as generated and we have two filenames
  return usStore.reportsGenerated && fileNames.value.length === 2;
  // We might also want to check if file1Report and file2Report are actually loaded
  // return usStore.reportsGenerated && !!file1Report.value && !!file2Report.value;
});

// Function to navigate to the files tab
function goToFilesTab() {
  usStore.setActiveReportType(ReportTypes.FILES);
}
</script>
