<template>
  <div class="space-y-8">
    <!-- Header with Lightning Icon -->
    <div class="text-center">
      <BoltIcon class="mx-auto h-10 w-auto text-accent mb-4" />
      <h2 class="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
      <p class="text-gray-400">Select the plan that fits your needs</p>
    </div>

    <!-- Two Path Selection -->
    <div class="space-y-8">
      <!-- Path 1: Start Free Trial -->
      <div class="flex justify-center">
        <div class="w-1/2 border border-accent/30 rounded-lg p-6 bg-accent/5">
          <div class="text-center mb-6">
            <h3 class="text-xl font-semibold text-white mb-2">🎉 Start 7-Day Free Trial</h3>
            <p class="text-gray-400 text-sm">Test all features with realistic upload limits</p>
            <p class="text-gray-400 text-sm">No credit card required</p>
          </div>
          
          <div 
            class="bg-gray-800 rounded-lg p-6 border-2 transition-all cursor-pointer"
            :class="selectedTier === 'trial' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-700 hover:border-gray-600'"
            @click="selectTier('trial')"
          >
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-semibold text-white">Optimizer Trial</h4>
            <div 
              class="w-5 h-5 rounded-full border-2 transition-colors"
              :class="selectedTier === 'trial' ? 'bg-accent border-accent' : 'border-gray-400'"
            >
              <svg v-if="selectedTier === 'trial'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div class="mb-4">
            <span class="text-3xl font-bold text-accent">FREE</span>
            <span class="text-gray-400 ml-1">7 days</span>
          </div>
          
          <ul class="space-y-2 text-sm text-gray-300">
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              100 uploads during trial
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              All core features included
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Cancel anytime
            </li>
          </ul>
        </div>
        </div>
      </div>

      <!-- Path 2: Subscribe Now -->
      <div class="border border-gray-600 rounded-lg p-6">
        <div class="text-center mb-6">
          <h3 class="text-xl font-semibold text-white mb-2">💳 Subscribe Immediately</h3>
          <p class="text-gray-400 text-sm">Skip the trial and get full access right away</p>
        </div>

        <!-- Pricing Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Optimizer Plan -->
      <div 
        class="bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer"
        :class="selectedTier === 'optimizer' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-700 hover:border-gray-600'"
        @click="selectTier('optimizer')"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold text-white">Optimizer</h3>
          <div 
            class="w-4 h-4 rounded-full border-2 transition-colors"
            :class="selectedTier === 'optimizer' ? 'bg-accent border-accent' : 'border-gray-400'"
          >
            <svg v-if="selectedTier === 'optimizer'" class="w-2 h-2 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div class="mb-3">
          <span class="text-2xl font-bold text-white">$99</span>
          <span class="text-gray-400 text-sm">/mo</span>
        </div>
        
        <ul class="space-y-1 text-xs text-gray-300">
          <li class="flex items-center">
            <svg class="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            100 uploads/month
          </li>
          <li class="flex items-center">
            <svg class="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Perfect for starters
          </li>
        </ul>
      </div>

      <!-- Accelerator Plan (Most Popular) -->
      <div 
        class="bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer relative"
        :class="selectedTier === 'accelerator' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-700 hover:border-gray-600'"
        @click="selectTier('accelerator')"
      >
        <!-- Most Popular Badge -->
        <div class="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
          MOST POPULAR
        </div>

        <div class="flex items-center justify-between mb-3 mt-3">
          <h3 class="text-base font-semibold text-white">Accelerator</h3>
          <div 
            class="w-4 h-4 rounded-full border-2 transition-colors"
            :class="selectedTier === 'accelerator' ? 'bg-accent border-accent' : 'border-gray-400'"
          >
            <svg v-if="selectedTier === 'accelerator'" class="w-2 h-2 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div class="mb-3">
          <span class="text-2xl font-bold text-white">$249</span>
          <span class="text-gray-400 text-sm">/mo</span>
        </div>
        
        <ul class="space-y-1 text-xs text-gray-300">
          <li class="flex items-center">
            <svg class="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <strong>Unlimited uploads</strong>
          </li>
          <li class="flex items-center">
            <svg class="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Best for growing biz
          </li>
        </ul>
      </div>

      <!-- Enterprise Plan -->
      <div 
        class="bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer"
        :class="selectedTier === 'enterprise' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-700 hover:border-gray-600'"
        @click="selectTier('enterprise')"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold text-white">Enterprise</h3>
          <div 
            class="w-4 h-4 rounded-full border-2 transition-colors"
            :class="selectedTier === 'enterprise' ? 'bg-accent border-accent' : 'border-gray-400'"
          >
            <svg v-if="selectedTier === 'enterprise'" class="w-2 h-2 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div class="mb-3">
          <span class="text-2xl font-bold text-white">$499</span>
          <span class="text-gray-400 text-sm">/mo</span>
        </div>
        
        <ul class="space-y-1 text-xs text-gray-300">
          <li class="flex items-center">
            <svg class="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <strong>Unlimited uploads</strong>
          </li>
          <li class="flex items-center">
            <svg class="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <strong>5 team members</strong>
          </li>
          <li class="flex items-center">
            <svg class="w-3 h-3 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Team collaboration
          </li>
        </ul>
      </div>
        </div>
      </div>
    </div>

    <!-- Continue Button -->
    <div class="flex justify-center">
      <BaseButton
        @click="handleContinue"
        :disabled="!selectedTier"
        variant="primary"
        size="large"
        class="px-12"
      >
        {{ getButtonText() }}
      </BaseButton>
    </div>

    <!-- Footer -->
    <div class="text-center text-sm text-gray-400">
      <p v-if="selectedTier === 'trial'">No credit card required for trial • Cancel anytime</p>
      <p v-else>Secure payment processing by Stripe • Cancel anytime</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BoltIcon } from '@heroicons/vue/24/solid';
import BaseButton from '@/components/shared/BaseButton.vue';
import type { SubscriptionTier } from '@/types/user-types';

// Emits
const emit = defineEmits<{
  tierSelected: [tier: SubscriptionTier, isTrial?: boolean];
}>();

// State
const selectedTier = ref<SubscriptionTier | 'trial'>('trial'); // Default to trial

// Methods
const selectTier = (tier: SubscriptionTier | 'trial') => {
  selectedTier.value = tier;
};

const getButtonText = () => {
  if (selectedTier.value === 'trial') {
    return 'Start Free Trial';
  }
  
  const tierNames = {
    optimizer: 'Optimizer - $99/month',
    accelerator: 'Accelerator - $249/month', 
    enterprise: 'Enterprise - $499/month'
  };
  
  return `Subscribe to ${tierNames[selectedTier.value as SubscriptionTier] || 'Plan'}`;
};

const handleContinue = () => {
  if (selectedTier.value) {
    // Convert 'trial' to 'optimizer' for backend, but pass trial flag
    const tierToEmit = selectedTier.value === 'trial' ? 'optimizer' : selectedTier.value;
    const isTrial = selectedTier.value === 'trial';
    emit('tierSelected', tierToEmit, isTrial);
  }
};
</script>