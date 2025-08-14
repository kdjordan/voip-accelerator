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
        <div class="relative bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full p-8 border border-gray-700">
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
            <div class="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4 border-2 border-accent/30">
              <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 class="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
            <p class="text-gray-400">{{ isTrialExpired ? 'Select the perfect plan for your VoIP business' : '🎉 All plans include a 7-day free trial' }}</p>
          </div>

          <!-- Plan Grid -->
          <div class="grid md:grid-cols-3 gap-6">
            <!-- Optimizer Plan -->
            <div 
              class="bg-gray-800 rounded-lg p-6 border-2 transition-all cursor-pointer"
              :class="selectedPlan === 'optimizer' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-600 hover:border-gray-500'"
              @click="selectedPlan = 'optimizer'"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-white">Optimizer</h3>
                <div 
                  class="w-5 h-5 rounded-full border-2 transition-colors"
                  :class="selectedPlan === 'optimizer' ? 'bg-accent border-accent' : 'border-gray-400'"
                >
                  <svg v-if="selectedPlan === 'optimizer'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
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
                <li v-if="!isTrialExpired" class="flex items-center">
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
              :class="selectedPlan === 'accelerator' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-600 hover:border-gray-500'"
              @click="selectedPlan = 'accelerator'"
            >
              <!-- Most Popular Badge -->
              <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>

              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-white">Accelerator</h3>
                <div 
                  class="w-5 h-5 rounded-full border-2 transition-colors"
                  :class="selectedPlan === 'accelerator' ? 'bg-accent border-accent' : 'border-gray-400'"
                >
                  <svg v-if="selectedPlan === 'accelerator'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
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
                <li v-if="!isTrialExpired" class="flex items-center">
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
              :class="selectedPlan === 'enterprise' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-600 hover:border-gray-500'"
              @click="selectedPlan = 'enterprise'"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-white">Enterprise</h3>
                <div 
                  class="w-5 h-5 rounded-full border-2 transition-colors"
                  :class="selectedPlan === 'enterprise' ? 'bg-accent border-accent' : 'border-gray-400'"
                >
                  <svg v-if="selectedPlan === 'enterprise'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div class="mb-4">
                <span class="text-4xl font-bold text-white">$499</span>
                <span class="text-gray-400 ml-1">+/month</span>
              </div>
              
              <ul class="space-y-2 text-sm text-gray-300">
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <strong>Everything in Accelerator</strong>
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Multiple user accounts
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Custom solutions available
                </li>
                <li v-if="!isTrialExpired" class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  7-day free trial
                </li>
              </ul>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 mt-8">
            <BaseButton
              @click="$emit('close')"
              variant="secondary"
              size="standard"
            >
              Cancel
            </BaseButton>
            
            <BaseButton
              @click="handleSelectPlan"
              variant="primary"
              size="standard"
              :disabled="!selectedPlan"
            >
              <span v-if="selectedPlan">
                {{ isTrialExpired ? `Sign up for ${getTierDisplayName(selectedPlan)}` : `Start ${getTierDisplayName(selectedPlan)} Trial` }}
              </span>
              <span v-else>Select a Plan</span>
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseButton from '@/components/shared/BaseButton.vue';
import type { SubscriptionTier } from '@/types/user-types';

interface Props {
  isTrialExpired?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isTrialExpired: false
});

const emit = defineEmits<{
  close: [];
  'select-plan': [tier: SubscriptionTier];
}>();

const selectedPlan = ref<SubscriptionTier>('accelerator'); // Default to most popular

const isTrialExpired = computed(() => props.isTrialExpired);

// Helper functions
const getTierDisplayName = (tier: SubscriptionTier) => {
  const names = {
    optimizer: 'Optimizer',
    accelerator: 'Accelerator',
    enterprise: 'Enterprise'
  };
  return names[tier] || tier;
};

const handleSelectPlan = () => {
  if (selectedPlan.value) {
    emit('select-plan', selectedPlan.value);
  }
};
</script>