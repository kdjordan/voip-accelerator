<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/75 transition-opacity"
          @click="$emit('close')"
        />

        <!-- Modal -->
        <div class="relative bg-zinc-900 rounded-xl shadow-xl max-w-5xl w-full p-8 border border-zinc-800">
          <!-- Close button -->
          <button
            @click="$emit('close')"
            class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Header -->
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-white mb-2" v-if="!userTier">Choose Your Plan</h2>
            <h2 class="text-3xl font-bold text-white mb-2" v-else>Complete Your {{ getTierDisplayName(userTier) }} Subscription</h2>
            <p class="text-gray-400" v-if="!userTier">🎉 All plans include a 7-day free trial</p>
            <p class="text-gray-400" v-else>Your 7-day trial has ended. Subscribe to continue using {{ getTierDisplayName(userTier) }}.</p>
          </div>

          <!-- Pricing Cards - Only show if no user tier is set -->
          <div v-if="!userTier" class="grid md:grid-cols-3 gap-6 mb-8">
            <!-- Optimizer Plan -->
            <div 
              class="bg-zinc-800 rounded-lg p-6 border-2 transition-all cursor-pointer"
              :class="selectedPlan === 'optimizer' ? 'border-blue-500' : 'border-zinc-700 hover:border-zinc-600'"
              @click="selectedPlan = 'optimizer'"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-white">Optimizer</h3>
                <div 
                  class="w-5 h-5 rounded-full border-2 transition-colors"
                  :class="selectedPlan === 'optimizer' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'"
                >
                  <svg v-if="selectedPlan === 'optimizer'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div class="mb-4">
                <span class="text-4xl font-bold text-white">$249</span>
                <span class="text-gray-400 ml-1">/month</span>
              </div>
              
              <ul class="space-y-2 text-sm text-gray-300">
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  100 uploads per month
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  1 user account
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Perfect for getting started
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  7-day free trial
                </li>
              </ul>
            </div>

            <!-- Accelerator Plan (Most Popular) -->
            <div 
              class="bg-zinc-800 rounded-lg p-6 border-2 transition-all cursor-pointer relative"
              :class="selectedPlan === 'accelerator' ? 'border-blue-500' : 'border-zinc-700 hover:border-zinc-600'"
              @click="selectedPlan = 'accelerator'"
            >
              <!-- Most Popular Badge -->
              <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>

              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-white">Accelerator</h3>
                <div 
                  class="w-5 h-5 rounded-full border-2 transition-colors"
                  :class="selectedPlan === 'accelerator' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'"
                >
                  <svg v-if="selectedPlan === 'accelerator'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div class="mb-4">
                <span class="text-4xl font-bold text-white">$99</span>
                <span class="text-gray-400 ml-1">/month</span>
              </div>
              
              <ul class="space-y-2 text-sm text-gray-300">
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <strong>Unlimited uploads</strong>
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  1 user account
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Best for growing businesses
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  7-day free trial
                </li>
              </ul>
            </div>

            <!-- Enterprise Plan -->
            <div 
              class="bg-zinc-800 rounded-lg p-6 border-2 transition-all cursor-pointer"
              :class="selectedPlan === 'enterprise' ? 'border-blue-500' : 'border-zinc-700 hover:border-zinc-600'"
              @click="selectedPlan = 'enterprise'"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-white">Enterprise</h3>
                <div 
                  class="w-5 h-5 rounded-full border-2 transition-colors"
                  :class="selectedPlan === 'enterprise' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'"
                >
                  <svg v-if="selectedPlan === 'enterprise'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div class="mb-4">
                <span class="text-4xl font-bold text-white">$499</span>
                <span class="text-gray-400 ml-1">/month</span>
              </div>
              
              <ul class="space-y-2 text-sm text-gray-300">
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <strong>Unlimited uploads</strong>
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <strong>5 team members</strong>
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Team collaboration
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Multiple devices
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  7-day free trial
                </li>
              </ul>
            </div>
          </div>

          <!-- Single Tier Display - Show when user has a selected tier -->
          <div v-else class="max-w-md mx-auto mb-8">
            <div class="bg-zinc-800 rounded-lg p-6 border-2 border-blue-500">
              <div class="text-center mb-4">
                <h3 class="text-2xl font-semibold text-white mb-2">{{ getTierDisplayName(userTier) }} Plan</h3>
                <div class="mb-4">
                  <span class="text-4xl font-bold text-white">{{ getTierPrice(userTier) }}</span>
                  <span class="text-gray-400 ml-1">/month</span>
                </div>
              </div>
              
              <ul class="space-y-2 text-sm text-gray-300">
                <li v-for="feature in getTierFeatures(userTier)" :key="feature" class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              @click="handleSubscribe"
              :disabled="!selectedPlan || isLoading"
              class="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              <span v-if="isLoading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
              <span v-else-if="!userTier">
                Start 7-Day Free Trial ({{ selectedPlan || 'Select Plan' }})
              </span>
              <span v-else>
                Subscribe to {{ getTierDisplayName(userTier) }} - {{ getTierPrice(userTier) }}/month
              </span>
            </button>
            
            <button
              @click="$emit('close')"
              class="px-8 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-lg transition-colors"
            >
              Maybe Later
            </button>
          </div>

          <!-- Footer -->
          <div class="text-center text-sm text-gray-400 mt-6">
            <p>No credit card required for trial • Cancel anytime • Secure checkout</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBilling } from '@/composables/useBilling';
import { useUserStore } from '@/stores/user-store';
import type { SubscriptionTier } from '@/types/user-types';

// Component props and emits
interface Props {
  preselectedTier?: SubscriptionTier;
}

const props = defineProps<Props>();

defineEmits<{
  close: [];
  'select-plan': [plan: SubscriptionTier];
}>();

// Stores
const userStore = useUserStore();

// Computed - Get user's selected tier from their profile
const userTier = computed(() => {
  // First check if there's a preselected tier passed as prop
  if (props.preselectedTier) return props.preselectedTier;
  
  // Then check trial_tier (what they selected during signup)
  const trialTier = userStore.getTrialTier;
  if (trialTier) return trialTier;
  
  // Finally check subscription_tier (if they have an active subscription)
  const subTier = userStore.getSubscriptionTier;
  if (subTier) return subTier;
  
  return null;
});

// State
const selectedPlan = ref<SubscriptionTier>(userTier.value || 'optimizer'); // Use user's tier or default to most popular
const isLoading = ref(false);

// Helper functions
const getTierDisplayName = (tier: SubscriptionTier) => {
  const names = {
    accelerator: 'Accelerator',
    optimizer: 'Optimizer',
    enterprise: 'Enterprise'
  };
  return names[tier] || tier;
};

const getTierPrice = (tier: SubscriptionTier) => {
  const prices = {
    optimizer: '$99',
    accelerator: '$249',
    enterprise: '$499'
  };
  return prices[tier] || '$0';
};

const getTierFeatures = (tier: SubscriptionTier) => {
  const features = {
    optimizer: [
      '100 uploads per month',
      '1 user account',
      'Perfect for getting started'
    ],
    accelerator: [
      'Unlimited uploads',
      '1 user account',
      'Best for growing businesses'
    ],
    enterprise: [
      'Unlimited uploads',
      '5 team members',
      'Team collaboration',
      'Multiple devices'
    ]
  };
  return features[tier] || [];
};

// Set selected plan to user's tier on mount
onMounted(() => {
  if (userTier.value) {
    selectedPlan.value = userTier.value;
  }
});

// Composables
const { createCheckoutSession } = useBilling();

// Methods
const handleSubscribe = async () => {
  // Use userTier if available, otherwise use selectedPlan
  const planToSubscribe = userTier.value || selectedPlan.value;
  
  if (!planToSubscribe || isLoading.value) return;
  
  isLoading.value = true;
  
  try {
    console.log(`🚀 Creating checkout session for ${planToSubscribe} plan`);
    
    // Get the correct price ID based on selected plan
    const priceIds = {
      accelerator: import.meta.env.VITE_STRIPE_PRICE_ACCELERATOR,
      optimizer: import.meta.env.VITE_STRIPE_PRICE_OPTIMIZER,
      enterprise: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE,
    };
    
    const priceId = priceIds[planToSubscribe];
    
    if (!priceId) {
      throw new Error(`Price ID not found for ${planToSubscribe} plan`);
    }
    
    await createCheckoutSession(priceId, planToSubscribe);
    
  } catch (error: any) {
    console.error('Checkout error:', error);
    // You might want to show an error toast/notification here
    alert(`Failed to start checkout: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
};
</script>