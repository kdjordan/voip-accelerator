<template>
  <div class="border border-fbWhite/20 rounded-lg p-4">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-fbWhite">Preview</h4>
      <span class="text-xs text-fbWhite/70">First 10 rows</span>
    </div>

    <div v-if="loading || isFormatting" class="flex justify-center py-8">
      <ArrowPathIcon class="w-8 h-8 text-accent animate-spin" />
    </div>

    <div v-else-if="previewRows.length === 0" class="text-center py-8 text-sm text-fbWhite/70">
      No data to preview
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-fbWhite/20">
        <thead class="bg-fbHover">
          <tr>
            <th
              v-for="header in previewHeaders"
              :key="header"
              class="px-3 py-2 text-left text-xs font-medium text-fbWhite/70 uppercase tracking-wider"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-fbBlack divide-y divide-fbWhite/20">
          <tr v-for="(row, index) in previewRows" :key="index">
            <td
              v-for="header in previewHeaders"
              :key="header"
              class="px-3 py-2 whitespace-nowrap text-sm text-fbWhite"
            >
              {{ formatCellValue(row[header], header) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import type { USExportFormatOptions } from '@/types/exports';
import { ArrowPathIcon } from '@heroicons/vue/24/outline';
import { useUSExportConfig } from '@/composables/exports/useUSExportConfig';

const props = defineProps<{
  data: any[];
  formatOptions: USExportFormatOptions;
  loading: boolean;
}>();

// Use the same transform function as the working export
const { transformDataForExport } = useUSExportConfig();

// Lightweight formatting state
const isFormatting = ref(false);

// Generate preview using the actual transform function
const previewTransformed = computed(() => {
  if (!props.data || props.data.length === 0) {
    return { headers: [], rows: [] };
  }

  // Take only first 10 rows for preview and add the file names
  const sampleData = props.data.slice(0, 10).map(record => {
    // Calculate average rates for each file to determine overall cheaper
    const avgFile1 = ((record.file1_inter || 0) + (record.file1_intra || 0) + (record.file1_indeterm || 0)) / 3;
    const avgFile2 = ((record.file2_inter || 0) + (record.file2_intra || 0) + (record.file2_indeterm || 0)) / 3;
    
    let cheaperFile = 'Same';
    if (avgFile1 !== avgFile2) {
      cheaperFile = avgFile1 < avgFile2 ? (record.destinationName || 'File 1') : (record.destinationName2 || 'File 2');
    }

    return {
      ...record,
      destinationName: record.destinationName || 'File 1', // Use existing or fallback
      destinationName2: record.destinationName2 || 'File 2', // Use existing or fallback
      rate: record.file1_inter, // Map comparison fields to expected names
      rate2: record.file2_inter,
      difference: (record.file2_inter || 0) - (record.file1_inter || 0), // Calculate actual difference
      differencePercentage: record.diff_inter_pct,
      cheaperFile: cheaperFile
    };
  });

  // Use the exact same transform logic as the working export
  return transformDataForExport(sampleData, props.formatOptions, 'comparison');
});

const previewHeaders = computed(() => previewTransformed.value.headers);
const previewRows = computed(() => previewTransformed.value.rows);

// Watch for format changes and show brief loading state
watch(
  () => props.formatOptions.npanxxFormat,
  async () => {
    isFormatting.value = true;
    await nextTick();
    // Brief delay to show user something is happening
    setTimeout(() => {
      isFormatting.value = false;
    }, 100);
  }
);

// Format cell values based on column type
function formatCellValue(value: any, header: string): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Format rate columns with 6 decimal places
  if (header.includes('Rate (File')) {
    return typeof value === 'number' ? value.toFixed(6) : value;
  }

  // Format difference with 6 decimal places
  if (header === 'Difference') {
    return typeof value === 'number' ? value.toFixed(6) : value;
  }

  // Format percentage with 2 decimal places
  if (header === 'Difference %') {
    return typeof value === 'number' ? value.toFixed(2) : value;
  }

  return String(value);
}
</script>