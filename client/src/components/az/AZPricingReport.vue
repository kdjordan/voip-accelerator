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
            should BUY
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded mx-1">
              {{ filteredBuyItems.length }} destinations
            </span>
            from Them
            <span class="text-gray-400 text-sm ml-1"
              >(<span class="uppercase">{{ report.fileName2 }}</span
              >)</span
            >
          </span>
          <div>
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
        <div class="mb-4 bg-accent/5 p-4 rounded-lg border border-accent/10 shadow-inner">
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
              <select
                v-model="buySortBy"
                class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2 appearance-none cursor-pointer"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="percent-asc">Savings (Low-High)</option>
                <option value="percent-desc">Savings (High-Low)</option>
              </select>
            </div>
          </div>
        </div>

        <div
          v-for="item in filteredBuyItems"
          :key="item.dialCode"
          class="bg-gray-900/80 rounded-lg overflow-hidden"
        >
          <!-- Destination Header (Always Visible) -->
          <div
            @click="toggleDestinationExpand('buy', item.dialCode)"
            class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer flex justify-between items-center"
          >
            <div class="space-y-1">
              <div class="font-medium">{{ item.destName }}</div>
              <div class="text-sm text-gray-400">
                <!-- Buy Section codes button -->
                <span v-if="!isCodeExpanded(item.dialCode)">
                  <button
                    v-if="item.dialCode.split(',').length > 0"
                    @click.stop="toggleExpandRow(item.dialCode)"
                    class="px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                  >
                    Show All Codes ({{ item.dialCode.split(',').length }})
                  </button>
                </span>
                <span v-else>
                  <button
                    v-if="item.dialCode.split(',').length > 0"
                    @click.stop="toggleExpandRow(item.dialCode)"
                    class="px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                  >
                    Hide Codes
                  </button>
                  <div class="mt-1 text-xs">{{ item.dialCode }}</div>
                </span>
              </div>
            </div>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedDestinations.buy.has(item.dialCode) }"
              class="w-4 h-4 transition-transform"
            />
          </div>

          <!-- Destination Details (Expandable) -->
          <div
            v-if="expandedDestinations.buy.has(item.dialCode)"
            class="p-4 pt-0 border-t border-gray-700/30"
          >
            <!-- Rate Comparison Table -->
            <div class="bg-gray-900/50 rounded-lg p-3">
              <div class="grid grid-cols-3 gap-6">
                <div>
                  <div class="text-sm text-gray-400 mb-1">Your Rate</div>
                  <div class="font-medium text-lg">{{ item.rateFile1 }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-400 mb-1">Their Rate</div>
                  <div class="font-medium text-lg">{{ item.rateFile2 }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-400 mb-1">Savings</div>
                  <div class="font-medium text-lg text-green-500">
                    {{ formatPercentage(item.percentageDifference) }}%
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
            should SELL
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded mx-1">
              {{ filteredSellItems.length }} destinations
            </span>
            to Them
            <span class="text-gray-400 text-sm ml-1"
              >(<span class="uppercase">{{ report.fileName2 }}</span
              >)</span
            >
          </span>
          <div>
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
        <div class="mb-4 bg-accent/5 p-4 rounded-lg border border-accent/10 shadow-inner">
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
              <select
                v-model="sellSortBy"
                class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2 appearance-none cursor-pointer"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="percent-asc">Margin (Low-High)</option>
                <option value="percent-desc">Margin (High-Low)</option>
              </select>
            </div>
          </div>
        </div>

        <div
          v-for="item in filteredSellItems"
          :key="item.dialCode"
          class="bg-gray-900/80 rounded-lg overflow-hidden"
        >
          <!-- Destination Header (Always Visible) -->
          <div
            @click="toggleDestinationExpand('sell', item.dialCode)"
            class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer flex justify-between items-center"
          >
            <div class="space-y-1">
              <div class="font-medium">{{ item.destName }}</div>
              <div class="text-sm text-gray-400">
                <!-- Sell Section codes button -->
                <span v-if="!isCodeExpanded(item.dialCode)">
                  <button
                    v-if="item.dialCode.split(',').length > 0"
                    @click.stop="toggleExpandRow(item.dialCode)"
                    class="px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                  >
                    Show All Codes ({{ item.dialCode.split(',').length }})
                  </button>
                </span>
                <span v-else>
                  <button
                    v-if="item.dialCode.split(',').length > 0"
                    @click.stop="toggleExpandRow(item.dialCode)"
                    class="px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                  >
                    Hide Codes
                  </button>
                  <div class="mt-1 text-xs">{{ item.dialCode }}</div>
                </span>
              </div>
            </div>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedDestinations.sell.has(item.dialCode) }"
              class="w-4 h-4 transition-transform"
            />
          </div>

          <!-- Destination Details (Expandable) -->
          <div
            v-if="expandedDestinations.sell.has(item.dialCode)"
            class="p-4 pt-0 border-t border-gray-700/30"
          >
            <!-- Rate Comparison Table -->
            <div class="bg-gray-900/50 rounded-lg p-3">
              <div class="grid grid-cols-3 gap-6">
                <div>
                  <div class="text-sm text-gray-400 mb-1">Your Rate</div>
                  <div class="font-medium text-lg">{{ item.rateFile1 }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-400 mb-1">Their Rate</div>
                  <div class="font-medium text-lg">{{ item.rateFile2 }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-400 mb-1">Profit Margin</div>
                  <div class="font-medium text-lg text-red-500">{{ formatPercentage(item.percentageDifference) }}%</div>
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
        <!-- Search Filter -->
        <div class="mb-4 bg-gray-900/50 p-3 rounded-lg">
          <div class="flex items-center gap-4">
            <div class="w-1/3">
              <label class="block text-sm text-gray-400 mb-1">Search Destinations</label>
              <input
                v-model="sameSearchQuery"
                type="text"
                placeholder="Search destinations..."
                class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
              />
            </div>
            <div class="w-2/3">
              <label class="block text-sm text-gray-400 mb-1">Sort By</label>
              <div class="flex gap-3">
                <button
                  @click="sameSortBy = 'name-asc'"
                  class="px-3 py-1.5 rounded text-sm transition-colors"
                  :class="
                    sameSortBy === 'name-asc'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                  "
                >
                  Name (A-Z)
                </button>
                <button
                  @click="sameSortBy = 'name-desc'"
                  class="px-3 py-1.5 rounded text-sm transition-colors"
                  :class="
                    sameSortBy === 'name-desc'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                  "
                >
                  Name (Z-A)
                </button>
                <button
                  @click="sameSortBy = 'rate-asc'"
                  class="px-3 py-1.5 rounded text-sm transition-colors"
                  :class="
                    sameSortBy === 'rate-asc'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                  "
                >
                  Rate (Low-High)
                </button>
                <button
                  @click="sameSortBy = 'rate-desc'"
                  class="px-3 py-1.5 rounded text-sm transition-colors"
                  :class="
                    sameSortBy === 'rate-desc'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                  "
                >
                  Rate (High-Low)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-for="item in filteredSameRates"
          :key="item.dialCode"
          class="bg-gray-900/80 rounded-lg overflow-hidden"
        >
          <!-- Destination Header (Always Visible) -->
          <div
            @click="toggleDestinationExpand('same', item.dialCode)"
            class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer flex justify-between items-center"
          >
            <div class="space-y-1">
              <div class="font-medium">{{ item.destName }}</div>
              <div class="text-sm text-gray-400">
                <!-- Same Rates Section codes button -->
                <span v-if="!isCodeExpanded(item.dialCode)">
                  <button
                    v-if="item.dialCode.split(',').length > 0"
                    @click.stop="toggleExpandRow(item.dialCode)"
                    class="px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                  >
                    Show All Codes ({{ item.dialCode.split(',').length }})
                  </button>
                </span>
                <span v-else>
                  <button
                    v-if="item.dialCode.split(',').length > 0"
                    @click.stop="toggleExpandRow(item.dialCode)"
                    class="px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                  >
                    Hide Codes
                  </button>
                  <div class="mt-1 text-xs">{{ item.dialCode }}</div>
                </span>
              </div>
            </div>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedDestinations.same.has(item.dialCode) }"
              class="w-4 h-4 transition-transform"
            />
          </div>

          <!-- Destination Details (Expandable) -->
          <div
            v-if="expandedDestinations.same.has(item.dialCode)"
            class="p-4 pt-0 border-t border-gray-700/30"
          >
            <!-- Rate Info -->
            <div class="bg-gray-900/50 rounded-lg p-3">
              <div class="grid grid-cols-1 gap-6">
                <div>
                  <div class="text-sm text-gray-400 mb-1">Rate</div>
                  <div class="font-medium text-lg">{{ item.rateFile1 }}</div>
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
        <!-- Search Filter -->
        <div class="mb-4 bg-gray-900/50 p-3 rounded-lg">
          <div class="flex items-center gap-4">
            <div class="w-1/3">
              <label class="block text-sm text-gray-400 mb-1">Search Destinations</label>
              <input
                v-model="unmatchedSearchQuery"
                type="text"
                placeholder="Search destinations..."
                class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
              />
            </div>
            <div class="w-2/3">
              <label class="block text-sm text-gray-400 mb-1">Sort By</label>
              <div class="flex gap-3">
                <button
                  @click="unmatchedSortBy = 'name-asc'"
                  class="px-3 py-1.5 rounded text-sm transition-colors"
                  :class="
                    unmatchedSortBy === 'name-asc'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                  "
                >
                  Name (A-Z)
                </button>
                <button
                  @click="unmatchedSortBy = 'name-desc'"
                  class="px-3 py-1.5 rounded text-sm transition-colors"
                  :class="
                    unmatchedSortBy === 'name-desc'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                  "
                >
                  Name (Z-A)
                </button>
                <button
                  @click="unmatchedSortBy = 'file'"
                  class="px-3 py-1.5 rounded text-sm transition-colors"
                  :class="
                    unmatchedSortBy === 'file'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                  "
                >
                  By File
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-for="code in filteredUnmatchedCodes"
          :key="code.dialCode"
          class="bg-gray-900/80 rounded-lg overflow-hidden"
        >
          <!-- Destination Header (Always Visible) -->
          <div
            @click="toggleDestinationExpand('unmatched', code.dialCode)"
            class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer flex justify-between items-center"
          >
            <div class="space-y-1">
              <div class="font-medium">{{ code.destName }}</div>
              <div class="text-sm text-gray-400">
                <!-- Unmatched Section codes button -->
                <span v-if="!isCodeExpanded(code.dialCode)">
                  <button
                    v-if="code.dialCode.split(',').length > 0"
                    @click.stop="toggleExpandRow(code.dialCode)"
                    class="px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-xs"
                  >
                    Show All Codes ({{ code.dialCode.split(',').length }})
                  </button>
                </span>
                <span v-else>
                  <button
                    v-if="code.dialCode.split(',').length > 0"
                    @click.stop="toggleExpandRow(code.dialCode)"
                    class="px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded text-red-400 transition-colors text-xs"
                  >
                    Hide Codes
                  </button>
                  <div class="mt-1 text-xs">{{ code.dialCode }}</div>
                </span>
              </div>
            </div>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedDestinations.unmatched.has(code.dialCode) }"
              class="w-4 h-4 transition-transform"
            />
          </div>

          <!-- Destination Details (Expandable) -->
          <div
            v-if="expandedDestinations.unmatched.has(code.dialCode)"
            class="p-4 pt-0 border-t border-gray-700/30"
          >
            <!-- File Info -->
            <div class="bg-gray-900/50 rounded-lg p-3">
              <div class="text-sm text-gray-400">
                Found in: <span class="text-accent">{{ code.file }}</span>
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
  import { ref, reactive, computed } from 'vue';
  import { ChevronDownIcon } from '@heroicons/vue/24/outline';
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
  const unmatchedSortBy = ref('name-asc'); // Default: alphabetical

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
        case 'file':
          return a.file.localeCompare(b.file);
        default:
          return 0;
      }
    });
  });

  function toggleSection(section: keyof typeof expandedSections) {
    expandedSections[section] = !expandedSections[section];
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
</script>
