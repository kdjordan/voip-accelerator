<template>
  <div class="bg-zinc-800 rounded-lg p-6 shadow-lg">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-xl font-semibold text-white">Subscription Status</h3>
        <p class="text-gray-400 text-sm mt-1">Manage your billing and subscription</p>
      </div>
      <BaseBadge 
        :variant="badgeVariant" 
        :text="badgeText"
      />
    </div>

    <!-- Subscription Details -->
    <div class="mb-6">
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="text-gray-400">Current Plan</span>
          <span class="text-white font-medium capitalize">{{ currentPlan }}</span>
        </div>
        <div v-if="planExpiresAt" class="flex justify-between">
          <span class="text-gray-400">{{ currentPlan === 'trial' ? 'Trial Ends' : 'Next Billing Date' }}</span>
          <span class="text-white">{{ formatDate(planExpiresAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Usage Statistics -->
    <div v-if="usageStats" class="mb-6 pt-6 border-t border-zinc-700">
      <h4 class="text-lg font-medium text-white mb-4">Usage This Month</h4>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-zinc-900 rounded-lg p-4">
          <p class="text-gray-400 text-sm">Rate Comparisons</p>
          <p class="text-2xl font-bold text-white mt-1">{{ usageStats.total_comparisons }}</p>
        </div>
        <div class="bg-zinc-900 rounded-lg p-4">
          <p class="text-gray-400 text-sm">Rate Adjustments</p>
          <p class="text-2xl font-bold text-white mt-1">{{ usageStats.total_adjustments }}</p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3">
      <BaseButton
        @click="showUpgradeModal = true"
        variant="primary"
        class="flex-1"
      >
        {{ currentPlan === 'trial' ? 'Choose Plan' : 'Change Plan' }}
      </BaseButton>
      <BaseButton
        v-if="currentPlan !== 'trial'"
        @click="openBillingPortal"
        variant="secondary"
        class="flex-1"
        :loading="loading"
      >
        Manage Billing
      </BaseButton>
    </div>

    <!-- Upgrade Modal -->
    <PlanSelectorModal
      v-if="showUpgradeModal"
      :is-trial-expired="currentPlan === 'trial'"
      @close="showUpgradeModal = false"
      @select-plan="handlePlanSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBilling } from '@/composables/useBilling';
import { useUserStore } from '@/stores/user-store';
import BaseButton from '@/components/shared/BaseButton.vue';
import BaseBadge from '@/components/shared/BaseBadge.vue';
import PlanSelectorModal from './PlanSelectorModal.vue';

const userStore = useUserStore();
const { 
  currentPlan, 
  getUserUsageStats, 
  openBillingPortal,
  loading 
} = useBilling();

const showUpgradeModal = ref(false);
const usageStats = ref<any>(null);

const planExpiresAt = computed(() => {
  const profile = userStore.getUserProfile;
  return profile?.current_period_end || profile?.plan_expires_at;
});

const badgeVariant = computed(() => {
  if (currentPlan.value === 'trial') return 'info';
  if (currentPlan.value === 'monthly' || currentPlan.value === 'annual') return 'success';
  return 'warning';
});

const badgeText = computed(() => {
  if (currentPlan.value === 'trial') return 'Trial';
  if (currentPlan.value === 'monthly') return 'Monthly';
  if (currentPlan.value === 'annual') return 'Annual';
  return 'Inactive';
});

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function handlePlanSelection(billingPeriod: 'monthly' | 'annual') {
  showUpgradeModal.value = false;

  try {
    const { createCheckoutSession } = useBilling();

    // Get the correct price ID based on billing period
    const priceId = billingPeriod === 'annual'
      ? import.meta.env.VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR
      : import.meta.env.VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR;

    if (!priceId) {
      throw new Error(`Price ID not found for ${billingPeriod} plan`);
    }

    console.log(`🚀 Creating checkout session for ${billingPeriod} Accelerator plan`);
    await createCheckoutSession(priceId, 'accelerator');
  } catch (error) {
    console.error('Error creating checkout session:', error);
  }
}

onMounted(async () => {
  // Load usage statistics
  // TODO: Implement user_usage_stats table or remove this feature
  // usageStats.value = await getUserUsageStats();
});
</script>