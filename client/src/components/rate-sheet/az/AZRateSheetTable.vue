<template>
  <div class="space-y-4">
    <!-- Effective Date Settings (collapsible) -->
    <div class="bg-gray-900/50 rounded-lg p-4 mb-4">
      <div @click="toggleEffectiveDateSettings()" class="cursor-pointer bg-gray-900/30">
        <div class="flex items-center gap-2 w-full justify-between">
          <h3 class="text-sm font-medium text-gray-300">Effective Date Settings</h3>
          <button class="p-1 text-gray-400 hover:text-white rounded-full transition-colors">
            <ChevronDownIcon
              class="w-5 h-5 transition-transform"
              :class="{ 'rotate-180': showEffectiveDateSettings }"
            />
          </button>
        </div>
      </div>

      <div v-if="showEffectiveDateSettings" class="mt-4">
        <!-- Date settings UI - Very minimal three date pickers in a row -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <!-- SAME Rate Effective Date -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-400">SAME Rate</span>
            </div>
            <input
              type="date"
              v-model="effectiveDateSettings.sameCustomDate"
              @change="setSameDate('custom')"
              class="w-full bg-gray-800 border border-gray-700 rounded text-sm px-3 py-2"
              :class="effectiveDateSettings.same === 'custom' ? 'text-white' : 'text-gray-400'"
            />
          </div>

          <!-- DECREASE Rate Effective Date -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-400">DECREASE Rate</span>
            </div>
            <input
              type="date"
              v-model="effectiveDateSettings.decreaseCustomDate"
              @change="setDecreaseDate('custom')"
              class="w-full bg-gray-800 border border-gray-700 rounded text-sm px-3 py-2"
              :class="effectiveDateSettings.decrease === 'custom' ? 'text-white' : 'text-gray-400'"
            />
          </div>

          <!-- INCREASE Rate Effective Date -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-400">INCREASE Rate</span>
            </div>
            <input
              type="date"
              v-model="effectiveDateSettings.increaseCustomDate"
              @change="setIncreaseDate('custom')"
              class="w-full bg-gray-800 border border-gray-700 rounded text-sm px-3 py-2"
              :class="effectiveDateSettings.increase === 'custom' ? 'text-white' : 'text-gray-400'"
            />
          </div>
        </div>

        <!-- Progress and apply button -->
        <div class="space-y-4">
          <!-- Simplified progress indicator -->
          <div v-if="isApplyingSettings" class="mb-4">
            <div class="text-sm text-gray-300 mb-2">{{ processingStatus }}</div>
            <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                class="h-2 rounded-full bg-accent transition-all duration-300"
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
          </div>

          <div class="flex justify-end w-full">
            <BaseButton
              variant="primary"
              size="small"
              :loading="isApplyingSettings"
              :disabled="!hasDateSettingsChanged"
              :icon="ArrowRightIcon"
              @click="applyEffectiveDateSettings"
              title="Apply effective date settings to all records"
            >
              Apply
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="bg-gray-800 rounded-lg p-4 mb-4"
      :class="{ 'min-h-[16rem]': filteredData.length === 0 }"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <h3 class="text-sm font-medium text-gray-300">Table Controls</h3>
          <span class="text-sm text-info"> Showing {{ filteredData.length }} destinations </span>
        </div>
        <div class="flex items-center gap-2">
          <BaseButton
            variant="destructive"
            size="standard"
            :icon="TrashIcon"
            @click="handleClearData"
            title="Clear all loaded rate sheet data"
          >
            Clear Rate Sheet Data
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

        <!-- Actions Column -->
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
            </div>
          </div>
          <!-- Export Action -->
          <div v-else-if="!isBulkProcessing && store.getDiscrepancyCount === 0">
            <label class="block text-sm text-gray-400 mb-1">Actions</label>
            <BaseButton
              variant="primary"
              size="standard"
              class="w-full"
              :icon="ArrowDownTrayIcon"
              @click="handleExport"
            >
              Export Rate Sheet
            </BaseButton>
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
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">
              Destination
            </th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">
              Codes
            </th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">
              Rate
            </th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">
              Change
            </th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">
              Effective
            </th>
            <th
              v-if="store.hasMinDuration"
              scope="col"
              class="px-3 py-3 text-left text-sm font-semibold text-gray-300"
            >
              Duration
            </th>
            <th
              v-if="store.hasIncrements"
              scope="col"
              class="px-3 py-3 text-left text-sm font-semibold text-gray-300"
            >
              Increments
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <template v-for="group in filteredData" :key="group.destinationName">
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
                <BaseBadge
                  :variant="
                    group.changeCode === ChangeCode.INCREASE
                      ? 'accent'
                      : group.changeCode === ChangeCode.DECREASE
                      ? 'destructive'
                      : 'info'
                  "
                  size="small"
                >
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
                :colspan="6 + (store.hasMinDuration ? 1 : 0) + (store.hasIncrements ? 1 : 0)"
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
                      <template v-if="group.hasDiscrepancy">
                        <BaseButton
                          v-if="
                            !areAllRateCodesExpanded(group.destinationName) &&
                            group.rates.length > 1
                          "
                          variant="secondary"
                          size="small"
                          @click="toggleAllRateCodesForDestination(group.destinationName, true)"
                        >
                          Show All Codes
                        </BaseButton>
                        <BaseButton
                          v-if="areAnyRateCodesExpanded(group.destinationName)"
                          variant="secondary"
                          size="small"
                          @click="toggleAllRateCodesForDestination(group.destinationName, false)"
                        >
                          Hide All Codes
                        </BaseButton>
                      </template>
                      <!-- Save Changes Button REMOVED FROM HERE -->
                    </div>
                  </div>

                  <!-- Section 1: Rate Distribution (Only for Multi-Rate) -->
                  <div v-if="group.hasDiscrepancy" class="space-y-2 mb-4">
                    <div v-for="rate in getSortedRates(group)" :key="rate.rate">
                      <!-- Rate row -->
                      <div
                        class="flex items-center justify-between text-sm p-2 rounded-md"
                        :class="{
                          'bg-gray-800/50': isSelectedRate(group.destinationName, rate.rate),
                        }"
                      >
                        <label class="flex items-center gap-2 flex-1 cursor-pointer">
                          <input
                            type="radio"
                            :name="`rate-${group.destinationName}`"
                            :value="rate.rate"
                            :checked="isSelectedRate(group.destinationName, rate.rate)"
                            @change="selectRate(group.destinationName, rate.rate)"
                            class="text-accent focus:ring-accent"
                          />
                          <span class="text-white">{{ formatRate(rate.rate) }}</span>
                          <span
                            v-if="rate.isHighestPercentage && !rate.hasEqualDistribution"
                            class="ml-2 text-xs px-1.5 py-0.5 bg-accent/10 text-accent rounded-sm"
                          >
                            Most Common
                          </span>
                          <span
                            v-if="rate.hasEqualDistribution"
                            class="ml-2 text-xs px-1.5 py-0.5 bg-blue-400/10 text-blue-400 rounded-sm"
                          >
                            Equal Dist.
                          </span>
                        </label>
                        <div
                          class="text-gray-400 hover:text-white cursor-pointer flex items-center gap-1 transition-colors"
                          @click.stop="toggleRateCodes(group.destinationName, rate.rate)"
                        >
                          <span>{{ rate.count }} codes ({{ Math.round(rate.percentage) }}%)</span>
                          <ChevronDownIcon
                            class="w-4 h-4 transition-transform"
                            :class="{
                              'rotate-180': isRateCodesExpanded(group.destinationName, rate.rate),
                            }"
                          />
                        </div>
                      </div>

                      <!-- Codes section directly under the rate -->
                      <div
                        v-if="isRateCodesExpanded(group.destinationName, rate.rate)"
                        class="mt-1 mb-3 bg-gray-900/50 p-3 rounded-md"
                      >
                        <div class="flex justify-between items-center mb-2">
                          <div class="text-xs text-gray-300">
                            Prefixes with rate {{ formatRate(rate.rate) }}:
                          </div>
                          <div class="text-xs text-gray-400">
                            {{ getCodesForRate(group, rate.rate).length }} total codes
                          </div>
                        </div>

                        <!-- Code grid with responsive layout -->
                        <div
                          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1"
                        >
                          <div
                            v-for="(code, index) in getCodesForRate(group, rate.rate)"
                            :key="index"
                            class="px-2 py-1 bg-gray-800/50 hover:bg-gray-700/50 rounded text-sm text-gray-300 font-mono transition-colors"
                            :class="{
                              'bg-accent/20 text-accent border border-accent/50 font-medium':
                                isCodeMatchingSearch(group.destinationName, rate.rate, code),
                            }"
                            :title="code"
                          >
                            {{ code }}
                          </div>
                        </div>

                        <!-- Show when there are many codes -->
                        <div
                          v-if="getCodesForRate(group, rate.rate).length > 24"
                          class="mt-2 text-xs text-right text-gray-500"
                        >
                          Scroll to see all {{ getCodesForRate(group, rate.rate).length }} codes
                        </div>
                      </div>
                    </div>
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
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
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
} from '@/types/domains/rate-sheet-types';
import EffectiveDateUpdaterWorker from '@/workers/effective-date-updater.worker?worker';
import BaseButton from '@/components/shared/BaseButton.vue';
import BaseBadge from '@/components/shared/BaseBadge.vue'; // Import BaseBadge

// Define emits
const emit = defineEmits(['update:discrepancy-count']);

// Initialize store and service
const store = useAzRateSheetStore();
const rateSheetService = new RateSheetService();
const groupedData = computed(() => store.getGroupedData);

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
const bulkMode = ref<'highest' | 'lowest' | null>(null);
const processedCount = ref(0);
const totalToProcess = ref(0);
const currentDiscrepancyCount = ref(0); // Track current discrepancy count during processing

// Track which rate's codes are expanded (only for multi-rate)
const expandedRateCodes = ref<{ [key: string]: number[] }>({});

// Cache for codes by destination and rate to improve performance
const codesCache = ref<{ [key: string]: { [rate: number]: string[] } }>({});

// Track which codes match the current search query
const matchingCodes = ref<{ [destinationName: string]: { [rate: number]: string[] } }>({});

// Effective Date Settings
const effectiveDateSettings = ref<EffectiveDateSettings>({
  same: 'today',
  increase: 'week',
  decrease: 'today',
  sameCustomDate: new Date().toISOString().split('T')[0],
  increaseCustomDate: (() => {
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    return sevenDays.toISOString().split('T')[0];
  })(),
  decreaseCustomDate: new Date().toISOString().split('T')[0],
});

// Controls visibility of effective date settings section
const showEffectiveDateSettings = ref(true);
// Track when settings are being applied
const isApplyingSettings = ref(false);
// Track the current processing phase
const processingPhase = ref<'idle' | 'preparing' | 'processing' | 'updating' | 'finalizing'>(
  'idle'
);
const processingStatus = ref('');
const processingStartTime = ref(0);

// Worker setup
let effectiveDateWorker: Worker | null = null;
const progressPercentage = ref(0);

// Further enhance the status message with more detail
const currentDestination = ref('');
const recordsUpdatedSoFar = ref(0);
const estimatedTimeRemaining = ref<number | undefined>(undefined);

// Add throttling mechanism for UI updates (minimal throttling for better performance)
const lastUIUpdateTime = ref(0);
const uiUpdateThrottle = 50; // increased from 10ms to 50ms for proper UI updates
const pendingUIUpdates = ref<{ [key: string]: any }>({});

// Add detailed log tracking
const processingLogs = ref<{ time: number; message: string }[]>([]);
const showProcessingLogs = ref(false);

// Add separate timer for elapsed time that won't get blocked
const displayedElapsedTime = ref(0);
let elapsedTimeInterval: number | null = null;

// Add these properties to handle search state
let searchDebounceTimeout: NodeJS.Timeout | null = null;

// Load saved effective date settings from store if available
onMounted(() => {
  console.log('today', new Date().toISOString().split('T')[0]);
  const savedSettings = store.getEffectiveDateSettings;

  if (savedSettings) {
    console.log('Loading saved settings:', savedSettings);
    // Apply saved modes and custom dates first
    effectiveDateSettings.value = {
      same: savedSettings.same as 'today' | 'tomorrow' | 'custom',
      increase: savedSettings.increase as 'today' | 'tomorrow' | 'week' | 'custom',
      decrease: savedSettings.decrease as 'today' | 'tomorrow' | 'custom',
      sameCustomDate: savedSettings.sameCustomDate,
      increaseCustomDate: savedSettings.increaseCustomDate, // Temporarily assign saved date
      decreaseCustomDate: savedSettings.decreaseCustomDate,
    };

    // *** Crucial Fix: Recalculate increaseCustomDate if mode is 'week' ***
    if (effectiveDateSettings.value.increase === 'week') {
      const sevenDaysDate = new Date();
      sevenDaysDate.setDate(sevenDaysDate.getDate() + 7);
      const correctWeekDate = sevenDaysDate.toISOString().split('T')[0];
      // Only update if the saved date doesn't match the correct 'week' date
      if (effectiveDateSettings.value.increaseCustomDate !== correctWeekDate) {
        console.log(
          `Correcting increaseCustomDate for 'week' mode. Was: ${effectiveDateSettings.value.increaseCustomDate}, Should be: ${correctWeekDate}`
        );
        effectiveDateSettings.value.increaseCustomDate = correctWeekDate;
      }
    }
    // Similarly, ensure 'today' and 'tomorrow' modes reflect the current date
    else if (effectiveDateSettings.value.increase === 'today') {
      effectiveDateSettings.value.increaseCustomDate = new Date().toISOString().split('T')[0];
    } else if (effectiveDateSettings.value.increase === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      effectiveDateSettings.value.increaseCustomDate = tomorrow.toISOString().split('T')[0];
    }
    // If mode is 'custom', we keep the loaded increaseCustomDate
  } else {
    // Defaults are now set during ref initialization, log the initial state
    console.log('Using default settings (set during ref init):', effectiveDateSettings.value);
  }

  // Log the final effective date settings after potential load/init and correction
  console.log('Final effective date settings after init:', {
    same: effectiveDateSettings.value.same,
    sameCustomDate: effectiveDateSettings.value.sameCustomDate,
    increase: effectiveDateSettings.value.increase,
    increaseCustomDate: effectiveDateSettings.value.increaseCustomDate,
    decrease: effectiveDateSettings.value.decrease,
    decreaseCustomDate: effectiveDateSettings.value.decreaseCustomDate,
  });

  initWorker();

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
});

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

  // If no search query, return filtered data without additional processing
  if (!debouncedSearchQuery.value) {
    // Clear matching codes when search is empty
    matchingCodes.value = {};
    return filtered;
  }

  const query = debouncedSearchQuery.value.toLowerCase();

  // Fast path: filter by destination name first (this is very quick)
  const nameMatches = filtered.filter((group) =>
    group.destinationName.toLowerCase().includes(query)
  );

  // If we have name matches, don't need to do expensive code search
  if (nameMatches.length > 0) {
    return nameMatches;
  }

  // Only search codes if no name matches were found
  // For code matching, we return the precomputed results from the async search
  return filtered.filter((group) => !!matchingCodes.value[group.destinationName]);
});

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
  if (originalRate === undefined) return false; // Cannot detect changes if original is unknown

  if (group.hasDiscrepancy) {
    // Multi-rate logic - check all possible ways the rate could change
    const selectedRate = selectedRates.value[destinationName];

    // First check if the base rate selection has changed
    if (selectedRate !== undefined && selectedRate !== originalRate) {
      return true;
    }

    // Check if direct rate is set on a multi-rate destination
    const directRate = directSetRates.value[destinationName];
    if (directRate !== null && directRate !== undefined && directRate !== originalRate) {
      return true;
    }

    // Check if adjustment is configured on a multi-rate destination
    if (selectedRate !== undefined) {
      const adjustment = singleRateAdjustments.value[destinationName];
      if (adjustment?.adjustmentValue !== null && adjustment?.adjustmentValue > 0) {
        const calculatedRate = calculateAdjustedRate(selectedRate, adjustment);
        return calculatedRate !== originalRate;
      }
    }

    return false;
  } else {
    // Single-rate logic (unchanged)
    const directRate = directSetRates.value[destinationName];
    const adjustment = singleRateAdjustments.value[destinationName];

    // Check if direct rate is set and different from original
    if (directRate !== null && directRate !== undefined && directRate !== originalRate) {
      return true;
    }

    // Check if adjustment is configured and leads to a different rate
    if (adjustment?.adjustmentValue !== null && adjustment?.adjustmentValue > 0) {
      const calculatedRate = calculateAdjustedRate(originalRate, adjustment);
      return calculatedRate !== originalRate;
    }
    return false; // No direct rate set, no adjustment configured
  }
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
        console.log(`Saving selected rate for multi-rate ${group.destinationName}: ${rateToSave}`);
      } else {
        console.log(`No change in selection for multi-rate ${group.destinationName}, not saving.`);
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

  // Give the browser a chance to update the UI and show the animation
  // by using requestAnimationFrame and a small setTimeout
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 50);
    });
  });

  // Get all destinations with discrepancies
  const destinationsToFix = groupedData.value.filter((group) => group.hasDiscrepancy);
  totalToProcess.value = destinationsToFix.length;

  if (destinationsToFix.length === 0) {
    isBulkProcessing.value = false;
    bulkMode.value = null;
    return;
  }

  // Initialize current discrepancy count
  currentDiscrepancyCount.value = store.getDiscrepancyCount;

  try {
    console.time('bulkUpdate');

    // Create an array to hold all update operations
    const updates = destinationsToFix.map((group) => {
      const rates = group.rates.map((r) => r.rate);
      const newRate = mode === 'highest' ? Math.max(...rates) : Math.min(...rates);
      return { name: group.destinationName, rate: newRate };
    });

    // Use a single operation to update all rates at once for maximum performance
    await store.bulkUpdateDestinationRates(updates);

    // Single UI update when complete
    processedCount.value = totalToProcess.value;
    currentDiscrepancyCount.value = 0;

    // Force a final update of the grouped data
    store.setGroupedData(store.getGroupedData);
    console.timeEnd('bulkUpdate');

    // Add a small delay to show the button animation
    // since the operation is now so fast users might miss the feedback
    await new Promise((resolve) => setTimeout(resolve, 300));
  } finally {
    isBulkProcessing.value = false;
    bulkMode.value = null;
  }
}
// --- End Bulk Update ---

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

function toggleAllRateCodesForDestination(destinationName: string, expand: boolean) {
  // Get all rates for this destination
  const group = groupedData.value.find((g) => g.destinationName === destinationName);
  if (!group) return;

  if (expand) {
    // Expand all rates
    expandedRateCodes.value[destinationName] = group.rates.map((r) => r.rate);
  } else {
    // Collapse all rates
    expandedRateCodes.value[destinationName] = [];
  }
}

function areAllRateCodesExpanded(destinationName: string): boolean {
  const group = groupedData.value.find((g) => g.destinationName === destinationName);
  if (!group) return false;

  const allRates = group.rates.map((r) => r.rate);
  return allRates.every((rate) => isRateCodesExpanded(destinationName, rate));
}

function areAnyRateCodesExpanded(destinationName: string): boolean {
  return !!expandedRateCodes.value[destinationName]?.length;
}
// --- End Multi-Rate Code Expansion Logic ---

// --- Watchers ---
watch(currentDiscrepancyCount, (newCount) => {
  emit('update:discrepancy-count', newCount);
});

watch(
  () => store.getDiscrepancyCount,
  (newCount) => {
    if (!isBulkProcessing.value) {
      currentDiscrepancyCount.value = newCount;
      emit('update:discrepancy-count', newCount);
    }
  },
  { immediate: true }
);
// --- End Watchers ---

// --- Effective Date Logic ---
function getEffectiveDate(changeCode: ChangeCodeType): string {
  const today = new Date();
  let effectiveDate = today;

  if (changeCode === ChangeCode.SAME) {
    if (effectiveDateSettings.value.same === 'today') {
      effectiveDate = today;
    } else if (effectiveDateSettings.value.same === 'tomorrow') {
      effectiveDate = new Date(today);
      effectiveDate.setDate(today.getDate() + 1);
    } else if (effectiveDateSettings.value.same === 'custom') {
      return effectiveDateSettings.value.sameCustomDate;
    }
  } else if (changeCode === ChangeCode.INCREASE) {
    if (effectiveDateSettings.value.increase === 'today') {
      effectiveDate = today;
    } else if (effectiveDateSettings.value.increase === 'tomorrow') {
      effectiveDate = new Date(today);
      effectiveDate.setDate(today.getDate() + 1);
    } else if (effectiveDateSettings.value.increase === 'week') {
      effectiveDate = new Date(today);
      effectiveDate.setDate(today.getDate() + 7);
    } else if (effectiveDateSettings.value.increase === 'custom') {
      return effectiveDateSettings.value.increaseCustomDate;
    }
  } else if (changeCode === ChangeCode.DECREASE) {
    if (effectiveDateSettings.value.decrease === 'today') {
      effectiveDate = today;
    } else if (effectiveDateSettings.value.decrease === 'tomorrow') {
      effectiveDate = new Date(today);
      effectiveDate.setDate(today.getDate() + 1);
    } else if (effectiveDateSettings.value.decrease === 'custom') {
      return effectiveDateSettings.value.decreaseCustomDate;
    }
  }

  return effectiveDate.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function initWorker() {
  console.log('Initializing effective date worker');

  // Cleanup any existing worker
  if (effectiveDateWorker) {
    console.log('Terminating existing worker');
    effectiveDateWorker.terminate();
    effectiveDateWorker = null;
  }

  try {
    // Create new worker
    console.log('Creating new effective date worker');
    effectiveDateWorker = new EffectiveDateUpdaterWorker();

    // Set up message handler with throttling
    effectiveDateWorker.onmessage = (event) => {
      const message = event.data;

      // Log all worker messages for debugging
      console.log('Worker message received:', 'type' in message ? message.type : 'result');

      // Add to processing logs
      const logTime = new Date();
      const logTimeStr = `${logTime.getHours()}:${logTime.getMinutes()}:${logTime.getSeconds()}.${logTime.getMilliseconds()}`;
      processingLogs.value.push({
        time: Date.now(),
        message: `[${logTimeStr}] Received ${
          'type' in message ? message.type : 'result'
        } from worker`,
      });

      // Queue UI updates instead of applying them immediately
      queueUIUpdate(message);
    };

    effectiveDateWorker.onerror = (error) => {
      console.error('Worker error event:', error);
      processingStatus.value = `Worker error: ${error.message}`;
      alert(`Error in effective date worker: ${error.message}`);
      isApplyingSettings.value = false;
      processingPhase.value = 'idle';
    };

    console.log('Worker initialized successfully');
  } catch (error) {
    console.error('Failed to initialize worker:', error);
    alert(`Failed to initialize worker: ${error instanceof Error ? error.message : String(error)}`);
    effectiveDateWorker = null;
  }
}

// Queue UI updates and apply them throttled to prevent UI freezing
function queueUIUpdate(message: any) {
  // Store updates in pending queue
  if ('type' in message && message.type === 'progress') {
    pendingUIUpdates.value.progress = message;
  } else if ('type' in message && message.type === 'error') {
    pendingUIUpdates.value.error = message;
    // Apply error updates immediately
    applyUIUpdates();
  } else {
    pendingUIUpdates.value.result = message;
  }

  // Check if we should apply updates now
  const now = Date.now();
  if (now - lastUIUpdateTime.value >= uiUpdateThrottle) {
    applyUIUpdates();
  } else {
    // Schedule update for later if not already scheduled
    if (!pendingUIUpdates.value.scheduled) {
      pendingUIUpdates.value.scheduled = true;
      setTimeout(() => {
        requestAnimationFrame(() => {
          applyUIUpdates();
        });
      }, uiUpdateThrottle);
    }
  }
}

// Apply queued UI updates
function applyUIUpdates() {
  const updates = pendingUIUpdates.value;
  pendingUIUpdates.value = {};
  lastUIUpdateTime.value = Date.now();

  // Process error messages first
  if (updates.error) {
    console.error('Worker error:', updates.error.message);
    processingStatus.value = `Error: ${updates.error.message}`;
    processingLogs.value.push({
      time: Date.now(),
      message: `Error in ${updates.error.phase || 'unknown'} phase: ${updates.error.message}`,
    });
    alert(`Error updating effective dates: ${updates.error.message}`);
    isApplyingSettings.value = false;
    processingPhase.value = 'idle';

    // Clear the elapsed time interval
    if (elapsedTimeInterval) {
      clearInterval(elapsedTimeInterval);
      elapsedTimeInterval = null;
    }
    return;
  }

  // Process progress updates
  if (updates.progress) {
    const message = updates.progress;
    // Update progress
    progressPercentage.value = message.percentage;

    // Update phase if it's changing
    if (processingPhase.value !== message.phase) {
      processingPhase.value = message.phase;
      processingLogs.value.push({
        time: Date.now(),
        message: `Phase changed to: ${message.phase}`,
      });
    }

    // Update detailed status message if available
    if (message.detail) {
      processingStatus.value = message.detail;

      // Log significant progress updates
      if (message.percentage % 10 === 0 || message.phase === 'finalizing') {
        processingLogs.value.push({
          time: Date.now(),
          message: `${message.phase} (${message.percentage}%): ${message.detail}`,
        });
      }
    }

    // Update additional progress information
    if (message.phase === 'processing') {
      currentDestination.value = message.currentDestination || '';
      recordsUpdatedSoFar.value = message.recordsUpdatedCount;
      estimatedTimeRemaining.value = message.estimatedTimeRemaining;
    }
  }

  // Process final result
  if (updates.result) {
    console.log('Worker completed successfully');
    processingPhase.value = 'updating';
    processingStatus.value = 'Processing complete. Updating store...';

    // Use microtask to allow UI to update before proceeding with heavy store operations
    queueMicrotask(() => {
      const { updatedRecords, recordsUpdatedCount, updatedGroupedData } = updates.result;
      // Handle worker result with UI breathing room
      handleWorkerResultWithBreathing(updatedRecords, recordsUpdatedCount, updatedGroupedData);
    });
  }
}

// Modified handle worker result that gives the UI time to breathe
async function handleWorkerResultWithBreathing(
  updatedRecords: { name: string; prefix: string; effective: string }[],
  recordsUpdatedCount: number,
  updatedGroupedData: {
    destinationName: string;
    effectiveDate: string;
    changeCode: ChangeCodeType;
  }[]
) {
  try {
    console.log(`Handling worker result: ${updatedRecords.length} records to update`);
    processingStatus.value = `Saving ${updatedRecords.length} updated records to store...`;

    // Add to processing logs
    processingLogs.value.push({
      time: Date.now(),
      message: `Received final results: ${recordsUpdatedCount} records updated`,
    });

    // Allow UI to update (minimal delay)
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50);
      });
    });

    // Only update if changes were made
    if (updatedRecords.length > 0) {
      processingLogs.value.push({
        time: Date.now(),
        message: `Starting store update for ${updatedRecords.length} records`,
      });

      console.log('Updating store with worker results');
      processingPhase.value = 'updating';
      processingStatus.value = 'Updating application state...';

      // Update the store directly with the records from the worker
      store.updateEffectiveDatesWithRecords(updatedRecords);

      processingLogs.value.push({
        time: Date.now(),
        message: `Store update completed`,
      });

      // Update the grouped data with the results from the worker
      if (updatedGroupedData && updatedGroupedData.length > 0) {
        processingLogs.value.push({
          time: Date.now(),
          message: `Updating grouped data with ${updatedGroupedData.length} groups from worker`,
        });

        // Update grouped data with the results from the worker
        store.updateGroupedDataEffectiveDates(updatedGroupedData);
      }

      // Calculate the time spent
      const processingTime = Math.floor((Date.now() - processingStartTime.value) / 1000);
      processingStatus.value = `Complete! ${recordsUpdatedCount} records updated in ${processingTime}s`;
      processingPhase.value = 'finalizing';

      // Allow a brief moment to show completion status
      await new Promise((resolve) => setTimeout(resolve, 300));

      // No alert needed - we're showing the completion status in the UI
    } else {
      console.log('No records needed updating, just saving settings');
      processingPhase.value = 'finalizing';
      processingStatus.value = 'Saving settings...';

      // Still save the settings even if no dates needed updating
      store.setEffectiveDateSettings({ ...effectiveDateSettings.value });

      const processingTime = Math.floor((Date.now() - processingStartTime.value) / 1000);
      processingStatus.value = `Complete! Settings saved in ${processingTime}s`;

      // Allow a moment to see the completion status
      await new Promise((resolve) => setTimeout(resolve, 300));

      // No alert needed
    }
  } catch (error) {
    console.error('Failed to finalize updates:', error);
    processingStatus.value = `Error: ${error instanceof Error ? error.message : String(error)}`;
    alert(
      'Failed to complete updates: ' + (error instanceof Error ? error.message : String(error))
    );
  } finally {
    isApplyingSettings.value = false;
    progressPercentage.value = 0;
    processingPhase.value = 'idle';

    // Clear the elapsed time interval
    if (elapsedTimeInterval) {
      clearInterval(elapsedTimeInterval);
      elapsedTimeInterval = null;
    }
  }
}

// Cleanup worker on component unmount
onBeforeUnmount(() => {
  if (effectiveDateWorker) {
    console.log('Cleaning up worker on component unmount');
    effectiveDateWorker.terminate();
    effectiveDateWorker = null;
  }

  // Clean up timer interval
  if (elapsedTimeInterval) {
    clearInterval(elapsedTimeInterval);
    elapsedTimeInterval = null;
  }

  // Clean up search debounce
  if (searchDebounceTimeout) {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = null;
  }
});

// Update the applyEffectiveDateSettings function to use the worker
async function applyEffectiveDateSettings() {
  if (isApplyingSettings.value || !effectiveDateWorker) return;

  // Clear previous logs when starting a new operation
  processingLogs.value = [];
  processingLogs.value.push({
    time: Date.now(),
    message: 'Starting effective date update process',
  });

  // Check if there are any conflicts before proceeding
  const conflictCount = store.getDiscrepancyCount;
  if (conflictCount > 0) {
    processingLogs.value.push({
      time: Date.now(),
      message: `Cannot proceed: ${conflictCount} rate conflicts detected`,
    });
    alert(
      `Cannot apply effective dates while ${conflictCount} rate conflicts exist. Please resolve all conflicts first.`
    );
    return;
  }

  isApplyingSettings.value = true;
  progressPercentage.value = 0;
  processingPhase.value = 'preparing';
  processingStatus.value = 'Initializing worker...';
  processingStartTime.value = Date.now();
  displayedElapsedTime.value = 0;

  // Start separate timer for UI updates
  if (elapsedTimeInterval) {
    clearInterval(elapsedTimeInterval);
  }
  elapsedTimeInterval = window.setInterval(() => {
    if (processingStartTime.value > 0) {
      displayedElapsedTime.value = Math.floor((Date.now() - processingStartTime.value) / 1000);
    }
  }, 100);

  // Show logs automatically when applying settings
  showProcessingLogs.value = true;

  try {
    console.log('Starting effective date update process');
    processingLogs.value.push({
      time: Date.now(),
      message: 'Preparing data for worker',
    });

    // Create simplified versions of the data to send to the worker
    // Extract only the properties we need to ensure everything is serializable

    // Get the raw data
    const rawGroupedData = store.groupedData.map((group) => ({
      destinationName: group.destinationName,
      changeCode: group.changeCode,
      effectiveDate: group.effectiveDate,
    }));

    // Simplify records too - only send what's needed
    const simplifiedRecords = store.originalData.map((record) => ({
      name: record.name,
      prefix: record.prefix,
      effective: record.effective,
    }));

    processingStatus.value = 'Sending data to worker...';

    console.log(
      `Sending ${rawGroupedData.length} simplified groups and ${simplifiedRecords.length} simplified records to worker`
    );
    processingLogs.value.push({
      time: Date.now(),
      message: `Sending ${rawGroupedData.length} groups and ${simplifiedRecords.length} records to worker`,
    });

    // Send to worker with only the required data
    effectiveDateWorker.postMessage({
      rawGroupedData,
      allRecords: simplifiedRecords,
      effectiveDateSettings: { ...effectiveDateSettings.value },
    });

    processingLogs.value.push({
      time: Date.now(),
      message: 'Data sent to worker, awaiting results',
    });
  } catch (error) {
    console.error('Error starting effective date update:', error);
    processingLogs.value.push({
      time: Date.now(),
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
    processingStatus.value = `Error starting update: ${
      error instanceof Error ? error.message : String(error)
    }`;
    alert('Error starting update: ' + (error instanceof Error ? error.message : String(error)));
    isApplyingSettings.value = false;
    processingPhase.value = 'idle';

    // Clear the elapsed time interval
    if (elapsedTimeInterval) {
      clearInterval(elapsedTimeInterval);
      elapsedTimeInterval = null;
    }
  }
}

function getEffectiveDateLabel(setting: string): string {
  if (setting === 'today') {
    return 'Today';
  } else if (setting === 'tomorrow') {
    return 'Tomorrow';
  } else if (setting === 'week') {
    return '7 Days';
  } else if (setting === 'custom') {
    return 'Custom';
  }
  return setting;
}

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

function toggleEffectiveDateSettings() {
  showEffectiveDateSettings.value = !showEffectiveDateSettings.value;

  // If opening the settings panel, ensure date fields have the proper defaults
  if (showEffectiveDateSettings.value) {
    // Make sure INCREASE date is 7 days from now if the mode is 'week'
    if (effectiveDateSettings.value.increase === 'week') {
      const sevenDaysDate = new Date();
      sevenDaysDate.setDate(sevenDaysDate.getDate() + 7);
      effectiveDateSettings.value.increaseCustomDate = sevenDaysDate.toISOString().split('T')[0];
      console.log('Set increase date to 7 days:', effectiveDateSettings.value.increaseCustomDate);
    }
  }
}

// Date selection helper methods
function setSameDate(value: 'today' | 'tomorrow' | 'custom') {
  effectiveDateSettings.value.same = value;
}

function setIncreaseDate(value: 'today' | 'tomorrow' | 'week' | 'custom') {
  effectiveDateSettings.value.increase = value;

  // Update the date field based on the selected value
  if (value === 'today') {
    effectiveDateSettings.value.increaseCustomDate = new Date().toISOString().split('T')[0];
  } else if (value === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    effectiveDateSettings.value.increaseCustomDate = tomorrow.toISOString().split('T')[0];
  } else if (value === 'week') {
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    effectiveDateSettings.value.increaseCustomDate = sevenDays.toISOString().split('T')[0];
  }
  // For 'custom', we keep whatever date the user selected
}

function setDecreaseDate(value: 'today' | 'tomorrow' | 'custom') {
  effectiveDateSettings.value.decrease = value;
}

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
    filterOptions.find((option) => option.value === filterStatus.value)?.label || 'All Destinations'
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

  return false;
}

// Function to get the calculated rate based on pending inputs
function getPendingUpdatedRate(destinationName: string): number | null {
  const group = groupedData.value.find((g) => g.destinationName === destinationName);
  if (!group) return null;

  const directRate = directSetRates.value[destinationName];
  const adjustment = singleRateAdjustments.value[destinationName];

  // Priority 1: Direct Rate Input
  if (directRate !== null && directRate !== undefined) {
    return directRate;
  }

  // Priority 2: Adjustment Calculation
  if (adjustment?.adjustmentValue !== null && adjustment?.adjustmentValue > 0) {
    let baseRate: number | undefined;

    if (group.hasDiscrepancy) {
      // Use the currently selected rate for multi-rate destinations
      baseRate = selectedRates.value[destinationName];
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

  // No pending changes that result in a new rate
  return null;
}

// --- End Real-time Calculation Logic ---

// ... rest of the script setup ...
</script>

<style scoped>
/* ... styles ... */
</style>
