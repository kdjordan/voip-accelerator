<template>
  <div
    v-if="canShowBucketAdjustments"
    class="bg-gray-900/30 border border-gray-700 rounded-lg p-4 mb-4"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-gray-300">Bulk Adjustment by Rate Bucket</h3>
      <BaseBadge variant="neutral" size="small">
        {{ eligibleDestinationsCount }} destinations available
      </BaseBadge>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <!-- Bucket Selector -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Target Bucket</label>
        <Listbox v-model="bulkAdjustment.bucketType" as="div">
          <div class="relative">
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
              :disabled="store.operationInProgress"
            >
              <span class="block truncate text-white">{{ selectedBucketForBulkLabel }}</span>
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
                  v-for="bucket in availableBuckets"
                  :key="bucket.type"
                  :value="bucket.type"
                  v-slot="{ active, selected }"
                  as="template"
                >
                  <li
                    :class="[
                      active ? 'bg-accent/20 text-accent' : 'text-gray-300',
                      'relative cursor-default select-none py-2 pl-10 pr-4',
                    ]"
                  >
                    <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                      {{ bucket.label }}
                    </span>
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent"
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

      <!-- Adjustment Type -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1">Adjustment</label>
        <Listbox v-model="bulkAdjustment.adjustmentType" as="div">
          <div class="relative">
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
              :disabled="store.operationInProgress"
            >
              <span class="block truncate text-white">{{
                getAdjustmentTypeLabel(bulkAdjustment.adjustmentType)
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
                      active ? 'bg-accent/20 text-accent' : 'text-gray-300',
                      'relative cursor-default select-none py-2 pl-10 pr-4',
                    ]"
                  >
                    <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                      {{ option.label }}
                    </span>
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent"
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
        <Listbox v-model="bulkAdjustment.adjustmentValueType" as="div">
          <div class="relative">
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
              :disabled="store.operationInProgress"
            >
              <span class="block truncate text-white">{{
                getAdjustmentValueTypeLabel(bulkAdjustment.adjustmentValueType)
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
                      active ? 'bg-accent/20 text-accent' : 'text-gray-300',
                      'relative cursor-default select-none py-2 pl-10 pr-4',
                    ]"
                  >
                    <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                      {{ option.label }}
                    </span>
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent"
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
          v-model.number="bulkAdjustment.adjustmentValue"
          type="number"
          min="0"
          step="any"
          placeholder="Enter value..."
          class="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2 focus:ring-accent focus:border-accent"
          :disabled="store.operationInProgress"
        />
      </div>

      <!-- Apply Button -->
      <div class="flex items-end">
        <BaseButton
          variant="primary"
          size="standard"
          class="w-full"
          :disabled="!canApplyBulkAdjustment || store.operationInProgress"
          :loading="isApplyingBulkAdjustment"
          @click="handleApplyBulkAdjustment"
        >
          Apply to {{ previewData.eligibleDestinations }} destinations
        </BaseButton>
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

    <!-- Preview Section -->
    <div v-if="previewData.eligibleDestinations > 0" class="mt-4 p-3 bg-gray-800/50 rounded-lg">
      <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span>Preview (showing first 5 destinations):</span>
        <span v-if="previewData.excludedDestinations.length > 0" class="text-amber-400">
          {{ previewData.excludedDestinations.length }} destinations excluded (already adjusted)
        </span>
      </div>
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
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
  import { ChevronUpDownIcon, ExclamationTriangleIcon, CheckIcon } from '@heroicons/vue/24/outline';
  import { useAzRateSheetStore } from '@/stores/az-rate-sheet-store';
  import {
    RATE_BUCKETS,
    classifyRateIntoBucket,
    isRateInBucket,
    formatRate,
    calculateAdjustedRate,
  } from '@/constants/rate-buckets';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import type { BucketBulkAdjustment, RateBucketType } from '@/types/domains/rate-sheet-types';

  const store = useAzRateSheetStore();

  // State
  const bulkAdjustment = ref<Partial<BucketBulkAdjustment>>({
    bucketType: '0.000000-0.015000',
    adjustmentType: 'markup',
    adjustmentValueType: 'percentage',
    adjustmentValue: 0,
    affectedDestinations: [],
    excludedDestinations: [],
  });

  const isApplyingBulkAdjustment = ref(false);
  const lastError = ref<string | null>(null);

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
  const canShowBucketAdjustments = computed(() => store.canUseBucketAdjustments);

  const availableBuckets = computed(() => {
    // Exclude 'all' bucket for bulk adjustments
    return RATE_BUCKETS.filter((bucket) => bucket.type !== 'all');
  });

  const selectedBucketForBulkLabel = computed(() => {
    const bucket = availableBuckets.value.find((b) => b.type === bulkAdjustment.value.bucketType);
    return bucket?.label || 'Select Bucket';
  });

  const previewData = computed(() => {
    if (
      !bulkAdjustment.value.bucketType ||
      !bulkAdjustment.value.adjustmentValue ||
      bulkAdjustment.value.adjustmentValue <= 0
    ) {
      return {
        totalDestinations: 0,
        eligibleDestinations: 0,
        estimatedNewRates: [],
        excludedDestinations: [],
      };
    }

    const allDestinations = store.groupedData.filter((group) => !group.hasDiscrepancy);
    const bucketDestinations = allDestinations.filter((group) => {
      const rate = group.rates[0]?.rate || 0;
      return isRateInBucket(rate, bulkAdjustment.value.bucketType!);
    });

    const eligibleDestinations = bucketDestinations.filter(
      (group) => !store.isDestinationExcluded(group.destinationName)
    );

    const excludedDestinations = bucketDestinations.filter((group) =>
      store.isDestinationExcluded(group.destinationName)
    );

    const estimatedNewRates = eligibleDestinations.map((group) => {
      const currentRate = group.rates[0]?.rate || 0;
      const newRate = calculateAdjustedRate(
        currentRate,
        bulkAdjustment.value.adjustmentType!,
        bulkAdjustment.value.adjustmentValue!,
        bulkAdjustment.value.adjustmentValueType!
      );

      return {
        destinationName: group.destinationName,
        newRate,
      };
    });

    return {
      totalDestinations: bucketDestinations.length,
      eligibleDestinations: eligibleDestinations.length,
      estimatedNewRates,
      excludedDestinations: excludedDestinations.map((g) => g.destinationName),
    };
  });

  const eligibleDestinationsCount = computed(() => previewData.value.eligibleDestinations);

  const canApplyBulkAdjustment = computed(() => {
    return (
      bulkAdjustment.value.bucketType &&
      bulkAdjustment.value.adjustmentValue &&
      bulkAdjustment.value.adjustmentValue > 0 &&
      previewData.value.eligibleDestinations > 0
    );
  });

  // Methods
  function getCurrentRate(destinationName: string): number {
    const group = store.groupedData.find((g) => g.destinationName === destinationName);
    return group?.rates[0]?.rate || 0;
  }

  function getAdjustmentTypeLabel(value: string | undefined): string {
    return adjustmentTypeOptions.find((opt) => opt.value === value)?.label || 'Select Type';
  }

  function getAdjustmentValueTypeLabel(value: string | undefined): string {
    return adjustmentValueTypeOptions.find((opt) => opt.value === value)?.label || 'Select Unit';
  }

  async function handleApplyBulkAdjustment() {
    if (!canApplyBulkAdjustment.value) return;

    if (
      !confirm(
        `Apply ${bulkAdjustment.value.adjustmentType} of ${bulkAdjustment.value.adjustmentValue}${
          bulkAdjustment.value.adjustmentValueType === 'percentage' ? '%' : '$'
        } to ${previewData.value.eligibleDestinations} destinations?`
      )
    ) {
      return;
    }

    isApplyingBulkAdjustment.value = true;
    store.setOperationInProgress(true);
    lastError.value = null;

    try {
      // Store original state for rollback
      const originalStates = previewData.value.estimatedNewRates.map((item) => ({
        destinationName: item.destinationName,
        originalRate: getCurrentRate(item.destinationName),
      }));

      // Apply adjustments to all eligible destinations
      const updates = previewData.value.estimatedNewRates.map((item) => ({
        name: item.destinationName,
        rate: item.newRate,
      }));

      const success = await store.bulkUpdateDestinationRates(updates);

      if (!success) {
        throw new Error('Bulk update operation failed');
      }

      // Add each adjustment to memory
      for (const item of previewData.value.estimatedNewRates) {
        const originalRate =
          originalStates.find((s) => s.destinationName === item.destinationName)?.originalRate || 0;
        const group = store.groupedData.find((g) => g.destinationName === item.destinationName);

        if (group) {
          store.addAdjustmentToMemory({
            destinationName: item.destinationName,
            originalRate,
            adjustedRate: item.newRate,
            adjustmentType: bulkAdjustment.value.adjustmentType!,
            adjustmentValue: bulkAdjustment.value.adjustmentValue!,
            adjustmentValueType: bulkAdjustment.value.adjustmentValueType!,
            timestamp: new Date().toISOString(),
            codes: group.codes,
            bucketCategory: classifyRateIntoBucket(originalRate),
            method: 'bucket',
          });
        }
      }

      // Reset form
      bulkAdjustment.value.adjustmentValue = 0;
    } catch (error) {
      console.error('Failed to apply bulk adjustment:', error);
      lastError.value = `Bulk adjustment failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }. All changes have been rolled back.`;

      // Rollback is handled automatically by the store's error handling
    } finally {
      isApplyingBulkAdjustment.value = false;
      store.setOperationInProgress(false);
    }
  }
</script>
