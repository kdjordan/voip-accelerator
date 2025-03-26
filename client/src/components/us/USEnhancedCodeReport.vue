<template>
  <div class="space-y-6 bg-gray-800 p-6 rounded-lg">
    <div v-if="report" class="space-y-6">
      <h2 class="text-xl text-white font-semibold">Enhanced Code Report</h2>

      <!-- Country List -->
      <div
        v-for="country in report.file1.countries"
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
                <!-- State Header -->
                <div
                  @click="toggleStateExpanded(country.countryCode, state.stateCode)"
                  class="px-3 py-3 w-full hover:bg-gray-700/50 transition-colors cursor-pointer flex items-center"
                >
                  <ChevronRightIcon
                    class="h-5 w-5 text-gray-400 transition-transform mr-3"
                    :class="{ 'rotate-90': isStateExpanded(country.countryCode, state.stateCode) }"
                  />

                  <div class="flex-1">
                    <div class="font-medium text-white">{{ state.stateName }}</div>
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
import { ref, reactive, computed } from 'vue';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import type { USEnhancedCodeReport } from '@/types/domains/us-types';
import { useUsStore } from '@/stores/us-store';

const props = defineProps<{
  report: USEnhancedCodeReport | null;
}>();

// Set up state
const expandedCountries = reactive(new Set<string>());
const expandedStates = reactive(new Map<string, Set<string>>());

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
</script>
