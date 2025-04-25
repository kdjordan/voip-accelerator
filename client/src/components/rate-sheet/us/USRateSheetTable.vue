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
          <label for="state-filter" class="sr-only">Filter by State</label>
          <select
            id="state-filter"
            v-model="selectedState"
            class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 min-w-[150px]"
            :disabled="availableStates.length === 0"
          >
            <option value="">All States</option>
            <option v-for="state in availableStates" :key="state" :value="state">
              {{ lergStore.getStateNameByCode(state) }} ({{ state }})
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
          :disabled="tableData.length === 0 || isExporting"
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
      v-else-if="tableData.length > 0"
      class="overflow-y-auto max-h-[60vh] relative"
      ref="scrollContainer"
    >
      <table class="min-w-full divide-y divide-gray-700 text-sm">
        <thead class="bg-gray-800 sticky top-0 z-10">
          <tr>
            <th scope="col" class="px-4 py-2 text-left text-gray-300">NPANXX</th>
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
import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
import { useLergStore } from '@/stores/lerg-store';
import { useLergData } from '@/composables/useLergData';
import { USRateSheetService } from '@/services/us-rate-sheet.service';
import type { USRateSheetEntry } from '@/types/domains/us-types';
import { useInfiniteScroll, useDebounceFn, useIntersectionObserver } from '@vueuse/core';
import Papa from 'papaparse';

// Initialize store and service
const store = useUsRateSheetStore();
const lergStore = useLergStore();
const { initializeLergData, isLoading: isLergLoading, error: lergError } = useLergData();
const rateSheetService = new USRateSheetService();
const searchQuery = ref('');
const debouncedSearchQuery = ref('');
const selectedState = ref('');

// Get data reactively from the store
const tableData = computed(() => store.getRateSheetData);

const isDataLoading = computed(() => store.getIsLoading);
const isExporting = ref(false);
const dataError = computed(() => store.getError);

const totalRecords = computed(() => {
  // Calculate total based on filtered store data
  return applyLocalFilter(tableData.value).length;
});

// Data displayed in the table (paginated slice of filtered store data)
const displayedData = ref<USRateSheetEntry[]>([]);
const isLoadingMore = ref(false);
const scrollContainerRef = ref<HTMLElement | null>(null);
const loadMoreTriggerRef = ref<HTMLElement | null>(null);
const PAGE_SIZE = 100;
const offset = ref<number>(0);
const hasMoreData = ref<boolean>(true);
const availableStates = ref<string[]>([]);

// Debounced search function
const debouncedSearch = useDebounceFn(() => {
  debouncedSearchQuery.value = searchQuery.value.trim().toLowerCase();
  resetPaginationAndLoad(); // Just reset pagination, data updates reactively
}, 300);

// Watch raw search query to trigger debounced function
const stopSearchWatcher = watch(searchQuery, debouncedSearch);

onMounted(async () => {
  console.log('USRateSheetTable mounted');
  // Ensure LERG is loaded
  if (!lergStore.isLoaded) {
    console.log('LERG data not loaded, attempting to initialize...');
    try {
      await initializeLergData();
      if (lergStore.isLoaded) {
        console.log('LERG data initialized successfully.');
      } else {
        console.error(
          'Failed to initialize LERG data. State filtering will be unavailable.',
          lergError.value
        );
      }
    } catch (err) {
      console.error('Error initializing LERG data:', err);
    }
  }
  // Ensure store data is loaded if not already present
  if (!store.getHasUsRateSheetData) {
    console.log('[USRateSheetTable] Store data not loaded, calling loadRateSheetData...');
    await store.loadRateSheetData();
  }
  // Initial calculation and pagination load
  resetPaginationAndLoad();
});

// Watch for changes in the store's data to recalculate states and reset pagination
watch(
  tableData,
  (newData, oldData) => {
    // Simplified condition: Trigger if the reference changes or length changes
    // Deep watcher should still catch internal changes, but let's log unconditionally first
    console.log(
      `[USRateSheetTable] WATCHER triggered. Old length: ${oldData?.length}, New length: ${newData?.length}`
    );
    // Optional: Check if effective date actually changed in the new data
    if (newData.length > 0) {
      console.log(
        `[USRateSheetTable] WATCHER: First entry effective date: ${newData[0].effectiveDate}`
      );
    }

    // Always reset if triggered for now
    console.log('[USRateSheetTable] WATCHER: Recalculating states and resetting pagination.');
    calculateAvailableStates();
    resetPaginationAndLoad();

    /* Original condition - keep for reference
    if (newData.length !== oldData?.length || newData[0]?.id !== oldData[0]?.id) {
      console.log(
        '[USRateSheetTable] Store data changed (original condition met), recalculating states and resetting pagination.'
      );
      calculateAvailableStates();
      resetPaginationAndLoad();
    }
    */
  },
  { deep: true } // Keep deep watcher
);

onBeforeUnmount(() => {
  if (stopSearchWatcher) {
    stopSearchWatcher();
  }
});

// Renamed function - focuses on resetting local pagination/display
function resetPaginationAndLoad() {
  // Reset local display/pagination state
  // isDataLoading is now driven by the store
  displayedData.value = [];
  offset.value = 0;
  hasMoreData.value = true;
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0;
  }
  // No data fetching here, loadMoreData uses computed tableData
  loadMoreData();
}

// Function to load more data for infinite scroll
function loadMoreData() {
  if (isLoadingMore.value || !hasMoreData.value || isDataLoading.value) return;

  isLoadingMore.value = true;
  console.log('Loading more data...');

  try {
    // Filter the computed data from the store
    const filtered = applyLocalFilter(tableData.value);
    // totalRecords is now computed based on filtered store data

    const nextPageData = filtered.slice(offset.value, offset.value + PAGE_SIZE);

    if (nextPageData.length > 0) {
      displayedData.value = [...displayedData.value, ...nextPageData];
      offset.value += nextPageData.length;
    }

    hasMoreData.value = offset.value < filtered.length;

    console.log(
      `Loaded ${nextPageData.length} more records. Total displayed: ${displayedData.value.length}. Has more: ${hasMoreData.value}`
    );
  } catch (error) {
    console.error('Error loading more data:', error);
    // Use store error state if appropriate, or local state for display errors
  } finally {
    isLoadingMore.value = false;
  }
}

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

// Calculate unique states present in the loaded data (uses computed tableData)
function calculateAvailableStates() {
  if (!lergStore.isLoaded || tableData.value.length === 0) {
    availableStates.value = [];
    return;
  }
  const states = new Set<string>();
  tableData.value.forEach((entry) => {
    const location = lergStore.getLocationByNPA(entry.npa);
    if (location?.country === 'US' && location.region) {
      states.add(location.region);
    }
  });
  availableStates.value = Array.from(states).sort();
  console.log('Available states calculated:', availableStates.value);
}

// Apply local search and state filter (uses computed tableData)
function applyLocalFilter(data: USRateSheetEntry[]): USRateSheetEntry[] {
  let filteredData = data; // Start with store data passed as argument

  // Apply search query filter
  if (debouncedSearchQuery.value) {
    filteredData = filteredData.filter((entry) =>
      entry.npanxx.toLowerCase().includes(debouncedSearchQuery.value)
    );
  }

  // Apply state filter
  if (selectedState.value && lergStore.isLoaded) {
    filteredData = filteredData.filter((entry) => {
      const location = lergStore.getLocationByNPA(entry.npa);
      return location?.country === 'US' && location.region === selectedState.value;
    });
  }

  return filteredData;
}

function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return 'N/A';
  return rate.toFixed(6);
}

async function handleClearData() {
  if (confirm('Are you sure you want to clear all US rate sheet data?')) {
    // Call the store action to clear data
    await store.clearUsRateSheetData();
    // No need to manually clear local state, reactivity handles it
    console.log('US Rate Sheet data cleared via store action.');
  }
}

function handleExport() {
  const dataToFilter = tableData.value; // Use computed store data
  if (dataToFilter.length === 0) {
    alert('No data to export');
    return;
  }
  if (isExporting.value) return;

  isExporting.value = true;
  // Use totalRecords computed property which is based on filtered store data
  console.log(`Exporting ${totalRecords.value} records...`);

  try {
    const fields = [
      { label: 'NPANXX', value: 'npanxx' },
      { label: 'Interstate Rate', value: 'interRate' },
      { label: 'Intrastate Rate', value: 'intraRate' },
      { label: 'Indeterminate Rate', value: 'ijRate' },
      { label: 'Effective Date', value: 'effectiveDate' },
    ];

    // Prepare data, applying filter to the store data
    const dataToExport = applyLocalFilter(dataToFilter).map((entry) => ({
      ...entry,
      effectiveDate: entry.effectiveDate || '',
    }));

    const csv = Papa.unparse({
      fields: fields.map((f) => f.label), // Use labels for header row
      data: dataToExport.map((row) =>
        fields.map((field) => row[field.value as keyof USRateSheetEntry])
      ),
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

// Watch for filter changes to reset pagination
watch([debouncedSearchQuery, selectedState], () => {
  console.log(
    `Filters changed: Search='${debouncedSearchQuery.value}', State='${selectedState.value}'. Resetting pagination.`
  );
  resetPaginationAndLoad(); // Just resets pagination/display
});
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
  background-color: theme('colors.gray.800');
  z-index: 10;
}
</style>
