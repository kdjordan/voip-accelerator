<template>
  <div v-if="azStore.getFileNameByComponent(componentId) !== ''" class="mt-8 pt-8 border-t border-gray-700/50">
    <!-- Code Report heading with file name pill -->
    <div class="mb-4 flex items-center justify-between">
      <span class="text-xl text-fbWhite font-secondary">Code Report</span>
      <div class="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 border border-accent/50">
        <span class="text-sm text-accent">{{ azStore.getFileNameByComponent(componentId) }}</span>
      </div>
    </div>
    
    <!-- Code Report Content - Dark bento box style -->
    <div class="bg-gray-900 rounded-lg p-4">
      <div class="space-y-4">
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-1">Total Codes:</div>
          <div class="text-xl text-white">{{ azStore.getFileStats(componentId).totalCodes }}</div>
        </div>
        
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-1">Total Destinations:</div>
          <div class="text-xl text-white">{{ azStore.getFileStats(componentId).totalDestinations }}</div>
        </div>
        
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-1">Unique Destinations Percentage:</div>
          <div class="text-xl text-white">{{ azStore.getFileStats(componentId).uniqueDestinationsPercentage }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAzStore } from '@/stores/az-store';

// Define props
const props = defineProps<{
  componentId: string;
}>();

const azStore = useAzStore();
</script> 