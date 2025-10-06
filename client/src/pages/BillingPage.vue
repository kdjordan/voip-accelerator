<template>
  <div>
    <!-- Add Subscription Management for existing customers -->
    <div v-if="hasActiveSubscription" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SubscriptionManagement />
      <div class="text-center mt-8">
        <BaseButton
          @click="handleReturnToDashboard"
          variant="secondary"
          size="lg"
        >
          Return to Dashboard
        </BaseButton>
      </div>
    </div>

    <!-- Show pricing for non-subscribers -->
    <div v-else class="flex justify-center p-6">
    <!-- Main Content -->
    <div class="bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700 max-w-lg">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">
          {{ userTier ? 'Complete Your Subscription' : 'Choose Your Billing' }}
        </h1>
        <p class="text-gray-400 max-w-xl mx-auto">
          {{ userTier
            ? isAutoCheckout
              ? `Accelerator Plan - Unlimited Everything`
              : `Your 7-day trial has ended. Subscribe to continue.`
            : 'Accelerator Plan - Unlimited Everything'
          }}
        </p>
      </div>

      <!-- Billing Period Toggle -->
      <div class="flex justify-center mb-8">
        <div class="bg-gray-700 rounded-lg p-1 inline-flex">
          <button
            @click="selectedBillingPeriod = 'monthly'"
            class="px-6 py-2 rounded-md text-sm font-medium transition-all"
            :class="selectedBillingPeriod === 'monthly'
              ? 'bg-accent text-white shadow-lg'
              : 'text-gray-300 hover:text-white'"
          >
            Monthly
          </button>
          <button
            @click="selectedBillingPeriod = 'annual'"
            class="px-6 py-2 rounded-md text-sm font-medium transition-all relative"
            :class="selectedBillingPeriod === 'annual'
              ? 'bg-accent text-white shadow-lg'
              : 'text-gray-300 hover:text-white'"
          >
            Annual
            <span class="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              Save $189
            </span>
          </button>
        </div>
      </div>

      <!-- Accelerator Plan Card -->
      <div class="bg-gray-700/50 rounded-lg p-6 border-2 border-accent/30 mb-6 relative">
        <!-- Most Popular Badge -->
        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span class="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
            MOST POPULAR
          </span>
        </div>

        <div class="text-center">
          <h3 class="text-2xl font-bold text-white mb-2">Accelerator</h3>
          <div class="mb-6">
            <span class="text-4xl font-bold text-white">
              {{ selectedBillingPeriod === 'monthly' ? '$99' : '$999' }}
            </span>
            <span class="text-gray-400">
              {{ selectedBillingPeriod === 'monthly' ? '/month' : '/year' }}
            </span>
          </div>

          <ul class="space-y-3 text-left mb-6">
            <li class="flex items-center text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium">Unlimited uploads</span>
            </li>
            <li class="flex items-center text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Best for growing businesses
            </li>
            <li class="flex items-center text-gray-300">
              <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              {{ isAutoCheckout ? 'Get started today' : '7-day free trial ended' }}
            </li>
          </ul>

          <BaseButton
            @click="selectPlan()"
            variant="primary"
            size="standard"
            class="w-full"
            :loading="loading"
            :disabled="loading"
          >
            <span v-if="loading">Processing...</span>
            <span v-else>Subscribe {{ selectedBillingPeriod === 'monthly' ? 'Monthly' : 'Annually' }}</span>
          </BaseButton>

        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-gray-500 text-sm">Secure payment processing by Stripe. Cancel anytime.</p>
      </div>
    </div> <!-- Close the bento div -->
    </div> <!-- Close the v-else div -->

    <!-- Plan Selector Modal -->
    <PlanSelectorModal 
      v-if="showPlanSelector"
      :is-trial-expired="isExpired"
      @close="showPlanSelector = false"
      @select-plan="handlePlanSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { stripeService } from '@/services/stripe.service';
import { useUserStore } from '@/stores/user-store';
import { useToast } from '@/composables/useToast';
import BaseButton from '@/components/shared/BaseButton.vue';
import SubscriptionManagement from '@/components/profile/SubscriptionManagement.vue';
import PlanSelectorModal from '@/components/billing/PlanSelectorModal.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { showError, showSuccess } = useToast();
const loading = ref(false);
const showPlanSelector = ref(false);
const selectedBillingPeriod = ref<'monthly' | 'annual'>('monthly');

// Check if this is a paid signup (redirected from router guard)
const isAutoCheckout = computed(() => route.query.autoCheckout === 'true');

const userEmail = computed(() => userStore.getUser?.email || '');
const currentPlan = computed(() => userStore.getUserProfile?.subscription_status || 'trial');
const hasActiveSubscription = computed(() => 
  currentPlan.value === 'active' || 
  currentPlan.value === 'past_due'
);

// Get the user's current tier
const userTier = computed(() => {
  const profile = userStore.getUserProfile;
  // For trial users, they're always on optimizer
  if (profile?.subscription_status === 'trial') {
    return 'optimizer';
  }
  return profile?.subscription_tier || null;
});

const isExpired = computed(() => {
  const profile = userStore.getUserProfile;
  if (!profile?.plan_expires_at) return false;
  return new Date(profile.plan_expires_at) < new Date();
});

const isCurrentSubscriber = computed(() => {
  return hasActiveSubscription.value && userStore.getUserProfile?.subscription_tier;
});

async function selectPlan() {
  console.log('selectPlan called with billingPeriod:', selectedBillingPeriod.value);
  try {
    loading.value = true;

    // Map billing period to Stripe price ID
    const priceId = selectedBillingPeriod.value === 'annual'
      ? import.meta.env.VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR
      : import.meta.env.VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR;

    console.log(`${selectedBillingPeriod.value} price ID from env:`, priceId);

    if (!priceId) {
      throw new Error('Invalid billing period selected');
    }

    await stripeService.createCheckoutSession({
      priceId,
      successUrl: `${window.location.origin}/dashboard?subscription=success`,
      cancelUrl: `${window.location.origin}/billing?subscription=cancelled`,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    showError(error instanceof Error ? error.message : 'Failed to start checkout');
  } finally {
    loading.value = false;
  }
}

function getTierDisplayName(tier: SubscriptionTier) {
  const names = {
    optimizer: 'Optimizer',
    accelerator: 'Accelerator'
  };
  return names[tier] || tier;
}

function handleReturnToDashboard() {
  const redirectPath = route.query.redirect as string;
  router.push(redirectPath || '/dashboard');
}

function handlePlanSelection(billingPeriod: 'monthly' | 'annual') {
  showPlanSelector.value = false;
  selectedBillingPeriod.value = billingPeriod;
  selectPlan();
}

onMounted(async () => {
  // Refresh user profile to get latest subscription status
  if (userStore.getUser?.id) {
    await userStore.fetchProfile(userStore.getUser.id);
  }
  
  // Check for subscription success/cancel params
  if (route.query.subscription === 'success') {
    showSuccess('Welcome! Your subscription is now active.');
  } else if (route.query.subscription === 'cancelled') {
    showError('Subscription cancelled. You can try again anytime.');
  }
});
</script>