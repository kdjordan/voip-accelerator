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

      <!-- Main Countries (US/Canada) -->
      <div
        v-for="country in mainCountries"
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

      <!-- Other Countries Section -->
      <div class="bg-gray-900/50 rounded-lg overflow-hidden">
        <!-- Countries Header -->
        <div
          @click="toggleOtherCountriesExpanded"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-lg"> Other Countries ({{ otherCountries.length }}) </span>
            <div class="flex items-center space-x-3">
              <span class="text-accent">
                {{ averageOtherCountriesCoverage.toFixed(2) }}% Avg. Coverage
              </span>
              <ChevronDownIcon
                :class="{ 'transform rotate-180': showOtherCountries }"
                class="w-5 h-5 transition-transform text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- Other Countries Grid View -->
        <div v-if="showOtherCountries" class="border-t border-gray-700/50 p-6">
          <!-- Filter for other countries -->
          <div class="mb-4">
            <input
              v-model="otherCountriesFilter"
              type="text"
              placeholder="Filter countries..."
              class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
            />
          </div>

          <!-- Countries Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="country in filteredOtherCountries"
              :key="country.countryCode"
              class="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              @click="toggleCountryDetails(country.countryCode)"
            >
              <div class="flex justify-between items-center">
                <div class="truncate mr-2">
                  <div class="font-medium text-white truncate">{{ country.countryName }}</div>
                </div>
                <div
                  class="text-sm rounded px-1.5 py-0.5"
                  :class="getCoverageColorClass(country.npaCoverage)"
                >
                  {{ country.npaCoverage.toFixed(1) }}%
                </div>
              </div>

              <!-- Expandable Country Detail -->
              <div
                v-if="expandedCountryDetails.has(country.countryCode)"
                class="mt-3 pt-3 border-t border-gray-700/50"
              >
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span class="text-gray-400">NPAs:</span>
                    <span class="text-white ml-1">{{ country.totalNPAs }}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Covered:</span>
                    <span class="text-white ml-1">{{ country.coveredNPAs }}</span>
                  </div>
                </div>
                <div class="mt-2">
                  <div class="text-xs text-gray-400 mb-1">NPAs in file:</div>
                  <div class="flex flex-wrap gap-1">
                    <div
                      v-for="npa in country.npas.slice(0, 10)"
                      :key="npa"
                      class="text-xs bg-gray-900/80 px-1.5 py-0.5 rounded"
                    >
                      {{ npa }}
                    </div>
                    <div v-if="country.npas.length > 10" class="text-xs text-gray-400">
                      +{{ country.npas.length - 10 }} more
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No results message -->
          <div v-if="filteredOtherCountries.length === 0" class="text-center py-6 text-gray-400">
            No countries match your filter.
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
const expandedCountryDetails = reactive(new Set<string>());
const searchQuery = ref('');
const debouncedSearchQuery = ref('');
const isSearching = ref(false);
const showOtherCountries = ref(false);
const otherCountriesFilter = ref('');
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

// Filter to separate main countries (US/Canada) from others
const mainCountries = computed(() => {
  if (!props.report?.file1.countries) return [];

  const query = debouncedSearchQuery.value.toLowerCase();
  let countries = props.report.file1.countries.filter(
    (country) => country.countryCode === 'US' || country.countryCode === 'CA'
  );

  if (!query) return countries;

  // If there's a search query, apply filtering similar to the original function
  return countries.filter((country) => {
    const matchesCountry = country.countryName.toLowerCase().includes(query);

    // Check if any states match
    const hasMatchingStates = country.states?.some((state) => {
      // Get proper display name based on country
      let stateName = getStateDisplayName(state.stateCode, country.countryCode).toLowerCase();

      // Check if state name or any NPA matches
      return stateName.includes(query) || state.npas.some((npa) => npa.includes(query));
    });

    return matchesCountry || hasMatchingStates;
  });
});

// Compute other countries (not US or CA)
const otherCountries = computed(() => {
  if (!props.report?.file1.countries) return [];

  return props.report.file1.countries.filter(
    (country) => country.countryCode !== 'US' && country.countryCode !== 'CA'
  );
});

// Filtered other countries based on the specific filter for that section
const filteredOtherCountries = computed(() => {
  const query = otherCountriesFilter.value.toLowerCase();
  if (!query) return otherCountries.value;

  return otherCountries.value.filter((country) => {
    return (
      country.countryName.toLowerCase().includes(query) ||
      country.countryCode.toLowerCase().includes(query)
    );
  });
});

// Calculate average coverage percentage for other countries
const averageOtherCountriesCoverage = computed(() => {
  if (otherCountries.value.length === 0) return 0;

  const totalCoverage = otherCountries.value.reduce((sum, country) => sum + country.npaCoverage, 0);

  return totalCoverage / otherCountries.value.length;
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

// Toggle detailed view for a specific country
function toggleCountryDetails(countryCode: string) {
  if (expandedCountryDetails.has(countryCode)) {
    expandedCountryDetails.delete(countryCode);
  } else {
    expandedCountryDetails.add(countryCode);
  }
}

// Toggle other countries section
function toggleOtherCountriesExpanded() {
  showOtherCountries.value = !showOtherCountries.value;
}

// Function to get coverage color class based on percentage
function getCoverageColorClass(coverage: number): string {
  if (coverage === 0) return 'bg-gray-900 text-gray-400';
  if (coverage < 20) return 'bg-red-900/30 text-red-400';
  if (coverage < 50) return 'bg-yellow-900/30 text-yellow-400';
  if (coverage < 80) return 'bg-blue-900/30 text-blue-400';
  return 'bg-green-900/30 text-green-400';
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
