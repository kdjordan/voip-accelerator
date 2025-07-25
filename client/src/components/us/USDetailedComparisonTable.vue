<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <!-- Filtered Data Average Rates Summary -->
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

    <!-- New Filter Controls Section -->
    <div class="mb-6">
      <!-- Main Header for Filters -->
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-2">
        <div>
          <h3 class="text-lg font-medium text-white">Filter Controls</h3>
          <p class="text-sm text-gray-400">
            Showing {{ displayedData.length.toLocaleString() }} of
            {{ totalFilteredItems.toLocaleString() }} entries
          </p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <BaseButton
            variant="primary"
            size="small"
            @click="handleOpenExportModal"
            :disabled="isLoading || isPageLoading || displayedData.length === 0 || isExporting"
            title="Download Filtered Data"
            class="min-w-[160px]"
          >
            <span v-if="isExporting" class="flex items-center justify-center">
              <ArrowPathIcon class="animate-spin w-4 h-4 mr-1.5" />
              Exporting...
            </span>
            <span v-else class="flex items-center justify-center">
              <ArrowDownTrayIcon class="w-4 h-4 mr-1.5" />
              Export Data
            </span>
          </BaseButton>
          <!-- Optional: Clear Data button from USRateSheetTable.vue can be added here -->
          <!-- <BaseButton variant="destructive" size="small">Clear Data</BaseButton> -->
        </div>
      </div>

      <!-- Primary Filters Row -->
      <div class="grid md:grid-cols-3 lg:grid-cols-4 gap-4 items-end mb-4">
        <!-- NPANXX Search (lg:col-span-2) -->
        <div class="md:col-span-1 lg:col-span-2">
          <label for="npanxx-search" class="block text-sm font-medium text-gray-400 mb-1"
            >Filter by NPANXX</label
          >
          <input
            type="text"
            id="npanxx-search"
            v-model="npanxxSearchInput"
            placeholder="e.g., 201, 301333..."
            class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
          />
        </div>

        <!-- State Filter (md:col-span-1) -->
        <div class="w-full md:col-span-1">
          <Listbox v-model="selectedState" as="div">
            <ListboxLabel class="block text-sm font-medium text-gray-400 mb-1"
              >Filter by State/Province/Country</ListboxLabel
            >
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
                :disabled="availableStates.length === 0 || isLoading || isFiltering"
              >
                <span class="block truncate text-white">{{
                  selectedState
                    ? getSelectedStateDisplayName(selectedState)
                    : 'All States/Provinces/Countries'
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
                  class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                >
                  <ListboxOption v-slot="{ active, selected }" :value="''" as="template">
                    <li
                      :class="[
                        active ? 'bg-gray-700 text-primary-400' : 'text-gray-300',
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                      ]"
                    >
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']"
                        >All States/Provinces/Countries</span
                      >
                      <span
                        v-if="selected"
                        class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-400"
                      >
                        <CheckIcon class="h-5 w-5" aria-hidden="true" />
                      </span>
                    </li>
                  </ListboxOption>
                  <template v-for="group in groupedAvailableStates" :key="group.label">
                    <li class="text-gray-500 px-4 py-2 text-xs uppercase select-none">
                      {{ group.label }}
                    </li>
                    <!-- Group-level selection option -->
                    <ListboxOption
                      v-slot="{ active, selected }"
                      :value="'GROUP_' + group.label.replace(/\s+/g, '_').toUpperCase()"
                      as="template"
                    >
                      <li
                        :class="[
                          active ? 'bg-gray-700 text-primary-400' : 'text-gray-300',
                          'relative cursor-default select-none py-2 pl-6 pr-4 font-medium italic',
                        ]"
                      >
                        <span :class="[selected ? 'font-bold' : 'font-medium', 'block truncate']"
                          >All {{ group.label }}</span
                        >
                        <span
                          v-if="selected"
                          class="absolute inset-y-0 left-0 flex items-center pl-1 text-primary-400"
                        >
                          <CheckIcon class="h-5 w-5" aria-hidden="true" />
                        </span>
                      </li>
                    </ListboxOption>
                    <!-- Individual region options -->
                    <ListboxOption
                      v-for="regionCode in group.codes"
                      :key="regionCode"
                      :value="regionCode"
                      v-slot="{ active, selected }"
                      as="template"
                    >
                      <li
                        :class="[
                          active ? 'bg-gray-700 text-primary-400' : 'text-gray-300',
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

        <!-- Rate Comparison Filter -->
        <div class="relative">
          <Listbox v-model="selectedCheaper" as="div">
            <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1">
              Rate Comparison
            </ListboxLabel>
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
                :disabled="isLoading || isFiltering"
              >
                <span class="block truncate text-white">
                  {{ rateComparisonOptions.find(opt => opt.value === selectedCheaper)?.label || 'All Comparisons' }}
                </span>
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
                  class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                >
                  <ListboxOption
                    v-for="option in rateComparisonOptions"
                    :key="option.value"
                    :value="option.value"
                    v-slot="{ active, selected }"
                    as="template"
                  >
                    <li
                      :class="[
                        active ? 'bg-gray-700 text-primary-400' : 'text-gray-300',
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                      ]"
                    >
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                        {{ option.label }}
                      </span>
                      <span
                        v-if="selected"
                        class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-400"
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

        <!-- Reset All Filters Button (md:col-span-1) -->
        <div class="md:col-span-1 self-end">
          <BaseButton
            variant="secondary"
            size="default"
            @click="handleClearAllFilters"
            class="w-full"
            :disabled="isLoading || isFiltering || isPageLoading"
            title="Reset All Filters"
          >
            <XCircleIcon class="w-5 h-5 mr-1.5" />
            Reset All Filters
          </BaseButton>
        </div>
      </div>

      <!-- Metro Area Filter Section -->
      <div class="mt-4 pt-4 border-t border-gray-700/60">
        <p class="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-2">
          FILTER BY METRO AREA
        </p>
        <!-- Metro Controls Row -->
        <div class="grid md:grid-cols-3 gap-4 items-center mb-3">
          <!-- Search Input with Integrated Toggle (md:col-span-1) -->
          <div class="relative flex items-stretch md:col-span-1">
            <div class="relative flex-grow focus-within:z-10">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                v-model="metroSearchQuery"
                type="text"
                placeholder="Search metros..."
                class="block w-full rounded-l-md border-0 py-2.5 pl-10 bg-gray-800 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
              />
              <button
                v-if="metroSearchQuery"
                @click="clearMetroSearch"
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <XCircleIcon class="h-5 w-5" />
              </button>
            </div>
            <button
              @click="toggleMetroAreaVisibility"
              type="button"
              class="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2.5 text-sm font-semibold bg-gray-800 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-gray-700 focus:z-10"
              title="Toggle metro selection visibility"
            >
              <ChevronDownIcon
                class="h-5 w-5 transition-transform duration-200"
                :class="{ 'rotate-180': isMetroAreaVisible }"
              />
            </button>
          </div>

          <!-- Metro Action Buttons (md:col-span-2, aligned right) -->
          <div
            class="md:col-span-2 flex flex-wrap gap-x-2 gap-y-2 justify-start md:justify-end items-center"
          >
            <BaseButton
              variant="secondary-outline"
              size="small"
              @click="() => selectTopNMetros(10)"
              :disabled="isLoading || isFiltering || isPageLoading"
            >
              Select Top 10
            </BaseButton>
            <BaseButton
              variant="secondary-outline"
              size="small"
              @click="() => selectTopNMetros(25)"
              :disabled="isLoading || isFiltering || isPageLoading"
            >
              Select Top 25
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="small"
              @click="handleSelectAllMetros"
              :disabled="
                isLoading || isFiltering || isPageLoading || filteredMetroOptions.length === 0
              "
            >
              {{ areAllMetrosSelected ? 'Deselect Visible' : 'Select All' }}
            </BaseButton>
            <BaseButton
              v-if="selectedMetros.length > 0"
              variant="secondary-outline"
              size="small"
              @click="clearAllSelectedMetros"
              :disabled="isLoading || isFiltering || isPageLoading"
            >
              Clear Selected ({{ selectedMetros.length }})
            </BaseButton>
          </div>
        </div>

        <!-- Collapsible Metro Chip Grid -->
        <transition
          enter-active-class="transition ease-out duration-200 origin-top"
          enter-from-class="transform opacity-0 scale-y-95"
          enter-to-class="transform opacity-100 scale-y-100"
          leave-active-class="transition ease-in duration-150 origin-top"
          leave-from-class="transform opacity-100 scale-y-100"
          leave-to-class="transform opacity-0 scale-y-95"
        >
          <div
            v-show="isMetroAreaVisible"
            class="bg-gray-700/30 p-3 mt-1 rounded-lg border border-gray-600/50 max-h-[300px] overflow-y-auto shadow-md"
          >
            <div
              v-if="filteredMetroOptions.length > 0"
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-2"
            >
              <label
                v-for="metro in filteredMetroOptions"
                :key="metro.key"
                :for="`metro-checkbox-${metro.key}`"
                class="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-600/40 cursor-pointer transition-colors duration-150 border border-transparent hover:border-gray-500"
                :class="{ 'bg-primary-700/20 ring-1 ring-primary-600': isMetroSelected(metro) }"
              >
                <input
                  :id="`metro-checkbox-${metro.key}`"
                  type="checkbox"
                  :checked="isMetroSelected(metro)"
                  @change="() => toggleMetroSelection(metro)"
                  class="h-4 w-4 rounded border-gray-500 bg-gray-800 text-primary-600 focus:ring-primary-500 focus:ring-offset-gray-900 shadow"
                />
                <span class="text-sm text-gray-200 truncate flex-grow" :title="metro.displayName">
                  {{ metro.displayName }}
                </span>
                <span
                  class="text-xs text-gray-400 ml-auto whitespace-nowrap bg-gray-600/50 px-1.5 py-0.5 rounded-sm"
                  >{{ formatPopulation(metro.population) }}</span
                >
              </label>
            </div>
            <div
              v-else-if="metroSearchQuery && filteredMetroOptions.length === 0"
              class="py-4 text-center text-sm text-gray-500"
            >
              No metro areas match "{{ metroSearchQuery }}".
            </div>
            <div v-else class="py-4 text-center text-sm text-gray-500">
              No metro areas available or matching current search.
            </div>
          </div>
        </transition>
      </div>
    </div>
    <!-- End New Filter Controls Section -->

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

    <div
      v-if="isLoading && displayedData.length === 0"
      class="flex flex-col items-center justify-center py-10 min-h-[300px]"
    >
      <ArrowPathIcon class="animate-spin w-10 h-10 text-accent mb-3" />
      <p class="text-gray-400 text-sm">Loading comparison data...</p>
    </div>
    <div v-else-if="error" class="text-center text-red-500 py-10">
      Error loading data: {{ error }}
    </div>
    <div
      v-else-if="displayedData.length === 0 && !isLoading && !isPageLoading"
      class="flex flex-col items-center justify-center text-gray-500 py-10 min-h-[300px] w-full"
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
          @click="() => goToFirstPage(createFilters())"
          :disabled="!canGoToPreviousPage || isPageLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="First Page"
        >
          &laquo; First
        </BaseButton>
        <BaseButton
          @click="() => goToPreviousPage(createFilters())"
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
            @change="() => handleDirectPageInput(createFilters())"
            @keyup.enter="() => handleDirectPageInput(createFilters())"
            min="1"
            :max="totalPages"
            class="bg-gray-800 border border-gray-700 text-white w-14 text-center sm:text-sm rounded-md p-1.5 focus:ring-primary-500 focus:border-primary-500"
            :disabled="isPageLoading || isFiltering || totalPages === 1"
          />
          of {{ totalPages.toLocaleString() }}
        </span>

        <BaseButton
          @click="() => goToNextPage(createFilters())"
          :disabled="!canGoToNextPage || isPageLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="Next Page"
        >
          Next &rsaquo;
        </BaseButton>
        <BaseButton
          @click="() => goToLastPage(createFilters())"
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

    <!-- Export Modal -->
    <USExportModal
      v-model:open="showExportModal"
      export-type="comparison"
      :filters="exportFilters"
      :data="exportData"
      :total-records="totalExportRecords"
      :on-export="handleExportWithOptions"
    />
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
    ChevronDownIcon,
  } from '@heroicons/vue/20/solid';
  import { useUsStore } from '@/stores/us-store';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  import { DBName } from '@/types/app-types';
  import type { USPricingComparisonRecord } from '@/types/domains/us-types';
  import Papa from 'papaparse';
  import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/20/solid';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/20/solid';
  import { useMetroFilter } from '@/composables/filters/useMetroFilter';
  import {
    US_REGION_CODES,
    CA_REGION_CODES,
    getRegionName,
    sortRegionCodesByName,
    groupRegionCodes,
    RegionType,
  } from '@/types/constants/region-codes';
  import { useCSVExport } from '@/composables/exports/useCSVExport';
  import { useUSTableData } from '@/composables/tables/useUSTableData';
  import type { FilterFunction } from '@/composables/tables/useTableData';
  import USExportModal from '@/components/exports/USExportModal.vue';
  import { useUSExportConfig } from '@/composables/exports/useUSExportConfig';
  import type { USExportFilters, USExportFormatOptions } from '@/types/exports';

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
    getValue?: (entry: USPricingComparisonRecord) => any; // Function to get the value for sorting
  }

  // Define table headers before composable initialization
  const tableHeaders: SortableUSComparisonColumn[] = [
    {
      key: 'npanxx',
      label: 'NPANXX',
      sortable: true,
      textAlign: 'text-left',
      getValue: (entry: USPricingComparisonRecord) => entry.npanxx,
    },
    {
      key: 'stateCode',
      label: 'State',
      sortable: true,
      textAlign: 'text-left',
      getValue: (entry: USPricingComparisonRecord) =>
        lergStore.getLocationByNPA(entry.npa)?.region || 'N/A',
    },
    {
      key: 'countryCode',
      label: 'Country',
      sortable: true,
      textAlign: 'text-left',
      getValue: (entry: USPricingComparisonRecord) =>
        lergStore.getLocationByNPA(entry.npa)?.country || 'N/A',
    },
    {
      key: 'file1_inter',
      label: 'Inter',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file1',
      rateType: 'Inter',
      getValue: (entry: USPricingComparisonRecord) => entry.file1_inter || 0,
    },
    {
      key: 'file2_inter',
      label: 'Inter',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file2',
      rateType: 'Inter',
      getValue: (entry: USPricingComparisonRecord) => entry.file2_inter || 0,
    },
    {
      key: 'diff_inter_pct',
      label: 'Diff %',
      sortable: true,
      textAlign: 'text-center',
      getValue: (entry: USPricingComparisonRecord) => entry.diff_inter_pct || 0,
    },
    {
      key: 'file1_intra',
      label: 'Intra',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file1',
      rateType: 'Intra',
      getValue: (entry: USPricingComparisonRecord) => entry.file1_intra || 0,
    },
    {
      key: 'file2_intra',
      label: 'Intra',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file2',
      rateType: 'Intra',
      getValue: (entry: USPricingComparisonRecord) => entry.file2_intra || 0,
    },
    {
      key: 'diff_intra_pct',
      label: 'Diff %',
      sortable: true,
      textAlign: 'text-center',
      getValue: (entry: USPricingComparisonRecord) => entry.diff_intra_pct || 0,
    },
    {
      key: 'file1_indeterm',
      label: 'Indeterm',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file1',
      rateType: 'Indeterm',
      getValue: (entry: USPricingComparisonRecord) => entry.file1_indeterm || 0,
    },
    {
      key: 'file2_indeterm',
      label: 'Indeterm',
      sortable: true,
      textAlign: 'text-center',
      customRender: true,
      fileBadge: 'file2',
      rateType: 'Indeterm',
      getValue: (entry: USPricingComparisonRecord) => entry.file2_indeterm || 0,
    },
    {
      key: 'diff_indeterm_pct',
      label: 'Diff %',
      sortable: true,
      textAlign: 'text-center',
      getValue: (entry: USPricingComparisonRecord) => entry.diff_indeterm_pct || 0,
    },
  ];

  const usStore = useUsStore();
  const lergStore = useLergStoreV2();
  const COMPARISON_TABLE_NAME = 'comparison_results';

  // Initialize table data composable
  const {
    // Data
    displayedData,
    totalFilteredItems,

    // Loading states
    isDataLoading: isLoading,
    isFiltering,

    // Error handling
    dataError: error,

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
    fetchPageData,
    resetPaginationAndLoad,
    goToPage,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
    goToLastPage,
    handleDirectPageInput,

    // DB instance
    dbInstance,

    // US-specific
    availableStates,
    fetchUniqueStates,
    fetchUniqueStatesFromData,
  } = useUSTableData<USPricingComparisonRecord>({
    dbName: DBName.US_PRICING_COMPARISON,
    tableName: COMPARISON_TABLE_NAME,
    itemsPerPage: 50,
    sortKey: 'npanxx',
    sortDirection: 'asc',
    tableHeaders,
  });

  // --- Metro Filter Composable ---
  const {
    selectedMetros,
    metroSearchQuery,
    filteredMetroOptions,
    totalSelectedPopulation,
    targetedNPAsDisplay,
    areAllMetrosSelected,
    metroAreaCodesToFilter,
    toggleMetroSelection,
    isMetroSelected,
    handleSelectAllMetros,
    removeSelectedMetro,
    clearMetroSearch,
    clearAllSelectedMetros,
    formatPopulation,
  } = useMetroFilter();

  const isMetroAreaVisible = ref(true); // For collapsible metro chip grid

  // Re-introducing the missing refs that were accessed in the template
  const isPageLoading = ref<boolean>(false); // Loading state for page changes and initial data load for a filter set
  const isPerformingPageLevelSort = ref<boolean>(false); // True if sorting is done on the current page data only

  // Function to toggle metro area visibility
  function toggleMetroAreaVisibility() {
    isMetroAreaVisible.value = !isMetroAreaVisible.value;
  }

  // Import metroAreaOptions for "Select Top N"
  import { metroAreaOptions as allMetroOptionsList } from '@/types/constants/metro-population';

  function selectTopNMetros(count: number) {
    const sortedByPopulation = [...allMetroOptionsList].sort((a, b) => b.population - a.population);
    const topN = sortedByPopulation.slice(0, count);
    clearAllSelectedMetros(); // Clear existing selections from composable
    topN.forEach((metro) => {
      // toggleMetroSelection will add it if not present, effectively selecting it.
      // No need to check isMetroSelected if the goal is to set selection to these topN.
      toggleMetroSelection(metro);
    });
  }

  // Filter State Variables
  const npanxxSearchInput = ref<string>(''); // Renamed from searchTerm
  const npanxxFilterTerms = ref<string[]>([]); // New ref for processed NPANXX terms
  const selectedState = ref<string>('');
  const selectedCheaper = ref<'' | 'file1' | 'file2' | 'same'>(''); // Rate comparison filter

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

  // --- Get Filenames for Headers ---
  const fileName1 = computed(() => {
    const names = usStore.getFileNames;
    return names.length > 0 ? names[0].replace(/\.csv$/i, '') : 'File 1';
  });

  const fileName2 = computed(() => {
    const names = usStore.getFileNames;
    return names.length > 1 ? names[1].replace(/\.csv$/i, '') : 'File 2';
  });

  // Rate comparison filter options
  const rateComparisonOptions = computed(() => [
    { value: '', label: 'All Comparisons' },
    { value: 'file1', label: `${fileName1.value} Cheaper` },
    { value: 'file2', label: `${fileName2.value} Cheaper` },
    { value: 'same', label: 'Same Rate' },
  ]);

  // Computed property to structure states for the dropdown with optgroup
  const groupedAvailableStates = computed(() => {
    const grouped = groupRegionCodes(availableStates.value);

    return [
      { label: 'United States', codes: grouped['US'] || [] },
      { label: 'Canada', codes: grouped['CA'] || [] },
      { label: 'Other Countries', codes: grouped['OTHER'] || [] },
    ].filter((group) => group.codes.length > 0);
  });

  // Helper function to get display name for state, province, or country
  function getRegionDisplayName(code: string): string {
    // Special handling for US territories and common abbreviations
    const territoryNames: Record<string, string> = {
      'PR': 'Puerto Rico',
      'VI': 'U.S. Virgin Islands', 
      'GU': 'Guam',
      'AS': 'American Samoa',
      'MP': 'Northern Mariana Islands',
      'DC': 'District of Columbia',
    };

    // Check territory names first
    if (territoryNames[code]) {
      return territoryNames[code];
    }

    // Try US states
    const usState = lergStore.getUSStates.find(state => state.code === code);
    if (usState) {
      return usState.name;
    }

    // Try Canadian provinces  
    const caProvince = lergStore.getCanadianProvinces.find(province => province.code === code);
    if (caProvince) {
      return caProvince.name;
    }

    // Try other countries
    const country = lergStore.getDistinctCountries.find(country => country.code === code);
    if (country) {
      return country.name;
    }

    // Fall back to the code itself
    return code;
  }

  // Helper function to get display name for selected state (handles both individual and group selections)
  function getSelectedStateDisplayName(selectedValue: string): string {
    // Handle group selections
    if (selectedValue === 'GROUP_UNITED_STATES') {
      return 'All United States';
    } else if (selectedValue === 'GROUP_CANADA') {
      return 'All Canada';
    } else if (selectedValue === 'GROUP_OTHER_COUNTRIES') {
      return 'All Other Countries';
    } else {
      // Handle individual selections
      return getRegionDisplayName(selectedValue) + ' (' + selectedValue + ')';
    }
  }

  // Create filter functions for the composable
  function createFilters(): FilterFunction<USPricingComparisonRecord>[] {
    const filters: FilterFunction<USPricingComparisonRecord>[] = [];

    // NPANXX Search Filter
    if (npanxxFilterTerms.value.length > 0) {
      filters.push((record) => {
        const recordNpanxxLower = record.npanxx.toLowerCase();
        return npanxxFilterTerms.value.some((term) => recordNpanxxLower.startsWith(term));
      });
    }

    // State/Province/Country Filter
    if (selectedState.value) {
      filters.push((record) => {
        // Handle group selections
        if (selectedState.value === 'GROUP_UNITED_STATES') {
          // Filter for US states only (not territories) - use LERG store to look up by NPA
          const npaInfo = lergStore.getOptimizedLocationByNPA(record.npa);
          return npaInfo?.country_code === 'US' && 
                 !['PR', 'VI', 'GU', 'AS', 'MP'].includes(npaInfo.state_province_code);
        } else if (selectedState.value === 'GROUP_CANADA') {
          // Filter for all Canadian provinces - use LERG store to look up by NPA
          const npaInfo = lergStore.getOptimizedLocationByNPA(record.npa);
          return npaInfo?.country_code === 'CA';
        } else if (selectedState.value === 'GROUP_OTHER_COUNTRIES') {
          // Filter for all other countries (not US or Canada) - use LERG store to look up by NPA
          const npaInfo = lergStore.getOptimizedLocationByNPA(record.npa);
          return npaInfo && npaInfo.country_code !== 'US' && npaInfo.country_code !== 'CA';
        } else {
          // Handle individual region selections - use LERG store to look up by NPA
          const npaInfo = lergStore.getOptimizedLocationByNPA(record.npa);
          if (!npaInfo) return false;
          
          // Check if it matches state/province code
          if (npaInfo.state_province_code === selectedState.value) {
            return true;
          }
          // Check if it matches country code
          if (npaInfo.country_code === selectedState.value) {
            return true;
          }
        }
        return false;
      });
    }

    // Metro Area Filter
    if (metroAreaCodesToFilter.value.length > 0) {
      const npaSet = new Set(metroAreaCodesToFilter.value);
      filters.push((record) => npaSet.has(record.npa));
    }

    // Rate Comparison Filter
    if (selectedCheaper.value) {
      filters.push((record) => {
        // Check if ALL individual rate types are identical (not averages)
        const interSame = record.file1_inter === record.file2_inter;
        const intraSame = record.file1_intra === record.file2_intra;
        const indetermSame = record.file1_indeterm === record.file2_indeterm;
        const allSame = interSame && intraSame && indetermSame;
        
        if (selectedCheaper.value === 'same') {
          return allSame;
        }
        
        // For "cheaper" comparisons, calculate average rates (but exclude "same" records)
        if (!allSame) {
          const avgFile1 = ((record.file1_inter || 0) + (record.file1_intra || 0) + (record.file1_indeterm || 0)) / 3;
          const avgFile2 = ((record.file2_inter || 0) + (record.file2_intra || 0) + (record.file2_indeterm || 0)) / 3;
          
          if (selectedCheaper.value === 'file1') {
            return avgFile1 < avgFile2;
          } else if (selectedCheaper.value === 'file2') {
            return avgFile2 < avgFile1;
          }
        }
        
        return false; // Exclude "same" records from "cheaper" filters
      });
    }

    return filters;
  }

  // Replace isExporting ref with the one from composable
  const { isExporting, exportError, exportToCSV, exportToCSVWithContext } = useCSVExport();
  const { transformDataForExport } = useUSExportConfig();

  // Export modal state
  const showExportModal = ref(false);
  const exportData = ref<USPricingComparisonRecord[]>([]);
  const totalExportRecords = ref(0);

  // Export filters for modal
  const exportFilters = computed<USExportFilters>(() => ({
    states: selectedState.value ? [selectedState.value] : [],
    excludeStates: false,
    npanxxSearch: npanxxFilterTerms.value.join(', '),
    metroAreas: selectedMetros.value.map(m => m.displayName),
    countries: [],
    excludeCountries: false,
    rateTypes: [],
  }));

  // Debounced function to process NPANXX input
  const debouncedProcessNpanxxInput = useDebounceFn(() => {
    const terms = npanxxSearchInput.value
      .split(',')
      .map((term) => term.trim().toLowerCase())
      .filter((term) => term.length > 0);
    npanxxFilterTerms.value = terms;
  }, 300);

  // Watch for filter changes and reload data (DEBOUNCED)
  const debouncedResetPaginationAndLoad = useDebounceFn(() => {
    resetPaginationAndLoad(createFilters());
  }, 300);

  // Watcher for the raw NPANXX input string
  watch(npanxxSearchInput, () => {
    debouncedProcessNpanxxInput();
  });

  // Watch for processed NPANXX terms, state changes, metro filter changes, and rate comparison filter
  watch([npanxxFilterTerms, selectedState, metroAreaCodesToFilter, selectedCheaper], () => {
    debouncedResetPaginationAndLoad();
    // Averages will be recalculated via the watch on displayedData or other explicit calls.
  });

  watch(itemsPerPage, () => {
    // When items per page changes, go to page 1 and reload.
    resetPaginationAndLoad(createFilters());
  });

  // --- Metro Filter Watcher (for selectedMetros directly from composable) ---
  watch(
    selectedMetros, // This is the array of selected metro objects
    async () => {
      // When metro selection changes directly (e.g. chip removal, select top N, composable internals),
      // ensure data is reloaded and averages recalculated.
      // The metroAreaCodesToFilter watcher also triggers reload, so this might be slightly redundant
      // but ensures direct manipulations of selectedMetros also trigger updates.
      await debouncedResetPaginationAndLoad();
      await calculateFullFilteredAverages(); // Recalculate averages when metro selection changes
    },
    { deep: true }
  );

  // New function to calculate averages based on ALL filtered data
  async function calculateFullFilteredAverages() {
    if (!dbInstance.value) {
      await initializeDB();
    }

    if (!dbInstance.value) return;

    isCalculatingAverages.value = true;

    const totals = {
      file1_inter: { sum: 0, count: 0 },
      file1_intra: { sum: 0, count: 0 },
      file1_indeterm: { sum: 0, count: 0 },
      file2_inter: { sum: 0, count: 0 },
      file2_intra: { sum: 0, count: 0 },
      file2_indeterm: { sum: 0, count: 0 },
    };

    try {
      const query = dbInstance.value.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);

      const filters = createFilters();
      let filteredQuery = query.toCollection();
      if (filters.length > 0) {
        filteredQuery = filteredQuery.filter((record) => filters.every((fn) => fn(record)));
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

  // Helper function to build applied filters array for metadata
  function buildAppliedFiltersArray(): string[] {
    const appliedFilters: string[] = [];
    
    if (npanxxFilterTerms.value.length > 0) {
      appliedFilters.push(`NPANXX: ${npanxxFilterTerms.value.join(', ')}`);
    }
    
    if (selectedState.value) {
      appliedFilters.push(`State: ${selectedState.value}`);
    }
    
    if (selectedCheaper.value) {
      const option = rateComparisonOptions.value.find(opt => opt.value === selectedCheaper.value);
      appliedFilters.push(`Rate Comparison: ${option?.label || selectedCheaper.value}`);
    }
    
    if (selectedMetros.value.length > 0) {
      appliedFilters.push(`Metro Areas: ${selectedMetros.value.length} selected`);
    }
    
    return appliedFilters;
  }

  // --- CSV Download Function (Updated) ---
  async function downloadCsv(): Promise<void> {
    if (isExporting.value) return;

    try {
      if (!dbInstance.value) {
        await initializeDB();
      }

      if (!dbInstance.value) {
        throw new Error('Database not available for export.');
      }

      // Build query with filters
      let query = dbInstance.value.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);

      const filters = createFilters();
      let queryForData = query.toCollection();
      if (filters.length > 0) {
        queryForData = queryForData.filter((record) => filters.every((fn) => fn(record)));
      }

      const records = await queryForData.toArray();

      // Prepare data for CSV export
      const headers = [
        'NPANXX',
        'State',
        'Country',
        `${fileName1.value} Inter`,
        `${fileName2.value} Inter`,
        'Inter Diff %',
        `${fileName1.value} Intra`,
        `${fileName2.value} Intra`,
        'Intra Diff %',
        `${fileName1.value} Indeterm`,
        `${fileName2.value} Indeterm`,
        'Indeterm Diff %',
      ];

      const rows = records.map((record) => [
        record.npanxx,
        record.stateCode,
        record.countryCode,
        record.file1_inter?.toFixed(6) || 'N/A',
        record.file2_inter?.toFixed(6) || 'N/A',
        record.diff_inter_pct?.toFixed(2) + '%' || 'N/A',
        record.file1_intra?.toFixed(6) || 'N/A',
        record.file2_intra?.toFixed(6) || 'N/A',
        record.diff_intra_pct?.toFixed(2) + '%' || 'N/A',
        record.file1_indeterm?.toFixed(6) || 'N/A',
        record.file2_indeterm?.toFixed(6) || 'N/A',
        record.diff_indeterm_pct?.toFixed(2) + '%' || 'N/A',
      ]);

      // Build filename parts
      const filenameParts = [];
      if (selectedState.value) filenameParts.push(selectedState.value);
      if (npanxxFilterTerms.value.length > 0)
        filenameParts.push(`search_${npanxxFilterTerms.value.join('-')}`);

      // Export using the new context-aware composable
      await exportToCSVWithContext(
        { 
          headers, 
          rows,
          metadata: {
            exportType: 'comparison',
            sourceFiles: metadata?.sourceFiles || [fileName1.value, fileName2.value],
            appliedFilters: buildAppliedFiltersArray(),
          }
        },
        {
          filename: 'us-comparison',
          additionalNameParts: filenameParts,
          quoteFields: true,
          exportContext: 'comparison',
        }
      );
    } catch (err: any) {
      error.value = err.message || 'Failed to export data';
    }
  }

  // --- Export Modal Handlers ---
  async function handleOpenExportModal() {
    if (!dbInstance.value) {
      await initializeDB();
      if (!dbInstance.value) {
        error.value = 'Database not available for export.';
        return;
      }
    }

    try {
      // Get total record count
      const totalTable = dbInstance.value.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);
      totalExportRecords.value = await totalTable.count();

      // Build query with filters
      const filters = createFilters();
      let queryForData = totalTable.toCollection();
      if (filters.length > 0) {
        queryForData = queryForData.filter((record) => filters.every((fn) => fn(record)));
      }

      exportData.value = await queryForData.toArray();

      if (exportData.value.length === 0) {
        error.value = 'No data matches the current filters to export.';
        return;
      }

      // Enhance data with file names for the modal - keep all rate types
      exportData.value = exportData.value.map(record => ({
        ...record,
        destinationName: fileName1.value,
        destinationName2: fileName2.value,
        cheaperFile: determineCheaperFile(record),
      }));

      showExportModal.value = true;
    } catch (err: any) {
      error.value = err.message || 'Failed to prepare export data';
    }
  }

  function determineCheaperFile(record: USPricingComparisonRecord): string {
    const avgFile1 = ((record.file1_inter || 0) + (record.file1_intra || 0) + (record.file1_indeterm || 0)) / 3;
    const avgFile2 = ((record.file2_inter || 0) + (record.file2_intra || 0) + (record.file2_indeterm || 0)) / 3;
    
    if (avgFile1 === avgFile2) return 'Same';
    return avgFile1 < avgFile2 ? fileName1.value : fileName2.value;
  }

  async function handleExportWithOptions(data: USPricingComparisonRecord[], options: USExportFormatOptions) {
    try {
      // Transform data for comparison export - keep all the original rate data
      const comparisonData = data.map(record => ({
        ...record,
        destinationName: fileName1.value,
        destinationName2: fileName2.value,
        // Add truncated filenames for headers
        fileName1Truncated: fileName1.value.substring(0, 6),
        fileName2Truncated: fileName2.value.substring(0, 6),
      }));

      // Force include state and country columns for comparison exports
      const modifiedOptions = {
        ...options,
        includeStateColumn: true,
        includeCountryColumn: true,
      };

      const transformed = transformDataForExport(comparisonData, modifiedOptions, 'comparison');
      
      // Build filename parts
      const filenameParts = [];
      if (selectedState.value) filenameParts.push(selectedState.value);
      if (npanxxFilterTerms.value.length > 0) {
        filenameParts.push(`search_${npanxxFilterTerms.value.join('-')}`);
      }

      // Export using the new context-aware composable  
      await exportToCSVWithContext(transformed, {
        filename: 'us-comparison',
        additionalNameParts: filenameParts,
        quoteFields: true,
        exportContext: 'comparison',
      });
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // --- Sorting Handler ---
  async function handleSort(key: SortableUSComparisonColumn['key']) {
    const header = tableHeaders.find((h) => h.key === key);
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
    await resetPaginationAndLoad(createFilters()); // This will set currentPage to 1 and fetch data
  }
  // --- End Sorting Handler ---

  // --- Lifecycle and Watchers ---
  onMounted(async () => {
    isPageLoading.value = true; // Start with page loading true
    try {
      // Initialize DB first if needed
      if (!dbInstance.value) {
        await initializeDB();
      }
      
      await fetchUniqueStatesFromData(); // Fetch states from comparison data
      await resetPaginationAndLoad(createFilters()); // Then load initial data (first page)
      await calculateFullFilteredAverages(); // Calculate initial averages
    } catch (err) {
      // Handle error silently or show user-friendly message
      console.error('[USDetailedComparisonTable] Error during mount:', err);
    } finally {
      isPageLoading.value = false; // Ensure page loading is set to false after all operations
    }
  });

  // --- Clear All Filters Function ---
  async function handleClearAllFilters() {
    npanxxSearchInput.value = ''; // Clears the input which triggers npanxxFilterTerms update via watcher
    selectedState.value = '';
    selectedCheaper.value = ''; // Clear rate comparison filter
    clearAllSelectedMetros(); // This clears selectedMetros and metroSearchQuery from composable

    // Reset sorting to default
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';

    // Data reload will be triggered by watchers on npanxxFilterTerms, selectedState, and selectedMetros (via metroAreaCodesToFilter)
    // Explicitly calling resetPaginationAndLoad here is safer.
    await resetPaginationAndLoad(createFilters());
    await calculateFullFilteredAverages(); // Recalculate averages after clearing all filters
  }

  // Watcher to trigger average calculation when displayedData changes (e.g., after filtering/pagination)
  watch(
    displayedData,
    async () => {
      if (displayedData.value.length > 0) {
        await calculateFullFilteredAverages();
      }
    },
    { immediate: false }
  );

  // Watcher to refresh available states when data might have changed
  watch(
    () => totalFilteredItems.value,
    async (newTotal, oldTotal) => {
      // If total items changed significantly (e.g., new comparison generated)
      if (oldTotal > 0 && newTotal > 0 && Math.abs(newTotal - oldTotal) > 10) {
        console.log('[USDetailedComparisonTable] Significant data change detected, refreshing available states');
        await fetchUniqueStatesFromData();
        
        // Check if currently selected state still exists
        if (selectedState.value && !availableStates.value.includes(selectedState.value)) {
          const isGroupSelection = selectedState.value.startsWith('GROUP_');
          if (!isGroupSelection) {
            console.log(`[USDetailedComparisonTable] Selected state ${selectedState.value} no longer exists, resetting filter`);
            selectedState.value = '';
          }
        }
      }
    }
  );
</script>
