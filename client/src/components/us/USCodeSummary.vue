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
            <div class="text-gray-400">NPA Distribution:</div>
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
              <div class="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                <div
                  v-for="state in filteredUsStates"
                  :key="state.code"
                  class="bg-gray-800/60 px-2 py-1 rounded text-xs flex justify-between"
                >
                  <span class="text-gray-300">{{ getStateName(state.code, 'US') }}</span>
                  <span class="text-accent">{{ state.npas.length }}</span>
                </div>
              </div>
            </div>

            <!-- Canadian Provinces Section -->
            <div v-if="filteredCanadianProvinces.length > 0" class="bg-gray-900 p-3 rounded-lg">
              <div class="text-sm text-gray-400 mb-2">
                Canadian Provinces ({{ filteredCanadianProvinces.length }}):
              </div>
              <div class="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                <div
                  v-for="province in filteredCanadianProvinces"
                  :key="province.code"
                  class="bg-gray-800/60 px-2 py-1 rounded text-xs flex justify-between"
                >
                  <span class="text-gray-300">{{ getStateName(province.code, 'CA') }}</span>
                  <span class="text-accent">{{ province.npas.length }}</span>
                </div>
              </div>
            </div>

            <!-- Other Countries Section -->
            <div v-if="filteredOtherCountries.length > 0" class="bg-gray-900 p-3 rounded-lg">
              <div class="text-sm text-gray-400 mb-2">
                Other Countries ({{ filteredOtherCountries.length }}):
              </div>
              <div class="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                <div
                  v-for="country in filteredOtherCountries"
                  :key="country.country"
                  class="bg-gray-800/60 px-2 py-1 rounded text-xs flex justify-between"
                >
                  <span class="text-gray-300">{{ getCountryName(country.country) }}</span>
                  <span class="text-accent">{{ country.npaCount }}</span>
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

        <!-- Debug Section - Hidden by default -->
        <div v-if="showDebug" class="bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/50">
          <div class="flex justify-between mb-2">
            <div class="text-yellow-400">Debugging Info:</div>
            <div
              @click="showDebug = false"
              class="cursor-pointer text-xs text-yellow-400 hover:text-yellow-300"
            >
              Hide Debug
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <div class="bg-gray-900/50 p-2 rounded">
              <div class="text-yellow-400 font-medium mb-1">Raw CountryStateMap:</div>
              <div>• US has {{ countryStateMapInfo.US?.size || 0 }} states</div>
              <div>• CA has {{ countryStateMapInfo.CA?.size || 0 }} provinces</div>
            </div>

            <div class="bg-gray-900/50 p-2 rounded">
              <div class="text-yellow-400 font-medium mb-1">Raw stateNPAs:</div>
              <div>• Total stateNPAs: {{ Object.keys(lergStore.$state.stateNPAs).length }}</div>
              <div>• State codes: {{ Object.keys(lergStore.$state.stateNPAs).join(', ') }}</div>
            </div>

            <div class="bg-gray-900/50 p-2 rounded">
              <div class="text-yellow-400 font-medium mb-1">Raw countryData:</div>
              <div>• Total countries: {{ lergStore.$state.countryData.length }}</div>
              <div v-for="country in lergStore.$state.countryData" :key="country.country">
                • {{ country.country }}: {{ country.npaCount }} NPAs
                <span v-if="country.provinces"> ({{ country.provinces.length }} provinces) </span>
              </div>
            </div>

            <div class="bg-gray-900/50 p-2 rounded">
              <div class="text-yellow-400 font-medium mb-1">Canadian Provinces in US Data:</div>
              <div v-if="canadianProvincesInUS.length === 0" class="text-green-400">
                No Canadian provinces found in US data!
              </div>
              <div v-else class="text-red-400">
                Found {{ canadianProvincesInUS.length }} Canadian provinces in US data:
                {{ canadianProvincesInUS.join(', ') }}
              </div>
            </div>

            <div class="bg-gray-900/50 p-2 rounded">
              <div class="text-yellow-400 font-medium mb-1">Check for 'MB' NPA Location:</div>
              <div>MB in PROVINCE_CODES: {{ isInProvinceCode('MB') ? 'Yes' : 'No' }}</div>
              <div>MB in STATE_CODES: {{ isInStateCode('MB') ? 'Yes' : 'No' }}</div>
              <div>
                MB found in country:
                <span :class="getMBCountry() === 'CA' ? 'text-green-400' : 'text-red-400'">
                  {{ getMBCountry() || 'Not found' }}
                </span>
              </div>
            </div>

            <div class="bg-gray-900/50 p-2 rounded">
              <div class="text-yellow-400 font-medium mb-1">Our New Data Structure:</div>
              <div>
                • US States: {{ usStates.length }}
                <span class="text-xs ml-2">({{ usStates.map((s) => s.code).join(', ') }})</span>
              </div>
              <div>
                • Canadian Provinces: {{ canadianProvinces.length }}
                <span class="text-xs ml-2"
                  >({{ canadianProvinces.map((p) => p.code).join(', ') }})</span
                >
              </div>
              <div>• Other Countries: {{ otherCountries.length }}</div>
            </div>

            <div class="bg-gray-900/50 p-2 rounded">
              <div class="text-yellow-400 font-medium mb-1">Data Structure Check:</div>
              <div>Country with Manitoba NPAs: {{ getCountryWithMBNpas() }}</div>
            </div>

            <div class="bg-gray-900/50 p-2 rounded">
              <div class="text-yellow-400 font-medium mb-1">Getter Availability:</div>
              <div>
                • getUSStates:
                {{
                  typeof lergStore.getUSStates === 'function'
                    ? 'function'
                    : Array.isArray(lergStore.getUSStates)
                    ? 'array'
                    : typeof lergStore.getUSStates
                }}
              </div>
              <div>
                • getCanadianProvinces:
                {{
                  typeof lergStore.getCanadianProvinces === 'function'
                    ? 'function'
                    : Array.isArray(lergStore.getCanadianProvinces)
                    ? 'array'
                    : typeof lergStore.getCanadianProvinces
                }}
              </div>
              <div>
                • getDistinctCountries:
                {{
                  typeof lergStore.getDistinctCountries === 'function'
                    ? 'function'
                    : Array.isArray(lergStore.getDistinctCountries)
                    ? 'array'
                    : typeof lergStore.getDistinctCountries
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- Debug Toggle Button -->
        <div class="text-right">
          <button
            v-if="!showDebug"
            @click="showDebug = true"
            class="text-xs text-gray-400 hover:text-gray-300"
          >
            Show Debug Info
          </button>
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

// Define props
const props = defineProps<{
  componentId: string;
}>();

const usStore = useUsStore();
const lergStore = useLergStore();

// State for expanding sections
const showDistribution = ref(false);
const showDebug = ref(true);
const searchQuery = ref('');
const isFiltering = ref(false);

// Computed values using the new getters
const usStates = computed(() => {
  if (typeof lergStore.getUSStates === 'function') {
    return lergStore.getUSStates();
  }
  return Array.isArray(lergStore.getUSStates) ? lergStore.getUSStates : [];
});

const canadianProvinces = computed(() => {
  if (typeof lergStore.getCanadianProvinces === 'function') {
    return lergStore.getCanadianProvinces();
  }
  return Array.isArray(lergStore.getCanadianProvinces) ? lergStore.getCanadianProvinces : [];
});

const otherCountries = computed(() => {
  if (typeof lergStore.getDistinctCountries === 'function') {
    return lergStore.getDistinctCountries();
  }
  return Array.isArray(lergStore.getDistinctCountries) ? lergStore.getDistinctCountries : [];
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

// Debug data computed properties
const countryStateMapInfo = computed(() => {
  return lergStore.$state.countryStateMap || {};
});

// Check if there are any Canadian provinces incorrectly assigned to US
const canadianProvincesInUS = computed(() => {
  const provinceCodesInUSData = [];
  for (const stateCode in lergStore.$state.stateNPAs) {
    if (stateCode in PROVINCE_CODES) {
      provinceCodesInUSData.push(stateCode);
    }
  }
  return provinceCodesInUSData;
});

// Helper functions
function isInStateCode(code: string): boolean {
  return code in STATE_CODES;
}

function isInProvinceCode(code: string): boolean {
  return code in PROVINCE_CODES;
}

// Debug function to find where MB is stored
function getMBCountry(): string | null {
  // Check if MB is in any country's provinces
  for (const country of lergStore.$state.countryData) {
    if (country.provinces?.some((p) => p.code === 'MB')) {
      return country.country;
    }
  }

  // Check the country state map
  const countryStateMap = lergStore.$state.countryStateMap;
  if (countryStateMap) {
    for (const [country, stateMap] of countryStateMap.entries()) {
      if (stateMap.has('MB')) {
        return country;
      }
    }
  }

  return null;
}

// Check which country has Manitoba NPAs
function getCountryWithMBNpas(): string {
  for (const [countryCode, stateMap] of Object.entries(lergStore.$state.countryStateMap || {})) {
    if (stateMap.has('MB')) {
      return countryCode;
    }
  }
  return 'Not found in any country';
}
</script>
