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
        <BaseButton
          variant="primary"
          size="small"
          @click="downloadCsv"
          :disabled="isDataLoading || isFiltering || displayedData.length === 0 || isExporting"
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

    <!-- Filtering Overlay -->
    <div v-if="isFiltering" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
        <ArrowPathIcon class="animate-spin w-6 h-6 text-accent" />
        <span class="text-white">Filtering data...</span>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="isDataLoading && !isFiltering" class="text-center text-gray-500 py-10">
      <div class="flex items-center justify-center space-x-2">
        <ArrowPathIcon class="animate-spin w-8 h-8" />
        <span>Loading comparison data...</span>
      </div>
    </div>

    <!-- Error Message -->
    <div v-else-if="dataError" class="text-center text-red-500 py-10">
      Error loading data: {{ dataError }}
    </div>

    <!-- No Data Message -->
    <div
      v-else-if="displayedData.length === 0 && !isDataLoading"
      class="text-center text-gray-500 py-10"
    >
      <span>No matching records found.</span>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-x-auto">
      <div class="max-h-[600px] overflow-y-auto">
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
                  header.sortable && currentSortKey === header.key
                    ? currentSortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                "
              >
                <div class="flex" :class="getHeaderClasses(header)">
                  <BaseBadge
                    v-if="header.key === 'destName1' || header.key === 'rate1'"
                    size="small"
                    variant="neutral"
                    class="mb-1 max-w-[150px] truncate"
                    :title="fileName1"
                    >{{ fileName1 }}</BaseBadge
                  >
                  <BaseBadge
                    v-if="header.key === 'destName2' || header.key === 'rate2'"
                    size="small"
                    variant="neutral"
                    class="mb-1 max-w-[150px] truncate"
                    :title="fileName2"
                    >{{ fileName2 }}</BaseBadge
                  >
                  <!-- Wrapper for label and sort icon -->
                  <div class="flex items-center">
                    <span>{{
                      header.label.includes(fileName1) || header.label.includes(fileName2)
                        ? header.label.split(' (')[0]
                        : header.label
                    }}</span>
                    <template v-if="header.sortable">
                      <ArrowUpIcon
                        v-if="currentSortKey === header.key && currentSortDirection === 'asc'"
                        class="w-4 h-4 ml-1.5 text-accent shrink-0"
                      />
                      <ArrowDownIcon
                        v-else-if="currentSortKey === header.key && currentSortDirection === 'desc'"
                        class="w-4 h-4 ml-1.5 text-accent shrink-0"
                      />
                      <ChevronUpDownIcon
                        v-else
                        class="w-4 h-4 ml-1.5 text-gray-400 hover:text-gray-200 shrink-0"
                      />
                    </template>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr
              v-for="record in displayedData"
              :key="record.id || record.dialCode"
              class="hover:bg-gray-700/50"
            >
              <!-- Populate table cells -->
              <td class="px-4 py-2 text-gray-400 text-center">{{ record.dialCode }}</td>
              <!-- Updated Match Status cell -->
              <td class="px-4 py-2 text-center">
                <BaseBadge size="small" variant="neutral">
                  {{ formatMatchStatus(record.matchStatus) }}
                </BaseBadge>
              </td>
              <td class="px-4 py-2 text-gray-400 text-center">{{ record.destName1 ?? 'N/A' }}</td>
              <td class="px-4 py-2 text-gray-400 text-center">{{ record.destName2 ?? 'N/A' }}</td>
              <td class="px-4 py-2 text-gray-200 text-center bg-gray-600/40">
                {{ record.rate1?.toFixed(6) ?? 'N/A' }}
              </td>
              <td class="px-4 py-2 text-gray-200 text-center bg-gray-700/40">
                {{ record.rate2?.toFixed(6) ?? 'N/A' }}
              </td>
              <td class="px-4 py-2 text-gray-400 text-center">
                {{ record.diff?.toFixed(6) ?? 'N/A' }}
              </td>
              <td class="px-4 py-2 text-gray-400 text-center">
                {{ record.diffPercent ? record.diffPercent.toFixed(2) + '%' : 'N/A' }}
              </td>
              <td class="px-4 py-2 text-gray-400 text-center">
                {{ formatCheaperFile(record.cheaperFile) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div
      v-if="displayedData.length > 0"
      class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <!-- Left: Items per page selector -->
      <div class="flex items-center space-x-2">
        <label for="az-items-per-page" class="text-sm text-gray-400">Show:</label>
        <select
          id="az-items-per-page"
          v-model="itemsPerPage"
          class="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 px-2 py-1"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <span class="text-sm text-gray-400">entries per page</span>
      </div>

      <!-- Center: Page navigation -->
      <div class="flex items-center space-x-1">
        <BaseButton
          variant="secondary"
          size="small"
          @click="goToFirstPage(createFilters())"
          :disabled="!canGoToPreviousPage || isDataLoading || isFiltering"
          title="First page"
        >
          &laquo; First
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="small"
          @click="goToPreviousPage(createFilters())"
          :disabled="!canGoToPreviousPage || isDataLoading || isFiltering"
          title="Previous page"
        >
          &lsaquo; Prev
        </BaseButton>

        <span class="text-sm text-gray-400 px-2">Page</span>
        <input
          v-model.number="directPageInput"
          @keyup.enter="handleDirectPageInput(createFilters())"
          type="number"
          min="1"
          :max="totalPages"
          class="w-16 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg text-center focus:ring-primary-500 focus:border-primary-500 px-2 py-1"
          title="Go to page"
        />
        <span class="text-sm text-gray-400 px-2">of {{ totalPages }}</span>

        <BaseButton
          variant="secondary"
          size="small"
          @click="goToNextPage(createFilters())"
          :disabled="!canGoToNextPage || isDataLoading || isFiltering"
          title="Next page"
        >
          Next &rsaquo;
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="small"
          @click="goToLastPage(createFilters())"
          :disabled="!canGoToNextPage || isDataLoading || isFiltering"
          title="Last page"
        >
          Last &raquo;
        </BaseButton>
      </div>

      <!-- Right: Total results info -->
      <div class="text-sm text-gray-400">
        Total: {{ totalFilteredItems.toLocaleString() }} records
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import { useAzStore } from '@/stores/az-store';
  import { useAZTableData } from '@/composables/tables/useAZTableData';
  import type { FilterFunction } from '@/composables/tables/useTableData';
  import { DBName } from '@/types/app-types';
  import { useDebounceFn } from '@vueuse/core';
  import Papa from 'papaparse';
  import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowUpIcon,
    ArrowDownIcon,
  } from '@heroicons/vue/20/solid';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import type { AZDetailedComparisonEntry } from '@/types/domains/az-types';
  import {
    Listbox,
    ListboxButton,
    ListboxLabel,
    ListboxOptions,
    ListboxOption,
  } from '@headlessui/vue';
  import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid';
  import { useCSVExport, formatRate, formatPercentage } from '@/composables/exports/useCSVExport';

  const azStore = useAzStore();

  // Replace any existing export-related refs with the composable
  const { isExporting, exportError, exportToCSV } = useCSVExport();

  // Filter State
  const searchTerm = ref<string>('');
  const selectedCheaper = ref<'' | 'file1' | 'file2' | 'same'>('');
  const selectedMatchStatus = ref<'' | 'both' | 'file1_only' | 'file2_only'>('');

  // Table name state
  const currentTableName = ref<string | null>(null);

  // Initialize the table data composable
  const {
    // Data
    displayedData,
    totalFilteredItems,

    // Loading states
    isDataLoading,
    isFiltering,

    // Error handling
    dataError,

    // Pagination
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    totalPages,
    canGoToPreviousPage,
    canGoToNextPage,
    directPageInput,

    // Sorting
    currentSortKey,
    currentSortDirection,

    // Methods
    initializeDB,
    resetPaginationAndLoad,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
    goToLastPage,
    handleDirectPageInput,
  } = useAZTableData<AZDetailedComparisonEntry>({
    dbName: DBName.AZ_PRICING_COMPARISON,
    tableName: 'az_comparison_results',
    itemsPerPage: 50,
    sortKey: 'dialCode',
    sortDirection: 'asc',
  });

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

  // Create filter functions based on current filter state
  function createFilters(): FilterFunction<AZDetailedComparisonEntry>[] {
    const filters: FilterFunction<AZDetailedComparisonEntry>[] = [];

    // Search filter
    const term = searchTerm.value.toLowerCase().trim();
    if (term) {
      filters.push(
        (record) =>
          record.dialCode.toLowerCase().includes(term) ||
          record.destName1?.toLowerCase().includes(term) ||
          record.destName2?.toLowerCase().includes(term)
      );
    }

    // Cheaper file filter
    if (selectedCheaper.value) {
      filters.push((record) => record.cheaperFile === selectedCheaper.value);
    }

    // Match status filter
    if (selectedMatchStatus.value) {
      filters.push((record) => record.matchStatus === selectedMatchStatus.value);
    }

    return filters;
  }

  // Debounced function for filter changes
  const debouncedResetPaginationAndLoad = useDebounceFn(async () => {
    await resetPaginationAndLoad(createFilters());
  }, 300);

  // --- Helper function to format match status ---
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

  // --- Helper function to format Cheaper File ---
  function formatCheaperFile(cheaper?: 'file1' | 'file2' | 'same'): string {
    if (cheaper === 'file1') {
      return fileName1.value;
    } else if (cheaper === 'file2') {
      return fileName2.value;
    } else if (cheaper === 'same') {
      return 'Same Rate';
    } else {
      return 'N/A';
    }
  }

  // --- Helper function to determine header classes for layout ---
  function getHeaderClasses(header: SortableAZCompColumn): Record<string, boolean | undefined> {
    const isBadgeHeader = ['destName1', 'rate1', 'destName2', 'rate2'].includes(
      header.key as string
    );

    if (isBadgeHeader) {
      return {
        'flex-col': true,
        'items-center': true,
      };
    } else {
      return {
        'items-center': true,
        'justify-center': header.textAlign === 'text-center',
        'justify-start': header.textAlign === 'text-left' || !header.textAlign,
      };
    }
  }

  // Watch for table name changes from the store
  watch(
    () => azStore.getDetailedComparisonTableName,
    (newTableName) => {
      if (newTableName !== currentTableName.value) {
        currentTableName.value = newTableName;
        if (newTableName) {
          resetPaginationAndLoad(createFilters());
        }
      }
    },
    { immediate: true }
  );

  // Watch for filter changes
  watch([searchTerm, selectedCheaper, selectedMatchStatus], () => {
    debouncedResetPaginationAndLoad();
  });

  // Watch for items per page changes
  watch(itemsPerPage, () => {
    resetPaginationAndLoad(createFilters());
  });

  // CSV Export function
  function downloadCsv(): void {
    if (!displayedData.value || displayedData.value.length === 0) {
      console.warn('No data currently displayed to download.');
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

      const rows = displayedData.value.map((record) => [
        record.dialCode,
        formatMatchStatus(record.matchStatus),
        record.destName1 ?? 'n/a',
        record.destName2 ?? 'n/a',
        formatRate(record.rate1),
        formatRate(record.rate2),
        formatRate(record.diff),
        formatPercentage(record.diffPercent),
        formatCheaperFile(record.cheaperFile),
      ]);

      exportToCSV(
        { headers, rows },
        {
          filename: 'az-compare',
          quoteFields: true,
        }
      );
    } catch (err: any) {
      console.error('Error during CSV export:', err);
      dataError.value = 'Failed to generate CSV file.';
    }
  }

  // Sorting Handler
  async function handleSort(columnKey: keyof AZDetailedComparisonEntry | string) {
    const header = tableHeaders.value.find((h) => h.key === columnKey);
    if (!header || !header.sortable) return;

    if (currentSortKey.value === columnKey) {
      currentSortDirection.value = currentSortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortKey.value = columnKey as string;
      currentSortDirection.value = 'asc';
    }

    await resetPaginationAndLoad(createFilters());
  }
</script>
