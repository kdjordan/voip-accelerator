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

    <!-- Trial Status -->
    <div v-if="isInTrial" class="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-blue-100 font-medium">Free Trial Active</p>
          <p class="text-blue-200 text-sm mt-1">
            {{ daysRemaining }} day{{ daysRemaining !== 1 ? 's' : '' }} remaining
          </p>
        </div>
        <button
          @click="showUpgradeModal = true"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Upgrade Now
        </button>
      </div>
    </div>

    <!-- Active Subscription -->
    <div v-else-if="currentPlan !== 'trial'" class="mb-6">
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="text-gray-400">Current Plan</span>
          <span class="text-white font-medium capitalize">{{ currentPlan }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Price</span>
          <span class="text-white font-medium">
            ${{ currentPlan === 'monthly' ? '40' : '400' }}/{{ currentPlan === 'monthly' ? 'month' : 'year' }}
          </span>
        </div>
        <div v-if="planExpiresAt" class="flex justify-between">
          <span class="text-gray-400">Next Billing Date</span>
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
        v-if="currentPlan === 'trial' || !currentPlan"
        @click="showUpgradeModal = true"
        variant="primary"
        class="flex-1"
      >
        Choose Plan
      </BaseButton>
      <BaseButton
        v-else
        @click="openBillingPortal"
        variant="secondary"
        class="flex-1"
        :loading="loading"
      >
        Manage Billing
      </BaseButton>
    </div>

    <!-- Upgrade Modal -->
    <PaymentModal 
      v-if="showUpgradeModal"
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
import PaymentModal from './PaymentModal.vue';

const userStore = useUserStore();
const { 
  currentPlan, 
  getDaysRemainingInTrial, 
  getUserUsageStats, 
  openBillingPortal,
  loading 
} = useBilling();

const showUpgradeModal = ref(false);
const usageStats = ref<any>(null);

const isInTrial = computed(() => currentPlan.value === 'trial');
const daysRemaining = computed(() => getDaysRemainingInTrial());
const planExpiresAt = computed(() => userStore.getUserProfile?.plan_expires_at);

const badgeVariant = computed(() => {
  if (isInTrial.value) return 'info';
  if (currentPlan.value === 'monthly' || currentPlan.value === 'annual') return 'success';
  return 'warning';
});

const badgeText = computed(() => {
  if (isInTrial.value) return 'Trial';
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

async function handlePlanSelection(plan: 'monthly' | 'annual') {
  showUpgradeModal.value = false;
  // PaymentModal will handle the checkout redirect
}

onMounted(async () => {
  // Load usage statistics
  usageStats.value = await getUserUsageStats();
});
</script>