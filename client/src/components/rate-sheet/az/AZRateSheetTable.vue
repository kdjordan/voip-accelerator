<template>
  <div class="bg-gray-900/50 p-4 rounded-lg min-h-[400px]">
    <AZEffectiveDates />

    <!-- Global Adjustment -->
    <AZGlobalAdjustment />

    <!-- Bucket Bulk Adjustment -->
    <AZBucketBulkAdjustment />

    <!-- Filters -->
    <div class="mb-4" :class="{ 'min-h-[16rem]': filteredData.length === 0 }">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <h3 class="text-sm font-medium text-gray-300">Table Controls</h3>
          <span class="text-sm text-gray-400">
            Showing {{ filteredData.length }} destinations
          </span>
        </div>
        <!-- Updated buttons container -->
        <div class="flex items-center gap-2">
          <BaseButton
            variant="primary"
            size="small"
            :icon="ArrowDownTrayIcon"
            :disabled="!store.canExport"
            @click="handleExport"
            :title="
              store.canExport ? 'Export Rate Sheet' : 'Resolve all rate conflicts before exporting'
            "
          >
            Export Rate Sheet
          </BaseButton>
          <BaseButton
            variant="destructive"
            size="small"
            :icon="TrashIcon"
            @click="handleClearData"
            title="Clear all loaded rate sheet data"
          >
            Delete Data
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <!-- Filter -->
        <div class="w-full">
          <Listbox v-model="filterStatus" as="div">
            <ListboxLabel class="block text-sm font-medium text-gray-400 mb-1"
              >View Filter</ListboxLabel
            >
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-900 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
              >
                <span class="block truncate text-gray-300">{{ selectedFilterLabel }}</span>
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
                    v-for="option in filterOptions"
                    :key="option.value"
                    :value="option.value"
                    v-slot="{ active, selected }"
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

        <!-- Rate Bucket Filter -->
        <div class="w-full">
          <Listbox v-model="selectedRateBucket" as="div">
            <ListboxLabel class="block text-sm font-medium text-gray-400 mb-1">
              Rate Bucket Filter
            </ListboxLabel>
            <div class="relative mt-1">
              <ListboxButton
                class="relative w-full cursor-default rounded-lg bg-gray-900 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
                :class="{ 'opacity-50': !canUseBucketFilter }"
                :disabled="!canUseBucketFilter"
              >
                <span class="block truncate text-gray-300">{{ selectedBucketLabel }}</span>
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
                    v-for="bucket in RATE_BUCKETS"
                    :key="bucket.type"
                    :value="bucket.type"
                    v-slot="{ active, selected }"
                    as="template"
                  >
                    <li
                      :class="[
                        active ? 'bg-accent/20 text-accent' : 'text-gray-300',
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                      ]"
                    >
                      <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                        {{ bucket.label }}
                      </span>
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

        <!-- Search -->
        <div>
          <label class="block text-sm text-gray-400 mb-1">Search</label>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by Name or Prefix Start..."
              class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2 pr-8"
            />
            <div v-if="isSearching" class="absolute right-2 top-1/2 transform -translate-y-1/2">
              <ArrowPathIcon class="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          </div>
        </div>

        <!-- Actions Column - Remove Export button from here since it's moved up -->
        <div>
          <!-- Bulk Actions -->
          <div v-if="store.getDiscrepancyCount > 0">
            <label class="block text-sm text-gray-400 mb-1">Bulk Actions</label>
            <div class="space-y-2">
              <!-- Action buttons -->
              <div class="flex gap-2">
                <BaseButton
                  :variant="
                    isBulkProcessing && bulkMode === 'highest' ? 'primary' : 'secondary-outline'
                  "
                  size="standard"
                  class="flex-1"
                  :loading="isBulkProcessing && bulkMode === 'highest'"
                  :disabled="isBulkProcessing"
                  @click="handleBulkUpdate('highest')"
                >
                  Use Highest
                </BaseButton>
                <BaseButton
                  :variant="
                    isBulkProcessing && bulkMode === 'lowest' ? 'primary' : 'secondary-outline'
                  "
                  size="standard"
                  class="flex-1"
                  :loading="isBulkProcessing && bulkMode === 'lowest'"
                  :disabled="isBulkProcessing"
                  @click="handleBulkUpdate('lowest')"
                >
                  Use Lowest
                </BaseButton>
              </div>
              <!-- New Most Common Button -->
              <BaseButton
                :variant="
                  isBulkProcessing && bulkMode === 'mostCommon' ? 'primary' : 'secondary-outline'
                "
                size="standard"
                class="w-full"
                :loading="isBulkProcessing && bulkMode === 'mostCommon'"
                :disabled="isBulkProcessing"
                @click="handleBulkUpdateMostCommon"
              >
                Use Most Common Rate
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div
      v-if="filteredData.length > 0"
      class="overflow-hidden rounded-lg bg-gray-800 shadow max-h-[600px] overflow-y-auto"
    >
      <table class="min-w-full divide-y divide-gray-700">
        <thead class="bg-gray-900/50 sticky top-0 z-10">
          <tr>
            <th scope="col" class="w-8 px-3 py-3"></th>
            <th
              v-for="header in tableHeaders"
              :key="header.key"
              scope="col"
              class="px-3 py-3 text-sm font-semibold text-gray-300"
              :class="[
                header.textAlign || 'text-left',
                { 'cursor-pointer hover:bg-gray-700/50': header.sortable },
              ]"
              @click="header.sortable ? handleSort(header) : undefined"
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
                  'justify-end': header.textAlign === 'text-right',
                  'justify-start': header.textAlign === 'text-left' || !header.textAlign,
                }"
              >
                <span>{{ header.label }}</span>
                <template v-if="header.sortable">
                  <div class="flex items-center ml-1">
                    <template v-if="sortColumnKey === header.key && isSorting">
                      <ArrowPathIcon class="w-3 h-3 text-accent animate-spin" />
                    </template>
                    <template v-else>
                      <ArrowUpIcon
                        v-if="sortColumnKey === header.key && sortDirection === 'asc'"
                        class="w-3 h-3 text-accent"
                      />
                      <ArrowDownIcon
                        v-else-if="sortColumnKey === header.key && sortDirection === 'desc'"
                        class="w-3 h-3 text-accent"
                      />
                      <ChevronUpDownIcon v-else class="w-3 h-3 text-gray-400 hover:text-gray-200" />
                    </template>
                  </div>
                </template>
              </div>
            </th>
            <!-- Static headers removed, now dynamically generated -->
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <template v-for="group in paginatedData" :key="group.destinationName">
            <!-- Main Row -->
            <tr
              class="hover:bg-gray-700/50 cursor-pointer"
              :class="{ 'bg-red-900/10': group.hasDiscrepancy }"
              @click="handleToggleExpandRow(group.destinationName)"
            >
              <td class="px-3 py-4">
                <ChevronRightIcon
                  class="h-5 w-5 text-gray-400 transition-transform"
                  :class="{ 'rotate-90': expandedRows.includes(group.destinationName) }"
                />
              </td>
              <td class="px-3 py-4 text-sm">
                <div class="flex items-center">
                  <span class="font-medium text-white">{{ group.destinationName }}</span>
                  <!-- Use BaseBadge for Rate Conflict -->
                  <BaseBadge
                    v-if="group.hasDiscrepancy"
                    variant="destructive"
                    size="small"
                    class="ml-2"
                  >
                    Rate Conflict
                  </BaseBadge>
                </div>
              </td>
              <td class="px-3 py-4 text-sm text-gray-300">{{ group.codes.length }} codes</td>
              <td class="px-3 py-4 text-sm text-gray-300">
                <template v-if="!group.hasDiscrepancy">
                  {{ formatRate(group.rates[0].rate) }}
                </template>
                <template v-else> Multiple Rates </template>
              </td>
              <!-- Change Code column -->
              <td class="px-3 py-4 text-sm text-center align-middle">
                <BaseBadge variant="neutral" size="small">
                  {{ group.changeCode }}
                </BaseBadge>
              </td>
              <td class="px-3 py-4 text-sm text-gray-300">
                <div
                  class="flex items-center"
                  :class="{
                    'text-accent': group.changeCode === ChangeCode.INCREASE,
                    'text-destructive': group.changeCode === ChangeCode.DECREASE,
                    'text-info': group.changeCode === ChangeCode.SAME,
                  }"
                >
                  <CalendarDaysIcon
                    v-if="group.changeCode !== ChangeCode.SAME"
                    class="h-4 w-4 mr-1"
                  />
                  {{ formatDate(group.effectiveDate) }}
                </div>
              </td>
              <td v-if="store.hasMinDuration" class="px-3 py-4 text-sm text-gray-300">
                {{ group.minDuration }}
              </td>
              <td v-if="store.hasIncrements" class="px-3 py-4 text-sm text-gray-300">
                {{ group.increments }}
              </td>
            </tr>

            <!-- Expanded Details -->
            <tr v-if="expandedRows.includes(group.destinationName)">
              <td
                :colspan="
                  1 + // expand icon
                  tableHeaders.length // all dynamic headers
                "
                class="px-3 py-4 bg-gray-900/30"
              >
                <div class="pl-8">
                  <!-- Header for Expanded Row -->
                  <div class="flex items-center justify-between mb-4">
                    <h4 class="text-sm font-medium text-accent text-secondary uppercase">
                      {{ group.hasDiscrepancy ? 'Resolve Rate Conflict' : 'Adjust Rate' }}
                    </h4>
                    <!-- Moved Save Changes button below inputs -->
                    <div class="flex items-center gap-2">
                      <!-- Show/Hide All Codes Button (Only for Discrepancies) -->
                      <!-- REMOVED Show/Hide All Codes Buttons -->
                      <!-- Save Changes Button REMOVED FROM HERE -->
                    </div>
                  </div>

                  <!-- Section 1: Rate Distribution (Only for Multi-Rate) -->
                  <div v-if="group.hasDiscrepancy" class="mb-4">
                    <!-- Flex container for horizontal buttons -->
                    <div class="flex flex-wrap gap-2">
                      <div
                        v-for="rate in getSortedRates(group)"
                        :key="rate.rate"
                        class="w-full sm:w-1/4"
                      >
                        <!-- Rate Button -->
                        <BaseButton
                          :variant="
                            isSelectedRate(group.destinationName, rate.rate) &&
                            userExplicitlySelectedRate[group.destinationName]
                              ? 'primary'
                              : 'secondary-outline'
                          "
                          size="small"
                          class="w-full justify-start text-left font-mono"
                          @click="selectRate(group.destinationName, rate.rate)"
                        >
                          {{ formatRate(rate.rate) }} ({{ Math.round(rate.percentage) }}%)
                          <span
                            v-if="rate.isHighestPercentage"
                            class="ml-2 text-xs px-1.5 py-0.5 bg-accent/10 text-accent rounded-sm"
                          >
                            Most Common
                          </span>
                          <!-- REMOVED Equal Dist. span -->
                        </BaseButton>
                        <!-- REMOVED Codes count and dropdown chevron div -->
                      </div>
                    </div>
                    <!-- Removed code details section -->
                  </div>

                  <!-- Section 2: Unified Adjustment Controls for ALL destinations -->
                  <div v-if="singleRateAdjustments[group.destinationName]" class="space-y-4">
                    <!-- Display Current Rate and Updated Rate Preview -->
                    <div class="flex items-baseline gap-4 text-sm">
                      <div class="flex items-center gap-2">
                        <span class="text-gray-400">{{
                          group.hasDiscrepancy ? 'Selected Base Rate:' : 'Current Rate:'
                        }}</span>
                        <span class="text-white font-semibold font-mono">{{
                          group.hasDiscrepancy
                            ? formatRate(selectedRates[group.destinationName] || 0)
                            : formatRate(
                                originalRates[group.destinationName] ?? group.rates[0].rate
                              )
                        }}</span>
                      </div>
                      <div
                        v-if="hasPendingChanges(group.destinationName)"
                        class="flex items-center gap-2 text-info"
                      >
                        <span class="text-gray-400">Updated Rate:</span>
                        <span class="text-white font-semibold font-mono">{{
                          formatRate(getPendingUpdatedRate(group.destinationName) ?? 0)
                        }}</span>
                      </div>
                      <div v-else class="flex items-center gap-2">
                        <span class="text-gray-400">Updated Rate:</span>
                        <span class="text-gray-500 italic">TBD</span>
                      </div>
                    </div>

                    <!-- Unified Adjustment Input Section (Flex Row) -->
                    <div class="flex items-end gap-4">
                      <!-- Adjustment Type -->
                      <div class="relative flex-1">
                        <Listbox
                          v-model="singleRateAdjustments[group.destinationName].adjustmentType"
                          as="div"
                          :disabled="
                            group.hasDiscrepancy &&
                            selectedRates[group.destinationName] === undefined
                          "
                        >
                          <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1"
                            >Adjustment</ListboxLabel
                          >
                          <div class="relative mt-1">
                            <ListboxButton
                              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
                              :class="{
                                'opacity-50':
                                  group.hasDiscrepancy &&
                                  selectedRates[group.destinationName] === undefined,
                              }"
                            >
                              <span class="block truncate text-white">{{
                                getAdjustmentTypeLabel(
                                  singleRateAdjustments[group.destinationName]?.adjustmentType
                                )
                              }}</span>
                              <span
                                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                              >
                                <ChevronUpDownIcon
                                  class="h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
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
                                      active ? 'bg-accent/20 text-accent' : 'text-gray-300',
                                      'relative cursor-default select-none py-2 pl-10 pr-4',
                                    ]"
                                  >
                                    <span
                                      :class="[
                                        selected ? 'font-medium' : 'font-normal',
                                        'block truncate',
                                      ]"
                                      >{{ option.label }}</span
                                    >
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

                      <!-- Value Type -->
                      <div class="relative flex-1">
                        <Listbox
                          v-model="singleRateAdjustments[group.destinationName].adjustmentValueType"
                          as="div"
                          :disabled="
                            group.hasDiscrepancy &&
                            selectedRates[group.destinationName] === undefined
                          "
                        >
                          <ListboxLabel class="block text-xs font-medium text-gray-400 mb-1"
                            >By</ListboxLabel
                          >
                          <div class="relative mt-1">
                            <ListboxButton
                              class="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:text-sm border border-gray-700"
                              :class="{
                                'opacity-50':
                                  group.hasDiscrepancy &&
                                  selectedRates[group.destinationName] === undefined,
                              }"
                            >
                              <span class="block truncate text-white">{{
                                getAdjustmentValueTypeLabel(
                                  singleRateAdjustments[group.destinationName]?.adjustmentValueType
                                )
                              }}</span>
                              <span
                                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                              >
                                <ChevronUpDownIcon
                                  class="h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
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
                                      active ? 'bg-accent/20 text-accent' : 'text-gray-300',
                                      'relative cursor-default select-none py-2 pl-10 pr-4',
                                    ]"
                                  >
                                    <span
                                      :class="[
                                        selected ? 'font-medium' : 'font-normal',
                                        'block truncate',
                                      ]"
                                      >{{ option.label }}</span
                                    >
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

                      <!-- Value Input -->
                      <div class="flex-1">
                        <label
                          :for="`adjustment-value-${group.destinationName}`"
                          class="block text-xs font-medium text-gray-400 mb-1"
                          >Value</label
                        >
                        <input
                          :id="`adjustment-value-${group.destinationName}`"
                          v-model.number="
                            singleRateAdjustments[group.destinationName].adjustmentValue
                          "
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Enter value..."
                          @input="directSetRates[group.destinationName] = null"
                          class="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2 focus:ring-accent focus:border-accent"
                          :disabled="
                            group.hasDiscrepancy &&
                            selectedRates[group.destinationName] === undefined
                          "
                          :class="{
                            'opacity-50':
                              group.hasDiscrepancy &&
                              selectedRates[group.destinationName] === undefined,
                          }"
                        />
                      </div>

                      <!-- Vertical Separator -->
                      <div class="h-10 border-l border-gray-700 mx-2 self-end mb-1"></div>

                      <!-- Direct Rate Set -->
                      <div class="flex-1">
                        <label
                          :for="`direct-rate-${group.destinationName}`"
                          class="block text-xs font-medium text-gray-400 mb-1"
                          >Set New Rate Directly</label
                        >
                        <input
                          :id="`direct-rate-${group.destinationName}`"
                          v-model.number="directSetRates[group.destinationName]"
                          type="number"
                          min="0"
                          step="0.000001"
                          placeholder="Enter new rate..."
                          @input="
                            singleRateAdjustments[group.destinationName].adjustmentValue = null
                          "
                          class="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2 focus:ring-accent focus:border-accent"
                          :disabled="
                            group.hasDiscrepancy &&
                            selectedRates[group.destinationName] === undefined
                          "
                          :class="{
                            'opacity-50':
                              group.hasDiscrepancy &&
                              selectedRates[group.destinationName] === undefined,
                          }"
                        />
                      </div>
                    </div>

                    <!-- Save Changes Button (Moved here) -->
                    <div class="flex justify-end mt-4">
                      <BaseButton
                        variant="primary"
                        size="small"
                        :icon="ArrowRightIcon"
                        :loading="isSavingChanges === group.destinationName"
                        :disabled="
                          isSavingChanges === group.destinationName ||
                          !hasUnsavedChanges(group.destinationName)
                        "
                        @click="saveRateSelection(group)"
                      >
                        Save Changes
                      </BaseButton>
                    </div>
                  </div>
                  <!-- End Adjustment Controls -->
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls (Phase 1 - Placeholder) -->
    <div
      v-if="filteredData.length > 0"
      class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <!-- Left: Items per page selector -->
      <div class="flex items-center space-x-2">
        <label for="az-items-per-page" class="text-sm text-gray-400">Show:</label>
        <select
          id="az-items-per-page"
          v-model="itemsPerPage"
          @change="handleItemsPerPageChange"
          :disabled="isSearching"
          class="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 px-2 py-1"
          :class="{ 'opacity-50': isSearching }"
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
          @click="goToFirstPage"
          :disabled="!canGoToPreviousPage || isSearching"
          title="First page"
        >
          &laquo; First
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="small"
          @click="goToPreviousPage"
          :disabled="!canGoToPreviousPage || isSearching"
          title="Previous page"
        >
          &lsaquo; Prev
        </BaseButton>

        <span class="text-sm text-gray-400 px-2">Page</span>
        <input
          v-model.number="directPageInput"
          @keyup.enter="handleDirectPageInput"
          type="number"
          min="1"
          :max="totalPages"
          :disabled="isSearching"
          class="w-16 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg text-center focus:ring-primary-500 focus:border-primary-500 px-2 py-1"
          :class="{ 'opacity-50': isSearching }"
          title="Go to page"
        />
        <span class="text-sm text-gray-400 px-2">of {{ totalPages }}</span>

        <BaseButton
          variant="secondary"
          size="small"
          @click="goToNextPage"
          :disabled="!canGoToNextPage || isSearching"
          title="Next page"
        >
          Next &rsaquo;
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="small"
          @click="goToLastPage"
          :disabled="!canGoToNextPage || isSearching"
          title="Last page"
        >
          Last &raquo;
        </BaseButton>
      </div>

      <!-- Right: Results info -->
      <div class="text-sm text-gray-400">
        {{ currentPageRange }}
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-800 rounded-lg">
      <p class="text-gray-400" v-if="isSearching">
        <span class="inline-flex items-center gap-1">
          Searching <ArrowPathIcon class="w-4 h-4 animate-spin" />
        </span>
      </p>
      <p class="text-gray-400" v-else>No destinations found matching your filters</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount, type Ref } from 'vue';
  import {
    ChevronRightIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    CalendarDaysIcon,
    ChevronDownIcon,
    ArrowRightIcon,
    ArrowPathIcon,
    CheckIcon,
    ChevronUpDownIcon,
    ArrowUpIcon, // Added
    ArrowDownIcon, // Added
    ExclamationTriangleIcon,
  } from '@heroicons/vue/24/outline';
  import {
    Listbox,
    ListboxButton,
    ListboxLabel,
    ListboxOptions,
    ListboxOption,
  } from '@headlessui/vue';
  import type { GroupedRateData } from '@/types/domains/rate-sheet-types';
  import { useAzRateSheetStore } from '@/stores/az-rate-sheet-store';
  import { ChangeCode, type ChangeCodeType } from '@/types/domains/rate-sheet-types';
  import { RateSheetService } from '@/services/az-rate-sheet.service';
  import type {
    EffectiveDateSettings,
    EffectiveDateStoreSettings,
    AdjustmentType,
    AdjustmentValueType,
    RateBucketType,
  } from '@/types/domains/rate-sheet-types';
  // import EffectiveDateUpdaterWorker from '@/workers/effective-date-updater.worker?worker'; // Moved to AZEffectiveDates
  import BaseButton from '@/components/shared/BaseButton.vue';
  import BaseBadge from '@/components/shared/BaseBadge.vue'; // Import BaseBadge
  import AZEffectiveDates from './AZEffectiveDates.vue'; // Import the new component

  import AZBucketBulkAdjustment from './AZBucketBulkAdjustment.vue'; // Import the new bucket adjustment component
  import AZGlobalAdjustment from './AZGlobalAdjustment.vue'; // Import the new global adjustment component
  import { RATE_BUCKETS, formatRate } from '@/constants/rate-buckets';
  import TableSorterWorker from '@/workers/table-sorter.worker?worker';

  // Define emits
  const emit = defineEmits(['update:discrepancy-count']);

  // Initialize store and service
  const store = useAzRateSheetStore();
  const rateSheetService = new RateSheetService();
  const groupedData = computed(() => store.groupedData);

  // --- Sorting State ---
  const sortColumnKey = ref<string | null>('destinationName');
  const sortDirection = ref<'asc' | 'desc'>('asc');

  interface SortableAZColumn {
    key: string;
    label: string;
    sortable: boolean;
    textAlign?: string;
    getValue?: (group: GroupedRateData, selectedRatesRef: Ref<Record<string, number>>) => any;
  }

  const tableHeaders = computed<SortableAZColumn[]>(() => {
    const headers: SortableAZColumn[] = [
      {
        key: 'destinationName',
        label: 'Destination',
        sortable: true,
        textAlign: 'text-left',
      },
      {
        key: 'codesCount',
        label: 'Codes',
        sortable: true,
        textAlign: 'text-left',
        getValue: (group) => group.codes.length,
      },
      {
        key: 'displayRate',
        label: 'Rate',
        sortable: true,
        textAlign: 'text-left',
        getValue: (group, selectedRatesRef) => {
          if (group.hasDiscrepancy) {
            if (selectedRatesRef.value[group.destinationName] !== undefined) {
              return selectedRatesRef.value[group.destinationName];
            }
            const commonRate = group.rates.find((r) => r.isCommon)?.rate;
            if (commonRate !== undefined) return commonRate;
            return group.rates[0]?.rate ?? -Infinity;
          }
          return group.rates[0]?.rate ?? -Infinity;
        },
      },
      {
        key: 'changeCode',
        label: 'Change',
        sortable: true,
        textAlign: 'text-center',
      },
      {
        key: 'effectiveDate',
        label: 'Effective',
        sortable: true,
        textAlign: 'text-left',
      },
    ];

    if (store.hasMinDuration) {
      headers.push({
        key: 'minDuration',
        label: 'Duration',
        sortable: true,
        textAlign: 'text-left',
      });
    }
    if (store.hasIncrements) {
      headers.push({
        key: 'increments',
        label: 'Increments',
        sortable: true,
        textAlign: 'text-left',
      });
    }
    return headers;
  });

  // --- End Sorting State ---

  // Computed property to check if date settings have changed from defaults
  const hasDateSettingsChanged = computed(() => {
    // Get default values to compare with current settings
    const today = new Date().toISOString().split('T')[0];

    // Get 7 days from now (default for INCREASE dates)
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const sevenDaysStr = sevenDays.toISOString().split('T')[0];

    // Get defaults for each type
    const defaultSameDate = today;
    const defaultDecreaseDate = today;
    const defaultIncreaseDate = sevenDaysStr;

    // Current values from the ref
    const currentSame = effectiveDateSettings.value.sameCustomDate;
    const currentDecrease = effectiveDateSettings.value.decreaseCustomDate;
    const currentIncrease = effectiveDateSettings.value.increaseCustomDate;

    // Check if any date is different from its default value
    const sameDateChanged = currentSame !== defaultSameDate;
    const decreaseDateChanged = currentDecrease !== defaultDecreaseDate;
    const increaseDateChanged = currentIncrease !== defaultIncreaseDate;

    // Log the comparison for debugging
    console.log('Date Settings Change Check:', {
      defaults: {
        same: defaultSameDate,
        decrease: defaultDecreaseDate,
        increase: defaultIncreaseDate,
      },
      current: {
        same: currentSame,
        decrease: currentDecrease,
        increase: currentIncrease,
      },
      changed: {
        same: sameDateChanged,
        decrease: decreaseDateChanged,
        increase: increaseDateChanged,
      },
      result: sameDateChanged || decreaseDateChanged || increaseDateChanged,
    });

    // Return true if any date has changed
    return sameDateChanged || decreaseDateChanged || increaseDateChanged;
  });

  const expandedRows = ref<string[]>([]);
  const filterStatus = ref<
    'all' | 'conflicts' | 'no-conflicts' | 'change-same' | 'change-increase' | 'change-decrease'
  >('all');
  const selectedRateBucket = ref<RateBucketType>('all');
  const canUseBucketFilter = computed(() => store.canUseBucketAdjustments);
  const selectedBucketLabel = computed(() => {
    const bucket = RATE_BUCKETS.find((b) => b.type === selectedRateBucket.value);
    return bucket?.label || 'All Rates';
  });

  const searchQuery = ref('');
  const debouncedSearchQuery = ref('');
  const isSearching = ref(false);
  const searchProgress = ref(0);
  const searchTotal = ref(0);
  const isSavingChanges = ref<string | null>(null); // Track saving state per destination

  // State for multi-rate (discrepancy) destinations
  const selectedRates = ref<Record<string, number>>({});
  const originalRates = ref<Record<string, number>>({}); // Store original selected/single rate

  // State for single-rate (no discrepancy) destinations
  const singleRateAdjustments = ref<
    Record<
      string,
      {
        adjustmentType: AdjustmentType;
        adjustmentValueType: AdjustmentValueType;
        adjustmentValue: number | null;
      }
    >
  >({});
  const directSetRates = ref<Record<string, number | null>>({});
  const userExplicitlySelectedRate = ref<Record<string, boolean>>({}); // <-- Add state tracker

  // Options for adjustment dropdowns
  const adjustmentTypeOptions = [
    { value: 'markup', label: 'Markup' },
    { value: 'markdown', label: 'Markdown' },
  ];
  const adjustmentValueTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount ($)' },
  ];

  // Add new refs for processing state
  const isBulkProcessing = ref(false);
  const bulkMode = ref<'highest' | 'lowest' | 'mostCommon' | null>(null);
  const processedCount = ref(0);
  const totalToProcess = ref(0);
  const currentDiscrepancyCount = ref(0); // Track current discrepancy count during processing

  // Track which rate's codes are expanded (only for multi-rate)
  const expandedRateCodes = ref<{ [key: string]: number[] }>({});

  // Cache for codes by destination and rate to improve performance
  const codesCache = ref<{ [key: string]: { [rate: number]: string[] } }>({});

  // Track which codes match the current search query
  const matchingCodes = ref<{ [destinationName: string]: { [rate: number]: string[] } }>({});

  // --- Pagination State (Phase 1) ---
  const currentPage = ref(1);
  const itemsPerPage = ref(50);
  const itemsPerPageOptions = ref([10, 25, 50, 100, 250]);
  const directPageInput = ref(1);
  // --- End Pagination State ---

  // Add these properties to handle search state
  let searchDebounceTimeout: NodeJS.Timeout | null = null;

  // Load saved effective date settings from store if available - MOVED TO AZEffectiveDates.vue
  onMounted(() => {
    // console.log('today', new Date().toISOString().split('T')[0]); // MOVED
    // const savedSettings = store.getEffectiveDateSettings; // MOVED
    // MOVED ALL LOGIC TO AZEffectiveDates.vue
    // initWorker(); // MOVED

    // Setup a watcher with debounce for search
    watch(searchQuery, (newValue) => {
      // Cancel any existing debounce timer
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }

      // Set a new timeout
      searchDebounceTimeout = setTimeout(() => {
        debouncedSearchQuery.value = newValue;
        performAsyncSearch(newValue.toLowerCase());
      }, 300); // 300ms debounce
    });

    // Watch for bucket filter changes
    watch(selectedRateBucket, (newValue) => {
      store.setRateBucketFilter(newValue);
    });
  });

  // Single source of truth for filtered data
  const filteredData = computed(() => {
    let filtered = groupedData.value;

    // Apply status filter
    if (filterStatus.value === 'conflicts') {
      filtered = filtered.filter((group) => group.hasDiscrepancy);
    } else if (filterStatus.value === 'no-conflicts') {
      filtered = filtered.filter((group) => !group.hasDiscrepancy);
    } else if (filterStatus.value === 'change-same') {
      filtered = filtered.filter((group) => group.changeCode === ChangeCode.SAME);
    } else if (filterStatus.value === 'change-increase') {
      filtered = filtered.filter((group) => group.changeCode === ChangeCode.INCREASE);
    } else if (filterStatus.value === 'change-decrease') {
      filtered = filtered.filter((group) => group.changeCode === ChangeCode.DECREASE);
    }

    // Apply bucket filter
    filtered = store.getFilteredByRateBucket;

    // If no search query, return filtered data
    if (!debouncedSearchQuery.value) {
      matchingCodes.value = {};
      return filtered;
    }

    const query = debouncedSearchQuery.value.toLowerCase();

    // Fast path: filter by destination name first
    let result = filtered.filter((group) => group.destinationName.toLowerCase().includes(query));

    // If no name matches, search codes
    if (result.length === 0) {
      result = filtered.filter((group) => !!matchingCodes.value[group.destinationName]);
    }

    return result;
  });

  // --- Pagination Computed Properties (Phase 2) ---
  const totalPages = computed(() => {
    if (!filteredData.value || filteredData.value.length === 0) {
      return 1;
    }
    return Math.ceil(filteredData.value.length / itemsPerPage.value);
  });

  const paginatedData = computed(() => {
    if (!filteredData.value) {
      return [];
    }
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredData.value.slice(start, end);
  });
  // --- End Pagination Computed Properties ---

  // --- Pagination UI State (Phase 3) ---
  const canGoToPreviousPage = computed(() => currentPage.value > 1);
  const canGoToNextPage = computed(() => currentPage.value < totalPages.value);

  // Computed property for displaying current page range
  const currentPageRange = computed(() => {
    if (filteredData.value.length === 0) return 'No entries';

    const start = (currentPage.value - 1) * itemsPerPage.value + 1;
    const end = Math.min(currentPage.value * itemsPerPage.value, filteredData.value.length);
    return `Showing ${start.toLocaleString()}-${end.toLocaleString()} of ${filteredData.value.length.toLocaleString()} entries`;
  });
  // --- End Pagination UI State ---

  // --- Pagination Navigation Functions (Phase 3) ---
  function goToNextPage() {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
      directPageInput.value = currentPage.value;
    }
  }

  function goToPreviousPage() {
    if (currentPage.value > 1) {
      currentPage.value--;
      directPageInput.value = currentPage.value;
    }
  }

  function goToFirstPage() {
    currentPage.value = 1;
    directPageInput.value = currentPage.value;
  }

  function goToLastPage() {
    currentPage.value = totalPages.value;
    directPageInput.value = currentPage.value;
  }

  function handleDirectPageInput() {
    const pageNum = Math.max(1, Math.min(directPageInput.value, totalPages.value));
    currentPage.value = pageNum;
    directPageInput.value = pageNum;
  }

  function handleItemsPerPageChange() {
    currentPage.value = 1;
    directPageInput.value = 1;
  }
  // --- End Pagination Functions ---

  // Add a new function to perform the search asynchronously
  async function performAsyncSearch(query: string) {
    if (!query) {
      matchingCodes.value = {};
      isSearching.value = false;
      return;
    }

    isSearching.value = true;
    matchingCodes.value = {};

    const searchGroups = groupedData.value;

    // Process in smaller batches to keep UI responsive
    const batchSize = 5; // Process 5 destinations at a time

    for (let i = 0; i < searchGroups.length; i += batchSize) {
      // Give UI thread a chance to update
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const endIndex = Math.min(i + batchSize, searchGroups.length);
      const batch = searchGroups.slice(i, endIndex);

      for (const group of batch) {
        const matchingCodesByRate: { [rate: number]: string[] } = {};

        // Only process rates if we haven't already found a match for this destination
        // This optimization stops searching once we find any match
        let foundMatch = false;

        for (const rate of group.rates) {
          // Skip long lists if we already found a match for this destination
          if (foundMatch) break;

          const codesForRate = getCodesForRate(group, rate.rate);

          // Early exit for large code lists - first check if any code starts with query
          // This avoids scanning the entire array if there's no match
          if (codesForRate.length > 50) {
            // Quick check with a for loop is faster than filter for large arrays
            let hasMatch = false;
            for (let j = 0; j < Math.min(50, codesForRate.length); j++) {
              if (codesForRate[j].toLowerCase().startsWith(query)) {
                hasMatch = true;
                break;
              }
            }

            // If no match found in our quick check of the first 50 items, skip this rate
            if (!hasMatch) continue;
          }

          // Only do full scan if necessary
          const matches = codesForRate.filter((code) => code.toLowerCase().startsWith(query));

          if (matches.length > 0) {
            matchingCodesByRate[rate.rate] = matches;
            foundMatch = true; // Set flag to skip processing other rates
          }
        }

        // Store matches for this destination if any were found
        if (Object.keys(matchingCodesByRate).length > 0) {
          matchingCodes.value[group.destinationName] = matchingCodesByRate;
        }
      }
    }

    isSearching.value = false;
  }

  function isCodeMatchingSearch(destinationName: string, rate: number, code: string): boolean {
    return !!searchQuery.value && !!matchingCodes.value[destinationName]?.[rate]?.includes(code);
  }

  // --- Toggle Expand Row Logic ---
  function handleToggleExpandRow(destinationName: string) {
    const index = expandedRows.value.indexOf(destinationName);
    if (index > -1) {
      expandedRows.value.splice(index, 1);
    } else {
      const group = groupedData.value.find((g) => g.destinationName === destinationName);
      if (group) {
        // Initialize state *before* adding to expandedRows for both single and multi-rate
        initializeSingleRateState(destinationName);

        // Add to expandedRows *after* state initialization
        expandedRows.value.push(destinationName);

        // Store the original rate when expanding, regardless of discrepancy
        if (originalRates.value[destinationName] === undefined) {
          if (!group.hasDiscrepancy) {
            originalRates.value[destinationName] = group.rates[0].rate;
          } else {
            userExplicitlySelectedRate.value[destinationName] = false; // <-- Initialize tracker
            const mostCommonRate = group.rates.find((r) => r.isCommon)?.rate;
            if (mostCommonRate !== undefined) {
              originalRates.value[destinationName] = mostCommonRate;
              if (selectedRates.value[destinationName] === undefined) {
                selectedRates.value[destinationName] = mostCommonRate;
              }
            }
          }
        }

        // Initialize multi-rate selected rate if it wasn't set by original rate logic above
        if (group.hasDiscrepancy && selectedRates.value[destinationName] === undefined) {
          const mostCommonRate = group.rates.find((r) => r.isCommon)?.rate;
          if (mostCommonRate !== undefined) {
            selectedRates.value[destinationName] = mostCommonRate;
          }
        }
      }
    }
  }
  // --- End Toggle Expand Row Logic ---

  function formatRate(rate: number): string {
    if (typeof rate !== 'number' || isNaN(rate)) {
      return 'N/A'; // Handle invalid input
    }
    return rate.toFixed(6);
  }

  // --- Multi-Rate Logic ---
  function isSelectedRate(destinationName: string, rate: number): boolean {
    return selectedRates.value[destinationName] === rate;
  }

  function selectRate(destinationName: string, rate: number) {
    selectedRates.value[destinationName] = rate;
    userExplicitlySelectedRate.value[destinationName] = true; // <-- Set tracker on explicit click

    // When a new rate is selected, clear both the adjustment value and direct set rate
    if (singleRateAdjustments.value[destinationName]) {
      singleRateAdjustments.value[destinationName].adjustmentValue = null;
    }
    directSetRates.value[destinationName] = null;
  }
  // --- End Multi-Rate Logic ---

  // --- Single-Rate Calculation Helper ---
  function calculateAdjustedRate(currentRate: number, adjustment: any): number {
    if (!adjustment || adjustment.adjustmentValue === null || adjustment.adjustmentValue <= 0) {
      return currentRate;
    }

    let adjustedRate: number;
    const value = adjustment.adjustmentValue!;

    if (adjustment.adjustmentValueType === 'percentage') {
      const percentage = value / 100;
      adjustedRate =
        currentRate * (adjustment.adjustmentType === 'markup' ? 1 + percentage : 1 - percentage);
    } else {
      // fixed amount
      adjustedRate = currentRate + (adjustment.adjustmentType === 'markup' ? value : -value);
    }
    // Ensure rate doesn't go below 0 and format to 6 decimals
    return Math.max(0, parseFloat(adjustedRate.toFixed(6)));
  }
  // --- End Single-Rate Calculation Helper ---

  // --- Change Detection ---
  function hasUnsavedChanges(destinationName: string): boolean {
    const group = groupedData.value.find((g) => g.destinationName === destinationName);
    if (!group) return false;

    const originalRate = originalRates.value[destinationName];
    // No original rate? Can't determine changes.
    if (originalRate === undefined) return false;

    const directRate = directSetRates.value[destinationName];
    const adjustment = singleRateAdjustments.value[destinationName];
    const selectedRate = selectedRates.value[destinationName]; // Base rate for multi-rate
    const userMadeExplicitSelection = userExplicitlySelectedRate.value[destinationName] === true;

    // 1. Check for changes via direct rate input
    const hasDirectRateChange =
      directRate !== null && directRate !== undefined && directRate !== originalRate;
    if (hasDirectRateChange) {
      return true;
    }

    // 2. Check for changes via adjustment calculation
    let hasAdjustmentChange = false;
    if (adjustment?.adjustmentValue !== null && adjustment?.adjustmentValue > 0) {
      // Determine the base rate for adjustment calculation
      const baseRateForAdjustment = group.hasDiscrepancy ? selectedRate : originalRate;
      // Ensure we have a valid base rate to calculate from
      if (baseRateForAdjustment !== undefined) {
        const calculatedRate = calculateAdjustedRate(baseRateForAdjustment, adjustment);
        // Change detected if calculated rate differs from the original stored rate
        hasAdjustmentChange = calculatedRate !== originalRate;
      }
    }
    if (hasAdjustmentChange) {
      return true;
    }

    // 3. For multi-rate conflicts, check if the user explicitly clicked ANY rate button.
    // This enables saving even if the user clicks the button corresponding to the original default rate.
    if (group.hasDiscrepancy && userMadeExplicitSelection) {
      return true;
    }

    // 4. If none of the above conditions are met, there are no unsaved changes.
    return false;
  }
  // --- End Change Detection ---

  // --- Save Logic ---
  async function saveRateSelection(group: GroupedRateData) {
    if (isSavingChanges.value === group.destinationName) return; // Prevent double-clicks

    let rateToSave: number | undefined;
    const originalRate = originalRates.value[group.destinationName];

    if (originalRate === undefined) {
      console.error(`Cannot save changes for ${group.destinationName}: Original rate unknown.`);
      return;
    }

    isSavingChanges.value = group.destinationName; // Set loading state

    try {
      if (!group.hasDiscrepancy) {
        // Single-rate destination logic (unchanged)
        const directRate = directSetRates.value[group.destinationName];
        const adjustment = singleRateAdjustments.value[group.destinationName];

        if (directRate !== null && directRate !== undefined && directRate !== originalRate) {
          rateToSave = directRate;
          console.log(`Saving direct rate for ${group.destinationName}: ${rateToSave}`);
        } else if (adjustment?.adjustmentValue !== null && adjustment?.adjustmentValue > 0) {
          const calculatedRate = calculateAdjustedRate(originalRate, adjustment);
          if (calculatedRate !== originalRate) {
            rateToSave = calculatedRate;
            console.log(`Saving adjusted rate for ${group.destinationName}: ${rateToSave}`);
          } else {
            console.log(
              `No effective change from adjustment for ${group.destinationName}, not saving.`
            );
          }
        } else {
          console.log(`No changes detected to save for single-rate ${group.destinationName}`);
          // No need to save if no changes. Collapse the row.
          const index = expandedRows.value.indexOf(group.destinationName);
          if (index > -1) expandedRows.value.splice(index, 1);
          isSavingChanges.value = null; // Reset loading state
          return;
        }
      } else {
        // Multi-rate destination logic - unified approach with priority:
        // 1. Direct Rate Input (if set)
        // 2. Calculated Adjustment on selected base rate (if configured)
        // 3. Selected Base Rate (if different from original)

        const selectedRate = selectedRates.value[group.destinationName];
        const directRate = directSetRates.value[group.destinationName];
        const adjustment = singleRateAdjustments.value[group.destinationName];

        // Priority 1: Check direct rate
        if (directRate !== null && directRate !== undefined && directRate !== originalRate) {
          rateToSave = directRate;
          console.log(`Saving direct rate for multi-rate ${group.destinationName}: ${rateToSave}`);
        }
        // Priority 2: Check adjustment if selected rate is set
        else if (
          selectedRate !== undefined &&
          adjustment?.adjustmentValue !== null &&
          adjustment?.adjustmentValue > 0
        ) {
          const calculatedRate = calculateAdjustedRate(selectedRate, adjustment);
          if (calculatedRate !== originalRate) {
            rateToSave = calculatedRate;
            console.log(
              `Saving adjusted rate for multi-rate ${group.destinationName}: ${rateToSave}`
            );
          }
        }
        // Priority 3: Use selected rate if different
        else if (selectedRate !== undefined && selectedRate !== originalRate) {
          rateToSave = selectedRate;
          console.log(
            `Saving selected rate for multi-rate ${group.destinationName}: ${rateToSave}`
          );
        } else {
          console.log(
            `No change in selection for multi-rate ${group.destinationName}, not saving.`
          );
          // No need to save if no changes. Collapse the row.
          const index = expandedRows.value.indexOf(group.destinationName);
          if (index > -1) expandedRows.value.splice(index, 1);
          isSavingChanges.value = null; // Reset loading state
          return;
        }
      }

      if (rateToSave !== undefined) {
        await store.updateDestinationRate(group.destinationName, rateToSave);
        originalRates.value[group.destinationName] = rateToSave; // Update original rate after save

        // Reset local state after successful save
        directSetRates.value[group.destinationName] = null;
        if (singleRateAdjustments.value[group.destinationName]) {
          singleRateAdjustments.value[group.destinationName].adjustmentValue = null;
        }

        // Collapse the row after saving
        const index = expandedRows.value.indexOf(group.destinationName);
        if (index > -1) {
          expandedRows.value.splice(index, 1);
        }
      } else {
        console.warn(`Rate to save for ${group.destinationName} was undefined or unchanged.`);
        // Collapse the row if nothing was saved
        const index = expandedRows.value.indexOf(group.destinationName);
        if (index > -1) expandedRows.value.splice(index, 1);
      }
    } catch (error) {
      console.error(`Failed to save rate for ${group.destinationName}:`, error);
      // Optionally show an error message to the user
    } finally {
      isSavingChanges.value = null; // Reset loading state
    }
  }
  // --- End Save Logic ---

  // --- Bulk Update ---
  async function handleBulkUpdate(mode: 'highest' | 'lowest') {
    isBulkProcessing.value = true;
    processedCount.value = 0;
    bulkMode.value = mode;

    // Give the browser a chance to update the UI
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50);
      });
    });

    const destinationsToFix = groupedData.value.filter((group) => group.hasDiscrepancy);
    totalToProcess.value = destinationsToFix.length;

    if (destinationsToFix.length === 0) {
      isBulkProcessing.value = false;
      bulkMode.value = null;
      return;
    }

    const batchSize = 10;
    for (let i = 0; i < destinationsToFix.length; i += batchSize) {
      const batch = destinationsToFix.slice(i, i + batchSize);

      const updates = batch.map((group) => {
        const rates = group.rates.map((r) => r.rate);
        const newRate = mode === 'highest' ? Math.max(...rates) : Math.min(...rates);
        return { name: group.destinationName, rate: newRate };
      });

      await store.bulkUpdateDestinationRates(updates);

      // Force a store update after each batch
      store.setGroupedData([...store.groupedData]);

      processedCount.value += batch.length;
      currentDiscrepancyCount.value = store.getDiscrepancyCount;

      // Yield control back to the main thread
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 50);
        });
      });
    }

    // Final store update to ensure UI is in sync
    store.setGroupedData([...store.groupedData]);
    currentDiscrepancyCount.value = store.getDiscrepancyCount;

    isBulkProcessing.value = false;
    bulkMode.value = null;
  }
  // --- End Bulk Update ---

  // --- Bulk Update Most Common ---
  async function handleBulkUpdateMostCommon() {
    isBulkProcessing.value = true;
    bulkMode.value = 'mostCommon';
    processedCount.value = 0;

    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50);
      });
    });

    const destinationsToFix = groupedData.value.filter((group) => group.hasDiscrepancy);
    const updates: { name: string; rate: number }[] = [];

    for (const group of destinationsToFix) {
      const sortedRatesInfo = getSortedRates(group);
      const highestPercentageRates = sortedRatesInfo.filter((r) => r.isHighestPercentage);

      if (highestPercentageRates.length === 1) {
        const mostCommonRate = highestPercentageRates[0].rate;
        updates.push({ name: group.destinationName, rate: mostCommonRate });
      }
    }

    totalToProcess.value = updates.length;

    if (updates.length > 0) {
      try {
        const batchSize = 10;
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);
          await store.bulkUpdateDestinationRates(batch);

          // Force a store update after each batch
          store.setGroupedData([...store.groupedData]);

          processedCount.value += batch.length;
          currentDiscrepancyCount.value = store.getDiscrepancyCount;

          await new Promise((resolve) => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 50);
            });
          });
        }

        // Final store update
        store.setGroupedData([...store.groupedData]);
        currentDiscrepancyCount.value = store.getDiscrepancyCount;
      } catch (error) {
        console.error('Bulk update with most common rate failed:', error);
      }
    }

    isBulkProcessing.value = false;
    bulkMode.value = null;
  }
  // --- End Bulk Update Most Common ---

  function handleClearData() {
    if (confirm('Are you sure you want to clear all rate sheet data?')) {
      store.clearData();
    }
  }

  function handleExport() {
    // Convert data to CSV format
    const headers = [
      'name',
      'prefix',
      'rate',
      'change_code',
      'effective',
      'min duration',
      'increments',
    ];
    const rows = store.originalData.map((record) => [
      record.name,
      record.prefix,
      record.rate.toFixed(6),
      record.changeCode,
      record.effective,
      record.minDuration,
      record.increments,
    ]);

    // Create CSV content
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rate_sheet_formalized.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatDate(date: string): string {
    // Parse the date and force it to noon UTC to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const formattedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return formattedDate.toLocaleDateString();
  }

  // --- Multi-Rate Code Expansion Logic ---
  function toggleRateCodes(destinationName: string, rate: number) {
    if (!expandedRateCodes.value[destinationName]) {
      expandedRateCodes.value[destinationName] = [];
    }

    const index = expandedRateCodes.value[destinationName].indexOf(rate);
    if (index === -1) {
      expandedRateCodes.value[destinationName].push(rate);
    } else {
      expandedRateCodes.value[destinationName].splice(index, 1);
    }
  }

  function isRateCodesExpanded(destinationName: string, rate: number): boolean {
    return expandedRateCodes.value[destinationName]?.includes(rate) || false;
  }

  function getCodesForRate(group: GroupedRateData, rate: number): string[] {
    const cacheKey = group.destinationName;

    // Initialize cache structure if needed
    if (!codesCache.value[cacheKey]) {
      codesCache.value[cacheKey] = {};
    }

    // Return cached result if available
    if (codesCache.value[cacheKey][rate]) {
      return codesCache.value[cacheKey][rate];
    }

    // Get codes and store in cache
    const destinationRecords = store.originalData.filter(
      (record) => record.name === group.destinationName && record.rate === rate
    );

    const codes = destinationRecords.map((record) => record.prefix);
    codesCache.value[cacheKey][rate] = codes;

    return codes;
  }
  // --- End Multi-Rate Code Expansion Logic ---

  // --- Watchers ---
  watch(currentDiscrepancyCount, (newCount) => {
    emit('update:discrepancy-count', newCount);
  });

  watch(
    () => store.getDiscrepancyCount,
    (newCount) => {
      // Ensure we update the count even during bulk processing
      currentDiscrepancyCount.value = newCount;
      emit('update:discrepancy-count', newCount);
    },
    { immediate: true }
  );

  // watch([filterStatus, debouncedSearchQuery], () => { // This watcher might still be relevant for table sorting/filtering
  //   sortColumnKey.value = 'destinationName';
  //   sortDirection.value = 'asc';
  // });
  // --- End Watchers ---

  // Effective Date Logic - MOVED TO AZEffectiveDates.vue
  // function getEffectiveDate(changeCode: ChangeCodeType): string { ... }
  // function initWorker() { ... } // MOVED
  // function queueUIUpdate(message: any) { ... } // MOVED
  // function applyUIUpdates() { ... } // MOVED
  // function handleWorkerResultWithBreathing(...) { ... } // MOVED

  // Cleanup worker on component unmount - MOVED TO AZEffectiveDates.vue
  onBeforeUnmount(() => {
    // if (effectiveDateWorker) { ... } // MOVED
    // if (elapsedTimeInterval) { ... } // MOVED

    // Clean up search debounce
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = null;
    }
  });

  // Update the applyEffectiveDateSettings function to use the worker - MOVED TO AZEffectiveDates.vue
  // async function applyEffectiveDateSettings() { ... }

  // function getEffectiveDateLabel(setting: string): string { ... } // MOVED

  // Watch for debounced search query changes to handle expansion
  watch(debouncedSearchQuery, (newValue, oldValue) => {
    if (newValue) {
      // When search results are available, expand matching destinations
      nextTick(() => {
        // When searching, expand matching destinations and their matching rates
        Object.keys(matchingCodes.value).forEach((destinationName) => {
          // Expand the destination row
          if (!expandedRows.value.includes(destinationName)) {
            expandedRows.value.push(destinationName);
          }

          // Expand the matching rates
          if (!expandedRateCodes.value[destinationName]) {
            expandedRateCodes.value[destinationName] = [];
          }

          // For each matching rate, expand the rate codes section
          Object.keys(matchingCodes.value[destinationName]).forEach((rateStr) => {
            const rate = parseFloat(rateStr);
            if (!expandedRateCodes.value[destinationName].includes(rate)) {
              expandedRateCodes.value[destinationName].push(rate);
            }
          });
        });

        // Wait for DOM to update, then scroll to the first match
        nextTick(() => {
          const firstMatchElement = document.querySelector('.bg-accent\\/20');
          if (firstMatchElement) {
            firstMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      });
    } else if (oldValue) {
      // When clearing a search, collapse all expanded rows and rate codes
      expandedRows.value = [];
      expandedRateCodes.value = {};
    }
  });
  // --- End Watchers ---

  // Effective Date Logic - MOVED
  // function toggleEffectiveDateSettings() { ... } // MOVED

  // Date selection helper methods - MOVED
  // function setSameDate(value: 'today' | 'tomorrow' | 'custom') { ... }
  // function setIncreaseDate(value: 'today' | 'tomorrow' | 'week' | 'custom') { ... }
  // function setDecreaseDate(value: 'today' | 'tomorrow' | 'custom') { ... }

  // --- Multi-Rate Sorting & Display ---
  function getSortedRates(group: GroupedRateData): {
    rate: number;
    count: number;
    percentage: number;
    isCommon?: boolean;
    isHighestPercentage?: boolean;
    hasEqualDistribution?: boolean;
  }[] {
    // First map the rates
    const rates = group.rates.map((r) => ({
      rate: r.rate,
      count: r.count,
      percentage: r.percentage,
      isCommon: r.isCommon,
      isHighestPercentage: false, // Initialize to false
      hasEqualDistribution: false, // Initialize to false
    }));

    // Sort rates by value (lowest to highest)
    rates.sort((a, b) => a.rate - b.rate);

    // Find the highest percentage
    let highestPercentage = 0;
    for (const rate of rates) {
      if (rate.percentage > highestPercentage) {
        highestPercentage = rate.percentage;
      }
    }

    // Find rates with highest percentage
    const highestRates = rates.filter((rate) => rate.percentage === highestPercentage);

    // Check if we have equal distribution (multiple rates with same highest percentage)
    if (highestRates.length > 1) {
      // Mark all rates with the highest percentage as having equal distribution
      highestRates.forEach((highestRate) => {
        const rateIndex = rates.findIndex((r) => r.rate === highestRate.rate);
        if (rateIndex >= 0) {
          rates[rateIndex].hasEqualDistribution = true;
        }
      });
    } else if (highestRates.length === 1) {
      // If only one rate has the highest percentage, mark it as the highest
      const lowestRateIndex = rates.findIndex((r) => r.rate === highestRates[0].rate);
      if (lowestRateIndex >= 0) {
        rates[lowestRateIndex].isHighestPercentage = true;
      }
    }

    return rates;
  }
  // --- End Multi-Rate Sorting & Display ---

  watch(
    () => store.hasStoredData,
    (newValue, oldValue) => {
      if (newValue && !oldValue) {
        // This means the data was just loaded, so open the settings panel
        showEffectiveDateSettings.value = true;
        console.log('Auto-opening effective date settings after file upload');
      }
    }
  );

  // --- Filter Options & Label ---
  const filterOptions = [
    { value: 'all', label: 'All Destinations' },
    { value: 'conflicts', label: 'Rate Conflicts' },
    { value: 'no-conflicts', label: 'No Conflicts' },
    { value: 'change-same', label: 'Same Rate' },
    { value: 'change-increase', label: 'Rate Increase' },
    { value: 'change-decrease', label: 'Rate Decrease' },
  ];

  const selectedFilterLabel = computed(() => {
    return (
      filterOptions.find((option) => option.value === filterStatus.value)?.label ||
      'All Destinations'
    );
  });
  // --- End Filter Options & Label ---

  // --- Helper Functions for Adjustment Dropdowns ---
  function getAdjustmentTypeLabel(value: AdjustmentType | undefined): string {
    return adjustmentTypeOptions.find((opt) => opt.value === value)?.label || 'N/A';
  }

  function getAdjustmentValueTypeLabel(value: AdjustmentValueType | undefined): string {
    return adjustmentValueTypeOptions.find((opt) => opt.value === value)?.label || 'N/A';
  }
  // --- End Helper Functions ---

  // --- Helper Functions ---

  // Helper to initialize state for single-rate destinations when expanded
  function initializeSingleRateState(destinationName: string) {
    console.log(`Initializing state for single-rate: ${destinationName}`);
    if (!singleRateAdjustments.value[destinationName]) {
      singleRateAdjustments.value[destinationName] = {
        adjustmentType: 'markup',
        adjustmentValueType: 'percentage',
        adjustmentValue: null,
      };
    }
    if (directSetRates.value[destinationName] === undefined) {
      directSetRates.value[destinationName] = null;
    }
  }

  // ... other helper functions (formatRate, calculateAdjustedRate, etc.) ...

  // Keep the original toggleExpand function here
  function toggleExpand(destinationName: string) {
    const index = expandedRows.value.indexOf(destinationName);
    if (index > -1) {
      expandedRows.value.splice(index, 1);
    } else {
      const group = groupedData.value.find((g) => g.destinationName === destinationName);
      if (group) {
        // Initialize state *before* adding to expandedRows to ensure it exists before render attempt
        if (!group.hasDiscrepancy) {
          initializeSingleRateState(destinationName); // Call the function
        }

        // Add to expandedRows *after* potential state initialization
        expandedRows.value.push(destinationName);

        // Store the original rate when expanding, regardless of discrepancy
        if (originalRates.value[destinationName] === undefined) {
          if (!group.hasDiscrepancy) {
            originalRates.value[destinationName] = group.rates[0].rate;
          } else {
            // For discrepancies, find the most common rate initially selected
            const mostCommonRate = group.rates.find((r) => r.isCommon)?.rate;
            if (mostCommonRate !== undefined) {
              originalRates.value[destinationName] = mostCommonRate;
              // Set the initial selection if not already set
              if (selectedRates.value[destinationName] === undefined) {
                selectedRates.value[destinationName] = mostCommonRate;
              }
            }
          }
        }

        // Initialize multi-rate selected rate if it wasn't set by original rate logic above
        if (group.hasDiscrepancy && selectedRates.value[destinationName] === undefined) {
          const mostCommonRate = group.rates.find((r) => r.isCommon)?.rate;
          if (mostCommonRate !== undefined) {
            selectedRates.value[destinationName] = mostCommonRate;
          }
        }
      }
    }
  }

  // --- Real-time Update Calculation Logic ---

  // Function to check if there are pending, uncommitted changes
  function hasPendingChanges(destinationName: string): boolean {
    const directRate = directSetRates.value[destinationName];
    const adjustment = singleRateAdjustments.value[destinationName];

    // Check if direct rate input has a value
    if (directRate !== null && directRate !== undefined) {
      return true;
    }

    // Check if adjustment inputs have a value
    if (adjustment?.adjustmentValue !== null && adjustment?.adjustmentValue > 0) {
      // Additional check for multi-rate: ensure a base rate is selected
      const group = groupedData.value.find((g) => g.destinationName === destinationName);
      if (group?.hasDiscrepancy && selectedRates.value[destinationName] === undefined) {
        return false; // Cannot calculate adjustment without a selected base rate
      }
      return true;
    }

    // Check if user explicitly selected a rate in a multi-rate scenario
    const group = groupedData.value.find((g) => g.destinationName === destinationName);
    if (group?.hasDiscrepancy && userExplicitlySelectedRate.value[destinationName] === true) {
      return true;
    }

    return false;
  }

  // Function to get the calculated rate based on pending inputs
  function getPendingUpdatedRate(destinationName: string): number | null {
    const group = groupedData.value.find((g) => g.destinationName === destinationName);
    if (!group) return null;

    const directRate = directSetRates.value[destinationName];
    const adjustment = singleRateAdjustments.value[destinationName];
    const selectedRate = selectedRates.value[destinationName]; // Get the selected base rate

    // Priority 1: Direct Rate Input
    if (directRate !== null && directRate !== undefined) {
      return directRate;
    }

    // Priority 2: Adjustment Calculation
    if (adjustment?.adjustmentValue !== null && adjustment?.adjustmentValue > 0) {
      let baseRate: number | undefined;

      if (group.hasDiscrepancy) {
        // Use the currently selected rate for multi-rate destinations
        baseRate = selectedRate;
      } else {
        // Use the original rate for single-rate destinations
        baseRate = originalRates.value[destinationName] ?? group.rates[0].rate;
      }

      // Cannot calculate if base rate is missing (e.g., multi-rate not selected yet)
      if (baseRate === undefined) {
        return null;
      }

      return calculateAdjustedRate(baseRate, adjustment);
    }

    // Priority 3: Show the explicitly selected base rate for multi-rate conflicts
    // if no direct rate or adjustment is pending
    if (
      group.hasDiscrepancy &&
      userExplicitlySelectedRate.value[destinationName] === true &&
      selectedRate !== undefined
    ) {
      return selectedRate;
    }

    // No pending changes that result in a new rate preview
    return null;
  }

  // --- End Real-time Calculation Logic ---

  // --- Sorting Handler ---
  function handleSort(column: SortableAZColumn) {
    if (!column.sortable || !sortWorker.value) return;

    // Cancel any pending sort operation
    if (sortDebounceTimeout) {
      clearTimeout(sortDebounceTimeout);
    }

    // Update sort direction
    if (sortColumnKey.value === column.key) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumnKey.value = column.key;
      sortDirection.value = 'asc';
    }

    // Set loading state
    isSorting.value = true;

    // Debounce the sort operation
    sortDebounceTimeout = setTimeout(() => {
      try {
        // Create a plain object with only the data needed for sorting
        const sortData = {
          data: groupedData.value.map((group) => ({
            destinationName: String(group.destinationName),
            codes: [...group.codes],
            rates: group.rates.map((r) => ({
              rate: Number(r.rate),
              count: Number(r.count),
              percentage: Number(r.percentage),
              isCommon: Boolean(r.isCommon),
            })),
            hasDiscrepancy: Boolean(group.hasDiscrepancy),
            changeCode: String(group.changeCode),
            effectiveDate: String(group.effectiveDate),
            minDuration: group.minDuration ? String(group.minDuration) : undefined,
            increments: group.increments ? String(group.increments) : undefined,
          })),
          sortKey: String(column.key),
          sortDirection: sortDirection.value,
          selectedRates: { ...selectedRates.value },
        };

        // Post message to worker
        sortWorker.value?.postMessage(sortData);

        // Reset to first page
        currentPage.value = 1;
        directPageInput.value = 1;
      } catch (error) {
        console.error('Error sending data to worker:', error);
        isSorting.value = false;
      }
    }, 150);
  }
  // --- End Sorting Handler ---

  // --- Pagination Reset Watchers (Phase 4) ---
  // Reset to first page when filters change
  watch([filterStatus, debouncedSearchQuery], () => {
    currentPage.value = 1;
    directPageInput.value = 1;
  });

  // Keep directPageInput in sync with currentPage
  watch(currentPage, (newPage) => {
    directPageInput.value = newPage;
  });
  // --- End Pagination Reset Watchers ---

  // Effective Date Logic - MOVED
  // function toggleEffectiveDateSettings() { ... } // MOVED

  // Date selection helper methods - MOVED
  // function setSameDate(value: 'today' | 'tomorrow' | 'custom') { ... }
  // function setIncreaseDate(value: 'today' | 'tomorrow' | 'week' | 'custom') { ... }
  // function setDecreaseDate(value: 'today' | 'tomorrow' | 'custom') { ... }

  // ... rest of the script setup ...

  // Watch for bucket filter changes
  watch(selectedRateBucket, (newValue) => {
    store.setRateBucketFilter(newValue);
  });

  // Add new refs for sorting state
  const isSorting = ref(false);
  const sortWorker = ref<Worker | null>(null);
  let sortDebounceTimeout: NodeJS.Timeout | null = null;

  // Initialize worker
  onMounted(() => {
    // Initialize worker
    try {
      sortWorker.value = new TableSorterWorker();
      sortWorker.value.onmessage = (e) => {
        store.setGroupedData(e.data);
        isSorting.value = false;
      };
      sortWorker.value.onerror = (error) => {
        console.error('Worker error:', error);
        isSorting.value = false;
      };
    } catch (error) {
      console.error('Failed to initialize worker:', error);
    }
  });

  // Cleanup worker
  onBeforeUnmount(() => {
    if (sortWorker.value) {
      sortWorker.value.terminate();
      sortWorker.value = null;
    }
    if (sortDebounceTimeout) {
      clearTimeout(sortDebounceTimeout);
      sortDebounceTimeout = null;
    }
  });
</script>

<style scoped>
  /* ... styles ... */
</style>
