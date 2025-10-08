<template>
  <!-- Main Page Content (No longer blocked) -->
  <div class="text-white pt-2 w-full">
    
    <!-- Service Expiry Banner -->
    <ServiceExpiryBanner 
      v-bind="bannerState"
      @upgrade-clicked="handleUpgradeFromExpiry"
    />
    
    <h1 class="mb-2 relative">
      <span class="text-xl md:text-2xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
        US Rate Deck Analyzer
      </span>
      <!-- Info Icon Button -->
     <button
        @click="openInfoModal"
        class="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors duration-150"
        aria-label="Show AZ Rate Deck Analyzer information"
      >
        <!-- Apply dashboard styling -->
        <div class="p-1 bg-blue-900/40 rounded-lg border border-blue-400/50 animate-pulse-info">
          <InformationCircleIcon class="w-5 h-5 text-blue-400" />
        </div>
      </button>
    </h1>
    
    <USContentHeader />

    <div>
      <transition name="fade" mode="out-in" appear>
        <div :key="usStore.getActiveReportType">
          <USFileUploads v-if="usStore.activeReportType === ReportTypes.FILES" />
          <USCodeReport
            v-if="usStore.activeReportType === ReportTypes.CODE && usStore.isCodeReportReady"
            :report="usStore.getCodeReport"
          />
          <USPricingReport
            v-if="usStore.activeReportType === ReportTypes.PRICING && usStore.isCodeReportReady"
            :report="usStore.getPricingReport"
          />
          <div
            v-else-if="
              usStore.activeReportType === ReportTypes.PRICING && !usStore.isCodeReportReady
            "
            class="text-center p-10 text-gray-400"
          >
            <p>Waiting for initial report generation...</p>
          </div>
        </div>
      </transition>
    </div>

    <!-- Info Modal -->
    <InfoModal :show-modal="showInfoModal" :type="'us_comparison'" @close="closeInfoModal" />
    
    <!-- Plan Selector Modal -->
    <PlanSelectorModal
      v-if="showPlanSelectorModal"
      :is-trial-expired="true"
      @close="showPlanSelectorModal = false"
      @select-plan="handlePlanSelectorSelection"
    />
  </div>
</template>

<script setup lang="ts">
import USFileUploads from '@/components/us/USFileUploads.vue';
import USCodeReport from '@/components/us/USCodeReport.vue';
import USPricingReport from '@/components/us/USPricingReport.vue';
import USContentHeader from '@/components/us/USContentHeader.vue';
import InfoModal from '@/components/shared/InfoModal.vue';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import { useUsStore } from '@/stores/us-store';
import { useUserStore } from '@/stores/user-store';
import { ReportTypes } from '@/types/app-types';
import { onMounted, watch, ref, computed } from 'vue';
import { useLergOperations } from '@/composables/useLergOperations';
import { DBName } from '@/types/app-types';
import type { SubscriptionTier } from '@/types/user-types';
import { useBilling } from '@/composables/useBilling';
import { useLergStoreV2 } from '@/stores/lerg-store-v2';
import ServiceExpiryBanner from '@/components/shared/ServiceExpiryBanner.vue';
import PlanSelectorModal from '@/components/billing/PlanSelectorModal.vue';

const usStore = useUsStore();
const userStore = useUserStore();
const lergStore = useLergStoreV2();

// Info Modal state
const showInfoModal = ref(false);
const showPlanSelectorModal = ref(false);

// Add watchers to debug state changes
watch(
  () => usStore.activeReportType,
  (newValue) => {
  }
);

watch(
  () => usStore.hasEnhancedReports,
  (hasReports) => {
    
    if (hasReports) {
      console.log(`[UsView] Report count: ${usStore.enhancedCodeReports.size}`);
    }
  }
);

// Info Modal functions
function openInfoModal() {
  showInfoModal.value = true;
}

function closeInfoModal() {
  showInfoModal.value = false;
}

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
      accelerator: import.meta.env.VITE_STRIPE_PRICE_ACCELERATOR
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

onMounted(async () => {
  console.log('[UsView] ========== US VIEW MOUNTED ==========');
  
  try {
    // Just ping to validate LERG availability - NO initialization
    // Dashboard.vue handles all LERG initialization
    console.log('[UsView] Pinging LERG availability (no initialization)...');
    console.log('[UsView] LERG store status check');

    // Check actual LERG data counts from Pinia (should be loaded by Dashboard)
    const usStates = lergStore.getUSStates;
    const canadaProvinces = lergStore.getCanadianProvinces;
    const countryData = lergStore.getDistinctCountries;
    
    console.log('[UsView] LERG data status from Pinia:');
    console.log('[UsView] - US States:', usStates.length);
    console.log('[UsView] - Canada Provinces:', canadaProvinces.length);
    console.log('[UsView] - Country Data:', countryData.length);
    console.log('[UsView] - Store loaded:', lergStore.isInitialized);

    // Check if files are already loaded before loading sample data
    const filesAlreadyUploaded = usStore.getNumberOfFilesUploaded === 2;

    if (filesAlreadyUploaded) {
      console.log('[UsView] Files already uploaded, skipping sample data');
    } else {
      // Only load sample decks if no files are already uploaded
      // console.log('[UsView] No files uploaded, loading sample data');
    
      // Clear timeout on component unmount
      
    }
  } catch (err) {
    console.error('[UsView] Error pinging LERG service:', err);
    // Use error from composable
    error.value = err instanceof Error ? err.message : 'Failed to ping LERG service';
  }
  
  console.log('[UsView] ========== US VIEW INITIALIZATION COMPLETE ==========');
});

/**
 * Format error message based on error source and details
 */
function formatErrorMessage(
  error: Error,
  source?: string,
  details?: Record<string, any>
): {
  message: string;
  details?: string;
  source?: string;
} {
  let message = error.message || 'An unknown error occurred';
  let detailsMessage = '';
  let sourceLabel = source || 'System Error';

  // Add details if available
  if (details) {
    const detailsArray = [];

    if (details.errorType) {
      detailsArray.push(`Type: ${details.errorType}`);
    }

    if (details.errorMessage && details.errorMessage !== message) {
      detailsArray.push(`Details: ${details.errorMessage}`);
    }

    detailsMessage = detailsArray.join(' | ');
  }

  return {
    message,
    details: detailsMessage,
    source: sourceLabel,
  };
}
</script>
