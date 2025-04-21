<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <!-- Add Filter Controls -->
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
          class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
        >
          <option value="">All States</option>
          <option v-for="state in availableStates" :key="state" :value="state">
            {{ state }}
          </option>
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
    </div>

    <div v-if="isLoading && filteredComparisonData.length === 0" class="text-center text-gray-500">
      Loading comparison data...
    </div>
    <div v-else-if="error" class="text-center text-red-500">Error loading data: {{ error }}</div>
    <div
      v-else-if="filteredComparisonData.length === 0 && !isLoading"
      class="text-center text-gray-500"
    >
      No matching comparison data found. Ensure reports have been generated or adjust filters.
    </div>
    <div v-else class="overflow-x-auto">
      <!-- Make the container scrollable -->
      <div ref="scrollContainerRef" class="max-h-[600px] overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-700 text-sm">
          <thead class="bg-gray-800 sticky top-0 z-10">
            <tr>
              <!-- Define table headers based on USPricingComparisonRecord -->
              <th class="px-4 py-2 text-left text-gray-300">NPANXX</th>
              <th class="px-4 py-2 text-left text-gray-300">NPA</th>
              <th class="px-4 py-2 text-left text-gray-300">NXX</th>
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
              <th class="px-4 py-2 text-left text-gray-300">Cheaper Inter</th>
              <th class="px-4 py-2 text-left text-gray-300">Cheaper Intra</th>
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
              <td class="px-4 py-2 text-gray-400">{{ record.npa }}</td>
              <td class="px-4 py-2 text-gray-400">{{ record.nxx }}</td>
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
import { useIntersectionObserver } from '@vueuse/core';
import { useUsStore } from '@/stores/us-store';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { USPricingComparisonRecord } from '@/types/domains/us-types';
import type { DexieDBBase } from '@/composables/useDexieDB'; // Import the class type

const usStore = useUsStore(); // Instantiate usStore
const { getDB } = useDexieDB(); // Only need getDB now
const filteredComparisonData = ref<USPricingComparisonRecord[]>([]);
const isLoading = ref<boolean>(false); // Initial loading state
const isLoadingMore = ref<boolean>(false); // Loading state for subsequent pages
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

async function fetchUniqueStates() {
  if (!(await initializeDB()) || !dbInstance) return; // Ensure DB is ready

  try {
    const states = await dbInstance.table(COMPARISON_TABLE_NAME).orderBy('stateCode').uniqueKeys();
    availableStates.value = states.filter(Boolean).sort() as string[]; // Filter out null/empty and sort
    console.log('[USDetailedComparisonTable] Fetched unique states:', availableStates.value);
  } catch (err: any) {
    console.error('Error fetching unique states:', err);
    // Non-critical error, don't block UI
  }
}

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
      const lowerSearch = searchTerm.value.toLowerCase();
      currentFilters.push((record: USPricingComparisonRecord) =>
        record.npanxx.toLowerCase().startsWith(lowerSearch)
      );
    }
    if (selectedState.value) {
      currentFilters.push(
        (record: USPricingComparisonRecord) => record.stateCode === selectedState.value
      );
    }
    if (selectedCheaperInter.value) {
      currentFilters.push(
        (record: USPricingComparisonRecord) => record.cheaper_inter === selectedCheaperInter.value
      );
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

// Function to reset and load initial data (used on mount and filter changes)
async function resetAndFetchData() {
  isLoading.value = true;
  // Reset scroll position to top when filters change
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0;
  }
  // Reset state before fetching
  filteredComparisonData.value = [];
  offset.value = 0;
  hasMoreData.value = true; // Assume there's data until proven otherwise
  error.value = null;
  isLoadingMore.value = false; // Ensure this is reset

  await loadMoreData(); // Load the first page
  isLoading.value = false;
}

// --- Lifecycle and Watchers ---

onMounted(async () => {
  isLoading.value = true;
  await fetchUniqueStates(); // Fetch states first
  await resetAndFetchData(); // Then load initial data
  isLoading.value = false;
});

// Watch for filter changes and reload data
watch([searchTerm, selectedState, selectedCheaperInter], () => {
  resetAndFetchData();
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
</script>

<style scoped>
/* Ensure the sticky header works well */
thead th {
  background-color: #1f2937; /* bg-gray-800 */
}
</style>
