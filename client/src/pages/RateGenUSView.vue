<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';
import type { GeneratedRateDeck, LCRConfig } from '@/types/domains/rate-gen-types';

// Components
import RateGenFileUploads from '@/components/rate-gen/RateGenFileUploads.vue';
import RateGenHeader from '@/components/rate-gen/RateGenHeader.vue';
import RateGenConfiguration from '@/components/rate-gen/RateGenConfiguration.vue';
// import RateGenConfiguration from '@/components/rate-gen/RateGenConfiguration.vue';
// import RateGenAnalytics from '@/components/rate-gen/RateGenAnalytics.vue';
// import RateGenExportModal from '@/components/rate-gen/RateGenExportModal.vue';

const store = useRateGenStore();
const service = new RateGenService();

// State
const activeTab = ref<'upload' | 'settings' | 'results'>('upload');
const showExportModal = ref(false);
const generatedDeck = ref<GeneratedRateDeck | null>(null);

// Computed
const canGenerate = computed(() => 
  store.providerList.length >= 2 && 
  store.currentConfig !== null &&
  !store.isProcessing
);

// Methods
const handleGenerateRates = async () => {
  if (!store.currentConfig) return;
  
  try {
    generatedDeck.value = await service.generateRateDeck(store.currentConfig);
    // Note: The tab will auto-switch to results via the watch in RateGenHeader
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

const handleTabChange = (tab: 'upload' | 'settings' | 'results') => {
  activeTab.value = tab;
  console.log(`[RateGenUSView] Tab changed to: ${tab}`);
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
  <!-- Match USFileUploads.vue layout structure exactly -->
  <div class="flex flex-col w-full min-h-screen bg-fbBlack text-fbWhite">
    <!-- Page Title - Outside the bento box like reference -->
    <div class="px-8 pt-8">
      <h1 class="text-3xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">US Rate Generation</h1>
    </div>

    <!-- Tab Header -->
    <div class="px-8">
      <RateGenHeader 
        :active-tab="activeTab"
        @tab-change="handleTabChange"
      />
    </div>

    <!-- Tab Content - Full Width -->
    <div class="px-8 pb-8 flex-1">
      <div class="bg-gray-800 rounded-b-lg p-6 h-full">
        <!-- Upload Tab Content -->
        <div v-if="activeTab === 'upload'">
          <div class="pb-4 mb-6">
            <h2 class="text-xl font-semibold text-fbWhite mb-6">
              Provider Rate Decks
            </h2>
            
            <!-- Rate Gen File Uploads Component -->
            <RateGenFileUploads />
          </div>
        </div>

        <!-- Settings Tab Content -->
        <div v-if="activeTab === 'settings'">
          <h2 class="text-xl font-semibold text-fbWhite mb-6">
            Rate Generation Configuration
          </h2>
          
          <!-- Rate Generation Configuration Component -->
          <div class="max-w-2xl">
            <RateGenConfiguration @generate-rates="handleGenerateRates" />
          </div>
        </div>

        <!-- Results Tab Content -->
        <div v-if="activeTab === 'results' && generatedDeck">
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
            <div class="mt-4 text-sm text-gray-300">
              <p>Strategy: {{ generatedDeck.lcrStrategy }}</p>
              <p>Total Rates: {{ generatedDeck.rowCount }}</p>
              <p>Generated: {{ generatedDeck.generatedDate.toLocaleString() }}</p>
              
              <!-- Export Button -->
              <button
                @click="showExportModal = true"
                class="mt-4 px-4 py-2 bg-accent text-fbBlack rounded-lg hover:bg-accent/80 
                       transition-colors font-medium"
              >
                Export Rate Deck
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Error Display -->
    <div v-if="store.errors.length > 0" class="px-8 pb-8">
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

