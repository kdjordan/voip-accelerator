<template>
  <div v-if="exportType === 'rate-sheet'">
    <div class="space-y-4">
      <!-- First bento box for NPANXX Format, Additional Columns, and Country Code -->
      <div class="border border-fbWhite/20 rounded-lg p-6 bg-fbBlack/50">
        <h4 class="text-lg font-semibold text-fbWhite mb-6">Format Options</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- NPANXX Format Section -->
          <div>
            <label class="text-sm font-semibold text-fbWhite mb-3 block">NPANXX Format</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  :checked="formatOptions.npanxxFormat === 'combined'"
                  @change="updateNpanxxFormat('combined')"
                  class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
                />
                <span class="ml-2 text-sm text-fbWhite">Combined (213555)</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  :checked="formatOptions.npanxxFormat === 'split'"
                  @change="updateNpanxxFormat('split')"
                  class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
                />
                <span class="ml-2 text-sm text-fbWhite">Split (213 | 555)</span>
              </label>
            </div>
          </div>

          <!-- Additional Columns Section -->
          <div>
            <label class="text-sm font-semibold text-fbWhite mb-3 block">Additional Columns</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  :checked="formatOptions.includeStateColumn"
                  @change="updateStateColumn($event.target.checked)"
                  class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
                />
                <span class="ml-2 text-sm text-fbWhite">State column</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  :checked="formatOptions.includeCountryColumn"
                  @change="updateCountryColumn($event.target.checked)"
                  class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
                />
                <span class="ml-2 text-sm text-fbWhite">Country column</span>
              </label>
            </div>
          </div>

          <!-- Country Code Section -->
          <div>
            <label class="text-sm font-semibold text-fbWhite mb-3 block">Country Code</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  :checked="formatOptions.includeCountryCode"
                  @change="updateCountryCode($event.target.checked)"
                  class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
                />
                <span class="ml-2 text-sm text-fbWhite">Include (1) prefix for North American numbers</span>
              </label>
            </div>
          </div>

        </div>
      </div>

      <!-- Second full-width bento box for Countries in Current Data -->
      <div class="border border-fbWhite/20 rounded-lg p-6 bg-fbBlack/50">
        <h4 class="text-lg font-semibold text-fbWhite block">Countries in Current Data</h4>
        <p class="text-xs font-normal text-fbWhite/70 mb-6">
          Uncheck countries to exclude from export
        </p>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
          <label
            v-for="country in filteredCountriesForSelection"
            :key="country"
            class="flex items-center text-xs"
          >
            <input
              type="checkbox"
              :checked="!formatOptions.selectedCountries.includes(country)"
              @change="updateCountrySelection(country, $event.target.checked)"
              class="h-3 w-3 text-accent focus:ring-accent border-fbWhite/20 bg-fbBlack rounded"
            />
            <span class="ml-1 text-fbWhite">{{ countryDisplayNames.get(country) || country }}</span>
          </label>
        </div>

        <!-- Warning when no data would be exported -->
        <div v-if="filteredRecordCount === 0" class="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div class="flex items-center">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-2" />
            <div>
              <p class="text-sm font-medium text-red-400">No Data to Export</p>
              <p class="text-xs text-red-300">Your current country selections would exclude all data. Check at least one country to include in the export.</p>
            </div>
          </div>
        </div>

        <!-- Filtered data warning -->
        <div v-if="isFiltered" class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div class="flex items-center">
            <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400 mr-2" />
            <p class="text-sm text-yellow-400">
              You are exporting a filtered subset of data. Make sure this is intentional.
            </p>
          </div>
        </div>
        
        <!-- Record count info -->
        <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div class="flex items-center">
            <InformationCircleIcon class="h-5 w-5 text-blue-400 mr-2" />
            <p class="text-sm text-blue-300">
              <span class="font-medium">{{ filteredRecordCount.toLocaleString() }}</span> records will be exported with current settings
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { USExportFormatOptions } from '@/types/exports';
import { useLergStoreV2 } from '@/stores/lerg-store-v2';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  options: USExportFormatOptions;
  exportType: 'rate-sheet' | 'comparison';
  data: any[];
  totalRecords?: number;
  filteredRecords?: number;
}>();

const emit = defineEmits<{
  'update:options': [value: USExportFormatOptions];
  'update:filtered-count': [count: number];
}>();

// Use computed for reactive options - eliminates circular updates
const formatOptions = computed({
  get: () => props.options,
  set: (value) => emit('update:options', value)
});

// Simplified country selection - selectedCountries now represents countries to EXCLUDE
// Empty array = export all countries
// Non-empty array = exclude these countries

// Get countries from LERG store
const lergStore = useLergStoreV2();
const availableCountries = computed(() => 
  lergStore.getAllCountries.map(country => country.code)
);

// Get countries that are actually present in the current filtered data
const filteredCountriesForSelection = computed(() => {
  if (props.data && props.data.length > 0) {
    // Extract unique countries from the actual data
    const dataCountries = new Set<string>();
    props.data.forEach(row => {
      // First check for direct country fields
      let country = row.country || row.countryCode || row.country_code;
      
      // If no direct country field, derive from NPA using LERG store
      if (!country && row.npa) {
        const npaInfo = lergStore.getNPAInfo(row.npa);
        country = npaInfo?.country_code;
      }
      
      if (country) {
        dataCountries.add(country);
      }
    });
    
    return Array.from(dataCountries).sort();
  }
  // Fallback to all available countries if no data
  return availableCountries.value;
});

// Check if we're exporting filtered data
const isFiltered = computed(() => {
  return props.filteredRecords !== undefined && 
         props.totalRecords !== undefined && 
         props.filteredRecords < props.totalRecords;
});

// Get full country names for display
const countryDisplayNames = computed(() => {
  const nameMap = new Map<string, string>();
  
  // Build a map of country codes to full names using LERG data
  lergStore.getAllCountries.forEach(country => {
    nameMap.set(country.code, country.name);
  });
  
  return nameMap;
});

// Count how many records would be exported with current filters
const filteredRecordCount = computed(() => {
  if (!props.data || props.data.length === 0) return 0;
  
  // If no countries are selected for exclusion, return all records
  if (props.options.selectedCountries.length === 0) {
    return props.data.length;
  }
  
  // Count records that would NOT be excluded
  let count = 0;
  props.data.forEach(row => {
    // Get the country for this row
    let country = row.country || row.countryCode || row.country_code;
    
    // If no direct country field, derive from NPA using LERG store
    if (!country && row.npa) {
      const npaInfo = lergStore.getNPAInfo(row.npa);
      country = npaInfo?.country_code;
    }
    
    if (country) {
      // Check if this country is in the exclusion list
      const isExcluded = props.options.selectedCountries.includes(country);
      if (!isExcluded) {
        count++;
      }
    }
  });
  
  return count;
});


// Watch for filtered count changes and emit to parent
watch(filteredRecordCount, (newCount) => {
  emit('update:filtered-count', newCount);
}, { immediate: true });

// Update functions - direct emit without watchers
function updateNpanxxFormat(format: 'combined' | 'split') {
  emit('update:options', { ...props.options, npanxxFormat: format });
}

function updateCountryCode(checked: boolean) {
  emit('update:options', { ...props.options, includeCountryCode: checked });
}

function updateStateColumn(checked: boolean) {
  emit('update:options', { ...props.options, includeStateColumn: checked });
}

function updateCountryColumn(checked: boolean) {
  emit('update:options', { ...props.options, includeCountryColumn: checked });
}

function updateCountrySelection(country: string, checked: boolean) {
  // checked = true means country is INCLUDED (not in exclusion list)
  // checked = false means country is EXCLUDED (add to exclusion list)
  const newCountries = checked 
    ? props.options.selectedCountries.filter(c => c !== country) // Remove from exclusion list
    : [...props.options.selectedCountries, country]; // Add to exclusion list
  
  emit('update:options', { 
    ...props.options, 
    selectedCountries: newCountries,
    excludeCountries: true // Always use exclude mode for this simplified approach
  });
}


</script>