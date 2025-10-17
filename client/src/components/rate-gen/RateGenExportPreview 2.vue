<template>
  <div class="border border-fbWhite/20 rounded-lg p-6 bg-fbBlack/50">
    <h4 class="text-lg font-semibold text-fbWhite mb-4">Export Preview</h4>
    <p class="text-xs text-fbWhite/70 mb-4">
      Sample of how your exported data will appear (showing first 10 records)
    </p>
    
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      <span class="ml-3 text-fbWhite/70">Loading preview...</span>
    </div>
    
    <div v-else-if="data.length === 0" class="text-center py-8">
      <p class="text-fbWhite/50">No data available for preview</p>
    </div>
    
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-fbWhite/20">
            <!-- Dynamic headers based on format options -->
            <th v-if="formatOptions.npanxxFormat === 'split'" class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">NPA</th>
            <th v-if="formatOptions.npanxxFormat === 'split'" class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">NXX</th>
            <th v-if="formatOptions.npanxxFormat === 'combined'" class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">NPANXX</th>
            
            <th class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Interstate</th>
            <th class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Intrastate</th>
            <th class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Indeterminate</th>
            <th class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Effective Date</th>
            
            <th v-if="formatOptions.includeProviderColumn" class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Provider</th>
            <th v-if="formatOptions.includeStateColumn" class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">State</th>
            <th v-if="formatOptions.includeCountryColumn" class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Country</th>
            <th v-if="formatOptions.includeRegionColumn" class="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Region</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(row, index) in data.slice(0, 10)" 
            :key="index"
            class="border-b border-gray-700/30 hover:bg-fbWhite/5"
          >
            <!-- NPANXX columns -->
            <td v-if="formatOptions.npanxxFormat === 'split'" class="py-2 px-3 text-fbWhite font-mono">
              {{ formatOptions.includeCountryCode ? `1${row.prefix?.substring(0, 3) || ''}` : (row.prefix?.substring(0, 3) || '---') }}
            </td>
            <td v-if="formatOptions.npanxxFormat === 'split'" class="py-2 px-3 text-fbWhite font-mono">{{ row.prefix?.substring(3, 6) || '---' }}</td>
            <td v-if="formatOptions.npanxxFormat === 'combined'" class="py-2 px-3 text-fbWhite font-mono">
              {{ formatOptions.includeCountryCode ? `1${row.prefix}` : row.prefix }}
            </td>
            
            <!-- Rate columns -->
            <td class="py-2 px-3 text-fbWhite font-mono">${{ formatRate(row.rate) }}</td>
            <td class="py-2 px-3 text-fbWhite font-mono">${{ formatRate(row.intrastate) }}</td>
            <td class="py-2 px-3 text-fbWhite font-mono">${{ formatRate(row.indeterminate) }}</td>
            <td class="py-2 px-3 text-fbWhite font-mono">{{ formatEffectiveDate() }}</td>
            
            <!-- Optional columns -->
            <td v-if="formatOptions.includeProviderColumn" class="py-2 px-3 text-fbWhite/80 text-xs">{{ row.selectedProvider || 'Unknown' }}</td>
            <td v-if="formatOptions.includeStateColumn" class="py-2 px-3 text-fbWhite/80 text-xs">{{ row.stateCode || getStateFromNPA(row.prefix) || 'Unknown' }}</td>
            <td v-if="formatOptions.includeCountryColumn" class="py-2 px-3 text-fbWhite/80 text-xs">{{ row.countryCode || getCountryFromNPA(row.prefix) || 'Unknown' }}</td>
            <td v-if="formatOptions.includeRegionColumn" class="py-2 px-3 text-fbWhite/80 text-xs">{{ row.region || getRegionFromNPA(row.prefix) || 'Unknown' }}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="mt-4 flex items-center justify-between text-xs text-fbWhite/50">
        <span>Showing {{ Math.min(10, props.data.length) }} of {{ (props.totalRecords || 0).toLocaleString() }} records</span>
        <span>Actual export will include all {{ (props.totalRecords || 0).toLocaleString() }} records</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RateGenExportOptions } from '@/types/domains/rate-gen-types';
import { useLergStoreV2 } from '@/stores/lerg-store-v2';

const props = defineProps<{
  data: any[];
  formatOptions: RateGenExportOptions;
  loading: boolean;
  totalRecords?: number;
}>();

const lergStore = useLergStoreV2();

function formatRate(rate: number | undefined): string {
  if (rate === undefined || rate === null || isNaN(rate)) return '0.000000';
  return rate.toFixed(6);
}

function formatEffectiveDate(): string {
  const now = new Date();
  return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()}`;
}

// Helper functions for geographic data (will be enhanced when LERG integration is complete)
function getStateFromNPA(prefix: string | undefined): string | null {
  if (!prefix || prefix.length < 3) return null;
  
  const npa = prefix.substring(0, 3);
  const npaInfo = lergStore.getNPAInfo(npa);
  return npaInfo?.state_province_code || null;
}

function getCountryFromNPA(prefix: string | undefined): string | null {
  if (!prefix || prefix.length < 3) return null;
  
  const npa = prefix.substring(0, 3);
  const npaInfo = lergStore.getNPAInfo(npa);
  return npaInfo?.country_code || 'US';
}

function getRegionFromNPA(prefix: string | undefined): string | null {
  if (!prefix || prefix.length < 3) return null;
  
  const npa = prefix.substring(0, 3);
  const npaInfo = lergStore.getNPAInfo(npa);
  return npaInfo?.region || null;
}
</script>