<template>
  <div class="bg-background rounded-lg m-auto p-6 w-full max-w-7xl font-sans relative">
    <div class="mb-8 text-center">
      <h1 class="text-5xl font-bold text-foreground uppercase inline-block">
        AZ CODE REPORT
      </h1>
    </div>
    
    <button class="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
      Reset
    </button>
    
    <div v-if="report" class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div v-for="file in fileKeys" :key="file" class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <h2 class="py-3 text-xl font-semibold text-center text-foreground bg-gradient-to-r from-blue-950 via-cyan-900 to-teal-900 px-6">
            <span class="text-gray-300 font-bold">{{ getFileName(file) }}</span>
          </h2>
          <div class="p-6">
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Total Codes:</td>
                  <td class="py-2 text-right text-foreground">{{ getTotalCodes(file) }}</td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Total Destinations:</td>
                  <td class="py-2 text-right text-foreground">{{ getTotalDestinations(file) }}</td>
                </tr>
                <tr>
                  <td class="py-2 font-medium text-gray-400">Unique Destinations Percentage:</td>
                  <td class="py-2 text-right text-foreground">{{ getUniqueDestinationsPercentage(file) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <h2 class="py-3 text-xl font-semibold text-center text-foreground bg-gradient-to-r from-blue-950 via-cyan-900 to-teal-900 px-6">
          <span class="text-gray-300 font-bold">Comparison</span>
        </h2>
        <div class="p-6">
          <table class="w-full">
            <tbody>
              <tr class="border-b border-gray-700">
                <td class="py-2 font-medium text-gray-400">Matched Codes:</td>
                <td class="py-2 text-right text-foreground">{{ report.matchedCodes }}</td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="py-2 font-medium text-gray-400">Non-Matched Codes:</td>
                <td class="py-2 text-right text-foreground">{{ report.nonMatchedCodes }}</td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="py-2 font-medium text-gray-400">Matched Codes Percentage:</td>
                <td class="py-2 text-right text-foreground">{{ report.matchedCodesPercentage.toFixed(2) }}%</td>
              </tr>
              <tr>
                <td class="py-2 font-medium text-gray-400">Non-Matched Codes Percentage:</td>
                <td class="py-2 text-right text-foreground">{{ report.nonMatchedCodesPercentage.toFixed(2) }}%</td>
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
import { type AzCodeReport } from '../../types/app-types';

const props = defineProps<{
  report: AzCodeReport | null;
}>();

const fileKeys = ['file1', 'file2'] as const;
type FileKey = typeof fileKeys[number];

function getFileName(file: FileKey): string {
  return props.report?.[file].fileName ?? '';
}

function getTotalCodes(file: FileKey): number {
  return props.report?.[file].totalCodes ?? 0;
}

function getTotalDestinations(file: FileKey): number {
  return props.report?.[file].totalDestinations ?? 0;
}

function getUniqueDestinationsPercentage(file: FileKey): string {
  return props.report?.[file].uniqueDestinationsPercentage.toFixed(2) ?? '0.00';
}
</script>

<style scoped>
/* Remove or comment out this style block if it's not needed */
/*.code-report {
  font-family: Arial, sans-serif;
}*/
</style>
