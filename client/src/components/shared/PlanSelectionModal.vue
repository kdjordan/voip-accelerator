<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    
    <!-- Modal -->
    <div class="relative bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <div>
          <h2 class="text-2xl font-bold text-white">Upgrade Your Subscription</h2>
          <p class="text-gray-400 mt-1">Choose the perfect plan for your needs</p>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Plans Grid -->
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Accelerator Plan -->
          <div class="relative bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6 hover:border-blue-400/50 transition-all duration-200">
            <div class="absolute top-4 right-4">
              <span class="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium">
                Popular
              </span>
            </div>
            
            <div class="mb-4">
              <h3 class="text-xl font-bold text-white mb-2">Accelerator</h3>
              <div class="flex items-baseline">
                <span class="text-3xl font-bold text-blue-400">$99</span>
                <span class="text-gray-400 ml-2">/month</span>
              </div>
            </div>

            <div class="space-y-3 mb-6">
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Unlimited file uploads</span>
              </div>
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Advanced analytics</span>
              </div>
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Priority support</span>
              </div>
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Export to all formats</span>
              </div>
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Individual account</span>
              </div>
            </div>

            <button
              @click="$emit('select-plan', 'accelerator')"
              class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Choose Accelerator
            </button>
          </div>

          <!-- Enterprise Plan -->
          <div class="relative bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-lg p-6 hover:border-amber-400/50 transition-all duration-200">
            <div class="absolute top-4 right-4">
              <span class="bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs font-medium">
                Teams
              </span>
            </div>
            
            <div class="mb-4">
              <h3 class="text-xl font-bold text-white mb-2">Enterprise</h3>
              <div class="flex items-baseline">
                <span class="text-3xl font-bold text-amber-400">$499</span>
                <span class="text-gray-400 ml-2">/month</span>
              </div>
            </div>

            <div class="space-y-3 mb-6">
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Everything in Accelerator</span>
              </div>
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Team collaboration</span>
              </div>
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Organization management</span>
              </div>
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Dedicated support</span>
              </div>
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-300">Custom integrations</span>
              </div>
            </div>

            <button
              @click="$emit('select-plan', 'enterprise')"
              class="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Choose Enterprise
            </button>
          </div>
        </div>

        <!-- Footer Note -->
        <div class="mt-6 text-center">
          <p class="text-gray-400 text-sm">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface Props {
  show: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'select-plan', tier: 'accelerator' | 'enterprise'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>