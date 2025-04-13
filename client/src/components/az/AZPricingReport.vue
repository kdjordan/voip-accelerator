<template>
  <!-- Message for single file scenario -->
  <div v-if="!hasTwoFiles" class="bg-gray-800 p-6 rounded-lg">
    <div class="text-center py-12">
      <h3 class="text-xl text-accent mb-4">Pricing Comparison Not Available</h3>
      <p class="text-gray-300 max-w-lg mx-auto">
        The pricing comparison report requires two files to be uploaded. Please upload a second file
        to see pricing opportunities.
      </p>
      <button
        @click="goToFilesTab"
        class="mt-6 px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors"
      >
        <span class="text-sm text-accent">Upload Another File</span>
      </button>
    </div>
  </div>

  <div v-else-if="report || azStore.getDetailedComparisonTableName" class="space-y-8 bg-gray-800">
    <!-- Existing Summary Sections (Sell, Buy, Same, Unmatched) -->
    <div v-if="report" class="space-y-4">
      <!-- Sell Section -->
      <div class="bg-gray-900/50">
        <div
          @click="toggleSection('sell')"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-lg">
              You should <span class="text-accent">SELL</span> to Them
            </span>
            <div class="flex items-center space-x-3">
              <span class="text-accent"> {{ filteredSellItems.length }} destinations </span>
              <ChevronDownIcon
                :class="{ 'transform rotate-180': expandedSections.sell }"
                class="w-5 h-5 transition-transform text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- Sell Content -->
        <div v-if="expandedSections.sell" class="border-t border-gray-700/50 p-6">
          <!-- Search Filter -->
          <div class="mb-4 bg-accent/5 p-4 rounded-lg border border-gray-700 shadow-inner">
            <div class="flex items-center gap-8">
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Search Destinations</label>
                <input
                  v-model="sellSearchQuery"
                  type="text"
                  placeholder="Search destinations..."
                  class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
                />
              </div>
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Sort By</label>
                <div class="relative">
                  <select
                    v-model="sellSortBy"
                    class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2 appearance-none cursor-pointer pr-10"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="percent-asc">Margin (Low-High)</option>
                    <option value="percent-desc">Margin (High-Low)</option>
                  </select>
                  <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"
                  >
                    <ChevronDownIcon class="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-900/80 rounded-lg overflow-hidden">
            <div>
              <div v-for="item in filteredSellItems" :key="item.dialCode">
                <!-- Destination Header (Always Visible) -->
                <div
                  @click="toggleDestinationExpand('sell', item.dialCode)"
                  class="px-3 py-3 w-full hover:bg-gray-700/50 transition-colors cursor-pointer flex items-center"
                >
                  <ChevronRightIcon
                    class="h-5 w-5 text-gray-400 transition-transform mr-3"
                    :class="{ 'rotate-90': expandedDestinations.sell.has(item.dialCode) }"
                  />

                  <div class="flex-1">
                    <div class="font-medium text-white">{{ item.destName }}</div>
                  </div>
                </div>

                <!-- Expanded Content for Sell Section -->
                <div
                  v-if="expandedDestinations.sell.has(item.dialCode)"
                  class="bg-black/60 border-t border-gray-800"
                >
                  <div class="px-3 py-4">
                    <!-- Code info only -->
                    <div class="pl-8 mb-4">
                      <span class="text-sm text-gray-300">
                        {{ item.dialCode.split(',').length }} codes
                        <button
                          v-if="
                            item.dialCode.split(',').length > 0 && !isCodeExpanded(item.dialCode)
                          "
                          @click.stop="toggleExpandRow(item.dialCode)"
                          class="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                        >
                          Show
                        </button>
                        <button
                          v-if="
                            item.dialCode.split(',').length > 0 && isCodeExpanded(item.dialCode)
                          "
                          @click.stop="toggleExpandRow(item.dialCode)"
                          class="ml-2 px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                        >
                          Hide
                        </button>
                      </span>
                    </div>

                    <!-- Dial Codes if expanded -->
                    <div v-if="isCodeExpanded(item.dialCode)" class="mb-4 pl-8">
                      <div class="text-xs text-gray-400 mb-1">Dial Codes:</div>
                      <div class="text-sm text-gray-300">{{ item.dialCode }}</div>
                    </div>

                    <!-- Rate Comparison Details - evenly spaced at 1/3 each -->
                    <div class="pl-8 grid grid-cols-3 gap-4">
                      <div class="col-span-1">
                        <div class="text-sm text-gray-400 mb-1">Your Rate</div>
                        <div class="font-medium text-base">{{ item.rateFile1 }}</div>
                      </div>
                      <div class="col-span-1">
                        <div class="text-sm text-gray-400 mb-1">Their Rate</div>
                        <div class="font-medium text-base">{{ item.rateFile2 }}</div>
                      </div>
                      <div class="col-span-1">
                        <div class="text-sm text-gray-400 mb-1">Profit Margin</div>
                        <div class="font-medium text-base text-red-500">
                          {{ formatPercentage(item.percentageDifference) }}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Buy Section -->
      <div class="bg-gray-900/50">
        <div
          @click="toggleSection('buy')"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-lg">
              You should <span class="text-accent">BUY</span> from Them
            </span>
            <div class="flex items-center space-x-3">
              <span class="text-accent"> {{ filteredBuyItems.length }} destinations </span>
              <ChevronDownIcon
                :class="{ 'transform rotate-180': expandedSections.buy }"
                class="w-5 h-5 transition-transform text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- Buy Content -->
        <div v-if="expandedSections.buy" class="border-t border-gray-700/50 p-6">
          <!-- Search Filter -->
          <div class="mb-4 bg-accent/5 p-4 rounded-lg border border-gray-700 shadow-inner">
            <div class="flex items-center gap-8">
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Search Destinations</label>
                <input
                  v-model="buySearchQuery"
                  type="text"
                  placeholder="Search destinations..."
                  class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
                />
              </div>
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Sort By</label>
                <div class="relative">
                  <select
                    v-model="buySortBy"
                    class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2 appearance-none cursor-pointer pr-10"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="percent-asc">Savings (Low-High)</option>
                    <option value="percent-desc">Savings (High-Low)</option>
                  </select>
                  <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"
                  >
                    <ChevronDownIcon class="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-900/80 rounded-lg overflow-hidden">
            <div>
              <div v-for="item in filteredBuyItems" :key="item.dialCode">
                <!-- Destination Header (Always Visible) -->
                <div
                  @click="toggleDestinationExpand('buy', item.dialCode)"
                  class="px-3 py-3 w-full hover:bg-gray-700/50 transition-colors cursor-pointer flex items-center"
                >
                  <ChevronRightIcon
                    class="h-5 w-5 text-gray-400 transition-transform mr-3"
                    :class="{ 'rotate-90': expandedDestinations.buy.has(item.dialCode) }"
                  />

                  <div class="flex-1">
                    <div class="font-medium text-white">{{ item.destName }}</div>
                  </div>
                </div>

                <!-- Expanded Content for Buy Section -->
                <div
                  v-if="expandedDestinations.buy.has(item.dialCode)"
                  class="bg-black/60 border-t border-gray-800"
                >
                  <div class="px-3 py-4">
                    <!-- Code info only -->
                    <div class="pl-8 mb-4">
                      <span class="text-sm text-gray-300">
                        {{ item.dialCode.split(',').length }} codes
                        <button
                          v-if="
                            item.dialCode.split(',').length > 0 && !isCodeExpanded(item.dialCode)
                          "
                          @click.stop="toggleExpandRow(item.dialCode)"
                          class="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                        >
                          Show
                        </button>
                        <button
                          v-if="
                            item.dialCode.split(',').length > 0 && isCodeExpanded(item.dialCode)
                          "
                          @click.stop="toggleExpandRow(item.dialCode)"
                          class="ml-2 px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                        >
                          Hide
                        </button>
                      </span>
                    </div>

                    <!-- Dial Codes if expanded -->
                    <div v-if="isCodeExpanded(item.dialCode)" class="mb-4 pl-8">
                      <div class="text-xs text-gray-400 mb-1">Dial Codes:</div>
                      <div class="text-sm text-gray-300">{{ item.dialCode }}</div>
                    </div>

                    <!-- Rate Comparison Details - evenly spaced at 1/3 each -->
                    <div class="pl-8 grid grid-cols-3 gap-4">
                      <div class="col-span-1">
                        <div class="text-sm text-gray-400 mb-1">Your Rate</div>
                        <div class="font-medium text-base">{{ item.rateFile1 }}</div>
                      </div>
                      <div class="col-span-1">
                        <div class="text-sm text-gray-400 mb-1">Their Rate</div>
                        <div class="font-medium text-base">{{ item.rateFile2 }}</div>
                      </div>
                      <div class="col-span-1">
                        <div class="text-sm text-gray-400 mb-1">Savings</div>
                        <div class="font-medium text-base text-green-500">
                          {{ formatPercentage(item.percentageDifference) }}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Same Rates Section -->
      <div class="bg-gray-900/50">
        <div
          @click="toggleSection('same')"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-lg">Same Rates</span>
            <div class="flex items-center space-x-3">
              <span class="text-accent"> {{ filteredSameRates.length }} destinations </span>
              <ChevronDownIcon
                :class="{ 'transform rotate-180': expandedSections.same }"
                class="w-5 h-5 transition-transform text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- Same Rates Content -->
        <div v-if="expandedSections.same" class="border-t border-gray-700/50 p-6">
          <!-- Search Filter for Same Rates -->
          <div class="mb-4 bg-accent/5 p-4 rounded-lg border border-gray-700 shadow-inner">
            <div class="flex items-center gap-8">
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Search Destinations</label>
                <input
                  v-model="sameSearchQuery"
                  type="text"
                  placeholder="Search destinations..."
                  class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
                />
              </div>
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Sort By</label>
                <div class="relative">
                  <select
                    v-model="sameSortBy"
                    class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2 appearance-none cursor-pointer pr-10"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                  <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"
                  >
                    <ChevronDownIcon class="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-900/80 rounded-lg overflow-hidden">
            <div>
              <div v-for="item in filteredSameRates" :key="item.dialCode">
                <!-- Destination Header (Always Visible) -->
                <div
                  @click="toggleDestinationExpand('same', item.dialCode)"
                  class="px-3 py-3 w-full hover:bg-gray-700/50 transition-colors cursor-pointer flex items-center"
                >
                  <ChevronRightIcon
                    class="h-5 w-5 text-gray-400 transition-transform mr-3"
                    :class="{ 'rotate-90': expandedDestinations.same.has(item.dialCode) }"
                  />

                  <div class="flex-1">
                    <div class="font-medium text-white">{{ item.destName }}</div>
                  </div>
                </div>

                <!-- Destination Details (Expandable) for Same Rates -->
                <div
                  v-if="expandedDestinations.same.has(item.dialCode)"
                  class="bg-black/60 border-t border-gray-800"
                >
                  <div class="px-3 py-4">
                    <!-- Code info -->
                    <div class="pl-8 mb-4">
                      <span class="text-sm text-gray-300">
                        {{ item.dialCode.split(',').length }} codes
                        <button
                          v-if="
                            item.dialCode.split(',').length > 0 && !isCodeExpanded(item.dialCode)
                          "
                          @click.stop="toggleExpandRow(item.dialCode)"
                          class="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                        >
                          Show
                        </button>
                        <button
                          v-if="
                            item.dialCode.split(',').length > 0 && isCodeExpanded(item.dialCode)
                          "
                          @click.stop="toggleExpandRow(item.dialCode)"
                          class="ml-2 px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                        >
                          Hide
                        </button>
                      </span>

                      <div v-if="isCodeExpanded(item.dialCode)" class="mt-2">
                        <div class="text-xs text-gray-400 mb-1">Dial Codes:</div>
                        <div class="text-sm text-gray-300">{{ item.dialCode }}</div>
                      </div>
                    </div>

                    <!-- Rate Info -->
                    <div class="pl-8">
                      <div class="text-sm text-gray-400 mb-1">Rate</div>
                      <div class="font-medium text-lg">{{ item.rateFile1 }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Unmatched Codes Section -->
      <div class="bg-gray-900/50">
        <div
          @click="toggleSection('unmatched')"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-lg">Unmatched Codes</span>
            <div class="flex items-center space-x-3">
              <span class="text-accent"> {{ filteredUnmatchedCodes.length }} destinations </span>
              <ChevronDownIcon
                :class="{ 'transform rotate-180': expandedSections.unmatched }"
                class="w-5 h-5 transition-transform text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- Unmatched Content -->
        <div v-if="expandedSections.unmatched" class="border-t border-gray-700/50 p-6">
          <!-- Search Filter for Unmatched -->
          <div class="mb-4 bg-accent/5 p-4 rounded-lg border border-gray-700 shadow-inner">
            <div class="flex items-center gap-8">
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Search Destinations</label>
                <input
                  v-model="unmatchedSearchQuery"
                  type="text"
                  placeholder="Search destinations..."
                  class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
                />
              </div>
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Sort By</label>
                <div class="relative">
                  <select
                    v-model="unmatchedSortBy"
                    class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2 appearance-none cursor-pointer pr-10"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="not-in-file1">Not in {{ report?.fileName1 }}</option>
                    <option value="not-in-file2">Not in {{ report?.fileName2 }}</option>
                  </select>
                  <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"
                  >
                    <ChevronDownIcon class="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-900/80 rounded-lg overflow-hidden">
            <div>
              <div v-for="code in filteredUnmatchedCodes" :key="code.dialCode">
                <!-- Destination Header (Always Visible) -->
                <div
                  @click="toggleDestinationExpand('unmatched', code.dialCode)"
                  class="px-3 py-3 w-full hover:bg-gray-700/50 transition-colors cursor-pointer flex items-center"
                >
                  <ChevronRightIcon
                    class="h-5 w-5 text-gray-400 transition-transform mr-3"
                    :class="{ 'rotate-90': expandedDestinations.unmatched.has(code.dialCode) }"
                  />

                  <div class="flex-1">
                    <div class="font-medium text-white">{{ code.destName }}</div>
                  </div>
                </div>

                <!-- Destination Details (Expandable) for Unmatched -->
                <div
                  v-if="expandedDestinations.unmatched.has(code.dialCode)"
                  class="bg-black/60 border-t border-gray-800"
                >
                  <div class="px-3 py-4">
                    <!-- Code info -->
                    <div class="pl-8 mb-4">
                      <span class="text-sm text-gray-300">
                        {{ code.dialCode.split(',').length }} codes
                        <button
                          v-if="
                            code.dialCode.split(',').length > 0 && !isCodeExpanded(code.dialCode)
                          "
                          @click.stop="toggleExpandRow(code.dialCode)"
                          class="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                        >
                          Show
                        </button>
                        <button
                          v-if="
                            code.dialCode.split(',').length > 0 && isCodeExpanded(code.dialCode)
                          "
                          @click.stop="toggleExpandRow(code.dialCode)"
                          class="ml-2 px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                        >
                          Hide
                        </button>
                      </span>

                      <div v-if="isCodeExpanded(code.dialCode)" class="mt-2">
                        <div class="text-xs text-gray-400 mb-1">Dial Codes:</div>
                        <div class="text-sm text-gray-300">{{ code.dialCode }}</div>
                      </div>
                    </div>

                    <!-- File Info -->
                    <div class="pl-8">
                      <div class="text-sm text-gray-400 mb-1">Found In</div>
                      <div class="text-accent">{{ code.file }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Detailed Comparison Section -->
    <div v-if="azStore.getDetailedComparisonTableName" class="bg-gray-900/50">
      <div
        @click="toggleSection('detailed')"
        class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-lg">Detailed Comparison</span>
          <div class="flex items-center space-x-3">
            <span v-if="!isLoadingDetailed" class="text-accent">
              {{ filteredDetailedData.length }} entries
            </span>
            <span v-else class="text-gray-400">Loading...</span>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedSections.detailed }"
              class="w-5 h-5 transition-transform text-gray-400"
            />
          </div>
        </div>
      </div>

      <!-- Detailed Content -->
      <div v-if="expandedSections.detailed" class="border-t border-gray-700/50 p-6">
        <!-- Loading Indicator -->
        <div v-if="isLoadingDetailed" class="text-center py-10">
          <p class="text-gray-400">Loading detailed comparison data...</p>
          <!-- Optional: Add a spinner -->
        </div>

        <!-- Data Table (Show when not loading) -->
        <div v-else>
          <!-- Search/Sort Controls -->
          <div class="mb-4 bg-accent/5 p-4 rounded-lg border border-gray-700 shadow-inner">
            <div class="flex items-center gap-8">
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Search</label>
                <input
                  v-model="detailedSearchQuery"
                  type="text"
                  placeholder="Search dial code or destination..."
                  class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
                />
              </div>
              <div class="w-1/3">
                <label class="block text-sm text-gray-300 mb-1">Sort By</label>
                <div class="relative">
                  <select
                    v-model="detailedSortBy"
                    class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2 appearance-none cursor-pointer pr-10"
                  >
                    <option value="code-asc">Dial Code (Asc)</option>
                    <option value="code-desc">Dial Code (Desc)</option>
                    <option value="dest1-asc">Dest 1 (A-Z)</option>
                    <option value="dest1-desc">Dest 1 (Z-A)</option>
                    <option value="dest2-asc">Dest 2 (A-Z)</option>
                    <option value="dest2-desc">Dest 2 (Z-A)</option>
                    <option value="rate1-asc">Rate 1 (Low-High)</option>
                    <option value="rate1-desc">Rate 1 (High-Low)</option>
                    <option value="rate2-asc">Rate 2 (Low-High)</option>
                    <option value="rate2-desc">Rate 2 (High-Low)</option>
                    <option value="diff-asc">Difference (Low-High)</option>
                    <option value="diff-desc">Difference (High-Low)</option>
                  </select>
                  <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"
                  >
                    <ChevronDownIcon class="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto bg-gray-900/80 rounded-lg">
            <table class="min-w-full divide-y divide-gray-700">
              <thead class="bg-gray-800/50">
                <tr>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Dial Code
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Destination 1
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Rate 1
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Destination 2
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Rate 2
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody class="bg-gray-900 divide-y divide-gray-800">
                <tr v-if="filteredDetailedData.length === 0">
                  <td colspan="6" class="px-4 py-4 text-center text-sm text-gray-400">
                    No matching detailed data found.
                  </td>
                </tr>
                <tr
                  v-for="item in filteredDetailedData"
                  :key="item.dialCode"
                  class="hover:bg-gray-800/50"
                >
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">
                    {{ item.dialCode }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                    {{ item.destName1 }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">
                    {{ formatRate(item.rate1) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                    {{ item.destName2 }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">
                    {{ formatRate(item.rate2) }}
                  </td>
                  <td
                    :class="[
                      'px-4 py-3 whitespace-nowrap text-sm font-mono',
                      item.diff > 0
                        ? 'text-red-500'
                        : item.diff < 0
                        ? 'text-green-500'
                        : 'text-gray-400',
                    ]"
                  >
                    {{ formatRate(item.diff) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center text-xl text-muted-foreground">
    No pricing report data available.
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import type { AzPricingReport, AZDetailedComparisonEntry } from '@/types/domains/az-types';
import { useAzStore } from '@/stores/az-store';
import { ReportTypes } from '@/types';
import { AZService } from '@/services/az.service';

const props = defineProps<{
  report: AzPricingReport | null;
}>();

const azStore = useAzStore();
const azService = new AZService();

// State for detailed comparison data
const detailedComparisonData = ref<AZDetailedComparisonEntry[]>([]);
const isLoadingDetailed = ref(false);

// State for detailed table filtering/sorting
const detailedSearchQuery = ref('');
const detailedSortBy = ref('code-asc'); // Default sort

const expandedRows = ref<Set<string>>(new Set());
const expandedSections = reactive({
  buy: false,
  sell: false,
  same: false,
  unmatched: false,
  detailed: false,
});

// Track expanded destinations for each section
const expandedDestinations = reactive({
  buy: new Set<string>(),
  sell: new Set<string>(),
  same: new Set<string>(),
  unmatched: new Set<string>(),
});

// Separate search query for each section
const buySearchQuery = ref('');
const sellSearchQuery = ref('');
const sameSearchQuery = ref('');
const unmatchedSearchQuery = ref('');

// Sorting options for each section
const buySortBy = ref('percent-desc'); // Default: highest savings first
const sellSortBy = ref('percent-desc'); // Default: highest margin first
const sameSortBy = ref('name-asc'); // Default: alphabetical
const unmatchedSortBy = ref('not-in-file1'); // Default: show codes not in first file

// Check if we have two files for comparison
const hasTwoFiles = computed(() => {
  return azStore.reportsGenerated && props.report !== null;
});

// Function to navigate to the files tab
function goToFilesTab() {
  azStore.setActiveReportType(ReportTypes.FILES);
}

// Computed properties for filtered items
const filteredBuyItems = computed(() => {
  if (!props.report) return [];

  // First filter by search query
  let filtered = props.report.higherRatesForFile1;
  if (buySearchQuery.value) {
    const query = buySearchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.destName.toLowerCase().includes(query) || item.dialCode.toLowerCase().includes(query)
    );
  }

  // Then sort based on selected option
  return [...filtered].sort((a, b) => {
    switch (buySortBy.value) {
      case 'name-asc':
        return a.destName.localeCompare(b.destName);
      case 'name-desc':
        return b.destName.localeCompare(a.destName);
      case 'percent-asc':
        return a.percentageDifference - b.percentageDifference;
      case 'percent-desc':
        return b.percentageDifference - a.percentageDifference;
      default:
        return 0;
    }
  });
});

const filteredSellItems = computed(() => {
  if (!props.report) return [];

  // First filter by search query
  let filtered = props.report.higherRatesForFile2;
  if (sellSearchQuery.value) {
    const query = sellSearchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.destName.toLowerCase().includes(query) || item.dialCode.toLowerCase().includes(query)
    );
  }

  // Then sort based on selected option
  return [...filtered].sort((a, b) => {
    switch (sellSortBy.value) {
      case 'name-asc':
        return a.destName.localeCompare(b.destName);
      case 'name-desc':
        return b.destName.localeCompare(a.destName);
      case 'percent-asc':
        return a.percentageDifference - b.percentageDifference;
      case 'percent-desc':
        return b.percentageDifference - a.percentageDifference;
      default:
        return 0;
    }
  });
});

const filteredSameRates = computed(() => {
  if (!props.report) return [];

  // First filter by search query
  let filtered = props.report.sameRates;
  if (sameSearchQuery.value) {
    const query = sameSearchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.destName.toLowerCase().includes(query) || item.dialCode.toLowerCase().includes(query)
    );
  }

  // Then sort based on selected option
  return [...filtered].sort((a, b) => {
    switch (sameSortBy.value) {
      case 'name-asc':
        return a.destName.localeCompare(b.destName);
      case 'name-desc':
        return b.destName.localeCompare(a.destName);
      case 'rate-asc':
        // Fix for linter error - ensure we're working with numbers
        const rateA = typeof a.rateFile1 === 'string' ? parseFloat(a.rateFile1) : a.rateFile1;
        const rateB = typeof b.rateFile1 === 'string' ? parseFloat(b.rateFile1) : b.rateFile1;
        return rateA - rateB;
      case 'rate-desc':
        // Fix for linter error - ensure we're working with numbers
        const rateC = typeof a.rateFile1 === 'string' ? parseFloat(a.rateFile1) : a.rateFile1;
        const rateD = typeof b.rateFile1 === 'string' ? parseFloat(b.rateFile1) : b.rateFile1;
        return rateD - rateC;
      default:
        return 0;
    }
  });
});

const filteredUnmatchedCodes = computed(() => {
  if (!props.report) return [];

  // First filter by search query
  let filtered = props.report.nonMatchingCodes;
  if (unmatchedSearchQuery.value) {
    const query = unmatchedSearchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (code) =>
        code.destName.toLowerCase().includes(query) || code.dialCode.toLowerCase().includes(query)
    );
  }

  // Then sort based on selected option
  return [...filtered].sort((a, b) => {
    switch (unmatchedSortBy.value) {
      case 'name-asc':
        return a.destName.localeCompare(b.destName);
      case 'name-desc':
        return b.destName.localeCompare(a.destName);
      case 'not-in-file1':
        // Show codes that are NOT in file1 (so they're in file2) first
        return a.file === props.report?.fileName2 ? -1 : 1;
      case 'not-in-file2':
        // Show codes that are NOT in file2 (so they're in file1) first
        return a.file === props.report?.fileName1 ? -1 : 1;
      default:
        return 0;
    }
  });
});

// Computed property for filtered DETAILED data
const filteredDetailedData = computed(() => {
  let filtered = detailedComparisonData.value;

  // Filter by search query
  if (detailedSearchQuery.value) {
    const query = detailedSearchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.dialCode.toLowerCase().includes(query) ||
        item.destName1.toLowerCase().includes(query) ||
        item.destName2.toLowerCase().includes(query)
    );
  }

  // Sort based on selected option
  return [...filtered].sort((a, b) => {
    switch (detailedSortBy.value) {
      case 'code-asc':
        return a.dialCode.localeCompare(b.dialCode);
      case 'code-desc':
        return b.dialCode.localeCompare(a.dialCode);
      case 'dest1-asc':
        return a.destName1.localeCompare(b.destName1);
      case 'dest1-desc':
        return b.destName1.localeCompare(a.destName1);
      case 'dest2-asc':
        return a.destName2.localeCompare(b.destName2);
      case 'dest2-desc':
        return b.destName2.localeCompare(a.destName2);
      case 'rate1-asc':
        return a.rate1 - b.rate1;
      case 'rate1-desc':
        return b.rate1 - a.rate1;
      case 'rate2-asc':
        return a.rate2 - b.rate2;
      case 'rate2-desc':
        return b.rate2 - a.rate2;
      case 'diff-asc':
        return a.diff - b.diff;
      case 'diff-desc':
        return b.diff - a.diff;
      default:
        return 0;
    }
  });
});

// Function to fetch detailed data
async function fetchDetailedData(tableName: string | null) {
  if (!tableName) {
    detailedComparisonData.value = [];
    return;
  }
  isLoadingDetailed.value = true;
  try {
    detailedComparisonData.value = await azService.getDetailedComparisonData(tableName);
  } catch (error) {
    console.error('Error fetching detailed comparison data:', error);
    detailedComparisonData.value = []; // Clear data on error
    // Optionally show an error message to the user
  } finally {
    isLoadingDetailed.value = false;
  }
}

// Watch for changes in the detailed comparison table name from the store
watch(
  () => azStore.getDetailedComparisonTableName,
  (newTableName) => {
    fetchDetailedData(newTableName);
  },
  { immediate: true }
); // immediate: true to run on component mount

function toggleSection(section: keyof typeof expandedSections) {
  if (expandedSections[section]) {
    expandedSections[section] = false;
  } else {
    Object.keys(expandedSections).forEach((key) => {
      expandedSections[key as keyof typeof expandedSections] = false;
    });
    expandedSections[section] = true;
  }
}

function toggleDestinationExpand(section: keyof typeof expandedDestinations, dialCode: string) {
  if (expandedDestinations[section].has(dialCode)) {
    expandedDestinations[section].delete(dialCode);
  } else {
    expandedDestinations[section].add(dialCode);
  }
}

function toggleExpandRow(dialCode: string) {
  if (expandedRows.value.has(dialCode)) {
    expandedRows.value.delete(dialCode);
  } else {
    expandedRows.value.add(dialCode);
  }
}

function isRowExpanded(dialCode: string): boolean {
  return expandedRows.value.has(dialCode);
}

function isCodeExpanded(dialCode: string): boolean {
  return expandedRows.value.has(dialCode);
}

function formatPercentage(value: number): string {
  return Math.abs(value).toFixed(2);
}

function formatRate(rate: number | string): string {
  // Ensure rate is a number before formatting
  const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
  // Handle potential NaN values
  if (isNaN(numRate)) {
    return 'N/A';
  }
  // Use toFixed(6) for consistency, adjust precision as needed
  return numRate.toFixed(6);
}
</script>
