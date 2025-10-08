<template>
  <!-- Main Page Content (No longer blocked) -->
  <div class="text-white pt-2 w-full max-w-full overflow-x-hidden">
    
    <!-- Service Expiry Banner -->
    <ServiceExpiryBanner 
      v-bind="bannerState"
      @upgrade-clicked="handleUpgradeFromExpiry"
    />
    
    <h1 class="mb-2 relative">
      <span class="text-xl md:text-2xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
        AZ Rate Deck Analyzer
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
    
    <AZContentHeader />

    <div class="w-full max-w-full overflow-x-hidden">
      <transition name="fade" mode="out-in" appear>
        <div :key="azStore.getActiveReportType" class="w-full max-w-full overflow-x-hidden">
          <AZFileUploads v-if="azStore.getActiveReportType === ReportTypes.FILES" />
          <CodeReportAZ
            v-if="
              azStore.getActiveReportType === ReportTypes.CODE &&
              (azStore.hasSingleFileReport || azStore.reportsGenerated)
            "
            :report="azStore.getCodeReport"
          />
          <PricingReportAZ
            v-if="azStore.getActiveReportType === ReportTypes.PRICING && azStore.reportsGenerated"
            :report="azStore.getPricingReport"
          />
        </div>
      </transition>
    </div>

    <!-- Info Modal -->
    <InfoModal
      :show-modal="showInfoModal"
      :type="'az_comparison'"
      @close="closeInfoModal"
    />
    
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
import AZFileUploads from '@/components/az/AZFileUploads.vue';
import CodeReportAZ from '@/components/az/AZCodeReport.vue';
import PricingReportAZ from '@/components/az/AZPricingReport.vue';
import AZContentHeader from '@/components/az/AZContentHeader.vue';
import InfoModal from '@/components/shared/InfoModal.vue';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import { useAzStore } from '@/stores/az-store';
import { useUserStore } from '@/stores/user-store';
import { ReportTypes } from '@/types/app-types';
import { onMounted, ref, computed } from 'vue';
import { DBName } from '@/types/app-types';
import type { SubscriptionTier } from '@/types/user-types';
import { useBilling } from '@/composables/useBilling';
import ServiceExpiryBanner from '@/components/shared/ServiceExpiryBanner.vue';
import PlanSelectorModal from '@/components/billing/PlanSelectorModal.vue';

const azStore = useAzStore();
const userStore = useUserStore();

// Info Modal state
const showInfoModal = ref(false);
const showPlanSelectorModal = ref(false);

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


</script>
