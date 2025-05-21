<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <!-- Filtered Data Average Rates Summary - Moved Up -->
    <div
      v-if="displayedData.length > 0 || isLoading || isPageLoading || isCalculatingAverages"
      class="mb-6 space-y-3"
    >
      <!-- File 1 Averages -->
      <div>
        <!-- File 1 Badge -->
        <div class="mb-2">
          <BaseBadge size="small" variant="neutral">{{ fileName1 }}</BaseBadge>
        </div>
        <!-- File 1 Bento Boxes -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Inter Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ animatedFile1InterAvg.toFixed(6) }}</span>
            </div>
          </div>
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Intra Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ animatedFile1IntraAvg.toFixed(6) }}</span>
            </div>
          </div>
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Indeterm Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ animatedFile1IndetermAvg.toFixed(6) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- File 2 Averages -->
      <div>
        <!-- File 2 Badge -->
        <div class="mb-2">
          <BaseBadge size="small" variant="neutral">{{ fileName2 }}</BaseBadge>
        </div>
        <!-- File 2 Bento Boxes -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Inter Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ animatedFile2InterAvg.toFixed(6) }}</span>
            </div>
          </div>
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Intra Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ animatedFile2IntraAvg.toFixed(6) }}</span>
            </div>
          </div>
          <div class="bg-gray-800 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-xs mb-0.5">Indeterm Avg</div>
            <div class="text-base text-white">
              <span v-if="isCalculatingAverages">...</span>
              <span v-else>${{ animatedFile2IndetermAvg.toFixed(6) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="mb-4 flex flex-wrap gap-4 items-center justify-between">
      <!-- Filter Group -->
      <div class="flex flex-wrap gap-4 items-center flex-grow">
        <!-- NPANXX Search -->
        <div>
          <label for="npanxx-search" class="block text-sm font-medium text-gray-400 mb-1"
            >NPA(s), NPANXX Filter</label
          >
          <input
            type="text"
            id="npanxx-search"
            v-model="npanxxSearchInput"
            placeholder="Enter NPA(s), or NPANXX..."
            class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
          />
        </div>

        <!-- State Filter -->
        <div class="w-52">
          <Listbox v-model="selectedState" as="div">
            <ListboxLabel class="block text-sm font-medium text-gray-400 mb-1"
              >Filter by State</ListboxLabel
            >
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
                :disabled="availableStates.length === 0 || isLoading || isFiltering"
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
                  class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm hover:text-green-300"
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

        <!-- Metro Area Filter Dropdown -->
        <div class="w-64">
          <label for="metro-filter-button" class="block text-sm font-medium text-gray-400 mb-1"
            >Filter by Metro Area</label
          >
          <Menu as="div" class="relative inline-block text-left w-full">
            <div>
              <MenuButton
                id="metro-filter-button"
                class="inline-flex w-full justify-between items-center rounded-lg bg-gray-800 py-2.5 pl-3 pr-2 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700 text-white"
                :disabled="isLoading || isFiltering || isPageLoading"
              >
                <span class="block truncate">{{ metroButtonLabel }}</span>
                <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
              </MenuButton>
            </div>
            <transition
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <MenuItems
                class="absolute z-30 mt-1 max-h-96 w-full origin-top-right overflow-hidden rounded-md bg-gray-800 shadow-lg ring-1 ring-black/5 focus:outline-none flex flex-col"
              >
                <div class="p-2 border-b border-gray-700">
                  <div class="relative">
                    <div
                      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
                    >
                      <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      v-model="metroSearchQuery"
                      type="text"
                      placeholder="Search metro areas..."
                      class="w-full bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-md p-2 pl-9 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      v-if="metroSearchQuery"
                      @click="clearMetroSearch"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                      aria-label="Clear search"
                    >
                      <XCircleIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div class="p-2 border-b border-gray-700 flex justify-between items-center">
                  <button
                    @click="handleSelectAllMetros"
                    class="text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50"
                    :disabled="filteredMetroOptions.length === 0"
                  >
                    {{ areAllMetrosSelected ? 'Deselect Visible' : 'Select Visible' }}
                  </button>
                  <button
                    v-if="selectedMetros.length > 0"
                    @click="clearAllSelectedMetros"
                    class="text-xs text-gray-400 hover:text-gray-200"
                  >
                    Clear All Selected ({{ selectedMetros.length }})
                  </button>
                </div>
                <div class="overflow-y-auto flex-grow p-1 max-h-60">
                  <MenuItem
                    v-for="metro in filteredMetroOptions"
                    :key="metro.key"
                    v-slot="{ active }"
                    as="template"
                  >
                    <li
                      @click="() => toggleMetroSelection(metro)"
                      :class="[
                        active ? 'bg-gray-700 text-primary-400' : 'text-gray-300',
                        'relative cursor-default select-none py-2 pl-10 pr-4 flex justify-between items-center',
                      ]"
                    >
                      <div class="flex items-center">
                        <span
                          :class="[
                            isMetroSelected(metro) ? 'text-primary-400' : 'text-gray-500',
                            'absolute inset-y-0 left-0 flex items-center pl-3',
                          ]"
                        >
                          <CheckIcon
                            class="h-5 w-5"
                            :class="isMetroSelected(metro) ? 'opacity-100' : 'opacity-0'"
                            aria-hidden="true"
                          />
                        </span>
                        <span
                          :class="[
                            isMetroSelected(metro) ? 'font-semibold' : 'font-normal',
                            'block truncate',
                          ]"
                        >
                          {{ metro.displayName }}
                        </span>
                      </div>
                      <span class="text-xs text-gray-500">{{
                        formatPopulation(metro.population)
                      }}</span>
                    </li>
                  </MenuItem>
                  <div
                    v-if="filteredMetroOptions.length === 0 && metroSearchQuery"
                    class="px-4 py-2 text-sm text-gray-500 text-center"
                  >
                    No metro areas match your search.
                  </div>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>

      <!-- Download CSV Button -->
      <div class="ml-auto self-end flex-shrink-0">
        <BaseButton
          variant="primary"
          size="small"
          @click="downloadCsv"
          :disabled="isLoading || isPageLoading || displayedData.length === 0 || isExporting"
          title="Download Filtered Data"
          class="min-w-[180px]"
        >
          <span v-if="isExporting" class="flex items-center justify-center">
            <ArrowPathIcon class="animate-spin w-4 h-4 mr-1.5" />
            Exporting...
          </span>
          <span v-else class="flex items-center justify-center">
            <ArrowDownTrayIcon class="w-4 h-4 mr-1.5" />
            Export Filtered Data
          </span>
        </BaseButton>
      </div>
    </div>

    <!-- Selected Metros Chips Display & Summary -->
    <div v-if="selectedMetros.length > 0" class="my-3 space-y-3">
      <div class="flex flex-wrap gap-2 items-center px-1">
        <span class="text-xs text-gray-400 mr-1">Selected Metros:</span>
        <span
          v-for="metro in selectedMetros"
          :key="metro.key"
          class="inline-flex items-center gap-x-1.5 rounded-md bg-gray-700 px-2 py-1 text-xs font-medium text-gray-200 ring-1 ring-inset ring-gray-600"
        >
          {{ metro.displayName }}
          <button
            @click="removeSelectedMetro(metro)"
            type="button"
            class="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-gray-500/20"
          >
            <span class="sr-only">Remove</span>
            <XCircleIcon
              class="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-200"
              aria-hidden="true"
            />
          </button>
        </span>
      </div>
      <div class="bg-gray-800/60 p-3 rounded-lg text-sm">
        <div class="flex justify-between items-center mb-2">
          <p class="text-gray-300">
            <span class="font-semibold">{{ selectedMetros.length }}</span> metro area(s) selected.
          </p>
          <p class="text-gray-300">
            Total Affected Population:
            <span class="font-semibold text-white">{{
              totalSelectedPopulation.toLocaleString()
            }}</span>
          </p>
        </div>
        <div
          v-if="targetedNPAsDisplay.summary"
          class="text-xs text-gray-400 pt-2 border-t border-gray-700/50"
          :title="targetedNPAsDisplay.fullList"
        >
          {{ targetedNPAsDisplay.summary }}
        </div>
      </div>
    </div>

    <div v-if="isLoading && displayedData.length === 0" class="text-center text-gray-500 py-10">
      <div
        class="flex items-center justify-center space-x-2 border border-neutral-700 rounded-lg p-2 w-1/4 mx-auto"
      >
        <ArrowPathIcon class="animate-spin w-6 h-6" />
      </div>
    </div>
    <div v-else-if="error" class="text-center text-red-500 py-10">
      Error loading data: {{ error }}
    </div>
    <div
      v-else-if="displayedData.length === 0 && !isLoading"
      class="text-center text-gray-500 py-10"
    >
      No matching comparison data found. Ensure reports have been generated or adjust filters.
    </div>
    <div v-else class="overflow-x-auto relative">
      <!-- Loading overlay for filter changes -->
      <div
        v-if="isFiltering || (isPageLoading && displayedData.length === 0)"
        class="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-20 rounded-lg"
      >
        <ArrowPathIcon class="animate-spin w-8 h-8 text-white" />
      </div>
      <!-- Make the container scrollable -->
      <div ref="scrollContainerRef" class="max-h-[600px] overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-700 text-sm">
          <thead class="bg-gray-800 sticky top-0 z-10">
            <tr>
              <!-- Dynamically render table headers -->
              <th
                v-for="header in tableHeaders"
                :key="header.key"
                scope="col"
                class="px-4 py-2 text-gray-300 align-bottom"
                :class="[
                  header.textAlign,
                  { 'cursor-pointer hover:bg-gray-700': header.sortable },
                  {
                    'min-w-28': [
                      'file1_inter',
                      'file2_inter',
                      'diff_inter_pct',
                      'file1_intra',
                      'file2_intra',
                      'diff_intra_pct',
                      'file1_indeterm',
                      'file2_indeterm',
                      'diff_indeterm_pct',
                    ].includes(header.key),
                  },
                ]"
                @click="header.sortable ? handleSort(header.key) : null"
              >
                <div
                  class="flex"
                  :class="[
                    header.customRender ? 'flex-col' : 'items-center', // Default for non-customRender is row, so items-center for vertical alignment
                    header.customRender && header.textAlign === 'text-center' ? 'items-center' : '',
                    header.customRender && header.textAlign === 'text-left' ? 'items-start' : '',
                    !header.customRender && header.textAlign === 'text-center'
                      ? 'justify-center'
                      : '',
                    !header.customRender && header.textAlign === 'text-left' ? 'justify-start' : '',
                  ]"
                >
                  <template v-if="header.customRender">
                    <BaseBadge
                      size="small"
                      variant="neutral"
                      class="max-w-[100px] truncate"
                      :title="header.fileBadge === 'file1' ? fileName1 : fileName2"
                      >{{ header.fileBadge === 'file1' ? fileName1 : fileName2 }}</BaseBadge
                    >
                  </template>

                  <div class="flex items-center" :class="{ 'mt-0.5': header.customRender }">
                    <span>{{ header.label }}</span>
                    <template v-if="header.sortable">
                      <ArrowUpIcon
                        v-if="currentSortKey === header.key && currentSortDirection === 'asc'"
                        class="w-3 h-3 ml-1 text-accent"
                      />
                      <ArrowDownIcon
                        v-else-if="currentSortKey === header.key && currentSortDirection === 'desc'"
                        class="w-3 h-3 ml-1 text-accent"
                      />
                      <ChevronUpDownIcon
                        v-else
                        class="w-4 h-4 ml-1 text-gray-500 hover:text-gray-200"
                      />
                    </template>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr v-for="record in displayedData" :key="record.npanxx" class="hover:bg-gray-700/50">
              <!-- Populate table cells -->
              <td class="px-4 py-2 text-gray-400">{{ record.npanxx }}</td>
              <!-- <td class="px-4 py-2 text-gray-400">{{ record.npa }}</td> -->
              <!-- <td class="px-4 py-2 text-gray-400">{{ record.nxx }}</td> -->
              <td class="px-4 py-2 text-gray-400">{{ record.stateCode }}</td>
              <td class="px-4 py-2 text-gray-400">{{ record.countryCode }}</td>
              <!-- File 1 Inter Rate -->
              <td class="px-4 py-2 text-gray-200 bg-gray-600/40">
                {{ record.file1_inter?.toFixed(6) }}
              </td>
              <!-- File 2 Inter Rate -->
              <td class="px-4 py-2 text-gray-200 bg-gray-700/40">
                {{ record.file2_inter?.toFixed(6) }}
              </td>
              <!-- Diff Inter % Cell -->
              <td class="px-4 py-2 text-gray-400">{{ record.diff_inter_pct?.toFixed(2) }}%</td>
              <!-- File 1 Intra Rate -->
              <td class="px-4 py-2 text-gray-200 bg-gray-600/40">
                {{ record.file1_intra?.toFixed(6) }}
              </td>
              <!-- File 2 Intra Rate -->
              <td class="px-4 py-2 text-gray-200 bg-gray-700/40">
                {{ record.file2_intra?.toFixed(6) }}
              </td>
              <!-- Diff Intra % Cell -->
              <td class="px-4 py-2 text-gray-400">{{ record.diff_intra_pct?.toFixed(2) }}%</td>
              <!-- File 1 Indeterm Rate -->
              <td class="px-4 py-2 text-gray-200 bg-gray-600/40">
                {{ record.file1_indeterm?.toFixed(6) }}
              </td>
              <!-- File 2 Indeterm Rate -->
              <td class="px-4 py-2 text-gray-200 bg-gray-700/40">
                {{ record.file2_indeterm?.toFixed(6) }}
              </td>
              <!-- Diff Indeterm % Cell -->
              <td class="px-4 py-2 text-gray-400">{{ record.diff_indeterm_pct?.toFixed(2) }}%</td>
            </tr>
          </tbody>
        </table>
        <!-- REMOVED: Trigger for loading more (loadMoreTriggerRef) -->
        <!-- REMOVED: Loading indicator (isLoadingMore) -->

        <div
          v-if="!isPageLoading && displayedData.length === 0 && totalFilteredItems > 0"
          class="text-center text-gray-600 py-4"
        >
          No results on this page. Try adjusting filters or page number.
        </div>
        <div
          v-else-if="
            !isPageLoading &&
            displayedData.length > 0 &&
            currentPage === totalPages &&
            totalFilteredItems > 0
          "
          class="text-center text-gray-600 py-4"
        >
          End of results.
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div
      v-if="totalFilteredItems > 0 || isPageLoading"
      class="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400"
    >
      <!-- Items per page selector -->
      <div class="flex items-center gap-2">
        <span>Show:</span>
        <select
          v-model="itemsPerPage"
          class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
          :disabled="isPageLoading || isFiltering"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <span>entries per page</span>
      </div>

      <!-- Page Info and Navigation -->
      <div class="flex items-center gap-2 flex-wrap justify-center">
        <BaseButton
          @click="goToFirstPage"
          :disabled="!canGoToPreviousPage || isPageLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="First Page"
        >
          &laquo; First
        </BaseButton>
        <BaseButton
          @click="goToPreviousPage"
          :disabled="!canGoToPreviousPage || isPageLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="Previous Page"
        >
          &lsaquo; Prev
        </BaseButton>

        <span class="flex items-center gap-1.5">
          Page
          <input
            type="number"
            v-model.number="directPageInput"
            @change="handleDirectPageInput"
            @keyup.enter="handleDirectPageInput"
            min="1"
            :max="totalPages"
            class="bg-gray-800 border border-gray-700 text-white w-14 text-center sm:text-sm rounded-md p-1.5 focus:ring-primary-500 focus:border-primary-500"
            :disabled="isPageLoading || isFiltering || totalPages === 1"
          />
          of {{ totalPages.toLocaleString() }}
        </span>

        <BaseButton
          @click="goToNextPage"
          :disabled="!canGoToNextPage || isPageLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="Next Page"
        >
          Next &rsaquo;
        </BaseButton>
        <BaseButton
          @click="goToLastPage"
          :disabled="!canGoToNextPage || currentPage === totalPages || isPageLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="Last Page"
        >
          Last &raquo;
        </BaseButton>
      </div>

      <!-- Total Records Display -->
      <div class="min-w-[150px] text-right md:text-left">
        <span>Total: {{ totalFilteredItems.toLocaleString() }} records</span>
        <span
          v-if="isPerformingPageLevelSort && totalFilteredItems > itemsPerPage"
          class="block text-xs text-yellow-400/70"
          >(Sorted current page)</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch, nextTick, computed } from 'vue';
  import { useDebounceFn, useTransition } from '@vueuse/core';
  import {
    Listbox,
    ListboxButton,
    ListboxLabel,
    ListboxOptions,
    ListboxOption,
    Menu,
    MenuButton,
    MenuItems,
    MenuItem,
  } from '@headlessui/vue';
  import {
    CheckIcon,
    ChevronUpDownIcon,
    MagnifyingGlassIcon,
    XCircleIcon,
  } from '@heroicons/vue/20/solid';
  import { useUsStore } from '@/stores/us-store';
  import { useLergStore } from '@/stores/lerg-store'; // Import lergStore
  import useDexieDB from '@/composables/useDexieDB';
  import { DBName } from '@/types/app-types';
  import type { USPricingComparisonRecord } from '@/types/domains/us-types';
  import type { DexieDBBase } from '@/composables/useDexieDB'; // Import the class type
  import Papa from 'papaparse'; // Import PapaParse
  import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/20/solid'; // Import Icons
  import BaseBadge from '@/components/shared/BaseBadge.vue'; // Import BaseBadge
  import BaseButton from '@/components/shared/BaseButton.vue'; // Import BaseButton
  import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/20/solid';
  import { metroAreaOptions, type MetroAreaOption } from '@/types/constants/metro-population';

  // Type for sortable column definition
  interface SortableUSComparisonColumn {
    key:
      | keyof USPricingComparisonRecord
      | 'diff_inter_pct'
      | 'diff_intra_pct'
      | 'diff_indeterm_pct'; // Allow diff keys
    label: string;
    sortable: boolean;
    textAlign?: string; // e.g., 'text-center', 'text-left'
    customRender?: boolean; // For headers that need complex rendering like badges
    fileBadge?: 'file1' | 'file2'; // To associate with fileName1 or fileName2
    rateType?: 'Inter' | 'Intra' | 'Indeterm'; // For rate columns
  }

  const usStore = useUsStore(); // Instantiate usStore
  const lergStore = useLergStore(); // Instantiate lergStore
  const { getDB } = useDexieDB(); // Only need getDB now
  const displayedData = ref<USPricingComparisonRecord[]>([]);
  const isLoading = ref<boolean>(false); // Initial loading state (for component mount)
  const isPageLoading = ref<boolean>(false); // Loading state for page changes and initial data load for a filter set
  const isFiltering = ref<boolean>(false); // State for loading during filter changes (visual overlay)
  const isExporting = ref<boolean>(false); // Export loading state
  const error = ref<string | null>(null);
  const availableStates = ref<string[]>([]); // For state filter dropdown

  // --- Metro Filter State --- START ---
  const selectedMetros = ref<MetroAreaOption[]>([]);
  const metroSearchQuery = ref('');
  // --- Metro Filter State --- END ---

  // --- Sorting State ---
  const currentSortKey = ref<SortableUSComparisonColumn['key']>('npanxx'); // Default sort key
  const currentSortDirection = ref<'asc' | 'desc'>('asc'); // Default sort direction
  const isPerformingPageLevelSort = ref<boolean>(false); // True if sorting is done on the current page data only
  // --- End Sorting State ---

  // Filter State Variables
  const npanxxSearchInput = ref<string>(''); // Renamed from searchTerm
  const npanxxFilterTerms = ref<string[]>([]); // New ref for processed NPANXX terms
  const selectedState = ref<string>('');

  // --- Metro Filter Computed Properties --- START ---
  const metroButtonLabel = computed(() => {
    if (selectedMetros.value.length === 0) return 'All Metro Areas';
    if (selectedMetros.value.length === 1) return selectedMetros.value[0].displayName;
    return `${selectedMetros.value.length} Metro Areas Selected`;
  });

  const filteredMetroOptions = computed(() => {
    if (!metroSearchQuery.value) {
      return metroAreaOptions;
    }
    return metroAreaOptions.filter((metro) =>
      metro.displayName.toLowerCase().includes(metroSearchQuery.value.toLowerCase())
    );
  });

  const totalSelectedPopulation = computed(() => {
    return selectedMetros.value.reduce((sum, metro) => sum + metro.population, 0);
  });

  const targetedNPAsDisplay = computed(() => {
    if (selectedMetros.value.length === 0) {
      return { summary: '', fullList: '' };
    }
    const allNPAs = [...new Set(selectedMetros.value.flatMap((metro) => metro.areaCodes))].sort();
    const npaListString = allNPAs.join(', ');
    if (allNPAs.length === 0) {
      return { summary: '', fullList: '' };
    }
    const summaryText = `Targeting ${allNPAs.length} NPAs: ${npaListString}`;
    return { summary: summaryText, fullList: npaListString };
  });

  const areAllMetrosSelected = computed(() => {
    const optionsToConsider = filteredMetroOptions.value;
    if (optionsToConsider.length === 0) return false;
    return optionsToConsider.every((metro) =>
      selectedMetros.value.some((sm) => sm.key === metro.key)
    );
  });

  const metroAreaCodesToFilter = computed<string[]>(() => {
    return [...new Set(selectedMetros.value.flatMap((metro) => metro.areaCodes))];
  });
  // --- Metro Filter Computed Properties --- END ---

  // --- Pagination State ---
  const currentPage = ref(1);
  const itemsPerPage = ref(50); // Default items per page, matches original pageSize
  const totalFilteredItems = ref(0);
  const itemsPerPageOptions = ref([25, 50, 100, 250]);
  // --- End Pagination State ---

  const scrollContainerRef = ref<HTMLElement | null>(null); // Ref for the scrollable div (still needed for scroll to top)

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

  // --- Animated Averages ---
  const transitionConfig = { duration: 500 };
  const file1InterAvgSource = computed(() => fullFilteredAverages.value.file1_inter_avg);
  const file1IntraAvgSource = computed(() => fullFilteredAverages.value.file1_intra_avg);
  const file1IndetermAvgSource = computed(() => fullFilteredAverages.value.file1_indeterm_avg);
  const file2InterAvgSource = computed(() => fullFilteredAverages.value.file2_inter_avg);
  const file2IntraAvgSource = computed(() => fullFilteredAverages.value.file2_intra_avg);
  const file2IndetermAvgSource = computed(() => fullFilteredAverages.value.file2_indeterm_avg);

  const animatedFile1InterAvg = useTransition(file1InterAvgSource, transitionConfig);
  const animatedFile1IntraAvg = useTransition(file1IntraAvgSource, transitionConfig);
  const animatedFile1IndetermAvg = useTransition(file1IndetermAvgSource, transitionConfig);
  const animatedFile2InterAvg = useTransition(file2InterAvgSource, transitionConfig);
  const animatedFile2IntraAvg = useTransition(file2IntraAvgSource, transitionConfig);
  const animatedFile2IndetermAvg = useTransition(file2IndetermAvgSource, transitionConfig);
  // --- End Animated Averages ---

  // --- Pagination Computed Properties ---
  const totalPages = computed(() => {
    if (totalFilteredItems.value === 0) return 1;
    return Math.ceil(totalFilteredItems.value / itemsPerPage.value);
  });

  const canGoToPreviousPage = computed(() => currentPage.value > 1);
  const canGoToNextPage = computed(() => currentPage.value < totalPages.value);

  const directPageInput = ref<string | number>(currentPage.value);
  watch(currentPage, (newPage) => {
    directPageInput.value = newPage;
  });
  // --- End Pagination Computed Properties ---

  // --- Table Headers ---
  const tableHeaders = computed<SortableUSComparisonColumn[]>(() => [
    { key: 'npanxx', label: 'NPANXX', sortable: true, textAlign: 'text-left' },
    { key: 'stateCode', label: 'State', sortable: true, textAlign: 'text-left' },
    { key: 'countryCode', label: 'Country', sortable: true, textAlign: 'text-left' },
    {
      key: 'file1_inter',
      label: 'Inter',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file1',
      rateType: 'Inter',
    },
    {
      key: 'file2_inter',
      label: 'Inter',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file2',
      rateType: 'Inter',
    },
    { key: 'diff_inter_pct', label: 'Diff %', sortable: true, textAlign: 'text-center' },
    {
      key: 'file1_intra',
      label: 'Intra',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file1',
      rateType: 'Intra',
    },
    {
      key: 'file2_intra',
      label: 'Intra',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file2',
      rateType: 'Intra',
    },
    { key: 'diff_intra_pct', label: 'Diff %', sortable: true, textAlign: 'text-center' },
    {
      key: 'file1_indeterm',
      label: 'Indeterm',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file1',
      rateType: 'Indeterm',
    },
    {
      key: 'file2_indeterm',
      label: 'Indeterm',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file2',
      rateType: 'Indeterm',
    },
    { key: 'diff_indeterm_pct', label: 'Diff %', sortable: true, textAlign: 'text-center' },
  ]);
  // --- End Table Headers ---

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

  // --- Computed property for average rates of filtered data (uses displayedData, which is current page) ---
  // This computed will now reflect averages of the *current page* if used directly.
  // The `fullFilteredAverages` ref holds the averages for the *entire filtered dataset*.
  // The UI for averages already uses `fullFilteredAverages` (via animatedXxxAvg), so this is fine.
  const averageRatesOfCurrentPage = computed(() => {
    // Renamed for clarity
    const totals = {
      file1_inter: { sum: 0, count: 0 },
      file1_intra: { sum: 0, count: 0 },
      file1_indeterm: { sum: 0, count: 0 },
      file2_inter: { sum: 0, count: 0 },
      file2_intra: { sum: 0, count: 0 },
      file2_indeterm: { sum: 0, count: 0 },
    };

    for (const record of displayedData.value) {
      // Iterate over current page data
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
    if (isExporting.value) return; // Prevent multiple exports

    isExporting.value = true;
    error.value = null; // Clear previous errors
    console.log('[USDetailedComparisonTable] Starting CSV export...');

    try {
      // Ensure DB is initialized
      if (!(await initializeDB()) || !dbInstance) {
        throw new Error('Database not available for export.');
      }

      // 1. Build the query dynamically to get ALL filtered data
      let query = dbInstance.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);

      // Apply client-side filters
      const currentFilters: Array<(record: USPricingComparisonRecord) => boolean> = [];

      if (npanxxFilterTerms.value.length > 0) {
        currentFilters.push((record: USPricingComparisonRecord) => {
          const recordNpanxxLower = record.npanxx.toLowerCase();
          return npanxxFilterTerms.value.some((term) => recordNpanxxLower.startsWith(term));
        });
      }

      if (selectedState.value) {
        currentFilters.push(
          (record: USPricingComparisonRecord) => record.stateCode === selectedState.value
        );
      }

      if (metroAreaCodesToFilter.value.length > 0) {
        const npaSet = new Set(metroAreaCodesToFilter.value);
        currentFilters.push((record: USPricingComparisonRecord) => npaSet.has(record.npa));
      }

      let queryForCount = query.toCollection(); // Start with a full collection for counting
      if (currentFilters.length > 0) {
        queryForCount = queryForCount.filter((record) => currentFilters.every((fn) => fn(record)));
      }
      totalFilteredItems.value = await queryForCount.count();

      let queryForPageData = query.toCollection(); // Start with a full collection for data fetching
      if (currentFilters.length > 0) {
        queryForPageData = queryForPageData.filter((record) =>
          currentFilters.every((fn) => fn(record))
        );
      }

      // Attempt DB-Level Sorting on queryForPageData
      let dbSortApplied = false;
      const sortKeyIsDirectDBField = ![
        'diff_inter_pct',
        'diff_intra_pct',
        'diff_indeterm_pct',
      ].includes(currentSortKey.value);

      if (
        sortKeyIsDirectDBField &&
        typeof queryForPageData.orderBy === 'function' &&
        currentSortKey.value
      ) {
        try {
          queryForPageData = queryForPageData.orderBy(currentSortKey.value);
          if (currentSortDirection.value === 'desc') {
            queryForPageData = queryForPageData.reverse();
          }
          dbSortApplied = true;
        } catch (dbSortError) {
          dbSortApplied = false;
        }
      }

      // Apply pagination to queryForPageData
      let newData = await queryForPageData
        .offset(calculatedOffset)
        .limit(itemsPerPage.value)
        .toArray();

      // Client-Side Sorting if DB sort wasn't applied or for computed columns
      if (!dbSortApplied && currentSortKey.value) {
        console.log(
          '[USDetailedComparisonTable] Applying client-side sort on:',
          currentSortKey.value,
          currentSortDirection.value
        );
        isPerformingPageLevelSort.value = true; // Indicate page-level sort
        newData.sort((a, b) => {
          const valA = (a as any)[currentSortKey.value!];
          const valB = (b as any)[currentSortKey.value!];
          let comparison = 0;

          if (valA === null || valA === undefined) comparison = 1;
          else if (valB === null || valB === undefined) comparison = -1;
          else if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
          } else if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
          } else if (valA > valB) comparison = 1;
          else if (valA < valB) comparison = -1;

          return currentSortDirection.value === 'asc' ? comparison : comparison * -1;
        });
      }

      displayedData.value = newData;
    } catch (err: any) {
      console.error('Error loading page data:', err);
      error.value = err.message || 'Failed to load data for the page';
      displayedData.value = []; // Clear data on error
      totalFilteredItems.value = 0; // Reset count on error
    } finally {
      isPageLoading.value = false;
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
          totalFilteredItems.value = 0; // No items if table doesn't exist
          return false; // Indicate failure
        }
        return true; // Indicate success
      } catch (err: any) {
        console.error('Error initializing database:', err);
        error.value = err.message || 'Failed to connect to the comparison database';
        totalFilteredItems.value = 0; // No items on DB error
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
  const CA_PROVINCES = [
    'AB',
    'BC',
    'MB',
    'NB',
    'NL',
    'NS',
    'NT',
    'NU',
    'ON',
    'PE',
    'QC',
    'SK',
    'YT',
  ];

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

  // --- New Pagination Data Fetching Logic ---
  async function fetchPageData(page: number) {
    if (!(await initializeDB()) || !dbInstance) {
      isPageLoading.value = false;
      return;
    }

    isPageLoading.value = true;
    isPerformingPageLevelSort.value = false; // Reset sort status
    error.value = null;

    try {
      currentPage.value = page;
      const calculatedOffset = (page - 1) * itemsPerPage.value;

      let query: any = dbInstance.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);

      // Apply client-side filters
      const currentFilters: Array<(record: USPricingComparisonRecord) => boolean> = [];

      if (npanxxFilterTerms.value.length > 0) {
        currentFilters.push((record: USPricingComparisonRecord) => {
          const recordNpanxxLower = record.npanxx.toLowerCase();
          return npanxxFilterTerms.value.some((term) => recordNpanxxLower.startsWith(term));
        });
      }

      if (selectedState.value) {
        currentFilters.push(
          (record: USPricingComparisonRecord) => record.stateCode === selectedState.value
        );
      }

      if (metroAreaCodesToFilter.value.length > 0) {
        const npaSet = new Set(metroAreaCodesToFilter.value);
        currentFilters.push((record: USPricingComparisonRecord) => npaSet.has(record.npa));
      }

      let queryForCount = query.toCollection(); // Start with a full collection for counting
      if (currentFilters.length > 0) {
        queryForCount = queryForCount.filter((record) => currentFilters.every((fn) => fn(record)));
      }
      totalFilteredItems.value = await queryForCount.count();

      let queryForPageData = query.toCollection(); // Start with a full collection for data fetching
      if (currentFilters.length > 0) {
        queryForPageData = queryForPageData.filter((record) =>
          currentFilters.every((fn) => fn(record))
        );
      }

      // Attempt DB-Level Sorting on queryForPageData
      let dbSortApplied = false;
      const sortKeyIsDirectDBField = ![
        'diff_inter_pct',
        'diff_intra_pct',
        'diff_indeterm_pct',
      ].includes(currentSortKey.value);

      if (
        sortKeyIsDirectDBField &&
        typeof queryForPageData.orderBy === 'function' &&
        currentSortKey.value
      ) {
        try {
          queryForPageData = queryForPageData.orderBy(currentSortKey.value);
          if (currentSortDirection.value === 'desc') {
            queryForPageData = queryForPageData.reverse();
          }
          dbSortApplied = true;
        } catch (dbSortError) {
          dbSortApplied = false;
        }
      }

      // Apply pagination to queryForPageData
      let newData = await queryForPageData
        .offset(calculatedOffset)
        .limit(itemsPerPage.value)
        .toArray();

      // Client-Side Sorting if DB sort wasn't applied or for computed columns
      if (!dbSortApplied && currentSortKey.value) {
        console.log(
          '[USDetailedComparisonTable] Applying client-side sort on:',
          currentSortKey.value,
          currentSortDirection.value
        );
        isPerformingPageLevelSort.value = true; // Indicate page-level sort
        newData.sort((a, b) => {
          const valA = (a as any)[currentSortKey.value!];
          const valB = (b as any)[currentSortKey.value!];
          let comparison = 0;

          if (valA === null || valA === undefined) comparison = 1;
          else if (valB === null || valB === undefined) comparison = -1;
          else if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
          } else if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
          } else if (valA > valB) comparison = 1;
          else if (valA < valB) comparison = -1;

          return currentSortDirection.value === 'asc' ? comparison : comparison * -1;
        });
      }

      displayedData.value = newData;
    } catch (err: any) {
      console.error('Error loading page data:', err);
      error.value = err.message || 'Failed to load data for the page';
      displayedData.value = []; // Clear data on error
      totalFilteredItems.value = 0; // Reset count on error
    } finally {
      isPageLoading.value = false;
    }
  }
  // --- End New Pagination Data Fetching Logic ---

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
      const query = dbInstance.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);

      const currentFilters: Array<(record: USPricingComparisonRecord) => boolean> = [];
      if (npanxxFilterTerms.value.length > 0) {
        currentFilters.push((record: USPricingComparisonRecord) => {
          const recordNpanxxLower = record.npanxx.toLowerCase();
          return npanxxFilterTerms.value.some((term) => recordNpanxxLower.startsWith(term));
        });
      }
      if (selectedState.value) {
        currentFilters.push(
          (record: USPricingComparisonRecord) => record.stateCode === selectedState.value
        );
      }
      if (metroAreaCodesToFilter.value.length > 0) {
        const npaSet = new Set(metroAreaCodesToFilter.value);
        currentFilters.push((record: USPricingComparisonRecord) => npaSet.has(record.npa));
      }

      let filteredQuery = query.toCollection();
      if (currentFilters.length > 0) {
        filteredQuery = filteredQuery.filter((record) => currentFilters.every((fn) => fn(record)));
      }

      await filteredQuery.each((record) => {
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
  // Renamed from resetAndFetchData to resetPaginationAndLoad
  async function resetPaginationAndLoad() {
    // Set loading states
    // isLoading.value = true; // This was for the very initial mount, isPageLoading covers subsequent loads
    isFiltering.value = true; // Indicate filters are being applied (for overlay)
    isPageLoading.value = true; // General loading state for data fetching

    // Reset scroll position to top when filters change
    if (scrollContainerRef.value) {
      scrollContainerRef.value.scrollTop = 0;
    }

    currentPage.value = 1; // Reset to first page
    directPageInput.value = 1; // Sync direct input
    error.value = null;

    // Trigger both table data fetch (first page) and full average calculation
    const dataFetchPromise = fetchPageData(1);
    const averageCalcPromise = calculateFullFilteredAverages();

    try {
      await Promise.all([dataFetchPromise, averageCalcPromise]);
    } catch (err) {
      console.error('[USDetailedComparisonTable] Error during resetPaginationAndLoad:', err);
      // error ref should be set by individual failing functions
    } finally {
      // isLoading.value = false;
      isFiltering.value = false; // Remove overlay
      // isPageLoading is set to false inside fetchPageData
    }
  }

  // --- Lifecycle and Watchers ---

  onMounted(async () => {
    isLoading.value = true; // For initial component setup (e.g. fetching states)
    await fetchUniqueStates(); // Fetch states first
    await resetPaginationAndLoad(); // Then load initial data (first page)
    isLoading.value = false;
  });

  // Watch for filter changes and reload data (DEBOUNCED)
  const debouncedResetPaginationAndLoad = useDebounceFn(() => {
    resetPaginationAndLoad();
  }, 300); // 300ms debounce delay

  // Watcher for the raw NPANXX input string
  watch(npanxxSearchInput, () => {
    debouncedProcessNpanxxInput(); // This updates npanxxFilterTerms
  });

  // This watcher should observe the processed terms, not the raw input for NPANXX.
  // selectedState is fine.
  watch([npanxxFilterTerms, selectedState], () => {
    // Changed from npanxxSearchInput
    debouncedResetPaginationAndLoad();
  });

  watch(itemsPerPage, () => {
    // When items per page changes, go to page 1 and reload.
    resetPaginationAndLoad(); // This will set currentPage to 1 and fetch data.
  });

  // --- Metro Filter Watcher --- START ---
  watch(
    selectedMetros,
    async (newSelectedMetros) => {
      if (newSelectedMetros.length > 0) {
        console.log(
          '[USDetailedComparisonTable] Metro selection changed, resetting NPANXX and State filters.'
        );
        npanxxSearchInput.value = ''; // This will trigger its watcher to clear npanxxFilterTerms
        selectedState.value = '';
      }
      // debouncedResetPaginationAndLoad will be called by the watchers of npanxxSearchInput and selectedState
      // if they change, or directly if they didn't (e.g. clearing the last metro selection)
      // For consistency and to ensure it always runs after a metro change:
      await debouncedResetPaginationAndLoad();
    },
    { deep: true }
  );
  // --- Metro Filter Watcher --- END ---

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

  // Debounced function to process NPANXX input
  const debouncedProcessNpanxxInput = useDebounceFn(() => {
    const terms = npanxxSearchInput.value
      .split(',')
      .map((term) => term.trim().toLowerCase())
      .filter((term) => term.length > 0);
    npanxxFilterTerms.value = terms;
    // The main data loading `debouncedResetPaginationAndLoad` is already watched by npanxxSearchInput,
    // so no need to call it directly here. The change to npanxxFilterTerms will be picked up by it.
  }, 300);

  // --- Sorting Handler ---
  async function handleSort(key: SortableUSComparisonColumn['key']) {
    const header = tableHeaders.value.find((h) => h.key === key);
    if (!header || !header.sortable) {
      return;
    }

    if (currentSortKey.value === key) {
      currentSortDirection.value = currentSortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortKey.value = key;
      currentSortDirection.value = 'asc';
    }
    // After updating sort state, reload data from the beginning (page 1)
    await resetPaginationAndLoad(); // This will set currentPage to 1 and fetch data
  }
  // --- End Sorting Handler ---

  // --- Pagination Action Handlers ---
  async function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
      await fetchPageData(page);
      if (scrollContainerRef.value) {
        // Scroll to top of table on page change
        scrollContainerRef.value.scrollTop = 0;
      }
    } else if (page === currentPage.value) {
      directPageInput.value = currentPage.value; // Reset input if invalid or same page
    }
  }

  function goToFirstPage() {
    if (canGoToPreviousPage.value) {
      goToPage(1);
    }
  }

  function goToPreviousPage() {
    if (canGoToPreviousPage.value) {
      goToPage(currentPage.value - 1);
    }
  }

  function goToNextPage() {
    if (canGoToNextPage.value) {
      goToPage(currentPage.value + 1);
    }
  }

  function goToLastPage() {
    if (canGoToNextPage.value) {
      goToPage(totalPages.value);
    }
  }

  function handleDirectPageInput() {
    const page = Number(directPageInput.value);
    if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
      goToPage(page);
    } else {
      // Reset input to current page if invalid
      directPageInput.value = currentPage.value;
      // Optionally provide user feedback about invalid page number
    }
  }
  // --- End Pagination Action Handlers ---

  // --- Metro Filter Functions --- START ---
  function toggleMetroSelection(metro: MetroAreaOption) {
    const index = selectedMetros.value.findIndex((m) => m.key === metro.key);
    if (index > -1) {
      selectedMetros.value.splice(index, 1);
    } else {
      selectedMetros.value.push(metro);
    }
  }

  function isMetroSelected(metro: MetroAreaOption): boolean {
    return selectedMetros.value.some((m) => m.key === metro.key);
  }

  function handleSelectAllMetros() {
    const currentFilteredAreSelected = areAllMetrosSelected.value;
    const optionsToConsider = filteredMetroOptions.value;

    if (currentFilteredAreSelected) {
      selectedMetros.value = selectedMetros.value.filter(
        (sm) => !optionsToConsider.find((fm) => fm.key === sm.key)
      );
    } else {
      optionsToConsider.forEach((metro) => {
        if (!isMetroSelected(metro)) {
          selectedMetros.value.push(metro);
        }
      });
    }
  }

  function removeSelectedMetro(metro: MetroAreaOption) {
    const index = selectedMetros.value.findIndex((m) => m.key === metro.key);
    if (index > -1) {
      selectedMetros.value.splice(index, 1);
    }
  }

  function clearMetroSearch() {
    metroSearchQuery.value = '';
  }

  function clearAllSelectedMetros() {
    selectedMetros.value = [];
    metroSearchQuery.value = '';
  }

  function formatPopulation(population: number): string {
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    }
    if (population >= 1000) {
      return `${(population / 1000).toFixed(1)}K`;
    }
    return population.toString();
  }
  // --- Metro Filter Functions --- END ---

  // --- Clear All Filters Function --- START ---
  async function handleClearAllFilters() {
    npanxxSearchInput.value = ''; // Changed from searchTerm
    selectedState.value = '';
    clearAllSelectedMetros(); // This clears selectedMetros and metroSearchQuery

    // Reset sorting to default (optional, but good UX)
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';

    await resetPaginationAndLoad();
  }
  // --- Clear All Filters Function --- END ---
</script>
