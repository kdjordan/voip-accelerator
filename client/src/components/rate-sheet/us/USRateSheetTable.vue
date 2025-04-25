<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <!-- Controls Section (No separate background) -->
    <div class="mb-4 flex flex-wrap gap-4 items-center justify-between">
      <div class="flex items-center gap-4">
        <h3 class="text-sm font-medium text-gray-300">Table Controls</h3>
        <span v-if="!isDataLoading" class="text-sm text-gray-400">
          Showing {{ displayedData.length }} of {{ totalRecords }} NPANXX entries
        </span>
        <span v-else class="text-sm text-gray-400">Loading data...</span>
      </div>
      <div class="flex items-center gap-4">
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
          :disabled="usRateSheetData.length === 0 || isExporting"
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
      v-else-if="usRateSheetData.length > 0"
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
import { USRateSheetService } from '@/services/us-rate-sheet.service';
import type { USRateSheetEntry } from '@/types/domains/us-types';
import { useInfiniteScroll, useDebounceFn, useIntersectionObserver } from '@vueuse/core';
import Papa from 'papaparse';

// Initialize store and service
const store = useUsRateSheetStore();
const rateSheetService = new USRateSheetService();
const searchQuery = ref('');
const debouncedSearchQuery = ref('');

// US Rate Sheet data - Holds ALL loaded data
const usRateSheetData = ref<USRateSheetEntry[]>([]);
const isDataLoading = ref(false);
const isExporting = ref(false);
const dataError = ref<string | null>(null);
const totalRecords = computed(() => {
  // Calculate total based on filter to give accurate count
  return applyLocalFilter(usRateSheetData.value).length;
});

// Data displayed in the table (can be filtered/paginated)
const displayedData = ref<USRateSheetEntry[]>([]);
const isLoadingMore = ref(false);
const scrollContainerRef = ref<HTMLElement | null>(null);
const loadMoreTriggerRef = ref<HTMLElement | null>(null);
const PAGE_SIZE = 100;
const offset = ref<number>(0);
const hasMoreData = ref<boolean>(true);

// Debounced search function
const debouncedSearch = useDebounceFn(() => {
  debouncedSearchQuery.value = searchQuery.value.trim().toLowerCase();
  resetAndLoadData();
}, 300);

// Watch raw search query to trigger debounced function
// Store the stop handle returned by watch
const stopSearchWatcher = watch(searchQuery, debouncedSearch);

onMounted(async () => {
  console.log('USRateSheetTable mounted');
  await resetAndLoadData();
});

onBeforeUnmount(() => {
  // Cleanup by stopping the watcher
  if (stopSearchWatcher) {
    stopSearchWatcher();
  }
});

// Combined function to reset state and load/filter data
async function resetAndLoadData() {
  isDataLoading.value = true;
  dataError.value = null;
  displayedData.value = [];
  offset.value = 0;
  hasMoreData.value = true;
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0;
  }

  try {
    if (usRateSheetData.value.length === 0) {
      usRateSheetData.value = await rateSheetService.getData();
      console.log(`Loaded ${usRateSheetData.value.length} total US rate sheet records`);
    }

    loadMoreData();
  } catch (error) {
    console.error('Error loading initial US rate sheet data:', error);
    dataError.value = error instanceof Error ? error.message : 'Failed to load rate sheet data';
    usRateSheetData.value = [];
    displayedData.value = [];
    hasMoreData.value = false;
  } finally {
    isDataLoading.value = false;
  }
}

// Function to load more data for infinite scroll
function loadMoreData() {
  if (isLoadingMore.value || !hasMoreData.value || isDataLoading.value) return;

  isLoadingMore.value = true;
  console.log('Loading more data...');

  try {
    const filtered = applyLocalFilter(usRateSheetData.value);
    totalRecords.value;

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
    dataError.value = error instanceof Error ? error.message : 'Failed to load more data';
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

// Apply local search filter
function applyLocalFilter(data: USRateSheetEntry[]): USRateSheetEntry[] {
  if (!debouncedSearchQuery.value) {
    return data;
  }
  return data.filter((entry) => entry.npanxx.toLowerCase().includes(debouncedSearchQuery.value));
}

function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return 'N/A';
  return rate.toFixed(6);
}

async function handleClearData() {
  if (confirm('Are you sure you want to clear all US rate sheet data?')) {
    isDataLoading.value = true;
    try {
      await rateSheetService.clearData();
      usRateSheetData.value = [];
      displayedData.value = [];
      offset.value = 0;
      hasMoreData.value = false;
      store.clearUsRateSheetData();
      console.log('US Rate Sheet data cleared.');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data.');
    } finally {
      isDataLoading.value = false;
    }
  }
}

function handleExport() {
  if (usRateSheetData.value.length === 0) {
    alert('No data to export');
    return;
  }
  if (isExporting.value) return;

  isExporting.value = true;
  console.log(`Exporting ${totalRecords.value} records...`);

  try {
    const fields = [
      { label: 'NPANXX', value: 'npanxx' },
      { label: 'Interstate Rate', value: 'interRate' },
      { label: 'Intrastate Rate', value: 'intraRate' },
      { label: 'Indeterminate Rate', value: 'ijRate' },
      { label: 'Effective Date', value: 'effectiveDate' },
    ];

    // Prepare data, handling missing effective dates
    const dataToExport = applyLocalFilter(usRateSheetData.value).map((entry) => ({
      ...entry,
      effectiveDate: entry.effectiveDate || '', // Replace undefined/null with empty string for CSV
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
