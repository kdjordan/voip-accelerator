<template>
  <div class="overflow-x-auto">
    <div class="bg-gray-800 rounded-lg p-6 min-w-content">
      <div v-if="report" class="space-y-8">
        <h2 class="text-xl text-white font-semibold">Code Report</h2>

        <!-- Comparison Section - Moved to the top -->
        <div
          v-if="isValidFileReport(report.file2)"
          class="rounded-lg overflow-hidden bg-gray-900/50"
        >
          <h2 class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700">
            <span class="text-accent">Comparison</span>
          </h2>
          <div class="p-6">
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Matched Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.matchedCodes }}
                  </td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Non-Matched Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.nonMatchedCodes }}
                  </td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Matched Codes Percentage:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.matchedCodesPercentage.toFixed(2) }}%
                  </td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Non-Matched Codes Percentage:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.nonMatchedCodesPercentage.toFixed(2) }}%
                  </td>
                </tr>
                <!-- NPA Match Information -->
                <tr v-if="report.matchedNPAs !== undefined" class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Matched Area Codes (NPAs):</td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.matchedNPAs }} of {{ report.totalUniqueNPAs }}
                  </td>
                </tr>
                <tr v-if="report.matchedNPAs !== undefined">
                  <td class="py-2 font-medium text-gray-400">Area Code Match Percentage:</td>
                  <td class="py-2 text-right text-foreground">
                    {{
                      report.totalUniqueNPAs && report.totalUniqueNPAs > 0
                        ? ((report.matchedNPAs / report.totalUniqueNPAs) * 100).toFixed(2)
                        : '0.00'
                    }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

     
      </div>

      <div v-else class="text-center text-xl text-muted-foreground">
        No code report data available.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { type USCodeReport, type USFileReport } from '@/types/domains/us-types';
  import USCodeSummary from '@/components/us/USCodeSummary.vue';
  import { useUsStore } from '@/stores/us-store';

  const usStore = useUsStore();

  defineProps<{
    report: USCodeReport | null;
  }>();

  // Helper function to check if a file report is valid
  function isValidFileReport(fileReport: any): fileReport is USFileReport {
    return fileReport && typeof fileReport === 'object' && 'fileName' in fileReport;
  }

  // Helper function to find the componentId ('us1' or 'us2') associated with a filename
  function getComponentIdForFile(fileName: string): 'us1' | 'us2' {
    for (const [componentId, fileInfo] of usStore.filesUploaded.entries()) {
      if (fileInfo.fileName === fileName) {
        return componentId as 'us1' | 'us2';
      }
    }
    console.warn(`ComponentId not found for filename: ${fileName}`);
    return 'us1';
  }
</script>
