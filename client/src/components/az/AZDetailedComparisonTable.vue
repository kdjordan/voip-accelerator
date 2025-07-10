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

      <!-- Expand/Collapse All Buttons -->
      <div class="flex gap-2">
        <BaseButton
          variant="secondary"
          size="small"
          @click="expandAll(groupedDestinations)"
          :disabled="isDataLoading || isFiltering"
          title="Expand all grouped destinations"
        >
          Expand All
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="small"
          @click="collapseAll()"
          :disabled="isDataLoading || isFiltering"
          title="Collapse all grouped destinations"
        >
          Collapse All
        </BaseButton>
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
      <div class="p-6 flex items-center space-x-3">
        <ArrowPathIcon class="animate-spin w-6 h-6 text-grey-400" />
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

    <!-- Grouped Data Display -->
    <div v-else class="overflow-hidden">
      <div class="max-h-[600px] overflow-y-auto space-y-2 pr-2">
        <!-- Iterate through grouped destinations -->
        <div v-for="destination in groupedDestinations" :key="destination.destinationKey" class="border border-gray-700 rounded-lg overflow-hidden mb-2">
          
          <!-- Destination Header Row -->
          <div 
            class="bg-gray-800 px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
            :class="{ 'border-b border-gray-700': destination.isExpanded }"
            @click="handleDestinationToggle(destination)"
          >
            <div class="flex items-center justify-between">
              <!-- Left: Destination Info -->
              <div class="flex items-center space-x-3">
                <!-- Expansion Icon (for all destinations now) -->
                <div class="text-gray-400">
                  <ChevronRightIcon v-if="!destination.isExpanded" class="w-5 h-5" />
                  <ChevronDownIcon v-else class="w-5 h-5" />
                </div>
                
                <!-- Destination Name -->
                <div class="flex flex-col">
                  <div class="font-medium text-white">
                    {{ destination.destName1 || destination.destName2 || 'Unknown Destination' }}
                  </div>
                  <div class="text-sm text-gray-400">
                    {{ destination.codeCount }} code{{ destination.codeCount !== 1 ? 's' : '' }}
                  </div>
                </div>
              </div>
              
              <!-- Right: Summary Info -->
              <div class="flex items-center space-x-4">
                
                <!-- Match Status Badge (moved to end) -->
                <BaseBadge size="small" variant="neutral">
                  {{ formatMatchStatus(destination.matchStatus) }}
                </BaseBadge>
              </div>
            </div>
            
            <!-- Rate Distribution Summary (for grouped mode when collapsed) -->
            <div v-if="destination.displayMode === 'grouped' && !destination.isExpanded" class="mt-2 text-sm text-gray-400">
              {{ formatRateDistributionSummary(destination) }}
            </div>
          </div>
          
          <!-- Expanded Content (for all destinations) -->
          <div v-if="destination.isExpanded" class="bg-gray-900/50">
            
            <!-- View Toggle Buttons -->
            <div class="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
              <div class="flex space-x-2">
                <BaseButton
                  variant="secondary"
                  size="small"
                  :class="{ 'bg-accent/20': destination.expandedView === 'codes' }"
                  @click="handleViewChange(destination, 'codes')"
                >
                  View All Codes
                </BaseButton>
                <BaseButton
                  variant="secondary"
                  size="small"
                  :class="{ 'bg-accent/20': destination.expandedView === 'rate-groups' }"
                  @click="handleViewChange(destination, 'rate-groups')"
                >
                  View Rate Groups
                </BaseButton>
              </div>
            </div>
            
            <!-- Codes View -->
            <div v-if="destination.expandedView === 'codes'" class="p-4">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-700 text-sm">
                  <thead class="bg-gray-800">
                    <tr>
                      <th class="px-3 py-2 text-gray-300 text-center">Dial Code</th>
                      <th class="px-3 py-2 text-gray-300 text-center">Rate {{ fileName1 }}</th>
                      <th class="px-3 py-2 text-gray-300 text-center">Rate {{ fileName2 }}</th>
                      <th class="px-3 py-2 text-gray-300 text-center">Diff</th>
                      <th class="px-3 py-2 text-gray-300 text-center">Diff %</th>
                      <th class="px-3 py-2 text-gray-300 text-center">Cheaper</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-800">
                    <tr v-for="code in destination.codes" :key="code.dialCode" class="hover:bg-gray-700/50">
                      <td class="px-3 py-2 text-gray-400 text-center">{{ code.dialCode }}</td>
                      <td class="px-3 py-2 text-gray-200 text-center">{{ code.rate1?.toFixed(6) ?? 'N/A' }}</td>
                      <td class="px-3 py-2 text-gray-200 text-center">{{ code.rate2?.toFixed(6) ?? 'N/A' }}</td>
                      <td class="px-3 py-2 text-center" :class="code.diff && code.diff < 0 ? 'text-green-400' : code.diff && code.diff > 0 ? 'text-red-400' : 'text-gray-400'">
                        {{ code.diff?.toFixed(6) ?? 'N/A' }}
                      </td>
                      <td class="px-3 py-2 text-center" :class="code.diffPercent && code.diffPercent < 0 ? 'text-green-400' : code.diffPercent && code.diffPercent > 0 ? 'text-red-400' : 'text-gray-400'">
                        {{ code.diffPercent ? code.diffPercent.toFixed(2) + '%' : 'N/A' }}
                      </td>
                      <td class="px-3 py-2 text-gray-400 text-center">{{ formatCheaperFile(code.cheaperFile) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Rate Groups View -->
            <div v-else-if="destination.expandedView === 'rate-groups'" class="p-4 space-y-3">
              <div v-for="(group, index) in getRateComparisonGroups(destination)" :key="index" class="bg-gray-800/50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <!-- Rate Comparison -->
                  <div class="flex items-center space-x-4">
                    <div class="text-sm">
                      <span class="text-gray-400">{{ fileName1 }}:</span>
                      <span class="text-white font-medium">${{ group.file1Rate?.toFixed(6) ?? 'N/A' }}</span>
                    </div>
                    <div class="text-gray-500">|</div>
                    <div class="text-sm">
                      <span class="text-gray-400">{{ fileName2 }}:</span>
                      <span class="text-white font-medium">${{ group.file2Rate?.toFixed(6) ?? 'N/A' }}</span>
                    </div>
                    <div v-if="group.diff !== undefined" class="text-sm">
                      <span class="text-gray-400">Diff:</span>
                      <span :class="group.diff < 0 ? 'text-green-400' : group.diff > 0 ? 'text-red-400' : 'text-gray-300'">
                        ${{ group.diff.toFixed(6) }} ({{ group.diffPercent?.toFixed(1) }}%)
                      </span>
                    </div>
                  </div>
                  
                  <!-- Cheaper Indicator -->
                  <div v-if="group.cheaperFile">
                    <BaseBadge 
                      size="small" 
                      :variant="group.cheaperFile === 'file1' ? 'success' : group.cheaperFile === 'file2' ? 'warning' : 'neutral'"
                    >
                      {{ group.cheaperFile === 'file1' ? fileName1 : group.cheaperFile === 'file2' ? fileName2 : 'Same' }} Cheaper
                    </BaseBadge>
                  </div>
                </div>
                
                <!-- Code Count and Sample -->
                <div class="text-sm text-gray-400">
                  <span class="font-medium">{{ group.count }}</span> code{{ group.count !== 1 ? 's' : '' }} with {{ group.count === 1 ? 'this rate' : 'these rates' }}
                </div>
                
                <!-- Show first few codes -->
                <div class="mt-2 text-xs text-gray-500">
                  {{ group.codes.slice(0, 10).join(', ') }}{{ group.codes.length > 10 ? ` ... +${group.codes.length - 10} more` : '' }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Inline Display (for destinations with < 20 codes) -->
          <div v-if="destination.displayMode === 'inline' && destination.isExpanded" class="bg-gray-900/50 p-4">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-700 text-sm">
                <thead class="bg-gray-800">
                  <tr>
                    <th class="px-3 py-2 text-gray-300 text-center">Dial Code</th>
                    <th class="px-3 py-2 text-gray-300 text-center">Dest Name {{ fileName1 }}</th>
                    <th class="px-3 py-2 text-gray-300 text-center">Dest Name {{ fileName2 }}</th>
                    <th class="px-3 py-2 text-gray-300 text-center">Rate {{ fileName1 }}</th>
                    <th class="px-3 py-2 text-gray-300 text-center">Rate {{ fileName2 }}</th>
                    <th class="px-3 py-2 text-gray-300 text-center">Diff</th>
                    <th class="px-3 py-2 text-gray-300 text-center">Diff %</th>
                    <th class="px-3 py-2 text-gray-300 text-center">Cheaper</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-800">
                  <tr v-for="code in destination.codes" :key="code.dialCode" class="hover:bg-gray-700/50">
                    <td class="px-3 py-2 text-gray-400 text-center">{{ code.dialCode }}</td>
                    <td class="px-3 py-2 text-gray-400 text-center">{{ code.destName1 ?? 'N/A' }}</td>
                    <td class="px-3 py-2 text-gray-400 text-center">{{ code.destName2 ?? 'N/A' }}</td>
                    <td class="px-3 py-2 text-gray-200 text-center">{{ code.rate1?.toFixed(6) ?? 'N/A' }}</td>
                    <td class="px-3 py-2 text-gray-200 text-center">{{ code.rate2?.toFixed(6) ?? 'N/A' }}</td>
                    <td class="px-3 py-2 text-center" :class="code.diff && code.diff < 0 ? 'text-green-400' : code.diff && code.diff > 0 ? 'text-red-400' : 'text-gray-400'">
                      {{ code.diff?.toFixed(6) ?? 'N/A' }}
                    </td>
                    <td class="px-3 py-2 text-center" :class="code.diffPercent && code.diffPercent < 0 ? 'text-green-400' : code.diffPercent && code.diffPercent > 0 ? 'text-red-400' : 'text-gray-400'">
                      {{ code.diffPercent ? code.diffPercent.toFixed(2) + '%' : 'N/A' }}
                    </td>
                    <td class="px-3 py-2 text-gray-400 text-center">{{ formatCheaperFile(code.cheaperFile) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Summary -->
    <div
      v-if="displayedData.length > 0"
      class="mt-4 flex items-center justify-between"
    >
      <div class="text-sm text-gray-400">
        Total: {{ totalFilteredItems.toLocaleString() }} records in {{ groupedDestinations.length }} destination{{ groupedDestinations.length !== 1 ? 's' : '' }}
      </div>
    </div>
    
    <!-- Pagination Controls (Hidden - using scroll instead) -->
    <div
      v-if="false"
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
        Total: {{ totalFilteredItems.toLocaleString() }} records ({{ groupedDestinations.length }} destination{{ groupedDestinations.length !== 1 ? 's' : '' }})
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
    ChevronRightIcon,
    ChevronDownIcon,
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
  import { useGroupedAZComparison, type GroupedDestination } from '@/composables/az/useGroupedAZComparison';

  const azStore = useAzStore();

  // Replace any existing export-related refs with the composable
  const { isExporting, exportError, exportToCSV } = useCSVExport();
  
  // Initialize grouped comparison functionality
  const {
    groupByDestination,
    generateRateComparisonGroups,
    toggleDestinationExpansion,
    setExpandedView,
    expandAll,
    collapseAll,
    expandedDestinations,
    expandedViews,
    GROUPING_THRESHOLD,
  } = useGroupedAZComparison();

  // Filter State
  const searchTerm = ref<string>('');
  const selectedCheaper = ref<'' | 'file1' | 'file2' | 'same'>('');
  const selectedMatchStatus = ref<'' | 'both' | 'file1_only' | 'file2_only'>('');

  // Table name state
  const currentTableName = ref<string | null>(null);

  // Get Filenames for Headers first
  const fileName1 = computed(() => {
    const names = azStore.getFileNames;
    return names.length > 0 ? names[0].replace(/\.csv$/i, '') : 'File 1';
  });

  const fileName2 = computed(() => {
    const names = azStore.getFileNames;
    return names.length > 1 ? names[1].replace(/\.csv$/i, '') : 'File 2';
  });

  // Type for sortable column definition
  interface SortableAZCompColumn {
    key: keyof AZDetailedComparisonEntry | string;
    label: string;
    sortable: boolean;
    textAlign?: string;
    getValue?: (record: AZDetailedComparisonEntry) => any;
  }

  // Define table headers as a constant before composable initialization
  const tableHeaders: SortableAZCompColumn[] = [
    {
      key: 'dialCode',
      label: 'Dial Code',
      sortable: true,
      textAlign: 'center',
      getValue: (entry: AZDetailedComparisonEntry) => entry.dialCode,
    },
    {
      key: 'matchStatus',
      label: 'Match Status',
      sortable: true,
      textAlign: 'center',
      getValue: (entry: AZDetailedComparisonEntry) => entry.matchStatus,
    },
    {
      key: 'destName1',
      label: 'Dest Name (File 1)',
      sortable: true,
      textAlign: 'center',
      getValue: (entry: AZDetailedComparisonEntry) => entry.destName1 || '',
    },
    {
      key: 'destName2',
      label: 'Dest Name (File 2)',
      sortable: true,
      textAlign: 'center',
      getValue: (entry: AZDetailedComparisonEntry) => entry.destName2 || '',
    },
    {
      key: 'rate1',
      label: 'Rate (File 1)',
      sortable: true,
      textAlign: 'center',
      getValue: (entry: AZDetailedComparisonEntry) => entry.rate1 || 0,
    },
    {
      key: 'rate2',
      label: 'Rate (File 2)',
      sortable: true,
      textAlign: 'center',
      getValue: (entry: AZDetailedComparisonEntry) => entry.rate2 || 0,
    },
    {
      key: 'diff',
      label: 'Diff',
      sortable: true,
      textAlign: 'center',
      getValue: (entry: AZDetailedComparisonEntry) => entry.diff || 0,
    },
    {
      key: 'diffPercent',
      label: 'Diff %',
      sortable: true,
      textAlign: 'center',
      getValue: (entry: AZDetailedComparisonEntry) => entry.diffPercent || 0,
    },
    {
      key: 'cheaperFile',
      label: 'Cheaper File',
      sortable: true,
      textAlign: 'center',
      getValue: (entry: AZDetailedComparisonEntry) => entry.cheaperFile || '',
    },
  ];

  // Initialize table data composable
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
    itemsPerPage: 10000, // Load all data for grouping
    sortKey: 'dialCode',
    sortDirection: 'asc',
    tableHeaders,
  });

  // Update the table header labels when filenames change
  watch([fileName1, fileName2], ([newFile1, newFile2]) => {
    const destName1Header = tableHeaders.find((h) => h.key === 'destName1');
    const destName2Header = tableHeaders.find((h) => h.key === 'destName2');
    const rate1Header = tableHeaders.find((h) => h.key === 'rate1');
    const rate2Header = tableHeaders.find((h) => h.key === 'rate2');

    if (destName1Header) destName1Header.label = `Dest Name (${newFile1})`;
    if (destName2Header) destName2Header.label = `Dest Name (${newFile2})`;
    if (rate1Header) rate1Header.label = `Rate (${newFile1})`;
    if (rate2Header) rate2Header.label = `Rate (${newFile2})`;
  });

  // Grouped destinations computed from flat data
  const groupedDestinations = computed(() => {
    if (!displayedData.value || displayedData.value.length === 0) {
      return [];
    }
    
    const grouped = groupByDestination(displayedData.value);
    
    // Update expansion states based on current state
    return grouped.map(dest => ({
      ...dest,
      isExpanded: expandedDestinations.value.has(dest.destinationKey),
      expandedView: expandedViews.value.get(dest.destinationKey) || 'codes',
    }));
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

  // --- Helper Functions for Grouped Display ---
  
  /**
   * Formats the predominant cheaper file display
   */
  function formatPredominantCheaper(predominant: 'file1' | 'file2' | 'mixed' | 'same'): string {
    switch (predominant) {
      case 'file1': return `${fileName1.value} (Cheaper)`;
      case 'file2': return `${fileName2.value} (Cheaper)`;
      case 'mixed': return 'Mixed Results';
      case 'same': return 'Same Rates';
      default: return 'Unknown';
    }
  }

  /**
   * Formats rate distribution summary for display
   */
  function formatRateDistributionSummary(destination: GroupedDestination): string {
    const file1Rates = destination.rateDistribution.file1;
    const file2Rates = destination.rateDistribution.file2;
    
    if (file1Rates.length === 0 && file2Rates.length === 0) {
      return 'No rate data';
    }
    
    // Show top 2 rates for each file
    const file1Summary = file1Rates.slice(0, 2)
      .map(group => `$${group.rate.toFixed(6)} (${group.count} codes)`)
      .join(', ');
    
    const file2Summary = file2Rates.slice(0, 2)
      .map(group => `$${group.rate.toFixed(6)} (${group.count} codes)`)
      .join(', ');
    
    return `${fileName1.value}: ${file1Summary || 'N/A'} | ${fileName2.value}: ${file2Summary || 'N/A'}`;
  }

  /**
   * Handles expansion toggle for destinations
   */
  function handleDestinationToggle(destination: GroupedDestination) {
    toggleDestinationExpansion(destination.destinationKey);
  }

  /**
   * Handles view type change for expanded destinations
   */
  function handleViewChange(destination: GroupedDestination, viewType: 'codes' | 'rate-groups') {
    setExpandedView(destination.destinationKey, viewType);
  }

  /**
   * Gets rate comparison groups for a destination
   */
  function getRateComparisonGroups(destination: GroupedDestination) {
    return generateRateComparisonGroups(destination);
  }

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
      const exportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const currentFilters = [];
      if (searchTerm.value) currentFilters.push(`Search: ${searchTerm.value}`);
      if (selectedCheaper.value) {
        const option = rateComparisonOptions.value.find(opt => opt.value === selectedCheaper.value);
        if (option) currentFilters.push(`Rate Filter: ${option.label}`);
      }
      if (selectedMatchStatus.value) {
        const option = matchStatusOptions.value.find(opt => opt.value === selectedMatchStatus.value);
        if (option) currentFilters.push(`Match Filter: ${option.label}`);
      }
      
      const rows: string[][] = [];
      
      // Add header metadata
      rows.push(['AZ RATE COMPARISON EXPORT']);
      rows.push([`Export Date: ${exportDate}`]);
      rows.push([`File 1: ${fileName1.value}`]);
      rows.push([`File 2: ${fileName2.value}`]);
      rows.push([`Total Destinations: ${groupedDestinations.value.length}`]);
      rows.push([`Total Codes: ${groupedDestinations.value.reduce((sum, dest) => sum + dest.codeCount, 0)}`]);
      if (currentFilters.length > 0) {
        rows.push([`Active Filters: ${currentFilters.join(', ')}`]);
      }
      rows.push(['Generated by VOIPAccelerator.com']);
      rows.push(['']); // Empty separator
      
      // Add column headers
      const headers = [
        'Dial Code',
        `Dest Name ${fileName1.value}`,
        `Dest Name ${fileName2.value}`,
        `Rate ${fileName1.value}`,
        `Rate ${fileName2.value}`,
        'Diff',
        'Diff %',
        'Cheaper File',
      ];
      rows.push(headers);
      
      // Export grouped structure showing destination context
      groupedDestinations.value.forEach(destination => {
        destination.codes.forEach((record) => {
          rows.push([
            record.dialCode,
            record.destName1 ?? 'n/a',
            record.destName2 ?? 'n/a',
            formatRate(record.rate1),
            formatRate(record.rate2),
            formatRate(record.diff),
            formatPercentage(record.diffPercent),
            formatCheaperFile(record.cheaperFile),
          ]);
        });
      });

      exportToCSV(
        { headers: [], rows },
        {
          filename: 'az-compare-grouped',
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
    const header = tableHeaders.find((h) => h.key === columnKey);
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
