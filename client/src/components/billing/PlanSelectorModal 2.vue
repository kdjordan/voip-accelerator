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
        <div class="relative bg-gray-800 rounded-xl shadow-xl max-w-3xl w-1/3 p-8 border border-gray-700">
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
            <h2 class="text-2xl font-bold text-white mb-2">Complete Your Subscription</h2>
            <p class="text-gray-400">Accelerator Plan - Unlimited Everything</p>
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

          <!-- Plan Card -->
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
                  {{ isTrialExpired ? '7-day free trial ended' : 'Get started today' }}
                </li>
              </ul>

              <BaseButton
                @click="handleSelectPlan"
                variant="primary"
                size="standard"
                class="w-full"
              >
                Subscribe {{ selectedBillingPeriod === 'monthly' ? 'Monthly' : 'Annually' }}
              </BaseButton>
            </div>
          </div>

          <!-- Footer -->
          <div class="text-center mt-8">
            <p class="text-gray-500 text-sm">Secure payment processing by Stripe. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseButton from '@/components/shared/BaseButton.vue';
import type { BillingPeriod } from '@/types/user-types';

interface Props {
  isTrialExpired?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isTrialExpired: false
});

const emit = defineEmits<{
  close: [];
  'select-plan': [billingPeriod: BillingPeriod];
}>();

const selectedBillingPeriod = ref<'monthly' | 'annual'>('monthly');

const handleSelectPlan = () => {
  emit('select-plan', selectedBillingPeriod.value);
};
</script>
