<template>
  <div v-if="isGenerating" class="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium text-fbWhite">Generating Rate Deck</h4>
        <span class="text-xs text-gray-400">{{ progress.toFixed(0) }}%</span>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          class="h-full bg-accent transition-all duration-300 ease-out rounded-full"
          :style="{ width: `${progress}%` }"
        />
      </div>
      
      <!-- Status Message -->
      <div class="text-center">
        <p class="text-xs text-gray-300">
          Processing {{ providerCount }} provider{{ providerCount > 1 ? 's' : '' }}...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isGenerating: boolean;
  progress: number;
  providerCount: number;
}

defineProps<Props>();
</script>