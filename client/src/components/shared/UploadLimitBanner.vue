<template>
  <div
    v-if="show"
    class="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-lg p-6 mb-4"
  >
    <div class="flex items-start space-x-4">
      <div class="flex-shrink-0">
        <div class="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-red-400 mb-1">
          Monthly Upload Limit Reached
        </h3>
        <p class="text-red-300 text-sm leading-relaxed mb-3">
          You've reached your monthly limit of 100 file uploads for the Optimizer plan.
          Upgrade your subscription for unlimited uploads and enhanced features.
        </p>
        <div class="flex items-center space-x-3">
          <button
            @click="handleUpgradeClick"
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Upgrade Subscription
          </button>
          <span class="text-gray-400 text-sm">
            or wait until next billing cycle
          </span>
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
  (e: 'upgrade'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function handleUpgradeClick() {
  emit('upgrade');
}
</script>