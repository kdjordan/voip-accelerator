<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <!-- Averages Section -->
    <div class="mb-6">
      <h4 class="text-xs font-medium text-gray-400 uppercase mb-3">Rate Averages</h4>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Interstate Average -->
        <div class="bg-gray-800/60 p-3 rounded-lg text-center">
          <p class="text-sm text-gray-400 mb-1">Inter Avg</p>
          <p
            v-if="isCalculatingOverall || isCalculatingState"
            class="text-lg font-semibold text-gray-500 italic"
          >
            Loading...
          </p>
          <p v-else class="text-lg font-semibold text-white font-mono">
            {{ formatRate(currentDisplayAverages.inter) }}
          </p>
        </div>
        <!-- Intrastate Average -->
        <div class="bg-gray-800/60 p-3 rounded-lg text-center">
          <p class="text-sm text-gray-400 mb-1">Intra Avg</p>
          <p
            v-if="isCalculatingOverall || isCalculatingState"
            class="text-lg font-semibold text-gray-500 italic"
          >
            Loading...
          </p>
          <p v-else class="text-lg font-semibold text-white font-mono">
            {{ formatRate(currentDisplayAverages.intra) }}
          </p>
        </div>
        <!-- Indeterminate Average -->
        <div class="bg-gray-800/60 p-3 rounded-lg text-center">
          <p class="text-sm text-gray-400 mb-1">Indeterm Avg</p>
          <p
            v-if="isCalculatingOverall || isCalculatingState"
            class="text-lg font-semibold text-gray-500 italic"
          >
            Loading...
          </p>
          <p v-else class="text-lg font-semibold text-white font-mono">
            {{ formatRate(currentDisplayAverages.ij) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Header Row -->
    <div class="mb-4 flex items-center gap-4">
      <h3 class="text-sm font-medium text-gray-300">Table Controls</h3>
      <span v-if="!isDataLoading" class="text-sm text-gray-400">
        Showing {{ displayedData.length }} of {{ totalRecords }} NPANXX entries
      </span>
      <span v-else class="text-sm text-gray-400">Loading data...</span>
    </div>

    <!-- Filters and Actions Row -->
    <div class="mb-4 flex flex-wrap gap-4 items-center justify-between">
      <!-- Left Side: Filters -->
      <div class="flex items-center gap-4 flex-wrap">
        <!-- Basic Search -->
        <div class="relative">
          <label for="npanxx-search" class="sr-only">Search NPANXX</label>
          <input
            id="npanxx-search"
            v-model="searchQuery"
            type="text"
            placeholder="Filter by NPANXX..."
            class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
          />
        </div>
        <!-- State Filter Dropdown -->
        <div class="relative w-52">
          <Listbox v-model="selectedState" as="div">
            <ListboxLabel class="sr-only">Filter by State/Province</ListboxLabel>
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
                :disabled="availableStates.length === 0 || isDataLoading"
              >
                <span class="block truncate text-white">{{
                  selectedState
                    ? getRegionDisplayName(selectedState) + ' (' + selectedState + ')'
                    : 'All States/Provinces'
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
                  <!-- "All States/Provinces" Option -->
                  <ListboxOption v-slot="{ active, selected }" :value="''" as="template">
                    <li
                      :class="[
                        active ? 'bg-gray-800 text-primary-400' : 'bg-gray-600 text-accent',
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                      ]"
                    >
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']"
                        >All States/Provinces</span
                      >
                      <span
                        v-if="selected"
                        class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-400"
                      >
                        <CheckIcon class="h-5 w-5" aria-hidden="true" />
                      </span>
                    </li>
                  </ListboxOption>

                  <!-- State/Province Groups -->
                  <template v-for="group in groupedAvailableStates" :key="group.label">
                    <!-- Group Label -->
                    <li class="text-gray-500 px-4 py-2 text-xs uppercase select-none">
                      {{ group.label }}
                    </li>
                    <!-- Group Options -->
                    <ListboxOption
                      v-for="regionCode in group.codes"
                      :key="regionCode"
                      :value="regionCode"
                      v-slot="{ active, selected }"
                      as="template"
                    >
                      <li
                        :class="[
                          active ? 'bg-gray-800 text-primary-400' : 'bg-gray-800 text-gray-300',
                          'relative cursor-default select-none py-2 pl-10 pr-4',
                        ]"
                      >
                        <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']"
                          >{{ getRegionDisplayName(regionCode) }} ({{ regionCode }})</span
                        >
                        <span
                          v-if="selected"
                          class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-400"
                        >
                          <CheckIcon class="h-5 w-5" aria-hidden="true" />
                        </span>
                      </li>
                    </ListboxOption>
                  </template>
                </ListboxOptions>
              </transition>
            </div>
          </Listbox>
        </div>
      </div>

      <!-- Right Side: Actions -->
      <div class="flex items-center gap-4 flex-wrap">
        <BaseButton
          variant="destructive"
          size="standard"
          :icon="TrashIcon"
          @click="handleClearData"
          title="Clear all rate sheet data"
        >
          Clear Data
        </BaseButton>
        <BaseButton
          variant="primary"
          size="standard"
          :icon="ArrowDownTrayIcon"
          :loading="isExporting"
          :disabled="totalRecords === 0 || isExporting"
          @click="handleExport"
          title="Export all loaded data"
        >
          Export All
        </BaseButton>
      </div>
    </div>

    <!-- Rate Adjustment Section -->
    <div class="bg-gray-900/50 p-4 rounded-lg mb-4">
      <h4 class="text-sm font-medium text-gray-300 mb-4">
        Apply Rate Adjustments (to Filtered Results)
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <!-- Adjustment Type -->
        <div class="relative">
          <Listbox v-model="adjustmentType" as="div">
            <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1"
              >Adjustment</ListboxLabel
            >
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
              >
                <span class="block truncate text-white">{{ selectedAdjustmentTypeLabel }}</span>
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
                        active ? 'bg-gray-700 text-primary-400' : 'text-gray-300',
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                      ]"
                    >
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{
                        option.label
                      }}</span>
                      <span
                        v-if="selected"
                        class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-400"
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
        <div class="relative">
          <Listbox v-model="adjustmentValueType" as="div">
            <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1">By</ListboxLabel>
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
              >
                <span class="block truncate text-white">{{
                  selectedAdjustmentValueTypeLabel
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
                        active ? 'bg-gray-700 text-primary-400' : 'text-gray-300',
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                      ]"
                    >
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{
                        option.label
                      }}</span>
                      <span
                        v-if="selected"
                        class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-400"
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
          <label for="adjustment-value" class="block text-xs font-medium text-gray-400 mb-1"
            >Value</label
          >
          <input
            id="adjustment-value"
            v-model.number="adjustmentValue"
            type="number"
            min="0"
            step="any"
            placeholder="Enter value..."
            class="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2.5 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <!-- Target Rate Type -->
        <div class="relative">
          <Listbox v-model="targetRateType" as="div">
            <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1"
              >Target Rate</ListboxLabel
            >
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
              >
                <span class="block truncate text-white">{{ selectedTargetRateTypeLabel }}</span>
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
                    v-for="option in targetRateTypeOptions"
                    :key="option.value"
                    :value="option.value"
                    v-slot="{ active, selected }"
                    as="template"
                  >
                    <li
                      :class="[
                        active ? 'bg-gray-700 text-primary-400' : 'text-gray-300',
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                      ]"
                    >
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{
                        option.label
                      }}</span>
                      <span
                        v-if="selected"
                        class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-400"
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

        <!-- Apply Button -->
        <div>
          <BaseButton
            variant="primary"
            size="standard"
            class="w-full"
            :icon="ArrowRightIcon"
            :loading="isApplyingAdjustment"
            :disabled="
              isApplyingAdjustment ||
              adjustmentValue === null ||
              adjustmentValue <= 0 ||
              totalRecords === 0
            "
            @click="applyRateAdjustments"
            title="Apply adjustment to all currently filtered records"
          >
            Apply
          </BaseButton>
        </div>
      </div>
      <!-- Feedback Area -->
      <div v-if="adjustmentStatusMessage || adjustmentError" class="mt-3 text-xs">
        <p v-if="adjustmentStatusMessage" class="text-green-400">{{ adjustmentStatusMessage }}</p>
        <p v-if="adjustmentError" class="text-red-400">Error: {{ adjustmentError }}</p>
      </div>
    </div>

    <!-- Table Container -->
    <div v-if="isDataLoading" class="text-center text-gray-500 py-10">
      <div
        class="flex items-center justify-center space-x-2 text-accent bg-accent/20 rounded-lg p-2 w-1/2 mx-auto border border-accent/50"
      >
        <ArrowPathIcon class="animate-spin w-6 h-6" />
        <span>Loading Rate Sheet Data...</span>
      </div>
    </div>
    <div
      v-else-if="displayedData.length > 0"
      class="overflow-y-auto max-h-[60vh] relative"
      ref="scrollContainerRef"
    >
      <table class="min-w-full divide-y divide-gray-700 text-sm">
        <thead class="bg-gray-800 sticky top-0 z-10">
          <tr>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">NPANXX</th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">State</th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">Country</th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">
              Interstate Rate
            </th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">
              Intrastate Rate
            </th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">
              Indeterminate Rate
            </th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">
              Effective Date
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr
            v-for="entry in displayedData"
            :key="entry.id || entry.npanxx"
            class="hover:bg-gray-700/50"
          >
            <td class="px-4 py-2 text-gray-400 font-mono text-center">{{ entry.npanxx }}</td>
            <td class="px-4 py-2 text-gray-400 text-center">
              {{ lergStore.getLocationByNPA(entry.npa)?.region || 'N/A' }}
            </td>
            <td class="px-4 py-2 text-gray-400 text-center">
              {{ lergStore.getLocationByNPA(entry.npa)?.country || 'N/A' }}
            </td>
            <td class="px-4 py-2 text-white font-mono text-center">
              {{ formatRate(entry.interRate) }}
            </td>
            <td class="px-4 py-2 text-white font-mono text-center">
              {{ formatRate(entry.intraRate) }}
            </td>
            <td class="px-4 py-2 text-white font-mono text-center">
              {{ formatRate(entry.ijRate) }}
            </td>
            <td class="px-4 py-2 text-gray-400 font-mono text-center">
              {{ entry.effectiveDate || 'N/A' }}
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Trigger for loading more -->
      <div ref="loadMoreTriggerRef" class="h-10"></div>
      <!-- Loading indicator -->
      <div v-if="isLoadingMore" class="text-center text-gray-500 py-4">Loading more...</div>
      <div v-if="!hasMoreData && displayedData.length > 0" class="text-center text-gray-600 py-4">
        End of results.
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center text-gray-500 py-10">
      No US Rate Sheet data found. Please upload a file.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue';
import {
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckIcon,
  ChevronUpDownIcon,
  ArrowRightIcon,
} from '@heroicons/vue/20/solid';
import type { USRateSheetEntry } from '@/types/rate-sheet-types';
import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
import { useLergStore } from '@/stores/lerg-store';
import { useDebounceFn, useIntersectionObserver } from '@vueuse/core';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { DexieDBBase } from '@/composables/useDexieDB';
import BaseButton from '@/components/shared/BaseButton.vue';
import {
  type AdjustmentType,
  type AdjustmentValueType,
  type TargetRateType,
} from '@/types/rate-sheet-types'; // Assuming types are defined here

// Type for average values
interface RateAverages {
  inter: number | null;
  intra: number | null;
  ij: number | null;
}

// Initialize store and service
const store = useUsRateSheetStore();
const lergStore = useLergStore();
const { getDB } = useDexieDB();
let dbInstance: DexieDBBase | null = null;
const RATE_SHEET_TABLE_NAME = 'entries';

// --- Rate Adjustment Options Data ---
const adjustmentTypeOptions = [
  { value: 'markup', label: 'Markup' },
  { value: 'markdown', label: 'Markdown' },
];
const adjustmentValueTypeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount ($)' },
];
const targetRateTypeOptions = [
  { value: 'all', label: 'All Rates' },
  { value: 'inter', label: 'Interstate' },
  { value: 'intra', label: 'Intrastate' },
  { value: 'ij', label: 'Indeterminate' },
];
// --- End Rate Adjustment Options Data ---

// --- Rate Adjustment State ---
const adjustmentType = ref<AdjustmentType>(adjustmentTypeOptions[0].value);
const adjustmentValueType = ref<AdjustmentValueType>(adjustmentValueTypeOptions[0].value);
const adjustmentValue = ref<number | null>(null);
const targetRateType = ref<TargetRateType>(targetRateTypeOptions[0].value);
const isApplyingAdjustment = ref(false);
const adjustmentStatusMessage = ref<string | null>(null);
const adjustmentError = ref<string | null>(null);
// --- End Rate Adjustment State ---

const searchQuery = ref('');
const debouncedSearchQuery = ref('');
const selectedState = ref('');

const isDataLoading = ref(true);
const isExporting = ref(false);
const dataError = ref<string | null>(null);

const totalRecords = ref<number>(0);

const displayedData = ref<USRateSheetEntry[]>([]);
const isLoadingMore = ref(false);
const scrollContainerRef = ref<HTMLElement | null>(null);
const loadMoreTriggerRef = ref<HTMLElement | null>(null);
const PAGE_SIZE = 100;
const offset = ref<number>(0);
const hasMoreData = ref<boolean>(true);
const availableStates = ref<string[]>([]);

// Define US States and Canadian Provinces for sorting
const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
];
const CA_PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

// Computed property to structure states for the dropdown with optgroup
const groupedAvailableStates = computed(() => {
  const usOptions = availableStates.value.filter((code) => US_STATES.includes(code));
  const caOptions = availableStates.value.filter((code) => CA_PROVINCES.includes(code));
  // You could add another group here for any codes not in US_STATES or CA_PROVINCES if necessary
  // const otherOptions = availableStates.value.filter(code => !US_STATES.includes(code) && !CA_PROVINCES.includes(code));

  const groups = [];
  if (usOptions.length > 0) {
    groups.push({ label: 'United States', codes: usOptions });
  }
  if (caOptions.length > 0) {
    groups.push({ label: 'Canada', codes: caOptions });
  }
  // if (otherOptions.length > 0) {
  //   groups.push({ label: 'Other', codes: otherOptions });
  // }
  return groups;
});

// State for Average Calculation
const overallAverages = ref<RateAverages | null>(null);
const stateAverageCache = ref<Map<string, RateAverages>>(new Map());
const currentDisplayAverages = ref<RateAverages>({ inter: null, intra: null, ij: null });
const isCalculatingOverall = ref(false);
const isCalculatingState = ref(false);

const debouncedSearch = useDebounceFn(() => {
  debouncedSearchQuery.value = searchQuery.value.trim().toLowerCase();
  resetPaginationAndLoad();
}, 300);

const stopSearchWatcher = watch(searchQuery, debouncedSearch);

// Watcher for state filter changes - handles table reload AND average calculation
const stopStateWatcher = watch(selectedState, async (newStateCode) => {
  // 1. Reset table data and pagination
  await resetPaginationAndLoad();

  // 2. Update displayed averages based on the new state filter
  console.log(
    `[USRateSheetTable] State filter changed to: '${newStateCode || 'All'}'. Updating averages.`
  );
  if (!newStateCode) {
    // Selected "All States/Provinces"
    if (overallAverages.value) {
      console.log('[USRateSheetTable] Using cached overall averages.');
      currentDisplayAverages.value = overallAverages.value;
    } else {
      // Should ideally be calculated on mount, but recalculate if somehow missing
      console.warn('[USRateSheetTable] Overall averages not found, recalculating...');
      const avg = await calculateAverages();
      overallAverages.value = avg;
      currentDisplayAverages.value = avg ?? { inter: null, intra: null, ij: null };
    }
  } else {
    // Selected a specific state/province
    if (stateAverageCache.value.has(newStateCode)) {
      // Cache Hit
      console.log(`[USRateSheetTable] Using cached averages for state: ${newStateCode}`);
      currentDisplayAverages.value = stateAverageCache.value.get(newStateCode)!;
    } else {
      // Cache Miss
      console.log(`[USRateSheetTable] Cache miss for state: ${newStateCode}. Calculating...`);
      // Show loading state for averages (clear current values)
      currentDisplayAverages.value = { inter: null, intra: null, ij: null };
      const stateAvg = await calculateAverages(newStateCode); // Sets isCalculatingState internally
      if (stateAvg) {
        stateAverageCache.value.set(newStateCode, stateAvg);
        currentDisplayAverages.value = stateAvg;
        console.log(`[USRateSheetTable] Averages calculated and cached for state: ${newStateCode}`);
      } else {
        // Handle error case where calculation failed
        currentDisplayAverages.value = { inter: null, intra: null, ij: null }; // Show N/A
        console.error(`[USRateSheetTable] Failed to calculate averages for state: ${newStateCode}`);
      }
    }
  }
});

// Watch for external DB updates signaled by the store timestamp
const stopDbUpdateWatcher = watch(
  () => store.lastDbUpdateTime,
  async (newTimestamp, oldTimestamp) => {
    if (newTimestamp !== oldTimestamp) {
      console.log('[USRateSheetTable] Detected store.lastDbUpdateTime change. Reloading data...');
      // Optionally, re-fetch unique states if they might have changed (unlikely for just date update)
      // await updateAvailableStates();
      await resetPaginationAndLoad();
      // Also, recalculate averages as data changed
      const avg = await calculateAverages(selectedState.value || undefined);
      if (selectedState.value) {
        if (avg) stateAverageCache.value.set(selectedState.value, avg);
        currentDisplayAverages.value = avg ?? { inter: null, intra: null, ij: null };
      } else {
        overallAverages.value = avg;
        currentDisplayAverages.value = avg ?? { inter: null, intra: null, ij: null };
      }
    }
  }
);

async function initializeRateSheetDB(): Promise<boolean> {
  if (dbInstance) return true;

  try {
    const targetDbName = DBName.US_RATE_SHEET;
    console.log('[USRateSheetTable] Initializing Dexie DB:', targetDbName);
    dbInstance = await getDB(targetDbName);
    if (!dbInstance || !dbInstance.tables.some((t) => t.name === RATE_SHEET_TABLE_NAME)) {
      console.warn(
        `[USRateSheetTable] Table '${RATE_SHEET_TABLE_NAME}' not found in DB '${targetDbName}'. Checking store...`
      );
      if (!store.getHasUsRateSheetData) {
        dataError.value = null;
        console.log('[USRateSheetTable] No rate sheet data uploaded.');
      } else {
        dataError.value = `Rate sheet table '${RATE_SHEET_TABLE_NAME}' seems to be missing. Try re-uploading.`;
      }
      hasMoreData.value = false;
      totalRecords.value = 0;
      displayedData.value = [];
      return false;
    }
    console.log('[USRateSheetTable] Dexie DB Initialized successfully.');
    dataError.value = null;
    return true;
  } catch (err: any) {
    console.error('[USRateSheetTable] Error initializing Dexie DB:', err);
    dataError.value = err.message || 'Failed to connect to the rate sheet database';
    hasMoreData.value = false;
    totalRecords.value = 0;
    displayedData.value = [];
    return false;
  }
}

async function fetchUniqueStates() {
  if (!(await initializeRateSheetDB()) || !dbInstance) {
    console.warn('[USRateSheetTable] Cannot fetch states, DB not ready.');
    availableStates.value = [];
    return;
  }

  try {
    console.log(
      `[USRateSheetTable] Fetching unique state/province codes directly from table '${RATE_SHEET_TABLE_NAME}'...`
    );

    // Fetch unique state codes directly using Dexie's uniqueKeys
    const uniqueRegionCodes = (await dbInstance
      .table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME)
      .orderBy('stateCode') // Keep initial order by code for consistency within groups
      .uniqueKeys()) as string[]; // Cast assuming they are strings

    // Custom sort: US States first, then Canadian Provinces, then others (alphabetical within groups)
    availableStates.value = uniqueRegionCodes
      .filter(Boolean) // Remove null/undefined/empty strings
      .sort((a, b) => {
        const aIsUS = US_STATES.includes(a);
        const bIsUS = US_STATES.includes(b);
        const aIsCA = CA_PROVINCES.includes(a);
        const bIsCA = CA_PROVINCES.includes(b);

        if (aIsUS && !bIsUS) return -1; // US comes before non-US
        if (!aIsUS && bIsUS) return 1; // non-US comes after US

        if (aIsUS && bIsUS) return a.localeCompare(b); // Sort US states alphabetically

        if (aIsCA && !bIsCA) return -1; // CA comes before others (non-US, non-CA)
        if (!aIsCA && bIsCA) return 1; // Others come after CA

        if (aIsCA && bIsCA) return a.localeCompare(b); // Sort CA provinces alphabetically

        // Sort any remaining items alphabetically (shouldn't happen with current lists)
        return a.localeCompare(b);
      });

    console.log(
      '[USRateSheetTable] Found and sorted unique states/provinces from Dexie:',
      availableStates.value
    );
  } catch (err: any) {
    console.error('[USRateSheetTable] Error fetching unique states/provinces from Dexie:', err);
    availableStates.value = []; // Clear on error
    dataError.value = 'Could not load state/province filter options.'; // Inform user
  }
}

async function updateAvailableStates() {
  await fetchUniqueStates(); // Keep this function name for consistency
}

async function loadMoreData() {
  if (isLoadingMore.value || !hasMoreData.value || !dbInstance) return;

  isLoadingMore.value = true;
  dataError.value = null;

  try {
    let query = dbInstance.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);

    // Apply filters directly using Dexie queries
    const filtersApplied: string[] = [];

    // Apply NPANXX search filter (use startsWithIgnoreCase for index efficiency)
    if (debouncedSearchQuery.value) {
      query = query.where('npanxx').startsWithIgnoreCase(debouncedSearchQuery.value);
      filtersApplied.push(`NPANXX starts with ${debouncedSearchQuery.value}`);
    }

    // Apply State/Province filter (use equals for index efficiency)
    if (selectedState.value) {
      query = query.where('stateCode').equals(selectedState.value);
      filtersApplied.push(`Region equals ${selectedState.value}`);
    }

    // Log applied filters
    if (filtersApplied.length > 0) {
      console.log(`[USRateSheetTable] Applying Dexie filters: ${filtersApplied.join(', ')}`);
    } else {
      console.log(`[USRateSheetTable] No Dexie filters applied.`);
    }

    // Get total count *after* applying filters
    if (offset.value === 0) {
      totalRecords.value = await query.count();
      console.log(`[USRateSheetTable] Total matching records (post-filter): ${totalRecords.value}`);
    }

    // Fetch data with pagination *after* applying filters
    const newData = await query.offset(offset.value).limit(PAGE_SIZE).toArray();

    console.log(
      `[USRateSheetTable] Loaded ${newData.length} records (offset: ${offset.value}, limit: ${PAGE_SIZE})`
    );

    displayedData.value = offset.value === 0 ? newData : [...displayedData.value, ...newData];
    offset.value += newData.length;
    hasMoreData.value = newData.length === PAGE_SIZE && offset.value < totalRecords.value;
  } catch (err: any) {
    console.error('[USRateSheetTable] Error loading rate sheet data:', err);
    dataError.value = err.message || 'Failed to load data';
    hasMoreData.value = false;
  } finally {
    isLoadingMore.value = false;
    if (isDataLoading.value) {
      isDataLoading.value = false;
    }
  }
}

async function resetPaginationAndLoad() {
  isDataLoading.value = true;
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0;
  }
  offset.value = 0;
  displayedData.value = [];
  hasMoreData.value = true;
  dataError.value = null;
  isLoadingMore.value = false;

  const dbReady = await initializeRateSheetDB();
  if (dbReady) {
    await loadMoreData();
  } else {
    isDataLoading.value = false;
  }
}

/**
 * Calculates the average rates for a given state or the entire dataset.
 * Uses Dexie.each for memory efficiency.
 * @param stateCode Optional state code to filter by.
 * @returns Promise resolving to RateAverages or null if DB error.
 */
async function calculateAverages(stateCode?: string): Promise<RateAverages | null> {
  const isLoadingOverall = !stateCode;
  if (isLoadingOverall) {
    isCalculatingOverall.value = true;
  } else {
    isCalculatingState.value = true;
  }
  console.log(
    `[USRateSheetTable] Calculating averages for ${
      stateCode ? `state ${stateCode}` : 'all data'
    }...`
  );

  const dbReady = await initializeRateSheetDB();
  if (!dbReady || !dbInstance) {
    console.error('[USRateSheetTable] Cannot calculate averages, DB not ready.');
    if (isLoadingOverall) isCalculatingOverall.value = false;
    else isCalculatingState.value = false;
    return null; // Indicate error or inability to calculate
  }

  let sumInter = 0;
  let sumIntra = 0;
  let sumIj = 0;
  let count = 0;

  try {
    let query = dbInstance.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
    if (stateCode) {
      query = query.where('stateCode').equals(stateCode);
    }

    await query.each((entry) => {
      // Ensure rates are numbers before summing
      if (typeof entry.interRate === 'number') {
        sumInter += entry.interRate;
      }
      if (typeof entry.intraRate === 'number') {
        sumIntra += entry.intraRate;
      }
      if (typeof entry.ijRate === 'number') {
        sumIj += entry.ijRate;
      }
      // Only count records where at least one rate is a valid number to avoid division by zero issues if all are null/bad
      if (
        typeof entry.interRate === 'number' ||
        typeof entry.intraRate === 'number' ||
        typeof entry.ijRate === 'number'
      ) {
        count++;
      }
    });

    const averages: RateAverages = {
      inter: count > 0 && !isNaN(sumInter) ? sumInter / count : null,
      intra: count > 0 && !isNaN(sumIntra) ? sumIntra / count : null,
      ij: count > 0 && !isNaN(sumIj) ? sumIj / count : null,
    };

    console.log(
      `[USRateSheetTable] Averages calculated (count: ${count}):`,
      JSON.stringify(averages)
    );
    return averages;
  } catch (err: any) {
    console.error('[USRateSheetTable] Error calculating averages:', err);
    dataError.value = err.message || 'Failed to calculate averages';
    return null;
  } finally {
    if (isLoadingOverall) {
      isCalculatingOverall.value = false;
    } else {
      isCalculatingState.value = false;
    }
  }
}

onMounted(async () => {
  console.log('USRateSheetTable mounted');
  if (!lergStore.isLoaded) {
    console.warn('[USRateSheetTable] LERG data not loaded. State names might be unavailable.');
  }

  // Fetch initial data and averages if DB is ready and store indicates data exists
  isDataLoading.value = true;
  const dbReady = await initializeRateSheetDB();
  if (dbReady && store.getHasUsRateSheetData) {
    // Fetch table data first
    await updateAvailableStates();
    await resetPaginationAndLoad(); // This sets isDataLoading to false internally

    // Now calculate overall averages
    console.log('[USRateSheetTable] Calculating initial overall averages...');
    overallAverages.value = await calculateAverages(); // Sets loading flag internally
    currentDisplayAverages.value = overallAverages.value ?? { inter: null, intra: null, ij: null };
    console.log('[USRateSheetTable] Initial overall averages set.', overallAverages.value);
  } else {
    console.log(
      '[USRateSheetTable] Skipping initial load/state/average fetch (DB not ready or no data).'
    );
    totalRecords.value = 0;
    isDataLoading.value = false;
    // Ensure averages are reset if no data
    overallAverages.value = null;
    currentDisplayAverages.value = { inter: null, intra: null, ij: null };
  }
});

onBeforeUnmount(() => {
  stopSearchWatcher();
  stopStateWatcher();
  stopDbUpdateWatcher();
  console.log('USRateSheetTable unmounted');
});

watch(
  () => store.getHasUsRateSheetData,
  async (hasData, oldHasData) => {
    console.log(
      `[USRateSheetTable] Store hasData changed: ${oldHasData} -> ${hasData}. Reloading table.`
    );
    if (hasData !== oldHasData) {
      if (!hasData) {
        // Clear local table state and averages
        dbInstance = null;
        totalRecords.value = 0;
        displayedData.value = [];
        availableStates.value = [];
        selectedState.value = '';
        searchQuery.value = '';
        hasMoreData.value = false;
        dataError.value = null;
        isDataLoading.value = false;
        // Clear averages
        overallAverages.value = null;
        stateAverageCache.value.clear();
        currentDisplayAverages.value = { inter: null, intra: null, ij: null };
        console.log('[USRateSheetTable] Averages cleared due to store data change.');
      } else {
        // Data has become available, re-initialize everything
        isDataLoading.value = true;
        const dbReady = await initializeRateSheetDB();
        if (dbReady) {
          await updateAvailableStates();
          await resetPaginationAndLoad();
        } else {
          isDataLoading.value = false;
        }
      }
    }
  },
  { immediate: false }
);

useIntersectionObserver(
  loadMoreTriggerRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasMoreData.value && !isLoadingMore.value && !isDataLoading.value) {
      console.log('[USRateSheetTable] Load more trigger intersecting, loading data...');
      loadMoreData();
    }
  },
  {
    root: scrollContainerRef.value,
    threshold: 0.1,
  }
);

/**
 * Formats a rate value for display, including a leading '$' and handling null/undefined.
 * @param rate The rate value.
 * @returns Formatted string (e.g., $0.008000) or 'N/A'.
 */
function formatRate(rate: number | string | null | undefined): string {
  if (rate === null || rate === undefined || typeof rate !== 'number') {
    return 'N/A';
  }
  // Ensure it's treated as a number, format, and prepend '$'
  return `$${Number(rate).toFixed(6)}`;
}

function handleClearData() {
  console.log('[USRateSheetTable] Clear Data button clicked.');
  if (confirm('Are you sure you want to clear all US Rate Sheet data? This cannot be undone.')) {
    // Clear local averages immediately for faster UI feedback
    overallAverages.value = null;
    stateAverageCache.value.clear();
    currentDisplayAverages.value = { inter: null, intra: null, ij: null };
    console.log('[USRateSheetTable] Local averages cleared immediately.');
    // Trigger store action which will eventually trigger the watcher above
    store.clearUsRateSheetData();
  }
}

async function handleExport() {
  // 1. Check if already exporting or if DB is ready
  if (isExporting.value) return;
  const dbReady = await initializeRateSheetDB(); // Ensure DB is initialized
  if (!dbReady || !dbInstance) {
    alert('Database is not ready. Cannot export.');
    console.error('[USRateSheetTable] Export failed: DB instance not available.');
    return;
  }

  isExporting.value = true;
  dataError.value = null;
  console.log(
    `[USRateSheetTable] Starting export for filters: search='${debouncedSearchQuery.value}', state='${selectedState.value}'`
  );

  try {
    // 2. Build the query based on current filters
    let query = dbInstance.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
    const filtersApplied: string[] = [];

    if (debouncedSearchQuery.value) {
      query = query.where('npanxx').startsWithIgnoreCase(debouncedSearchQuery.value);
      filtersApplied.push(`NPANXX starts with '${debouncedSearchQuery.value}'`);
    }
    if (selectedState.value) {
      query = query.where('stateCode').equals(selectedState.value);
      filtersApplied.push(`State Code equals '${selectedState.value}'`);
    }

    // 3. Fetch ALL matching data from Dexie
    console.log(
      `[USRateSheetTable] Fetching all data matching filters: ${
        filtersApplied.join(', ') || 'None'
      }`
    );
    const allMatchingData = await query.toArray();
    console.log(`[USRateSheetTable] Fetched ${allMatchingData.length} records for export.`);

    if (allMatchingData.length === 0) {
      alert('No data matches the current filters to export.');
      isExporting.value = false;
      return;
    }

    // 4. Define fields and map data (using LERG)
    const fields = [
      { label: 'NPANXX', value: 'npanxx' },
      { label: 'State', value: 'state' }, // Will be populated from LERG
      { label: 'Country', value: 'country' }, // Will be populated from LERG
      { label: 'Interstate Rate', value: 'interRate' },
      { label: 'Intrastate Rate', value: 'intraRate' },
      { label: 'Indeterminate Rate', value: 'ijRate' },
      { label: 'Effective Date', value: 'effectiveDate' },
    ];

    const dataToExport = allMatchingData.map((entry) => {
      const location = lergStore.getLocationByNPA(entry.npa);
      // Helper to format rate for export (number to string with 6 decimals, or 'N/A')
      const formatExportRate = (rate: number | string | null | undefined): string => {
        if (rate === null || rate === undefined || typeof rate !== 'number') {
          return 'N/A';
        }
        return Number(rate).toFixed(6);
      };

      return {
        npanxx: entry.npanxx,
        state: location?.region || 'N/A', // Use LERG data or fallback
        country: location?.country || 'N/A', // Use LERG data or fallback
        interRate: formatExportRate(entry.interRate), // Format rates for CSV
        intraRate: formatExportRate(entry.intraRate),
        ijRate: formatExportRate(entry.ijRate),
        effectiveDate: entry.effectiveDate || 'N/A', // Handle missing date
      };
    });

    // 5. Unparse to CSV using PapaParse
    const csv = Papa.unparse({
      fields: fields.map((f) => f.label), // Use labels as headers
      data: dataToExport.map((row) => fields.map((field) => row[field.value as keyof typeof row])), // Extract values in correct order
    });

    // 6. Trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename = 'us-rate-sheet';
    if (selectedState.value) filename += `-${selectedState.value}`;
    if (debouncedSearchQuery.value) filename += `-search_${debouncedSearchQuery.value}`;
    filename += `-${timestamp}.csv`;

    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    console.log('[USRateSheetTable] Export complete.');
  } catch (exportError: any) {
    console.error('[USRateSheetTable] Error during export:', exportError);
    dataError.value = exportError.message || 'An error occurred during export.';
    alert(`Export failed: ${dataError.value}`);
  } finally {
    isExporting.value = false;
  }
}

function applyLocalFilter(data: USRateSheetEntry[]): USRateSheetEntry[] {
  let filteredData = data;

  if (debouncedSearchQuery.value) {
    filteredData = filteredData.filter((entry) =>
      entry.npanxx.toLowerCase().includes(debouncedSearchQuery.value)
    );
  }

  if (selectedState.value && lergStore.isLoaded) {
    filteredData = filteredData.filter((entry) => {
      const location = lergStore.getLocationByNPA(entry.npa);
      return location?.country === 'US' && location.region === selectedState.value;
    });
  }

  return filteredData;
}

// Helper function to get display name for state or province
function getRegionDisplayName(code: string): string {
  if (!code) return '';
  // Check US states first
  const stateName = lergStore.getStateNameByCode(code);
  if (stateName !== code) {
    // getStateNameByCode returns the code itself if not found
    return stateName;
  }
  // Check Canadian provinces if not found in US states
  const provinceName = lergStore.getProvinceNameByCode(code);
  return provinceName; // Returns the code itself if not found here either
}

/**
 * Applies rate adjustments (markup/markdown) to filtered entries in the DexieDB.
 */
async function applyRateAdjustments() {
  if (isApplyingAdjustment.value || !dbInstance) {
    console.warn('[USRateSheetTable] Adjustment already in progress or DB not ready.');
    return;
  }
  if (adjustmentValue.value === null || adjustmentValue.value <= 0) {
    adjustmentError.value = 'Please enter a positive adjustment value.';
    adjustmentStatusMessage.value = null;
    return;
  }

  isApplyingAdjustment.value = true;
  adjustmentStatusMessage.value = null;
  adjustmentError.value = null;
  const startTime = performance.now();
  console.log(
    `[USRateSheetTable] Starting rate adjustment: ${adjustmentType.value} ${adjustmentValue.value}${
      adjustmentValueType.value === 'percentage' ? '%' : '$'
    } to ${targetRateType.value} rates.`
  );

  try {
    // 1. Get Primary Keys of Filtered Records
    let collection: Dexie.Collection<USRateSheetEntry, any> = dbInstance
      .table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME)
      .toCollection();

    const filtersApplied: string[] = [];

    // Apply filters progressively
    if (debouncedSearchQuery.value) {
      collection = collection.filter((record) =>
        record.npanxx.toLowerCase().startsWith(debouncedSearchQuery.value!)
      );
      filtersApplied.push(`NPANXX starts with '${debouncedSearchQuery.value}'`);
      // Note: Dexie's startsWithIgnoreCase is preferable for index usage, but .filter() is more flexible
      // if combining non-indexed criteria. Reverting to filter for simplicity in combining.
      // If performance becomes an issue with large datasets, revisit index usage.
      // Alternative using indexed search:
      // collection = collection.where('npanxx').startsWithIgnoreCase(debouncedSearchQuery.value);
    }

    if (selectedState.value) {
      // If we already filtered by npanxx, chain the state filter
      collection = collection.filter((record) => record.stateCode === selectedState.value);
      filtersApplied.push(`Region equals '${selectedState.value}'`);
      // Alternative using indexed search (if query started with where clause):
      // collection = collection.and(record => record.stateCode === selectedState.value);
      // Or if query could be table:
      // collection = collection.where('stateCode').equals(selectedState.value);
    }

    console.log(`[USRateSheetTable] Applying filters: ${filtersApplied.join(' AND ') || 'None'}`);
    const primaryKeys = await collection.primaryKeys();
    const recordCount = primaryKeys.length;

    if (recordCount === 0) {
      adjustmentStatusMessage.value =
        'No records match the current filters. No adjustments applied.';
      isApplyingAdjustment.value = false;
      return;
    }

    console.log(`[USRateSheetTable] Found ${recordCount} records matching filters to adjust.`);
    adjustmentStatusMessage.value = `Calculating adjustments for ${recordCount} records...`;

    // 2. Fetch Records and Calculate ALL Changes (outside transaction)
    const allUpdatesToApply: { key: any; changes: Partial<USRateSheetEntry> }[] = [];
    const chunkSize = 1000; // Adjust chunk size for fetching/calculation if needed

    for (let i = 0; i < recordCount; i += chunkSize) {
      const chunkKeys = primaryKeys.slice(i, i + chunkSize);
      if (chunkKeys.length === 0) continue;

      const recordsInChunk = await dbInstance
        .table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME)
        .bulkGet(chunkKeys);

      for (const record of recordsInChunk) {
        if (!record) continue;

        const changes: Partial<USRateSheetEntry> = {};
        let changed = false;
        const targets: (keyof Pick<USRateSheetEntry, 'interRate' | 'intraRate' | 'ijRate'>)[] = [];

        if (targetRateType.value === 'all' || targetRateType.value === 'inter')
          targets.push('interRate');
        if (targetRateType.value === 'all' || targetRateType.value === 'intra')
          targets.push('intraRate');
        if (targetRateType.value === 'all' || targetRateType.value === 'ij') targets.push('ijRate');

        targets.forEach((rateField) => {
          const currentRate = record[rateField];
          if (typeof currentRate !== 'number') return;

          let adjustedRate: number;
          const value = adjustmentValue.value!; // Already validated

          if (adjustmentValueType.value === 'percentage') {
            const percentage = value / 100;
            adjustedRate =
              currentRate * (adjustmentType.value === 'markup' ? 1 + percentage : 1 - percentage);
          } else {
            adjustedRate = currentRate + (adjustmentType.value === 'markup' ? value : -value);
          }

          const finalRate = Math.max(0, parseFloat(adjustedRate.toFixed(6)));

          if (finalRate !== currentRate) {
            changes[rateField] = finalRate;
            changed = true;
          }
        });

        if (changed) {
          allUpdatesToApply.push({ key: record.id || record.npanxx, changes });
        }
      }
      // Optional: Update status during calculation if it takes long
      // adjustmentStatusMessage.value = `Calculating... ${Math.round(((i + chunkKeys.length) / recordCount) * 100)}%`;
      // await new Promise(resolve => setTimeout(resolve, 0)); // Allow UI update during calculation
    }

    const updatesCount = allUpdatesToApply.length;
    if (updatesCount === 0) {
      adjustmentStatusMessage.value = 'No changes needed for the matching records.';
      isApplyingAdjustment.value = false;
      return;
    }

    console.log(
      `[USRateSheetTable] Calculated ${updatesCount} updates. Starting write operation...`
    );
    adjustmentStatusMessage.value = `Applying ${updatesCount} updates...`;

    // 3. Perform ALL Updates using bulkUpdate for efficiency
    // bulkUpdate handles transaction management internally for the batch.
    const tableToUpdate = dbInstance.table<USRateSheetEntry, number | string>(
      RATE_SHEET_TABLE_NAME
    ); // Specify key type if known (e.g., number or string)
    await tableToUpdate.bulkUpdate(allUpdatesToApply);

    console.log(`[USRateSheetTable] bulkUpdate finished.`);

    // Update completed successfully
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    // Use updatesCount instead of recordCount for the final message
    adjustmentStatusMessage.value = `Adjustment complete: ${updatesCount} records updated in ${duration}s.`;
    console.log(`[USRateSheetTable] Adjustment finished in ${duration}s.`);

    // 4. Refresh Data and Averages
    console.log('[USRateSheetTable] Refreshing table data and averages after adjustment...');
    await resetPaginationAndLoad(); // Reload table data

    // Recalculate averages
    const avg = await calculateAverages(selectedState.value || undefined);
    if (selectedState.value) {
      if (avg) stateAverageCache.value.set(selectedState.value, avg);
      currentDisplayAverages.value = avg ?? { inter: null, intra: null, ij: null };
    } else {
      overallAverages.value = avg;
      currentDisplayAverages.value = avg ?? { inter: null, intra: null, ij: null };
    }
    console.log('[USRateSheetTable] Averages recalculated.');

    // Explicitly update store timestamp to signal DB change
    store.lastDbUpdateTime = Date.now();
    console.log('[USRateSheetTable] Updated store lastDbUpdateTime.');

    // Optional: Clear inputs after success
    // adjustmentValue.value = null;
  } catch (err: any) {
    console.error('[USRateSheetTable] Error applying rate adjustments:', err);
    adjustmentError.value = err.message || 'An unknown error occurred during adjustment.';
    adjustmentStatusMessage.value = null;
  } finally {
    isApplyingAdjustment.value = false;
  }
}

// --- Computed properties for Listbox labels ---
const selectedAdjustmentTypeLabel = computed(
  () => adjustmentTypeOptions.find((opt) => opt.value === adjustmentType.value)?.label || ''
);
const selectedAdjustmentValueTypeLabel = computed(
  () =>
    adjustmentValueTypeOptions.find((opt) => opt.value === adjustmentValueType.value)?.label || ''
);
const selectedTargetRateTypeLabel = computed(
  () => targetRateTypeOptions.find((opt) => opt.value === targetRateType.value)?.label || ''
);
// --- End Computed properties ---
</script>

<style scoped>
.spinner-accent {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-accent, #10b981);
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

thead th {
  position: sticky;
  top: 0;
  background-color: #1f2937;
  z-index: 10;
}
</style>
