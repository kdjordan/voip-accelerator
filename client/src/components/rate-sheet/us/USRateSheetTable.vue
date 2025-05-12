<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <!-- Averages Section -->
    <div class="mb-6">
      <h4 class="text-xs font-medium text-gray-400 uppercase mb-3">Rate Averages</h4>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Interstate Average -->
        <div class="bg-gray-800/60 p-3 rounded-lg text-center">
          <p class="text-sm text-gray-400 mb-1">Inter Avg</p>
          <div class="flex items-center justify-center min-h-[28px]">
            <!-- Only show rate if NOT calculating AND value is not null -->
            <p
              v-if="
                !(isCalculatingOverall || isCalculatingState) &&
                currentDisplayAverages.inter !== null
              "
              class="text-lg font-semibold text-white font-mono mr-2"
            >
              {{ formatRate(animatedInterAvg) }}
            </p>
            <ArrowPathIcon
              v-if="isCalculatingOverall || isCalculatingState"
              class="w-4 h-4 text-gray-500 animate-spin"
            />
          </div>
        </div>
        <!-- Intrastate Average -->
        <div class="bg-gray-800/60 p-3 rounded-lg text-center">
          <p class="text-sm text-gray-400 mb-1">Intra Avg</p>
          <div class="flex items-center justify-center min-h-[28px]">
            <!-- Only show rate if NOT calculating AND value is not null -->
            <p
              v-if="
                !(isCalculatingOverall || isCalculatingState) &&
                currentDisplayAverages.intra !== null
              "
              class="text-lg font-semibold text-white font-mono mr-2"
            >
              {{ formatRate(animatedIntraAvg) }}
            </p>
            <ArrowPathIcon
              v-if="isCalculatingOverall || isCalculatingState"
              class="w-4 h-4 text-gray-500 animate-spin"
            />
          </div>
        </div>
        <!-- Indeterminate Average -->
        <div class="bg-gray-800/60 p-3 rounded-lg text-center">
          <p class="text-sm text-gray-400 mb-1">Indeterm Avg</p>
          <div class="flex items-center justify-center min-h-[28px]">
            <!-- Only show rate if NOT calculating AND value is not null -->
            <p
              v-if="
                !(isCalculatingOverall || isCalculatingState) &&
                currentDisplayAverages.indeterm !== null
              "
              class="text-lg font-semibold text-white font-mono mr-2"
            >
              {{ formatRate(animatedIndetermAvg) }}
            </p>
            <ArrowPathIcon
              v-if="isCalculatingOverall || isCalculatingState"
              class="w-4 h-4 text-gray-500 animate-spin"
            />
          </div>
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
          :loading="store.isLoading"
          :disabled="store.isLoading"
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
                :disabled="adjustmentType === 'set'"
              >
                <span
                  class="block truncate"
                  :class="adjustmentType === 'set' ? 'text-gray-500' : 'text-white'"
                >
                  {{ selectedAdjustmentValueTypeLabel }}
                </span>
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
          <Listbox v-model="adjustmentTargetRate" as="div">
            <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1"
              >Target Rate</ListboxLabel
            >
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
              >
                <span class="block truncate text-white">{{
                  selectedAdjustmentTargetRateLabel
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
                    v-for="option in adjustmentTargetRateOptions"
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
            @click="handleApplyAdjustment"
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
    <div class="overflow-y-auto max-h-[60vh] relative min-h-[300px]" ref="scrollContainerRef">
      <!-- Loading overlay for filter changes -->
      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isFiltering"
          class="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-20 rounded-lg"
        >
          <ArrowPathIcon class="animate-spin w-8 h-8 text-white" />
        </div>
      </transition>
      <table class="min-w-full divide-y divide-gray-700 text-sm">
        <thead class="bg-gray-800 sticky top-0 z-10">
          <tr>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">NPANXX</th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">State</th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">Country</th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">Interstate Rate</th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">Intrastate Rate</th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">Indeterminate Rate</th>
            <th scope="col" class="px-4 py-2 text-gray-300 text-center">Effective Date</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <!-- Loading State -->
          <tr v-if="isDataLoading">
            <td colspan="7" class="text-center py-10">
              <div class="flex items-center justify-center space-x-2 text-accent">
                <ArrowPathIcon class="animate-spin w-6 h-6" />
                <span>Loading Rate Sheet Data...</span>
              </div>
            </td>
          </tr>

          <!-- Data Rows -->
          <template v-else-if="displayedData.length > 0">
            <tr v-for="entry in displayedData" :key="entry.npanxx" class="hover:bg-gray-700/50">
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
                {{ formatRate(entry.indetermRate) }}
              </td>
              <td class="px-4 py-2 text-gray-400 font-mono text-center">
                {{ store.getCurrentEffectiveDate || 'N/A' }}
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-else>
            <td colspan="7" class="text-center text-gray-500 py-10">
              {{
                totalRecords > 0
                  ? 'No records match the current filters.'
                  : 'No US Rate Sheet data found. Please upload a file.'
              }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Trigger for loading more (only shown when there's data) -->
      <div
        v-if="displayedData.length > 0 && hasMoreData"
        ref="loadMoreTriggerRef"
        class="h-10"
      ></div>

      <!-- Loading more indicator (only shown when there's data and loading more) -->
      <div v-if="isLoadingMore && displayedData.length > 0" class="text-center text-gray-500 py-4">
        Loading more...
      </div>

      <!-- End of results message (only shown when there's data and no more to load) -->
      <div
        v-if="!hasMoreData && displayedData.length > 0 && totalRecords > 0"
        class="text-center text-gray-600 py-4"
      >
        End of results.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
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
  import type { USRateSheetEntry } from '@/types/domains/rate-sheet-types';
  import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
  import { useLergStore } from '@/stores/lerg-store';
  import { useDebounceFn, useIntersectionObserver, useTransition } from '@vueuse/core';
  import Papa from 'papaparse';
  import useDexieDB from '@/composables/useDexieDB';
  import { DBName } from '@/types/app-types';
  import type { DexieDBBase } from '@/composables/useDexieDB';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import {
    type AdjustmentType,
    type AdjustmentValueType,
    type TargetRateType,
  } from '@/types/domains/rate-sheet-types';
  import Dexie from 'dexie';

  // Minimum time (in ms) the filtering overlay should be displayed
  const MIN_FILTER_DISPLAY_TIME = 400;

  // Type for average values
  interface RateAverages {
    inter: number | null;
    intra: number | null;
    indeterm: number | null;
  }

  // Initialize store and service
  const store = useUsRateSheetStore();
  const lergStore = useLergStore();
  const { getDB } = useDexieDB();
  let dbInstance: DexieDBBase | null = null;
  const RATE_SHEET_TABLE_NAME = 'entries';

  // --- Reactive State (Table Loading, Filters, Pagination) ---
  const isDataLoading = ref(false); // Added: Tracks initial data loading state
  // --- Rate Adjustment Options Data ---
  const adjustmentTypeOptions = [
    { value: 'markup', label: 'Markup' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'set', label: 'Set To Value' },
  ] as const;
  const adjustmentValueTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount' },
  ] as const;
  const adjustmentTargetRateOptions = [
    { value: 'all', label: 'All Rates' },
    { value: 'inter', label: 'Interstate Only' },
    { value: 'intra', label: 'Intrastate Only' },
    { value: 'indeterm', label: 'Indeterminate Only' },
  ] as const;
  // --- End Rate Adjustment Options Data ---

  // --- Rate Adjustment State ---
  const adjustmentType = ref<AdjustmentType>(adjustmentTypeOptions[0].value);
  const adjustmentValueType = ref<AdjustmentValueType>(adjustmentValueTypeOptions[0].value);
  const adjustmentValue = ref<number | null>(null);
  const adjustmentTargetRate = ref<TargetRateType>(adjustmentTargetRateOptions[0].value);
  const isApplyingAdjustment = ref(false);
  const adjustmentStatusMessage = ref<string | null>(null);
  const adjustmentError = ref<string | null>(null);
  // --- End Rate Adjustment State ---

  // Moved initialization out of hooks/functions
  // Timeout ID for clearing the status message
  let adjustmentStatusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const searchQuery = ref('');
  const debouncedSearchQuery = ref('');
  const selectedState = ref<string>('');

  const isFiltering = ref(false);
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
  const CA_PROVINCES = [
    'AB',
    'BC',
    'MB',
    'NB',
    'NL',
    'NS',
    'NT',
    'NU',
    'ON',
    'PE',
    'QC',
    'SK',
    'YT',
  ];

  // Computed property to structure states for the dropdown with optgroup
  const groupedAvailableStates = computed(() => {
    const usOptions = availableStates.value.filter((code) => US_STATES.includes(code));
    const caOptions = availableStates.value.filter((code) => CA_PROVINCES.includes(code));

    const groups = [];
    if (usOptions.length > 0) {
      groups.push({ label: 'United States', codes: usOptions });
    }
    if (caOptions.length > 0) {
      groups.push({ label: 'Canada', codes: caOptions });
    }
    return groups;
  });

  // State for Average Calculation
  const overallAverages = ref<RateAverages | null>(null);
  const stateAverageCache = ref<Map<string, RateAverages>>(new Map());
  const currentDisplayAverages = ref<RateAverages>({ inter: null, intra: null, indeterm: null });
  const isCalculatingOverall = ref(false);
  const isCalculatingState = ref(false);

  // --- Animated Averages ---
  const transitionConfig = { duration: 500 };
  const interAvgSource = computed(() => currentDisplayAverages.value.inter ?? 0);
  const intraAvgSource = computed(() => currentDisplayAverages.value.intra ?? 0);
  const indetermAvgSource = computed(() => currentDisplayAverages.value.indeterm ?? 0);

  const animatedInterAvg = useTransition(interAvgSource, transitionConfig);
  const animatedIntraAvg = useTransition(intraAvgSource, transitionConfig);
  const animatedIndetermAvg = useTransition(indetermAvgSource, transitionConfig);
  // --- End Animated Averages ---

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
    if (!newStateCode) {
      // Selected "All States/Provinces"
      if (overallAverages.value) {
        currentDisplayAverages.value = overallAverages.value;
      } else {
        // Should ideally be calculated on mount, but recalculate if somehow missing
        console.warn('[USRateSheetTable] Overall averages not found, recalculating...');
        const avg = await calculateAverages();
        overallAverages.value = avg;
        currentDisplayAverages.value = avg ?? { inter: null, intra: null, indeterm: null };
      }
    } else {
      // Selected a specific state/province
      if (stateAverageCache.value.has(newStateCode)) {
        currentDisplayAverages.value = stateAverageCache.value.get(newStateCode)!;
      } else {
        // No need to clear currentDisplayAverages here, the spinner indicates loading
        const stateAvg = await calculateAverages(newStateCode);
        if (stateAvg) {
          stateAverageCache.value.set(newStateCode, stateAvg);
          currentDisplayAverages.value = stateAvg;
        } else {
          // Handle error case where calculation failed
          currentDisplayAverages.value = { inter: null, intra: null, indeterm: null }; // Set to null on error
          console.error(
            `[USRateSheetTable] Failed to calculate averages for state: ${newStateCode}`
          );
        }
      }
    }
  });

  async function initializeRateSheetDB(): Promise<boolean> {
    if (dbInstance) return true;

    try {
      const targetDbName = DBName.US_RATE_SHEET;
      dbInstance = await getDB(targetDbName);
      if (!dbInstance || !dbInstance.tables.some((t) => t.name === RATE_SHEET_TABLE_NAME)) {
        console.warn(
          `[USRateSheetTable] Table '${RATE_SHEET_TABLE_NAME}' not found in DB '${targetDbName}'. Checking store...`
        );
        if (!store.getHasUsRateSheetData) {
          dataError.value = null;
        } else {
          dataError.value = `Rate sheet table '${RATE_SHEET_TABLE_NAME}' seems to be missing. Try re-uploading.`;
        }
        hasMoreData.value = false;
        totalRecords.value = 0;
        displayedData.value = [];
        return false;
      }
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
      const uniqueRegionCodes = (await dbInstance
        .table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME)
        .orderBy('stateCode')
        .uniqueKeys()) as string[];

      availableStates.value = uniqueRegionCodes.filter(Boolean).sort((a, b) => {
        const aIsUS = US_STATES.includes(a);
        const bIsUS = US_STATES.includes(b);
        const aIsCA = CA_PROVINCES.includes(a);
        const bIsCA = CA_PROVINCES.includes(b);

        if (aIsUS && !bIsUS) return -1;
        if (!aIsUS && bIsUS) return 1;

        if (aIsUS && bIsUS) return a.localeCompare(b);

        if (aIsCA && !bIsCA) return -1;
        if (!aIsCA && bIsCA) return 1;

        if (aIsCA && bIsCA) return a.localeCompare(b);

        return a.localeCompare(b);
      });
    } catch (err: any) {
      console.error('[USRateSheetTable] Error fetching unique states/provinces from Dexie:', err);
      availableStates.value = [];
      dataError.value = 'Could not load state/province filter options.';
    }
  }

  async function updateAvailableStates() {
    await fetchUniqueStates();
  }

  async function loadMoreData(currentOffset: number): Promise<{
    data: USRateSheetEntry[];
    newOffset: number;
    newHasMoreData: boolean;
    newTotalRecords?: number;
  }> {
    // Removed isLoadingMore logic as this is now primarily for initial/filter load
    dataError.value = null;
    let count = 0;

    try {
      const table = dbInstance!.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
      let queryChain: Dexie.Collection<USRateSheetEntry, any> | Dexie.Table<USRateSheetEntry, any> =
        table;

      const filtersApplied: string[] = [];

      // Apply filters based on debouncedSearchQuery and selectedState
      if (debouncedSearchQuery.value) {
        queryChain = table.where('npanxx').startsWithIgnoreCase(debouncedSearchQuery.value);
        filtersApplied.push(`NPANXX starts with ${debouncedSearchQuery.value}`);

        if (selectedState.value) {
          // IMPORTANT: Dexie's 'and' method is for chaining filters on the same index.
          // For filtering on multiple properties (npanxx startsWith AND stateCode equals),
          // we need to apply the second filter after the initial where clause.
          queryChain = queryChain.filter((record) => record.stateCode === selectedState.value);
          filtersApplied.push(`Region equals ${selectedState.value}`);
        }
      } else if (selectedState.value) {
        queryChain = table.where('stateCode').equals(selectedState.value);
        filtersApplied.push(`Region equals ${selectedState.value}`);
      }

      // Calculate total count only on the first load (offset 0)
      if (currentOffset === 0) {
        count = await queryChain.count();
      }

      // Apply pagination and fetch data
      const newData = await queryChain.offset(currentOffset).limit(PAGE_SIZE).toArray();

      const newOffset = currentOffset + newData.length;
      // Determine hasMoreData based on fetched count and total count if available
      const newHasMoreData =
        newData.length === PAGE_SIZE && (currentOffset === 0 ? newOffset < count : true);

      // Return the results instead of updating refs directly
      return {
        data: newData,
        newOffset: newOffset,
        newHasMoreData: newHasMoreData,
        newTotalRecords: currentOffset === 0 ? count : undefined, // Only return count on first load
      };
    } catch (err: any) {
      console.error('[USRateSheetTable] Error loading rate sheet data:', err);
      dataError.value = err.message || 'Failed to load data';
      // Return empty/default state on error
      return {
        data: [],
        newOffset: currentOffset, // Keep original offset on error?
        newHasMoreData: false,
        newTotalRecords: currentOffset === 0 ? 0 : undefined,
      };
    } finally {
      // Removed isLoadingMore = false
    }
  }

  async function resetPaginationAndLoad() {
    const startTime = performance.now(); // Record start time
    isFiltering.value = true; // Set filtering overlay to true
    await nextTick(); // Wait for the overlay to render

    isDataLoading.value = true; // Show internal table loading state

    if (scrollContainerRef.value) {
      scrollContainerRef.value.scrollTop = 0;
    }
    // Reset state before fetching
    let currentOffset = 0; // Start from offset 0 for reset
    hasMoreData.value = true;
    dataError.value = null;
    isLoadingMore.value = false; // Ensure infinite scroll loading is off

    // Explicitly type fetchedResult to match the return type of loadMoreData
    let fetchedResult: {
      data: USRateSheetEntry[];
      newOffset: number;
      newHasMoreData: boolean;
      newTotalRecords?: number; // Mark as optional
    } = {
      data: [],
      newOffset: 0,
      newHasMoreData: false,
      newTotalRecords: undefined, // Keep initialization as undefined
    };

    const dbReady = await initializeRateSheetDB();
    if (dbReady && dbInstance) {
      try {
        // Fetch the first page of data but don't update displayedData yet
        fetchedResult = await loadMoreData(currentOffset);
      } catch (fetchError) {
        console.error('[USRateSheetTable] Error during initial data fetch in reset:', fetchError);
        dataError.value = (fetchError as Error).message || 'Failed to fetch initial data.';
        fetchedResult.newHasMoreData = false; // Ensure we stop loading on error
      }
    } else {
      // Handle DB not ready case
      totalRecords.value = 0;
      fetchedResult.newHasMoreData = false;
      if (!dbReady) {
        // Keep the error message from initializeRateSheetDB if it failed
        if (!dataError.value) dataError.value = 'Database not available.';
      }
    }

    isDataLoading.value = false; // Hide internal table loading state

    // Minimum display time logic
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    const remainingTime = MIN_FILTER_DISPLAY_TIME - elapsedTime;

    const updateUIData = () => {
      displayedData.value = fetchedResult.data;
      offset.value = fetchedResult.newOffset;
      hasMoreData.value = fetchedResult.newHasMoreData;
      if (fetchedResult.newTotalRecords !== undefined) {
        totalRecords.value = fetchedResult.newTotalRecords;
      }
      isFiltering.value = false; // Set filtering overlay to false
    };

    if (remainingTime > 0) {
      setTimeout(updateUIData, remainingTime);
    } else {
      updateUIData();
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

    const dbReady = await initializeRateSheetDB();
    if (!dbReady || !dbInstance) {
      console.error('[USRateSheetTable] Cannot calculate averages, DB not ready.');
      if (isLoadingOverall) isCalculatingOverall.value = false;
      else isCalculatingState.value = false;
      return null;
    }

    let sumInter = 0;
    let sumIntra = 0;
    let sumIndeterm = 0;
    let count = 0;

    try {
      const table = dbInstance.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
      let queryChain: Dexie.Collection<USRateSheetEntry, any> | Dexie.Table<USRateSheetEntry, any> =
        table;

      if (stateCode) {
        queryChain = table.where('stateCode').equals(stateCode);
      }

      await queryChain.each((entry) => {
        if (typeof entry.interRate === 'number') {
          sumInter += entry.interRate;
        }
        if (typeof entry.intraRate === 'number') {
          sumIntra += entry.intraRate;
        }
        if (typeof entry.indetermRate === 'number') {
          sumIndeterm += entry.indetermRate;
        }
        if (
          typeof entry.interRate === 'number' ||
          typeof entry.intraRate === 'number' ||
          typeof entry.indetermRate === 'number'
        ) {
          count++;
        }
      });

      const averages: RateAverages = {
        inter: count > 0 && !isNaN(sumInter) ? sumInter / count : null,
        intra: count > 0 && !isNaN(sumIntra) ? sumIntra / count : null,
        indeterm: count > 0 && !isNaN(sumIndeterm) ? sumIndeterm / count : null,
      };

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
    if (!lergStore.isLoaded) {
      console.warn('[USRateSheetTable] LERG data not loaded. State names might be unavailable.');
    }

    const dbReady = await initializeRateSheetDB();
    if (dbReady && store.getHasUsRateSheetData) {
      isDataLoading.value = true; // Set loading true only if we proceed to load
      await updateAvailableStates();
      await resetPaginationAndLoad();

      overallAverages.value = await calculateAverages();
      currentDisplayAverages.value = overallAverages.value ?? {
        inter: null,
        intra: null,
        indeterm: null,
      };
    }
  });

  onBeforeUnmount(() => {
    stopSearchWatcher();
    stopStateWatcher();
  });

  watch(
    () => store.getHasUsRateSheetData,
    async (hasData, oldHasData) => {
      if (hasData !== oldHasData) {
        if (!hasData) {
          dbInstance = null;
          totalRecords.value = 0;
          displayedData.value = [];
          availableStates.value = [];
          selectedState.value = '';
          searchQuery.value = '';
          hasMoreData.value = false;
          dataError.value = null;
          isDataLoading.value = false;
          overallAverages.value = null;
          stateAverageCache.value.clear();
          currentDisplayAverages.value = { inter: null, intra: null, indeterm: null };
        } else {
          isDataLoading.value = true;
          const dbReady = await initializeRateSheetDB();
          if (dbReady) {
            isDataLoading.value = true; // Set loading before fetching
            await updateAvailableStates();
            await resetPaginationAndLoad();
          } else {
            // If DB isn't ready after upload success, something is wrong,
            // keep loading false, error should be set by initializeRateSheetDB
          }
        }
      }
    },
    { immediate: false }
  );

  useIntersectionObserver(
    loadMoreTriggerRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting && hasMoreData.value && !isLoadingMore.value && !isFiltering.value) {
        loadMoreData(offset.value)
          .then((result) => {
            if (result.data.length > 0) {
              displayedData.value.push(...result.data);
              offset.value = result.newOffset;
              hasMoreData.value = result.newHasMoreData;
            } else {
              hasMoreData.value = false;
            }
          })
          .catch((err) => {
            console.error('[USRateSheetTable] Error during infinite scroll loadMoreData:', err);
            dataError.value = (err as Error).message || 'Failed to load more data.';
            hasMoreData.value = false;
          })
          .finally(() => {
            isLoadingMore.value = false;
          });
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
    return `$${Number(rate).toFixed(6)}`;
  }

  function handleClearData() {
    if (confirm('Are you sure you want to clear all US Rate Sheet data? This cannot be undone.')) {
      overallAverages.value = null;
      stateAverageCache.value.clear();
      currentDisplayAverages.value = { inter: null, intra: null, indeterm: null };
      store.clearUsRateSheetData();
    }
  }

  async function handleExport() {
    if (isExporting.value) return;
    const dbReady = await initializeRateSheetDB();
    if (!dbReady || !dbInstance) {
      alert('Database is not ready. Cannot export.');
      console.error('[USRateSheetTable] Export failed: DB instance not available.');
      return;
    }

    isExporting.value = true;
    dataError.value = null;

    try {
      const table = dbInstance.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);

      const allMatchingData = await table.toArray();

      if (allMatchingData.length === 0) {
        alert('No data found in the rate sheet to export.');
        isExporting.value = false;
        return;
      }

      const fields = [
        { label: 'NPANXX', value: 'npanxx' },
        { label: 'State', value: 'state' },
        { label: 'Country', value: 'country' },
        { label: 'Interstate Rate', value: 'interRate' },
        { label: 'Intrastate Rate', value: 'intraRate' },
        { label: 'Indeterminate Rate', value: 'indetermRate' },
        { label: 'Effective Date', value: 'effectiveDate' },
      ];

      const dataToExport = allMatchingData.map((entry) => {
        const location = lergStore.getLocationByNPA(entry.npa);
        const formatExportRate = (rate: number | string | null | undefined): string => {
          if (rate === null || rate === undefined || typeof rate !== 'number') {
            return 'N/A';
          }
          return Number(rate).toFixed(6);
        };

        return {
          npanxx: `1${entry.npanxx}`,
          state: location?.region || 'N/A',
          country: location?.country || 'N/A',
          interRate: formatExportRate(entry.interRate),
          intraRate: formatExportRate(entry.intraRate),
          indetermRate: formatExportRate(entry.indetermRate),
          effectiveDate: store.getCurrentEffectiveDate || 'N/A',
        };
      });

      const csv = Papa.unparse({
        fields: fields.map((f) => f.label),
        data: dataToExport.map((row) =>
          fields.map((field) => row[field.value as keyof typeof row])
        ),
      });

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

  async function handleApplyAdjustment() {
    if (isApplyingAdjustment.value || !dbInstance) {
      console.warn('[USRateSheetTable] Adjustment already in progress or DB not ready.');
      return;
    }
    if (adjustmentValue.value === null || adjustmentValue.value <= 0) {
      adjustmentError.value = 'Please enter a positive adjustment value.';
      adjustmentStatusMessage.value = null;
      return;
    }

    if (adjustmentStatusTimeoutId) {
      clearTimeout(adjustmentStatusTimeoutId);
      adjustmentStatusTimeoutId = null;
    }

    isApplyingAdjustment.value = true;
    adjustmentStatusMessage.value = null;
    adjustmentError.value = null;
    const startTime = performance.now();

    try {
      let collection: Dexie.Collection<USRateSheetEntry, any> = dbInstance
        .table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME)
        .toCollection();

      const filtersApplied: string[] = [];

      if (debouncedSearchQuery.value) {
        collection = collection.filter((record: USRateSheetEntry) =>
          record.npanxx.toLowerCase().startsWith(debouncedSearchQuery.value!)
        );
        filtersApplied.push(`NPANXX starts with '${debouncedSearchQuery.value}'`);
      }
      if (selectedState.value) {
        collection = collection.filter(
          (record: USRateSheetEntry) => record.stateCode === selectedState.value
        );
        filtersApplied.push(`Region equals '${selectedState.value}'`);
      }

      const filteredRecords = await collection.toArray();
      const recordCount = filteredRecords.length;

      if (recordCount === 0) {
        adjustmentStatusMessage.value =
          'No records match the current filters. No adjustments applied.';
        isApplyingAdjustment.value = false;
        return;
      }

      adjustmentStatusMessage.value = `Applying ${recordCount} updates...`;

      const allUpdatesToApply: { key: any; changes: Partial<USRateSheetEntry> }[] = [];

      for (const record of filteredRecords) {
        if (!record) continue;

        const changes: Partial<USRateSheetEntry> = {};
        let changed = false;
        const targets: (keyof Pick<
          USRateSheetEntry,
          'interRate' | 'intraRate' | 'indetermRate'
        >)[] = [];

        if (adjustmentTargetRate.value === 'all' || adjustmentTargetRate.value === 'inter')
          targets.push('interRate');
        if (adjustmentTargetRate.value === 'all' || adjustmentTargetRate.value === 'intra')
          targets.push('intraRate');
        if (adjustmentTargetRate.value === 'all' || adjustmentTargetRate.value === 'indeterm')
          targets.push('indetermRate');

        targets.forEach((rateField) => {
          const currentRate = record[rateField];
          if (typeof currentRate !== 'number') return;

          let adjustedRate: number;
          const value = adjustmentValue.value!;

          if (adjustmentType.value === 'set') {
            adjustedRate = value;
          } else if (adjustmentValueType.value === 'percentage') {
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

        if (changed && record.id) {
          allUpdatesToApply.push({ key: record.id, changes });
        }
      }

      const updatesCount = allUpdatesToApply.length;
      if (updatesCount === 0) {
        adjustmentStatusMessage.value = 'No changes needed for the matching records.';
        isApplyingAdjustment.value = false;
        return;
      }

      const tableToUpdate = dbInstance.table<USRateSheetEntry, number | string>(
        RATE_SHEET_TABLE_NAME
      );
      await tableToUpdate.bulkUpdate(allUpdatesToApply);

      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      adjustmentStatusMessage.value = `Adjustment complete: ${updatesCount} records updated in ${duration}s.`;

      // --- Refresh data and averages after successful update ---
      await resetPaginationAndLoad(); // Reload table data

      // Recalculate averages based on current filter
      if (selectedState.value) {
        const stateAvg = await calculateAverages(selectedState.value);
        if (stateAvg) {
          stateAverageCache.value.set(selectedState.value, stateAvg);
          currentDisplayAverages.value = stateAvg;
        }
      } else {
        overallAverages.value = await calculateAverages();
        currentDisplayAverages.value = overallAverages.value ?? {
          inter: null,
          intra: null,
          indeterm: null,
        };
      }
      // --- End refresh ---

      // --- Reset adjustment form ---
      // adjustmentType.value = adjustmentTypeOptions[0].value; // Keep selection
      // adjustmentValueType.value = adjustmentValueTypeOptions[0].value; // Keep selection
      adjustmentValue.value = null; // Only reset the value input
      // adjustmentTargetRate.value = adjustmentTargetRateOptions[0].value; // Keep selection
      // --- End reset form ---

      adjustmentStatusTimeoutId = setTimeout(() => {
        adjustmentStatusMessage.value = null;
        adjustmentStatusTimeoutId = null;
      }, 4000);

      store.lastDbUpdateTime = Date.now();
    } catch (err: any) {
      console.error('[USRateSheetTable] Error applying rate adjustments:', err);
      adjustmentError.value = err.message || 'An unknown error occurred during adjustment.';
      adjustmentStatusMessage.value = null;
    } finally {
      isApplyingAdjustment.value = false;
    }
  }

  const selectedAdjustmentTypeLabel = computed(
    () => adjustmentTypeOptions.find((opt) => opt.value === adjustmentType.value)?.label || ''
  );
  const selectedAdjustmentValueTypeLabel = computed(
    () =>
      adjustmentValueTypeOptions.find((opt) => opt.value === adjustmentValueType.value)?.label || ''
  );
  const selectedAdjustmentTargetRateLabel = computed(
    () =>
      adjustmentTargetRateOptions.find((opt) => opt.value === adjustmentTargetRate.value)?.label ||
      ''
  );

  function getRegionDisplayName(code: string): string {
    if (!code) return '';
    const stateName = lergStore.getStateNameByCode(code);
    if (stateName !== code) return stateName;
    const provinceName = lergStore.getProvinceNameByCode(code);
    return provinceName;
  }
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
