<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';
import type { GeneratedRateDeck, LCRConfig } from '@/types/domains/rate-gen-types';

// Components
import RateGenFileUploads from '@/components/rate-gen/RateGenFileUploads.vue';
// import RateGenConfiguration from '@/components/rate-gen/RateGenConfiguration.vue';
// import RateGenAnalytics from '@/components/rate-gen/RateGenAnalytics.vue';
// import RateGenExportModal from '@/components/rate-gen/RateGenExportModal.vue';

const store = useRateGenStore();
const service = new RateGenService();

// State
const showExportModal = ref(false);
const generatedDeck = ref<GeneratedRateDeck | null>(null);

// Computed
const canGenerate = computed(() => 
  store.providerList.length >= 2 && 
  store.currentConfig !== null &&
  !store.isProcessing
);

const showConfiguration = computed(() => store.providerList.length >= 2);

// Methods
const handleGenerateRates = async () => {
  if (!store.currentConfig) return;
  
  try {
    generatedDeck.value = await service.generateRateDeck(store.currentConfig);
    showExportModal.value = true;
  } catch (error) {
    store.addError(`Failed to generate rates: ${(error as Error).message}`);
  }
};

const handleExport = async (format: 'csv' | 'excel') => {
  if (!generatedDeck.value) return;
  
  try {
    const blob = await service.exportRateDeck(generatedDeck.value.id, format);
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate-deck-${generatedDeck.value.lcrStrategy}-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showExportModal.value = false;
  } catch (error) {
    store.addError(`Failed to export: ${(error as Error).message}`);
  }
};

const handleClearAll = async () => {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    try {
      await service.clearAllData();
      generatedDeck.value = null;
    } catch (error) {
      store.addError(`Failed to clear data: ${(error as Error).message}`);
    }
  }
};

const handleConfigUpdate = (config: LCRConfig) => {
  store.setConfig(config);
};

// Lifecycle
onMounted(() => {
  console.log('[RateGenUSView] Component mounted');
});

onUnmounted(() => {
  console.log('[RateGenUSView] Component unmounted');
});
</script>

<template>
  <div class="rate-gen-container min-h-screen bg-fbBlack text-fbWhite">
    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-fbWhite">US Rate Generation</h1>
            <p class="mt-1 text-sm text-gray-300">
              Upload up to 5 provider rate decks and generate optimized rates using Least Cost Routing
            </p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Generate Button -->
            <button
              v-if="showConfiguration"
              @click="handleGenerateRates"
              :disabled="!canGenerate"
              class="px-6 py-2 bg-accent text-fbBlack rounded-lg hover:bg-accent/80 
                     disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors
                     text-sm font-medium"
            >
              <span v-if="!store.isGenerating">Generate Rate Deck</span>
              <span v-else>Generating... {{ store.generationProgress.toFixed(0) }}%</span>
            </button>
            
            <!-- Clear All Button -->
            <button
              @click="handleClearAll"
              class="px-4 py-2 bg-gray-700 text-fbWhite rounded-lg hover:bg-gray-600 
                     transition-colors text-sm font-medium border border-gray-600"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Upload Section -->
      <section class="mb-8">
        <div class="bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold text-fbWhite mb-4">
            Provider Rate Decks
          </h2>
          
          <RateGenFileUploads />
        </div>
      </section>

      <!-- Configuration Section -->
      <section v-if="showConfiguration" class="mb-8">
        <div class="bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold text-fbWhite mb-4">
            Rate Generation Configuration
          </h2>
          
          <!-- Placeholder for RateGenConfiguration component -->
          <div class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <p class="text-gray-400 mb-4">RateGenConfiguration component will be implemented here</p>
            <p class="text-sm text-gray-500">
              LCR strategy selection and markup configuration
            </p>
            
            <!-- Simple debug configuration -->
            <div class="mt-4">
              <select 
                @change="handleConfigUpdate({ 
                  strategy: ($event.target as HTMLSelectElement).value as any, 
                  markupPercentage: 10, 
                  providerIds: store.providerList.map(p => p.id) 
                })"
                class="bg-gray-700 text-fbWhite px-3 py-2 rounded border border-gray-600"
              >
                <option value="">Select LCR Strategy</option>
                <option value="LCR1">LCR 1 (Cheapest)</option>
                <option value="LCR2">LCR 2 (Second Best)</option>
                <option value="LCR3" v-if="store.providerCount >= 3">LCR 3 (Third Best)</option>
                <option value="Average" v-if="store.providerCount >= 3">Average Top 3</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- Analytics Section -->
      <section v-if="generatedDeck" class="mb-8">
        <div class="bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold text-fbWhite mb-4">
            Generated Rate Deck
          </h2>
          
          <!-- Placeholder for RateGenAnalytics component -->
          <div class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <p class="text-gray-400 mb-4">RateGenAnalytics component will be implemented here</p>
            <p class="text-sm text-gray-500">
              Analytics and preview of generated rate deck
            </p>
            
            <!-- Basic deck info -->
            <div v-if="generatedDeck" class="mt-4 text-sm text-gray-300">
              <p>Strategy: {{ generatedDeck.lcrStrategy }}</p>
              <p>Total Rates: {{ generatedDeck.rowCount }}</p>
              <p>Generated: {{ generatedDeck.generatedDate.toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Error Display -->
      <div v-if="store.errors.length > 0" class="mb-8">
        <div v-for="(error, index) in store.errors" :key="index" 
             class="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-2
                    flex items-center justify-between">
          <span>{{ error }}</span>
          <button 
            @click="store.removeError(index)" 
            class="ml-4 text-red-400 hover:text-red-300 text-xl font-bold"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Export Modal Placeholder -->
    <div v-if="showExportModal && generatedDeck" 
         class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-fbWhite mb-4">Export Rate Deck</h3>
        
        <div class="space-y-3">
          <button
            @click="handleExport('csv')"
            class="w-full px-4 py-2 bg-accent text-fbBlack rounded-lg hover:bg-accent/80 
                   transition-colors font-medium"
          >
            Export as CSV
          </button>
          
          <button
            @click="showExportModal = false"
            class="w-full px-4 py-2 bg-gray-600 text-fbWhite rounded-lg hover:bg-gray-500 
                   transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rate-gen-container {
  min-height: 100vh;
}
</style>