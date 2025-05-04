<template>
  <div class="overflow-x-auto">
    <!-- Message for single file scenario -->
    <div v-if="!hasTwoFiles" class="bg-gray-800 p-6 rounded-lg">
      <div class="text-center py-12">
        <h3 class="text-xl text-accent mb-4">Pricing Comparison Not Available</h3>
        <p class="text-gray-300 max-w-lg mx-auto">
          The pricing comparison report requires two files to be uploaded. Please upload a second
          file to see pricing opportunities.
        </p>
        <button
          @click="goToFilesTab"
          class="mt-6 px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors"
        >
          <span class="text-sm text-accent">Upload Another File</span>
        </button>
      </div>
    </div>

    <!-- Only show the detailed table if two files exist and reports are considered generated -->
    <div v-else-if="report || azStore.getDetailedComparisonTableName" class="space-y-8 bg-gray-800">
      <!-- Detailed Comparison Table -->
      <AZDetailedComparisonTable />
    </div>

    <!-- Message if two files exist but no report/table name yet -->
    <div
      v-else-if="hasTwoFiles && !(report || azStore.getDetailedComparisonTableName)"
      class="bg-gray-800 p-6 rounded-lg"
    >
      <div class="text-center py-12">
        <h3 class="text-xl text-accent mb-4">Generate Report</h3>
        <p class="text-gray-300 max-w-lg mx-auto">
          Click the "Generate Reports" button to compare the uploaded files.
        </p>
        <!-- Add a button or indicate the main generate button -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useAzStore } from '@/stores/az-store';
  import { storeToRefs } from 'pinia';
  import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/solid';
  import AZDetailedComparisonTable from './AZDetailedComparisonTable.vue';
  import { ReportTypes } from '@/types/app-types';
  import { useUserStore } from '@/stores/user-store';
  import { DBName } from '@/types/app-types';

  const azStore = useAzStore();
  const userStore = useUserStore();
  const { pricingReport: report, getFileNames } = storeToRefs(azStore);

  const hasTwoFiles = computed(() => getFileNames.value.length === 2);

  // Function to switch to the files tab/view
  function goToFilesTab() {
    azStore.setActiveReportType(ReportTypes.FILES);
    // Potentially trigger router navigation if tabs are route-based
  }
</script>
