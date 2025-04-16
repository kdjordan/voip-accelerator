<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <!-- Filter Controls -->
    <div class="mb-4 flex flex-wrap gap-4 items-center">
      <!-- Dial Code/Dest Name Search -->
      <div>
        <label for="az-search" class="block text-sm font-medium text-gray-400 mb-1"
          >Search Code/Destination</label
        >
        <input
          type="text"
          id="az-search"
          v-model="searchTerm"
          placeholder="Enter code or destination..."
          class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
        />
      </div>

      <!-- Example Cheaper Rate Filter -->
      <div>
        <label for="cheaper-filter" class="block text-sm font-medium text-gray-400 mb-1"
          >Cheaper Rate</label
        >
        <select
          id="cheaper-filter"
          v-model="selectedCheaper"
          class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
        >
          <option value="">All</option>
          <option value="file1">File 1 Cheaper</option>
          <option value="file2">File 2 Cheaper</option>
          <option value="same">Same Rate</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading && comparisonData.length === 0" class="text-center text-gray-500 py-10">
      Loading detailed comparison data...
    </div>
    <div v-else-if="error" class="text-center text-red-500 py-10">
      Error loading data: {{ error }}
    </div>
    <div
      v-else-if="comparisonData.length === 0 && !isLoading"
      class="text-center text-gray-500 py-10"
    >
      No matching comparison data found. Ensure reports have been generated or adjust filters.
    </div>
    <div v-else class="overflow-x-auto">
      <div ref="scrollContainerRef" class="max-h-[600px] overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-700 text-sm">
          <thead class="bg-gray-800 sticky top-0 z-10">
            <tr>
              <!-- Headers based on AZDetailedComparisonEntry -->
              <th class="px-4 py-2 text-left text-gray-300 min-w-[120px]">Dial Code</th>
              <th class="px-4 py-2 text-left text-gray-300 min-w-[250px]">
                Dest Name
                <span
                  class="text-green-300 bg-green-900/50 border border-green-700 font-medium px-2 py-0.5 rounded-md"
                  >{{ fileName1 }}</span
                >
              </th>
              <th class="px-4 py-2 text-left text-gray-300 min-w-[250px]">
                Dest Name
                <span
                  class="text-blue-300 bg-blue-900/50 border border-blue-700 font-medium px-2 py-0.5 rounded-md"
                  >{{ fileName2 }}</span
                >
              </th>
              <th class="px-4 py-2 text-left text-gray-300 min-w-[200px]">
                Rate
                <span
                  class="text-green-300 bg-green-900/50 border border-green-700 font-medium px-2 py-0.5 rounded-md"
                  >{{ fileName1 }}</span
                >
              </th>
              <th class="px-4 py-2 text-left text-gray-300 min-w-[200px]">
                Rate
                <span
                  class="text-blue-300 bg-blue-900/50 border border-blue-700 font-medium px-2 py-0.5 rounded-md"
                  >{{ fileName2 }}</span
                >
              </th>
              <th class="px-4 py-2 text-left text-gray-300 min-w-[120px]">Diff</th>
              <th class="px-4 py-2 text-left text-gray-300 min-w-[100px]">Diff %</th>
              <th class="px-4 py-2 text-left text-gray-300 min-w-[120px]">Cheaper File</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr
              v-for="record in comparisonData"
              :key="record.dialCode"
              class="hover:bg-gray-700/50"
            >
              <!-- Populate table cells -->
              <td class="px-4 py-2 text-gray-400">{{ record.dialCode }}</td>
              <td class="px-4 py-2 text-gray-400">{{ record.destName1 }}</td>
              <td class="px-4 py-2 text-gray-400">{{ record.destName2 }}</td>
              <td class="px-4 py-2 text-white">{{ record.rate1?.toFixed(6) }}</td>
              <td class="px-4 py-2 text-white">{{ record.rate2?.toFixed(6) }}</td>
              <td class="px-4 py-2" :class="getDiffClass(record.diff)">
                {{ record.diff?.toFixed(6) }}
              </td>
              <td class="px-4 py-2" :class="getDiffPercentClass(record.diffPercent)">
                {{ record.diffPercent?.toFixed(2) }}%
              </td>
              <td class="px-4 py-2" :class="getCheaperClass(record.cheaperFile)">
                {{ record.cheaperFile }}
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Trigger for loading more -->
        <div ref="loadMoreTriggerRef" class="h-10"></div>
        <!-- Loading indicator -->
        <div v-if="isLoadingMore" class="text-center text-gray-500 py-4">Loading more...</div>
        <div
          v-if="!hasMoreData && comparisonData.length > 0"
          class="text-center text-gray-600 py-4"
        >
          End of results.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';
import { useAzStore } from '@/stores/az-store';
import { AZService } from '@/services/az.service';
import type {
  AZDetailedComparisonEntry,
  AZDetailedComparisonFilters,
} from '@/types/domains/az-types';

const azStore = useAzStore();
const azService = new AZService();

const comparisonData = ref<AZDetailedComparisonEntry[]>([]);
const isLoading = ref<boolean>(false); // Initial loading
const isLoadingMore = ref<boolean>(false); // Subsequent page loading
const error = ref<string | null>(null);

// Filter State
const searchTerm = ref<string>('');
const selectedCheaper = ref<'' | 'file1' | 'file2' | 'same'>('');

// Pagination State
const offset = ref<number>(0);
const pageSize = 50; // Items per page
const hasMoreData = ref<boolean>(true);
const currentTableName = ref<string | null>(null);

// Infinite Scroll Elements
const loadMoreTriggerRef = ref<HTMLElement | null>(null);
const scrollContainerRef = ref<HTMLElement | null>(null);

// --- Get Filenames for Headers ---
const fileName1 = computed(() => {
  const names = azStore.getFileNames;
  return names.length > 0 ? names[0].replace(/\.csv$/i, '') : 'File 1';
});

const fileName2 = computed(() => {
  const names = azStore.getFileNames;
  return names.length > 1 ? names[1].replace(/\.csv$/i, '') : 'File 2';
});
// --- End Filenames ---

async function fetchData(tableName: string | null, reset = false) {
  if (!tableName || isLoadingMore.value || (!hasMoreData.value && !reset)) {
    if (!tableName && reset) comparisonData.value = []; // Clear data if no table name during reset
    return;
  }

  const initialLoad = reset || comparisonData.value.length === 0;
  if (initialLoad) isLoading.value = true;
  else isLoadingMore.value = true;

  error.value = null;

  try {
    const filters: AZDetailedComparisonFilters = {};
    if (searchTerm.value) filters.search = searchTerm.value;
    if (selectedCheaper.value) filters.cheaper = selectedCheaper.value;

    const newData = await azService.getPagedDetailedComparisonData(
      tableName,
      pageSize,
      offset.value,
      filters
    );

    console.log(
      `[AZDetailedComparisonTable] Loaded ${newData.length} records from ${tableName} (offset: ${offset.value})`
    );

    if (reset) {
      comparisonData.value = newData;
    } else {
      comparisonData.value.push(...newData);
    }

    offset.value += newData.length;
    hasMoreData.value = newData.length === pageSize;
  } catch (err: any) {
    console.error('Error loading detailed AZ comparison data:', err);
    error.value = err.message || 'Failed to load data';
    hasMoreData.value = false;
  } finally {
    if (initialLoad) isLoading.value = false;
    isLoadingMore.value = false;
  }
}

async function resetAndFetchData() {
  console.log('[AZDetailedComparisonTable] Resetting and fetching data...');
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0;
  }
  offset.value = 0;
  hasMoreData.value = true;
  error.value = null;
  isLoadingMore.value = false;

  await fetchData(currentTableName.value, true);
}

watch(
  () => azStore.getDetailedComparisonTableName,
  (newTableName) => {
    console.log(`[AZDetailedComparisonTable] Table name changed to: ${newTableName}`);
    if (newTableName !== currentTableName.value) {
      currentTableName.value = newTableName;
      resetAndFetchData();
    }
  },
  { immediate: true }
);

watch([searchTerm, selectedCheaper], () => {
  resetAndFetchData();
});

useIntersectionObserver(
  loadMoreTriggerRef,
  ([{ isIntersecting }]) => {
    if (
      isIntersecting &&
      hasMoreData.value &&
      !isLoadingMore.value &&
      !isLoading.value &&
      currentTableName.value
    ) {
      console.log(
        '[AZDetailedComparisonTable] Load more trigger intersecting, loading next page...'
      );
      fetchData(currentTableName.value);
    }
  },
  {
    root: scrollContainerRef.value,
    threshold: 0.1,
  }
);

function getDiffClass(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return 'text-gray-400';
  return value > 0 ? 'text-red-400' : 'text-green-400';
}

function getDiffPercentClass(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return 'text-gray-400';
  return value > 0 ? 'text-red-400' : 'text-green-400';
}

function getCheaperClass(cheaper: 'file1' | 'file2' | 'same' | null | undefined): string {
  if (cheaper === null || cheaper === undefined || cheaper === 'same') return 'text-gray-400';
  return cheaper === 'file1' ? 'text-green-400' : 'text-red-400';
}
</script>

<style scoped>
thead th {
  background-color: #1f2937;
}
</style>
