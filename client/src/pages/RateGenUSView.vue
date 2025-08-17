<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';
import type { GeneratedRateDeck, LCRConfig } from '@/types/domains/rate-gen-types';
import type { SubscriptionTier } from '@/types/user-types';
import { useUserStore } from '@/stores/user-store';
import { useBilling } from '@/composables/useBilling';

// Components
import RateGenFileUploads from '@/components/rate-gen/RateGenFileUploads.vue';
import RateGenHeader from '@/components/rate-gen/RateGenHeader.vue';
import RateGenConfiguration from '@/components/rate-gen/RateGenConfiguration.vue';
import RateGenResults from '@/components/rate-gen/RateGenResults.vue';
import BaseButton from '@/components/shared/BaseButton.vue';
import PlanSelectionModal from '@/components/shared/PlanSelectionModal.vue';
import ServiceExpiryBanner from '@/components/shared/ServiceExpiryBanner.vue';
import PlanSelectorModal from '@/components/billing/PlanSelectorModal.vue';
import { useGlobalUploadLimit } from '@/composables/useGlobalUploadLimit';

const store = useRateGenStore();
const service = new RateGenService();
const globalUploadLimit = useGlobalUploadLimit();
const userStore = useUserStore();
const showPlanSelectorModal = ref(false);

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

// Banner state from unified store logic
const bannerState = computed(() => userStore.getServiceExpiryBanner);

// Handler for upgrade clicked from expiry banner
function handleUpgradeFromExpiry() {
  showPlanSelectorModal.value = true;
}

// Handler for plan selection from PlanSelectorModal  
async function handlePlanSelectorSelection(tier: SubscriptionTier) {
  showPlanSelectorModal.value = false;
  
  try {
    const { createCheckoutSession } = useBilling();
    
    // Get the correct price ID based on selected tier
    const priceIds = {
      optimizer: import.meta.env.VITE_STRIPE_PRICE_OPTIMIZER,
      accelerator: import.meta.env.VITE_STRIPE_PRICE_ACCELERATOR,
      enterprise: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE,
    };
    
    const priceId = priceIds[tier];
    
    if (!priceId) {
      throw new Error(`Price ID not found for ${tier} plan`);
    }
    
    console.log(`🚀 Creating checkout session for ${tier} upgrade`);
    await createCheckoutSession(priceId, tier);
    
  } catch (error: any) {
    console.error('Upgrade checkout error:', error);
    alert(`Failed to start checkout: ${error.message}`);
    // Reopen modal on error
    showPlanSelectorModal.value = true;
  }
}


// Lifecycle
onMounted(() => {
  console.log('[RateGenUSView] Component mounted');
});

onUnmounted(() => {
  console.log('[RateGenUSView] Component unmounted');
});
</script>

<template>
  <!-- Upload Limit Fullscreen Modal -->
  <!-- Main Page Content (No longer blocked) -->
  <div class="flex flex-col w-full min-h-screen bg-fbBlack text-fbWhite">
    
    <!-- Service Expiry Banner -->
    <ServiceExpiryBanner 
      v-bind="bannerState"
      @upgrade-clicked="handleUpgradeFromExpiry"
    />
    
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
      <div class="bg-gray-800 rounded-b-lg p-4 sm:p-6" role="tabpanel" :aria-labelledby="`${activeTab}-tab`">
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
          <RateGenConfiguration @generate-rates="handleGenerateRates" />
        </div>

        <!-- Results Tab Content -->
        <div v-if="activeTab === 'results'">
          <h2 class="text-xl font-semibold text-fbWhite mb-6">
            Rate Generation History
          </h2>
          
          <!-- Rate Generation Results Component -->
          <RateGenResults 
            @generate-new="activeTab = 'settings'"
          />
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

    <!-- Plan Selector Modal -->
    <PlanSelectorModal
      v-if="showPlanSelectorModal"
      :is-trial-expired="true"
      @close="showPlanSelectorModal = false"
      @select-plan="handlePlanSelectorSelection"
    />
    
    <!-- Plan Selection Modal -->
    <PlanSelectionModal
      :show="globalUploadLimit.showPlanSelectionModal.value"
      @close="globalUploadLimit.closePlanSelectionModal"
      @select-plan="globalUploadLimit.handlePlanSelection"
    />
  </div>
</template>

