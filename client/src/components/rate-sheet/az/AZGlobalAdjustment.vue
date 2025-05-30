<template>
  <div
    v-if="canShowGlobalAdjustments"
    class="bg-gray-800 30 rounded-lg p-4 mb-4 border border-gray-700"
  >
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-fbWhite">Global Rate Adjustment</h3>
        <span class="text-xs text-gray-400">APPLIES TO ALL DESTINATIONS</span>
      </div>
      <BaseBadge variant="neutral" size="small">
        {{ availableDestinationsCount }} destinations available
      </BaseBadge>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Adjustment Type -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Adjustment</label>
        <Listbox v-model="globalAdjustment.adjustmentType" as="div">
          <div class="relative">
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
              :disabled="store.operationInProgress"
            >
              <span class="block truncate text-white">{{
                getAdjustmentTypeLabel(globalAdjustment.adjustmentType)
              }}</span>
              <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </ListboxButton>
            <transition
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <ListboxOptions
                class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
              >
                <ListboxOption
                  v-for="option in adjustmentTypeOptions"
                  :key="option.value"
                  :value="option.value"
                  v-slot="{ active, selected }"
                  as="template"
                >
                  <li
                    :class="[
                      active ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300',
                      'relative cursor-default select-none py-2 pl-10 pr-4',
                    ]"
                  >
                    <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                      {{ option.label }}
                    </span>
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400"
                    >
                      <CheckIcon class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </div>
        </Listbox>
      </div>

      <!-- Value Type -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">By</label>
        <Listbox v-model="globalAdjustment.adjustmentValueType" as="div">
          <div class="relative">
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
              :disabled="store.operationInProgress"
            >
              <span class="block truncate text-white">{{
                getAdjustmentValueTypeLabel(globalAdjustment.adjustmentValueType)
              }}</span>
              <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </ListboxButton>
            <transition
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <ListboxOptions
                class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
              >
                <ListboxOption
                  v-for="option in adjustmentValueTypeOptions"
                  :key="option.value"
                  :value="option.value"
                  v-slot="{ active, selected }"
                  as="template"
                >
                  <li
                    :class="[
                      active ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300',
                      'relative cursor-default select-none py-2 pl-10 pr-4',
                    ]"
                  >
                    <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                      {{ option.label }}
                    </span>
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400"
                    >
                      <CheckIcon class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </div>
        </Listbox>
      </div>

      <!-- Value Input -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Value</label>
        <input
          v-model.number="globalAdjustment.adjustmentValue"
          type="number"
          min="0"
          step="any"
          placeholder="Enter value..."
          class="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2 focus:ring-blue-400 focus:border-blue-400"
          :disabled="store.operationInProgress"
        />
      </div>

      <!-- Apply Button with Enhanced Safety -->
      <div class="flex items-end justify-end">
        <BaseButton
          variant="accent"
          size="small"
          class="w-1/3"
          :icon="ArrowRightIcon"
          :disabled="!canApplyGlobalAdjustment || store.operationInProgress"
          :loading="isApplyingGlobalAdjustment"
          @click="handleApplyGlobalAdjustment"
        >
          Apply
        </BaseButton>
      </div>
    </div>

    <!-- Add after the Apply Button -->
    <div v-if="isApplyingGlobalAdjustment" class="mt-4">
      <!-- Progress Status -->
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="text-gray-400">{{ processingStatus }}</span>
        <span class="text-gray-400">{{ processedCount }} / {{ totalToProcess }}</span>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          class="bg-accent h-full transition-all duration-200"
          :style="{ width: `${(processedCount / totalToProcess) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- Error Display -->
    <div
      v-if="lastError"
      class="mt-3 p-2 bg-red-900/20 border border-red-500/20 rounded text-xs text-red-400"
    >
      <ExclamationTriangleIcon class="w-3 h-3 inline mr-1" />
      {{ lastError }}
    </div>

    <!-- Enhanced Preview Section with Distribution -->
    <div v-if="previewData.eligibleDestinations > 0" class="mt-4 p-3 bg-gray-800/50 rounded-lg">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Preview Sample -->
        <div>
          <div class="text-xs text-gray-400 mb-2">Preview (showing first 5 destinations):</div>
          <div class="space-y-1">
            <div
              v-for="preview in previewData.estimatedNewRates.slice(0, 5)"
              :key="preview.destinationName"
              class="text-xs text-gray-300"
            >
              {{ preview.destinationName }}: ${{
                formatRate(getCurrentRate(preview.destinationName))
              }}
              → ${{ formatRate(preview.newRate) }}
            </div>
            <div v-if="previewData.estimatedNewRates.length > 5" class="text-xs text-gray-400">
              ... and {{ previewData.estimatedNewRates.length - 5 }} more destinations
            </div>
          </div>
        </div>

        <!-- Bucket Distribution -->
        <div>
          <div class="text-xs text-gray-400 mb-2">Distribution by bucket:</div>
          <div class="space-y-1">
            <div
              v-for="(count, bucket) in bucketDistribution"
              :key="bucket"
              class="text-xs text-gray-300 flex justify-between"
            >
              <span>{{ getBucketLabel(bucket) }}:</span>
              <span>{{ count }} destinations</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Exclusion Warning -->
      <div v-if="previewData.excludedDestinations.length > 0" class="mt-3 text-xs text-amber-400">
        <ExclamationTriangleIcon class="w-3 h-3 inline mr-1" />
        {{ previewData.excludedDestinations.length }} destinations excluded (already adjusted)
      </div>
    </div>

    <!-- Safety Warning
    <div class="mt-3 p-2 bg-amber-900/20 border border-amber-500/20 rounded text-xs text-amber-300">
      <ExclamationTriangleIcon class="w-3 h-3 inline mr-1" />
      <strong>Caution:</strong> Global adjustments apply to ALL destinations across all rate
      buckets. This action will be tracked in memory and can be reversed using "Start Over."
    </div> -->
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
  import {
    ChevronUpDownIcon,
    ExclamationTriangleIcon,
    CheckIcon,
    GlobeAltIcon,
    ArrowRightIcon,
  } from '@heroicons/vue/24/outline';
  import { useAzRateSheetStore } from '@/stores/az-rate-sheet-store';
  import {
    RATE_BUCKETS,
    classifyRateIntoBucket,
    formatRate,
    calculateAdjustedRate,
  } from '@/constants/rate-buckets';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import type { RateBucketType } from '@/types/domains/rate-sheet-types';

  const store = useAzRateSheetStore();

  // State
  const globalAdjustment = ref({
    adjustmentType: 'markup' as 'markup' | 'markdown',
    adjustmentValueType: 'percentage' as 'percentage' | 'fixed',
    adjustmentValue: 0,
  });

  const isApplyingGlobalAdjustment = ref(false);
  const lastError = ref<string | null>(null);
  const processingStatus = ref('');
  const processedCount = ref(0);
  const totalToProcess = ref(0);

  // Options for dropdowns
  const adjustmentTypeOptions = [
    { value: 'markup', label: 'Markup' },
    { value: 'markdown', label: 'Markdown' },
  ];

  const adjustmentValueTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount ($)' },
  ];

  // Computed properties
  const canShowGlobalAdjustments = computed(() => store.canUseBucketAdjustments);

  const previewData = computed(() => {
    if (!globalAdjustment.value.adjustmentValue || globalAdjustment.value.adjustmentValue <= 0) {
      return {
        totalDestinations: 0,
        eligibleDestinations: 0,
        estimatedNewRates: [],
        excludedDestinations: [],
      };
    }

    const allDestinations = store.groupedData.filter((group) => !group.hasDiscrepancy);

    const eligibleDestinations = allDestinations.filter(
      (group) => !store.isDestinationExcluded(group.destinationName)
    );

    const excludedDestinations = allDestinations.filter((group) =>
      store.isDestinationExcluded(group.destinationName)
    );

    const estimatedNewRates = eligibleDestinations.map((group) => {
      const currentRate = group.rates[0]?.rate || 0;
      const newRate = calculateAdjustedRate(
        currentRate,
        globalAdjustment.value.adjustmentType,
        globalAdjustment.value.adjustmentValue,
        globalAdjustment.value.adjustmentValueType
      );

      return {
        destinationName: group.destinationName,
        newRate,
        currentBucket: classifyRateIntoBucket(currentRate),
      };
    });

    return {
      totalDestinations: allDestinations.length,
      eligibleDestinations: eligibleDestinations.length,
      estimatedNewRates,
      excludedDestinations: excludedDestinations.map((g) => g.destinationName),
    };
  });

  const bucketDistribution = computed(() => {
    const distribution: Record<string, number> = {};

    previewData.value.estimatedNewRates.forEach((item) => {
      const bucket = item.currentBucket;
      distribution[bucket] = (distribution[bucket] || 0) + 1;
    });

    return distribution;
  });

  const availableDestinationsCount = computed(() => previewData.value.eligibleDestinations);

  const canApplyGlobalAdjustment = computed(() => {
    return (
      globalAdjustment.value.adjustmentValue &&
      globalAdjustment.value.adjustmentValue > 0 &&
      previewData.value.eligibleDestinations > 0
    );
  });

  // Methods
  function getCurrentRate(destinationName: string): number {
    const group = store.groupedData.find((g) => g.destinationName === destinationName);
    return group?.rates[0]?.rate || 0;
  }

  function getBucketLabel(bucketType: string): string {
    const bucket = RATE_BUCKETS.find((b) => b.type === bucketType);
    return bucket?.label || bucketType;
  }

  function getAdjustmentTypeLabel(value: string | undefined): string {
    return adjustmentTypeOptions.find((opt) => opt.value === value)?.label || 'Select Type';
  }

  function getAdjustmentValueTypeLabel(value: string | undefined): string {
    return adjustmentValueTypeOptions.find((opt) => opt.value === value)?.label || 'Select Unit';
  }

  async function handleApplyGlobalAdjustment() {
    if (!canApplyGlobalAdjustment.value) return;

    isApplyingGlobalAdjustment.value = true;
    store.setOperationInProgress(true);
    lastError.value = null;
    processedCount.value = 0;
    totalToProcess.value = previewData.value.estimatedNewRates.length;

    try {
      // Store original state for rollback and memory tracking
      processingStatus.value = 'Preparing adjustment data...';
      const originalStates = previewData.value.estimatedNewRates.map((item) => ({
        destinationName: item.destinationName,
        originalRate: getCurrentRate(item.destinationName),
        bucketCategory: item.currentBucket,
      }));

      // Prepare all updates
      const updates = previewData.value.estimatedNewRates.map((item) => ({
        name: item.destinationName,
        rate: item.newRate,
      }));

      // Process updates in smaller batches
      const BATCH_SIZE = 50; // Smaller batch size for smoother UI updates
      const batches = [];

      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        batches.push(updates.slice(i, i + BATCH_SIZE));
      }

      // Process each batch with a micro-delay
      processingStatus.value = 'Applying rate adjustments...';
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        // Update rates for this batch
        const success = await store.bulkUpdateDestinationRates(batch);
        if (!success) {
          throw new Error('Global adjustment operation failed at batch ' + (i + 1));
        }

        // Give UI time to breathe between batches
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      // Record adjustments in memory with batched processing
      processingStatus.value = 'Recording adjustments in memory...';

      // Process memory updates in batches using requestIdleCallback or setTimeout
      const processMemoryBatch = async (startIdx: number) => {
        const endIdx = Math.min(startIdx + BATCH_SIZE, previewData.value.estimatedNewRates.length);
        const currentBatch = previewData.value.estimatedNewRates.slice(startIdx, endIdx);

        for (const item of currentBatch) {
          const originalState = originalStates.find(
            (s) => s.destinationName === item.destinationName
          );
          const group = store.groupedData.find((g) => g.destinationName === item.destinationName);

          if (group && originalState) {
            store.addAdjustmentToMemory({
              destinationName: item.destinationName,
              originalRate: originalState.originalRate,
              adjustedRate: item.newRate,
              adjustmentType: globalAdjustment.value.adjustmentType,
              adjustmentValue: globalAdjustment.value.adjustmentValue,
              adjustmentValueType: globalAdjustment.value.adjustmentValueType,
              timestamp: new Date().toISOString(),
              codes: group.codes,
              bucketCategory: originalState.bucketCategory,
              method: 'global',
            });
          }
          processedCount.value++;

          // Update UI every 10 items within a batch
          if (processedCount.value % 10 === 0) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        }

        // If there are more items to process, schedule the next batch
        if (endIdx < previewData.value.estimatedNewRates.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          await processMemoryBatch(endIdx);
        }
      };

      // Start processing memory updates
      await processMemoryBatch(0);

      processingStatus.value = 'Finalizing changes...';
      // Reset form
      globalAdjustment.value.adjustmentValue = 0;

      // Show completion message briefly
      processingStatus.value = 'Adjustment complete!';
      await new Promise((resolve) => setTimeout(resolve, 1000));
      processingStatus.value = '';
    } catch (error) {
      console.error('Failed to apply global adjustment:', error);
      lastError.value = `Global adjustment failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }. All changes have been rolled back.`;
    } finally {
      isApplyingGlobalAdjustment.value = false;
      store.setOperationInProgress(false);
      processedCount.value = 0;
      totalToProcess.value = 0;
    }
  }
</script>
