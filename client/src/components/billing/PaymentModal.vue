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
        <div class="relative bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full p-8 border border-zinc-800">
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
            <h2 class="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
            <p class="text-gray-400">Unlock all features and accelerate your VoIP business</p>
          </div>

          <!-- Pricing Cards -->
          <div class="grid md:grid-cols-2 gap-6 mb-8">
            <!-- Monthly Plan -->
            <div 
              class="bg-zinc-800 rounded-lg p-6 border-2 transition-all cursor-pointer"
              :class="selectedPlan === 'monthly' ? 'border-blue-500' : 'border-zinc-700 hover:border-zinc-600'"
              @click="selectedPlan = 'monthly'; console.log('🔥 FRONTEND: MONTHLY PLAN SELECTED');"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-white">Monthly</h3>
                <div 
                  class="w-5 h-5 rounded-full border-2 transition-colors"
                  :class="selectedPlan === 'monthly' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'"
                >
                  <svg v-if="selectedPlan === 'monthly'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div class="mb-4">
                <span class="text-4xl font-bold text-white">$900</span>
                <span class="text-gray-400 ml-1">/month</span>
              </div>
              
              <ul class="space-y-2 text-sm text-gray-300">
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  All features included
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Cancel anytime
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Billed monthly
                </li>
              </ul>
            </div>

            <!-- Annual Plan -->
            <div 
              class="bg-zinc-800 rounded-lg p-6 border-2 transition-all cursor-pointer relative"
              :class="selectedPlan === 'annual' ? 'border-blue-500' : 'border-zinc-700 hover:border-zinc-600'"
              @click="selectedPlan = 'annual'; console.log('🔥 FRONTEND: ANNUAL PLAN SELECTED');"
            >
              <!-- Best Value Badge -->
              <div class="absolute -top-3 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
SAVE 17%
              </div>

              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-white">Annual</h3>
                <div 
                  class="w-5 h-5 rounded-full border-2 transition-colors"
                  :class="selectedPlan === 'annual' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'"
                >
                  <svg v-if="selectedPlan === 'annual'" class="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div class="mb-4">
                <span class="text-4xl font-bold text-white">$9000</span>
                <span class="text-gray-400 ml-1">/year</span>
                <p class="text-sm text-gray-500 mt-1">$750/month</p>
              </div>
              
              <ul class="space-y-2 text-sm text-gray-300">
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  All features included
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  2 months free
                </li>
                <li class="flex items-center">
                  <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Billed annually
                </li>
              </ul>
            </div>
          </div>

          <!-- Features List -->
          <div class="mb-8 p-6 bg-zinc-800/50 rounded-lg">
            <h4 class="text-lg font-semibold text-white mb-4">All Plans Include:</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Unlimited Rate Sheet Uploads
              </div>
              <div class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Advanced Rate Comparisons
              </div>
              <div class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Bulk Rate Adjustments
              </div>
              <div class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Excel/CSV Export
              </div>
              <div class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                LERG Data Integration
              </div>
              <div class="flex items-center text-gray-300">
                <svg class="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Priority Support
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4">
            <BaseButton
              @click="handleSubscribe"
              variant="primary"
              class="flex-1"
              :loading="loading"
              :disabled="!selectedPlan"
            >
              Continue to Payment
            </BaseButton>
            <BaseButton
              @click="$emit('close')"
              variant="secondary"
              class="flex-1"
            >
              Cancel
            </BaseButton>
          </div>

          <!-- Security Note -->
          <p class="text-center text-xs text-gray-500 mt-4">
            Secure payment processing by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useBilling } from '@/composables/useBilling';
import BaseButton from '@/components/shared/BaseButton.vue';

const emit = defineEmits<{
  close: [];
  'select-plan': [plan: 'monthly' | 'annual'];
}>();

const { createCheckoutSession, loading } = useBilling();
const selectedPlan = ref<'monthly' | 'annual'>('monthly'); // Default to monthly

async function handleSubscribe() {
  if (!selectedPlan.value) return;
  
  emit('select-plan', selectedPlan.value);
  await createCheckoutSession(selectedPlan.value);
}
</script>