<template>
  <div class="code-report bg-background rounded-lg m-auto p-6 min-w-full max-w-4xl">
    <h1 class="text-center text-5xl font-bold mb-8 text-foreground uppercase">
      AZ CODE REPORT
    </h1>
    
    <div v-if="report" class="space-y-8">
      <div v-for="file in fileKeys" :key="file" class="bg-muted p-6 rounded-lg shadow-md">
        <h2 class="text-3xl font-semibold mb-4 text-primary">{{ getFileName(file) }}</h2>
        <table class="w-full text-left">
          <tbody>
            <tr class="border-b border-gray-200">
              <td class="py-2 font-semibold text-muted-foreground">Total Codes:</td>
              <td class="py-2 text-foreground">{{ getTotalCodes(file) }}</td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="py-2 font-semibold text-muted-foreground">Unique Codes:</td>
              <td class="py-2 text-foreground">{{ getUniqueCodes(file) }}</td>
            </tr>
            <tr>
              <td class="py-2 font-semibold text-muted-foreground">Unique Codes Percentage:</td>
              <td class="py-2 text-foreground">{{ getUniqueCodesPercentage(file) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="bg-muted p-6 rounded-lg shadow-md">
        <h2 class="text-3xl font-semibold mb-4 text-primary">Comparison</h2>
        <table class="w-full text-left">
          <tbody>
            <tr class="border-b border-gray-200">
              <td class="py-2 font-semibold text-muted-foreground">Matched Codes:</td>
              <td class="py-2 text-foreground">{{ report.matchedCodes }}</td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="py-2 font-semibold text-muted-foreground">Non-Matched Codes:</td>
              <td class="py-2 text-foreground">{{ report.nonMatchedCodes }}</td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="py-2 font-semibold text-muted-foreground">Matched Codes Percentage:</td>
              <td class="py-2 text-foreground">{{ report.matchedCodesPercentage.toFixed(2) }}%</td>
            </tr>
            <tr>
              <td class="py-2 font-semibold text-muted-foreground">Non-Matched Codes Percentage:</td>
              <td class="py-2 text-foreground">{{ report.nonMatchedCodesPercentage.toFixed(2) }}%</td>
            </tr>
          </tbody>
        </table>
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

function getUniqueCodes(file: FileKey): number {
  return props.report?.[file].uniqueCodes.size ?? 0;
}

function getUniqueCodesPercentage(file: FileKey): string {
  return props.report?.[file].uniqueCodesPercentage.toFixed(2) ?? '0.00';
}
</script>

<style scoped>
.code-report {
  font-family: Arial, sans-serif;
}

table {
  border-collapse: separate;
  border-spacing: 0 0.5rem;
}

td {
  padding: 0.75rem 1rem;
}

tr:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}
</style>
