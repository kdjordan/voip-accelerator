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
      <!-- Subscription Plans Header -->
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4 border-2 border-accent/30">
          <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          {{ userTier ? 'Complete Your Subscription' : 'Choose Your Plan' }}
        </h1>
        <p class="text-gray-400 max-w-xl mx-auto">
          {{ userTier 
            ? `Your 7-day trial has ended. Subscribe to ${getTierDisplayName(userTier)} to continue.`
            : 'Select the perfect plan for your VoIP business and unlock all rate sheet management tools.'
          }}
        </p>
      </div>

      <!-- Pricing Cards -->
      <!-- Optimizer Plan -->
      <div v-if="!userTier || userTier === 'optimizer'">
        <div class="bg-gray-700/50 rounded-lg p-6 border border-gray-600 mb-6">
          <div class="text-center">
            <h3 class="text-xl font-bold text-white mb-2">Optimizer</h3>
            <div class="mb-6">
              <span class="text-4xl font-bold text-white">$99</span>
              <span class="text-gray-400">/month</span>
            </div>
            
            <ul class="space-y-2 text-left mb-6 text-sm">
              <li class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                100 uploads per month
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Perfect for getting started
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                7-day free trial ended
              </li>
            </ul>
            
            <BaseButton
              @click="selectPlan('optimizer')"
              variant="primary"
              size="standard"
              class="w-full"
              :loading="loading"
              :disabled="loading"
            >
              <span v-if="loading">Processing...</span>
              <span v-else>{{ userTier === 'optimizer' ? 'Continue with Optimizer' : 'Choose Optimizer' }}</span>
            </BaseButton>
            
            <!-- Plan selection for trial users -->
            <div v-if="!isCurrentSubscriber" class="mt-4 text-center">
              <button 
                @click="showPlanSelector = true"
                class="text-sm text-gray-400 hover:text-accent transition-colors underline"
              >
                Want more features? Compare all plans
              </button>
            </div>
            
            <!-- Upgrade Hint for Current Subscribers -->
            <div v-if="isCurrentSubscriber && userTier === 'optimizer'" class="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-accent font-medium">Need more power?</p>
                  <p class="text-xs text-gray-400">Upgrade to Accelerator for unlimited uploads</p>
                </div>
                <BaseButton
                  @click="showUpgradeModal = true"
                  variant="secondary"
                  size="small"
                >
                  Upgrade
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Accelerator Plan -->
      <div v-if="!userTier || userTier === 'accelerator'">
        <div class="bg-gray-700/50 rounded-lg p-6 border border-gray-600 mb-6 relative">
          <!-- Most Popular Badge -->
          <div v-if="!userTier" class="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span class="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
              MOST POPULAR
            </span>
          </div>
          
          <div class="text-center">
            <h3 class="text-xl font-bold text-white mb-2">Accelerator</h3>
            <div class="mb-6">
              <span class="text-4xl font-bold text-white">$249</span>
              <span class="text-gray-400">/month</span>
            </div>
            
            <ul class="space-y-2 text-left mb-6 text-sm">
              <li class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <strong>Unlimited uploads</strong>
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Best for growing businesses
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                7-day free trial ended
              </li>
            </ul>
            
            <BaseButton
              @click="selectPlan('accelerator')"
              variant="primary"
              size="standard"
              class="w-full"
              :loading="loading"
              :disabled="loading"
            >
              <span v-if="loading">Processing...</span>
              <span v-else>{{ userTier === 'accelerator' ? 'Continue with Accelerator' : 'Choose Accelerator' }}</span>
            </BaseButton>
            
            <!-- Upgrade Hint for Current Subscribers -->
            <div v-if="isCurrentSubscriber && userTier === 'accelerator'" class="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-purple-400 font-medium">Scale your team?</p>
                  <p class="text-xs text-gray-400">Upgrade to Enterprise for multiple users</p>
                </div>
                <BaseButton
                  @click="showUpgradeModal = true"
                  variant="secondary"
                  size="small"
                >
                  Upgrade
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enterprise Plan -->
      <div v-if="!userTier || userTier === 'enterprise'">
        <div class="bg-gray-700/50 rounded-lg p-6 border border-gray-600 mb-6">
          <div class="text-center">
            <h3 class="text-xl font-bold text-white mb-2">Enterprise</h3>
            <div class="mb-6">
              <span class="text-4xl font-bold text-white">$499</span>
              <span class="text-gray-400">+/month</span>
            </div>
            
            <ul class="space-y-2 text-left mb-6 text-sm">
              <li class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <strong>Everything in Accelerator</strong>
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Multiple user accounts
              </li>
              <li class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Custom solutions available
              </li>
            </ul>
            
            <BaseButton
              @click="handleContactSales"
              variant="secondary"
              size="standard"
              class="w-full"
            >
              Contact Sales
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Delete Account Option -->
      <div class="text-center mt-6">
        <p class="text-gray-400 text-sm mb-3">Changed your mind?</p>
        <BaseButton
          @click="handleDeleteAccount"
          variant="destructive"
          size="small"
        >
          Delete Account
        </BaseButton>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-gray-500 text-sm">Secure payment processing by Stripe. Cancel anytime.</p>
      </div>
    </div> <!-- Close the bento div -->
    </div> <!-- Close the v-else div -->

    <!-- Upgrade Modal -->
    <UpgradeModal 
      v-if="showUpgradeModal"
      :current-tier="userTier"
      @close="showUpgradeModal = false"
      @upgrade="handleUpgrade"
    />

    <!-- Plan Selector Modal for Trial Users -->
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
import UpgradeModal from '@/components/billing/UpgradeModal.vue';
import PlanSelectorModal from '@/components/billing/PlanSelectorModal.vue';
import type { SubscriptionTier } from '@/types/user-types';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { showError, showSuccess } = useToast();
const loading = ref(false);
const showUpgradeModal = ref(false);
const showPlanSelector = ref(false);

const userEmail = computed(() => userStore.getUser?.email || '');
const currentPlan = computed(() => userStore.getUserProfile?.subscription_status || 'trial');
const hasActiveSubscription = computed(() => 
  currentPlan.value === 'active' || 
  currentPlan.value === 'past_due'
);

// Get the user's selected tier (from trial signup)
const userTier = computed(() => {
  const profile = userStore.getUserProfile;
  return profile?.selected_tier || profile?.trial_tier || null;
});

const isExpired = computed(() => {
  const profile = userStore.getUserProfile;
  if (!profile?.plan_expires_at) return false;
  return new Date(profile.plan_expires_at) < new Date();
});

const isCurrentSubscriber = computed(() => {
  return hasActiveSubscription.value && userStore.getUserProfile?.subscription_tier;
});

async function selectPlan(tier: SubscriptionTier) {
  console.log('selectPlan called with tier:', tier);
  try {
    loading.value = true;
    
    // Map tier to Stripe price ID
    let priceId = '';
    if (tier === 'optimizer') {
      priceId = import.meta.env.VITE_STRIPE_PRICE_OPTIMIZER;
      console.log('Optimizer price ID from env:', priceId);
    } else if (tier === 'accelerator') {
      priceId = import.meta.env.VITE_STRIPE_PRICE_ACCELERATOR;
    } else if (tier === 'enterprise') {
      // Handle enterprise differently
      handleContactSales();
      return;
    }
    
    if (!priceId) {
      throw new Error('Invalid plan selected');
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

function handleContactSales() {
  loading.value = false;
  showSuccess('Please email support@voipaccelerator.com for Enterprise pricing');
}

function getTierDisplayName(tier: SubscriptionTier) {
  const names = {
    optimizer: 'Optimizer',
    accelerator: 'Accelerator',
    enterprise: 'Enterprise'
  };
  return names[tier] || tier;
}

function handleReturnToDashboard() {
  const redirectPath = route.query.redirect as string;
  router.push(redirectPath || '/dashboard');
}

async function handleDeleteAccount() {
  // Navigate to dashboard where the delete account modal can be triggered
  router.push('/dashboard?action=delete-account');
}

async function handleUpgrade(targetTier: SubscriptionTier) {
  try {
    loading.value = true;
    showUpgradeModal.value = false;
    
    // Get current subscription details
    const profile = userStore.getUserProfile;
    if (!profile?.subscription_id) {
      throw new Error('No active subscription found');
    }
    
    // Call upgrade service with prorating
    await stripeService.upgradeSubscription({
      subscriptionId: profile.subscription_id,
      newTier: targetTier,
      currentTier: profile.subscription_tier
    });
    
    showSuccess(`Successfully upgraded to ${getTierDisplayName(targetTier)}!`);
    
    // Refresh user profile to get updated tier
    if (userStore.getUser?.id) {
      await userStore.fetchProfile(userStore.getUser.id);
    }
    
  } catch (error) {
    console.error('Upgrade error:', error);
    showError(error instanceof Error ? error.message : 'Failed to upgrade subscription');
  } finally {
    loading.value = false;
  }
}

function handlePlanSelection(tier: SubscriptionTier) {
  showPlanSelector.value = false;
  selectPlan(tier);
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