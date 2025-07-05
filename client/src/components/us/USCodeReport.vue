<template>
  <div class="overflow-x-auto">
    <div class="bg-gray-800 rounded-lg p-6 w-full">
      <!-- Changed from min-w-max to w-full to prevent expansion -->
      <div v-if="props.report" class="space-y-8">

        <!-- Comparison Section (Existing) -->
        <div v-if="isValidFileReport(props.report.file2)">
          <h4 class="text-lg text-fbWhite font-medium mb-4 uppercase ml-2">Overall Comparison</h4>
          <div class="p-6 rounded-lg overflow-hidden bg-gray-900/50">
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Matched Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.matchedCodes }} ({{ props.report.matchedCodesPercentage.toFixed(2) }}%)
                  </td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Non-Matched Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.nonMatchedCodes }} ({{
                      props.report.nonMatchedCodesPercentage.toFixed(2)
                    }}%)
                  </td>
                </tr>
                <tr v-if="props.report.matchedNPAs !== undefined" class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Matched Area Codes (NPAs):</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.matchedNPAs }} of {{ props.report.totalUniqueNPAs }}
                  </td>
                </tr>
                <tr
                  v-if="props.report.matchedNPAs !== undefined && props.report.totalUniqueNPAs > 0"
                  class="border-b border-gray-700"
                >
                  <td class="py-2 font-medium text-gray-400">Area Code Match Percentage:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ ((props.report.matchedNPAs / props.report.totalUniqueNPAs) * 100).toFixed(2) }}%
                  </td>
                </tr>
                <tr
                  v-if="props.report.totalComparableInterCodes !== undefined"
                  class="border-b border-gray-700"
                >
                  <td class="py-2 font-medium text-gray-400">Total Comparable Inter Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.totalComparableInterCodes }}
                  </td>
                </tr>
                <tr v-if="props.report.totalComparableIntraCodes !== undefined">
                  <td class="py-2 font-medium text-gray-400">Total Comparable Intra Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.totalComparableIntraCodes }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 0% Margin Detail Section -->
        <div v-if="props.report.file2 && props.report.zeroMarginDetail">
          <h4 class="text-lg text-fbWhite font-medium mb-4 uppercase ml-2">
            0% Margin Matches
            <span class="block text-sm text-gray-400">
              Rates are identical in {{ props.report.file1.fileName }} and {{ props.report.file2.fileName }}
            </span>
          </h4>
          <div class="p-6 rounded-lg overflow-hidden bg-gray-900/50">
            <table class="w-full">
              <thead>
                <tr class="text-left text-gray-400 text-sm">
                  <th class="py-2 px-3">Rate Type</th>
                  <th class="py-2 px-3 text-right">Match Count</th>
                  <th class="py-2 px-3 text-right">% of Comparable</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 px-3 font-medium text-gray-300">InterState</td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ props.report.zeroMarginDetail.matchInter }}
                  </td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ props.report.zeroMarginDetail.percentInter.toFixed(2) }}%
                  </td>
                </tr>
                <tr>
                  <td class="py-2 px-3 font-medium text-gray-300">IntraState</td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ props.report.zeroMarginDetail.matchIntra }}
                  </td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ props.report.zeroMarginDetail.percentIntra.toFixed(2) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SELL TO / BUY FROM Section -->
        <div
          v-if="props.report.file2 && (props.report.sellToAnalysis || props.report.buyFromAnalysis)"
          class="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <!-- SELL TO Column -->
          <div v-if="props.report.sellToAnalysis" class="rounded-lg overflow-hidden">
            <h4 class="text-lg text-fbWhite font-medium mb-4 uppercase ml-2">
              SELL TO
              <span class="block text-sm text-gray-400">
                {{ props.report.file1.fileName }} <span class="lowercase">rate</span> &lt;
                {{ props.report.file2.fileName }} <span class="lowercase">rate</span>
              </span>
            </h4>
            <MarginAnalysisTable :analysis="props.report.sellToAnalysis" />
          </div>

          <!-- BUY FROM Column -->
          <div v-if="props.report.buyFromAnalysis" class="rounded-lg overflow-hidden">
            <h4 class="text-lg text-fbWhite font-medium mb-4 uppercase ml-2">
              BUY FROM
              <span class="block text-sm text-gray-400">
                {{ props.report.file1.fileName }} <span class="lowercase">rate</span> &gt;
                {{ props.report.file2.fileName }} <span class="lowercase">rate</span>
              </span>
            </h4>
            <MarginAnalysisTable :analysis="props.report.buyFromAnalysis" />
          </div>
        </div>
      </div>
      <div v-else class="text-center text-xl text-muted-foreground">
        No code report data available. Generate a report to see details.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import {
    type USCodeReport,
    type USFileReport,
    type MarginAnalysis,
    type USStandardizedData,
  } from '@/types/domains/us-types';
  import USCodeSummary from '@/components/us/USCodeSummary.vue';
  import MarginAnalysisTable from '@/components/us/MarginAnalysisTable.vue';
  import { useUsStore } from '@/stores/us-store';
  import { USService } from '@/services/us.service';

  const usStore = useUsStore();
  const usService = new USService();

  const props = defineProps<{
    report: USCodeReport | null;
  }>();
  
  

  function isValidFileReport(fileReport: any): fileReport is USFileReport {
    return fileReport && typeof fileReport === 'object' && 'fileName' in fileReport;
  }

  function getComponentIdForFile(fileName: string): 'us1' | 'us2' {
    // This helper function might need adjustment if store structure changes
    for (const [componentId, fileInfo] of usStore.filesUploaded.entries()) {
      if (fileInfo.fileName === fileName) {
        return componentId as 'us1' | 'us2';
      }
    }
    console.warn(`ComponentId not found for filename: ${fileName}`);
    return 'us1'; // Default or error case
  }
</script>
