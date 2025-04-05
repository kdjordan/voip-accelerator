<template>
  <div
    v-if="usStore.getFileNameByComponent(componentId) !== ''"
    class="mt-8 pt-8 border-t border-gray-700/50"
  >
    <!-- Code Report heading with file name pill -->
    <div class="mb-4 flex items-center justify-between">
      <span class="text-xl text-fbWhite font-secondary">Code Report</span>
      <div
        class="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 border border-accent/50"
      >
        <span class="text-sm text-accent">{{ usStore.getFileNameByComponent(componentId) }}</span>
      </div>
    </div>

    <!-- Code Report Content - Dark bento box style -->
    <div class="bg-gray-900 rounded-lg p-4">
      <div class="space-y-4">
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-1">Total Codes:</div>
          <div class="text-xl text-white">{{ usStore.getFileStats(componentId).totalCodes }}</div>
        </div>

        <!-- NPAs Section with Coverage -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">US NPA Statistics:</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">LERG Count</div>
              <div class="text-lg text-white">
                {{ lergStore.getTotalUSNPAs }}
              </div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">File Count</div>
              <div class="text-lg text-white">
                {{ usStore.getFileStats(componentId).totalDestinations }}
              </div>
            </div>

            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Coverage</div>
              <div class="text-lg text-white">
                {{ usStore.getFileStats(componentId).usNPACoveragePercentage }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Rate Statistics Section -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">Average Rates:</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Interstate</div>
              <div class="text-lg text-white">
                ${{ usStore.getFileStats(componentId).avgInterRate }}
              </div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Intrastate</div>
              <div class="text-lg text-white">
                ${{ usStore.getFileStats(componentId).avgIntraRate }}
              </div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Indeterminate</div>
              <div class="text-lg text-white">
                ${{ usStore.getFileStats(componentId).avgIndetermRate }}
              </div>
            </div>
          </div>
        </div>

        <!-- NPA Distribution Section -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="flex justify-between mb-2">
            <div class="text-gray-400">NPA Coverage:</div>
            <div
              v-if="showDistribution"
              @click="showDistribution = false"
              class="cursor-pointer text-xs text-accent hover:text-accent-hover"
            >
              Hide Details
            </div>
            <div
              v-else
              @click="showDistribution = true"
              class="cursor-pointer text-xs text-accent hover:text-accent-hover"
            >
              Show Details
            </div>
          </div>

          <div v-if="showDistribution" class="space-y-3">
            <!-- Search Input -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by NPA, country, or state..."
                class="w-full bg-gray-900 px-3 py-2 text-sm rounded border border-gray-700 focus:border-accent focus:outline-none"
              />
              <span
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-3 top-2 text-gray-400 hover:text-white cursor-pointer"
              >
                &times;
              </span>
            </div>

            <!-- Loading Indicator -->
            <div v-if="isFiltering" class="flex justify-center py-4">
              <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-accent"></div>
            </div>

            <!-- US States Section -->
            <div v-else-if="filteredUsStates.length > 0" class="bg-gray-900 p-3 rounded-lg">
              <div class="text-sm text-gray-400 mb-2">
                US States ({{ filteredUsStates.length }}):
              </div>
              <div class="space-y-2 max-h-80 overflow-y-auto">
                <div
                  v-for="state in filteredUsStates"
                  :key="state.code"
                  class="bg-gray-800/60 rounded overflow-hidden"
                >
                  <!-- State header -->
                  <div
                    @click="toggleStateExpanded(state.code)"
                    class="px-3 py-2 cursor-pointer hover:bg-gray-700/60 flex justify-between items-center"
                  >
                    <span class="text-gray-300">{{ getStateName(state.code, 'US') }}</span>
                    <div class="flex items-center space-x-2">
                      <span class="text-accent">
                        {{ state.npas.length }} <span class="text-gray-400">of</span>
                        {{ stateToLergNpasMap.get(state.code) || 0 }}
                      </span>
                      <span
                        class="transform transition-transform"
                        :class="{ 'rotate-180': expandedStates.has(state.code) }"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>

                  <!-- Expanded NPAs section -->
                  <div
                    v-if="expandedStates.has(state.code)"
                    class="px-3 py-2 bg-black/20 border-t border-gray-700/30"
                  >
                    <div class="text-xs text-gray-400 mb-2">NPAs:</div>
                    <div class="flex flex-wrap gap-2">
                      <div
                        v-for="npa in state.npas"
                        :key="npa"
                        class="bg-gray-700/50 px-2 py-1 rounded text-xs text-white"
                      >
                        {{ npa }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Canadian Provinces Section -->
            <div v-if="filteredCanadianProvinces.length > 0" class="bg-gray-900 p-3 rounded-lg">
              <div class="text-sm text-gray-400 mb-2">
                Canadian Provinces ({{ filteredCanadianProvinces.length }}):
              </div>
              <div class="space-y-2 max-h-60 overflow-y-auto">
                <div
                  v-for="province in filteredCanadianProvinces"
                  :key="province.code"
                  class="bg-gray-800/60 rounded overflow-hidden"
                >
                  <!-- Province header -->
                  <div
                    @click="toggleProvinceExpanded(province.code)"
                    class="px-3 py-2 cursor-pointer hover:bg-gray-700/60 flex justify-between items-center"
                  >
                    <span class="text-gray-300">{{ getStateName(province.code, 'CA') }}</span>
                    <div class="flex items-center space-x-2">
                      <span class="text-accent">
                        {{ province.npas.length }} <span class="text-gray-400">of</span>
                        {{ provinceToLergNpasMap.get(province.code) || 0 }}
                      </span>
                      <span
                        class="transform transition-transform"
                        :class="{ 'rotate-180': expandedProvinces.has(province.code) }"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>

                  <!-- Expanded NPAs section -->
                  <div
                    v-if="expandedProvinces.has(province.code)"
                    class="px-3 py-2 bg-black/20 border-t border-gray-700/30"
                  >
                    <div class="text-xs text-gray-400 mb-2">NPAs:</div>
                    <div class="flex flex-wrap gap-2">
                      <div
                        v-for="npa in province.npas"
                        :key="npa"
                        class="bg-gray-700/50 px-2 py-1 rounded text-xs text-white"
                      >
                        {{ npa }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Other Countries Section -->
            <div v-if="filteredOtherCountries.length > 0" class="bg-gray-900 p-3 rounded-lg">
              <div class="text-sm text-gray-400 mb-2">
                Other Countries ({{ filteredOtherCountries.length }}):
              </div>
              <div class="space-y-2 max-h-60 overflow-y-auto">
                <div
                  v-for="country in filteredOtherCountries"
                  :key="country.country"
                  class="bg-gray-800/60 rounded overflow-hidden"
                >
                  <!-- Country header -->
                  <div
                    @click="toggleCountryExpanded(country.country)"
                    class="px-3 py-2 cursor-pointer hover:bg-gray-700/60 flex justify-between items-center"
                  >
                    <span class="text-gray-300">{{ getCountryName(country.country) }}</span>
                    <div class="flex items-center space-x-2">
                      <span class="text-accent">
                        {{ country.npaCount }} <span class="text-gray-400">of</span>
                        {{ countryToLergNpasMap.get(country.country) || 0 }}
                      </span>
                      <span
                        class="transform transition-transform"
                        :class="{ 'rotate-180': expandedCountries.has(country.country) }"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>

                  <!-- Expanded NPAs section -->
                  <div
                    v-if="expandedCountries.has(country.country)"
                    class="px-3 py-2 bg-black/20 border-t border-gray-700/30"
                  >
                    <div class="text-xs text-gray-400 mb-2">NPAs:</div>
                    <div class="flex flex-wrap gap-2">
                      <div
                        v-for="npa in country.npas"
                        :key="npa"
                        class="bg-gray-700/50 px-2 py-1 rounded text-xs text-white"
                      >
                        {{ npa }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Results Message -->
            <div
              v-if="
                searchQuery &&
                !isFiltering &&
                filteredUsStates.length === 0 &&
                filteredCanadianProvinces.length === 0 &&
                filteredOtherCountries.length === 0
              "
              class="text-center py-4 text-gray-400"
            >
              No results found for "{{ searchQuery }}"
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useUsStore } from '@/stores/us-store';
import { useLergStore } from '@/stores/lerg-store';
import { getStateName } from '@/types/constants/state-codes';
import { getCountryName } from '@/types/constants/country-codes';
import { STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';
import { COUNTRY_CODES } from '@/types/constants/country-codes';

// Define props
const props = defineProps<{
  componentId: string;
}>();

const usStore = useUsStore();
const lergStore = useLergStore();

// State for expanding sections and expanded items
const showDistribution = ref(false);
const searchQuery = ref('');
const isFiltering = ref(false);
const expandedStates = ref<Set<string>>(new Set());
const expandedProvinces = ref<Set<string>>(new Set());
const expandedCountries = ref<Set<string>>(new Set());

// Computed values using file-specific data instead of LERG data
const fileData = computed(() => {
  return usStore.getFileDataByComponent(props.componentId) || [];
});

// Extract NPAs from file data
const fileNPAs = computed(() => {
  const npas = new Set<string>();
  fileData.value.forEach((entry: any) => {
    if (entry.npa) {
      npas.add(entry.npa);
    }
  });
  return Array.from(npas);
});

// Group NPAs by US states
const usStates = computed(() => {
  const stateMap = new Map<string, string[]>();

  // Get all US state codes
  Object.keys(STATE_CODES).forEach((stateCode) => {
    stateMap.set(stateCode, []);
  });

  // Go through file NPAs and assign to states
  fileNPAs.value.forEach((npa) => {
    const stateData = lergStore.getStateByNpa?.(npa);
    if (stateData && stateData.country === 'US' && stateData.state in STATE_CODES) {
      const npasForState = stateMap.get(stateData.state) || [];
      npasForState.push(npa);
      stateMap.set(stateData.state, npasForState);
    }
  });

  // Convert map to array and sort by NPA count
  return Array.from(stateMap.entries())
    .filter(([_, npas]) => npas.length > 0)
    .map(([code, npas]) => ({
      code,
      country: 'US',
      npas: [...npas].sort(),
    }))
    .sort((a, b) => b.npas.length - a.npas.length);
});

// Group NPAs by Canadian provinces
const canadianProvinces = computed(() => {
  const provinceMap = new Map<string, string[]>();

  // Get all Canadian province codes
  Object.keys(PROVINCE_CODES).forEach((provinceCode) => {
    provinceMap.set(provinceCode, []);
  });

  // Go through file NPAs and assign to provinces
  fileNPAs.value.forEach((npa) => {
    const stateData = lergStore.getStateByNpa?.(npa);
    if (stateData && stateData.country === 'CA' && stateData.state in PROVINCE_CODES) {
      const npasForProvince = provinceMap.get(stateData.state) || [];
      npasForProvince.push(npa);
      provinceMap.set(stateData.state, npasForProvince);
    }
  });

  // Convert map to array and sort by NPA count
  return Array.from(provinceMap.entries())
    .filter(([_, npas]) => npas.length > 0)
    .map(([code, npas]) => ({
      code,
      country: 'CA',
      npas: [...npas].sort(),
    }))
    .sort((a, b) => b.npas.length - a.npas.length);
});

// Group NPAs by other countries
const otherCountries = computed(() => {
  const countryMap = new Map<string, string[]>();

  // Go through file NPAs and assign to countries
  fileNPAs.value.forEach((npa) => {
    const country = lergStore.getCountryByNpa?.(npa);
    if (country && country !== 'US' && country !== 'CA') {
      if (!countryMap.has(country)) {
        countryMap.set(country, []);
      }
      const npasForCountry = countryMap.get(country) || [];
      npasForCountry.push(npa);
      countryMap.set(country, npasForCountry);
    }
  });

  // Convert map to array and sort by NPA count
  return Array.from(countryMap.entries())
    .map(([country, npas]) => ({
      country,
      npaCount: npas.length,
      npas: [...npas].sort(),
    }))
    .sort((a, b) => b.npaCount - a.npaCount);
});

// Filtered results with debounce for better performance
const filteredUsStates = computed(() => {
  if (!searchQuery.value) return usStates.value;
  const query = searchQuery.value.toLowerCase();

  return usStates.value.filter((state) => {
    // Match on state code
    if (state.code.toLowerCase().includes(query)) return true;

    // Match on state name
    if (getStateName(state.code, 'US').toLowerCase().includes(query)) return true;

    // Match on any NPA
    if (state.npas.some((npa) => npa.includes(query))) return true;

    return false;
  });
});

const filteredCanadianProvinces = computed(() => {
  if (!searchQuery.value) return canadianProvinces.value;
  const query = searchQuery.value.toLowerCase();

  return canadianProvinces.value.filter((province) => {
    // Match on province code
    if (province.code.toLowerCase().includes(query)) return true;

    // Match on province name
    if (getStateName(province.code, 'CA').toLowerCase().includes(query)) return true;

    // Match on any NPA
    if (province.npas.some((npa) => npa.includes(query))) return true;

    // Match on country
    if ('canada'.includes(query)) return true;

    return false;
  });
});

const filteredOtherCountries = computed(() => {
  if (!searchQuery.value) return otherCountries.value;
  const query = searchQuery.value.toLowerCase();

  return otherCountries.value.filter((country) => {
    // Match on country code
    if (country.country.toLowerCase().includes(query)) return true;

    // Match on country name
    if (getCountryName(country.country).toLowerCase().includes(query)) return true;

    // Match on any NPA
    if (country.npas.some((npa) => npa.includes(query))) return true;

    return false;
  });
});

// Add debouncing for search
watch(searchQuery, () => {
  isFiltering.value = true;
  setTimeout(() => {
    isFiltering.value = false;
  }, 300);
});

// Functions to toggle expanded state
function toggleStateExpanded(code: string) {
  if (expandedStates.value.has(code)) {
    expandedStates.value.delete(code);
  } else {
    expandedStates.value.add(code);
  }
}

function toggleProvinceExpanded(code: string) {
  if (expandedProvinces.value.has(code)) {
    expandedProvinces.value.delete(code);
  } else {
    expandedProvinces.value.add(code);
  }
}

function toggleCountryExpanded(code: string) {
  if (expandedCountries.value.has(code)) {
    expandedCountries.value.delete(code);
  } else {
    expandedCountries.value.add(code);
  }
}

// Add computed properties to get total NPAs per region from LERG data
const stateToLergNpasMap = computed(() => {
  const map = new Map<string, number>();

  // For US states
  Object.entries(STATE_CODES).forEach(([stateCode]) => {
    // Get NPAs for this state from LERG
    const npas = lergStore.getNpasByState?.('US', stateCode) || new Set<string>();
    map.set(stateCode, npas.size);
  });

  return map;
});

const provinceToLergNpasMap = computed(() => {
  const map = new Map<string, number>();

  // For Canadian provinces
  Object.entries(PROVINCE_CODES).forEach(([provinceCode]) => {
    // Get NPAs for this province from LERG
    const npas = lergStore.getNpasByState?.('CA', provinceCode) || new Set<string>();
    map.set(provinceCode, npas.size);
  });

  return map;
});

const countryToLergNpasMap = computed(() => {
  const map = new Map<string, number>();

  // For countries (excluding US and CA which are handled separately)
  Object.entries(COUNTRY_CODES).forEach(([countryCode]) => {
    if (countryCode !== 'US' && countryCode !== 'CA') {
      // Get NPAs for this country from LERG
      const npas = lergStore.getNpasByCountry?.(countryCode) || new Set<string>();
      map.set(countryCode, npas.size);
    }
  });

  return map;
});
</script>
