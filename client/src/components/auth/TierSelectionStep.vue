<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
      <p class="text-gray-400">🎉 All plans include a 7-day free trial</p>
    </div>

    <!-- Pricing Cards -->
    <div class="grid md:grid-cols-3 gap-4">
      <!-- Optimizer Plan -->
      <div 
        class="bg-gray-800 rounded-lg p-6 border-2 transition-all cursor-pointer"
        :class="selectedTier === 'optimizer' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-700 hover:border-gray-600'"
        @click="selectTier('optimizer')"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Optimizer</h3>
          <div 
            class="w-5 h-5 rounded-full border-2 transition-colors"
            :class="selectedTier === 'optimizer' ? 'bg-accent border-accent' : 'border-gray-400'"
          >
            <svg v-if="selectedTier === 'optimizer'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div class="mb-4">
          <span class="text-3xl font-bold text-white">$99</span>
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
        class="bg-gray-800 rounded-lg p-6 border-2 transition-all cursor-pointer relative"
        :class="selectedTier === 'accelerator' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-700 hover:border-gray-600'"
        @click="selectTier('accelerator')"
      >
        <!-- Most Popular Badge -->
        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
          MOST POPULAR
        </div>

        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Accelerator</h3>
          <div 
            class="w-5 h-5 rounded-full border-2 transition-colors"
            :class="selectedTier === 'accelerator' ? 'bg-accent border-accent' : 'border-gray-400'"
          >
            <svg v-if="selectedTier === 'accelerator'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div class="mb-4">
          <span class="text-3xl font-bold text-white">$249</span>
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
        class="bg-gray-800 rounded-lg p-6 border-2 transition-all cursor-pointer"
        :class="selectedTier === 'enterprise' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-700 hover:border-gray-600'"
        @click="selectTier('enterprise')"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Enterprise</h3>
          <div 
            class="w-5 h-5 rounded-full border-2 transition-colors"
            :class="selectedTier === 'enterprise' ? 'bg-accent border-accent' : 'border-gray-400'"
          >
            <svg v-if="selectedTier === 'enterprise'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div class="mb-4">
          <span class="text-3xl font-bold text-white">$499</span>
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
            7-day free trial
          </li>
        </ul>
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
        Continue with {{ selectedTier || 'selected plan' }}
      </BaseButton>
    </div>

    <!-- Footer -->
    <div class="text-center text-sm text-gray-400">
      <p>No credit card required for trial • Cancel anytime</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BaseButton from '@/components/shared/BaseButton.vue';
import type { SubscriptionTier } from '@/types/user-types';

// Emits
const emit = defineEmits<{
  tierSelected: [tier: SubscriptionTier];
}>();

// State
const selectedTier = ref<SubscriptionTier>('optimizer'); // Default to most popular

// Methods
const selectTier = (tier: SubscriptionTier) => {
  selectedTier.value = tier;
};

const handleContinue = () => {
  if (selectedTier.value) {
    emit('tierSelected', selectedTier.value);
  }
};
</script>