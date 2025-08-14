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
        <div class="relative bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full p-8 border border-gray-700">
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
            <h2 class="text-3xl font-bold text-white mb-2">Unlock More Power</h2>
            <p class="text-gray-400">Upgrade your plan to accelerate your VoIP business growth</p>
          </div>

          <!-- Plan Comparison -->
          <div class="grid md:grid-cols-3 gap-6">
            <!-- Current Plan -->
            <div class="bg-gray-700/30 rounded-lg p-6 border border-gray-600 relative">
              <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span class="bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  CURRENT
                </span>
              </div>
              
              <div class="text-center">
                <h3 class="text-lg font-semibold text-gray-300 mb-2">{{ getTierDisplayName(currentTier) }}</h3>
                <div class="mb-4">
                  <span class="text-2xl font-bold text-gray-300">${{ getTierPrice(currentTier) }}</span>
                  <span class="text-gray-500">/month</span>
                </div>
                
                <ul class="space-y-2 text-sm text-gray-400 mb-6">
                  <li v-for="feature in getTierFeatures(currentTier)" :key="feature" class="flex items-center">
                    <svg class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    {{ feature }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Accelerator Plan -->
            <div 
              v-if="canUpgradeTo('accelerator')"
              class="bg-gray-800 rounded-lg p-6 border-2 transition-all cursor-pointer relative"
              :class="selectedUpgrade === 'accelerator' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-600 hover:border-gray-500'"
              @click="selectedUpgrade = 'accelerator'"
            >
              <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span class="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              
              <div class="text-center">
                <h3 class="text-lg font-semibold text-white mb-2">Accelerator</h3>
                <div class="mb-2">
                  <span class="text-3xl font-bold text-white">$249</span>
                  <span class="text-gray-400">/month</span>
                </div>
                <p class="text-accent text-sm mb-4">+${{ upgradePrice('accelerator') }}/month</p>
                
                <ul class="space-y-2 text-sm text-gray-300 mb-6">
                  <li v-for="feature in getTierFeatures('accelerator')" :key="feature" class="flex items-center">
                    <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    {{ feature }}
                  </li>
                </ul>

                <div 
                  class="w-6 h-6 rounded-full border-2 mx-auto transition-colors"
                  :class="selectedUpgrade === 'accelerator' ? 'bg-accent border-accent' : 'border-gray-400'"
                >
                  <svg v-if="selectedUpgrade === 'accelerator'" class="w-4 h-4 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Enterprise Plan -->
            <div 
              v-if="canUpgradeTo('enterprise')"
              class="bg-gray-800 rounded-lg p-6 border-2 transition-all cursor-pointer relative"
              :class="selectedUpgrade === 'enterprise' ? 'border-accent ring-2 ring-accent/20' : 'border-gray-600 hover:border-gray-500'"
              @click="selectedUpgrade = 'enterprise'"
            >
              <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span class="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  PREMIUM
                </span>
              </div>
              
              <div class="text-center">
                <h3 class="text-lg font-semibold text-white mb-2">Enterprise</h3>
                <div class="mb-2">
                  <span class="text-3xl font-bold text-white">$499</span>
                  <span class="text-gray-400">+/month</span>
                </div>
                <p class="text-accent text-sm mb-4">+${{ upgradePrice('enterprise') }}/month</p>
                
                <ul class="space-y-2 text-sm text-gray-300 mb-6">
                  <li v-for="feature in getTierFeatures('enterprise')" :key="feature" class="flex items-center">
                    <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    {{ feature }}
                  </li>
                </ul>

                <div 
                  class="w-6 h-6 rounded-full border-2 mx-auto transition-colors"
                  :class="selectedUpgrade === 'enterprise' ? 'bg-accent border-accent' : 'border-gray-400'"
                >
                  <svg v-if="selectedUpgrade === 'enterprise'" class="w-4 h-4 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Upgrade Benefits -->
          <div class="mt-8 p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm text-accent font-medium">Seamless Upgrade</p>
                <p class="text-xs text-gray-400 mt-1">
                  You'll only pay the prorated difference. Your next billing date remains the same.
                </p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 mt-8">
            <BaseButton
              @click="$emit('close')"
              variant="secondary"
              size="standard"
            >
              Maybe Later
            </BaseButton>
            
            <BaseButton
              @click="handleUpgrade"
              variant="primary"
              size="standard"
              :disabled="!selectedUpgrade"
              :loading="upgrading"
            >
              <span v-if="upgrading">Upgrading...</span>
              <span v-else-if="selectedUpgrade">
                Upgrade to {{ getTierDisplayName(selectedUpgrade) }}
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
import { computed, ref } from 'vue';
import BaseButton from '@/components/shared/BaseButton.vue';
import type { SubscriptionTier } from '@/types/user-types';

interface Props {
  currentTier: SubscriptionTier | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  upgrade: [tier: SubscriptionTier];
}>();

const selectedUpgrade = ref<SubscriptionTier | null>(null);
const upgrading = ref(false);

// Helper functions
const getTierDisplayName = (tier: SubscriptionTier | null) => {
  if (!tier) return 'Unknown';
  const names = {
    optimizer: 'Optimizer',
    accelerator: 'Accelerator',
    enterprise: 'Enterprise'
  };
  return names[tier] || tier;
};

const getTierPrice = (tier: SubscriptionTier | null) => {
  if (!tier) return '0';
  const prices = {
    optimizer: '99',
    accelerator: '249',
    enterprise: '499'
  };
  return prices[tier] || '0';
};

const getTierFeatures = (tier: SubscriptionTier | null) => {
  if (!tier) return [];
  const features = {
    optimizer: [
      '100 uploads per month',
      '1 user account',
      'Perfect for getting started'
    ],
    accelerator: [
      'Unlimited uploads',
      '1 user account',
      'Best for growing businesses',
      'Priority support'
    ],
    enterprise: [
      'Everything in Accelerator',
      'Multiple user accounts',
      'Custom solutions available',
      'Dedicated support'
    ]
  };
  return features[tier] || [];
};

const canUpgradeTo = (targetTier: SubscriptionTier) => {
  if (!props.currentTier) return false;
  
  const tierHierarchy = {
    optimizer: 1,
    accelerator: 2,
    enterprise: 3
  };
  
  return tierHierarchy[targetTier] > tierHierarchy[props.currentTier];
};

const upgradePrice = (targetTier: SubscriptionTier) => {
  if (!props.currentTier) return '0';
  
  const currentPrice = parseInt(getTierPrice(props.currentTier));
  const targetPrice = parseInt(getTierPrice(targetTier));
  
  return (targetPrice - currentPrice).toString();
};

const handleUpgrade = async () => {
  if (!selectedUpgrade.value) return;
  
  upgrading.value = true;
  try {
    emit('upgrade', selectedUpgrade.value);
  } finally {
    upgrading.value = false;
  }
};
</script>