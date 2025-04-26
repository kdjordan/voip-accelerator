<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
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
        <div class="relative">
          <label for="state-filter" class="sr-only">Filter by State/Province</label>
          <select
            id="state-filter"
            v-model="selectedState"
            class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 min-w-[150px]"
            :disabled="availableStates.length === 0 || isDataLoading"
          >
            <option value="">All States/Provinces</option>
            <option v-for="regionCode in availableStates" :key="regionCode" :value="regionCode">
              {{ getRegionDisplayName(regionCode) }} ({{ regionCode }})
            </option>
          </select>
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
import { TrashIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/20/solid';
import type { USRateSheetEntry } from '@/types/rate-sheet-types';
import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
import { useLergStore } from '@/stores/lerg-store';
import { useDebounceFn, useIntersectionObserver } from '@vueuse/core';
import Papa from 'papaparse';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import type { DexieDBBase } from '@/composables/useDexieDB';

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

const debouncedSearch = useDebounceFn(() => {
  debouncedSearchQuery.value = searchQuery.value.trim().toLowerCase();
  resetPaginationAndLoad();
}, 300);

const stopSearchWatcher = watch(searchQuery, debouncedSearch);
const stopStateWatcher = watch(selectedState, () => {
  resetPaginationAndLoad();
});

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
    const uniqueRegionCodes = await dbInstance
      .table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME)
      .orderBy('stateCode')
      .uniqueKeys();

    availableStates.value = (uniqueRegionCodes as string[]) // Cast assuming they are strings
      .filter(Boolean) // Remove null/undefined/empty strings
      .sort();

    console.log(
      '[USRateSheetTable] Found unique states/provinces from Dexie:',
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

onMounted(async () => {
  console.log('USRateSheetTable mounted');
  if (!lergStore.isLoaded) {
    console.warn('[USRateSheetTable] LERG data not loaded. State names might be unavailable.');
  }

  isDataLoading.value = true;
  const dbReady = await initializeRateSheetDB();
  if (dbReady && store.getHasUsRateSheetData) {
    await updateAvailableStates();
    await resetPaginationAndLoad();
  } else {
    console.log('[USRateSheetTable] Skipping initial load/state fetch (DB not ready or no data).');
    totalRecords.value = 0;
    isDataLoading.value = false;
  }
});

onBeforeUnmount(() => {
  stopSearchWatcher();
  stopStateWatcher();
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
        dbInstance = null;
        totalRecords.value = 0;
        displayedData.value = [];
        availableStates.value = [];
        selectedState.value = '';
        searchQuery.value = '';
        hasMoreData.value = false;
        dataError.value = null;
        isDataLoading.value = false;
      } else {
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

function formatRate(rate: number | string | null | undefined): string {
  if (rate === null || rate === undefined) return 'N/A';
  return rate.toFixed(6);
}

function handleClearData() {
  console.log('[USRateSheetTable] Clear Data button clicked.');
  if (confirm('Are you sure you want to clear all US Rate Sheet data? This cannot be undone.')) {
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
