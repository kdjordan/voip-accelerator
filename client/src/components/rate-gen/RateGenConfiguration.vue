<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
    <!-- Left Column: Configuration Settings -->
    <div class="bg-gray-700/50 rounded-lg p-6 border border-gray-600 space-y-6">
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

      <!-- LCR Depth -->
      <div>
        <label for="lcr-depth" class="block text-sm font-medium text-fbWhite mb-2">
          LCR Depth
        </label>
        <select
          id="lcr-depth"
          v-model="config.strategy"
          aria-label="LCR depth selection"
          aria-required="true"
          class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-fbWhite 
                 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent 
                 transition-colors cursor-pointer"
        >
          <option value="">Select LCR Depth</option>
          <option value="LCR1">LCR 1</option>
          <option value="LCR2" v-if="providerCount >= 2">LCR 2</option>
          <option value="LCR3" v-if="providerCount >= 3">LCR 3</option>
          <option value="LCR4" v-if="providerCount >= 4">LCR 4</option>
          <option value="LCR5" v-if="providerCount >= 5">LCR 5</option>
          <option value="Average" v-if="providerCount >= 3">Average of All {{ providerCount }}</option>
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

    </div>

    <!-- Right Column: Configuration Summary -->
    <div class="bg-gray-700/50 rounded-lg p-6 border border-gray-600" role="region" aria-label="Configuration summary">
      <h3 class="text-lg font-semibold text-fbWhite mb-4">Configuration Summary</h3>
      <ul class="space-y-3 text-sm text-gray-300">
        <li v-if="config.name">
          <span class="block text-gray-400 text-xs uppercase tracking-wide mb-1">Rate Deck Name</span>
          <span class="text-fbWhite font-medium">{{ config.name }}</span>
        </li>
        <li v-if="config.strategy">
          <span class="block text-gray-400 text-xs uppercase tracking-wide mb-1">LCR Depth</span>
          <span class="text-accent font-medium">{{ config.strategy }}</span>
        </li>
        <li v-if="config.markupValue">
          <span class="block text-gray-400 text-xs uppercase tracking-wide mb-1">Markup</span>
          <span class="text-fbWhite font-medium">
            {{ config.markupType === 'percentage' ? `${config.markupValue}%` : `$${config.markupValue.toFixed(4)}` }}
          </span>
        </li>
        <li>
          <span class="block text-gray-400 text-xs uppercase tracking-wide mb-1">Effective Date</span>
          <span class="text-fbWhite font-medium">{{ formatDate(config.effectiveDate) }}</span>
        </li>
        <li>
          <div class="bg-gray-800/50 rounded-lg overflow-hidden">
            <!-- Provider Table Header -->
            <div class="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-700/50 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <div>Provider</div>
              <div class="text-right">Inter</div>
              <div class="text-right">Intra</div>
              <div class="text-right">Indeterm</div>
            </div>
            <!-- Provider Table Rows -->
            <div v-for="provider in store.providerList" :key="provider.id" 
                 class="grid grid-cols-4 gap-2 px-3 py-2 border-t border-gray-700/50 text-xs hover:bg-gray-700/30 transition-colors">
              <div class="text-fbWhite font-medium truncate" :title="provider.name">
                {{ provider.name }}
              </div>
              <div class="text-right text-gray-300 font-mono">
                ${{ formatRate(provider.avgInterRate) }}
              </div>
              <div class="text-right text-gray-300 font-mono">
                ${{ formatRate(provider.avgIntraRate) }}
              </div>
              <div class="text-right text-gray-300 font-mono">
                ${{ formatRate(provider.avgIndeterminateRate) }}
              </div>
            </div>
          </div>
        </li>
      </ul>
      
      <!-- Inline Generation Progress -->
      <InlineGenerationProgress 
        :is-generating="store.isGenerating"
        :progress="store.generationProgress"
        :provider-count="providerCount"
      />
    </div>
  </div>

  <!-- Generate Button - Outside the grid -->
  <div class="flex justify-end mt-6">
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import type { LCRConfig } from '@/types/domains/rate-gen-types';
import { ArrowRightIcon } from '@heroicons/vue/24/outline';
import BaseButton from '@/components/shared/BaseButton.vue';
import InlineGenerationProgress from '@/components/rate-gen/InlineGenerationProgress.vue';

// Emits
const emit = defineEmits<{
  'generate-rates': [];
}>();

const store = useRateGenStore();

// Helper to get date 7 days from now
const getDefaultEffectiveDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

// Local configuration state
const config = ref({
  name: '',
  strategy: '',
  markupType: 'percentage' as 'percentage' | 'fixed',
  markupValue: 0,
  effectiveDate: getDefaultEffectiveDate(), // 7 days from today
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

// Helper functions (getStrategyLabel removed as it's no longer needed)

function formatDate(dateString: string): string {
  // Parse the date string manually to avoid timezone issues
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatRate(rate: number): string {
  if (!rate || rate === 0) return '0.000000';
  return rate.toFixed(6);
}
</script>