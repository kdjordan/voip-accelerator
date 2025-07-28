<template>
  <div class="space-y-6">
    <!-- Rate Deck Name -->
    <div>
      <label for="rate-deck-name" class="block text-sm font-medium text-fbWhite mb-2">
        Rate Deck Name
      </label>
      <input
        id="rate-deck-name"
        v-model="config.name"
        type="text"
        placeholder="Enter rate deck name"
        aria-label="Rate deck name"
        aria-required="true"
        class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-fbWhite 
               placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 
               focus:ring-accent transition-colors"
      />
    </div>

    <!-- LCR Strategy -->
    <div>
      <label for="lcr-strategy" class="block text-sm font-medium text-fbWhite mb-2">
        LCR Strategy
      </label>
      <select
        id="lcr-strategy"
        v-model="config.strategy"
        aria-label="LCR strategy selection"
        aria-required="true"
        class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-fbWhite 
               focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent 
               transition-colors cursor-pointer"
      >
        <option value="">Select LCR Strategy</option>
        <option value="LCR1">LCR 1 (Cheapest Provider)</option>
        <option value="LCR2">LCR 2 (Second Cheapest)</option>
        <option value="LCR3" v-if="providerCount >= 3">LCR 3 (Third Cheapest)</option>
        <option value="Average" v-if="providerCount >= 3">Average of Top 3</option>
      </select>
    </div>

    <!-- Markup Configuration -->
    <div>
      <label class="block text-sm font-medium text-fbWhite mb-2">
        Markup Configuration
      </label>
      
      <!-- Markup Type Toggle -->
      <div class="flex gap-4 mb-3">
        <label class="flex items-center cursor-pointer">
          <input
            v-model="config.markupType"
            type="radio"
            value="percentage"
            class="mr-2 text-accent focus:ring-accent"
          />
          <span class="text-sm text-gray-300">Percentage</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input
            v-model="config.markupType"
            type="radio"
            value="fixed"
            class="mr-2 text-accent focus:ring-accent"
          />
          <span class="text-sm text-gray-300">Fixed Amount</span>
        </label>
      </div>

      <!-- Markup Value Input -->
      <div class="relative">
        <span 
          v-if="config.markupType === 'percentage'"
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        >
          %
        </span>
        <span 
          v-else
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        >
          $
        </span>
        <input
          v-model.number="config.markupValue"
          type="number"
          :placeholder="config.markupType === 'percentage' ? 'Enter percentage (e.g., 10)' : 'Enter amount (e.g., 0.01)'"
          :step="config.markupType === 'percentage' ? '1' : '0.0001'"
          :min="0"
          :aria-label="config.markupType === 'percentage' ? 'Markup percentage' : 'Markup fixed amount'"
          aria-required="true"
          class="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                 text-fbWhite placeholder-gray-400 focus:outline-none focus:border-accent 
                 focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>
    </div>

    <!-- Effective Date -->
    <div>
      <label for="effective-date" class="block text-sm font-medium text-fbWhite mb-2">
        Effective Date
      </label>
      <input
        id="effective-date"
        v-model="config.effectiveDate"
        type="date"
        :min="minDate"
        aria-label="Effective date"
        class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-fbWhite 
               focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent 
               transition-colors cursor-pointer"
      />
    </div>

    <!-- Summary Card -->
    <div class="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600" role="region" aria-label="Configuration summary">
      <h3 class="text-sm font-medium text-fbWhite mb-2">Configuration Summary</h3>
      <ul class="space-y-1 text-sm text-gray-300">
        <li v-if="config.name">
          <span class="text-gray-400">Name:</span> {{ config.name }}
        </li>
        <li v-if="config.strategy">
          <span class="text-gray-400">Strategy:</span> {{ getStrategyLabel(config.strategy) }}
        </li>
        <li v-if="config.markupValue">
          <span class="text-gray-400">Markup:</span> 
          {{ config.markupType === 'percentage' ? `${config.markupValue}%` : `$${config.markupValue.toFixed(4)}` }}
        </li>
        <li v-if="config.effectiveDate">
          <span class="text-gray-400">Effective:</span> {{ formatDate(config.effectiveDate) }}
        </li>
      </ul>
    </div>

    <!-- Generate Button -->
    <div class="mt-6 flex justify-end">
      <BaseButton
        variant="primary"
        size="standard"
        :icon="ArrowRightIcon"
        :disabled="!isConfigValid"
        :loading="store.isGenerating"
        @click="$emit('generate-rates')"
      >
        {{ store.isGenerating ? `Generating... ${store.generationProgress.toFixed(0)}%` : 'Generate' }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import type { LCRConfig } from '@/types/domains/rate-gen-types';
import { ArrowRightIcon } from '@heroicons/vue/24/outline';
import BaseButton from '@/components/shared/BaseButton.vue';

// Emits
const emit = defineEmits<{
  'generate-rates': [];
}>();

const store = useRateGenStore();

// Local configuration state
const config = ref({
  name: '',
  strategy: '',
  markupType: 'percentage' as 'percentage' | 'fixed',
  markupValue: 0,
  effectiveDate: new Date().toISOString().split('T')[0], // Today's date
});

// Computed
const providerCount = computed(() => store.providerCount);
const minDate = computed(() => new Date().toISOString().split('T')[0]); // Today as minimum date
const isConfigValid = computed(() => 
  config.value.name && 
  config.value.strategy && 
  config.value.markupValue > 0
);

// Watch for changes and update store
watch(config, (newConfig) => {
  if (newConfig.name && newConfig.strategy && newConfig.markupValue > 0) {
    const lcrConfig: LCRConfig = {
      strategy: newConfig.strategy as any,
      markupPercentage: newConfig.markupType === 'percentage' ? newConfig.markupValue : 0,
      markupFixed: newConfig.markupType === 'fixed' ? newConfig.markupValue : 0,
      providerIds: store.providerList.map(p => p.id),
      name: newConfig.name,
      effectiveDate: new Date(newConfig.effectiveDate),
    };
    store.setConfig(lcrConfig);
  } else {
    store.setConfig(null);
  }
}, { deep: true });

// Helper functions
function getStrategyLabel(strategy: string): string {
  const labels: Record<string, string> = {
    'LCR1': 'Cheapest Provider',
    'LCR2': 'Second Cheapest',
    'LCR3': 'Third Cheapest',
    'Average': 'Average of Top 3',
  };
  return labels[strategy] || strategy;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
</script>