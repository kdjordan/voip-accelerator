<template>
  <div v-if="shouldShowBanner" :class="bannerClasses" class="relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between flex-wrap">
        <div class="flex-1 flex items-center">
          <span class="flex p-2 rounded-lg" :class="iconBgClass">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                :d="isExpired ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'" 
              />
            </svg>
          </span>
          <p class="ml-3 font-medium text-white">
            <span v-if="isExpired">
              Your free trial has expired. Subscribe now to continue using VoIP Accelerator.
            </span>
            <span v-else-if="daysRemaining <= 3">
              Your free trial expires in {{ daysRemaining }} day{{ daysRemaining !== 1 ? 's' : '' }}. 
              Subscribe now to ensure uninterrupted access.
            </span>
            <span v-else>
              {{ daysRemaining }} days remaining in your free trial.
            </span>
          </p>
        </div>
        <div class="flex-shrink-0 order-2 sm:order-3 sm:ml-3">
          <BaseButton
            @click="showPaymentModal = true"
            :variant="isExpired ? 'primary' : 'secondary'"
            size="sm"
            class="shadow-sm"
          >
            {{ isExpired ? 'Subscribe Now' : 'Upgrade' }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <PaymentModal 
      v-if="showPaymentModal"
      @close="showPaymentModal = false"
      @select-plan="handlePlanSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBilling } from '@/composables/useBilling';
import { useUserStore } from '@/stores/user-store';
import BaseButton from '@/components/shared/BaseButton.vue';
import PaymentModal from './PaymentModal.vue';

const userStore = useUserStore();
const { getDaysRemainingInTrial, currentPlan } = useBilling();

const showPaymentModal = ref(false);

const daysRemaining = computed(() => getDaysRemainingInTrial());
const isExpired = computed(() => daysRemaining.value <= 0 && currentPlan.value === 'trial');
const isInTrial = computed(() => currentPlan.value === 'trial');

const shouldShowBanner = computed(() => {
  // Show banner if:
  // 1. Trial has expired
  // 2. Trial has 3 days or less remaining
  // 3. No active subscription
  return isInTrial.value && (isExpired.value || daysRemaining.value <= 3);
});

const bannerClasses = computed(() => {
  if (isExpired.value) {
    return 'bg-red-600 py-3';
  } else if (daysRemaining.value <= 1) {
    return 'bg-orange-600 py-3';
  } else {
    return 'bg-blue-600 py-3';
  }
});

const iconBgClass = computed(() => {
  if (isExpired.value) {
    return 'bg-red-800';
  } else if (daysRemaining.value <= 1) {
    return 'bg-orange-800';
  } else {
    return 'bg-blue-800';
  }
});

function handlePlanSelection(plan: 'monthly' | 'annual') {
  showPaymentModal.value = false;
  // PaymentModal will handle the checkout redirect
}
</script>