<template>
  <div
    v-if="report"
    class="space-y-6 bg-gray-800 p-6"
  >
    <!-- Buy Section -->
    <div class="bg-gray-900/30 rounded-lg overflow-hidden">
      <div
        @click="toggleSection('buy')"
        class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-lg">
            You
            <span class="text-gray-400 text-sm ml-1"
              >(<span class="uppercase">{{ report.fileName1 }}</span
              >)</span
            >
            should BUY from Them
            <span class="text-gray-400 text-sm ml-1"
              >(<span class="uppercase">{{ report.fileName2 }}</span
              >)</span
            >
          </span>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
              {{ filteredBuyItems.length }} destinations
            </span>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedSections.buy }"
              class="w-5 h-5 transition-transform"
            />
          </div>
        </div>
      </div>

      <!-- Buy Content -->
      <div
        v-if="expandedSections.buy"
        class="p-4 space-y-4"
      >
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
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <ChevronDownIcon class="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-900/80 rounded-lg overflow-hidden">
          <div>
            <div
              v-for="item in filteredBuyItems"
              :key="item.dialCode"
            >
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
                        v-if="item.dialCode.split(',').length > 0 && !isCodeExpanded(item.dialCode)"
                        @click.stop="toggleExpandRow(item.dialCode)"
                        class="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                      >
                        Show
                      </button>
                      <button
                        v-if="item.dialCode.split(',').length > 0 && isCodeExpanded(item.dialCode)"
                        @click.stop="toggleExpandRow(item.dialCode)"
                        class="ml-2 px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                      >
                        Hide
                      </button>
                    </span>
                  </div>

                  <!-- Dial Codes if expanded -->
                  <div
                    v-if="isCodeExpanded(item.dialCode)"
                    class="mb-4 pl-8"
                  >
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

    <!-- Sell Section -->
    <div class="bg-gray-900/30 rounded-lg overflow-hidden">
      <div
        @click="toggleSection('sell')"
        class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-lg">
            You
            <span class="text-gray-400 text-sm ml-1"
              >(<span class="uppercase">{{ report.fileName1 }}</span
              >)</span
            >
            should SELL to Them
            <span class="text-gray-400 text-sm ml-1"
              >(<span class="uppercase">{{ report.fileName2 }}</span
              >)</span
            >
          </span>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
              {{ filteredSellItems.length }} destinations
            </span>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedSections.sell }"
              class="w-5 h-5 transition-transform"
            />
          </div>
        </div>
      </div>

      <!-- Sell Content -->
      <div
        v-if="expandedSections.sell"
        class="p-4 space-y-4"
      >
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
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <ChevronDownIcon class="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-900/80 rounded-lg overflow-hidden">
          <div>
            <div
              v-for="item in filteredSellItems"
              :key="item.dialCode"
            >
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
                        v-if="item.dialCode.split(',').length > 0 && !isCodeExpanded(item.dialCode)"
                        @click.stop="toggleExpandRow(item.dialCode)"
                        class="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                      >
                        Show
                      </button>
                      <button
                        v-if="item.dialCode.split(',').length > 0 && isCodeExpanded(item.dialCode)"
                        @click.stop="toggleExpandRow(item.dialCode)"
                        class="ml-2 px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                      >
                        Hide
                      </button>
                    </span>
                  </div>

                  <!-- Dial Codes if expanded -->
                  <div
                    v-if="isCodeExpanded(item.dialCode)"
                    class="mb-4 pl-8"
                  >
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

    <!-- Same Rates Section -->
    <div class="bg-gray-900/30 rounded-lg overflow-hidden">
      <div
        @click="toggleSection('same')"
        class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-lg">Same Rates</span>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
              {{ filteredSameRates.length }} destinations
            </span>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedSections.same }"
              class="w-5 h-5 transition-transform"
            />
          </div>
        </div>
      </div>

      <!-- Same Rates Content -->
      <div
        v-if="expandedSections.same"
        class="p-4 space-y-4"
      >
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
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <ChevronDownIcon class="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-900/80 rounded-lg overflow-hidden">
          <div>
            <div
              v-for="item in filteredSameRates"
              :key="item.dialCode"
            >
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
                        v-if="item.dialCode.split(',').length > 0 && !isCodeExpanded(item.dialCode)"
                        @click.stop="toggleExpandRow(item.dialCode)"
                        class="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                      >
                        Show
                      </button>
                      <button
                        v-if="item.dialCode.split(',').length > 0 && isCodeExpanded(item.dialCode)"
                        @click.stop="toggleExpandRow(item.dialCode)"
                        class="ml-2 px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                      >
                        Hide
                      </button>
                    </span>

                    <div
                      v-if="isCodeExpanded(item.dialCode)"
                      class="mt-2"
                    >
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
    <div class="bg-gray-900/30 rounded-lg overflow-hidden">
      <div
        @click="toggleSection('unmatched')"
        class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-lg">Unmatched Codes</span>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
              {{ filteredUnmatchedCodes.length }} destinations
            </span>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedSections.unmatched }"
              class="w-5 h-5 transition-transform"
            />
          </div>
        </div>
      </div>

      <!-- Unmatched Content -->
      <div
        v-if="expandedSections.unmatched"
        class="p-4 space-y-4"
      >
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
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <ChevronDownIcon class="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-900/80 rounded-lg overflow-hidden">
          <div>
            <div
              v-for="code in filteredUnmatchedCodes"
              :key="code.dialCode"
            >
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
                        v-if="code.dialCode.split(',').length > 0 && !isCodeExpanded(code.dialCode)"
                        @click.stop="toggleExpandRow(code.dialCode)"
                        class="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                      >
                        Show
                      </button>
                      <button
                        v-if="code.dialCode.split(',').length > 0 && isCodeExpanded(code.dialCode)"
                        @click.stop="toggleExpandRow(code.dialCode)"
                        class="ml-2 px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                      >
                        Hide
                      </button>
                    </span>

                    <div
                      v-if="isCodeExpanded(code.dialCode)"
                      class="mt-2"
                    >
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

  <div
    v-else
    class="text-center text-xl text-muted-foreground"
  >
    No pricing report data available.
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, nextTick } from 'vue';
  import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
  import type { AzPricingReport } from '@/types/domains/az-types';

  const props = defineProps<{
    report: AzPricingReport | null;
  }>();

  const expandedRows = ref<Set<string>>(new Set());
  const expandedSections = reactive({
    buy: false,
    sell: false,
    same: false,
    unmatched: false,
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

  // Computed properties for filtered items
  const filteredBuyItems = computed(() => {
    if (!props.report) return [];

    // First filter by search query
    let filtered = props.report.higherRatesForFile1;
    if (buySearchQuery.value) {
      const query = buySearchQuery.value.toLowerCase();
      filtered = filtered.filter(
        item => item.destName.toLowerCase().includes(query) || item.dialCode.toLowerCase().includes(query)
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
        item => item.destName.toLowerCase().includes(query) || item.dialCode.toLowerCase().includes(query)
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
        item => item.destName.toLowerCase().includes(query) || item.dialCode.toLowerCase().includes(query)
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
        code => code.destName.toLowerCase().includes(query) || code.dialCode.toLowerCase().includes(query)
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

  function toggleSection(section: keyof typeof expandedSections) {
    if (expandedSections[section]) {
      expandedSections[section] = false;
    } else {
      Object.keys(expandedSections).forEach(key => {
        expandedSections[key as keyof typeof expandedSections] = false;
      });
      expandedSections[section] = true;

      // Scroll to top of page after expansion
      nextTick(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
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
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return numRate.toFixed(6);
  }
</script>
