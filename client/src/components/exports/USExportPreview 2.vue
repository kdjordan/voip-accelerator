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
              {{ row[header] || 'N/A' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch, nextTick, onMounted } from 'vue';
  import type { USExportFormatOptions } from '@/types/exports';
  import { ArrowPathIcon } from '@heroicons/vue/24/outline';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  
  const props = defineProps<{
    data: any[];
    formatOptions: USExportFormatOptions;
    loading: boolean;
    exportType?: 'rate-sheet' | 'comparison';
  }>();

  const lergStore = useLergStoreV2();

  // Ensure LERG store is loaded
  onMounted(async () => {
    if (!lergStore.isInitialized) {
      await lergStore.loadData();
    }
  });

  // Lightweight formatting state
  const isFormatting = ref(false);

  // Lightweight header computation - instant, no heavy operations
  const previewHeaders = computed(() => {
    const headers: string[] = [];

    // NPANXX format - instant header change
    if (props.formatOptions.npanxxFormat === 'split') {
      headers.push('NPA', 'NXX');
    } else {
      headers.push('NPANXX');
    }

    // Optional columns
    if (props.formatOptions.includeStateColumn) {
      headers.push('State');
    }

    // Core rate columns
    if (props.formatOptions.includeCountryColumn) {
      headers.push('Country');
    }
    headers.push('Interstate Rate', 'Intrastate Rate', 'Indeterminate Rate');

    return headers;
  });

  // Lightweight preview rows - only first 10 rows, minimal processing
  const previewRows = computed(() => {
    // Take only first 10 rows for preview
    const sampleData = props.data.slice(0, 10);

    return sampleData.map((row) => {
      const formatted: Record<string, string | number> = {};

      // NPANXX format - lightweight string operations only
      if (props.formatOptions.npanxxFormat === 'split') {
        const npanxx = String(row.npanxx || '');
        const npa = npanxx.slice(0, 3);
        const nxx = npanxx.slice(3, 6).padStart(3, '0'); // Ensure 3 digits with leading zeros
        
        // Store as strings to match export behavior
        formatted['NPA'] = props.formatOptions.includeCountryCode ? `1${npa}` : npa;
        formatted['NXX'] = nxx; // String with leading zeros preserved
      } else {
        formatted['NPANXX'] = props.formatOptions.includeCountryCode
          ? `1${row.npanxx}`
          : String(row.npanxx || '');
      }

      // Optional columns
      if (props.formatOptions.includeStateColumn) {
        formatted['State'] = row.stateCode || 'N/A';
      }

      // Core rate data
      if (props.formatOptions.includeCountryColumn) {
        // First check for direct country fields
        let country = row.country || row.countryCode || row.country_code;
        
        // If no direct country field, derive from NPA using LERG store
        // USRateSheetEntry has 'npa' field, not 'npanxx'
        if (!country && row.npa) {
          const npaInfo = lergStore.getNPAInfo(row.npa);
          if (!npaInfo) {
            console.warn(`No LERG info found for NPA: ${row.npa}. LERG initialized: ${lergStore.isInitialized}`);
          } else {
            country = npaInfo.country_code;
          }
        }
        
        formatted['Country'] = country || 'US';
      }
      formatted['Interstate Rate'] = formatRate(row.interRate);
      formatted['Intrastate Rate'] = formatRate(row.intraRate);
      formatted['Indeterminate Rate'] = formatRate(row.indetermRate);

      return formatted;
    });
  });

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

  function formatRate(rate: number | null | undefined): string {
    if (rate === null || rate === undefined || typeof rate !== 'number' || isNaN(rate)) {
      return 'N/A';
    }
    return `$${rate.toFixed(6)}`;
  }
</script>
