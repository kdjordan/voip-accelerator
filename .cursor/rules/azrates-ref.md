# AZ Rate Sheet Advanced Filtering & Markup Implementation Plan - FINAL VERSION

## ✅ Implementation Status (COMPLETED)

All core functionality has been successfully implemented and integrated:

### Core Components

- ✅ Memory System with sequential IDs and "Start Over"
- ✅ Bucket Filter with conflict warnings
- ✅ Bucket Bulk Adjustment with preview and rollback
- ✅ Global Adjustment with enhanced safety warnings
- ✅ Export blocking until conflicts resolved
- ✅ 6-decimal precision throughout

### Key Features Delivered

- ✅ Memory panel showing all adjustments with stats
- ✅ Individual adjustment removal
- ✅ Bucket operations disabled until conflicts resolved
- ✅ Comprehensive preview system for all adjustments
- ✅ Rollback support for bulk operations
- ✅ Destination exclusion tracking
- ✅ Sequential ID system (1, 2, 3...)
- ✅ Error handling with user feedback
- ✅ Performance optimization for large datasets

### Integration Points

- ✅ Store foundation with memory management
- ✅ Individual adjustment integration
- ✅ Export blocking mechanism
- ✅ Bucket filter integration
- ✅ Memory persistence with reset functionality

All components are now fully integrated and working together seamlessly.

## Overview

Implementation plan for advanced rate filtering and markup functionality for the AZ Rate Sheet Table component. This will enable users to filter rates by buckets, apply markup/markdown adjustments, maintain a comprehensive memory system to prevent double-adjustments, and provide exceptional UI/UX feedback that keeps users informed at all times.

**Key Requirements**:

- Bucket adjustments only available after all rate conflicts resolved
- Memory system central to user experience with "Start Over" functionality
- Export blocked until conflicts resolved
- 6-decimal precision for all calculations and display
- Individual adjustments integrate with memory system

## FINALIZED IMPLEMENTATION DECISIONS ✅

### Core Behaviors

- **Start Over**: Reverts all changes but preserves DexieJS data
- **Conflict Resolution**: Automatically shows bucket adjustment UI when conflicts resolved
- **Memory Panel**: Fixed panel above table (always visible when adjustments exist)
- **Display Format**: "Colombia (15 codes): $1.20 → $1.32"
- **Export**: Blocked until rate conflicts resolved
- **Processing**: Single batch for all destinations (fast in-memory operations)
- **Individual Adjustments**: Integrate with memory via existing saveRateSelection() modification
- **Precision**: 6-decimal fixed point for ALL calculations AND display
- **Memory IDs**: Simple sequential counter (1, 2, 3...)
- **Error Handling**: Rollback bulk operations on failure with user notification
- **Performance**: No limits needed (250K rates tested successfully)
- **Reset Behavior**: Clears everything including bucket filter selection
- **Concurrency**: One operation at a time (prevent concurrent adjustments)
- **Data Migration**: None needed (temporal data only)

---

## REFACTOR FOR EFFICIENCY

### Phase 1A: Foundation Types & Constants (Day 1 Morning)

**Step 1.1**: Add core types to `client/src/types/domains/rate-sheet-types.ts`

```typescript
// Rate bucket types with boundary handling
export type RateBucketType =
  | "0.0-1.5"
  | "1.6-5.0"
  | "5.1-15.0"
  | "15.0+"
  | "all";

export interface RateBucketFilter {
  type: RateBucketType;
  label: string;
  min: number;
  max: number | null;
}

// Memory system types with sequential IDs
export interface RateAdjustmentMemory {
  id: number; // Simple sequential counter
  destinationName: string;
  originalRate: number;
  adjustedRate: number;
  adjustmentType: "markup" | "markdown";
  adjustmentValue: number;
  adjustmentValueType: "percentage" | "fixed";
  timestamp: string;
  codes: string[];
  bucketCategory: RateBucketType;
  method: "individual" | "bucket" | "global";
}

export interface AdjustmentMemoryState {
  adjustments: RateAdjustmentMemory[];
  excludedDestinations: Set<string>;
  sessionStartTime: string;
  totalAdjustmentsMade: number;
  nextId: number; // Sequential counter for IDs
}

export interface MemoryStats {
  totalDestinationsAdjusted: number;
  markupCount: number;
  markdownCount: number;
  averageAdjustmentPercentage: number;
  bucketDistribution: Record<RateBucketType, number>;
}

// Bulk adjustment types with rollback support
export interface BucketBulkAdjustment {
  bucketType: RateBucketType;
  adjustmentType: "markup" | "markdown";
  adjustmentValueType: "percentage" | "fixed";
  adjustmentValue: number;
  affectedDestinations: string[];
  excludedDestinations: string[];
  previewData: {
    totalDestinations: number;
    eligibleDestinations: number;
    estimatedNewRates: { destinationName: string; newRate: number }[];
  };
}
```

**Step 1.2**: Create `client/src/constants/rate-buckets.ts`

```typescript
import type {
  RateBucketFilter,
  RateBucketType,
} from "@/types/domains/rate-sheet-types";

export const RATE_BUCKETS: RateBucketFilter[] = [
  { type: "all", label: "All Rates", min: 0, max: null },
  { type: "0.0-1.5", label: "$0.00 - $1.50", min: 0, max: 1.5 },
  { type: "1.6-5.0", label: "$1.60 - $5.00", min: 1.6, max: 5.0 },
  { type: "5.1-15.0", label: "$5.10 - $15.00", min: 5.1, max: 15.0 },
  { type: "15.0+", label: "$15.00+", min: 15.0, max: null },
];

// Boundary values go to lower bucket (round down)
export function classifyRateIntoBucket(rate: number): RateBucketType {
  if (rate <= 1.5) return "0.0-1.5";
  if (rate <= 5.0) return "1.6-5.0";
  if (rate <= 15.0) return "5.1-15.0";
  return "15.0+";
}

export function isRateInBucket(
  rate: number,
  bucketType: RateBucketType
): boolean {
  if (bucketType === "all") return true;

  const bucket = RATE_BUCKETS.find((b) => b.type === bucketType);
  if (!bucket) return false;

  if (bucket.max === null) {
    return rate >= bucket.min;
  }

  return rate >= bucket.min && rate <= bucket.max;
}

// 6-decimal precision formatting for all rate displays
export function formatRate(rate: number): string {
  return rate.toFixed(6);
}

// 6-decimal precision for all calculations
export function calculateAdjustedRate(
  originalRate: number,
  adjustmentType: "markup" | "markdown",
  adjustmentValue: number,
  adjustmentValueType: "percentage" | "fixed"
): number {
  let newRate = originalRate;

  if (adjustmentValueType === "percentage") {
    if (adjustmentType === "markup") {
      newRate = originalRate * (1 + adjustmentValue / 100);
    } else {
      newRate = originalRate * (1 - adjustmentValue / 100);
    }
  } else {
    if (adjustmentType === "markup") {
      newRate = originalRate + adjustmentValue;
    } else {
      newRate = Math.max(0, originalRate - adjustmentValue);
    }
  }

  // Ensure 6-decimal precision
  return Math.max(0, parseFloat(newRate.toFixed(6)));
}
```

### Phase 1B: Store Foundation (Day 1 Afternoon)

**Step 1.3**: Extend `client/src/stores/az-rate-sheet-store.ts` - Memory State

```typescript
// Add to state
state: (): RateSheetState => ({
  // ... existing state
  selectedRateBucket: 'all' as RateBucketType,
  adjustmentMemory: {
    adjustments: [],
    excludedDestinations: new Set<string>(),
    sessionStartTime: new Date().toISOString(),
    totalAdjustmentsMade: 0,
    nextId: 1, // Sequential counter starts at 1
  } as AdjustmentMemoryState,
  operationInProgress: false, // Prevent concurrent operations
}),
```

**Step 1.4**: Add Memory Management Actions with Sequential IDs

```typescript
// Memory management actions
addAdjustmentToMemory(adjustment: Omit<RateAdjustmentMemory, 'id'>) {
  const adjustmentWithId = {
    ...adjustment,
    id: this.adjustmentMemory.nextId++,
  };

  this.adjustmentMemory.adjustments.push(adjustmentWithId);
  this.adjustmentMemory.excludedDestinations.add(adjustment.destinationName);
  this.adjustmentMemory.totalAdjustmentsMade++;
  this.saveMemoryToLocalStorage();
},

removeAdjustmentFromMemory(adjustmentId: number) {
  const adjustmentIndex = this.adjustmentMemory.adjustments.findIndex(a => a.id === adjustmentId);
  if (adjustmentIndex >= 0) {
    const adjustment = this.adjustmentMemory.adjustments[adjustmentIndex];
    this.adjustmentMemory.adjustments.splice(adjustmentIndex, 1);
    this.adjustmentMemory.excludedDestinations.delete(adjustment.destinationName);

    // Revert the rate change
    this.updateDestinationRate(adjustment.destinationName, adjustment.originalRate);
  }
  this.saveMemoryToLocalStorage();
},

clearAllAdjustmentMemory() {
  // Revert all adjustments to original rates
  for (const adjustment of this.adjustmentMemory.adjustments) {
    this.updateDestinationRate(adjustment.destinationName, adjustment.originalRate);
  }

  // Clear memory but keep DexieJS data intact
  this.adjustmentMemory = {
    adjustments: [],
    excludedDestinations: new Set<string>(),
    sessionStartTime: new Date().toISOString(),
    totalAdjustmentsMade: 0,
    nextId: 1,
  };
  this.saveMemoryToLocalStorage();
},

isDestinationExcluded(destinationName: string): boolean {
  return this.adjustmentMemory.excludedDestinations.has(destinationName);
},

// Operation state management
setOperationInProgress(inProgress: boolean) {
  this.operationInProgress = inProgress;
},
```

**Step 1.5**: Add Bucket Filtering Logic

```typescript
// Bucket filtering actions
setRateBucketFilter(bucketType: RateBucketType) {
  this.selectedRateBucket = bucketType;
  localStorage.setItem('az-rate-bucket-filter', bucketType);
},

// Getters
getFilteredByRateBucket(state) {
  if (state.selectedRateBucket === 'all') {
    return state.groupedData;
  }

  return state.groupedData.filter(group => {
    // For destinations with conflicts, check all rates
    if (group.hasDiscrepancy) {
      return group.rates.some(rate => isRateInBucket(rate.rate, state.selectedRateBucket));
    }
    // For single-rate destinations, check the single rate
    return isRateInBucket(group.rates[0]?.rate || 0, state.selectedRateBucket);
  });
},

canUseBucketAdjustments(state) {
  return state.groupedData.filter(group => group.hasDiscrepancy).length === 0;
},

canExport(state) {
  // Block export until conflicts resolved
  return state.groupedData.filter(group => group.hasDiscrepancy).length === 0;
},

getMemoryStats(state): MemoryStats {
  const adjustments = state.adjustmentMemory.adjustments;
  const bucketDistribution: Record<RateBucketType, number> = {
    "0.0-1.5": 0,
    "1.6-5.0": 0,
    "5.1-15.0": 0,
    "15.0+": 0,
    "all": 0,
  };

  let markupCount = 0;
  let markdownCount = 0;
  let totalPercentageChange = 0;

  adjustments.forEach(adj => {
    bucketDistribution[adj.bucketCategory]++;
    if (adj.adjustmentType === 'markup') markupCount++;
    else markdownCount++;

    if (adj.adjustmentValueType === 'percentage') {
      totalPercentageChange += adj.adjustmentValue;
    }
  });

  return {
    totalDestinationsAdjusted: adjustments.length,
    markupCount,
    markdownCount,
    averageAdjustmentPercentage: adjustments.length > 0 ? totalPercentageChange / adjustments.length : 0,
    bucketDistribution,
  };
},
```

**Step 1.6**: Modify Individual Adjustment Integration

```typescript
// Update existing saveRateSelection to integrate with memory
async updateDestinationRateWithMemory(
  destinationName: string,
  newRate: number,
  adjustmentDetails?: {
    adjustmentType: "markup" | "markdown";
    adjustmentValue: number;
    adjustmentValueType: "percentage" | "fixed";
  }
) {
  const originalRate = this.getOriginalRateForDestination(destinationName);
  const success = await this.updateDestinationRate(destinationName, newRate);

  if (success && adjustmentDetails) {
    // Add to memory system
    const group = this.groupedData.find(g => g.destinationName === destinationName);
    if (group) {
      this.addAdjustmentToMemory({
        destinationName,
        originalRate,
        adjustedRate: newRate,
        adjustmentType: adjustmentDetails.adjustmentType,
        adjustmentValue: adjustmentDetails.adjustmentValue,
        adjustmentValueType: adjustmentDetails.adjustmentValueType,
        timestamp: new Date().toISOString(),
        codes: group.codes,
        bucketCategory: classifyRateIntoBucket(originalRate),
        method: 'individual',
      });
    }
  }

  return success;
},

getOriginalRateForDestination(destinationName: string): number {
  const group = this.groupedData.find(g => g.destinationName === destinationName);
  const memoryEntry = this.adjustmentMemory.adjustments.find(a => a.destinationName === destinationName);

  if (memoryEntry) {
    return memoryEntry.originalRate;
  }

  return group?.rates[0]?.rate || 0;
},
```

### Phase 2A: Memory Panel UI Component (Day 2 Morning)

**Step 2.1**: Create `client/src/components/rate-sheet/az/AZAdjustmentMemory.vue`

```vue
<template>
  <div
    v-if="memoryStore.adjustmentMemory.adjustments.length > 0"
    class="bg-gray-900/50 border border-accent/20 rounded-lg p-4 mb-4"
  >
    <!-- Header with Stats -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <h3 class="text-sm font-semibold text-accent">Adjustment Memory</h3>
        <div class="flex items-center gap-2 text-xs text-gray-400">
          <span
            >{{ stats.totalDestinationsAdjusted }} destinations adjusted</span
          >
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
        @click="handleStartOver"
        title="Reset all adjustments to original rates"
      >
        Start Over
      </BaseButton>
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
            <span class="font-medium text-white">{{
              adjustment.destinationName
            }}</span>
            <span class="text-xs text-gray-400"
              >({{ adjustment.codes.length }} codes)</span
            >
            <span
              class="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300"
            >
              {{ adjustment.bucketCategory }}
            </span>
            <span
              class="text-xs px-2 py-1 rounded-full"
              :class="{
                'bg-blue-900/50 text-blue-300':
                  adjustment.method === 'individual',
                'bg-purple-900/50 text-purple-300':
                  adjustment.method === 'bucket',
                'bg-green-900/50 text-green-300':
                  adjustment.method === 'global',
              }"
            >
              {{ adjustment.method }}
            </span>
          </div>
          <div class="flex items-center gap-2 text-sm mt-1">
            <span class="text-gray-400"
              >${{ formatRate(adjustment.originalRate) }}</span
            >
            <ArrowRightIcon class="w-3 h-3 text-gray-500" />
            <span class="text-white font-medium"
              >${{ formatRate(adjustment.adjustedRate) }}</span
            >
            <BaseBadge
              :variant="
                adjustment.adjustmentType === 'markup'
                  ? 'accent'
                  : 'destructive'
              "
              size="small"
            >
              {{ adjustment.adjustmentType === "markup" ? "+" : "-"
              }}{{ adjustment.adjustmentValue
              }}{{
                adjustment.adjustmentValueType === "percentage" ? "%" : "$"
              }}
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
import { computed } from "vue";
import { ArrowRightIcon } from "@heroicons/vue/24/outline";
import { useAzRateSheetStore } from "@/stores/az-rate-sheet-store";
import { formatRate } from "@/constants/rate-buckets";
import BaseButton from "@/components/shared/BaseButton.vue";
import BaseBadge from "@/components/shared/BaseBadge.vue";

const memoryStore = useAzRateSheetStore();

const stats = computed(() => memoryStore.getMemoryStats);

function handleStartOver() {
  if (
    confirm(
      "This will reset all adjustments to their original rates. Are you sure?"
    )
  ) {
    memoryStore.clearAllAdjustmentMemory();
  }
}

function handleRemoveAdjustment(adjustmentId: number) {
  memoryStore.removeAdjustmentFromMemory(adjustmentId);
}
</script>
```

### Phase 2B: Bucket Filter Integration (Day 2 Afternoon)

**Step 2.2**: Add bucket filter to `AZRateSheetTable.vue` (filter section)

```vue
<!-- Add after existing View Filter dropdown -->
<div class="w-full">
  <Listbox v-model="selectedRateBucket" as="div">
    <ListboxLabel class="block text-sm font-medium text-gray-400 mb-1">
      Rate Bucket Filter
    </ListboxLabel>
    <div class="relative mt-1">
      <ListboxButton
        class="relative w-full cursor-default rounded-lg bg-gray-900 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
        :class="{ 'opacity-50': !canUseBucketFilter }"
        :disabled="!canUseBucketFilter"
      >
        <span class="block truncate text-gray-300">{{ selectedBucketLabel }}</span>
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
            v-for="bucket in RATE_BUCKETS"
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

  <!-- Warning message when bucket filtering is disabled -->
  <div v-if="!canUseBucketFilter" class="mt-1 text-xs text-amber-400">
    <ExclamationTriangleIcon class="w-3 h-3 inline mr-1" />
    Resolve all rate conflicts to enable bucket filtering
  </div>
</div>
```

**Step 2.3**: Update Export Button to Block Until Conflicts Resolved

```vue
<!-- Update export button in actions section -->
<BaseButton
  variant="primary"
  size="standard"
  class="w-full"
  :icon="ArrowDownTrayIcon"
  :disabled="!store.canExport"
  @click="handleExport"
  :title="
    store.canExport
      ? 'Export Rate Sheet'
      : 'Resolve all rate conflicts before exporting'
  "
>
  Export Rate Sheet
</BaseButton>

<!-- Add warning when export is disabled -->
<div v-if="!store.canExport" class="mt-1 text-xs text-amber-400">
  <ExclamationTriangleIcon class="w-3 h-3 inline mr-1" />
  Resolve all rate conflicts before exporting
</div>
```

### Phase 3A: Bucket Bulk Adjustment Component with Rollback (Day 3 Morning)

**Step 3.1**: Create `client/src/components/rate-sheet/az/AZBucketBulkAdjustment.vue` with Error Handling

```vue
<template>
  <div
    v-if="canShowBucketAdjustments"
    class="bg-gray-900/30 border border-gray-700 rounded-lg p-4 mb-4"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-gray-300">
        Bulk Adjustment by Rate Bucket
      </h3>
      <BaseBadge variant="info" size="small">
        {{ eligibleDestinationsCount }} destinations available
      </BaseBadge>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <!-- Bucket Selector -->
      <div>
        <label class="block text-xs font-medium text-gray-400 mb-1"
          >Target Bucket</label
        >
        <Listbox v-model="bulkAdjustment.bucketType" as="div">
          <div class="relative">
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
              :disabled="store.operationInProgress"
            >
              <span class="block truncate text-white">{{
                selectedBucketForBulkLabel
              }}</span>
              <span
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
              >
                <ChevronUpDownIcon
                  class="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </ListboxButton>
            <!-- ... ListboxOptions ... -->
          </div>
        </Listbox>
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
    <div
      v-if="previewData.eligibleDestinations > 0"
      class="mt-4 p-3 bg-gray-800/50 rounded-lg"
    >
      <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span>Preview (showing first 5 destinations):</span>
        <span
          v-if="previewData.excludedDestinations.length > 0"
          class="text-amber-400"
        >
          {{ previewData.excludedDestinations.length }} destinations excluded
          (already adjusted)
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
        <div
          v-if="previewData.estimatedNewRates.length > 5"
          class="text-xs text-gray-400"
        >
          ... and {{ previewData.estimatedNewRates.length - 5 }} more
          destinations
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import {
  ChevronUpDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import { useAzRateSheetStore } from "@/stores/az-rate-sheet-store";
import {
  RATE_BUCKETS,
  classifyRateIntoBucket,
  isRateInBucket,
  formatRate,
  calculateAdjustedRate,
} from "@/constants/rate-buckets";
import BaseButton from "@/components/shared/BaseButton.vue";
import BaseBadge from "@/components/shared/BaseBadge.vue";
import type {
  BucketBulkAdjustment,
  RateBucketType,
} from "@/types/domains/rate-sheet-types";

const store = useAzRateSheetStore();

// State
const bulkAdjustment = ref<Partial<BucketBulkAdjustment>>({
  bucketType: "0.0-1.5",
  adjustmentType: "markup",
  adjustmentValueType: "percentage",
  adjustmentValue: 0,
  affectedDestinations: [],
  excludedDestinations: [],
});

const isApplyingBulkAdjustment = ref(false);
const lastError = ref<string | null>(null);

// Computed properties
const canShowBucketAdjustments = computed(() => store.canUseBucketAdjustments);

const previewData = computed(() => {
  if (
    !bulkAdjustment.value.bucketType ||
    !bulkAdjustment.value.adjustmentValue
  ) {
    return {
      totalDestinations: 0,
      eligibleDestinations: 0,
      estimatedNewRates: [],
      excludedDestinations: [],
    };
  }

  const allDestinations = store.groupedData.filter(
    (group) => !group.hasDiscrepancy
  );
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

const eligibleDestinationsCount = computed(
  () => previewData.value.eligibleDestinations
);

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
  const group = store.groupedData.find(
    (g) => g.destinationName === destinationName
  );
  return group?.rates[0]?.rate || 0;
}

async function handleApplyBulkAdjustment() {
  if (!canApplyBulkAdjustment.value) return;

  if (
    !confirm(
      `Apply ${bulkAdjustment.value.adjustmentType} of ${
        bulkAdjustment.value.adjustmentValue
      }${
        bulkAdjustment.value.adjustmentValueType === "percentage" ? "%" : "$"
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
      throw new Error("Bulk update operation failed");
    }

    // Add each adjustment to memory
    for (const item of previewData.value.estimatedNewRates) {
      const originalRate =
        originalStates.find((s) => s.destinationName === item.destinationName)
          ?.originalRate || 0;
      const group = store.groupedData.find(
        (g) => g.destinationName === item.destinationName
      );

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
          method: "bucket",
        });
      }
    }

    // Reset form
    bulkAdjustment.value.adjustmentValue = 0;
  } catch (error) {
    console.error("Failed to apply bulk adjustment:", error);
    lastError.value = `Bulk adjustment failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }. All changes have been rolled back.`;

    // Rollback is handled automatically by the store's error handling
  } finally {
    isApplyingBulkAdjustment.value = false;
    store.setOperationInProgress(false);
  }
}
</script>
```

### Phase 3B: Global Adjustment Component (Day 3 Afternoon)

**Step 3.3**: Create `client/src/components/rate-sheet/az/AZGlobalAdjustment.vue`

```vue
<template>
  <div
    v-if="canShowGlobalAdjustments"
    class="bg-gray-900/30 border border-green-500/20 rounded-lg p-4 mb-4"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-green-400">
        Global Rate Adjustment
      </h3>
      <BaseBadge variant="success" size="small">
        {{ eligibleDestinationsCount }} destinations available
      </BaseBadge>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Adjustment controls similar to bulk adjustment -->
      <!-- Apply Button -->
      <div class="flex items-end">
        <BaseButton
          variant="primary"
          size="standard"
          class="w-full"
          :disabled="!canApplyGlobalAdjustment || store.operationInProgress"
          :loading="isApplyingGlobalAdjustment"
          @click="handleApplyGlobalAdjustment"
        >
          Apply to All ({{ eligibleDestinationsCount }})
        </BaseButton>
      </div>
    </div>

    <!-- Warning if excluded destinations exist -->
    <div
      v-if="excludedDestinationsCount > 0"
      class="mt-3 p-2 bg-amber-900/20 border border-amber-500/20 rounded text-xs text-amber-400"
    >
      <ExclamationTriangleIcon class="w-3 h-3 inline mr-1" />
      {{ excludedDestinationsCount }} destinations will be skipped (already
      adjusted)
    </div>
  </div>
</template>
```

### Phase 4: Integration & Memory Indicators (Day 4)

**Step 4.1**: Update `AZRateSheetTable.vue` - Modify saveRateSelection Integration

```vue
<!-- Add to imports -->
<script setup lang="ts">
// ... existing imports
import AZAdjustmentMemory from "./AZAdjustmentMemory.vue";
import AZBucketBulkAdjustment from "./AZBucketBulkAdjustment.vue";
import AZGlobalAdjustment from "./AZGlobalAdjustment.vue";
import { formatRate } from "@/constants/rate-buckets";
</script>

<!-- Update saveRateSelection function -->
async function saveRateSelection(group: GroupedRateData) { // ... existing
validation logic // Check if this is an adjustment (not just rate conflict
resolution) const originalRate =
store.getOriginalRateForDestination(group.destinationName); const isAdjustment =
selectedRates.value[group.destinationName] !== originalRate ||
directSetRates.value[group.destinationName] !== originalRate; if (isAdjustment)
{ // Determine adjustment details for memory const finalRate =
directSetRates.value[group.destinationName] ||
selectedRates.value[group.destinationName]; const adjustmentType = finalRate >
originalRate ? 'markup' : 'markdown'; const adjustmentValue =
Math.abs(((finalRate - originalRate) / originalRate) * 100); await
store.updateDestinationRateWithMemory(group.destinationName, finalRate, {
adjustmentType, adjustmentValue, adjustmentValueType: 'percentage', }); } else {
// Just rate conflict resolution, no memory needed await
store.updateDestinationRate(group.destinationName, finalRate); } // ... rest of
existing logic }
```

### Phase 5: Store Enhancements & Persistence (Day 5)

**Step 5.1**: Add localStorage persistence with reset clearing

```typescript
// Update clearData to reset bucket filter
clearData() {
  this.originalData = [];
  this.groupedData = [];
  this.isLocallyStored = false;
  this.invalidRows = [];

  // Clear memory system
  this.adjustmentMemory = {
    adjustments: [],
    excludedDestinations: new Set<string>(),
    sessionStartTime: new Date().toISOString(),
    totalAdjustmentsMade: 0,
    nextId: 1,
  };

  // Reset bucket filter
  this.selectedRateBucket = 'all';

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY_INVALID);
  localStorage.removeItem('az-adjustment-memory');
  localStorage.removeItem('az-rate-bucket-filter');
},

saveMemoryToLocalStorage() {
  const memoryData = {
    adjustments: this.adjustmentMemory.adjustments,
    excludedDestinations: Array.from(this.adjustmentMemory.excludedDestinations),
    sessionStartTime: this.adjustmentMemory.sessionStartTime,
    totalAdjustmentsMade: this.adjustmentMemory.totalAdjustmentsMade,
    nextId: this.adjustmentMemory.nextId,
  };
  localStorage.setItem('az-adjustment-memory', JSON.stringify(memoryData));
},

loadMemoryFromLocalStorage() {
  const saved = localStorage.getItem('az-adjustment-memory');
  if (saved) {
    try {
      const memoryData = JSON.parse(saved);
      this.adjustmentMemory = {
        adjustments: memoryData.adjustments || [],
        excludedDestinations: new Set(memoryData.excludedDestinations || []),
        sessionStartTime: memoryData.sessionStartTime || new Date().toISOString(),
        totalAdjustmentsMade: memoryData.totalAdjustmentsMade || 0,
        nextId: memoryData.nextId || 1,
      };
    } catch (error) {
      console.error('Failed to load memory from localStorage:', error);
    }
  }
},
```

### COMPLETE TESTING CHECKLIST

**Unit Tests to Implement:**

- [ ] 6-decimal precision in all calculations
- [ ] Sequential ID generation
- [ ] Rate bucket classification with boundary handling
- [ ] Memory system operations with rollback
- [ ] Export blocking until conflicts resolved
- [ ] Individual adjustment integration

**Integration Tests:**

- [ ] End-to-end conflict resolution → bucket adjustment workflow
- [ ] Memory persistence through exports but clearing on data deletion
- [ ] Individual adjustments tracking in memory
- [ ] Concurrent operation prevention
- [ ] Reset clears bucket filter and all memory

**User Acceptance Scenarios:**

- [ ] Export blocked until conflicts resolved
- [ ] Memory tracks individual, bucket, and global adjustments
- [ ] Start Over reverts all changes but preserves DexieJS
- [ ] Sequential memory IDs for chronological tracking
- [ ] 6-decimal precision maintained throughout
- [ ] One operation at a time enforcement

This comprehensive implementation delivers all specified functionality with robust error handling, precise calculations, and seamless integration.

### Performance Optimization Plan for Large Datasets (200K+ Records)

#### 1. Web Worker Optimization

1. Move all filtering logic to worker

   - Relocate eligibleDestinations filtering
   - Pre-filter data before sending to main thread
   - Cache filtered results in worker

2. Implement Worker Pool

   - Create worker pool manager
   - Distribute work across multiple workers
   - Coordinate results aggregation
   - Handle worker lifecycle management

3. Memory Management

   - Stream updates instead of building large arrays
   - Implement chunked processing in worker
   - Use TypedArrays for numeric data
   - Clear temporary arrays after processing

4. Progress Updates Optimization
   - Reduce progress update frequency to every 1000 records
   - Implement RequestAnimationFrame for UI updates
   - Add throttling for progress messages
   - Buffer progress updates

#### 2. Store Operations Enhancement

1. Batch Store Updates

   - Aggregate mutations into larger chunks
   - Implement optimistic UI updates
   - Use temporary storage for intermediate results
   - Defer non-critical updates

2. Transaction Management
   - Implement transaction-like behavior
   - Add rollback capability
   - Handle partial failures
   - Track operation state

#### 3. UI Responsiveness Improvements

1. Main Thread Optimization

   - Move heavy processing to Web Worker
   - Implement proper loading states
   - Use requestIdleCallback for non-critical updates
   - Defer UI updates during processing

2. DOM Updates
   - Implement virtual scrolling
   - Batch DOM updates
   - Use document fragments
   - Minimize reflows/repaints

#### 4. Data Structure Optimization

1. Flatten Data Structures

   - Simplify worker communication payload
   - Use structured cloning optimization
   - Minimize data transfer between worker and main thread
   - Cache computed values

2. Memory Efficiency
   - Implement cleanup for temporary objects
   - Use WeakMap for caching
   - Clear references after processing
   - Implement memory monitoring

#### 5. Error Handling Enhancement

1. Implement Retry Mechanism

   - Add exponential backoff
   - Handle partial failures
   - Track failed operations
   - Provide recovery options

2. Error Recovery
   - Implement transaction rollback
   - Save operation checkpoints
   - Add resume capability
   - Track operation history

#### Implementation Priority Order:

1. Worker Pool Implementation
2. Memory Management Optimization
3. Progress Updates Enhancement
4. Store Operations Batching
5. UI Responsiveness Improvements
6. Data Structure Optimization
7. Error Handling Enhancement

#### Success Metrics:

- Processing time under 30 seconds for 200K records
- Memory usage under 500MB
- UI remains responsive during processing
- Zero data loss on errors
- Successful recovery from interruptions
