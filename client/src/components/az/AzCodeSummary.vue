<template>
  <!-- Use enhancedReport for conditional rendering and data display -->
  <div v-if="enhancedReport" class="mt-8 pt-8 border-t border-gray-700/50">
    <!-- Code Report heading with file name pill from enhancedReport -->
    <div class="mb-4 flex items-center justify-between">
      <span class="text-xl text-fbWhite font-secondary">Code Report</span>
      <div
        class="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 border border-accent/50"
      >
        <span class="text-sm text-accent">{{ enhancedReport.fileInfo.fileName }}</span>
      </div>
    </div>

    <!-- Code Report Content - Dark bento box style -->
    <div class="bg-gray-900 rounded-lg p-4 space-y-4">
      <!-- Basic Stats Section (Similar to US Version) -->
      <div class="bg-gray-800 p-3 rounded-lg">
        <div class="text-gray-400 mb-1">Total Codes:</div>
        <div class="text-xl text-white">
          {{ enhancedReport.fileInfo.totalCodes?.toLocaleString() || 'N/A' }}
        </div>
      </div>

      <!-- Code Statistics Section -->
      <div class="bg-gray-800 p-3 rounded-lg">
        <div class="text-gray-400 mb-2">File Statistics:</div>
        <div class="grid grid-cols-3 gap-2">
          <!-- Unique Destinations -->
          <div class="bg-gray-900 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-sm mb-1">Unique Destinations</div>
            <div class="text-lg text-white">
              {{ enhancedReport.destinationStats.totalDestinations?.toLocaleString() || 'N/A' }}
            </div>
          </div>
          <!-- Unique Dial Codes -->
          <div class="bg-gray-900 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-sm mb-1">Unique Dial Codes</div>
            <div class="text-lg text-white">
              {{ enhancedReport.codeStats.fileCodeCount?.toLocaleString() || 'N/A' }}
            </div>
          </div>
          <!-- Unique Dest % -->
          <div class="bg-gray-900 p-2 rounded-lg text-center">
            <div class="text-gray-400 text-sm mb-1">Unique Dest %</div>
            <div class="text-lg text-white">
              {{ enhancedReport.destinationStats.uniqueDestinationPercent?.toFixed(2) ?? 'N/A' }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Country Coverage Section (Now in its own bento box) -->
      <div class="bg-gray-800 p-3 rounded-lg">
        <h4 class="text-gray-400 mb-2">
          Country Breakdown ({{ filteredCountries.length }} found)
        </h4>

        <!-- Search Input -->
        <div class="mb-3 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by country, ISO, breakout, or dial code..."
            class="w-full bg-gray-900 px-3 py-2 text-sm rounded border border-gray-700 focus:border-accent focus:outline-none text-white pr-8"
          />
          <span
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer text-lg"
          >
            &times;
          </span>
        </div>

        <!-- Scrollable List Area -->
        <div class="max-h-96 overflow-y-auto space-y-1.5 pr-2 bg-gray-900/50 p-2 rounded">
          <div v-if="filteredCountries.length > 0">
            <!-- Use <details> for native expand/collapse -->
            <details
              v-for="(country, index) in filteredCountries"
              :key="country.isoCode || index"
              class="bg-gray-800/80 rounded overflow-hidden group"
            >
              <!-- Summary Row -->
              <summary
                class="p-2 cursor-pointer list-none flex justify-between items-center group-open:bg-gray-700/50 transition-colors duration-150 hover:bg-gray-700/30"
              >
                <div class="flex-1 min-w-0 mr-2">
                  <span class="font-medium text-white text-sm truncate" :title="country.countryName">
                    {{ country.countryName || 'Unknown' }}
                  </span>
                  <span class="text-xs text-gray-400 ml-1.5">({{ country.isoCode || 'N/A' }})</span>
                </div>
                <div class="text-right text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                  {{ country.uniqueBreakoutCount }} breakout{{ country.uniqueBreakoutCount !== 1 ? 's' : '' }}
                  <!-- Chevron icon for visual cue -->
                  <span class="inline-block transform transition-transform duration-150 group-open:rotate-90 ml-1">
                    ▶
                  </span>
                </div>
              </summary>

              <!-- Expanded Content: Breakout Details -->
              <div class="p-3 bg-gray-900/30 border-t border-gray-700/50 text-xs space-y-2">
                <div v-if="country.breakouts && country.breakouts.length > 0">
                  <div v-for="breakout in country.breakouts" :key="breakout.breakoutName" class="ml-2">
                    <div class="font-medium text-gray-300 truncate" :title="breakout.breakoutName">
                      {{ breakout.breakoutName }}
                    </div>
                    <div class="text-gray-400 pl-2 text-xxs break-all">
                      {{ breakout.dialCodes.join(', ') }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-gray-500 italic ml-2">
                  No specific breakouts found in file for this country.
                </div>
              </div>
            </details>
          </div>
          <div v-else class="text-gray-500 text-center py-4">
            {{
              searchQuery ? 'No matching countries or breakouts found.' : 'No country breakdown data available.'
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="mt-8 pt-8 border-t border-gray-700/50 text-center text-gray-500">
    Generating enhanced report...
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAzStore } from '@/stores/az-store';
import type { AZEnhancedCodeReport, AZCountryBreakdown } from '@/types/domains/az-types';

// Define props
const props = defineProps<{
  componentId: string; // e.g., 'az1' or 'az2'
}>();

const azStore = useAzStore();

// Get the filename associated with this component instance
const fileName = computed<string>(() => {
  return azStore.getFileNameByComponent(props.componentId);
});

// Get the enhanced report data from the store based on the filename
const enhancedReport = computed<AZEnhancedCodeReport | null>(() => {
  const name = fileName.value;
  // Ensure we have a filename before trying to fetch the report
  if (!name) {
    console.warn(`[AZCodeSummary] No filename found for componentId: ${props.componentId}`);
    return null;
  }
  const report = azStore.getEnhancedReportByFile(name);
  if (!report) {
    // console.log(`[AZCodeSummary] Report not yet available for: ${name}`);
  }
  return report;
});

// Search functionality state
const searchQuery = ref('');

// Computed property for filtered countries - updated search logic
const filteredCountries = computed<AZCountryBreakdown[]>(() => {
  if (!enhancedReport.value?.countries) return [];

  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return enhancedReport.value.countries;

  // First pass: Find all countries that potentially match on any field
  const potentiallyRelevantCountries = enhancedReport.value.countries.filter((country) => {
    // Check country name and ISO code
    if (
      country.countryName?.toLowerCase().includes(query) ||
      country.isoCode?.toLowerCase().includes(query)
    ) {
      return true;
    }
    // Check within breakouts (name or any dial code)
    if (country.breakouts) {
      for (const breakout of country.breakouts) {
        if (breakout.breakoutName?.toLowerCase().includes(query)) {
          return true;
        }
        if (breakout.dialCodes?.some((code) => code.includes(query))) {
          return true;
        }
      }
    }
    return false;
  });

  // Check if the query looks like a dial code search (contains digits)
  const isDialCodeQuery = /\d/.test(query) && query.length >= 2; // Adjust length check if needed

  if (!isDialCodeQuery) {
    // If not a dial code query, return the broadly matched countries
    return potentiallyRelevantCountries;
  } else {
    // If it looks like a dial code search, refine the results:
    // 1. Map each relevant country to a new object with only matching breakouts
    // 2. Filter out countries that have no breakouts left after filtering by dial code
    const results = potentiallyRelevantCountries
      .map((country) => {
        const matchingBreakouts = country.breakouts?.filter((b) =>
          // Match only if the dial code STARTS WITH the query
          b.dialCodes.some((c) => c.startsWith(query))
        ) || [];
        return {
          ...country,
          breakouts: matchingBreakouts,
          uniqueBreakoutCount: matchingBreakouts.length, // Update count
        };
      })
      .filter((country) => country.breakouts.length > 0); // Remove countries with no matching breakouts

    return results;
  }
});
</script>

<style scoped>
/* Ensure list-none removes default marker from summary */
summary {
  list-style: none;
}
summary::-webkit-details-marker {
  display: none; /* Chrome, Safari, Edge */
}
summary::marker {
  display: none; /* Firefox */
}

/* Custom tiny text size */
.text-xxs {
  font-size: 0.65rem; /* Adjust as needed */
  line-height: 1rem;
}

/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: theme('colors.gray.700');
  border-radius: 3px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: theme('colors.gray.500');
  border-radius: 3px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: theme('colors.gray.400');
}
</style>
