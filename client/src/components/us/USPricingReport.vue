<template>
  <!-- Show content if enhanced reports are available (implies code report is ready) -->
  <div v-if="enhancedReport1 || enhancedReport2" class="space-y-6">
    <!-- REMOVED US Pricing Summary Section -->
    <!-- Detailed NPANXX Comparison Section -->
    <div class="bg-gray-800 p-6 rounded-lg">
      <h3 class="text-lg text-gray-400 font-medium mb-4 uppercase">US Pricing Comparison</h3>
      <!-- USDetailedComparisonTable will handle summary and details -->
      <USDetailedComparisonTable />
    </div>
  </div>

  <!-- Fallback message if NO enhanced report data is available -->
  <div v-else class="text-center text-xl text-muted-foreground p-10">
    Pricing report data is being generated or is unavailable. Please upload files first.
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  // Import type for props if needed, but report prop might become unused
  // import type { USPricingReport } from '@/types/domains/us-types';
  import { useUsStore } from '@/stores/us-store';
  import type { USEnhancedCodeReport } from '@/types/domains/us-types';
  import USDetailedComparisonTable from './USDetailedComparisonTable.vue';

  // Define the report prop - This might be unused now or its role changed
  // const props = defineProps<{
  //   report: USPricingReport | null;
  // }>();

  // Get store instance
  const usStore = useUsStore();

  // Computed properties to get enhanced reports using the getter
  // These might still be useful for the main v-if, or could be removed if
  // USDetailedComparisonTable handles its own display logic completely.
  const enhancedReport1 = computed<USEnhancedCodeReport | null>(() => {
    const fileNames = usStore.getFileNames;
    const fileName1 = fileNames.length > 0 ? fileNames[0] : null;
    return fileName1 ? usStore.getEnhancedReportByFile(fileName1) : null;
  });

  const enhancedReport2 = computed<USEnhancedCodeReport | null>(() => {
    const fileNames = usStore.getFileNames;
    const fileName2 = fileNames.length > 1 ? fileNames[1] : null;
    return fileName2 ? usStore.getEnhancedReportByFile(fileName2) : null;
  });

  // Removed props.report related logic as it's likely handled by USDetailedComparisonTable
  // or the enhancedReport computed properties.
</script>
