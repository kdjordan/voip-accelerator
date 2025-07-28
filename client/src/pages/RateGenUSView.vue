<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';
import type { GeneratedRateDeck, LCRConfig } from '@/types/domains/rate-gen-types';

// Components
import RateGenFileUploads from '@/components/rate-gen/RateGenFileUploads.vue';
import RateGenHeader from '@/components/rate-gen/RateGenHeader.vue';
import RateGenConfiguration from '@/components/rate-gen/RateGenConfiguration.vue';
import RateGenResults from '@/components/rate-gen/RateGenResults.vue';
import BaseButton from '@/components/shared/BaseButton.vue';

const store = useRateGenStore();
const service = new RateGenService();

// State
const activeTab = ref<'upload' | 'settings' | 'results'>('upload');
const showExportModal = ref(false);

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
    await service.generateRateDeck(store.currentConfig);
    // Note: The tab will auto-switch to results via the watch in RateGenHeader
    // and the store will be updated by the service
    
    // Add success message using a temporary notification
    const successMessage = `Successfully generated ${store.generatedDeck?.rowCount.toLocaleString()} rates using ${store.generatedDeck?.lcrStrategy} strategy`;
    console.log('[RateGenUSView]', successMessage);
  } catch (error) {
    // Error is already handled with user-friendly message in the service
    console.error('[RateGenUSView] Generation failed:', error);
  }
};

const handleExport = async (format: 'csv' | 'excel') => {
  if (!store.generatedDeck) return;
  
  try {
    const blob = await service.exportRateDeck(store.generatedDeck.id, format);
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate-deck-${store.generatedDeck.lcrStrategy}-${Date.now()}.${format}`;
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
    <div class="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
      <h1 class="text-2xl sm:text-3xl text-accent uppercase rounded-lg px-2 sm:px-4 py-2 font-secondary" role="heading" aria-level="1">US Rate Generation</h1>
    </div>

    <!-- Tab Header -->
    <div class="px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Rate generation tabs">
      <RateGenHeader 
        :active-tab="activeTab"
        @tab-change="handleTabChange"
      />
    </div>

    <!-- Tab Content - Full Width -->
    <div class="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 flex-1">
      <div class="bg-gray-800 rounded-b-lg p-4 sm:p-6 h-full" role="tabpanel" :aria-labelledby="`${activeTab}-tab`">
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
        <div v-if="activeTab === 'results'">
          <div v-if="store.generatedDeck">
            <h2 class="text-xl font-semibold text-fbWhite mb-6">
              Generated Rate Deck: {{ store.generatedDeck.name }}
            </h2>
            
            <!-- Rate Generation Results Component -->
            <RateGenResults 
              :deck="store.generatedDeck" 
              @export="handleExport"
            />
          </div>
          <div v-else class="text-center py-12">
            <p class="text-gray-400 mb-4">No rates have been generated yet.</p>
            <BaseButton
              variant="primary"
              size="standard"
              @click="activeTab = 'settings'"
              aria-label="Navigate to rate generation settings"
            >
              Go to Settings
            </BaseButton>
          </div>
        </div>
      </div>
    </div>


    <!-- Error Display -->
    <div v-if="store.errors.length > 0" class="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
      <div v-for="(error, index) in store.errors" :key="index" 
           class="bg-red-500/20 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-2
                  flex items-center justify-between text-sm sm:text-base">
        <span class="flex-1 mr-2">{{ error }}</span>
        <button 
          @click="store.removeError(index)" 
          class="ml-2 sm:ml-4 text-red-400 hover:text-red-300 text-lg sm:text-xl font-bold flex-shrink-0"
          :aria-label="`Dismiss error: ${error}`"
          role="button"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Export Modal Placeholder -->
    <div v-if="showExportModal && store.generatedDeck" 
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

    <!-- Rate Generation Progress Modal -->
    <div v-if="store.isGenerating" 
         class="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
         role="dialog"
         aria-modal="true"
         aria-labelledby="progress-modal-title"
         aria-describedby="progress-modal-desc">
      <div class="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 id="progress-modal-title" class="text-xl font-semibold text-fbWhite mb-6 text-center">
          Generating Rate Deck
        </h3>
        
        <div class="space-y-4">
          <!-- Progress Bar -->
          <div class="relative">
            <div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div 
                class="h-full bg-accent transition-all duration-300 ease-out rounded-full"
                :style="{ width: `${store.generationProgress}%` }"
              >
                <div class="h-full bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <p class="text-center mt-2 text-sm text-gray-400">
              {{ store.generationProgress.toFixed(0) }}%
            </p>
          </div>
          
          <!-- Status Message -->
          <div id="progress-modal-desc" class="text-center">
            <p class="text-gray-300">
              Processing {{ store.providerCount }} provider{{ store.providerCount > 1 ? 's' : '' }}...
            </p>
            <p class="text-sm text-gray-400 mt-1">
              This may take a few moments for large datasets
            </p>
          </div>
          
          <!-- Animated Loading Dots -->
          <div class="flex justify-center space-x-2 mt-6">
            <div class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 0ms"></div>
            <div class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 150ms"></div>
            <div class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 300ms"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

