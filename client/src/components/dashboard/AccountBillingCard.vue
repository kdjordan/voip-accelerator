<template>
  <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
    <div class="mb-6">
      <h3 class="text-xl font-semibold text-white">Account & Billing</h3>
      <p class="text-gray-400 text-sm mt-1">Manage your subscription and billing</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4 mb-6 border-b border-gray-700 pb-6">
      <div class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <span class="ml-3 text-gray-400">Updating subscription...</span>
      </div>
    </div>

    <!-- Plan Details -->
    <div v-else class="space-y-4 mb-6 border-b border-gray-700 pb-6">
      <div class="flex justify-between items-center">
        <span class="text-gray-400">Current Plan</span>
        <BaseBadge :variant="badgeVariant">
          {{ badgeText }}
        </BaseBadge>
      </div>
      
      <div v-if="planExpiresAt" class="flex justify-between items-center">
        <span class="text-gray-400">{{ currentPlan === 'trial' ? 'Trial Ends' : 'Next Billing Date' }}</span>
        <span class="text-white">{{ formatDate(planExpiresAt) }}</span>
      </div>

      <div v-if="currentPlan !== 'trial'" class="flex justify-between items-center">
        <span class="text-gray-400">Price</span>
        <span class="text-white font-medium">
          ${{ currentPlan === 'monthly' ? '99' : '1089' }}/{{ currentPlan === 'monthly' ? 'month' : 'year' }}
        </span>
      </div>
    </div>

    <!-- Cancellation Status -->
    <div v-if="isCancellationScheduled" class="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-yellow-300 text-sm font-medium">Subscription Canceling</p>
          <p class="text-yellow-300/80 text-xs mt-1">
            Your subscription will end on {{ formatDate(cancelAt) }}. 
            You'll keep access until then.
          </p>
        </div>
        <BaseButton
          @click="$emit('reactivate-subscription')"
          variant="secondary"
          size="small"
        >
          Reactivate
        </BaseButton>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3 pt-2">
      <BaseButton
        @click="$emit('choose-plan')"
        variant="primary"
        size="standard"
      >
        {{ currentPlan === 'trial' ? 'Choose Plan' : 'Change Plan' }}
      </BaseButton>
      
      <BaseButton
        v-if="currentPlan !== 'trial' && !isCancellationScheduled"
        @click="$emit('manage-billing')"
        variant="secondary"
        size="standard"
      >
        Manage Billing
      </BaseButton>

      <BaseButton
        v-if="currentPlan !== 'trial' && !isCancellationScheduled"
        @click="$emit('cancel-subscription')"
        variant="destructive"
        size="standard"
      >
        Cancel Subscription
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user-store';
import BaseButton from '@/components/shared/BaseButton.vue';
import BaseBadge from '@/components/shared/BaseBadge.vue';

const props = defineProps<{
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  'choose-plan': [];
  'manage-billing': [];
  'cancel-subscription': [];
  'reactivate-subscription': [];
}>();

const userStore = useUserStore();

const currentPlan = computed(() => userStore.getCurrentPlanTier || 'trial');

const planExpiresAt = computed(() => {
  const profile = userStore.getUserProfile;
  return profile?.current_period_end || profile?.plan_expires_at;
});

const badgeVariant = computed(() => {
  if (currentPlan.value === 'trial') return 'warning';
  if (currentPlan.value === 'monthly' || currentPlan.value === 'annual') return 'accent';
  return 'warning';
});

const badgeText = computed(() => {
  if (currentPlan.value === 'trial') return 'Trial';
  if (currentPlan.value === 'monthly') return 'Monthly';
  if (currentPlan.value === 'annual') return 'Annual';
  return 'Inactive';
});

const isCancellationScheduled = computed(() => {
  const profile = userStore.getUserProfile;
  return profile?.cancel_at_period_end && profile?.cancel_at;
});

const cancelAt = computed(() => {
  const profile = userStore.getUserProfile;
  return profile?.cancel_at;
});

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>