<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <!-- Filtered Data Average Rates Summary - Moved Up -->
    <div
      v-if="filteredComparisonData.length > 0 || isLoading || isCalculatingAverages"
      class="mb-6 space-y-3"
    >
      <!-- File 1 Averages -->
      <div>
        <!-- File 1 Badge -->
        <div class="mb-2">
          <span
            class="text-green-300 bg-green-900/50 border border-green-700 font-medium px-2 py-0.5 rounded-md text-xs"
            >{{ fileName1 }}</span
          >
        </div>
        <!-- File 1 Bento Boxes -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Inter Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ fullFilteredAverages.file1_inter_avg.toFixed(6) }}</span>
            </div>
          </div>
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Intra Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ fullFilteredAverages.file1_intra_avg.toFixed(6) }}</span>
            </div>
          </div>
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Indeterm Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ fullFilteredAverages.file1_indeterm_avg.toFixed(6) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- File 2 Averages -->
      <div>
        <!-- File 2 Badge -->
        <div class="mb-2">
          <span
            class="text-blue-300 bg-blue-900/50 border border-blue-700 font-medium px-2 py-0.5 rounded-md text-xs"
            >{{ fileName2 }}</span
          >
        </div>
        <!-- File 2 Bento Boxes -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Inter Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ fullFilteredAverages.file2_inter_avg.toFixed(6) }}</span>
            </div>
          </div>
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Intra Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ fullFilteredAverages.file2_intra_avg.toFixed(6) }}</span>
            </div>
          </div>
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Indeterm Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ fullFilteredAverages.file2_indeterm_avg.toFixed(6) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="mb-4 flex flex-wrap gap-4 items-center">
      <!-- NPANXX Search -->
      <div>
        <label for="npanxx-search" class="block text-sm font-medium text-gray-400 mb-1"
          >Search NPANXX</label
        >
        <input
          type="text"
          id="npanxx-search"
          v-model="searchTerm"
          placeholder="Enter NPANXX..."
          class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
        />
      </div>

      <!-- State Filter -->
      <div>
        <label for="state-filter" class="block text-sm font-medium text-gray-400 mb-1"
          >Filter by State</label
        >
        <select
          id="state-filter"
          v-model="selectedState"
          class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 min-w-[200px]"
          :disabled="availableStates.length === 0 || isLoading || isFiltering"
          size="10"
        >
          <option value="">All States/Provinces</option>
          <optgroup v-for="group in groupedAvailableStates" :key="group.label" :label="group.label">
            <option v-for="regionCode in group.codes" :key="regionCode" :value="regionCode">
              {{ getRegionDisplayName(regionCode) }} ({{ regionCode }})
            </option>
          </optgroup>
        </select>
      </div>

      <!-- Cheaper File Filter (based on Inter) -->
      <div>
        <label for="cheaper-filter" class="block text-sm font-medium text-gray-400 mb-1"
          >Cheaper Inter Rate</label
        >
        <select
          id="cheaper-filter"
          v-model="selectedCheaperInter"
          class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
        >
          <option value="">All</option>
          <option value="file1">{{ fileName1 }} Cheaper</option>
          <option value="file2">{{ fileName2 }} Cheaper</option>
          <option value="same">Same Rate</option>
        </select>
      </div>

      <!-- Download CSV Button -->
      <div class="ml-auto self-end">
        <button
          @click="downloadCsv"
          :disabled="
            isLoading || isLoadingMore || filteredComparisonData.length === 0 || isExporting
          "
          title="Download Current View"
          class="inline-flex items-center justify-center px-4 py-2 border border-green-700 text-sm font-medium rounded-md shadow-sm text-green-300 bg-green-900/50 hover:bg-green-800/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
        >
          <span v-if="isExporting" class="flex items-center">
            <ArrowPathIcon class="animate-spin w-5 h-5 mr-2" />
            Exporting...
          </span>
          <span v-else class="flex items-center">
            <ArrowDownTrayIcon class="w-5 h-5 mr-2" />
            Export Filtered Data
          </span>
        </button>
      </div>
    </div>

    <div
      v-if="isLoading && filteredComparisonData.length === 0"
      class="text-center text-gray-500 py-10"
    >
      <div class="flex items-center justify-center space-x-2">
        <ArrowPathIcon class="animate-spin w-6 h-6" />
        <span>Loading comparison data...</span>
      </div>
    </div>
    <div v-else-if="error" class="text-center text-red-500 py-10">
      Error loading data: {{ error }}
    </div>
    <div
      v-else-if="filteredComparisonData.length === 0 && !isLoading"
      class="text-center text-gray-500 py-10"
    >
      No matching comparison data found. Ensure reports have been generated or adjust filters.
    </div>
    <div v-else class="overflow-x-auto relative">
      <!-- Loading overlay for filter changes -->
      <div
        v-if="isFiltering"
        class="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-20 rounded-lg"
      >
        <ArrowPathIcon class="animate-spin w-8 h-8 text-white" />
      </div>
      <!-- Make the container scrollable -->
      <div ref="scrollContainerRef" class="max-h-[600px] overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-700 text-sm">
          <thead class="bg-gray-800 sticky top-0 z-10">
            <tr>
              <!-- Define table headers based on USPricingComparisonRecord -->
              <th class="px-4 py-2 text-left text-gray-300">NPANXX</th>
              <!-- <th class="px-4 py-2 text-left text-gray-300">NPA</th> -->
              <!-- <th class="px-4 py-2 text-left text-gray-300">NXX</th> -->
              <th class="px-4 py-2 text-left text-gray-300">State</th>
              <th class="px-4 py-2 text-left text-gray-300">Country</th>
              <!-- File 1 Inter -->
              <th class="px-4 py-2 text-left text-gray-300">
                Inter&nbsp;
                <span
                  class="text-green-300 bg-green-900/50 border border-green-700 font-medium px-2 py-0.5 rounded-md text-xs"
                  >{{ fileName1 }}</span
                >
              </th>
              <!-- File 2 Inter -->
              <th class="px-4 py-2 text-left text-gray-300">
                Inter&nbsp;
                <span
                  class="text-blue-300 bg-blue-900/50 border border-blue-700 font-medium px-2 py-0.5 rounded-md text-xs"
                  >{{ fileName2 }}</span
                >
              </th>
              <!-- Diff Inter % Header -->
              <th class="px-4 py-2 text-left text-gray-300">Diff %</th>
              <!-- File 1 Intra -->
              <th class="px-4 py-2 text-left text-gray-300">
                Intra&nbsp;
                <span
                  class="text-green-300 bg-green-900/50 border border-green-700 font-medium px-2 py-0.5 rounded-md text-xs"
                  >{{ fileName1 }}</span
                >
              </th>
              <!-- File 2 Intra -->
              <th class="px-4 py-2 text-left text-gray-300">
                Intra&nbsp;
                <span
                  class="text-blue-300 bg-blue-900/50 border border-blue-700 font-medium px-2 py-0.5 rounded-md text-xs"
                  >{{ fileName2 }}</span
                >
              </th>
              <!-- Diff Intra % Header -->
              <th class="px-4 py-2 text-left text-gray-300">Diff %</th>
              <!-- File 1 Indeterm -->
              <th class="px-4 py-2 text-left text-gray-300">
                Indeterm&nbsp;
                <span
                  class="text-green-300 bg-green-900/50 border border-green-700 font-medium px-2 py-0.5 rounded-md text-xs"
                  >{{ fileName1 }}</span
                >
              </th>
              <!-- File 2 Indeterm -->
              <th class="px-4 py-2 text-left text-gray-300">
                Indeterm&nbsp;
                <span
                  class="text-blue-300 bg-blue-900/50 border border-blue-700 font-medium px-2 py-0.5 rounded-md text-xs"
                  >{{ fileName2 }}</span
                >
              </th>
              <!-- Diff Indeterm % Header -->
              <th class="px-4 py-2 text-left text-gray-300">Diff %</th>
              <!-- Difference Headers -->
              <th class="px-4 py-2 text-left text-gray-300 min-w-[120px]">Cheaper Inter</th>
              <th class="px-4 py-2 text-left text-gray-300 min-w-[120px]">Cheaper Intra</th>
              <th class="px-4 py-2 text-left text-gray-300">Cheaper Indeterm</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr
              v-for="record in filteredComparisonData"
              :key="record.npanxx"
              class="hover:bg-gray-700/50"
            >
              <!-- Populate table cells -->
              <td class="px-4 py-2 text-gray-400">{{ record.npanxx }}</td>
              <!-- <td class="px-4 py-2 text-gray-400">{{ record.npa }}</td> -->
              <!-- <td class="px-4 py-2 text-gray-400">{{ record.nxx }}</td> -->
              <td class="px-4 py-2 text-gray-400">{{ record.stateCode }}</td>
              <td class="px-4 py-2 text-gray-400">{{ record.countryCode }}</td>
              <!-- File 1 Inter Rate -->
              <td class="px-4 py-2 text-white">{{ record.file1_inter?.toFixed(6) }}</td>
              <!-- File 2 Inter Rate -->
              <td class="px-4 py-2 text-white">{{ record.file2_inter?.toFixed(6) }}</td>
              <!-- Diff Inter % Cell -->
              <td class="px-4 py-2 text-white">{{ record.diff_inter_pct?.toFixed(2) }}%</td>
              <!-- File 1 Intra Rate -->
              <td class="px-4 py-2 text-white">{{ record.file1_intra?.toFixed(6) }}</td>
              <!-- File 2 Intra Rate -->
              <td class="px-4 py-2 text-white">{{ record.file2_intra?.toFixed(6) }}</td>
              <!-- Diff Intra % Cell -->
              <td class="px-4 py-2 text-white">{{ record.diff_intra_pct?.toFixed(2) }}%</td>
              <!-- File 1 Indeterm Rate -->
              <td class="px-4 py-2 text-white">{{ record.file1_indeterm?.toFixed(6) }}</td>
              <!-- File 2 Indeterm Rate -->
              <td class="px-4 py-2 text-white">{{ record.file2_indeterm?.toFixed(6) }}</td>
              <!-- Diff Indeterm % Cell -->
              <td class="px-4 py-2 text-white">{{ record.diff_indeterm_pct?.toFixed(2) }}%</td>
              <!-- Cheaper Inter -->
              <td class="px-4 py-2">
                <span :class="getCheaperClass(record.cheaper_inter)">
                  {{ formatCheaperFile(record.cheaper_inter) }}
                </span>
              </td>
              <!-- Cheaper Intra -->
              <td class="px-4 py-2">
                <span :class="getCheaperClass(record.cheaper_intra)">
                  {{ formatCheaperFile(record.cheaper_intra) }}
                </span>
              </td>
              <!-- Cheaper Indeterm -->
              <td class="px-4 py-2">
                <span :class="getCheaperClass(record.cheaper_indeterm)">
                  {{ formatCheaperFile(record.cheaper_indeterm) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Trigger for loading more -->
        <div ref="loadMoreTriggerRef" class="h-10"></div>
        <!-- Loading indicator -->
        <div v-if="isLoadingMore" class="text-center text-gray-500 py-4">Loading more...</div>
        <div
          v-if="!hasMoreData && filteredComparisonData.length > 0"
          class="text-center text-gray-600 py-4"
        >
          End of results.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useIntersectionObserver, useDebounceFn } from '@vueuse/core';
import { useUsStore } from '@/stores/us-store';
import { useLergStore } from '@/stores/lerg-store'; // Import lergStore
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { USPricingComparisonRecord } from '@/types/domains/us-types';
import type { DexieDBBase } from '@/composables/useDexieDB'; // Import the class type
import Papa from 'papaparse'; // Import PapaParse
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/20/solid'; // Import Icons

const usStore = useUsStore(); // Instantiate usStore
const lergStore = useLergStore(); // Instantiate lergStore
const { getDB } = useDexieDB(); // Only need getDB now
const filteredComparisonData = ref<USPricingComparisonRecord[]>([]);
const isLoading = ref<boolean>(false); // Initial loading state
const isLoadingMore = ref<boolean>(false); // Loading state for subsequent pages
const isFiltering = ref<boolean>(false); // State for loading during filter changes
const isExporting = ref<boolean>(false); // Export loading state
const error = ref<string | null>(null);
const availableStates = ref<string[]>([]); // For state filter dropdown

// Filter State Variables
const searchTerm = ref<string>('');
const selectedState = ref<string>('');
const selectedCheaperInter = ref<'' | 'file1' | 'file2' | 'same'>('');

// Pagination State
const offset = ref<number>(0);
const pageSize = 50; // Number of items to load per page
const hasMoreData = ref<boolean>(true);

// Infinite Scroll Trigger Element
const loadMoreTriggerRef = ref<HTMLElement | null>(null);
const scrollContainerRef = ref<HTMLElement | null>(null); // Ref for the scrollable div

// State for accurately calculated averages based on full filtered dataset
const fullFilteredAverages = ref({
  file1_inter_avg: 0,
  file1_intra_avg: 0,
  file1_indeterm_avg: 0,
  file2_inter_avg: 0,
  file2_intra_avg: 0,
  file2_indeterm_avg: 0,
});
const isCalculatingAverages = ref<boolean>(false);

// Use the fixed table name for comparison results
const COMPARISON_TABLE_NAME = 'comparison_results';

let dbInstance: DexieDBBase | null = null; // Cache DB instance

// --- Get Filenames for Headers ---
const fileName1 = computed(() => {
  const names = usStore.getFileNames;
  return names.length > 0 ? names[0].replace(/\.csv$/i, '') : 'File 1';
});

const fileName2 = computed(() => {
  const names = usStore.getFileNames;
  return names.length > 1 ? names[1].replace(/\.csv$/i, '') : 'File 2';
});

// --- Computed property for average rates of filtered data ---
const filteredAverageRates = computed(() => {
  const totals = {
    file1_inter: { sum: 0, count: 0 },
    file1_intra: { sum: 0, count: 0 },
    file1_indeterm: { sum: 0, count: 0 },
    file2_inter: { sum: 0, count: 0 },
    file2_intra: { sum: 0, count: 0 },
    file2_indeterm: { sum: 0, count: 0 },
  };

  for (const record of filteredComparisonData.value) {
    // Helper to safely add to sum and count
    const addToTotals = (key: keyof typeof totals, value: number | null | undefined) => {
      if (value !== null && value !== undefined && !isNaN(value)) {
        totals[key].sum += value;
        totals[key].count++;
      }
    };

    addToTotals('file1_inter', record.file1_inter);
    addToTotals('file1_intra', record.file1_intra);
    addToTotals('file1_indeterm', record.file1_indeterm);
    addToTotals('file2_inter', record.file2_inter);
    addToTotals('file2_intra', record.file2_intra);
    addToTotals('file2_indeterm', record.file2_indeterm);
  }

  // Helper to calculate average
  const calculateAvg = (sum: number, count: number): number => {
    return count > 0 ? sum / count : 0;
  };

  return {
    file1_inter_avg: calculateAvg(totals.file1_inter.sum, totals.file1_inter.count),
    file1_intra_avg: calculateAvg(totals.file1_intra.sum, totals.file1_intra.count),
    file1_indeterm_avg: calculateAvg(totals.file1_indeterm.sum, totals.file1_indeterm.count),
    file2_inter_avg: calculateAvg(totals.file2_inter.sum, totals.file2_inter.count),
    file2_intra_avg: calculateAvg(totals.file2_intra.sum, totals.file2_intra.count),
    file2_indeterm_avg: calculateAvg(totals.file2_indeterm.sum, totals.file2_indeterm.count),
  };
});

// --- CSV Download Function (Updated) ---
async function downloadCsv(): Promise<void> {
  // Make async
  if (isExporting.value) return; // Prevent multiple exports

  isExporting.value = true;
  error.value = null; // Clear previous errors

  try {
    // Ensure DB is initialized
    if (!(await initializeDB()) || !dbInstance) {
      throw new Error('Database not available for export.');
    }

    // 1. Build the query dynamically to get ALL filtered data
    let query = dbInstance.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);
    const currentFilters: Array<(record: USPricingComparisonRecord) => boolean> = [];
    if (searchTerm.value) {
      const term = searchTerm.value.trim();
      if (term.length === 6) {
        // Exact match for 6 digits
        query = query.where('npanxx').equals(term);
        console.log(`[USDetailedComparisonTable] Applying Dexie NPANXX filter: equals ${term}`);
      } else {
        // StartsWith for shorter terms
        const lowerSearch = term.toLowerCase();
        query = query.where('npanxx').startsWithIgnoreCase(lowerSearch);
        console.log(
          `[USDetailedComparisonTable] Applying Dexie NPANXX filter: startsWithIgnoreCase ${term}`
        );
      }
    }
    if (selectedState.value) {
      // Apply state filter *after* potential NPANXX filter if it used an index
      // If NPANXX filter didn't use an index (e.g., if we used .filter later), apply it here first.
      query = query.and((record) => record.stateCode === selectedState.value);
      console.log(
        `[USDetailedComparisonTable] Applying Dexie State filter: equals ${selectedState.value}`
      );
    }
    if (selectedCheaperInter.value) {
      // Apply cheaper filter using .and() if other filters applied, otherwise .where()
      const cheaperFilterFn = (record: USPricingComparisonRecord) =>
        record.cheaper_inter === selectedCheaperInter.value;
      query = query.and(cheaperFilterFn);
      console.log(
        `[USDetailedComparisonTable] Applying Dexie Cheaper Inter filter: equals ${selectedCheaperInter.value}`
      );
    }

    // Apply pagination and fetch data
    const newData = await query.offset(offset.value).limit(pageSize).toArray();

    console.log(
      `[USDetailedComparisonTable] Loaded ${newData.length} records (offset: ${offset.value}, limit: ${pageSize})`
    );

    filteredComparisonData.value.push(...newData); // Append new data
    offset.value += newData.length; // Increment offset
    hasMoreData.value = newData.length === pageSize; // Check if there might be more data
  } catch (err: any) {
    console.error('Error loading more comparison data:', err);
    error.value = err.message || 'Failed to load data';
    hasMoreData.value = false; // Stop trying to load more on error
  } finally {
    isLoadingMore.value = false;
  }
}

// --- Core Data Loading Logic ---

async function initializeDB() {
  if (!dbInstance) {
    try {
      dbInstance = await getDB(DBName.US_PRICING_COMPARISON);
      if (!dbInstance.tables.some((t) => t.name === COMPARISON_TABLE_NAME)) {
        console.warn(
          `[USDetailedComparisonTable] Table '${COMPARISON_TABLE_NAME}' not found in DB '${DBName.US_PRICING_COMPARISON}'. Cannot load data.`
        );
        error.value = `Comparison table '${COMPARISON_TABLE_NAME}' not found. Please generate reports first.`;
        hasMoreData.value = false; // Stop loading if table doesn't exist
        return false; // Indicate failure
      }
      return true; // Indicate success
    } catch (err: any) {
      console.error('Error initializing database:', err);
      error.value = err.message || 'Failed to connect to the comparison database';
      hasMoreData.value = false; // Stop loading on DB error
      return false; // Indicate failure
    }
  }
  return true; // Already initialized
}

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

async function fetchUniqueStates() {
  if (!(await initializeDB()) || !dbInstance) return; // Ensure DB is ready

  try {
    const uniqueRegionCodes = (await dbInstance
      .table(COMPARISON_TABLE_NAME)
      .orderBy('stateCode')
      .uniqueKeys()) as string[];

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

        // Sort any remaining items alphabetically
        return a.localeCompare(b);
      });

    console.log(
      '[USDetailedComparisonTable] Fetched and sorted unique states:',
      availableStates.value
    );
  } catch (err: any) {
    console.error('Error fetching unique states:', err);
    availableStates.value = []; // Clear on error
    // Non-critical error, don't block UI, but maybe show a message?
    error.value = 'Could not load state filter options.';
  }
}

// Computed property to structure states for the dropdown with optgroup
const groupedAvailableStates = computed(() => {
  const usOptions = availableStates.value.filter((code) => US_STATES.includes(code));
  const caOptions = availableStates.value.filter((code) => CA_PROVINCES.includes(code));
  // Add otherOptions if needed: const otherOptions = availableStates.value.filter(code => !US_STATES.includes(code) && !CA_PROVINCES.includes(code));

  const groups = [];
  if (usOptions.length > 0) {
    groups.push({ label: 'United States', codes: usOptions });
  }
  if (caOptions.length > 0) {
    groups.push({ label: 'Canada', codes: caOptions });
  }
  // if (otherOptions.length > 0) { groups.push({ label: 'Other', codes: otherOptions }); }
  return groups;
});

async function loadMoreData() {
  if (isLoadingMore.value || !hasMoreData.value) return; // Don't load if already loading or no more data
  if (!(await initializeDB()) || !dbInstance) {
    isLoadingMore.value = false; // Ensure loading state is reset if DB fails
    return; // Stop if DB init failed
  }

  isLoadingMore.value = true;
  error.value = null; // Clear previous errors

  try {
    // Build the query dynamically
    let query = dbInstance.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);

    // Apply filters
    const currentFilters: Array<(record: USPricingComparisonRecord) => boolean> = [];
    if (searchTerm.value) {
      const term = searchTerm.value.trim();
      if (term.length === 6) {
        // Exact match for 6 digits
        currentFilters.push((record: USPricingComparisonRecord) => record.npanxx === term);
      } else {
        // StartsWith for shorter terms
        const lowerSearch = term.toLowerCase();
        currentFilters.push((record: USPricingComparisonRecord) =>
          record.npanxx.toLowerCase().startsWith(lowerSearch)
        );
      }
    }
    if (selectedState.value) {
      currentFilters.push(
        (record: USPricingComparisonRecord) => record.stateCode === selectedState.value
      );
    }
    if (selectedCheaperInter.value) {
      const cheaperFilterFn = (record: USPricingComparisonRecord) =>
        record.cheaper_inter === selectedCheaperInter.value;
      currentFilters.push(cheaperFilterFn);
    }

    // Explicitly type as Collection or apply chain differently
    let finalQueryChain;
    if (currentFilters.length > 0) {
      // Start with the filtered collection
      finalQueryChain = query
        .filter((record) => currentFilters.every((fn) => fn(record)))
        .offset(offset.value)
        .limit(pageSize);
    } else {
      // Start with the original table
      finalQueryChain = query.offset(offset.value).limit(pageSize);
    }

    // Apply pagination and fetch data
    const newData = await finalQueryChain.toArray();

    console.log(
      `[USDetailedComparisonTable] Loaded ${newData.length} records (offset: ${offset.value}, limit: ${pageSize})`
    );

    // Replace data if it's the first page load (offset 0), otherwise append
    if (offset.value === 0) {
      filteredComparisonData.value = newData;
    } else {
      filteredComparisonData.value.push(...newData); // Append new data
    }

    offset.value += newData.length; // Increment offset
    hasMoreData.value = newData.length === pageSize; // Check if there might be more data
  } catch (err: any) {
    console.error('Error loading more comparison data:', err);
    error.value = err.message || 'Failed to load data';
    hasMoreData.value = false; // Stop trying to load more on error
  } finally {
    isLoadingMore.value = false;
  }
}

// New function to calculate averages based on ALL filtered data
async function calculateFullFilteredAverages() {
  if (!(await initializeDB()) || !dbInstance) return; // Ensure DB is ready

  isCalculatingAverages.value = true;
  console.log('[USDetailedComparisonTable] Calculating averages for ALL filtered data...');

  const totals = {
    file1_inter: { sum: 0, count: 0 },
    file1_intra: { sum: 0, count: 0 },
    file1_indeterm: { sum: 0, count: 0 },
    file2_inter: { sum: 0, count: 0 },
    file2_intra: { sum: 0, count: 0 },
    file2_indeterm: { sum: 0, count: 0 },
  };

  try {
    let query = dbInstance.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);

    // Apply filters same as in loadMoreData
    const currentFilters: Array<(record: USPricingComparisonRecord) => boolean> = [];
    if (searchTerm.value) {
      const term = searchTerm.value.trim();
      if (term.length === 6) {
        // Exact match for 6 digits
        currentFilters.push((record: USPricingComparisonRecord) => record.npanxx === term);
      } else {
        // StartsWith for shorter terms
        const lowerSearch = term.toLowerCase();
        currentFilters.push((record: USPricingComparisonRecord) =>
          record.npanxx.toLowerCase().startsWith(lowerSearch)
        );
      }
    }
    if (selectedState.value) {
      currentFilters.push(
        (record: USPricingComparisonRecord) => record.stateCode === selectedState.value
      );
    }
    if (selectedCheaperInter.value) {
      const cheaperFilterFn = (record: USPricingComparisonRecord) =>
        record.cheaper_inter === selectedCheaperInter.value;
      currentFilters.push(cheaperFilterFn);
    }

    let finalQueryChain = query;
    if (currentFilters.length > 0) {
      finalQueryChain = query.filter((record) => currentFilters.every((fn) => fn(record)));
    }

    // Use .each for potentially large datasets
    await finalQueryChain.each((record) => {
      const addToTotals = (key: keyof typeof totals, value: number | null | undefined) => {
        if (value !== null && value !== undefined && !isNaN(value)) {
          totals[key].sum += value;
          totals[key].count++;
        }
      };
      addToTotals('file1_inter', record.file1_inter);
      addToTotals('file1_intra', record.file1_intra);
      addToTotals('file1_indeterm', record.file1_indeterm);
      addToTotals('file2_inter', record.file2_inter);
      addToTotals('file2_intra', record.file2_intra);
      addToTotals('file2_indeterm', record.file2_indeterm);
    });

    // Helper to calculate average
    const calculateAvg = (sum: number, count: number): number => {
      return count > 0 ? sum / count : 0;
    };

    fullFilteredAverages.value = {
      file1_inter_avg: calculateAvg(totals.file1_inter.sum, totals.file1_inter.count),
      file1_intra_avg: calculateAvg(totals.file1_intra.sum, totals.file1_intra.count),
      file1_indeterm_avg: calculateAvg(totals.file1_indeterm.sum, totals.file1_indeterm.count),
      file2_inter_avg: calculateAvg(totals.file2_inter.sum, totals.file2_inter.count),
      file2_intra_avg: calculateAvg(totals.file2_intra.sum, totals.file2_intra.count),
      file2_indeterm_avg: calculateAvg(totals.file2_indeterm.sum, totals.file2_indeterm.count),
    };

    console.log(
      '[USDetailedComparisonTable] Full filtered averages calculated:',
      fullFilteredAverages.value
    );
  } catch (err: any) {
    console.error('[USDetailedComparisonTable] Error calculating full filtered averages:', err);
    // Reset averages on error
    fullFilteredAverages.value = {
      file1_inter_avg: 0,
      file1_intra_avg: 0,
      file1_indeterm_avg: 0,
      file2_inter_avg: 0,
      file2_intra_avg: 0,
      file2_indeterm_avg: 0,
    };
  } finally {
    isCalculatingAverages.value = false;
  }
}

// Function to reset and load initial data (used on mount and filter changes)
async function resetAndFetchData() {
  // Set loading states
  isLoading.value = true; // Indicate initial load phase for this filter set
  isFiltering.value = true; // Indicate filters are being applied

  // Reset scroll position to top when filters change
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0;
  }
  // Reset state before fetching - DO NOT CLEAR filteredComparisonData here
  offset.value = 0;
  hasMoreData.value = true; // Assume there's data until proven otherwise
  error.value = null;
  isLoadingMore.value = false; // Ensure this is reset

  // Trigger both table data fetch and full average calculation
  // We pass 0 for offset to loadMoreData to signal it should replace the data
  const dataFetchPromise = loadMoreData(); // Load the first page of table data
  const averageCalcPromise = calculateFullFilteredAverages(); // Calculate averages for all filtered data

  try {
    // Wait for both to complete (or handle errors appropriately)
    await Promise.all([dataFetchPromise, averageCalcPromise]);
  } catch (err) {
    // Error handling is done within the individual functions, but catch here just in case
    console.error('[USDetailedComparisonTable] Error during resetAndFetchData:', err);
  } finally {
    // Reset loading states after fetching is complete
    isLoading.value = false;
    isFiltering.value = false;
  }
}

// --- Lifecycle and Watchers ---

onMounted(async () => {
  isLoading.value = true;
  await fetchUniqueStates(); // Fetch states first
  await resetAndFetchData(); // Then load initial data
  isLoading.value = false;
});

// Watch for filter changes and reload data (DEBOUNCED)
const debouncedResetAndFetch = useDebounceFn(() => {
  resetAndFetchData();
}, 300); // 300ms debounce delay

watch([searchTerm, selectedState, selectedCheaperInter], () => {
  // Call the debounced function instead of the original
  debouncedResetAndFetch();
});

// Setup Intersection Observer for infinite scrolling
useIntersectionObserver(
  loadMoreTriggerRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasMoreData.value && !isLoadingMore.value && !isLoading.value) {
      console.log('[USDetailedComparisonTable] Load more trigger intersecting, loading data...');
      loadMoreData();
    }
  },
  {
    root: scrollContainerRef.value, // Observe within the scrollable container
    threshold: 0.1, // Trigger when 10% visible
  }
);

// --- Helper Functions ---

function getDiffClass(diff: number | null | undefined): string {
  if (diff === null || diff === undefined) return 'text-gray-500'; // Handle potential nulls
  if (diff > 0) return 'text-red-400';
  if (diff < 0) return 'text-green-400';
  return 'text-gray-400';
}

function getCheaperClass(cheaper: 'file1' | 'file2' | 'same' | null | undefined): string {
  const baseStyle = 'font-medium px-2 py-0.5 rounded-md text-xs'; // Base badge style
  if (cheaper === null || cheaper === undefined) return 'text-gray-500'; // Handle potential nulls
  if (cheaper === 'file1') {
    // File 1 is cheaper - Green style
    return `${baseStyle} text-green-300 bg-green-900/50 border border-green-700`;
  }
  if (cheaper === 'file2') {
    // File 2 is cheaper - Red style (consistent with diffs)
    return `${baseStyle} text-red-300 bg-red-900/50 border border-red-700`;
  }
  if (cheaper === 'same') {
    // Same Rate - Neutral/Gray style
    return `${baseStyle} text-gray-300 bg-gray-700/50 border border-gray-600`;
  }
  return 'text-gray-500'; // Fallback for unexpected values
}

// Helper function to format Cheaper File text (similar to AZ)
function formatCheaperFile(cheaper?: 'file1' | 'file2' | 'same'): string {
  if (cheaper === 'file1') {
    return fileName1.value; // Use computed property
  } else if (cheaper === 'file2') {
    return fileName2.value; // Use computed property
  } else if (cheaper === 'same') {
    return 'Same Rate';
  } else {
    return 'N/A'; // Handle undefined/null case
  }
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
/* Ensure the sticky header works well */
thead th {
  background-color: #1f2937; /* bg-gray-800 */
}
</style>
