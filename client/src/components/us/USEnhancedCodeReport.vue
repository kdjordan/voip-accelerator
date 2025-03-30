<template>
  <div class="space-y-6 bg-gray-800 p-6 rounded-lg">
    <div v-if="report" class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl text-white font-semibold">Enhanced Code Report</h2>

        <!-- Search Input -->
        <div class="relative w-96">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by Country, State, or NPA..."
            class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2 pr-8"
          />
          <div v-if="isSearching" class="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div class="spinner-accent"></div>
          </div>
        </div>
      </div>

      <!-- Country List -->
      <div
        v-for="country in filteredCountries"
        :key="country.countryCode"
        class="bg-gray-900/50 rounded-lg overflow-hidden"
      >
        <!-- Country Header -->
        <div
          @click="toggleCountryExpanded(country.countryCode)"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-lg">
              {{ country.countryName }}
            </span>
            <div class="flex items-center space-x-3">
              <span class="text-accent"> {{ country.npaCoverage.toFixed(2) }}% Coverage </span>
              <ChevronDownIcon
                :class="{ 'transform rotate-180': expandedCountries.has(country.countryCode) }"
                class="w-5 h-5 transition-transform text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- Country Content -->
        <div
          v-if="expandedCountries.has(country.countryCode)"
          class="border-t border-gray-700/50 p-6"
        >
          <!-- Country Details -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-gray-800 p-3 rounded-lg">
              <div class="text-gray-400 mb-1">Total NPAs in Country:</div>
              <div class="text-xl text-white">{{ country.totalNPAs }}</div>
            </div>
            <div class="bg-gray-800 p-3 rounded-lg">
              <div class="text-gray-400 mb-1">Coverage:</div>
              <div class="text-xl text-white">{{ country.npaCoverage.toFixed(2) }}%</div>
            </div>
          </div>

          <!-- States Section (for US and Canada) -->
          <div v-if="country.states && country.states.length > 0" class="mt-6">
            <h3 class="text-md text-gray-300 mb-3">States/Provinces</h3>

            <!-- State List -->
            <div class="bg-gray-900/80 rounded-lg overflow-hidden">
              <div v-for="state in country.states" :key="state.stateCode">
                <!-- Special handling for Canadian provinces -->
                <template v-if="country.countryCode === 'CA'">
                  <!-- Province Header -->
                  <div
                    @click="toggleStateExpanded(country.countryCode, state.stateCode)"
                    class="px-3 py-3 w-full hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium text-lg">
                        {{ getStateDisplayName(state.stateCode, country.countryCode) }}
                      </span>
                      <div class="flex items-center space-x-3">
                        <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {{ state.npas.length }} NPAs
                        </span>
                        <ChevronDownIcon
                          :class="{
                            'transform rotate-180': isStateExpanded(
                              country.countryCode,
                              state.stateCode
                            ),
                          }"
                          class="w-5 h-5 transition-transform"
                        />
                      </div>
                    </div>

                    <!-- Province Details -->
                    <div
                      v-if="isStateExpanded(country.countryCode, state.stateCode)"
                      class="mt-3 pl-4"
                    >
                      <div class="flex flex-wrap gap-2 mb-4">
                        <div
                          v-for="npa in state.npas"
                          :key="npa"
                          class="text-gray-300 bg-gray-800/50 px-3 py-1 rounded"
                        >
                          {{ npa }}
                        </div>
                      </div>

                      <!-- Rate Statistics for Province -->
                      <div class="grid grid-cols-3 gap-4 mt-4">
                        <!-- Interstate -->
                        <div class="bg-gray-900/60 p-3 rounded-lg">
                          <div class="text-sm text-gray-400 mb-1">Interstate</div>
                          <div class="text-lg text-white">
                            ${{ state.rateStats.interstate.average.toFixed(4) }}
                          </div>
                          <div class="text-xs text-gray-400 mt-1">
                            {{ state.rateStats.interstate.count }} codes ({{
                              state.rateStats.interstate.coverage.toFixed(1)
                            }}%)
                          </div>
                        </div>

                        <!-- Intrastate -->
                        <div class="bg-gray-900/60 p-3 rounded-lg">
                          <div class="text-sm text-gray-400 mb-1">Intrastate</div>
                          <div class="text-lg text-white">
                            ${{ state.rateStats.intrastate.average.toFixed(4) }}
                          </div>
                          <div class="text-xs text-gray-400 mt-1">
                            {{ state.rateStats.intrastate.count }} codes ({{
                              state.rateStats.intrastate.coverage.toFixed(1)
                            }}%)
                          </div>
                        </div>

                        <!-- Indeterminate -->
                        <div class="bg-gray-900/60 p-3 rounded-lg">
                          <div class="text-sm text-gray-400 mb-1">Indeterminate</div>
                          <div class="text-lg text-white">
                            ${{ state.rateStats.indeterminate.average.toFixed(4) }}
                          </div>
                          <div class="text-xs text-gray-400 mt-1">
                            {{ state.rateStats.indeterminate.count }} codes ({{
                              state.rateStats.indeterminate.coverage.toFixed(1)
                            }}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Regular US State Display -->
                <template v-else>
                  <!-- State Header -->
                  <div
                    @click="toggleStateExpanded(country.countryCode, state.stateCode)"
                    class="px-3 py-3 w-full hover:bg-gray-700/50 transition-colors cursor-pointer flex items-center"
                  >
                    <ChevronRightIcon
                      class="h-5 w-5 text-gray-400 transition-transform mr-3"
                      :class="{
                        'rotate-90': isStateExpanded(country.countryCode, state.stateCode),
                      }"
                    />

                    <div class="flex-1">
                      <div class="font-medium text-white">
                        {{ getStateDisplayName(state.stateCode, country.countryCode) }}
                      </div>
                    </div>

                    <div class="text-accent text-sm">
                      {{ state.npas.length }} NPAs ({{ state.coverage.toFixed(2) }}% coverage)
                    </div>
                  </div>

                  <!-- State Details -->
                  <div
                    v-if="isStateExpanded(country.countryCode, state.stateCode)"
                    class="bg-black/60 border-t border-gray-800"
                  >
                    <div class="px-3 py-4">
                      <!-- NPA List -->
                      <div class="pl-8 mb-4">
                        <div class="text-sm text-gray-400 mb-1">NPAs:</div>
                        <div class="text-sm text-gray-300">
                          {{ state.npas.join(', ') }}
                        </div>
                      </div>

                      <!-- Rate Statistics -->
                      <div class="pl-8 grid grid-cols-3 gap-4 mt-4">
                        <!-- Interstate -->
                        <div class="bg-gray-900/60 p-3 rounded-lg">
                          <div class="text-sm text-gray-400 mb-1">Interstate</div>
                          <div class="text-lg text-white">
                            ${{ state.rateStats.interstate.average.toFixed(4) }}
                          </div>
                          <div class="text-xs text-gray-400 mt-1">
                            {{ state.rateStats.interstate.count }} codes ({{
                              state.rateStats.interstate.coverage.toFixed(1)
                            }}%)
                          </div>
                        </div>

                        <!-- Intrastate -->
                        <div class="bg-gray-900/60 p-3 rounded-lg">
                          <div class="text-sm text-gray-400 mb-1">Intrastate</div>
                          <div class="text-lg text-white">
                            ${{ state.rateStats.intrastate.average.toFixed(4) }}
                          </div>
                          <div class="text-xs text-gray-400 mt-1">
                            {{ state.rateStats.intrastate.count }} codes ({{
                              state.rateStats.intrastate.coverage.toFixed(1)
                            }}%)
                          </div>
                        </div>

                        <!-- Indeterminate -->
                        <div class="bg-gray-900/60 p-3 rounded-lg">
                          <div class="text-sm text-gray-400 mb-1">Indeterminate</div>
                          <div class="text-lg text-white">
                            ${{ state.rateStats.indeterminate.average.toFixed(4) }}
                          </div>
                          <div class="text-xs text-gray-400 mt-1">
                            {{ state.rateStats.indeterminate.count }} codes ({{
                              state.rateStats.indeterminate.coverage.toFixed(1)
                            }}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-xl text-muted-foreground">
      No enhanced code report data available.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import type { USEnhancedCodeReport } from '@/types/domains/us-types';
import { useUsStore } from '@/stores/us-store';
import { STATE_CODES, getStateName } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';

const props = defineProps<{
  report: USEnhancedCodeReport | null;
}>();

// Set up state
const expandedCountries = reactive(new Set<string>());
const expandedStates = reactive(new Map<string, Set<string>>());
const searchQuery = ref('');
const debouncedSearchQuery = ref('');
const isSearching = ref(false);
let searchDebounceTimeout: NodeJS.Timeout | null = null;

// Watch for search query changes with debounce
watch(searchQuery, (newValue) => {
  // Cancel any existing debounce timer
  if (searchDebounceTimeout) {
    clearTimeout(searchDebounceTimeout);
  }

  isSearching.value = true;

  // Set a new timeout
  searchDebounceTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue;
    isSearching.value = false;

    // After search is complete, expand relevant sections
    expandMatchingSections();
  }, 300); // 300ms debounce
});

// Filtered countries based on search
const filteredCountries = computed(() => {
  if (!props.report?.file1.countries) return [];

  const query = debouncedSearchQuery.value.toLowerCase();
  if (!query) return props.report.file1.countries;

  const results = [];

  // Process each country
  for (const country of props.report.file1.countries) {
    const filteredCountry = { ...country };
    let includeCountry = country.countryName.toLowerCase().includes(query);

    // Process states within the country
    if (country.states) {
      // Filter states based on country code
      const filteredStates = country.states.filter((state) => {
        // For US country, only include actual US states
        if (country.countryCode === 'US') {
          // Check if this is a valid US state code (reject Canadian provinces)
          if (!(state.stateCode in STATE_CODES)) return false;

          const displayName =
            STATE_CODES[state.stateCode]?.name.toLowerCase() || state.stateCode.toLowerCase();

          // Check if state name matches query
          if (displayName.includes(query)) return true;

          // Check if any NPA matches
          return state.npas.some((npa) => npa.includes(query));
        }
        // For Canada, only include Canadian provinces
        else if (country.countryCode === 'CA') {
          // Check if this is a valid Canadian province code
          if (!(state.stateCode in PROVINCE_CODES)) return false;

          // Skip 'CA' in Canadian provinces list (it's California in US)
          if (state.stateCode === 'CA') return false;

          const displayName =
            PROVINCE_CODES[state.stateCode]?.name.toLowerCase() || state.stateCode.toLowerCase();

          // Check if province name matches query
          if (displayName.includes(query)) return true;

          // Check if any NPA matches
          return state.npas.some((npa) => npa.includes(query));
        }
        // For other countries
        else {
          const displayName = state.stateCode.toLowerCase();

          // Check if state/region name matches
          if (displayName.includes(query)) return true;

          // Check if any NPA matches
          return state.npas.some((npa) => npa.includes(query));
        }
      });

      if (filteredStates.length > 0) {
        filteredCountry.states = filteredStates;
        includeCountry = true;
      } else {
        filteredCountry.states = [];
      }
    }

    // Add country to results if it should be included
    if (includeCountry) {
      results.push(filteredCountry);
    }
  }

  return results;
});

// Simplify the expand matching sections function
function expandMatchingSections() {
  const query = debouncedSearchQuery.value.toLowerCase();
  if (!query || !props.report?.file1.countries) return;

  // Normal expansion for searches
  for (const country of props.report.file1.countries) {
    if (!country.states) continue;

    let shouldExpandCountry = false;

    for (const state of country.states) {
      // Skip invalid states/provinces based on country
      if (country.countryCode === 'US' && !(state.stateCode in STATE_CODES)) {
        continue;
      }

      if (country.countryCode === 'CA' && !(state.stateCode in PROVINCE_CODES)) {
        continue;
      }

      // Skip California in Canadian provinces
      if (country.countryCode === 'CA' && state.stateCode === 'CA') {
        continue;
      }

      // Get proper display name
      let stateName = '';
      if (country.countryCode === 'US') {
        stateName =
          STATE_CODES[state.stateCode]?.name.toLowerCase() || state.stateCode.toLowerCase();
      } else if (country.countryCode === 'CA') {
        stateName =
          PROVINCE_CODES[state.stateCode]?.name.toLowerCase() || state.stateCode.toLowerCase();
      } else {
        stateName = state.stateCode.toLowerCase();
      }

      const hasMatchingNPA = state.npas.some((npa) => npa.includes(query));

      if (stateName.includes(query) || hasMatchingNPA) {
        shouldExpandCountry = true;

        if (!expandedStates.has(country.countryCode)) {
          expandedStates.set(country.countryCode, new Set<string>());
        }
        expandedStates.get(country.countryCode).add(state.stateCode);
      }
    }

    if (shouldExpandCountry || country.countryName.toLowerCase().includes(query)) {
      expandedCountries.add(country.countryCode);
    }
  }
}

// Toggle functions
function toggleCountryExpanded(countryCode: string) {
  if (expandedCountries.has(countryCode)) {
    expandedCountries.delete(countryCode);
  } else {
    expandedCountries.add(countryCode);
  }
}

function toggleStateExpanded(countryCode: string, stateCode: string) {
  const key = `${countryCode}:${stateCode}`;

  if (!expandedStates.has(countryCode)) {
    expandedStates.set(countryCode, new Set<string>());
  }

  const stateSet = expandedStates.get(countryCode)!;

  if (stateSet.has(stateCode)) {
    stateSet.delete(stateCode);
  } else {
    stateSet.add(stateCode);
  }
}

function isStateExpanded(countryCode: string, stateCode: string): boolean {
  const stateSet = expandedStates.get(countryCode);
  return !!stateSet && stateSet.has(stateCode);
}

// Update the helper function to properly handle states and provinces
function getStateDisplayName(stateCode: string, countryCode: string): string {
  if (countryCode === 'US') {
    // Verify this is a valid US state code
    if (!(stateCode in STATE_CODES)) {
      return `Unknown state: ${stateCode}`;
    }
    return STATE_CODES[stateCode]?.name ?? stateCode;
  }

  if (countryCode === 'CA') {
    // Verify this is a valid Canadian province code
    if (!(stateCode in PROVINCE_CODES)) {
      return `Unknown province: ${stateCode}`;
    }
    return PROVINCE_CODES[stateCode]?.name ?? stateCode;
  }

  // For other countries, just use the code
  return stateCode;
}
</script>

<style scoped>
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
</style>
