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
          :loading="props.isRemoving"
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
          <div class="text-xl text-white">{{ totalCodes }}</div>
        </div>

        <!-- LERG Database Info Section -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">LERG Database NPAs:</div>
          <div class="grid grid-cols-4 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Total</div>
              <div class="text-lg text-white">{{ lergTotalNPAs }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">US</div>
              <div class="text-lg text-white">{{ lergUSNPAs }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Canada</div>
              <div class="text-lg text-white">{{ lergCanadaNPAs }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Others</div>
              <div class="text-lg text-white">{{ lergOthersNPAs }}</div>
            </div>
          </div>
        </div>

        <!-- US Coverage Section -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">US NPA Coverage:</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">In LERG</div>
              <div class="text-lg text-white">{{ totalLergCodes }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">In FILE</div>
              <div class="text-lg text-white">{{ fileUSNPACount }}</div>
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
                    <template
                      v-if="
                        countryInfo.hasStates && countryInfo.states && countryInfo.states.length > 0
                      "
                    >
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

                          <!-- NPAs -->
                          <div
                            v-if="expandedStates.has(state.stateCode)"
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
                      </template>
                    </template>

                    <!-- Others - Show Countries as sub-items -->
                    <template v-else-if="countryInfo.hasCountries">
                      <template v-for="country in countryInfo.countries" :key="country.countryCode">
                        <div class="bg-gray-800/60 rounded overflow-hidden">
                          <div
                            @click="toggleStateExpanded(country.countryCode)"
                            class="px-3 py-2 cursor-pointer hover:bg-gray-700/60 flex justify-between items-center"
                          >
                            <span class="text-gray-300">{{ country.countryName }}</span>
                            <div class="flex items-center space-x-2">
                              <span class="text-gray-400 text-sm">
                                {{ country.totalNPAs }} NPAs
                              </span>
                              <span
                                class="transform transition-transform"
                                :class="{ 'rotate-180': expandedStates.has(country.countryCode) }"
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

                          <!-- NPAs for this country -->
                          <div
                            v-if="expandedStates.has(country.countryCode)"
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
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  // Removed static constant imports - now using enhanced store data
  import { TrashIcon } from '@heroicons/vue/24/outline';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import { NANPCategorizer } from '@/utils/nanp-categorization';
  import type { ComponentId } from '@/types/app-types';
  import type {
    USEnhancedCodeReport,
    USCountryBreakdown,
    USStateBreakdown,
  } from '@/types/domains/us-types';

  // Define props
  const props = defineProps<{
    componentId: ComponentId;
    isRemoving?: boolean;
  }>();

  // Define emits
  const emit = defineEmits<{ (e: 'remove-file', componentId: ComponentId): void }>();

  const usStore = useUsStore();
  const lergStore = useLergStoreV2();

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

  // Get file stats using the store getter (handles reactivity properly)
  const fileStats = computed(() => {
    return usStore.getFileStats(props.componentId);
  });

  // Get total codes from file stats
  const totalCodes = computed(() => {
    return fileStats.value?.totalCodes || 0;
  });

  // NPA categorization - Get NPAs directly from uploaded file data
  const allFileNPAs = computed(() => {
    // Get data directly from the store instead of enhanced report
    const fileData = usStore.getFileDataByComponent(props.componentId);
    if (!fileData || fileData.length === 0) {
      return [];
    }

    // Extract unique NPAs from the file data
    const uniqueNPAs = new Set<number>();
    fileData.forEach((record) => {
      // Try multiple possible field names for NPA
      const npaValue = record.npa || record.NPA || record.code || record.Code;
      const npa = parseInt(npaValue, 10);
      if (!isNaN(npa) && npa >= 200 && npa <= 999) {
        uniqueNPAs.add(npa);
      }
    });

    return Array.from(uniqueNPAs);
  });

  // Separate computed for categorization results
  const categorizationResults = computed(() => {
    const stringNPAs = allFileNPAs.value.map((npa) => npa.toString());
    const result = NANPCategorizer.categorizeNPAs(stringNPAs);
    return result;
  });

  // Separate computed for countries Map
  const othersCountriesMap = computed(() => {
    const countriesMap = new Map();
    const result = categorizationResults.value;
    const allOthersNPAs = [...result.caribbean, ...result.pacific, ...result.canadian];

    allOthersNPAs.forEach((npa) => {
      // Use NANPCategorizer directly since we know it's working
      const categorization = NANPCategorizer.categorizeNPA(npa);
      if (categorization && categorization.category !== 'unknown') {
        const countryCode = categorization.country;
        const countryName = categorization.countryName;

        if (!countriesMap.has(countryCode)) {
          countriesMap.set(countryCode, {
            countryName: countryName,
            npas: [],
          });
        }
        countriesMap.get(countryCode).npas.push(parseInt(npa));
      }
    });

    return countriesMap;
  });

  const npaBreakdown = computed(() => {
    const result = categorizationResults.value;
    const stats = fileStats.value;

    const breakdown = {
      us: {
        npas: result.usDomestic,
        count: result.usDomestic.length,
      },
      others: {
        npas: [...result.caribbean, ...result.pacific, ...result.canadian],
        count: result.caribbean.length + result.pacific.length + result.canadian.length,
        countries: othersCountriesMap.value,
      },
      unidentified: {
        npas: result.unknown,
        count: result.unknown.length,
      },
      total: stats?.totalDestinations || allFileNPAs.value.length,
    };
    return breakdown;
  });

  // LERG Database stats - using new store
  const lergTotalNPAs = computed(() => {
    return lergStore.stats.total || 0;
  });

  const lergUSNPAs = computed(() => {
    return lergStore.stats.us_domestic || 0;
  });

  const lergCanadaNPAs = computed(() => {
    return lergStore.stats.canadian || 0;
  });

  const lergOthersNPAs = computed(() => {
    return (lergStore.stats.caribbean + lergStore.stats.pacific) || 0;
  });

  // File US NPA count from enhanced report or direct calculation
  const fileUSNPACount = computed(() => {
    if (enhancedReport.value?.file1?.countries) {
      const usCountry = enhancedReport.value.file1.countries.find(
        (c: USCountryBreakdown) => c.countryCode === 'US'
      );
      return usCountry?.npas?.length || 0;
    }
    
    // Fallback: Calculate directly from file NPAs using new store
    const usNPAs = allFileNPAs.value.filter((npa) => {
      const npaInfo = lergStore.getNPAInfo(npa.toString());
      return npaInfo?.category === 'us-domestic';
    });
    return usNPAs.length;
  });

  // Basic stats - Use ONLY US domestic NPAs for coverage calculation
  const totalLergCodes = computed(() => lergStore.usTotalNPAs || 0);

  const usCoveragePercentage = computed(() => {
    // Calculate coverage using file US NPA count vs total LERG US NPAs
    const fileUsCount = fileUSNPACount.value;
    const totalLergUs = totalLergCodes.value;
    return totalLergUs > 0 ? ((fileUsCount / totalLergUs) * 100).toFixed(2) : '0.00';
  });

  // Average rates
  const averageRates = computed(() => {
    return {
      interstate: Number(fileStats.value?.avgInterRate || 0).toFixed(4),
      intrastate: Number(fileStats.value?.avgIntraRate || 0).toFixed(4),
      indeterminate: Number(fileStats.value?.avgIndetermRate || 0).toFixed(4),
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

  // Helper functions to get state/province names from new store
  function getStateName(stateCode: string): string {
    const usStates = lergStore.getUSStates;
    const state = usStates.find(s => s.code === stateCode);
    return state?.name || stateCode;
  }

  function getProvinceName(provinceCode: string): string {
    const caProvinces = lergStore.getCanadianProvinces;
    const province = caProvinces.find(p => p.code === provinceCode);
    return province?.name || provinceCode;
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
          const stateName = (
            country.countryCode === 'US'
              ? getStateName(state.stateCode)
              : getProvinceName(state.stateCode)
          ).toLowerCase();

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

    // Collect all "Others" countries (non-US/Canada)
    const othersCountries: any[] = [];
    let totalOthersNPAs = 0;

    // Process existing enhanced report data
    if (enhancedReport.value?.file1?.countries) {
      enhancedReport.value.file1.countries.forEach((country: USCountryBreakdown) => {
        if (country.npas && country.npas.length > 0) {
          const countryName = country.countryName;
          const countryCode = country.countryCode;
          const hasStates = country.states && country.states.length > 0;

          // Handle US and Canada separately
          if (countryCode === 'US' || countryCode === 'CA') {
            // Filter by search query if needed
            let shouldInclude = !query;
            if (query) {
              shouldInclude =
                countryName.toLowerCase().includes(query) ||
                country.states?.some((state) => {
                  const stateName =
                    countryCode === 'US'
                      ? getStateName(state.stateCode)
                      : getProvinceName(state.stateCode);
                  return (
                    stateName.toLowerCase().includes(query) ||
                    state.npas.some((npa) => npa.startsWith(query))
                  );
                }) ||
                country.npas.some((npa) => npa.startsWith(query));
            }

            if (shouldInclude) {
              // Handle states filtering for US/Canada
              let filteredStates = country.states;
              if (query && hasStates && country.states) {
                filteredStates = country.states.filter((state) => {
                  const stateName = (
                    countryCode === 'US'
                      ? getStateName(state.stateCode)
                      : getProvinceName(state.stateCode)
                  ).toLowerCase();
                  return (
                    stateName.includes(query) ||
                    state.npas.some((npa) => npa.startsWith(query))
                  );
                });
              }

              if (!query && hasStates) {
                filteredStates = country.states;
              }

              if (!query || (filteredStates && filteredStates.length > 0) || !hasStates) {
                let statesArray = undefined;
                if (hasStates && filteredStates && filteredStates.length > 0) {
                  statesArray = filteredStates.map((state) => ({
                    stateCode: state.stateCode,
                    displayName:
                      countryCode === 'US'
                        ? getStateName(state.stateCode)
                        : getProvinceName(state.stateCode),
                    npas: state.npas,
                    rateStats: state.rateStats,
                  }));
                }

                result[countryCode] = {
                  displayName: countryName,
                  totalNPAs:
                    query && filteredStates
                      ? filteredStates.reduce((sum, state) => sum + state.npas.length, 0)
                      : country.npas.length,
                  hasStates: hasStates,
                  npas: country.npas,
                  states: statesArray,
                };
              }
            }
          } else {
            // Collect all other countries for "Others" group
            const filteredNPAs = query
              ? country.npas.filter((npa) => npa.startsWith(query))
              : country.npas;

            const countryMatches = !query || countryName.toLowerCase().includes(query);
            const hasMatchingNPAs = filteredNPAs.length > 0;

            if (countryMatches || hasMatchingNPAs) {
              othersCountries.push({
                countryCode: countryCode,
                countryName: countryName,
                npas: filteredNPAs,
                totalNPAs: filteredNPAs.length,
              });
              totalOthersNPAs += filteredNPAs.length;
            }
          }
        }
      });
    }

    // Add additional Others countries from categorization breakdown
    const othersMap = npaBreakdown.value.others.countries;
    if (othersMap && othersMap.size > 0) {
      othersMap.forEach((countryData, countryCode) => {
        // Skip if already included from enhanced report
        const alreadyIncluded = othersCountries.some(c => c.countryCode === countryCode);
        if (alreadyIncluded) return;

        // Skip US/Canada as they're handled separately
        if (countryCode === 'US' || countryCode === 'CA') return;

        const countryMatches = !query || countryData.countryName.toLowerCase().includes(query);
        const filteredNPAs = query
          ? countryData.npas.filter((npa) => npa.toString().startsWith(query))
          : countryData.npas;

        if ((countryMatches || filteredNPAs.length > 0) && filteredNPAs.length > 0) {
          const stringNPAs = filteredNPAs.map((npa) => npa.toString());
          
          othersCountries.push({
            countryCode: countryCode,
            countryName: countryData.countryName,
            npas: stringNPAs,
            totalNPAs: filteredNPAs.length,
          });
          totalOthersNPAs += filteredNPAs.length;
        }
      });
    }

    // Create "Others" group if we have any other countries
    if (othersCountries.length > 0) {
      result['OTHERS'] = {
        displayName: 'Others',
        totalNPAs: totalOthersNPAs,
        hasStates: false,
        hasCountries: true,
        countries: othersCountries,
        npas: othersCountries.flatMap(c => c.npas),
      };
    }

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
      } else if (countryInfo.hasCountries && countryInfo.countries) {
        // Handle "Others" group with countries as sub-items
        countryInfo.countries.forEach((country: any) => {
          const hasMatchingCountry = country.countryName.toLowerCase().includes(query);
          const hasMatchingNPA = country.npas.some((npa: string) => npa.startsWith(query));

          if (hasMatchingCountry || hasMatchingNPA) {
            expandedCountries.value.add(countryKey);
            expandedStates.value.add(country.countryCode);
          }
        });
      } else {
        // Check direct NPAs for other countries
        const hasMatchingNPA = countryInfo.npas.some((npa: string) => npa.startsWith(query));
        if (hasMatchingNPA) {
          expandedCountries.value.add(countryKey);
        }
      }
    });
  });
</script>
