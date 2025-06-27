<template>
  <div v-if="usStore.getFileNameByComponent(componentId) !== ''" class="space-y-6">
    <!-- Code Report heading with file name pill and remove button -->
    <div class="mb-4 flex items-center justify-between">
      <span class="text-xl text-fbWhite font-secondary">Code Report</span>
      <div class="flex items-center space-x-2">
        <BaseBadge size="small" variant="info">
          {{ truncatedFileName }}
        </BaseBadge>
        <BaseButton
          variant="destructive"
          size="small"
          :icon="TrashIcon"
          @click="$emit('remove-file', componentId)"
        >
          Remove
        </BaseButton>
      </div>
    </div>

    <!-- Code Report Content -->
    <div class="bg-gray-900 rounded-lg p-4">
      <div class="space-y-4">
        <!-- Basic Stats -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-1">Total Codes:</div>
          <div class="text-xl text-white">{{ enhancedReport?.file1?.totalCodes || 0 }}</div>
        </div>

        <!-- NPA Categories Section -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">NPA Categories:</div>
          <div class="grid grid-cols-4 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Total NPAs</div>
              <div class="text-lg text-white">{{ npaBreakdown.total }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">US NPAs</div>
              <div class="text-lg text-white">{{ npaBreakdown.us.count }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Others</div>
              <div class="text-lg text-white">{{ npaBreakdown.others.count }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Unidentified</div>
              <div class="text-lg text-white">{{ npaBreakdown.unidentified.count }}</div>
            </div>
          </div>
        </div>

        <!-- US Coverage Section -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">US NPA Coverage:</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">LERG Count</div>
              <div class="text-lg text-white">{{ totalLergCodes }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">File Count</div>
              <div class="text-lg text-white">{{ npaBreakdown.us.count }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Coverage</div>
              <div class="text-lg text-white">{{ usCoveragePercentage }}%</div>
            </div>
          </div>
        </div>

        <!-- Rate Statistics Section -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">Average Rates:</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Inter</div>
              <div class="text-lg text-white">${{ averageRates.interstate }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Intra</div>
              <div class="text-lg text-white">${{ averageRates.intrastate }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Indeterm</div>
              <div class="text-lg text-white">${{ averageRates.indeterminate }}</div>
            </div>
          </div>
        </div>

        <!-- NPA Distribution Section -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="flex justify-between mb-2">
            <div class="text-gray-400">NPA Coverage</div>
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

            <!-- Hierarchical NPA Structure -->
            <div v-else class="space-y-4">
              <!-- No Results Message -->
              <div
                v-if="searchQuery && !isFiltering && Object.keys(hierarchicalData).length === 0"
                class="text-center py-4 text-gray-400"
              >
                No results found for "{{ searchQuery }}"
              </div>

              <!-- Hierarchical Country Structure -->
              <template
                v-for="[countryKey, countryInfo] in Object.entries(hierarchicalData)"
                :key="countryKey"
              >
                <div class="bg-gray-900 p-3 rounded-lg" :class="getCountryBorderClass(countryKey)">
                  <div
                    @click="toggleCountryExpanded(countryKey)"
                    class="flex justify-between items-center cursor-pointer"
                  >
                    <span class="text-gray-300 font-medium">{{ countryInfo.displayName }}</span>
                    <div class="flex items-center space-x-2">
                      <span class="text-gray-400 text-sm"> {{ countryInfo.totalNPAs }} NPAs </span>
                      <span
                        class="transform transition-transform"
                        :class="{ 'rotate-180': expandedCountries.has(countryKey) }"
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

                  <!-- States/Provinces/Direct NPAs Section -->
                  <div v-if="expandedCountries.has(countryKey)" class="mt-3 space-y-2">
                    <!-- US/Canada - Show States/Provinces -->
                    <template v-if="countryInfo.hasStates && countryInfo.states && countryInfo.states.length > 0">
                      <template v-for="state in countryInfo.states" :key="state.stateCode">
                        <div class="bg-gray-800/60 rounded overflow-hidden">
                          <div
                            @click="toggleStateExpanded(state.stateCode)"
                            class="px-3 py-2 cursor-pointer hover:bg-gray-700/60 flex justify-between items-center"
                          >
                            <span class="text-gray-300">{{ state.displayName }}</span>
                            <div class="flex items-center space-x-2">
                              <span class="text-gray-400 text-sm">
                                {{ state.npas.length }} NPAs
                              </span>
                              <span
                                class="transform transition-transform"
                                :class="{ 'rotate-180': expandedStates.has(state.stateCode) }"
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

                          <!-- NPAs and Rate Stats -->
                          <div
                            v-if="expandedStates.has(state.stateCode)"
                            class="px-3 py-2 bg-black/20 border-t border-gray-700/30"
                          >
                            <!-- Rate Stats (if available) -->
                            <div v-if="state.rateStats" class="mb-3 grid grid-cols-3 gap-2">
                              <div class="bg-gray-800/50 px-2 py-1.5 rounded">
                                <div class="text-xs text-gray-400 mb-1">IE Rate</div>
                                <div class="text-sm text-white">
                                  ${{ formatRate(state.rateStats.interstate?.average) }}
                                </div>
                              </div>
                              <div class="bg-gray-800/50 px-2 py-1.5 rounded">
                                <div class="text-xs text-gray-400 mb-1">IA Rate</div>
                                <div class="text-sm text-white">
                                  ${{ formatRate(state.rateStats.intrastate?.average) }}
                                </div>
                              </div>
                              <div class="bg-gray-800/50 px-2 py-1.5 rounded">
                                <div class="text-xs text-gray-400 mb-1">IJ Rate</div>
                                <div class="text-sm text-white">
                                  ${{ formatRate(state.rateStats.indeterminate?.average) }}
                                </div>
                              </div>
                            </div>

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
                      </template>
                    </template>

                    <!-- Other Countries/Unknown - Show NPAs directly -->
                    <template v-else>
                      <div class="bg-gray-800/60 rounded p-2">
                        <div class="text-xs text-gray-400 mb-2">NPAs:</div>
                        <div class="flex flex-wrap gap-1">
                          <div
                            v-for="npa in countryInfo.npas"
                            :key="npa"
                            class="px-2 py-1 rounded text-xs"
                            :class="getCountryNPAClass(countryKey)"
                          >
                            {{ npa }}
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch, nextTick } from 'vue';
  import { useUsStore } from '@/stores/us-store';
  import { useLergStore } from '@/stores/lerg-store';
  import { getStateName } from '@/types/constants/state-codes';
  import { getCountryName } from '@/types/constants/country-codes';
  import { TrashIcon } from '@heroicons/vue/24/outline';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import { categorizeNPAList, calculateCoveragePercentage } from '@/utils/npa-categorizer';
  import type { ComponentId } from '@/types/app-types';
  import type {
    USEnhancedCodeReport,
    USCountryBreakdown,
    USStateBreakdown,
  } from '@/types/domains/us-types';

  // Define props
  const props = defineProps<{
    componentId: ComponentId;
  }>();

  // Define emits
  const emit = defineEmits<{ (e: 'remove-file', componentId: ComponentId): void }>();

  const usStore = useUsStore();
  const lergStore = useLergStore();

  // UI state
  const showDistribution = ref(true);
  const searchQuery = ref('');
  const isFiltering = ref(false);
  const expandedStates = ref<Set<string>>(new Set());
  const expandedCountries = ref<Set<string>>(new Set());

  // Create a computed property for the truncated filename
  const truncatedFileName = computed(() => {
    const fullName = usStore.getFileNameByComponent(props.componentId);
    if (fullName.length > 10) {
      return `${fullName.slice(0, 10)}...`;
    }
    return fullName;
  });

  // Get the enhanced report for this component
  const enhancedReport = computed(() => {
    const fileName = usStore.getFileNameByComponent(props.componentId);
    return usStore.getEnhancedReportByFile(fileName);
  });

  // NPA categorization
  const allFileNPAs = computed(() => {
    const countries = enhancedReport.value?.file1?.countries;
    if (!countries) return [];

    const allNPAs: number[] = [];
    countries.forEach((country: USCountryBreakdown) => {
      if (country.npas) {
        // Convert string NPAs to numbers
        const numericNPAs = country.npas
          .map((npa) => parseInt(npa, 10))
          .filter((npa) => !isNaN(npa));
        allNPAs.push(...numericNPAs);
      }
    });

    return allNPAs;
  });

  const npaBreakdown = computed(() => {
    return categorizeNPAList(allFileNPAs.value);
  });

  // Basic stats
  const totalLergCodes = computed(() => lergStore.calculateTotalLergCodes() || 0);

  const usCoveragePercentage = computed(() => {
    return calculateCoveragePercentage(npaBreakdown.value.us.count, totalLergCodes.value);
  });

  // Average rates
  const averageRates = computed(() => {
    // Get stats directly from fileStats using the componentId
    const stats = usStore.fileStats.get(props.componentId);
    return {
      interstate: Number(stats?.avgInterRate || 0).toFixed(4),
      intrastate: Number(stats?.avgIntraRate || 0).toFixed(4),
      indeterminate: Number(stats?.avgIndetermRate || 0).toFixed(4),
    };
  });

  // Format coverage to 2 decimal places
  function formatCoverage(value: number | undefined): number {
    if (value === undefined) return 0;
    return Number(value.toFixed(2));
  }

  // Format rate to 4 decimal places
  function formatRate(value: number | undefined): string {
    if (value === undefined) return '0.0000';
    return value.toFixed(4);
  }

  // Countries data with filtering
  const countries = computed(() => {
    if (!enhancedReport.value?.file1?.countries) return [];
    return enhancedReport.value.file1.countries;
  });

  const filteredCountries = computed(() => {
    if (!searchQuery.value) return countries.value;

    const query = searchQuery.value.toLowerCase();
    return countries.value
      .map((country: USCountryBreakdown) => {
        // Check if country name matches
        const countryMatches = country.countryName.toLowerCase().includes(query);

        if (countryMatches) {
          // If country matches, return entire country with all states
          return country;
        }

        // Filter states within this country
        const filteredStates = country.states?.filter((state) => {
          const stateName = getStateName(state.stateCode, country.countryCode).toLowerCase();

          // Check if state name matches
          if (stateName.includes(query)) return true;

          // Check if any NPA in this state matches (search from beginning only)
          const hasMatchingNPA = state.npas.some((npa) => npa.startsWith(query));


          return hasMatchingNPA;
        });

        // If no states match, don't include this country
        if (!filteredStates || filteredStates.length === 0) {
          return null;
        }

        // Return country with only the filtered states
        return {
          ...country,
          states: filteredStates,
        };
      })
      .filter((country): country is USCountryBreakdown => country !== null);
  });

  // Filtered Others countries
  const filteredOthersCountries = computed(() => {
    const othersCountries = Array.from(npaBreakdown.value.others.countries.entries());

    if (!searchQuery.value) return othersCountries;

    const query = searchQuery.value.toLowerCase();
    return othersCountries.filter(([countryCode, countryData]) => {
      // Check if country name matches
      if (countryData.countryName.toLowerCase().includes(query)) return true;

      // Check if any NPA matches
      return countryData.npas.some((npa) => npa.toString().startsWith(query));
    });
  });

  // Filtered Unidentified NPAs
  const filteredUnidentifiedNPAs = computed(() => {
    if (!searchQuery.value) return npaBreakdown.value.unidentified.npas;

    const query = searchQuery.value.toLowerCase();
    return npaBreakdown.value.unidentified.npas.filter((npa) => npa.toString().startsWith(query));
  });

  // Create hierarchical data structure
  const hierarchicalData = computed(() => {
    const result: Record<string, any> = {};
    const query = searchQuery.value.toLowerCase();

    // Process existing enhanced report data to maintain US/Canada state structure
    if (enhancedReport.value?.file1?.countries) {
      
      enhancedReport.value.file1.countries.forEach((country: USCountryBreakdown) => {
        if (country.npas && country.npas.length > 0) {
          const countryName = country.countryName;
          const hasStates = country.states && country.states.length > 0;

          // Filter by search query if needed
          let shouldInclude = !query;
          if (query) {
            shouldInclude =
              countryName.toLowerCase().includes(query) ||
              country.states?.some(
                (state) =>
                  getStateName(state.stateCode, country.countryCode)
                    .toLowerCase()
                    .includes(query) || state.npas.some((npa) => npa.startsWith(query))
              ) ||
              country.npas.some((npa) => npa.startsWith(query));
          }

          if (shouldInclude) {
            // If searching and country has states, filter states to only matching ones
            let filteredStates = country.states;
            if (query && hasStates && country.states) {
              filteredStates = country.states.filter((state) => {
                const stateName = getStateName(state.stateCode, country.countryCode).toLowerCase();
                // Check if state name matches
                if (stateName.includes(query)) return true;
                // Check if any NPA in state matches
                return state.npas.some((npa) => npa.startsWith(query));
              });
            }
            
            // Ensure we always have the full states array when not searching
            if (!query && hasStates) {
              filteredStates = country.states;
            }

            // Only include country if it has matching states (when searching) or any states (when not searching)
            if (!query || (filteredStates && filteredStates.length > 0) || !hasStates) {
              // Force correct states mapping for Canada and US
              let statesArray = undefined;
              if (hasStates && filteredStates && filteredStates.length > 0) {
                statesArray = filteredStates.map((state) => ({
                  stateCode: state.stateCode,
                  displayName: getStateName(state.stateCode, country.countryCode),
                  npas: state.npas,
                  rateStats: state.rateStats,
                }));
              }
              
              
              const countryResult = {
                displayName: countryName,
                totalNPAs:
                  query && filteredStates
                    ? filteredStates.reduce((sum, state) => sum + state.npas.length, 0)
                    : country.npas.length,
                hasStates: hasStates,
                npas: country.npas,
                states: statesArray
              };
              
              
              
              result[country.countryCode] = countryResult;
            }
          }
        }
      });
    }

    // Add non-US countries from breakdown (exclude CA since it's already processed with states)
    npaBreakdown.value.others.countries.forEach((countryData, countryCode) => {
      // Skip Canada as it's already processed with provinces from enhanced report
      if (countryCode === 'CA') return;
      
      const shouldInclude =
        !query ||
        countryData.countryName.toLowerCase().includes(query) ||
        countryData.npas.some((npa) => npa.toString().startsWith(query));

      if (shouldInclude && countryData.npas.length > 0) {
        result[countryCode] = {
          displayName: countryData.countryName,
          totalNPAs: countryData.npas.length,
          hasStates: false,
          npas: countryData.npas.map((n) => n.toString()),
        };
      }
    });

    // Add unidentified NPAs
    const unidentifiedNPAs = filteredUnidentifiedNPAs.value;
    if (unidentifiedNPAs.length > 0) {
      result['UNKNOWN'] = {
        displayName: 'Unknown',
        totalNPAs: unidentifiedNPAs.length,
        hasStates: false,
        npas: unidentifiedNPAs.map((n) => n.toString()),
      };
    }

    
    return result;
  });

  // Toggle functions
  function toggleStateExpanded(code: string) {
    if (expandedStates.value.has(code)) {
      expandedStates.value.delete(code);
    } else {
      expandedStates.value.add(code);
    }
  }

  function toggleCountryExpanded(code: string) {
    if (expandedCountries.value.has(code)) {
      expandedCountries.value.delete(code);
    } else {
      expandedCountries.value.add(code);
    }
  }

  // Styling functions for different country types
  function getCountryBorderClass(countryKey: string) {
    if (countryKey === 'US') return '';
    if (countryKey === 'CA') return 'border border-blue-600/30';
    if (countryKey === 'UNKNOWN') return 'border border-red-600/30';
    return 'border border-yellow-600/30';
  }

  function getCountryNPAClass(countryKey: string) {
    if (countryKey === 'UNKNOWN') return 'bg-red-600/20 text-red-400';
    return 'bg-yellow-600/20 text-yellow-400';
  }

  // Add watcher to auto-expand matching items
  watch(searchQuery, async (newQuery) => {
    if (!newQuery) {
      expandedStates.value.clear();
      expandedCountries.value.clear();
      return;
    }

    const query = newQuery.toLowerCase();
    await nextTick();

    // Auto-expand matching countries and states
    Object.entries(hierarchicalData.value).forEach(([countryKey, countryInfo]) => {
      if (countryInfo.displayName.toLowerCase().includes(query)) {
        expandedCountries.value.add(countryKey);
        return;
      }

      if (countryInfo.hasStates && countryInfo.states) {
        countryInfo.states.forEach((state: any) => {
          const hasMatchingNPA = state.npas.some((npa: string) => npa.startsWith(query));
          const hasMatchingState = state.displayName.toLowerCase().includes(query);

          if (hasMatchingState || hasMatchingNPA) {
            expandedCountries.value.add(countryKey);
            expandedStates.value.add(state.stateCode);
          }
        });
      } else {
        // Check direct NPAs for non-state countries
        const hasMatchingNPA = countryInfo.npas.some((npa: string) => npa.startsWith(query));
        if (hasMatchingNPA) {
          expandedCountries.value.add(countryKey);
        }
      }
    });
  });
</script>
