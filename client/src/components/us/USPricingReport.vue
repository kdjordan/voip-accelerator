<template>
  <!-- Show content if enhanced reports are available (implies code report is ready) -->
  <div v-if="enhancedReport1 || enhancedReport2" class="space-y-6">
    <div class="bg-gray-800 p-6 rounded-lg space-y-6">
      <h2 class="text-xl text-white font-semibold">US Pricing Summary</h2>

      <!-- Overall Stats Section -->
      <div class="grid grid-cols-2 gap-6">
        <!-- File 1 Stats - Use enhancedReport1 -->
        <div v-if="enhancedReport1" class="bg-gray-900/50 p-4 rounded-lg">
          <h3 class="text-lg text-accent mb-3">
            {{ enhancedReport1?.file1?.fileName }}
          </h3>
          <div class="grid grid-cols-3 gap-4">
            <!-- Interstate -->
            <div class="bg-gray-800 p-3 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Interstate Avg</div>
              <div class="text-lg text-white">
                ${{ enhancedReport1?.file1.rateStats?.interstate?.average?.toFixed(4) ?? '0.0000' }}
              </div>
            </div>
            <!-- Intrastate -->
            <div class="bg-gray-800 p-3 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Intrastate Avg</div>
              <div class="text-lg text-white">
                ${{ enhancedReport1?.file1.rateStats?.intrastate?.average?.toFixed(4) ?? '0.0000' }}
              </div>
            </div>
            <!-- Indeterminate -->
            <div class="bg-gray-800 p-3 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Indeterminate Avg</div>
              <div class="text-lg text-white">
                ${{
                  enhancedReport1?.file1.rateStats?.indeterminate?.average?.toFixed(4) ?? '0.0000'
                }}
              </div>
            </div>
          </div>
        </div>
        <!-- Placeholder if file 1 report missing -->
        <div v-else class="bg-gray-900/50 p-4 rounded-lg text-center text-gray-500">
          Waiting for File 1 data...
        </div>

        <!-- File 2 Stats - Use enhancedReport2 -->
        <div v-if="enhancedReport2" class="bg-gray-900/50 p-4 rounded-lg">
          <h3 class="text-lg text-accent mb-3">
            {{ enhancedReport2?.file1?.fileName }}
          </h3>
          <div class="grid grid-cols-3 gap-4">
            <!-- Interstate -->
            <div class="bg-gray-800 p-3 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Interstate Avg</div>
              <div class="text-lg text-white">
                ${{ enhancedReport2?.file1.rateStats?.interstate?.average?.toFixed(4) ?? '0.0000' }}
              </div>
            </div>
            <!-- Intrastate -->
            <div class="bg-gray-800 p-3 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Intrastate Avg</div>
              <div class="text-lg text-white">
                ${{ enhancedReport2?.file1.rateStats?.intrastate?.average?.toFixed(4) ?? '0.0000' }}
              </div>
            </div>
            <!-- Indeterminate -->
            <div class="bg-gray-800 p-3 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Indeterminate Avg</div>
              <div class="text-lg text-white">
                ${{
                  enhancedReport2?.file1.rateStats?.indeterminate?.average?.toFixed(4) ?? '0.0000'
                }}
              </div>
            </div>
          </div>
        </div>
        <!-- Placeholder if file 2 report missing -->
        <div v-else class="bg-gray-900/50 p-4 rounded-lg text-center text-gray-500">
          Waiting for File 2 data...
        </div>
      </div>
    </div>

    <!-- Comparison Section - Render only when 2 files are present conceptually -->
    <div v-if="enhancedReport1 && enhancedReport2" class="bg-gray-800 p-6 rounded-lg">
      <div class="bg-gray-900/50 p-4 rounded-lg min-h-[250px]">
        <h3 class="text-lg text-accent mb-3">Comparison Summary</h3>

        <!-- Show loading indicator while pricing comparison runs -->
        <div v-if="usStore.isPricingReportProcessing" class="text-center pt-10 text-gray-400">
          <p>Calculating detailed comparison summary...</p>
          <!-- Add spinner animation here if desired -->
        </div>

        <!-- Show comparison table only when processing is done and report is ready -->
        <table v-else-if="usStore.isPricingReportReady && props.report" class="w-full text-sm">
          <tbody>
            <tr class="border-b border-gray-700">
              <td class="py-2 text-gray-400">Interstate Rate Diff (%):</td>
              <td class="py-2 text-right text-white">
                {{ props.report.comparison.interRateDifference?.toFixed(2) ?? 'N/A' }}%
              </td>
            </tr>
            <tr class="border-b border-gray-700">
              <td class="py-2 text-gray-400">Intrastate Rate Diff (%):</td>
              <td class="py-2 text-right text-white">
                {{ props.report.comparison.intraRateDifference?.toFixed(2) ?? 'N/A' }}%
              </td>
            </tr>
            <tr class="border-b border-gray-700">
              <td class="py-2 text-gray-400">Indeterminate Rate Diff (%):</td>
              <td class="py-2 text-right text-white">
                {{ props.report.comparison.ijRateDifference?.toFixed(2) ?? 'N/A' }}%
              </td>
            </tr>
            <tr class="border-b border-gray-700">
              <td class="py-2 text-gray-400">Rates Higher in File 1:</td>
              <td class="py-2 text-right text-white">
                {{ props.report.comparison.totalHigher ?? 0 }}
              </td>
            </tr>
            <tr class="border-b border-gray-700">
              <td class="py-2 text-gray-400">Rates Higher in File 2 (Lower in File 1):</td>
              <td class="py-2 text-right text-white">
                {{ props.report.comparison.totalLower ?? 0 }}
              </td>
            </tr>
            <tr>
              <td class="py-2 text-gray-400">Rates Equal:</td>
              <td class="py-2 text-right text-white">
                {{ props.report.comparison.totalEqual ?? 0 }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Message if processing done but report still not ready (error?) -->
        <div v-else class="text-center pt-10 text-warning">
          <p>Comparison summary data is not available.</p>
        </div>
      </div>
    </div>

    <!-- Placeholder for Detailed NPANXX Comparison -->
    <div class="bg-gray-800 p-6 rounded-lg text-center">
      <p class="text-lg text-accent">Coming Soon: Detailed NPA-NXX Level Rate Comparison</p>
      <p class="text-gray-300 mt-2">
        This section will allow you to explore, filter, and sort individual rate differences.
      </p>
    </div>
  </div>

  <!-- Fallback message if NO enhanced report data is available -->
  <div v-else class="text-center text-xl text-muted-foreground p-10">
    Pricing report data is being generated or is unavailable.
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'; // Import computed
import type { USPricingReport } from '@/types/domains/us-types'; // Import the correct type
import { useUsStore } from '@/stores/us-store'; // Import store
import type { USEnhancedCodeReport } from '@/types/domains/us-types'; // Import USEnhancedCodeReport
// import { ReportTypes } from '@/types/app-types'; // No longer needed
// import type { USEnhancedCodeReport } from '@/types/domains/us-types'; // No longer needed

// Define the report prop
const props = defineProps<{
  report: USPricingReport | null;
}>();

// Get store instance
const usStore = useUsStore();

// Computed properties to get enhanced reports using the getter
// Get filenames directly from the store, not props.report
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

// Remove computed properties based on getEnhancedReportByFile
// const fileNames = computed(() => usStore.getFileNames);
// const file1Report = computed<USEnhancedCodeReport | null>(...);
// const file2Report = computed<USEnhancedCodeReport | null>(...);

// Remove hasTwoFiles computed property
// const hasTwoFiles = computed(() => ...);

// Remove goToFilesTab if not used elsewhere
// function goToFilesTab() { ... }
</script>
