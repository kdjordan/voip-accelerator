<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <!-- Averages Section -->
    <div class="mb-6">
      <h4 class="text-xs font-medium text-gray-400 uppercase mb-3">Rate Averages</h4>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Interstate Average -->
        <div class="bg-gray-800/60 p-3 rounded-lg text-center">
          <p class="text-sm text-gray-400 mb-1">Inter Avg</p>
          <div class="flex items-center justify-center min-h-[28px]">
            <!-- Only show rate if NOT calculating AND value is not null -->
            <p
              v-if="!isCalculatingAverages && currentDisplayAverages.inter !== null"
              class="text-lg font-semibold text-white font-mono mr-2"
            >
              {{ formatRate(animatedInterAvg) }}
            </p>
            <ArrowPathIcon
              v-if="isCalculatingAverages"
              class="w-4 h-4 text-gray-500 animate-spin"
            />
          </div>
        </div>
        <!-- Intrastate Average -->
        <div class="bg-gray-800/60 p-3 rounded-lg text-center">
          <p class="text-sm text-gray-400 mb-1">Intra Avg</p>
          <div class="flex items-center justify-center min-h-[28px]">
            <!-- Only show rate if NOT calculating AND value is not null -->
            <p
              v-if="!isCalculatingAverages && currentDisplayAverages.intra !== null"
              class="text-lg font-semibold text-white font-mono mr-2"
            >
              {{ formatRate(animatedIntraAvg) }}
            </p>
            <ArrowPathIcon
              v-if="isCalculatingAverages"
              class="w-4 h-4 text-gray-500 animate-spin"
            />
          </div>
        </div>
        <!-- Indeterminate Average -->
        <div class="bg-gray-800/60 p-3 rounded-lg text-center">
          <p class="text-sm text-gray-400 mb-1">Indeterm Avg</p>
          <div class="flex items-center justify-center min-h-[28px]">
            <!-- Only show rate if NOT calculating AND value is not null -->
            <p
              v-if="!isCalculatingAverages && currentDisplayAverages.indeterm !== null"
              class="text-lg font-semibold text-white font-mono mr-2"
            >
              {{ formatRate(animatedIndetermAvg) }}
            </p>
            <ArrowPathIcon
              v-if="isCalculatingAverages"
              class="w-4 h-4 text-gray-500 animate-spin"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Header Row -->
    <div class="mb-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <h3 class="text-sm font-medium text-gray-300">Table Controls</h3>
        <span v-if="!isDataLoading" class="text-sm text-gray-400">
          Showing {{ displayedData.length }} of {{ totalFilteredItems }} NPANXX entries
        </span>
        <span v-else class="text-sm text-gray-400">Loading data...</span>
      </div>
      <BaseButton
        variant="destructive"
        size="small"
        :icon="TrashIcon"
        :loading="store.isLoading"
        :disabled="store.isLoading"
        @click="handleClearData"
        title="Clear all rate sheet data"
      >
        Clear Data
      </BaseButton>
    </div>

    <!-- Filters and Actions Row -->
    <div class="mb-4 flex flex-wrap gap-4 items-center justify-between">
      <!-- Left Side: Filters -->
      <div class="flex items-center gap-4 flex-wrap">
        <!-- Basic Search -->
        <div class="relative">
          <label for="npanxx-search" class="sr-only">Search NPANXX (e.g., 201222, 301333)...</label>
          <input
            id="npanxx-search"
            v-model="searchQuery"
            type="text"
            placeholder="Filter by NPANXX (e.g., 201222, 301333)..."
            class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
          />
        </div>

        <!-- Metro Area Filter Dropdown -->
        <div class="relative w-64">
          <Menu as="div" class="relative inline-block text-left w-full">
            <div>
              <MenuButton
                class="inline-flex w-full justify-between items-center rounded-lg bg-gray-800 py-2.5 pl-3 pr-2 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700 text-white"
                :disabled="isDataLoading"
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

        <!-- State Filter Dropdown -->
        <div class="relative w-52">
          <Listbox v-model="selectedState" as="div">
            <ListboxLabel class="sr-only">Filter by State/Province</ListboxLabel>
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
                :disabled="availableStates.length === 0 || isDataLoading"
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
                  class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
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
        <BaseButton
          variant="primary"
          size="small"
          :icon="XMarkIcon"
          @click="handleClearAllFilters"
          title="Clear all active filters"
          class="ml-1"
        >
          Clear Filters
        </BaseButton>
      </div>

      <!-- Right Side: Actions -->
      <div class="flex items-center gap-4 flex-wrap">
        <BaseButton
          variant="primary"
          size="standard"
          :icon="ArrowDownTrayIcon"
          :loading="isExporting"
          :disabled="totalFilteredItems === 0 || isExporting"
          @click="handleExport"
          title="Export all loaded data"
        >
          Export All
        </BaseButton>
      </div>
    </div>

    <!-- Selected Metros Chips Display -->
    <div v-if="selectedMetros.length > 0" class="my-3 flex flex-wrap gap-2 items-center px-1">
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

    <!-- Metro Filter Summary -->
    <div v-if="selectedMetros.length > 0" class="bg-gray-800/60 p-3 rounded-lg text-sm mb-4">
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

    <!-- Rate Adjustment Section -->
    <div class="bg-gray-900/50 p-4 rounded-lg mb-4">
      <h4 class="text-sm font-medium text-gray-300 mb-4">
        Apply Rate Adjustments (to Filtered Results)
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <!-- Adjustment Type -->
        <div class="relative">
          <Listbox v-model="adjustmentType" as="div">
            <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1"
              >Adjustment</ListboxLabel
            >
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
              >
                <span class="block truncate text-white">{{ selectedAdjustmentTypeLabel }}</span>
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
                    v-for="option in adjustmentTypeOptions"
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
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{
                        option.label
                      }}</span>
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

        <!-- Value Type -->
        <div class="relative">
          <Listbox v-model="adjustmentValueType" as="div">
            <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1">By</ListboxLabel>
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
                :disabled="adjustmentType === 'set'"
              >
                <span
                  class="block truncate"
                  :class="adjustmentType === 'set' ? 'text-gray-500' : 'text-white'"
                >
                  {{ selectedAdjustmentValueTypeLabel }}
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
                    v-for="option in adjustmentValueTypeOptions"
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
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{
                        option.label
                      }}</span>
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

        <!-- Value Input -->
        <div>
          <label for="adjustment-value" class="block text-xs font-medium text-gray-400 mb-1"
            >Value</label
          >
          <input
            id="adjustment-value"
            v-model.number="adjustmentValue"
            type="number"
            min="0"
            step="any"
            placeholder="Enter value..."
            class="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2.5 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <!-- Target Rate Type -->
        <div class="relative">
          <Listbox v-model="adjustmentTargetRate" as="div">
            <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1"
              >Target Rate</ListboxLabel
            >
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
              >
                <span class="block truncate text-white">{{
                  selectedAdjustmentTargetRateLabel
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
                  <ListboxOption
                    v-for="option in adjustmentTargetRateOptions"
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
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{
                        option.label
                      }}</span>
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

        <!-- Apply Button -->
        <div>
          <BaseButton
            variant="primary"
            size="standard"
            class="w-full"
            :icon="ArrowRightIcon"
            :loading="isApplyingAdjustment"
            :disabled="
              isApplyingAdjustment ||
              adjustmentValue === null ||
              adjustmentValue <= 0 ||
              totalFilteredItems === 0
            "
            @click="handleApplyAdjustment"
            title="Apply adjustment to all currently filtered records"
          >
            Apply
          </BaseButton>
        </div>
      </div>
      <!-- Feedback Area -->
      <div v-if="adjustmentStatusMessage || adjustmentError" class="mt-3 text-xs">
        <p v-if="adjustmentStatusMessage" class="text-green-400">{{ adjustmentStatusMessage }}</p>
        <p v-if="adjustmentError" class="text-red-400">Error: {{ adjustmentError }}</p>
      </div>
    </div>

    <!-- Table Container -->
    <div class="overflow-y-auto max-h-[600px] relative min-h-[300px]" ref="scrollContainerRef">
      <!-- Loading overlay for filter changes -->
      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isFiltering"
          class="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-20 rounded-lg"
        >
          <ArrowPathIcon class="animate-spin w-8 h-8 text-white" />
        </div>
      </transition>
      <table class="min-w-full divide-y divide-gray-700 text-sm">
        <thead class="bg-gray-800 sticky top-0 z-10">
          <tr>
            <th
              v-for="header in tableHeaders"
              :key="header.key"
              scope="col"
              class="px-4 py-2 text-gray-300"
              :class="[header.textAlign, { 'cursor-pointer hover:bg-gray-700': header.sortable }]"
              @click="header.sortable ? handleSort(header.key) : null"
            >
              <div class="flex items-center justify-center">
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
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <!-- Loading State -->
          <tr v-if="isDataLoading && !isFiltering">
            <td colspan="7" class="text-center py-10">
              <div class="flex items-center justify-center space-x-2 text-accent">
                <ArrowPathIcon class="animate-spin w-6 h-6" />
                <span>Loading Rate Sheet Data...</span>
              </div>
            </td>
          </tr>

          <!-- Data Rows -->
          <template v-else-if="displayedData.length > 0">
            <tr v-for="entry in displayedData" :key="entry.npanxx" class="hover:bg-gray-700/50">
              <td class="px-4 py-2 text-gray-400 font-mono text-center">{{ entry.npanxx }}</td>
              <td class="px-4 py-2 text-gray-400 text-center">
                {{ lergStore.getLocationByNPA(entry.npa)?.region || 'N/A' }}
              </td>
              <td class="px-4 py-2 text-gray-400 text-center">
                {{ lergStore.getLocationByNPA(entry.npa)?.country || 'N/A' }}
              </td>
              <td class="px-4 py-2 text-white font-mono text-center">
                {{ formatRate(entry.interRate) }}
              </td>
              <td class="px-4 py-2 text-white font-mono text-center">
                {{ formatRate(entry.intraRate) }}
              </td>
              <td class="px-4 py-2 text-white font-mono text-center">
                {{ formatRate(entry.indetermRate) }}
              </td>
              <td class="px-4 py-2 text-gray-400 font-mono text-center">
                {{ store.getCurrentEffectiveDate || 'N/A' }}
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-else>
            <td colspan="7" class="text-center text-gray-500 py-10">
              {{
                totalRecords > 0
                  ? 'No records match the current filters.'
                  : 'No US Rate Sheet data found. Please upload a file.'
              }}
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="displayedData.length > 0 && currentPage === totalPages && totalFilteredItems > 0"
        class="text-center text-gray-600 py-4"
      >
        End of results.
      </div>
      <div
        v-else-if="
          displayedData.length === 0 && totalFilteredItems > 0 && !isDataLoading && !isFiltering
        "
        class="text-center text-gray-600 py-4"
      >
        No results on this page. Try adjusting filters or page number.
      </div>
    </div>

    <!-- Pagination Controls -->
    <div
      class="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400"
    >
      <!-- Items per page selector -->
      <div class="flex items-center gap-2">
        <span>Show:</span>
        <select
          v-model="itemsPerPage"
          class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-1.5"
          :disabled="isDataLoading || isFiltering"
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
          :disabled="!canGoToPreviousPage || isDataLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="First Page"
        >
          &laquo; First
        </BaseButton>
        <BaseButton
          @click="goToPreviousPage"
          :disabled="!canGoToPreviousPage || isDataLoading || isFiltering"
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
            :disabled="isDataLoading || isFiltering"
          />
          of {{ totalPages.toLocaleString() }}
        </span>

        <BaseButton
          @click="goToNextPage"
          :disabled="!canGoToNextPage || isDataLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="Next Page"
        >
          Next &rsaquo;
        </BaseButton>
        <BaseButton
          @click="goToLastPage"
          :disabled="!canGoToNextPage || currentPage === totalPages || isDataLoading || isFiltering"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
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
    TrashIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    CheckIcon,
    ChevronUpDownIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    MagnifyingGlassIcon,
    XCircleIcon,
    XMarkIcon,
  } from '@heroicons/vue/20/solid';
  import type { USRateSheetEntry } from '@/types/domains/rate-sheet-types';
  import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
  import { useLergStore } from '@/stores/lerg-store';
  import { useDebounceFn, useIntersectionObserver, useTransition } from '@vueuse/core';
  import Papa from 'papaparse';
  import useDexieDB from '@/composables/useDexieDB';
  import { DBName } from '@/types/app-types';
  import type { DexieDBBase } from '@/composables/useDexieDB';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import {
    type AdjustmentType,
    type AdjustmentValueType,
    type TargetRateType,
  } from '@/types/domains/rate-sheet-types';
  import Dexie from 'dexie';
  import { useMetroFilter } from '@/composables/filters/useMetroFilter';

  // Minimum time (in ms) the filtering overlay should be displayed
  const MIN_FILTER_DISPLAY_TIME = 400;

  // Type for average values
  interface RateAverages {
    inter: number | null;
    intra: number | null;
    indeterm: number | null;
  }

  // Initialize store and service
  const store = useUsRateSheetStore();
  const lergStore = useLergStore();
  const { getDB } = useDexieDB();
  let dbInstance: DexieDBBase | null = null;
  const RATE_SHEET_TABLE_NAME = 'entries';

  // --- Metro Filter Composable ---
  const {
    selectedMetros,
    metroSearchQuery,
    metroButtonLabel,
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

  // --- Reactive State (Table Loading, Filters, Pagination) ---
  const isDataLoading = ref(false); // Added: Tracks initial data loading state
  // --- Rate Adjustment Options Data ---
  const adjustmentTypeOptions = [
    { value: 'markup', label: 'Markup' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'set', label: 'Set To Value' },
  ] as const;
  const adjustmentValueTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount' },
  ] as const;
  const adjustmentTargetRateOptions = [
    { value: 'all', label: 'All Rates' },
    { value: 'inter', label: 'Interstate Only' },
    { value: 'intra', label: 'Intrastate Only' },
    { value: 'indeterm', label: 'Indeterminate Only' },
  ] as const;
  // --- End Rate Adjustment Options Data ---

  // --- Rate Adjustment State ---
  const adjustmentType = ref<AdjustmentType>(adjustmentTypeOptions[0].value);
  const adjustmentValueType = ref<AdjustmentValueType>(adjustmentValueTypeOptions[0].value);
  const adjustmentValue = ref<number | null>(null);
  const adjustmentTargetRate = ref<TargetRateType>(adjustmentTargetRateOptions[0].value);
  const isApplyingAdjustment = ref(false);
  const adjustmentStatusMessage = ref<string | null>(null);
  const adjustmentError = ref<string | null>(null);
  // --- End Rate Adjustment State ---

  // Moved initialization out of hooks/functions
  // Timeout ID for clearing the status message
  let adjustmentStatusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const searchQuery = ref('');
  const debouncedSearchQuery = ref<string[]>([]); // Changed from string to string[]
  const selectedState = ref<string>('');

  const isFiltering = ref(false);
  const isExporting = ref(false);
  const dataError = ref<string | null>(null);
  const hasMoreData = ref(false); // Add missing hasMoreData ref

  const totalRecords = ref<number>(0); // This might become redundant if totalFilteredItems is always up-to-date

  const displayedData = ref<USRateSheetEntry[]>([]);
  const availableStates = ref<string[]>([]);

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

  // --- Sorting State ---
  const currentSortKey = ref<string>('npanxx'); // Default sort column
  const currentSortDirection = ref<'asc' | 'desc'>('asc'); // Default sort direction

  // Define table headers for dynamic rendering and sorting
  const tableHeaders = ref([
    { key: 'npanxx', label: 'NPANXX', sortable: true, textAlign: 'text-center' },
    { key: 'stateCode', label: 'State', sortable: true, textAlign: 'text-center' }, // Sort by stateCode
    { key: 'countryCode', label: 'Country', sortable: true, textAlign: 'text-center' }, // Sort by countryCode (assuming field exists)
    { key: 'interRate', label: 'Interstate Rate', sortable: true, textAlign: 'text-center' },
    { key: 'intraRate', label: 'Intrastate Rate', sortable: true, textAlign: 'text-center' },
    { key: 'indetermRate', label: 'Indeterminate Rate', sortable: true, textAlign: 'text-center' },
    {
      key: 'effectiveDateGlobal',
      label: 'Effective Date',
      sortable: false,
      textAlign: 'text-center',
    }, // Global date, not sortable per row
  ]);
  // --- End Sorting State ---

  // Computed property to structure states for the dropdown with optgroup
  const groupedAvailableStates = computed(() => {
    const usOptions = availableStates.value.filter((code) => US_STATES.includes(code));
    const caOptions = availableStates.value.filter((code) => CA_PROVINCES.includes(code));

    const groups = [];
    if (usOptions.length > 0) {
      groups.push({ label: 'United States', codes: usOptions });
    }
    if (caOptions.length > 0) {
      groups.push({ label: 'Canada', codes: caOptions });
    }
    return groups;
  });

  // State for Average Calculation
  const currentDisplayAverages = ref<RateAverages>({ inter: null, intra: null, indeterm: null });
  const isCalculatingAverages = ref(false); // Ensuring this definition is clean and correct

  // --- Animated Averages ---
  const transitionConfig = { duration: 500 };
  const interAvgSource = computed(() => currentDisplayAverages.value.inter ?? 0);
  const intraAvgSource = computed(() => currentDisplayAverages.value.intra ?? 0);
  const indetermAvgSource = computed(() => currentDisplayAverages.value.indeterm ?? 0);

  const animatedInterAvg = useTransition(interAvgSource, transitionConfig);
  const animatedIntraAvg = useTransition(intraAvgSource, transitionConfig);
  const animatedIndetermAvg = useTransition(indetermAvgSource, transitionConfig);
  // --- End Animated Averages ---

  const debouncedSearch = useDebounceFn(async () => {
    // Made async
    const terms = searchQuery.value
      .split(',')
      .map((term) => term.trim().toLowerCase())
      .filter((term) => term.length > 0);
    debouncedSearchQuery.value = terms;
    console.log(
      '[USRateSheetTable] Search watcher triggered. NPANXX terms:',
      JSON.parse(JSON.stringify(debouncedSearchQuery.value))
    );
    // Reset sorting when search query changes
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';
    await resetPaginationAndLoad(); // Added await
    await recalculateAndDisplayAverages();
  }, 300);

  const stopSearchWatcher = watch(searchQuery, debouncedSearch);

  // --- Metro Filter Computed Properties ---
  // All metro filter computed properties (filteredMetroOptions, totalSelectedPopulation,
  // targetedNPAsDisplay, areAllMetrosSelected, metroAreaCodesToFilter) are now provided
  // by the useMetroFilter() composable
  // --- End Metro Filter Computed Properties ---

  // --- Sorting UI State ---
  const isPerformingPageLevelSort = ref(false);
  // --- End Sorting UI State ---

  // --- Pagination State ---
  const currentPage = ref(1);
  const itemsPerPage = ref(100); // Default items per page
  const totalFilteredItems = ref(0);
  const itemsPerPageOptions = ref([25, 50, 100, 250, 500]);
  // --- End Pagination State ---

  // --- Pagination Computed Properties ---
  const totalPages = computed(() => {
    if (totalFilteredItems.value === 0) return 1; // Avoid division by zero, show at least 1 page
    return Math.ceil(totalFilteredItems.value / itemsPerPage.value);
  });

  const canGoToPreviousPage = computed(() => currentPage.value > 1);
  const canGoToNextPage = computed(() => currentPage.value < totalPages.value);

  // For direct page input
  const directPageInput = ref<string | number>(currentPage.value);
  watch(currentPage, (newPage) => {
    directPageInput.value = newPage;
  });
  // --- End Pagination Computed Properties ---

  // Watcher for itemsPerPage changes
  const stopItemsPerPageWatcher = watch(itemsPerPage, async () => {
    currentPage.value = 1; // Reset to first page when items per page changes
    await resetPaginationAndLoad(); // Correctly calls the updated reset function
  });

  // Watcher for state filter changes - handles table reload AND average calculation
  const stopStateWatcher = watch(selectedState, async (newStateCode) => {
    // Reset sorting when state filter changes
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';
    console.log('[USRateSheetTable] State watcher triggered. New state:', newStateCode);

    // 1. Reset table data and pagination
    await resetPaginationAndLoad();
    await recalculateAndDisplayAverages();
  });

  // Watcher for metro filter changes
  const stopMetroWatcher = watch(
    selectedMetros,
    async () => {
      console.log(
        '[USRateSheetTable] Metro watcher triggered. Selected metros:',
        JSON.parse(JSON.stringify(selectedMetros.value))
      );
      // Reset sorting when metro filter changes (if desired, or keep current sort)
      // currentSortKey.value = 'npanxx';
      // currentSortDirection.value = 'asc';
      await resetPaginationAndLoad();
      await recalculateAndDisplayAverages();
    },
    { deep: true }
  );

  async function initializeRateSheetDB(): Promise<boolean> {
    if (dbInstance) return true;

    try {
      const targetDbName = DBName.US_RATE_SHEET;
      dbInstance = await getDB(targetDbName);
      if (!dbInstance || !dbInstance.tables.some((t) => t.name === RATE_SHEET_TABLE_NAME)) {
        if (!store.getHasUsRateSheetData) {
          dataError.value = null;
        } else {
          dataError.value = `Rate sheet table '${RATE_SHEET_TABLE_NAME}' seems to be missing. Try re-uploading.`;
        }
        hasMoreData.value = false;
        totalRecords.value = 0;
        displayedData.value = [];
        return false;
      }
      dataError.value = null;
      return true;
    } catch (err: any) {
      dataError.value = err.message || 'Failed to connect to the rate sheet database';
      hasMoreData.value = false;
      totalRecords.value = 0;
      displayedData.value = [];
      return false;
    }
  }

  async function fetchUniqueStates() {
    if (!(await initializeRateSheetDB()) || !dbInstance) {
      availableStates.value = [];
      return;
    }

    try {
      const uniqueRegionCodes = (await dbInstance
        .table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME)
        .orderBy('stateCode')
        .uniqueKeys()) as string[];

      availableStates.value = uniqueRegionCodes.filter(Boolean).sort((a, b) => {
        const aIsUS = US_STATES.includes(a);
        const bIsUS = US_STATES.includes(b);
        const aIsCA = CA_PROVINCES.includes(a);
        const bIsCA = CA_PROVINCES.includes(b);

        if (aIsUS && !bIsUS) return -1;
        if (!aIsUS && bIsUS) return 1;

        if (aIsUS && bIsUS) return a.localeCompare(b);

        if (aIsCA && !bIsCA) return -1;
        if (!aIsCA && bIsCA) return 1;

        if (aIsCA && bIsCA) return a.localeCompare(b);

        return a.localeCompare(b);
      });
    } catch (err: any) {
      availableStates.value = [];
      dataError.value = 'Could not load state/province filter options.';
    }
  }

  async function updateAvailableStates() {
    await fetchUniqueStates();
  }

  async function fetchPageData(pageNumber: number): Promise<{
    data: USRateSheetEntry[];
    totalMatchingRecords: number;
  }> {
    dataError.value = null;
    isDataLoading.value = true; // Indicate loading for the current page fetch
    // DO NOT clear displayedData.value here, let the old data persist while new loads

    try {
      const table = dbInstance!.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
      let query: Dexie.Collection<USRateSheetEntry, any> = table.toCollection();

      // Apply NPANXX Search Filter (if active)
      if (debouncedSearchQuery.value.length > 0) {
        query = query.filter((record) => {
          const recordNpanxxLower = record.npanxx.toLowerCase();
          return debouncedSearchQuery.value.some((term) => recordNpanxxLower.startsWith(term));
        });
      }

      // Apply State Filter (if active)
      if (selectedState.value) {
        query = query.filter((record) => record.stateCode === selectedState.value);
      }

      // Apply Metro Area Filter (if active)
      if (metroAreaCodesToFilter.value.length > 0) {
        const npaSet = new Set(metroAreaCodesToFilter.value);
        query = query.filter((record) => npaSet.has(record.npa));
      }

      // Get total count of matching records *before* pagination and sorting
      const totalMatchingRecords = await query.count();

      // Apply Sorting (DB-Level if possible, otherwise client-side later)
      let dbSortApplied = false;
      const filtersAppliedCount = [
        debouncedSearchQuery.value.length > 0, // Check if array has elements
        selectedState.value,
        metroAreaCodesToFilter.value.length > 0,
      ].filter(Boolean).length;
      const hasComplexFilters =
        filtersAppliedCount > 1 ||
        (metroAreaCodesToFilter.value.length > 0 && filtersAppliedCount > 0); // Simplified complexity check

      if (currentSortKey.value && !hasComplexFilters && typeof query.orderBy === 'function') {
        try {
          query = query.orderBy(currentSortKey.value);
          if (currentSortDirection.value === 'desc') {
            query = query.reverse();
          }
          dbSortApplied = true;
        } catch (sortError) {
          console.warn('Dexie orderBy failed, fallback to client sort', sortError);
          dbSortApplied = false;
        }
      }

      // Apply Pagination
      const dexieOffset = (pageNumber - 1) * itemsPerPage.value;
      let pageData = await query.offset(dexieOffset).limit(itemsPerPage.value).toArray();

      // Client-side sort as a fallback or primary if complex filters are applied or DB sort failed
      if (!dbSortApplied && currentSortKey.value) {
        pageData.sort((a, b) => {
          const valA = (a as any)[currentSortKey.value!];
          const valB = (b as any)[currentSortKey.value!];
          let comparison = 0;
          if (valA === null || valA === undefined)
            return currentSortDirection.value === 'asc' ? -1 : 1;
          if (valB === null || valB === undefined)
            return currentSortDirection.value === 'asc' ? 1 : -1;
          if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
          } else if (valA > valB) {
            comparison = 1;
          } else if (valA < valB) {
            comparison = -1;
          }
          return currentSortDirection.value === 'asc' ? comparison : comparison * -1;
        });
      }

      // Successfully fetched and processed data
      displayedData.value = pageData; // Update displayed data for the current page
      totalFilteredItems.value = totalMatchingRecords; // Update total for pagination UI
      isDataLoading.value = false; // Loading finished

      return {
        data: pageData,
        totalMatchingRecords: totalMatchingRecords,
      };
    } catch (err: any) {
      console.error('Error in fetchPageData:', err);
      dataError.value = err.message || 'Failed to load data for the page';
      // DO NOT set displayedData.value = []; here. Keep old data on error.
      totalFilteredItems.value = 0; // Or consider keeping the old count if that's desired UX on error
      isDataLoading.value = false; // Loading finished (with error)
      return {
        data: [],
        totalMatchingRecords: 0,
      };
    }
  }

  async function resetPaginationAndLoad() {
    const startTime = performance.now();
    isFiltering.value = true;
    await nextTick();

    // isDataLoading.value = true; // fetchPageData will set this

    // scrollContainerRef.value?.scrollTop = 0; // No longer needed
    currentPage.value = 1; // Ensure we are on the first page for a full reset
    dataError.value = null;

    const dbReady = await initializeRateSheetDB();
    if (dbReady && dbInstance) {
      try {
        await fetchPageData(1); // Fetch the first page
      } catch (fetchError) {
        dataError.value = (fetchError as Error).message || 'Failed to fetch initial data.';
      }
    } else {
      totalFilteredItems.value = 0;
      displayedData.value = [];
      if (!dbReady && !dataError.value) dataError.value = 'Database not available.';
    }

    // isDataLoading.value = false; // fetchPageData will set this

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    const remainingTime = MIN_FILTER_DISPLAY_TIME - elapsedTime;

    if (remainingTime > 0) {
      setTimeout(() => {
        isFiltering.value = false;
      }, remainingTime);
    } else {
      isFiltering.value = false;
    }
  }

  /**
   * Calculates the average rates for a given state or the entire dataset.
   * Uses Dexie.each for memory efficiency.
   * @param stateCode Optional state code to filter by.
   * @returns Promise resolving to RateAverages or null if DB error.
   */
  async function calculateAverages(): Promise<RateAverages | null> {
    console.log('[USRateSheetTable] calculateAverages started.');
    console.log(
      '[USRateSheetTable] Current filters for average calculation - NPANXXs:',
      JSON.parse(JSON.stringify(debouncedSearchQuery.value)),
      ', State:',
      selectedState.value,
      ', Metro NPAs:',
      JSON.parse(JSON.stringify(metroAreaCodesToFilter.value))
    );

    const dbReady = await initializeRateSheetDB();
    if (!dbReady || !dbInstance) {
      console.error('[USRateSheetTable] calculateAverages: DB not ready or no instance.');
      return null;
    }

    let sumInter = 0;
    let sumIntra = 0;
    let sumIndeterm = 0;
    let count = 0;

    try {
      const table = dbInstance.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
      let queryChain: Dexie.Collection<USRateSheetEntry, any> | Dexie.Table<USRateSheetEntry, any> =
        table.toCollection(); // Start with the full collection

      // Apply NPANXX Search Filter (if active)
      if (debouncedSearchQuery.value.length > 0) {
        queryChain = queryChain.filter((record) => {
          const recordNpanxxLower = record.npanxx.toLowerCase();
          return debouncedSearchQuery.value.some((term) => recordNpanxxLower.startsWith(term));
        });
      }

      // Apply Metro Area Filter (if active)
      if (metroAreaCodesToFilter.value.length > 0) {
        const npaSet = new Set(metroAreaCodesToFilter.value);
        queryChain = queryChain.filter((record) => npaSet.has(record.npa));
      }

      // Apply State Filter (if active)
      if (selectedState.value) {
        queryChain = queryChain.filter((record) => record.stateCode === selectedState.value);
      }

      const recordCountForAverages = await queryChain.clone().count(); // Clone before count if further chaining happens on original
      console.log(
        `[USRateSheetTable] calculateAverages: Found ${recordCountForAverages} records matching filters for averaging.`
      );

      let logCount = 0;
      const MAX_LOG_ENTRIES = 3;

      await queryChain.each((entry) => {
        if (logCount < MAX_LOG_ENTRIES) {
          console.log(
            `[USRateSheetTable] calculateAverages: Processing entry for avg:`,
            JSON.parse(JSON.stringify(entry))
          );
          logCount++;
        }
        if (typeof entry.interRate === 'number') {
          sumInter += entry.interRate;
        }
        if (typeof entry.intraRate === 'number') {
          sumIntra += entry.intraRate;
        }
        if (typeof entry.indetermRate === 'number') {
          sumIndeterm += entry.indetermRate;
        }
        if (
          typeof entry.interRate === 'number' ||
          typeof entry.intraRate === 'number' ||
          typeof entry.indetermRate === 'number'
        ) {
          count++;
        }
      });

      const averagesResult: RateAverages = {
        inter: count > 0 && !isNaN(sumInter) ? sumInter / count : null,
        intra: count > 0 && !isNaN(sumIntra) ? sumIntra / count : null,
        indeterm: count > 0 && !isNaN(sumIndeterm) ? sumIndeterm / count : null,
      };
      console.log(
        '[USRateSheetTable] calculateAverages: Intermediate sums - Inter:',
        sumInter,
        'Intra:',
        sumIntra,
        'Indeterm:',
        sumIndeterm,
        'Count:',
        count
      );
      console.log(
        '[USRateSheetTable] calculateAverages: Calculated averages:',
        JSON.parse(JSON.stringify(averagesResult))
      );
      return averagesResult;
    } catch (err: any) {
      console.error('[USRateSheetTable] calculateAverages: Error during calculation:', err);
      dataError.value = err.message || 'Failed to calculate averages';
      return null;
    } finally {
      // isCalculatingAverages.value will be reset by the caller recalculateAndDisplayAverages
      console.log('[USRateSheetTable] calculateAverages finished.');
    }
  }

  async function recalculateAndDisplayAverages() {
    console.log(
      '[USRateSheetTable] recalculateAndDisplayAverages started. Current filters - NPANXXs:',
      JSON.parse(JSON.stringify(debouncedSearchQuery.value)),
      ', State:',
      selectedState.value,
      ', Metro NPAs:',
      JSON.parse(JSON.stringify(metroAreaCodesToFilter.value))
    );
    isCalculatingAverages.value = true;
    currentDisplayAverages.value = { inter: null, intra: null, indeterm: null };
    await nextTick();

    const averages = await calculateAverages();
    console.log(
      '[USRateSheetTable] recalculateAndDisplayAverages: Received averages from calculateAverages:',
      JSON.parse(JSON.stringify(averages))
    );
    currentDisplayAverages.value = averages ?? { inter: null, intra: null, indeterm: null };
    console.log(
      '[USRateSheetTable] recalculateAndDisplayAverages: Updated currentDisplayAverages.value:',
      JSON.parse(JSON.stringify(currentDisplayAverages.value))
    );
    isCalculatingAverages.value = false;
    console.log('[USRateSheetTable] recalculateAndDisplayAverages finished.');
  }

  onMounted(async () => {
    if (!lergStore.isLoaded) {
      console.warn('[USRateSheetTable] LERG data not loaded. State names might be unavailable.');
    }

    const dbReady = await initializeRateSheetDB();
    if (dbReady && store.getHasUsRateSheetData) {
      isDataLoading.value = true; // Set loading true only if we proceed to load
      await updateAvailableStates();
      console.log('[USRateSheetTable] onMounted: About to call initial resetPaginationAndLoad.');
      await resetPaginationAndLoad();
      console.log(
        '[USRateSheetTable] onMounted: About to call initial recalculateAndDisplayAverages.'
      );
      await recalculateAndDisplayAverages();
    }
  });

  onBeforeUnmount(() => {
    stopSearchWatcher();
    stopStateWatcher();
    stopMetroWatcher(); // Stop metro watcher
    stopItemsPerPageWatcher(); // Stop itemsPerPage watcher
    // REMOVE: Intersection Observer cleanup if it was here
    // Ensure no references to loadMoreTriggerRef remain implicitly if part of a larger object
  });

  watch(
    () => store.getHasUsRateSheetData,
    async (hasData, oldHasData) => {
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
          // overallAverages.value = null; // Removed
          // stateAverageCache.value.clear(); // Removed
          currentDisplayAverages.value = { inter: null, intra: null, indeterm: null };
        } else {
          isDataLoading.value = true;
          const dbReady = await initializeRateSheetDB();
          if (dbReady) {
            isDataLoading.value = true; // Set loading before fetching
            await updateAvailableStates();
            await resetPaginationAndLoad();
            await recalculateAndDisplayAverages(); // Added call
          } else {
            // If DB isn't ready after upload success, something is wrong,
            // keep loading false, error should be set by initializeRateSheetDB
          }
        }
      }
    },
    { immediate: false }
  );

  /**
   * Formats a rate value for display, including a leading '$' and handling null/undefined.
   * @param rate The rate value.
   * @returns Formatted string (e.g., $0.008000) or 'N/A'.
   */
  function formatRate(rate: number | string | null | undefined): string {
    if (rate === null || rate === undefined || typeof rate !== 'number') {
      return 'N/A';
    }
    return `$${Number(rate).toFixed(6)}`;
  }

  function handleClearData() {
    if (confirm('Are you sure you want to clear all US Rate Sheet data? This cannot be undone.')) {
      // overallAverages.value = null; // Removed
      // stateAverageCache.value.clear(); // Removed
      currentDisplayAverages.value = { inter: null, intra: null, indeterm: null };
      store.clearUsRateSheetData();
    }
  }

  async function handleExport() {
    if (isExporting.value) return;
    const dbReady = await initializeRateSheetDB();
    if (!dbReady || !dbInstance) {
      alert('Database is not ready. Cannot export.');
      return;
    }

    isExporting.value = true;
    dataError.value = null;

    try {
      const table = dbInstance.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);

      const allMatchingData = await table.toArray();

      if (allMatchingData.length === 0) {
        alert('No data found in the rate sheet to export.');
        isExporting.value = false;
        return;
      }

      const fields = [
        { label: 'NPANXX', value: 'npanxx' },
        { label: 'State', value: 'state' },
        { label: 'Country', value: 'country' },
        { label: 'Interstate Rate', value: 'interRate' },
        { label: 'Intrastate Rate', value: 'intraRate' },
        { label: 'Indeterminate Rate', value: 'indetermRate' },
        { label: 'Effective Date', value: 'effectiveDate' },
      ];

      const dataToExport = allMatchingData.map((entry) => {
        const location = lergStore.getLocationByNPA(entry.npa);
        const formatExportRate = (rate: number | string | null | undefined): string => {
          if (rate === null || rate === undefined || typeof rate !== 'number') {
            return 'N/A';
          }
          return Number(rate).toFixed(6);
        };

        return {
          npanxx: `1${entry.npanxx}`,
          state: location?.region || 'N/A',
          country: location?.country || 'N/A',
          interRate: formatExportRate(entry.interRate),
          intraRate: formatExportRate(entry.intraRate),
          indetermRate: formatExportRate(entry.indetermRate),
          effectiveDate: store.getCurrentEffectiveDate || 'N/A',
        };
      });

      const csv = Papa.unparse({
        fields: fields.map((f) => f.label),
        data: dataToExport.map((row) =>
          fields.map((field) => row[field.value as keyof typeof row])
        ),
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filename = 'us-rate-sheet';
      if (selectedState.value) filename += `-${selectedState.value}`;
      if (debouncedSearchQuery.value) filename += `-search_${debouncedSearchQuery.value}`;
      filename += `-${timestamp}.csv`;

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (exportError: any) {
      dataError.value = exportError.message || 'An error occurred during export.';
      alert(`Export failed: ${dataError.value}`);
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

  async function handleApplyAdjustment() {
    if (isApplyingAdjustment.value || !dbInstance) {
      return;
    }
    if (adjustmentValue.value === null || adjustmentValue.value <= 0) {
      adjustmentError.value = 'Please enter a positive adjustment value.';
      adjustmentStatusMessage.value = null;
      return;
    }

    if (adjustmentStatusTimeoutId) {
      clearTimeout(adjustmentStatusTimeoutId);
      adjustmentStatusTimeoutId = null;
    }

    isApplyingAdjustment.value = true;
    adjustmentStatusMessage.value = null;
    adjustmentError.value = null;
    const startTime = performance.now();

    try {
      let collection: Dexie.Collection<USRateSheetEntry, any> = dbInstance
        .table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME)
        .toCollection();

      const filtersApplied: string[] = [];

      if (debouncedSearchQuery.value.length > 0) {
        collection = collection.filter((record: USRateSheetEntry) => {
          const recordNpanxxLower = record.npanxx.toLowerCase();
          return debouncedSearchQuery.value.some((term) => recordNpanxxLower.startsWith(term));
        });
        if (debouncedSearchQuery.value.length === 1) {
          filtersApplied.push(`NPANXX starts with '${debouncedSearchQuery.value[0]}'`);
        } else {
          filtersApplied.push(
            `NPANXXs start with one of [${debouncedSearchQuery.value.join(', ')}]`
          );
        }
      }
      if (selectedState.value) {
        collection = collection.filter(
          (record: USRateSheetEntry) => record.stateCode === selectedState.value
        );
        filtersApplied.push(`Region equals '${selectedState.value}'`);
      }

      // Apply Metro Area Filter (if active)
      if (metroAreaCodesToFilter.value.length > 0) {
        const npaSet = new Set(metroAreaCodesToFilter.value);
        collection = collection.filter((record: USRateSheetEntry) => npaSet.has(record.npa));
        filtersApplied.push(`Metro area NPAs: ${metroAreaCodesToFilter.value.join(', ')}`);
      }

      const filteredRecords = await collection.toArray();
      const recordCount = filteredRecords.length;

      if (recordCount === 0) {
        adjustmentStatusMessage.value =
          'No records match the current filters. No adjustments applied.';
        isApplyingAdjustment.value = false;
        return;
      }

      adjustmentStatusMessage.value = `Applying ${recordCount} updates...`;

      const allUpdatesToApply: { key: any; changes: Partial<USRateSheetEntry> }[] = [];

      for (const record of filteredRecords) {
        if (!record) continue;

        const changes: Partial<USRateSheetEntry> = {};
        let changed = false;
        const targets: (keyof Pick<
          USRateSheetEntry,
          'interRate' | 'intraRate' | 'indetermRate'
        >)[] = [];

        if (adjustmentTargetRate.value === 'all' || adjustmentTargetRate.value === 'inter')
          targets.push('interRate');
        if (adjustmentTargetRate.value === 'all' || adjustmentTargetRate.value === 'intra')
          targets.push('intraRate');
        if (adjustmentTargetRate.value === 'all' || adjustmentTargetRate.value === 'indeterm')
          targets.push('indetermRate');

        targets.forEach((rateField) => {
          const currentRate = record[rateField];
          if (typeof currentRate !== 'number') return;

          let adjustedRate: number;
          const value = adjustmentValue.value!;

          if (adjustmentType.value === 'set') {
            adjustedRate = value;
          } else if (adjustmentValueType.value === 'percentage') {
            const percentage = value / 100;
            adjustedRate =
              currentRate * (adjustmentType.value === 'markup' ? 1 + percentage : 1 - percentage);
          } else {
            adjustedRate = currentRate + (adjustmentType.value === 'markup' ? value : -value);
          }

          const finalRate = Math.max(0, parseFloat(adjustedRate.toFixed(6)));

          if (finalRate !== currentRate) {
            changes[rateField] = finalRate;
            changed = true;
          }
        });

        if (changed && record.id) {
          allUpdatesToApply.push({ key: record.id, changes });
        }
      }

      const updatesCount = allUpdatesToApply.length;
      if (updatesCount === 0) {
        adjustmentStatusMessage.value = 'No changes needed for the matching records.';
        isApplyingAdjustment.value = false;
        return;
      }

      const tableToUpdate = dbInstance.table<USRateSheetEntry, number | string>(
        RATE_SHEET_TABLE_NAME
      );
      await tableToUpdate.bulkUpdate(allUpdatesToApply);

      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      adjustmentStatusMessage.value = `Adjustment complete: ${updatesCount} records updated in ${duration}s.`;

      // --- Refresh data and averages after successful update ---
      console.log(
        '[USRateSheetTable] handleApplyAdjustment: About to refresh data and averages post-adjustment.'
      );
      await resetPaginationAndLoad();
      await recalculateAndDisplayAverages();
      // --- End refresh ---

      // --- Reset adjustment form ---
      adjustmentValue.value = null; // Only reset the value input
      // --- End reset form ---

      adjustmentStatusTimeoutId = setTimeout(() => {
        adjustmentStatusMessage.value = null;
        adjustmentStatusTimeoutId = null;
      }, 4000);

      store.lastDbUpdateTime = Date.now();
    } catch (err: any) {
      adjustmentError.value = err.message || 'An unknown error occurred during adjustment.';
      adjustmentStatusMessage.value = null;
    } finally {
      isApplyingAdjustment.value = false;
    }
  }

  const selectedAdjustmentTypeLabel = computed(
    () => adjustmentTypeOptions.find((opt) => opt.value === adjustmentType.value)?.label || ''
  );
  const selectedAdjustmentValueTypeLabel = computed(
    () =>
      adjustmentValueTypeOptions.find((opt) => opt.value === adjustmentValueType.value)?.label || ''
  );
  const selectedAdjustmentTargetRateLabel = computed(
    () =>
      adjustmentTargetRateOptions.find((opt) => opt.value === adjustmentTargetRate.value)?.label ||
      ''
  );

  function getRegionDisplayName(code: string): string {
    if (!code) return '';
    const stateName = lergStore.getStateNameByCode(code);
    if (stateName !== code) return stateName;
    const provinceName = lergStore.getProvinceNameByCode(code);
    return provinceName;
  }

  // --- Sorting Handler ---
  async function handleSort(key: string) {
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
    // After updating sort state, reload data from the beginning
    await resetPaginationAndLoad();
  }
  // --- End Sorting Handler ---

  // --- Pagination Navigation Functions ---
  async function goToPage(page: number) {
    // Make async
    const startTime = performance.now();
    isFiltering.value = true;
    await nextTick();

    const targetPage = Math.max(1, Math.min(page, totalPages.value || 1));
    if (currentPage.value !== targetPage) {
      currentPage.value = targetPage;
      await fetchPageData(currentPage.value); // Fetch data for the new page
    } else {
      // If already on the target page (e.g., invalid input reset), still need to manage isFiltering
      // Or if fetchPageData wasn't called because page didn't change, ensure isFiltering is handled
    }
    directPageInput.value = currentPage.value; // Sync input

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    const remainingTime = MIN_FILTER_DISPLAY_TIME - elapsedTime;

    if (remainingTime > 0) {
      setTimeout(() => {
        isFiltering.value = false;
      }, remainingTime);
    } else {
      isFiltering.value = false;
    }
  }

  async function goToFirstPage() {
    // Make async
    await goToPage(1);
  }

  async function goToPreviousPage() {
    // Make async
    if (canGoToPreviousPage.value) {
      await goToPage(currentPage.value - 1);
    }
  }

  async function goToNextPage() {
    // Make async
    if (canGoToNextPage.value) {
      await goToPage(currentPage.value + 1);
    }
  }

  async function goToLastPage() {
    // Make async
    await goToPage(totalPages.value);
  }

  async function handleDirectPageInput() {
    // Make async
    const pageNum = parseInt(String(directPageInput.value), 10);
    if (!isNaN(pageNum)) {
      await goToPage(pageNum);
    } else {
      directPageInput.value = currentPage.value;
    }
  }
  // --- End Pagination Navigation Functions ---

  async function handleClearAllFilters() {
    searchQuery.value = '';
    // debouncedSearchQuery will be updated by its watcher or debouncedSearch function indirectly
    selectedState.value = '';
    clearAllSelectedMetros(); // Use composable function instead of local logic

    // Reset sorting to default when clearing all filters might be a good UX
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';

    await resetPaginationAndLoad();
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
