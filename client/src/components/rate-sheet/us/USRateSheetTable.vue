<template>
  <div class="space-y-4">
    <!-- Effective Date Settings (collapsible) -->
    <div class="bg-gray-900/50 rounded-lg p-4 mb-4">
      <div @click="toggleEffectiveDateSettings()" class="cursor-pointer bg-gray-900/30">
        <div class="flex items-center gap-2 w-full justify-between">
          <h3 class="text-sm font-medium text-gray-300">Effective Date Settings</h3>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-gray-400">Same:</span>
            <span class="font-medium text-white">{{
              getEffectiveDateLabel(effectiveDateSettings.same)
            }}</span>
            <span class="text-gray-400">|</span>
            <span class="text-green-400">↑ Increase:</span>
            <span class="font-medium text-white">{{
              getEffectiveDateLabel(effectiveDateSettings.increase)
            }}</span>
            <span class="text-gray-400">|</span>
            <span class="text-red-400">↓ Decrease:</span>
            <span class="font-medium text-white">{{
              getEffectiveDateLabel(effectiveDateSettings.decrease)
            }}</span>
          </div>
          <button class="p-1 text-gray-400 hover:text-white rounded-full transition-colors">
            <ChevronDownIcon
              class="w-5 h-5 transition-transform"
              :class="{ 'rotate-180': showEffectiveDateSettings }"
            />
          </button>
        </div>
      </div>

      <div v-if="showEffectiveDateSettings" class="mt-4">
        <!-- Date settings UI -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- SAME Rate Effective Date -->
          <div class="bg-gray-900/30 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-400">SAME Rate</span>
              <span class="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded">No Change</span>
            </div>
            <div class="flex flex-col space-y-2">
              <div class="flex items-center">
                <input
                  id="same-today"
                  v-model="effectiveDateSettings.same"
                  type="radio"
                  value="today"
                  class="mr-2"
                />
                <label for="same-today" class="text-sm">Today</label>
              </div>
              <div class="flex items-center">
                <input
                  id="same-tomorrow"
                  v-model="effectiveDateSettings.same"
                  type="radio"
                  value="tomorrow"
                  class="mr-2"
                />
                <label for="same-tomorrow" class="text-sm">Tomorrow</label>
              </div>
              <div class="flex items-center">
                <input
                  id="same-custom"
                  v-model="effectiveDateSettings.same"
                  type="radio"
                  value="custom"
                  class="mr-2"
                />
                <label for="same-custom" class="text-sm">Custom</label>
              </div>
              <div v-if="effectiveDateSettings.same === 'custom'" class="pt-2">
                <input
                  type="date"
                  v-model="effectiveDateSettings.sameCustomDate"
                  class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <!-- INCREASE Rate Effective Date -->
          <div class="bg-gray-900/30 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-400">INCREASE Rate</span>
              <span class="px-2 py-1 text-xs bg-green-900/30 text-green-400 rounded"
                >↑ Rate Up</span
              >
            </div>
            <div class="flex flex-col space-y-2">
              <div class="flex items-center">
                <input
                  id="increase-today"
                  v-model="effectiveDateSettings.increase"
                  type="radio"
                  value="today"
                  class="mr-2"
                />
                <label for="increase-today" class="text-sm">Today</label>
              </div>
              <div class="flex items-center">
                <input
                  id="increase-tomorrow"
                  v-model="effectiveDateSettings.increase"
                  type="radio"
                  value="tomorrow"
                  class="mr-2"
                />
                <label for="increase-tomorrow" class="text-sm">Tomorrow</label>
              </div>
              <div class="flex items-center">
                <input
                  id="increase-week"
                  v-model="effectiveDateSettings.increase"
                  type="radio"
                  value="week"
                  class="mr-2"
                />
                <label for="increase-week" class="text-sm">7 Days (Default)</label>
              </div>
              <div class="flex items-center">
                <input
                  id="increase-custom"
                  v-model="effectiveDateSettings.increase"
                  type="radio"
                  value="custom"
                  class="mr-2"
                />
                <label for="increase-custom" class="text-sm">Custom</label>
              </div>
              <div v-if="effectiveDateSettings.increase === 'custom'" class="pt-2">
                <input
                  type="date"
                  v-model="effectiveDateSettings.increaseCustomDate"
                  class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <!-- DECREASE Rate Effective Date -->
          <div class="bg-gray-900/30 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-400">DECREASE Rate</span>
              <span class="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded">↓ Rate Down</span>
            </div>
            <div class="flex flex-col space-y-2">
              <div class="flex items-center">
                <input
                  id="decrease-today"
                  v-model="effectiveDateSettings.decrease"
                  type="radio"
                  value="today"
                  class="mr-2"
                />
                <label for="decrease-today" class="text-sm">Today</label>
              </div>
              <div class="flex items-center">
                <input
                  id="decrease-tomorrow"
                  v-model="effectiveDateSettings.decrease"
                  type="radio"
                  value="tomorrow"
                  class="mr-2"
                />
                <label for="decrease-tomorrow" class="text-sm">Tomorrow</label>
              </div>
              <div class="flex items-center">
                <input
                  id="decrease-custom"
                  v-model="effectiveDateSettings.decrease"
                  type="radio"
                  value="custom"
                  class="mr-2"
                />
                <label for="decrease-custom" class="text-sm">Custom</label>
              </div>
              <div v-if="effectiveDateSettings.decrease === 'custom'" class="pt-2">
                <input
                  type="date"
                  v-model="effectiveDateSettings.decreaseCustomDate"
                  class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Progress and apply button -->
        <div class="space-y-2">
          <!-- Multi-step progress indicator -->
          <div v-if="isApplyingSettings" class="mb-4 bg-gray-900/30 p-3 rounded-lg">
            <div class="flex justify-between mb-2">
              <h4 class="text-sm font-medium text-gray-300">Progress</h4>
              <span class="text-xs text-gray-400" v-if="processingStartTime > 0">
                {{ displayedElapsedTime }}s elapsed
              </span>
            </div>

            <!-- Processing steps indicators -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                  :class="{
                    'bg-green-500 text-white ring-4 ring-green-500/20':
                      processingPhase === 'preparing',
                    'bg-green-900/30 text-green-400':
                      processingPhase === 'processing' ||
                      processingPhase === 'updating' ||
                      processingPhase === 'finalizing',
                    'bg-gray-800 text-gray-400': processingPhase === 'idle',
                  }"
                >
                  1
                </div>
                <div
                  class="ml-2 text-sm transition-all duration-300 font-medium"
                  :class="{
                    'text-green-500': processingPhase === 'preparing',
                    'text-green-400':
                      processingPhase === 'processing' ||
                      processingPhase === 'updating' ||
                      processingPhase === 'finalizing',
                    'text-gray-600': processingPhase === 'idle',
                  }"
                >
                  Preparing Data
                </div>
              </div>
              <div
                class="h-1 flex-1 mx-2 transition-all duration-300"
                :class="{
                  'bg-green-500':
                    processingPhase === 'processing' ||
                    processingPhase === 'updating' ||
                    processingPhase === 'finalizing',
                  'bg-gray-700': processingPhase === 'idle' || processingPhase === 'preparing',
                }"
              ></div>
              <div class="flex items-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                  :class="{
                    'bg-green-500 text-white ring-4 ring-green-500/20':
                      processingPhase === 'processing',
                    'bg-green-900/30 text-green-400':
                      processingPhase === 'updating' || processingPhase === 'finalizing',
                    'bg-gray-800 text-gray-400':
                      processingPhase === 'idle' ||
                      processingPhase === 'preparing' ||
                      processingPhase === 'processing',
                  }"
                >
                  2
                </div>
                <div
                  class="ml-2 text-sm transition-all duration-300 font-medium"
                  :class="{
                    'text-green-500': processingPhase === 'processing',
                    'text-green-400':
                      processingPhase === 'updating' || processingPhase === 'finalizing',
                    'text-gray-600':
                      processingPhase === 'idle' ||
                      processingPhase === 'preparing' ||
                      processingPhase === 'processing',
                  }"
                >
                  Processing Records
                </div>
              </div>
              <div
                class="h-1 flex-1 mx-2 transition-all duration-300"
                :class="{
                  'bg-green-500':
                    processingPhase === 'updating' || processingPhase === 'finalizing',
                  'bg-gray-700':
                    processingPhase === 'idle' ||
                    processingPhase === 'preparing' ||
                    processingPhase === 'processing',
                }"
              ></div>
              <div class="flex items-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                  :class="{
                    'bg-green-500 text-white ring-4 ring-green-500/20':
                      processingPhase === 'updating',
                    'bg-green-900/30 text-green-400': processingPhase === 'finalizing',
                    'bg-gray-800 text-gray-400':
                      processingPhase === 'idle' ||
                      processingPhase === 'preparing' ||
                      processingPhase === 'processing',
                  }"
                >
                  3
                </div>
                <div
                  class="ml-2 text-sm transition-all duration-300 font-medium"
                  :class="{
                    'text-green-500': processingPhase === 'updating',
                    'text-green-400': processingPhase === 'finalizing',
                    'text-gray-600':
                      processingPhase === 'idle' ||
                      processingPhase === 'preparing' ||
                      processingPhase === 'processing',
                  }"
                >
                  Updating Database
                </div>
              </div>
            </div>

            <!-- Processing status message -->
            <div class="text-sm text-gray-300 mb-2 min-h-[1.5rem]">{{ processingStatus }}</div>

            <!-- Detailed status info -->
            <div
              class="flex justify-between text-xs text-gray-400 mb-2 min-h-[1.5rem]"
              v-if="isApplyingSettings && processingPhase === 'processing'"
            >
              <div v-if="currentDestination">
                Processing: <span class="text-green-400">{{ currentDestination }}</span>
              </div>
              <div v-if="recordsUpdatedSoFar > 0">
                {{ recordsUpdatedSoFar }} records updated so far
              </div>
              <div v-if="estimatedTimeRemaining !== undefined">
                Est. time remaining:
                <span class="text-green-400">{{
                  estimatedTimeRemaining > 0 ? `${estimatedTimeRemaining}s` : 'calculating...'
                }}</span>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                class="h-3 rounded-full transition-all duration-300 relative"
                :class="{
                  'bg-green-500': processingPhase === 'finalizing',
                  'bg-green-400': processingPhase !== 'finalizing',
                }"
                :style="{ width: `${progressPercentage}%` }"
              >
                <div
                  class="absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-white/20"
                ></div>
              </div>
            </div>

            <!-- Processing logs (collapsible) -->
            <div class="mt-3">
              <div
                @click="showProcessingLogs = !showProcessingLogs"
                class="cursor-pointer flex items-center text-xs text-gray-400"
              >
                <ChevronRightIcon
                  class="h-3 w-3 mr-1 transition-transform"
                  :class="{ 'rotate-90': showProcessingLogs }"
                />
                <span>Processing logs ({{ processingLogs.length }})</span>
              </div>

              <div
                v-if="showProcessingLogs"
                class="mt-2 bg-gray-900/70 p-2 rounded text-xs text-gray-500 max-h-40 overflow-y-auto"
              >
                <div v-for="(log, index) in processingLogs" :key="index" class="mb-1">
                  <span class="text-gray-600">{{ new Date(log.time).toLocaleTimeString() }}:</span>
                  <span>{{ log.message }}</span>
                </div>
                <div v-if="processingLogs.length === 0" class="italic">No logs available yet</div>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center">
            <!-- Apply button -->
            <div class="flex justify-end w-full">
              <button
                @click="applyEffectiveDateSettings"
                class="px-4 py-2 bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 rounded-md transition-colors"
                :class="{
                  'animate-pulse-fast': isApplyingSettings,
                  'opacity-50 cursor-not-allowed': isApplyingSettings,
                }"
                :disabled="isApplyingSettings"
              >
                {{ isApplyingSettings ? 'APPLYING SETTINGS...' : 'Apply Date Settings' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-gray-800 rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <h3 class="text-sm font-medium text-gray-300">Table Controls</h3>
          <span class="text-sm text-gray-400">
            Showing {{ filteredData.length }} destinations
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handleClearData"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-md text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 transition-colors border border-red-400/30"
          >
            <TrashIcon class="w-4 h-4" />
            Clear Rate Sheet Data
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <!-- Filter -->
        <div>
          <label class="block text-sm text-gray-400 mb-1">View Filter</label>
          <select
            v-model="filterStatus"
            class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
          >
            <option value="all">All Destinations</option>
            <option value="conflicts">Rate Conflicts</option>
            <option value="no-conflicts">No Conflicts</option>
            <optgroup label="Change Status">
              <option value="change-same">Same Rate</option>
              <option value="change-increase">Rate Increase</option>
              <option value="change-decrease">Rate Decrease</option>
            </optgroup>
          </select>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm text-gray-400 mb-1">Search</label>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by Name or Prefix Start..."
              class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
            />
            <div v-if="isSearching" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div class="spinner-accent"></div>
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
                <button
                  @click="handleBulkUpdate('highest')"
                  :disabled="isBulkProcessing"
                  class="flex-1 px-3 py-2 text-sm bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 rounded-md text-gray-300 transition-colors"
                  :class="{ 'opacity-50 cursor-not-allowed animate-pulse-fast': isBulkProcessing }"
                >
                  {{ isBulkProcessing ? 'Processing...' : 'Use Highest' }}
                </button>
                <button
                  v-if="!isBulkProcessing"
                  @click="handleBulkUpdate('lowest')"
                  class="flex-1 px-3 py-2 text-sm bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 rounded-md text-gray-300 transition-colors"
                >
                  Use Lowest
                </button>
              </div>
            </div>
          </div>
          <!-- Export Action -->
          <div v-else-if="!isBulkProcessing && store.getDiscrepancyCount === 0">
            <label class="block text-sm text-gray-400 mb-1">Actions</label>
            <button
              @click="handleExport"
              class="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-md text-green-400 hover:text-green-300 bg-green-400/10 hover:bg-green-400/20 transition-colors border border-green-400/30"
            >
              <ArrowDownTrayIcon class="w-4 h-4" />
              Export Rate Sheet
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="filteredData.length > 0" class="overflow-hidden rounded-lg bg-gray-800 shadow">
      <table class="min-w-full divide-y divide-gray-700">
        <thead class="bg-gray-900/50">
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
              @click="toggleExpand(group.destinationName)"
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
                  <div
                    v-if="group.hasDiscrepancy"
                    class="ml-2 inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20"
                  >
                    Rate Conflict
                  </div>
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
              <td class="px-3 py-4 text-sm">
                <div
                  class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                  :class="{
                    'bg-gray-500/20 text-gray-400 ring-1 ring-inset ring-gray-500/30':
                      group.changeCode === ChangeCode.SAME,
                    'bg-red-400/10 text-red-400 ring-1 ring-inset ring-red-400/30':
                      group.changeCode === ChangeCode.DECREASE,
                    'bg-orange-400/10 text-orange-400 ring-1 ring-inset ring-orange-400/30':
                      group.changeCode === ChangeCode.INCREASE,
                  }"
                >
                  {{ group.changeCode }}
                </div>
              </td>
              <td class="px-3 py-4 text-sm text-gray-300">
                <div
                  class="flex items-center"
                  :class="{
                    'text-orange-400': group.changeCode === ChangeCode.INCREASE,
                    'text-red-400': group.changeCode === ChangeCode.DECREASE,
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
                  <div class="flex items-center justify-between mb-4">
                    <h4 class="text-sm font-medium text-white">Rate Distribution</h4>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="
                          !areAllRateCodesExpanded(group.destinationName) && group.rates.length > 1
                        "
                        @click="toggleAllRateCodesForDestination(group.destinationName, true)"
                        class="px-3 py-1.5 text-xs bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 rounded-md transition-colors"
                      >
                        Show All Codes
                      </button>
                      <button
                        v-if="areAnyRateCodesExpanded(group.destinationName)"
                        @click="toggleAllRateCodesForDestination(group.destinationName, false)"
                        class="px-3 py-1.5 text-xs bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 rounded-md transition-colors"
                      >
                        Hide All Codes
                      </button>
                      <button
                        v-if="group.hasDiscrepancy || hasUnsavedChanges(group.destinationName)"
                        @click="saveRateSelection(group)"
                        class="px-3 py-1.5 text-sm bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 rounded-md transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                  <div class="space-y-2">
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
                            class="text-accent"
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

                    <!-- Custom Rate Option -->
                    <div
                      class="flex items-center justify-between text-sm p-2 rounded-md"
                      @click.stop
                    >
                      <label class="flex items-center gap-2 flex-1 cursor-pointer">
                        <input
                          type="radio"
                          :name="`rate-${group.destinationName}`"
                          value="custom"
                          :checked="isCustomRate(group.destinationName)"
                          @change="enableCustomRate(group.destinationName)"
                          class="text-accent"
                        />
                        <div class="flex items-center gap-2">
                          <span class="text-white">Custom Rate:</span>
                          <span v-if="customRates[group.destinationName]" class="text-accent">
                            {{ formatRate(customRates[group.destinationName]) }}
                          </span>
                          <button
                            @click.stop="openCustomRateInput(group.destinationName)"
                            class="px-2 py-1 text-xs bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 rounded-md ml-2 transition-colors"
                          >
                            {{ customRates[group.destinationName] ? 'Edit' : 'Set Rate' }}
                          </button>
                        </div>
                      </label>
                    </div>
                  </div>
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
        <span class="inline-flex items-center gap-2">
          Searching<span class="dots-loading"></span>
        </span>
      </p>
      <p class="text-gray-400" v-else>No destinations found matching your filters</p>
    </div>

    <!-- Custom Rate Modal -->
    <div
      v-if="customRateModal.isOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center"
      @click.self="customRateModal.isOpen = false"
    >
      <div class="bg-gray-800 p-4 rounded-lg w-96">
        <h3 class="text-lg font-medium mb-4">Set Custom Rate</h3>
        <input
          ref="customRateInput"
          type="number"
          step="0.000001"
          v-model="customRateModal.value"
          class="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full text-white mb-4"
          @keyup.enter="saveCustomRate"
        />
        <div class="flex justify-end gap-2">
          <button
            @click="customRateModal.isOpen = false"
            class="px-3 py-1.5 text-sm bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveCustomRate"
            class="px-3 py-1.5 text-sm bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 rounded-md transition-colors"
          >
            Save
          </button>
        </div>
      </div>
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
} from '@heroicons/vue/24/outline';
import type { GroupedRateData } from '@/types/domains/rate-sheet-types';
import { useAzRateSheetStore } from '@/stores/az-rate-sheet-store';
import { ChangeCode, type ChangeCodeType } from '@/types/domains/rate-sheet-types';
import { USRateSheetService } from '@/services/us-rate-sheet.service';
import type {
  EffectiveDateSettings,
  EffectiveDateStoreSettings,
} from '@/types/domains/rate-sheet-types';
import EffectiveDateUpdaterWorker from '@/workers/effective-date-updater.worker?worker';

// Define emits
const emit = defineEmits(['update:discrepancy-count']);

// Initialize store and service
const store = useAzRateSheetStore();
const rateSheetService = new USRateSheetService();
const groupedData = computed(() => store.getGroupedData);
const expandedRows = ref<string[]>([]);
const filterStatus = ref<
  'all' | 'conflicts' | 'no-conflicts' | 'change-same' | 'change-increase' | 'change-decrease'
>('all');
const searchQuery = ref('');
const debouncedSearchQuery = ref('');
const isSearching = ref(false);
const searchProgress = ref(0);
const searchTotal = ref(0);
const selectedRates = ref<Record<string, number>>({});
const customRates = ref<Record<string, number>>({});
const originalRates = ref<Record<string, number>>({});
const customRateModal = ref({
  isOpen: false,
  destinationName: '',
  value: '',
});
const customRateInput = ref<HTMLInputElement | null>(null);

// Add new refs for processing state
const isBulkProcessing = ref(false);
const processedCount = ref(0);
const totalToProcess = ref(0);
const currentDiscrepancyCount = ref(0); // Track current discrepancy count during processing

// Track which rate's codes are expanded
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
  increaseCustomDate: new Date().toISOString().split('T')[0],
  decreaseCustomDate: new Date().toISOString().split('T')[0],
});

// Controls visibility of effective date settings section
const showEffectiveDateSettings = ref(false);
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
    // Cast the saved settings to ensure correct types
    effectiveDateSettings.value = {
      same: savedSettings.same as 'today' | 'tomorrow' | 'custom',
      increase: savedSettings.increase as 'today' | 'tomorrow' | 'week' | 'custom',
      decrease: savedSettings.decrease as 'today' | 'tomorrow' | 'custom',
      sameCustomDate: savedSettings.sameCustomDate,
      increaseCustomDate: savedSettings.increaseCustomDate,
      decreaseCustomDate: savedSettings.decreaseCustomDate,
    };
  }
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

function toggleExpand(destinationName: string) {
  const index = expandedRows.value.indexOf(destinationName);
  if (index > -1) {
    expandedRows.value.splice(index, 1);
  } else {
    expandedRows.value.push(destinationName);

    // Initialize selected rate if not already set
    if (selectedRates.value[destinationName] === undefined) {
      // Find the group for this destination
      const group = groupedData.value.find((g) => g.destinationName === destinationName);
      if (group) {
        // If no conflicts, use the only rate. If conflicts, use the most common rate (first one with isCommon=true)
        const mostCommonRate = group.rates.find((r) => r.isCommon)?.rate;
        if (mostCommonRate !== undefined) {
          selectedRates.value[destinationName] = mostCommonRate;
          // Also store as original rate for detecting changes
          originalRates.value[destinationName] = mostCommonRate;
        }
      }
    }
  }
}

function formatRate(rate: number): string {
  return rate.toFixed(6);
}

function isSelectedRate(destinationName: string, rate: number): boolean {
  return selectedRates.value[destinationName] === rate;
}

function isCustomRate(destinationName: string): boolean {
  return selectedRates.value[destinationName] === customRates.value[destinationName];
}

function selectRate(destinationName: string, rate: number) {
  selectedRates.value[destinationName] = rate;
}

function enableCustomRate(destinationName: string) {
  if (!customRates.value[destinationName]) {
    customRates.value[destinationName] = 0;
  }
  selectedRates.value[destinationName] = customRates.value[destinationName];
}

function handleCustomRateInput(destinationName: string, event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value);
  if (!isNaN(value)) {
    customRates.value[destinationName] = value;
    selectedRates.value[destinationName] = value;
  }
}

function hasUnsavedChanges(destinationName: string): boolean {
  return selectedRates.value[destinationName] !== originalRates.value[destinationName];
}

async function saveRateSelection(group: GroupedRateData) {
  const newRate = selectedRates.value[group.destinationName];
  if (newRate !== undefined) {
    await store.updateDestinationRate(group.destinationName, newRate);
    originalRates.value[group.destinationName] = newRate;
    store.setGroupedData(store.getGroupedData);
    const index = expandedRows.value.indexOf(group.destinationName);
    if (index > -1) {
      expandedRows.value.splice(index, 1);
    }
  }
}

function openCustomRateInput(destinationName: string) {
  customRateModal.value = {
    isOpen: true,
    destinationName,
    value: customRates.value[destinationName]?.toString() || '',
  };
  nextTick(() => {
    customRateInput.value?.focus();
  });
}

function saveCustomRate() {
  const value = parseFloat(customRateModal.value.value);
  if (!isNaN(value)) {
    const { destinationName } = customRateModal.value;
    customRates.value[destinationName] = value;
    selectedRates.value[destinationName] = value;
    customRateModal.value.isOpen = false;
  }
}

async function handleBulkUpdate(mode: 'highest' | 'lowest') {
  isBulkProcessing.value = true;
  processedCount.value = 0;

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
  }
}

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

// Watch for changes in currentDiscrepancyCount and emit to parent
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

// Function to calculate date based on setting
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

// Function to initialize and cleanup the worker
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

    // Close the section after applying settings
    showEffectiveDateSettings.value = false;
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
}

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
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-pulse-fast {
  animation: pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.spinner-accent {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(
    --color-accent,
    #10b981
  ); /* Use theme accent color with fallback to green */
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.dots-loading {
  display: inline-block;
  position: relative;
  width: 20px;
  height: 20px;
}

.dots-loading:after {
  content: '...';
  font-weight: bold;
  color: var(--color-accent, #10b981);
  animation: dots 1.5s infinite;
}

@keyframes dots {
  0%,
  20% {
    content: '.';
  }
  40% {
    content: '..';
  }
  60%,
  100% {
    content: '...';
  }
}
</style>
