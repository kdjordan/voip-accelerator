<template>
  <div
    v-if="memoryStore.adjustmentMemory.adjustments.length > 0"
    class="bg-gray-900/50 border border-accent/20 rounded-lg p-4 mb-4"
  >
    <!-- Header with Stats -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <h3 class="text-sm font-semibold text-fbWhite">Adjustment Memory</h3>
        <div class="flex items-center gap-2 text-xs text-gray-400">
          <span>{{ stats.totalDestinationsAdjusted }} destinations adjusted</span>
          <span>•</span>
          <span>{{ stats.markupCount }} markups</span>
          <span>•</span>
          <span>{{ stats.markdownCount }} markdowns</span>
        </div>
      </div>
      <BaseButton
        variant="destructive"
        size="small"
        :disabled="memoryStore.operationInProgress"
        :loading="isResetting"
        @click="handleStartOver"
        title="Reset all adjustments to original rates"
      >
        Start Over
      </BaseButton>
    </div>

    <!-- Progress Indicator -->
    <div v-if="isResetting" class="mb-4">
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="text-accent">{{ processingStatus }}</span>
        <span class="text-gray-400">{{ processedCount }} / {{ totalToProcess }}</span>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          class="bg-accent h-full transition-all duration-200"
          :style="{ width: `${(processedCount / totalToProcess) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- Adjustments List -->
    <div class="space-y-2 max-h-40 overflow-y-auto">
      <div
        v-for="adjustment in memoryStore.adjustmentMemory.adjustments"
        :key="adjustment.id"
        class="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium text-white">{{ adjustment.destinationName }}</span>
            <span class="text-xs text-gray-400">({{ adjustment.codes.length }} codes)</span>
            <span class="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
              {{ adjustment.bucketCategory }}
            </span>
            <span
              class="text-xs px-2 py-1 rounded-full"
              :class="{
                'bg-blue-900/50 text-blue-300': adjustment.method === 'individual',
                'bg-purple-900/50 text-purple-300': adjustment.method === 'bucket',
                'bg-green-900/50 text-green-300': adjustment.method === 'global',
              }"
            >
              {{ adjustment.method }}
            </span>
          </div>
          <div class="flex items-center gap-2 text-sm mt-1">
            <span class="text-gray-400">${{ formatRate(adjustment.originalRate) }}</span>
            <ArrowRightIcon class="w-3 h-3 text-gray-500" />
            <span class="text-white font-medium">${{ formatRate(adjustment.adjustedRate) }}</span>
            <BaseBadge
              :variant="adjustment.adjustmentType === 'markup' ? 'accent' : 'destructive'"
              size="small"
            >
              {{ adjustment.adjustmentType === 'markup' ? '+' : '-' }}{{ adjustment.adjustmentValue
              }}{{ adjustment.adjustmentValueType === 'percentage' ? '%' : '$' }}
            </BaseBadge>
          </div>
        </div>
        <BaseButton
          variant="secondary-outline"
          size="small"
          :disabled="memoryStore.operationInProgress"
          @click="handleRemoveAdjustment(adjustment.id)"
          title="Remove this adjustment"
        >
          Remove
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { ArrowRightIcon } from '@heroicons/vue/24/outline';
  import { useAzRateSheetStore } from '@/stores/az-rate-sheet-store';
  import { formatRate } from '@/constants/rate-buckets';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import BaseBadge from '@/components/shared/BaseBadge.vue';

  const memoryStore = useAzRateSheetStore();
  const isResetting = ref(false);
  const processingStatus = ref('');
  const processedCount = ref(0);
  const totalToProcess = ref(0);

  const stats = computed(() => memoryStore.getMemoryStats);

  async function handleStartOver() {
    isResetting.value = true;
    memoryStore.setOperationInProgress(true);
    const adjustments = [...memoryStore.adjustmentMemory.adjustments];
    totalToProcess.value = adjustments.length;
    processedCount.value = 0;

    try {
      processingStatus.value = 'Preparing to reset adjustments...';
      await new Promise((resolve) => setTimeout(resolve, 100)); // Let UI update

      const BATCH_SIZE = 50;
      const batches = [];

      // Prepare batches
      for (let i = 0; i < adjustments.length; i += BATCH_SIZE) {
        batches.push(adjustments.slice(i, i + BATCH_SIZE));
      }

      // Process each batch
      processingStatus.value = 'Resetting adjustments...';
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        // Process items in current batch
        for (const adjustment of batch) {
          await memoryStore.removeAdjustmentFromMemory(adjustment.id);
          processedCount.value++;

          // Give UI time to breathe every few items
          if (processedCount.value % 10 === 0) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        }

        // Micro-delay between batches
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      processingStatus.value = 'Reset complete!';
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to reset adjustments:', error);
    } finally {
      isResetting.value = false;
      memoryStore.setOperationInProgress(false);
      processingStatus.value = '';
      processedCount.value = 0;
      totalToProcess.value = 0;
    }
  }

  function handleRemoveAdjustment(adjustmentId: number) {
    memoryStore.removeAdjustmentFromMemory(adjustmentId);
  }
</script>
