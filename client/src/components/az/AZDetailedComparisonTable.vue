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

      <!-- Cheaper Rate Filter -->
      <div class="w-52">
        <Listbox v-model="selectedCheaper">
          <div class="relative mt-1">
            <ListboxLabel class="block text-sm font-medium text-gray-400 mb-1"
              >Rate Comparison</ListboxLabel
            >
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm border border-gray-700 text-white"
            >
              <span class="block truncate">{{
                rateComparisonOptions.find((opt) => opt.value === selectedCheaper)?.label ??
                'Select...'
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
                class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-20"
              >
                <ListboxOption
                  v-slot="{ active, selected }"
                  v-for="option in rateComparisonOptions"
                  :key="option.value"
                  :value="option.value"
                  as="template"
                >
                  <li
                    :class="[
                      active ? 'bg-accent/20 text-accent' : 'text-gray-300',
                      'relative cursor-default select-none py-2 pl-10 pr-4',
                    ]"
                  >
                    <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{
                      option.label
                    }}</span>
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
      </div>

      <!-- Match Status Filter -->
      <div class="w-52">
        <Listbox v-model="selectedMatchStatus">
          <div class="relative mt-1">
            <ListboxLabel class="block text-sm font-medium text-gray-400 mb-1"
              >Match Status</ListboxLabel
            >
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm border border-gray-700 text-white"
            >
              <span class="block truncate">{{
                matchStatusOptions.find((opt) => opt.value === selectedMatchStatus)?.label ??
                'Select...'
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
                class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-20"
              >
                <ListboxOption
                  v-slot="{ active, selected }"
                  v-for="option in matchStatusOptions"
                  :key="option.value"
                  :value="option.value"
                  as="template"
                >
                  <li
                    :class="[
                      active ? 'bg-accent/20 text-accent' : 'text-gray-300',
                      'relative cursor-default select-none py-2 pl-10 pr-4',
                    ]"
                  >
                    <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{
                      option.label
                    }}</span>
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
      </div>

      <!-- Download CSV Button -->
      <div class="ml-auto self-end">
        <!-- Use BaseButton for Export -->
        <BaseButton
          variant="primary"
          size="small"
          @click="downloadCsv"
          :disabled="isLoading || isLoadingMore || comparisonData.length === 0 || isExporting"
          title="Export Current View"
          class="min-w-[180px]"
        >
          <span v-if="isExporting" class="flex items-center justify-center">
            <ArrowPathIcon class="animate-spin w-4 h-4 mr-1.5" />
            Exporting...
          </span>
          <span v-else class="flex items-center justify-center">
            <ArrowDownTrayIcon class="w-4 h-4 mr-1.5" />
            Export Current View
          </span>
        </BaseButton>
      </div>
    </div>

    <!-- 1. Loading Spinner (show whenever isLoading is true) -->
    <div v-if="isLoading" class="text-center text-gray-500 py-10">
      <div class="flex items-center justify-center space-x-2">
        <ArrowPathIcon class="animate-spin w-8 h-8" />
        <span>Loading comparison data...</span>
      </div>
    </div>

    <!-- 2. Error Message -->
    <div v-else-if="error" class="text-center text-red-500 py-10">
      Error loading data: {{ error }}
    </div>

    <!-- 3. No Data Message Block (Now contains spinner instead of text) -->
    <div v-else-if="comparisonData.length === 0" class="text-center text-gray-500 py-10">
      <!-- Spinner content moved here -->
      <div class="flex items-center justify-center space-x-2">
        <span>No matching records found.</span>
      </div>
    </div>

    <!-- 4. Data Table (show if not loading, no error, and data exists) -->
    <div v-else class="overflow-x-auto">
      <div ref="scrollContainerRef" class="max-h-[600px] overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-700 text-sm">
          <thead class="bg-gray-800 sticky top-0 z-10">
            <tr>
              <th
                v-for="header in tableHeaders"
                :key="header.key"
                scope="col"
                class="px-4 py-2 text-gray-300 align-bottom whitespace-nowrap"
                :class="[
                  header.textAlign || 'text-left',
                  {
                    'cursor-pointer hover:bg-gray-700/50': header.sortable,
                    'min-w-[120px]': ['dialCode', 'matchStatus', 'diff', 'cheaperFile'].includes(
                      header.key as string
                    ),
                    'min-w-[250px]': ['destName1', 'destName2'].includes(header.key as string),
                    'min-w-[200px]': ['rate1', 'rate2'].includes(header.key as string),
                    'min-w-[100px]': header.key === 'diffPercent',
                  },
                ]"
                @click="header.sortable ? handleSort(header.key) : undefined"
                :aria-sort="
                  header.sortable && sortColumnKey === header.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                "
              >
                <div
                  class="flex items-center"
                  :class="{
                    'justify-center': header.textAlign === 'text-center',
                    'justify-start': header.textAlign === 'text-left' || !header.textAlign,
                  }"
                >
                  <BaseBadge
                    v-if="header.key === 'destName1' || header.key === 'rate1'"
                    size="small"
                    variant="success"
                    class="mb-1 max-w-[150px] truncate inline-block mr-1"
                    :title="fileName1"
                    >{{ fileName1 }}</BaseBadge
                  >
                  <BaseBadge
                    v-if="header.key === 'destName2' || header.key === 'rate2'"
                    size="small"
                    variant="info"
                    class="mb-1 max-w-[150px] truncate inline-block mr-1"
                    :title="fileName2"
                    >{{ fileName2 }}</BaseBadge
                  >
                  <span>{{
                    header.label.includes(fileName1) || header.label.includes(fileName2)
                      ? header.label.split(' (')[0]
                      : header.label
                  }}</span>
                  <template v-if="header.sortable">
                    <ArrowUpIcon
                      v-if="sortColumnKey === header.key && sortDirection === 'asc'"
                      class="w-4 h-4 ml-1.5 text-accent shrink-0"
                    />
                    <ArrowDownIcon
                      v-else-if="sortColumnKey === header.key && sortDirection === 'desc'"
                      class="w-4 h-4 ml-1.5 text-accent shrink-0"
                    />
                    <ChevronUpDownIcon
                      v-else
                      class="w-4 h-4 ml-1.5 text-gray-400 hover:text-gray-200 shrink-0"
                    />
                  </template>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr
              v-for="record in comparisonData"
              :key="record.id || record.dialCode"
              class="hover:bg-gray-700/50"
            >
              <!-- Populate table cells -->
              <td class="px-4 py-2 text-gray-400 text-center">{{ record.dialCode }}</td>
              <!-- Updated Match Status cell -->
              <td class="px-4 py-2 text-center">
                <BaseBadge
                  size="small"
                  :variant="
                    record.matchStatus === 'both'
                      ? 'warning'
                      : record.matchStatus === 'file1_only'
                        ? 'success'
                        : record.matchStatus === 'file2_only'
                          ? 'info'
                          : 'neutral'
                  "
                >
                  {{ formatMatchStatus(record.matchStatus) }}
                </BaseBadge>
              </td>
              <td class="px-4 py-2 text-gray-400 text-center">{{ record.destName1 ?? 'N/A' }}</td>
              <td class="px-4 py-2 text-gray-400 text-center">{{ record.destName2 ?? 'N/A' }}</td>
              <td class="px-4 py-2 text-white text-center">
                {{ record.rate1?.toFixed(6) ?? 'N/A' }}
              </td>
              <td class="px-4 py-2 text-white text-center">
                {{ record.rate2?.toFixed(6) ?? 'N/A' }}
              </td>
              <td class="px-4 py-2 text-center" :class="getDiffClass(record.diff)">
                {{ record.diff?.toFixed(6) ?? 'N/A' }}
              </td>
              <td class="px-4 py-2 text-center" :class="getDiffPercentClass(record.diffPercent)">
                {{ record.diffPercent ? record.diffPercent.toFixed(2) + '%' : 'N/A' }}
              </td>
              <td class="px-4 py-2 text-center">
                <span :class="getCheaperClass(record.cheaperFile)">
                  {{ formatCheaperFile(record.cheaperFile) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Trigger for loading more -->
        <div ref="loadMoreTriggerRef" class="h-10"></div>

        <!-- Loading indicator for subsequent pages -->
        <div v-if="isLoadingMore" class="text-center text-gray-500 py-4">
          <div class="flex items-center justify-center space-x-2">
            <ArrowPathIcon class="animate-spin w-5 h-5" />
            <span>Loading more...</span>
          </div>
        </div>

        <!-- End of results message -->
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
  import Papa from 'papaparse';
  import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowUpIcon,
    ArrowDownIcon,
  } from '@heroicons/vue/20/solid';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import type {
    AZDetailedComparisonEntry,
    AZDetailedComparisonFilters,
  } from '@/types/domains/az-types';
  import {
    Listbox,
    ListboxButton,
    ListboxLabel,
    ListboxOptions,
    ListboxOption,
  } from '@headlessui/vue';
  import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid';

  const azStore = useAzStore();
  const azService = new AZService();

  const comparisonData = ref<AZDetailedComparisonEntry[]>([]);
  const isLoading = ref<boolean>(false); // Initial loading
  const isLoadingMore = ref<boolean>(false); // Subsequent page loading
  const error = ref<string | null>(null);
  const isExporting = ref(false);

  // Filter State
  const searchTerm = ref<string>('');
  const selectedCheaper = ref<'' | 'file1' | 'file2' | 'same'>('');
  const selectedMatchStatus = ref<'' | 'both' | 'file1_only' | 'file2_only'>('');

  // Pagination State
  const offset = ref<number>(0);
  const pageSize = 50; // Items per page
  const hasMoreData = ref<boolean>(true);
  const currentTableName = ref<string | null>(null);

  // Infinite Scroll Elements
  const loadMoreTriggerRef = ref<HTMLElement | null>(null);
  const scrollContainerRef = ref<HTMLElement | null>(null);

  // --- Sorting State ---
  const sortColumnKey = ref<keyof AZDetailedComparisonEntry | string | null>(null);
  const sortDirection = ref<'asc' | 'desc'>('asc');

  interface SortableAZCompColumn {
    key: keyof AZDetailedComparisonEntry | string;
    label: string;
    sortable: boolean;
    textAlign?: string;
    getValue?: (record: AZDetailedComparisonEntry) => any;
  }

  const tableHeaders = computed<SortableAZCompColumn[]>(() => [
    { key: 'dialCode', label: 'Dial Code', sortable: true, textAlign: 'center' },
    { key: 'matchStatus', label: 'Match Status', sortable: true, textAlign: 'center' },
    {
      key: 'destName1',
      label: `Dest Name (${fileName1.value})`,
      sortable: true,
      textAlign: 'center',
    },
    {
      key: 'destName2',
      label: `Dest Name (${fileName2.value})`,
      sortable: true,
      textAlign: 'center',
    },
    { key: 'rate1', label: `Rate (${fileName1.value})`, sortable: true, textAlign: 'center' },
    { key: 'rate2', label: `Rate (${fileName2.value})`, sortable: true, textAlign: 'center' },
    { key: 'diff', label: 'Diff', sortable: true, textAlign: 'center' },
    { key: 'diffPercent', label: 'Diff %', sortable: true, textAlign: 'center' },
    { key: 'cheaperFile', label: 'Cheaper File', sortable: true, textAlign: 'center' },
  ]);
  // --- End Sorting State ---

  // --- Get Filenames for Headers ---
  const fileName1 = computed(() => {
    const names = azStore.getFileNames;
    return names.length > 0 ? names[0].replace(/\.csv$/i, '') : 'File 1';
  });

  const fileName2 = computed(() => {
    const names = azStore.getFileNames;
    return names.length > 1 ? names[1].replace(/\.csv$/i, '') : 'File 2';
  });

  // --- Dynamic Filter Options ---
  const rateComparisonOptions = computed(() => [
    { value: '', label: 'All Comparisons' },
    { value: 'file1', label: `${fileName1.value} Cheaper` },
    { value: 'file2', label: `${fileName2.value} Cheaper` },
    { value: 'same', label: 'Same Rate' },
  ]);

  const matchStatusOptions = computed(() => [
    { value: '', label: 'All Statuses' },
    { value: 'both', label: 'Matched in Both' },
    { value: 'file1_only', label: `${fileName1.value} Only` },
    { value: 'file2_only', label: `${fileName2.value} Only` },
  ]);

  // --- Helper function to format match status (Updated Again) ---
  function formatMatchStatus(status: 'both' | 'file1_only' | 'file2_only'): string {
    switch (status) {
      case 'both':
        return 'BOTH';
      case 'file1_only':
        return fileName1.value;
      case 'file2_only':
        return fileName2.value;
      default:
        return 'Unknown';
    }
  }

  // --- Helper function to format Cheaper File (New) ---
  function formatCheaperFile(cheaper?: 'file1' | 'file2' | 'same'): string {
    if (cheaper === 'file1') {
      return fileName1.value;
    } else if (cheaper === 'file2') {
      return fileName2.value;
    } else if (cheaper === 'same') {
      return 'Same Rate';
    } else {
      return 'N/A'; // Handle undefined/null case
    }
  }

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
      if (selectedMatchStatus.value) filters.matchStatus = selectedMatchStatus.value;
      // Add sort parameters to filters
      if (sortColumnKey.value) filters.sortKey = sortColumnKey.value as string; // Cast needed if keyof AZDetailedComparisonEntry
      if (sortColumnKey.value && sortDirection.value) filters.sortDir = sortDirection.value;

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
    isLoading.value = true; // Ensure loading state is active

    // Explicitly clear the data array *before* fetching new data on reset
    comparisonData.value = [];

    await fetchData(currentTableName.value, true); // Pass reset = true
  }

  watch(
    () => azStore.getDetailedComparisonTableName,
    (newTableName) => {
      console.log(`[AZDetailedComparisonTable] Table name changed to: ${newTableName}`);
      if (newTableName !== currentTableName.value) {
        currentTableName.value = newTableName;
        // Reset sort when table changes, or decide if it should persist
        // sortColumnKey.value = null;
        resetAndFetchData();
      }
    },
    { immediate: true }
  );

  watch([searchTerm, selectedCheaper, selectedMatchStatus], () => {
    // Reset sort to default when primary filters change
    sortColumnKey.value = null; // Or set to a default like 'dialCode'
    sortDirection.value = 'asc';
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

  function getCheaperClass(cheaper?: 'file1' | 'file2' | 'same'): string {
    const baseStyle = 'font-medium px-2 py-0.5 rounded-md text-xs'; // Base button style
    if (cheaper === 'file1') {
      // File 1 is cheaper - Green style
      return `${baseStyle} text-green-300 bg-green-900/50 border border-green-700`;
    } else if (cheaper === 'file2') {
      // File 2 is cheaper - Blue style (matching header)
      return `${baseStyle} text-blue-300 bg-blue-900/50 border border-blue-700`;
    } else if (cheaper === 'same') {
      // Same Rate - Neutral/Gray style (similar to orange but gray)
      return `${baseStyle} text-gray-300 bg-gray-700/50 border border-gray-600`;
    } else {
      // N/A or undefined - Plain text style
      return 'text-gray-500';
    }
  }

  // --- CSV Download Function ---
  function downloadCsv(): void {
    // Use comparisonData.value which reflects the current UI view (filtered + paginated)
    if (!comparisonData.value || comparisonData.value.length === 0) {
      console.warn('No data currently displayed to download.');
      // Optionally show a user notification
      return;
    }

    try {
      const headers = [
        'Dial Code',
        'Match Status',
        `Dest Name ${fileName1.value}`,
        `Dest Name ${fileName2.value}`,
        `Rate ${fileName1.value}`,
        `Rate ${fileName2.value}`,
        'Diff',
        'Diff %',
        'Cheaper File',
      ];

      // Map the currently displayed data (comparisonData) for export
      const dataToExport = comparisonData.value.map((record) => ({
        'Dial Code': record.dialCode,
        'Match Status': formatMatchStatus(record.matchStatus),
        [`Dest Name ${fileName1.value}`]: record.destName1 ?? 'n/a',
        [`Dest Name ${fileName2.value}`]: record.destName2 ?? 'n/a',
        [`Rate ${fileName1.value}`]: record.rate1?.toFixed(6) ?? 'n/a',
        [`Rate ${fileName2.value}`]: record.rate2?.toFixed(6) ?? 'n/a',
        Diff: record.diff?.toFixed(6) ?? 'n/a',
        'Diff %': record.diffPercent ? `${record.diffPercent.toFixed(2)}%` : 'n/a',
        'Cheaper File': formatCheaperFile(record.cheaperFile),
      }));

      const csv = Papa.unparse(
        {
          fields: headers,
          data: dataToExport.map((row) => headers.map((header) => row[header])),
        },
        {
          header: true,
          quotes: true, // Ensure fields with commas or quotes are properly quoted
        }
      );

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `az-compare-${timestamp}.csv`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (csvError) {
      console.error('Error generating or downloading CSV:', csvError);
      // Optionally show a user notification about the error
      error.value = 'Failed to generate CSV file.';
    }
  }

  // --- Sorting Handler ---
  function handleSort(columnKey: keyof AZDetailedComparisonEntry | string) {
    const header = tableHeaders.value.find((h) => h.key === columnKey);
    if (!header || !header.sortable) return;

    if (sortColumnKey.value === columnKey) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumnKey.value = columnKey;
      sortDirection.value = 'asc';
    }
    resetAndFetchData(); // Refetch data with new sort parameters
  }
  // --- End Sorting Handler ---
</script>
