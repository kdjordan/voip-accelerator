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
        <div class="relative bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full p-8 border border-gray-700">
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
            <h2 class="text-3xl font-bold text-white mb-2">Choose Your Billing</h2>
            <p class="text-gray-400">{{ isTrialExpired ? 'Accelerator Plan - Unlimited Everything' : '🎉 Includes 7-day free trial' }}</p>
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
          <div class="bg-gray-900 rounded-lg p-8 border-2 border-accent shadow-xl">
            <!-- Plan Header -->
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">Accelerator Plan</h3>
              <p class="text-gray-400 text-sm">Everything you need to accelerate your VoIP business</p>
            </div>

            <!-- Pricing -->
            <div class="text-center mb-8">
              <div class="flex items-baseline justify-center">
                <span class="text-5xl font-bold text-accent">
                  ${{ selectedBillingPeriod === 'annual' ? '999' : '99' }}
                </span>
                <span class="text-gray-400 ml-2">
                  {{ selectedBillingPeriod === 'annual' ? '/year' : '/month' }}
                </span>
              </div>
              <p v-if="selectedBillingPeriod === 'annual'" class="text-green-400 text-sm mt-2">
                Save $189/year compared to monthly billing
              </p>
              <p v-else class="text-gray-500 text-sm mt-2">
                or $999/year (save $189)
              </p>
            </div>

            <!-- Features -->
            <ul class="space-y-4 mb-8">
              <li class="flex items-start text-gray-300">
                <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <strong class="text-white">Unlimited Uploads</strong>
                  <p class="text-sm text-gray-400">Upload as many rate sheets as you need</p>
                </div>
              </li>
              <li class="flex items-start text-gray-300">
                <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <strong class="text-white">Unlimited Comparisons</strong>
                  <p class="text-sm text-gray-400">Compare rate sheets without limits</p>
                </div>
              </li>
              <li class="flex items-start text-gray-300">
                <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <strong class="text-white">Advanced Analytics</strong>
                  <p class="text-sm text-gray-400">Deep insights into your pricing data</p>
                </div>
              </li>
              <li class="flex items-start text-gray-300">
                <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <strong class="text-white">Priority Support</strong>
                  <p class="text-sm text-gray-400">Get help when you need it</p>
                </div>
              </li>
              <li v-if="!isTrialExpired" class="flex items-start text-gray-300">
                <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <strong class="text-white">7-Day Free Trial</strong>
                  <p class="text-sm text-gray-400">Full access, no credit card required</p>
                </div>
              </li>
            </ul>
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
            >
              {{ isTrialExpired ? `Subscribe ${selectedBillingPeriod === 'annual' ? 'Annually' : 'Monthly'}` : `Start Free Trial` }}
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
