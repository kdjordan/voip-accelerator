<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div class="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600">
        <h3 class="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Rates Generated</h3>
        <p class="text-xl sm:text-2xl font-bold text-fbWhite">{{ deck.rowCount.toLocaleString() }}</p>
      </div>
      
      <div class="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600">
        <h3 class="text-xs sm:text-sm font-medium text-gray-400 mb-1">LCR Strategy</h3>
        <p class="text-base sm:text-lg font-semibold text-accent">{{ getStrategyLabel(deck.lcrStrategy) }}</p>
      </div>
      
      <div class="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600 sm:col-span-2 lg:col-span-1">
        <h3 class="text-xs sm:text-sm font-medium text-gray-400 mb-1">Markup Applied</h3>
        <p class="text-base sm:text-lg font-semibold text-fbWhite">
          {{ deck.markupPercentage > 0 ? `${deck.markupPercentage}%` : `$${deck.markupFixed?.toFixed(4) || '0.0000'}` }}
        </p>
      </div>
    </div>

    <!-- Provider Summary -->
    <div class="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600">
      <h3 class="text-base sm:text-lg font-semibold text-fbWhite mb-2 sm:mb-3">Providers Used</h3>
      <div class="flex flex-wrap gap-2">
        <BaseBadge 
          v-for="provider in providerNames"
          :key="provider"
          variant="accent"
          size="standard"
        >
          {{ provider }}
        </BaseBadge>
      </div>
    </div>

    <!-- Rate Preview Table -->
    <div class="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-1 sm:space-y-0">
        <h3 class="text-base sm:text-lg font-semibold text-fbWhite">Rate Preview</h3>
        <p class="text-xs sm:text-sm text-gray-400">Showing first 20 rates</p>
      </div>
      
      <div class="overflow-x-auto -mx-3 sm:-mx-4">
        <table class="w-full text-xs sm:text-sm min-w-[600px]">
          <thead>
            <tr class="border-b border-gray-600">
              <th class="text-left py-2 text-gray-300 font-medium">Prefix</th>
              <th class="text-right py-2 text-gray-300 font-medium">Interstate</th>
              <th class="text-right py-2 text-gray-300 font-medium">Intrastate</th>
              <th class="text-right py-2 text-gray-300 font-medium">Indeterminate</th>
              <th class="text-left py-2 text-gray-300 font-medium">Selected Provider</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(rate, index) in previewRates" 
              :key="rate.prefix"
              :class="index % 2 === 0 ? 'bg-gray-800/30' : ''"
              class="hover:bg-gray-600/30 transition-colors"
            >
              <td class="py-2 text-fbWhite font-mono">{{ rate.prefix }}</td>
              <td class="py-2 text-right text-fbWhite font-mono">${{ rate.rate.toFixed(6) }}</td>
              <td class="py-2 text-right text-fbWhite font-mono">${{ rate.intrastate.toFixed(6) }}</td>
              <td class="py-2 text-right text-fbWhite font-mono">${{ rate.indeterminate.toFixed(6) }}</td>
              <td class="py-2 text-gray-300 truncate max-w-32">{{ rate.selectedProvider }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="mt-4 text-center">
        <p class="text-sm text-gray-400">
          {{ deck.rowCount > 20 ? `Showing 20 of ${deck.rowCount.toLocaleString()} total rates` : `All ${deck.rowCount} rates shown` }}
        </p>
      </div>
    </div>

    <!-- Export Actions -->
    <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
      <BaseButton
        variant="primary"
        :icon="ArrowDownTrayIcon"
        @click="$emit('export', 'csv')"
      >
        Export as CSV
      </BaseButton>
      
      <BaseButton
        variant="secondary"
        :icon="ChartBarIcon"
        @click="showAnalytics = !showAnalytics"
      >
        {{ showAnalytics ? 'Hide' : 'Show' }} Analytics
      </BaseButton>
    </div>

    <!-- Analytics Section (Expandable) -->
    <div v-if="showAnalytics" class="bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-600">
      <h3 class="text-lg font-semibold text-fbWhite mb-4">Rate Analytics</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Rate Distribution -->
        <div>
          <h4 class="text-sm font-medium text-gray-300 mb-2">Interstate Rate Distribution</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Minimum:</span>
              <span class="text-fbWhite font-mono">${{ analytics.minRate.toFixed(6) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Maximum:</span>
              <span class="text-fbWhite font-mono">${{ analytics.maxRate.toFixed(6) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Average:</span>
              <span class="text-fbWhite font-mono">${{ analytics.avgRate.toFixed(6) }}</span>
            </div>
          </div>
        </div>

        <!-- Provider Usage -->
        <div>
          <h4 class="text-sm font-medium text-gray-300 mb-2">Provider Selection (Interstate)</h4>
          <div class="space-y-2 text-sm">
            <div 
              v-for="(usage, provider) in analytics.providerUsage" 
              :key="provider"
              class="flex justify-between"
            >
              <span class="text-gray-400 truncate">{{ provider }}:</span>
              <span class="text-fbWhite">{{ usage.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';
import type { GeneratedRateDeck, GeneratedRateRecord } from '@/types/domains/rate-gen-types';
import { ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/vue/24/outline';
import BaseButton from '@/components/shared/BaseButton.vue';
import BaseBadge from '@/components/shared/BaseBadge.vue';

interface Props {
  deck: GeneratedRateDeck;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'export': [format: 'csv' | 'excel'];
}>();

const store = useRateGenStore();
const service = new RateGenService();

// State
const previewRates = ref<GeneratedRateRecord[]>([]);
const allRates = ref<GeneratedRateRecord[]>([]);
const showAnalytics = ref(false);
const loading = ref(true);

// Computed
const providerNames = computed(() => {
  return store.providerList
    .filter(p => props.deck.providerIds.includes(p.id))
    .map(p => p.name);
});

const analytics = computed(() => {
  if (allRates.value.length === 0) {
    return {
      minRate: 0,
      maxRate: 0,
      avgRate: 0,
      providerUsage: {}
    };
  }

  // Use all rates for analytics, filter out zero/invalid rates
  const validRates = allRates.value
    .map(r => r.rate)
    .filter(r => r > 0 && !isNaN(r) && isFinite(r));
  
  if (validRates.length === 0) {
    return {
      minRate: 0,
      maxRate: 0,
      avgRate: 0,
      providerUsage: {}
    };
  }

  const minRate = Math.min(...validRates);
  const maxRate = Math.max(...validRates);
  const avgRate = validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length;

  // Provider usage calculation using all rates
  const providerCounts: Record<string, number> = {};
  allRates.value.forEach(rate => {
    if (rate.selectedProvider && rate.rate > 0) {
      const provider = rate.selectedProvider;
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    }
  });

  const total = allRates.value.filter(r => r.rate > 0).length;
  const providerUsage: Record<string, number> = {};
  Object.entries(providerCounts).forEach(([provider, count]) => {
    providerUsage[provider] = total > 0 ? (count / total) * 100 : 0;
  });

  return {
    minRate,
    maxRate,
    avgRate,
    providerUsage
  };
});

// Methods
function getStrategyLabel(strategy: string): string {
  const labels: Record<string, string> = {
    'LCR1': 'Cheapest Provider',
    'LCR2': 'Second Cheapest',
    'LCR3': 'Third Cheapest',
    'Average': 'Average of Top 3',
  };
  return labels[strategy] || strategy;
}

async function loadPreviewRates() {
  try {
    loading.value = true;
    
    // For now, use the temporary rates from service
    // In production, you might want to load from IndexedDB
    const loadedRates = (service as any).temporaryGeneratedRates || [];
    
    console.log('[RateGenResults] Loaded rates count:', loadedRates.length);
    console.log('[RateGenResults] First few rates:', loadedRates.slice(0, 3));
    
    // Store all rates for analytics
    allRates.value = loadedRates;
    
    // Take first 20 rates for preview
    previewRates.value = loadedRates.slice(0, 20);
    
  } catch (error) {
    console.error('[RateGenResults] Error loading preview rates:', error);
    store.addError('Failed to load rate preview');
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadPreviewRates();
});
</script>