<template>
  <div class="bg-gray-800 rounded-lg p-6 min-w-content">
    <div v-if="report" class="space-y-8">
      <h2 class="text-xl text-white font-semibold">Code Report</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          v-for="file in ['file1', 'file2']"
          :key="file"
          v-show="report[file as keyof typeof report]?.fileName"
          class="rounded-lg overflow-hidden bg-gray-900/50"
        >
          <h2 class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700">
            <span class="text-accent">{{ report[file as keyof typeof report]?.fileName }}</span>
          </h2>
          <div class="p-6">
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 text-gray-400">Total NPANXX:</td>
                  <td class="py-2 text-right">
                    {{ report[file as keyof typeof report]?.totalNPANXX }}
                  </td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 text-gray-400">Unique NPAs:</td>
                  <td class="py-2 text-right">
                    {{ report[file as keyof typeof report]?.uniqueNPA }}
                  </td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 text-gray-400">Unique NXXs:</td>
                  <td class="py-2 text-right">
                    {{ report[file as keyof typeof report]?.uniqueNXX }}
                  </td>
                </tr>
                <tr>
                  <td class="py-2 font-medium text-gray-400">Coverage Percentage:</td>
                  <td class="py-2 text-right">
                    {{ report[file as keyof typeof report]?.coveragePercentage.toFixed(2) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Comparison Section - Only show when two files are available -->
      <div v-if="report.file2?.fileName" class="rounded-lg overflow-hidden bg-gray-900/50">
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
              <tr>
                <td class="py-2 font-medium text-gray-400">Non-Matched Codes Percentage:</td>
                <td class="py-2 text-right text-foreground">
                  {{ report.nonMatchedCodesPercentage.toFixed(2) }}%
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
</template>

<script setup lang="ts">
import { type USCodeReport } from '@/types/domains/us-types';

defineProps<{
  report: USCodeReport | null;
}>();
</script>
