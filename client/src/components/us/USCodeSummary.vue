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

        <!-- NPAs Section with Coverage -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">US NPA Statistics:</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">LERG Count</div>
              <div class="text-lg text-white">{{ totalLergCodes }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">File Count</div>
              <div class="text-lg text-white">{{ totalFileNPAs }}</div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Coverage</div>
              <div class="text-lg text-white">{{ overallCoveragePercentage }}%</div>
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

            <!-- Countries Section -->
            <div v-else class="space-y-4">
              <!-- No Results Message -->
              <div
                v-if="searchQuery && !isFiltering && filteredCountries.length === 0"
                class="text-center py-4 text-gray-400"
              >
                No results found for "{{ searchQuery }}"
              </div>

              <!-- Countries List -->
              <template v-for="country in filteredCountries" :key="country.countryCode">
                <!-- Only render the country block if coverage > 0 -->
                <template v-if="country.npaCoverage > 0">
                  <div class="bg-gray-900 p-3 rounded-lg">
                    <div
                      @click="toggleCountryExpanded(country.countryCode)"
                      class="flex justify-between items-center cursor-pointer"
                    >
                      <span class="text-gray-300">{{ country.countryName }}</span>
                      <div class="flex items-center space-x-2">
                        <span class="text-gray-400 text-sm">
                          {{ formatCoverage(country.npaCoverage) }}% Coverage
                        </span>
                        <span
                          class="transform transition-transform"
                          :class="{ 'rotate-180': expandedCountries.has(country.countryCode) }"
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

                    <!-- States/Provinces Section -->
                    <div v-if="expandedCountries.has(country.countryCode)" class="mt-3 space-y-2">
                      <template v-for="state in country.states" :key="state.stateCode">
                        <div class="bg-gray-800/60 rounded overflow-hidden">
                          <div
                            @click="toggleStateExpanded(state.stateCode)"
                            class="px-3 py-2 cursor-pointer hover:bg-gray-700/60 flex justify-between items-center"
                          >
                            <span class="text-gray-300">{{
                              getStateName(state.stateCode, country.countryCode)
                            }}</span>
                            <div class="flex items-center space-x-2">
                              <span class="text-gray-400 text-sm">
                                {{ formatCoverage(state.coverage) }}% Coverage
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

                          <!-- NPAs List -->
                          <div
                            v-if="expandedStates.has(state.stateCode)"
                            class="px-3 py-2 bg-black/20 border-t border-gray-700/30"
                          >
                            <!-- Rate Stats -->
                            <div class="mb-3 grid grid-cols-3 gap-2">
                              <div class="bg-gray-800/50 px-2 py-1.5 rounded">
                                <div class="text-xs text-gray-400 mb-1">IE Rate</div>
                                <div class="text-sm text-white">
                                  ${{ formatRate(state.rateStats?.interstate?.average) }}
                                </div>
                              </div>
                              <div class="bg-gray-800/50 px-2 py-1.5 rounded">
                                <div class="text-xs text-gray-400 mb-1">IA Rate</div>
                                <div class="text-sm text-white">
                                  ${{ formatRate(state.rateStats?.intrastate?.average) }}
                                </div>
                              </div>
                              <div class="bg-gray-800/50 px-2 py-1.5 rounded">
                                <div class="text-xs text-gray-400 mb-1">IJ Rate</div>
                                <div class="text-sm text-white">
                                  ${{ formatRate(state.rateStats?.indeterminate?.average) }}
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
                    </div>
                  </div>
                </template>
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

  // Basic stats
  const totalLergCodes = computed(() => lergStore.calculateTotalLergCodes() || 0);
  const totalFileNPAs = computed(() => {
    const countries = enhancedReport.value?.file1?.countries;
    if (!countries) return 0;
    return countries.reduce(
      (total: number, country: USCountryBreakdown) => total + (country.npas?.length || 0),
      0
    );
  });

  const overallCoveragePercentage = computed(() => {
    if (!enhancedReport.value?.file1?.countries?.[0]) return 0;
    return formatCoverage(enhancedReport.value.file1.countries[0].npaCoverage);
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

          // Check if any NPA in this state matches
          return state.npas.some((npa) => npa.toString().includes(query));
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

  // Add watcher to auto-expand matching items
  watch(searchQuery, async (newQuery) => {
    if (!newQuery) {
      expandedStates.value.clear();
      expandedCountries.value.clear();
      return;
    }

    const query = newQuery.toLowerCase();
    await nextTick();

    filteredCountries.value.forEach((country) => {
      if (country.countryName.toLowerCase().includes(query)) {
        expandedCountries.value.add(country.countryCode);
        return;
      }

      country.states?.forEach((state) => {
        const stateName = getStateName(state.stateCode, country.countryCode).toLowerCase();
        const hasMatchingNPA = state.npas.some((npa) => npa.toString().includes(query));

        if (stateName.includes(query) || hasMatchingNPA) {
          expandedCountries.value.add(country.countryCode);
          expandedStates.value.add(state.stateCode);
        }
      });
    });
  });
</script>
