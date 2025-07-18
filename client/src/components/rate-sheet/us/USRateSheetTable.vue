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
        <h3 class="text-lg font-medium text-white">Filter Controls</h3>
        <br />
        <p v-if="!isDataLoading" class="text-sm text-gray-400">
          Showing {{ displayedData.length }} of {{ totalFilteredItems }} NPANXX entries
        </p>
        <span v-else class="text-sm text-gray-400">Loading data...</span>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          variant="primary"
          size="small"
          :icon="ArrowDownTrayIcon"
          :loading="isExporting"
          :disabled="totalFilteredItems === 0 || isExporting"
          @click="handleOpenExportModal"
          title="Export all loaded data (based on current filters)"
        >
          Export Rates
        </BaseButton>
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
    </div>

    <!-- Primary Filters Row -->
    <div class="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <!-- NPANXX Search -->
      <div class="relative md:col-span-2">
        <label for="npanxx-search" class="block text-xs font-medium text-gray-400 mb-1"
          >Filter by NPANXX</label
        >
        <input
          id="npanxx-search"
          v-model="searchQuery"
          type="text"
          placeholder="e.g., 201, 301333..."
          class="bg-gray-800 border border-gray-700 text-white sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
        />
      </div>

      <!-- State Filter Dropdown -->
      <div class="relative">
        <label for="state-filter" class="block text-xs font-medium text-gray-400 mb-1"
          >Filter by State/Province</label
        >
        <Listbox v-model="selectedState" as="div" id="state-filter">
          <div class="relative mt-1">
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-700"
              :disabled="availableStates.length === 0 || isDataLoading"
            >
              <span class="block truncate text-white">{{
                selectedState
                  ? getSelectedStateDisplayName(selectedState)
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
                <ListboxOption v-slot="{ active, selected }" :value="''" as="template">
                  <li
                    :class="[
                      active ? 'bg-gray-700 text-primary-400' : 'bg-gray-600 text-accent',
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

      <!-- Reset All Filters Button -->
      <BaseButton
        variant="secondary"
        size="standard"
        class="w-full"
        :icon="XMarkIcon"
        @click="handleClearAllFilters"
        title="Reset NPANXX, State, and Metro Area filters"
      >
        Reset All Filters
      </BaseButton>
    </div>

    <!-- Metro Area Filters Row -->
    <div class="mb-4">
      <label class="block text-xs font-medium text-gray-400 mb-2 uppercase"
        >Filter by Metro Area</label
      >

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mb-3">
        <!-- Metro Search with Toggle -->
        <div class="md:col-span-1">
          <label for="metro-search-input" class="sr-only">Search Metro Areas</label>
          <div class="relative flex items-center">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="metro-search-input"
              v-model="metroSearchQuery"
              type="text"
              placeholder="Search metros..."
              class="block w-full rounded-l-md border-0 py-2.5 pl-10 bg-gray-800 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
            />
            <button
              @click="isMetroAreaVisible = !isMetroAreaVisible"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              aria-label="Toggle metro area list"
              title="Toggle metro area list"
            >
              <ChevronDownIcon
                :class="{ 'rotate-180 transform': isMetroAreaVisible }"
                class="w-5 h-5 transition-transform duration-200"
              />
            </button>
            <button
              v-if="metroSearchQuery"
              @click="clearMetroSearch"
              class="absolute inset-y-0 right-12 flex items-center pr-3 text-gray-400 hover:text-white mr-1"
              aria-label="Clear metro search"
              title="Clear metro search"
            >
              <XCircleIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Metro Action Buttons -->
        <div class="md:col-span-2 flex flex-wrap items-center justify-start md:justify-end gap-2">
          <BaseButton
            variant="secondary-outline"
            size="small"
            @click="() => selectTopNMetros(10)"
            :disabled="filteredMetroOptions.length === 0 || isDataLoading"
            title="Select the top 10 visible metro areas by population (if available)"
          >
            Select Top 10
          </BaseButton>
          <BaseButton
            variant="secondary-outline"
            size="small"
            @click="() => selectTopNMetros(25)"
            :disabled="filteredMetroOptions.length === 0 || isDataLoading"
            title="Select the top 25 visible metro areas by population (if available)"
          >
            Select Top 25
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="small"
            :disabled="filteredMetroOptions.length === 0 || isDataLoading"
            :title="
              areAllMetrosSelected
                ? 'Deselect all visible metro areas'
                : 'Select all visible metro areas'
            "
            @click="handleSelectAllMetros"
          >
            {{ areAllMetrosSelected ? 'Deselect All' : 'Select All' }}
          </BaseButton>
          <BaseButton
            v-if="selectedMetros.length > 0"
            variant="secondary-outline"
            size="small"
            :disabled="isDataLoading"
            title="Clear all selected metro areas"
            @click="clearAllSelectedMetros"
          >
            Clear Selected ({{ selectedMetros.length }})
          </BaseButton>
        </div>
      </div>

      <!-- Collapsible Metro list display area -->
      <transition name="slide-fade">
        <div
          v-if="isMetroAreaVisible"
          class="overflow-y-auto max-h-96 border border-gray-700 rounded-md bg-gray-700/30 p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
        >
          <template v-if="filteredMetroOptions.length > 0">
            <div
              v-for="metro in filteredMetroOptions"
              :key="metro.key"
              @click="() => toggleMetroSelection(metro)"
              class="flex flex-col items-start p-2.5 hover:bg-gray-600/50 cursor-pointer rounded-md border border-gray-600 h-full"
              :class="{
                'bg-primary-500/10 hover:bg-primary-500/20 border-primary-500/50':
                  isMetroSelected(metro),
                'bg-gray-700/50 hover:bg-gray-600/70': !isMetroSelected(metro),
              }"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center overflow-hidden mr-2">
                  <input
                    type="checkbox"
                    :id="`metro-checkbox-${metro.key}`"
                    :checked="isMetroSelected(metro)"
                    class="h-4 w-4 rounded border-gray-500 text-primary-500 focus:ring-primary-400 focus:ring-offset-gray-700 bg-gray-800 mr-2.5 cursor-pointer"
                    @click.stop
                    @change="() => toggleMetroSelection(metro)"
                  />
                  <label
                    :for="`metro-checkbox-${metro.key}`"
                    :class="[
                      isMetroSelected(metro)
                        ? 'font-semibold text-primary-300'
                        : 'font-normal text-gray-100',
                      'text-sm cursor-pointer line-clamp-1',
                    ]"
                    :title="metro.displayName"
                  >
                    {{ metro.displayName }}
                  </label>
                </div>
                <BaseBadge variant="neutral" size="small">{{
                  formatPopulation(metro.population)
                }}</BaseBadge>
              </div>
            </div>
          </template>
          <div
            v-else-if="metroSearchQuery"
            class="p-4 text-sm text-gray-500 text-center col-span-full"
          >
            No metro areas match your search.
          </div>
          <div v-else class="p-4 text-sm text-gray-500 text-center col-span-full">
            No metro areas available.
          </div>
        </div>
      </transition>

      <!-- Metro Filter Summary -->
      <div v-if="selectedMetros.length > 0" class="bg-gray-800/60 p-3 rounded-lg text-sm my-4">
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
      <div
        v-if="adjustmentStatusMessage || adjustmentError || adjustedNpasThisSession.size > 0"
        class="mt-3 text-xs"
      >
        <p v-if="adjustmentStatusMessage" class="text-green-400">{{ adjustmentStatusMessage }}</p>
        <p v-if="adjustmentError" class="text-red-400">Error: {{ adjustmentError }}</p>
        <div
          v-if="adjustedNpasThisSession.size > 0"
          class="flex items-center justify-between mt-2 p-2 bg-blue-900/30 rounded border border-blue-700/50"
        >
          <p class="text-blue-300">
            <span class="font-medium">{{ adjustedNpasThisSession.size }}</span> NPA(s) adjusted this
            session (protected from re-adjustment)
          </p>
          <BaseButton
            variant="secondary"
            size="small"
            @click="handleResetSession"
            class="text-xs"
            title="Reset session tracking to allow re-adjusting all NPAs"
          >
            Reset Session
          </BaseButton>
        </div>
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
                {{
                  tableHeaders.find((h) => h.key === 'stateCode')?.getValue?.(entry) ||
                  lergStore.getNPAInfo(entry.npa)?.state_province_code ||
                  'N/A'
                }}
              </td>
              <td class="px-4 py-2 text-gray-400 text-center">
                {{ lergStore.getNPAInfo(entry.npa)?.country_code || 'N/A' }}
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
                store.hasUsRateSheetData
                  ? 'No records match the current filters. Try adjusting your search criteria or clearing filters.'
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
          @click="() => goToFirstPage(createFilters())"
          :disabled="!canGoToPreviousPage || isDataLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="First Page"
        >
          &laquo; First
        </BaseButton>
        <BaseButton
          @click="() => goToPreviousPage(createFilters())"
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
            @change="() => handleDirectPageInput(createFilters())"
            @keyup.enter="() => handleDirectPageInput(createFilters())"
            min="1"
            :max="totalPages"
            class="bg-gray-800 border border-gray-700 text-white w-14 text-center sm:text-sm rounded-md p-1.5 focus:ring-primary-500 focus:border-primary-500"
            :disabled="isDataLoading || isFiltering"
          />
          of {{ totalPages.toLocaleString() }}
        </span>

        <BaseButton
          @click="() => goToNextPage(createFilters())"
          :disabled="!canGoToNextPage || isDataLoading || isFiltering"
          size="small"
          variant="secondary"
          class="px-2.5 py-1.5"
          title="Next Page"
        >
          Next &rsaquo;
        </BaseButton>
        <BaseButton
          @click="() => goToLastPage(createFilters())"
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

    <!-- Clear Data Confirmation Modal -->
    <ConfirmationModal
      v-model="showClearDataModal"
      title="Clear US Rate Sheet Data"
      message="This will permanently delete all uploaded US rate sheet data, calculated averages, and session tracking.

This action cannot be undone."
      confirm-button-text="Clear All Data"
      cancel-button-text="Cancel"
      @confirm="confirmClearData"
    />

    <!-- Reset Session Confirmation Modal -->
    <ConfirmationModal
      v-model="showResetSessionModal"
      title="Reset Session Tracking"
      message="This will clear the list of NPAs that have been adjusted during this session.

All NPAs will be available for adjustment again."
      confirm-button-text="Reset Session"
      cancel-button-text="Cancel"
      confirm-button-variant="primary"
      @confirm="confirmResetSession"
    />

    <!-- Export Modal -->
    <USExportModal
      v-model:open="showExportModal"
      export-type="rate-sheet"
      :filters="exportFilters"
      :data="exportData"
      :total-records="totalExportRecords"
      :adjusted-npas="adjustedNpasThisSession"
      :adjustment-details="adjustmentDetailsThisSession"
      :adjustment-operations="adjustmentOperationsThisSession"
      :adjustment-settings="{
        type: adjustmentType,
        valueType: adjustmentValueType,
        value: adjustmentValue,
        targetRate: adjustmentTargetRate
      }"
      :on-export="handleExportWithOptions"
    />
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
    ChevronDownIcon,
  } from '@heroicons/vue/20/solid';
  import type { USRateSheetEntry } from '@/types/domains/rate-sheet-types';
  import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
  import USExportModal from '@/components/exports/USExportModal.vue';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  import { useDebounceFn, useIntersectionObserver, useTransition } from '@vueuse/core';
  import Papa from 'papaparse';
  import { DBName } from '@/types/app-types';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import {
    type AdjustmentType,
    type AdjustmentValueType,
    type TargetRateType,
  } from '@/types/domains/rate-sheet-types';
  import Dexie from 'dexie';
  import { useMetroFilter } from '@/composables/filters/useMetroFilter';
  import {
    US_REGION_CODES,
    CA_REGION_CODES,
    getRegionName,
    sortRegionCodesByName,
    groupRegionCodes,
    RegionType,
  } from '@/types/constants/region-codes';
  import { useCSVExport, type CSVExportOptions } from '@/composables/exports/useCSVExport';
  import { useUSTableData } from '@/composables/tables/useUSTableData';
  import type { FilterFunction } from '@/composables/tables/useTableData';
  import { useUSExportConfig } from '@/composables/exports/useUSExportConfig';
  import type { USExportFilters, USExportFormatOptions } from '@/types/exports';

  // Type for average values
  interface RateAverages {
    inter: number | null;
    intra: number | null;
    indeterm: number | null;
  }

  // Initialize store and service
  const store = useUsRateSheetStore();
  const lergStore = useLergStoreV2();
  const RATE_SHEET_TABLE_NAME = 'entries';

  // Define table headers for dynamic rendering and sorting
  const tableHeaders = ref([
    {
      key: 'npanxx',
      label: 'NPANXX',
      sortable: true,
      textAlign: 'text-center',
      getValue: (entry: USRateSheetEntry) => entry.npanxx,
    },
    {
      key: 'stateCode',
      label: 'State',
      sortable: true,
      textAlign: 'text-center',
      getValue: (entry: USRateSheetEntry) => lergStore.getNPAInfo(entry.npa)?.state_province_code || 'N/A',
    },
    {
      key: 'countryCode',
      label: 'Country',
      sortable: true,
      textAlign: 'text-center',
      getValue: (entry: USRateSheetEntry) =>
        lergStore.getNPAInfo(entry.npa)?.country_code || 'N/A',
    },
    {
      key: 'interRate',
      label: 'Interstate Rate',
      sortable: true,
      textAlign: 'text-center',
      getValue: (entry: USRateSheetEntry) => entry.interRate,
    },
    {
      key: 'intraRate',
      label: 'Intrastate Rate',
      sortable: true,
      textAlign: 'text-center',
      getValue: (entry: USRateSheetEntry) => entry.intraRate,
    },
    {
      key: 'indetermRate',
      label: 'Indeterminate Rate',
      sortable: true,
      textAlign: 'text-center',
      getValue: (entry: USRateSheetEntry) => entry.indetermRate,
    },
    {
      key: 'effectiveDateGlobal',
      label: 'Effective Date',
      sortable: false,
      textAlign: 'text-center',
      getValue: (entry: USRateSheetEntry) => store.getCurrentEffectiveDate || 'N/A',
    },
  ]);

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
  } = useUSTableData<USRateSheetEntry>({
    dbName: DBName.US_RATE_SHEET,
    tableName: RATE_SHEET_TABLE_NAME,
    itemsPerPage: 100,
    sortKey: 'npanxx',
    sortDirection: 'asc',
    tableHeaders: tableHeaders.value,
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
    selectTopNMetros,
    clearAllSelectedMetros,
    formatPopulation,
  } = useMetroFilter();

  // --- Reactive State (Table Filters) ---
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
  const isMetroAreaVisible = ref(true);
  const adjustmentValueType = ref<AdjustmentValueType>(adjustmentValueTypeOptions[0].value);
  const adjustmentValue = ref<number | null>(null);
  const adjustmentTargetRate = ref<TargetRateType>(adjustmentTargetRateOptions[0].value);
  const isApplyingAdjustment = ref(false);
  const adjustmentStatusMessage = ref<string | null>(null);
  const adjustmentError = ref<string | null>(null);
  const adjustedNpasThisSession = ref(new Set<string>()); // Stores NPAs of records adjusted in this session
  const adjustmentDetailsThisSession = ref<Map<string, {
    recordsAffected: number;
    beforeRates: { inter?: number; intra?: number; indeterm?: number };
    afterRates: { inter?: number; intra?: number; indeterm?: number };
    adjustmentType: string;
    adjustmentValue: number;
    adjustmentValueType: string;
    targetRate: string;
  }>>(new Map()); // Stores detailed adjustment information per NPA
  
  // Session-level tracking for adjustment operations
  const adjustmentOperationsThisSession = ref<Array<{
    timestamp: string;
    filtersApplied: string[];
    adjustmentType: string;
    adjustmentValue: number;
    adjustmentValueType: string;
    targetRate: string;
    npasAffected: string[];
    recordsAffected: number;
  }>>([]);
  // --- End Rate Adjustment State ---

  // Moved initialization out of hooks/functions
  // Timeout ID for clearing the status message
  let adjustmentStatusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const searchQuery = ref('');
  const debouncedSearchQuery = ref<string[]>([]); // Changed from string to string[]
  const selectedState = ref<string>('');

  const totalRecords = ref<number>(0); // This might become redundant if totalFilteredItems is always up-to-date

  // Replace the US_STATES and CA_PROVINCES constants with imported ones
  const US_STATES = US_REGION_CODES;
  const CA_PROVINCES = CA_REGION_CODES;

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

  // Create filter functions for the composable
  function createFilters(): FilterFunction<USRateSheetEntry>[] {
    const filters: FilterFunction<USRateSheetEntry>[] = [];

    // NPANXX Search Filter
    if (debouncedSearchQuery.value.length > 0) {
      filters.push((record) => {
        const recordNpanxxLower = record.npanxx.toLowerCase();
        return debouncedSearchQuery.value.some((term) => recordNpanxxLower.startsWith(term));
      });
    }

    // State Filter
    if (selectedState.value) {
      filters.push((record) => {
        // Handle group selections
        if (selectedState.value === 'GROUP_UNITED_STATES') {
          // Filter for US states only (not territories) - use LERG store to look up by NPA
          const npaInfo = lergStore.getNPAInfo(record.npa);
          return npaInfo?.country_code === 'US' && 
                 !['PR', 'VI', 'GU', 'AS', 'MP'].includes(npaInfo.state_province_code);
        } else if (selectedState.value === 'GROUP_CANADA') {
          // Filter for all Canadian provinces - use LERG store to look up by NPA
          const npaInfo = lergStore.getNPAInfo(record.npa);
          return npaInfo?.country_code === 'CA';
        } else if (selectedState.value === 'GROUP_OTHER_COUNTRIES') {
          // Filter for all other countries (not US or Canada) - use LERG store to look up by NPA
          const npaInfo = lergStore.getNPAInfo(record.npa);
          return npaInfo && npaInfo.country_code !== 'US' && npaInfo.country_code !== 'CA';
        } else {
          // Handle individual region selections
          return record.stateCode === selectedState.value;
        }
      });
    }

    // Metro Area Filter
    if (metroAreaCodesToFilter.value.length > 0) {
      const npaSet = new Set(metroAreaCodesToFilter.value);
      filters.push((record) => npaSet.has(record.npa));
    }

    return filters;
  }

  const debouncedSearch = useDebounceFn(async () => {
    const terms = searchQuery.value
      .split(',')
      .map((term) => term.trim().toLowerCase())
      .filter((term) => term.length > 0);
    debouncedSearchQuery.value = terms;
    // Reset sorting when search query changes
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';
    await resetPaginationAndLoad(createFilters());
    await recalculateAndDisplayAverages();
  }, 300);

  const stopSearchWatcher = watch(searchQuery, debouncedSearch);

  // Watcher for itemsPerPage changes
  const stopItemsPerPageWatcher = watch(itemsPerPage, async () => {
    await resetPaginationAndLoad(createFilters());
  });

  // Watcher for state filter changes - handles table reload AND average calculation
  const stopStateWatcher = watch(selectedState, async (newStateCode) => {
    // Reset sorting when state filter changes
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';

    await resetPaginationAndLoad(createFilters());
    await recalculateAndDisplayAverages();
  });

  // Watcher for metro filter changes
  const stopMetroWatcher = watch(
    selectedMetros,
    async () => {
      await resetPaginationAndLoad(createFilters());
      await recalculateAndDisplayAverages();
    },
    { deep: true }
  );

  /**
   * Calculates the average rates for a given state or the entire dataset.
   * Uses Dexie.each for memory efficiency.
   * @returns Promise resolving to RateAverages or null if DB error.
   */
  async function calculateAverages(): Promise<RateAverages | null> {
    if (!dbInstance.value) {
      await initializeDB();
    }

    if (!dbInstance.value) {
      console.error('[USRateSheetTable] calculateAverages: DB not ready or no instance.');
      return null;
    }

    let sumInter = 0;
    let sumIntra = 0;
    let sumIndeterm = 0;
    let count = 0;

    try {
      const table = dbInstance.value.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
      let queryChain: Dexie.Collection<USRateSheetEntry, any> = table.toCollection();

      // Apply filters using the same logic as createFilters()
      const filters = createFilters();
      if (filters.length > 0) {
        queryChain = queryChain.filter((record) => filters.every((fn) => fn(record)));
      }

      const recordCountForAverages = await queryChain.clone().count();

      let logCount = 0;
      const MAX_LOG_ENTRIES = 3;

      await queryChain.each((entry) => {
        if (logCount < MAX_LOG_ENTRIES) {
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

      return averagesResult;
    } catch (err: any) {
      dataError.value = err.message || 'Failed to calculate averages';
      return null;
    }
  }

  async function recalculateAndDisplayAverages() {
    isCalculatingAverages.value = true;
    currentDisplayAverages.value = { inter: null, intra: null, indeterm: null };
    await nextTick();

    const averages = await calculateAverages();

    currentDisplayAverages.value = averages ?? { inter: null, intra: null, indeterm: null };

    isCalculatingAverages.value = false;
  }

  onMounted(async () => {
    adjustedNpasThisSession.value.clear(); // Clear on mount for a fresh session
    adjustmentDetailsThisSession.value.clear(); // Clear adjustment details for a fresh session
    adjustmentOperationsThisSession.value = []; // Clear adjustment operations for a fresh session
    if (!lergStore.isLoaded) {
      console.warn('[USRateSheetTable] LERG data not loaded. State names might be unavailable.');
    }

    // RESPECT UPLOAD GATE: Only load data if not currently uploading
    if (store.getHasUsRateSheetData && !store.getIsUploadInProgress) {
      console.log('[USRateSheetTable] Mounting with existing data and upload gate CLOSED - loading table data');
      await fetchUniqueStates();
      await resetPaginationAndLoad(createFilters());
      await recalculateAndDisplayAverages();
    } else if (store.getIsUploadInProgress) {
      console.log('[USRateSheetTable] Mounting but upload gate is OPEN - skipping data load');
    }
  });

  // Watcher for upload gate changes  
  const stopUploadGateWatcher = watch(
    () => store.getIsUploadInProgress,
    async (isUploading, wasUploading) => {
      // When upload completes (gate closes) and we have data, load it
      if (wasUploading && !isUploading && store.getHasUsRateSheetData) {
        console.log('[USRateSheetTable] Upload gate CLOSED after upload - loading complete data');
        await fetchUniqueStates();
        await resetPaginationAndLoad(createFilters());
        await recalculateAndDisplayAverages();
      }
    },
    { immediate: false }
  );

  onBeforeUnmount(() => {
    stopSearchWatcher();
    stopStateWatcher();
    stopMetroWatcher();
    stopItemsPerPageWatcher();
    stopUploadGateWatcher();
  });

  watch(
    () => store.getHasUsRateSheetData,
    async (hasData, oldHasData) => {
      if (hasData !== oldHasData) {
        if (!hasData) {
          selectedState.value = '';
          searchQuery.value = '';
          currentDisplayAverages.value = { inter: null, intra: null, indeterm: null };
        } else {
          // RESPECT UPLOAD GATE: Only load data if upload is complete
          if (!store.getIsUploadInProgress) {
            console.log('[USRateSheetTable] Data available and upload gate CLOSED - loading table data');
            await fetchUniqueStates();
            await resetPaginationAndLoad(createFilters());
            await recalculateAndDisplayAverages();
          } else {
            console.log('[USRateSheetTable] Data available but upload gate is OPEN - waiting for upload completion');
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
    return Number(rate).toFixed(6);
  }

  // Modal state for confirmations
  const showClearDataModal = ref(false);
  const showResetSessionModal = ref(false);
  const showExportModal = ref(false);
  const exportData = ref<USRateSheetEntry[]>([]);
  const totalExportRecords = ref(0);

  function handleClearData() {
    showClearDataModal.value = true;
  }

  function confirmClearData() {
    currentDisplayAverages.value = { inter: null, intra: null, indeterm: null };
    adjustedNpasThisSession.value.clear(); // Clear adjusted NPAs
    store.clearUsRateSheetData();
    showClearDataModal.value = false;
  }

  function handleResetSession() {
    showResetSessionModal.value = true;
  }

  function confirmResetSession() {
    console.log(
      '[USRateSheetTable] Resetting session tracking. Previously adjusted NPAs:',
      Array.from(adjustedNpasThisSession.value)
    );
    adjustedNpasThisSession.value.clear();
    adjustmentDetailsThisSession.value.clear();
    adjustmentOperationsThisSession.value = []; // Clear adjustment operations history
    adjustmentStatusMessage.value = 'Session tracking reset. All NPAs can now be adjusted again.';

    // Clear the message after a few seconds
    if (adjustmentStatusTimeoutId) {
      clearTimeout(adjustmentStatusTimeoutId);
    }
    adjustmentStatusTimeoutId = setTimeout(() => {
      adjustmentStatusMessage.value = null;
      adjustmentStatusTimeoutId = null;
    }, 3000);
    
    showResetSessionModal.value = false;
  }

  // Replace isExporting ref with the one from composable
  const { isExporting, exportError, exportToCSV } = useCSVExport();
  const { transformDataForExport } = useUSExportConfig();

  // Export filters for modal
  const exportFilters = computed<USExportFilters>(() => ({
    states: selectedState.value ? [selectedState.value] : [],
    excludeStates: false,
    npanxxSearch: debouncedSearchQuery.value.join(', '),
    metroAreas: selectedMetros.value.map(m => m.displayName),
    countries: [],
    excludeCountries: false,
  }));

  async function handleOpenExportModal() {
    if (!dbInstance.value) {
      await initializeDB();
      if (!dbInstance.value) {
        alert('Database is not ready. Cannot export.');
        return;
      }
    }

    try {
      // Get total record count
      const totalTable = dbInstance.value.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
      totalExportRecords.value = await totalTable.count();

      // Get filtered data
      let query: Dexie.Collection<USRateSheetEntry, any> = totalTable.toCollection();
      const currentFilters = createFilters();

      if (currentFilters.length > 0) {
        query = query.filter((record) => currentFilters.every((fn) => fn(record)));
      }

      exportData.value = await query.toArray();

      if (exportData.value.length === 0) {
        alert('No data matches the current filters to export.');
        return;
      }

      // Add effective date to each record
      const effectiveDate = store.getCurrentEffectiveDate || 'N/A';
      exportData.value = exportData.value.map(entry => ({
        ...entry,
        effectiveDate,
      }));

      showExportModal.value = true;
    } catch (error) {
      console.error('Error preparing export data:', error);
      alert('Failed to prepare export data.');
    }
  }

  async function handleExportWithOptions(data: USRateSheetEntry[], options: USExportFormatOptions) {
    try {
      const transformed = transformDataForExport(data, options, 'rate-sheet');
      
      // Apply Excel text formatting to NXX column if in split format
      if (options.npanxxFormat === 'split') {
        transformed.rows = transformed.rows.map(row => ({
          ...row,
          'NXX': `="${row['NXX']}"` // Excel formula to force text format
        }));
      }
      
      const exportOptions: CSVExportOptions = {
        filename: 'us-rate-sheet',
        additionalNameParts: [],
        timestamp: true,
        quoteFields: true,
      };

      if (selectedState.value) {
        exportOptions.additionalNameParts?.push(selectedState.value.replace(/\s+/g, '_'));
      }
      if (debouncedSearchQuery.value.length > 0) {
        const queryPart = debouncedSearchQuery.value.join('-');
        exportOptions.additionalNameParts?.push(`search_${queryPart.replace(/\s+/g, '_')}`);
      }

      await exportToCSV(transformed, exportOptions);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  async function handleExport() {
    if (isExporting.value) return; // Already handled by useCSVExport, but good for clarity

    if (!dbInstance.value) {
      await initializeDB(); // Ensure DB is initialized if not already
      if (!dbInstance.value) {
        alert('Database is not ready. Cannot export.');
        console.error('[Export Debug] DB instance still not ready after init attempt.');
        return;
      }
    }

    try {
      const table = dbInstance.value.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
      let query: Dexie.Collection<USRateSheetEntry, any> = table.toCollection();

      const currentFilters = createFilters();

      if (currentFilters.length > 0) {
        query = query.filter((record) => currentFilters.every((fn) => fn(record)));
      }

      const dataToExport = await query.toArray();

      if (dataToExport.length === 0) {
        alert('No data matches the current filters to export.');

        return;
      }

      const headers = [
        'NPANXX',
        'State',
        'Country',
        'Interstate Rate',
        'Intrastate Rate',
        'Indeterminate Rate',
        'Effective Date',
      ];

      const rows = dataToExport.map((entry) => {
        const npaInfo = lergStore.getNPAInfo(entry.npa); // Get NPA info from enhanced store
        return [
          `1${entry.npanxx}`,
          npaInfo?.state_province_code || 'N/A',
          npaInfo?.country_code || 'N/A',
          // Using the local formatRate which is confirmed to use .toFixed(6)
          typeof entry.interRate === 'number' ? formatRate(entry.interRate) : 'N/A',
          typeof entry.intraRate === 'number' ? formatRate(entry.intraRate) : 'N/A',
          typeof entry.indetermRate === 'number' ? formatRate(entry.indetermRate) : 'N/A',
          store.getCurrentEffectiveDate || 'N/A', // Assuming store is the usRateSheetStore
        ];
      });

      const exportOptions: CSVExportOptions = {
        filename: 'us-rate-sheet',
        additionalNameParts: [],
        timestamp: true, // Default is true in composable, explicit for clarity
        quoteFields: true, // Default is true in composable, explicit for clarity
      };

      if (selectedState.value) {
        exportOptions.additionalNameParts?.push(selectedState.value.replace(/\s+/g, '_'));
      }
      if (debouncedSearchQuery.value && debouncedSearchQuery.value.length > 0) {
        // Assuming debouncedSearchQuery is an array of strings or a single string
        const queryPart = Array.isArray(debouncedSearchQuery.value)
          ? debouncedSearchQuery.value.join('-')
          : debouncedSearchQuery.value;
        exportOptions.additionalNameParts?.push(`search_${queryPart.replace(/\s+/g, '_')}`);
      }

      await exportToCSV({ headers, rows }, exportOptions);
    } catch (err: any) {
      console.error('[Export Debug] Error during export:', err);
      // exportError.value is already set by useCSVExport if the error originated there
      // If the error is from data preparation before calling exportToCSV, dataError (if defined) or a local error ref should be used
      // For now, ensure user is notified.
      alert(`Export failed: ${err.message || 'An unexpected error occurred'}`);
      // If you have a specific dataError ref for this component:
      // dataError.value = err.message || 'Failed to export data';
    }
  }

  async function handleApplyAdjustment() {
    console.log('[USRateSheetTable] handleApplyAdjustment: ENTRY POINT - Function called');
    console.log(
      '[USRateSheetTable] handleApplyAdjustment: isApplyingAdjustment.value =',
      isApplyingAdjustment.value
    );
    console.log('[USRateSheetTable] handleApplyAdjustment: dbInstance.value =', !!dbInstance.value);

    if (isApplyingAdjustment.value || !dbInstance.value) {
      console.log(
        '[USRateSheetTable] handleApplyAdjustment: EARLY EXIT - isApplyingAdjustment or no dbInstance'
      );
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
      console.log(
        '[USRateSheetTable] handleApplyAdjustment: Start. adjustedNpasThisSession:',
        new Set(adjustedNpasThisSession.value)
      );

      let collection: Dexie.Collection<USRateSheetEntry, any> = dbInstance.value
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
        
        // Determine if it's a preset or custom selection
        let metroFilterDesc = '';
        const metroCount = metroAreaCodesToFilter.value.length;
        
        // Check for common presets (you can adjust these counts based on your actual metro presets)
        if (metroCount === 10) {
          metroFilterDesc = 'Metro Filter: Top 10 Metro Areas';
        } else if (metroCount === 25) {
          metroFilterDesc = 'Metro Filter: Top 25 Metro Areas';
        } else if (metroCount === 50) {
          metroFilterDesc = 'Metro Filter: Top 50 Metro Areas';
        } else if (metroCount <= 5) {
          // For small selections, list the NPAs
          metroFilterDesc = `Metro Filter: NPAs ${metroAreaCodesToFilter.value.join(', ')}`;
        } else {
          // For larger custom selections, just show the count
          metroFilterDesc = `Metro Filter: ${metroCount} Metro Areas Selected`;
        }
        
        filtersApplied.push(metroFilterDesc);
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
      const npasBeingAdjustedThisRound = new Set<string>(); // Track NPAs being adjusted in this round

      for (const record of filteredRecords) {
        console.log(
          `[USRateSheetTable] Processing record: NPANXX=${record.npanxx}, NPA=${record.npa}, ID=${record.id}`
        );
        if (!record || !record.id || !record.npa) {
          console.warn('[USRateSheetTable] Skipping record due to missing id or npa:', record);
          continue; // Ensure record, record.id, and record.npa exist
        }

        // Skip if the NPA of this record has already been adjusted in this session
        const isNpaAdjusted = adjustedNpasThisSession.value.has(record.npa);
        console.log(
          `[USRateSheetTable] NPA ${record.npa} in adjustedNpasThisSession? ${isNpaAdjusted}`
        );
        if (isNpaAdjusted) {
          console.log(
            `[USRateSheetTable] SKIPPING record ${record.npanxx} (NPA: ${record.npa}) as its NPA was already adjusted this session.`
          );
          continue;
        }

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

        // Track adjustment details for this NPA
        const npaKey = record.npa;
        if (!adjustmentDetailsThisSession.value.has(npaKey)) {
          adjustmentDetailsThisSession.value.set(npaKey, {
            recordsAffected: 0,
            beforeRates: {},
            afterRates: {},
            adjustmentType: adjustmentType.value,
            adjustmentValue: adjustmentValue.value!,
            adjustmentValueType: adjustmentValueType.value,
            targetRate: adjustmentTargetRate.value
          });
        }
        const npaDetails = adjustmentDetailsThisSession.value.get(npaKey)!;

        targets.forEach((rateField) => {
          const currentRate = record[rateField];
          if (typeof currentRate !== 'number') return;

          // Store the before rate if we haven't already for this NPA
          const rateType = rateField === 'interRate' ? 'inter' : 
                          rateField === 'intraRate' ? 'intra' : 'indeterm';
          
          if (npaDetails.beforeRates[rateType] === undefined) {
            npaDetails.beforeRates[rateType] = currentRate;
          }

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
            
            // Store the after rate
            npaDetails.afterRates[rateType] = finalRate;
          }
        });

        if (changed && record.id) {
          allUpdatesToApply.push({ key: record.id, changes });
          // Track this NPA as being adjusted in this round
          npasBeingAdjustedThisRound.add(record.npa);
          
          // Increment the record count for this NPA
          npaDetails.recordsAffected++;
          
          console.log(
            `[USRateSheetTable] Adding NPA ${record.npa} to npasBeingAdjustedThisRound (will be added to session tracking after successful update)`
          );
        }
      }

      console.log(
        '[USRateSheetTable] Records to update (allUpdatesToApply):',
        JSON.parse(JSON.stringify(allUpdatesToApply))
      );
      const updatesCount = allUpdatesToApply.length;
      if (updatesCount === 0) {
        adjustmentStatusMessage.value = 'No changes needed for the matching records.';
        isApplyingAdjustment.value = false;
        return;
      }

      const tableToUpdate = dbInstance.value.table<USRateSheetEntry, number | string>(
        RATE_SHEET_TABLE_NAME
      );
      await tableToUpdate.bulkUpdate(allUpdatesToApply);

      // Add successfully updated NPAs to the session tracking
      console.log(
        '[USRateSheetTable] Adding NPAs from this round to adjustedNpasThisSession:',
        Array.from(npasBeingAdjustedThisRound)
      );

      npasBeingAdjustedThisRound.forEach((npa) => {
        adjustedNpasThisSession.value.add(npa);
        console.log(`[USRateSheetTable] Added NPA ${npa} to adjustedNpasThisSession`);
      });

      // Track this adjustment operation for session history
      const adjustmentOperation = {
        timestamp: new Date().toISOString(),
        filtersApplied: filtersApplied.length > 0 ? filtersApplied : ['No filters - all data'],
        adjustmentType: adjustmentType.value,
        adjustmentValue: adjustmentValue.value!,
        adjustmentValueType: adjustmentValueType.value,
        targetRate: adjustmentTargetRate.value,
        npasAffected: Array.from(npasBeingAdjustedThisRound).sort(),
        recordsAffected: updatesCount
      };
      
      adjustmentOperationsThisSession.value.push(adjustmentOperation);
      console.log('[USRateSheetTable] Tracked adjustment operation:', adjustmentOperation);

      console.log(
        '[USRateSheetTable] handleApplyAdjustment: End. adjustedNpasThisSession:',
        new Set(adjustedNpasThisSession.value)
      );

      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      adjustmentStatusMessage.value = `Adjustment complete: ${updatesCount} records updated in ${duration}s.`;

      await resetPaginationAndLoad(createFilters());
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

  // Computed property to structure states for the dropdown with optgroup
  const groupedAvailableStates = computed(() => {
    const grouped = groupRegionCodes(availableStates.value);

    return [
      { label: 'United States', codes: grouped['US'] || [] },
      { label: 'Canada', codes: grouped['CA'] || [] },
      { label: 'Other Countries', codes: grouped['OTHER'] || [] },
    ].filter((group) => group.codes.length > 0);
  });

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
    await resetPaginationAndLoad(createFilters());
  }
  // --- End Sorting Handler ---

  async function handleClearAllFilters() {
    searchQuery.value = '';
    selectedState.value = '';
    clearAllSelectedMetros();

    // Reset sorting to default when clearing all filters
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';

    await resetPaginationAndLoad(createFilters());
  }
</script>

<style scoped>
  /* General transition for smooth visibility changes */
  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
  }

  thead th {
    position: sticky;
    top: 0;
    background-color: #1f2937; /* bg-gray-800 */
    z-index: 10;
  }
</style>
