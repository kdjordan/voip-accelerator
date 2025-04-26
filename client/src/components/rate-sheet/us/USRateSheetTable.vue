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
            placeholder="Search NPANXX..."
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
                  class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
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
        <button
          @click="handleClearData"
          class="inline-flex items-center justify-center px-4 py-2 border border-red-700 text-sm font-medium rounded-md shadow-sm text-red-300 bg-red-900/50 hover:bg-red-800/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear all rate sheet data"
        >
          <TrashIcon class="w-5 h-5 mr-2" />
          Clear Data
        </button>
        <button
          @click="handleExport"
          :disabled="totalRecords === 0 || isExporting"
          class="inline-flex items-center justify-center px-4 py-2 border border-green-700 text-sm font-medium rounded-md shadow-sm text-green-300 bg-green-900/50 hover:bg-green-800/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export all loaded data"
        >
          <span v-if="isExporting" class="flex items-center">
            <ArrowPathIcon class="animate-spin w-5 h-5 mr-2" />
            Exporting...
          </span>
          <span v-else class="flex items-center">
            <ArrowDownTrayIcon class="w-5 h-5 mr-2" />
            Export All
          </span>
        </button>
      </div>
    </div>

    <!-- Table Container -->
    <div v-if="isDataLoading" class="text-center text-gray-500 py-10">
      <div class="flex items-center justify-center space-x-2">
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
            <th scope="col" class="px-4 py-2 text-left text-gray-300">NPANXX</th>
            <th scope="col" class="px-4 py-2 text-left text-gray-300">State</th>
            <th scope="col" class="px-4 py-2 text-left text-gray-300">Country</th>
            <th scope="col" class="px-4 py-2 text-left text-gray-300">Interstate Rate</th>
            <th scope="col" class="px-4 py-2 text-left text-gray-300">Intrastate Rate</th>
            <th scope="col" class="px-4 py-2 text-left text-gray-300">Indeterminate Rate</th>
            <th scope="col" class="px-4 py-2 text-left text-gray-300">Effective Date</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr
            v-for="entry in displayedData"
            :key="entry.id || entry.npanxx"
            class="hover:bg-gray-700/50"
          >
            <td class="px-4 py-2 text-gray-400 font-mono">{{ entry.npanxx }}</td>
            <td class="px-4 py-2 text-gray-400">
              {{ lergStore.getLocationByNPA(entry.npa)?.region || 'N/A' }}
            </td>
            <td class="px-4 py-2 text-gray-400">
              {{ lergStore.getLocationByNPA(entry.npa)?.country || 'N/A' }}
            </td>
            <td class="px-4 py-2 text-white font-mono">{{ formatRate(entry.interRate) }}</td>
            <td class="px-4 py-2 text-white font-mono">{{ formatRate(entry.intraRate) }}</td>
            <td class="px-4 py-2 text-white font-mono">{{ formatRate(entry.ijRate) }}</td>
            <td class="px-4 py-2 text-gray-400 font-mono">{{ entry.effectiveDate || 'N/A' }}</td>
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
} from '@heroicons/vue/20/solid';
import type { USRateSheetEntry } from '@/types/rate-sheet-types';
import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
import { useLergStore } from '@/stores/lerg-store';
import { useDebounceFn, useIntersectionObserver } from '@vueuse/core';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { DexieDBBase } from '@/composables/useDexieDB';

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

function handleExport() {
  const dataToFilter = displayedData.value;
  if (dataToFilter.length === 0) {
    alert('No data to export');
    return;
  }
  if (isExporting.value) return;

  isExporting.value = true;
  console.log(`Exporting ${totalRecords.value} records...`);

  try {
    const fields = [
      { label: 'NPANXX', value: 'npanxx' },
      { label: 'State', value: 'state' },
      { label: 'Country', value: 'country' },
      { label: 'Interstate Rate', value: 'interRate' },
      { label: 'Intrastate Rate', value: 'intraRate' },
      { label: 'Indeterminate Rate', value: 'ijRate' },
      { label: 'Effective Date', value: 'effectiveDate' },
    ];

    const dataToExport = applyLocalFilter(dataToFilter).map((entry) => {
      const location = lergStore.getLocationByNPA(entry.npa);
      return {
        ...entry,
        npanxx: entry.npanxx,
        state: location?.region || '',
        country: location?.country || '',
        interRate: entry.interRate,
        intraRate: entry.intraRate,
        ijRate: entry.ijRate,
        effectiveDate: entry.effectiveDate || '',
      };
    });

    const csv = Papa.unparse({
      fields: fields.map((f) => f.label),
      data: dataToExport.map((row) => fields.map((field) => row[field.value as keyof typeof row])),
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.setAttribute('download', `us-rate-sheet-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    console.log('Export complete.');
  } catch (exportError) {
    console.error('Error during export:', exportError);
    alert('An error occurred during export.');
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
