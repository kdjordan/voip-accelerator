<template>
  <div v-if="exportType === 'rate-sheet'">
    <h4 class="text-sm font-medium text-fbWhite mb-4">Format Options</h4>
    
    <!-- 2-column bento grid layout -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Left Column -->
      <div class="space-y-4">
        <!-- NPANXX Format Bento Box -->
        <div class="border border-fbWhite/20 rounded-lg p-4 bg-fbBlack/50">
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

        <!-- Additional Columns Bento Box -->
        <div class="border border-fbWhite/20 rounded-lg p-4 bg-fbBlack/50">
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
      </div>

      <!-- Right Column -->
      <div class="space-y-4">
        <!-- Country Code Prefix Bento Box -->
        <div class="border border-fbWhite/20 rounded-lg p-4 bg-fbBlack/50">
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

        <!-- Countries in Current Data Bento Box -->
        <div class="border border-fbWhite/20 rounded-lg p-4 bg-fbBlack/50">
          <label class="text-sm font-semibold text-fbWhite mb-3 block">
            Countries in Current Data
            <span class="text-xs font-normal text-fbWhite/70 block mt-1">
              Uncheck countries to exclude from export
            </span>
          </label>
          <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
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
        </div>

        <!-- Session History Bento Box (Rate Sheet Only) -->
        <div v-if="exportType === 'rate-sheet'" class="border border-fbWhite/20 rounded-lg p-4 bg-fbBlack/50">
          <label class="text-sm font-semibold text-fbWhite mb-3 block">
            Session History
            <span class="text-xs font-normal text-fbWhite/70 block mt-1">
              Include record of adjustments made this session
            </span>
          </label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="includeSessionHistory"
                :disabled="adjustedNpasCount === 0"
                class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
              />
              <span class="ml-2 text-sm text-fbWhite">
                <template v-if="adjustedNpasCount > 0">
                  Include session history ({{ adjustedNpasCount }} NPAs adjusted)
                </template>
                <template v-else>
                  Include session history
                </template>
              </span>
            </label>
            <p v-if="adjustedNpasCount === 0" class="text-xs text-fbWhite/50">
              No adjustments made this session
            </p>
            <p v-else class="text-xs text-fbWhite/70">
              Downloads additional .txt file with adjustment details
            </p>
          </div>
        </div>
      </div>
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

    <!-- Record count info -->
    <div v-else class="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <div class="flex items-center">
        <InformationCircleIcon class="h-5 w-5 text-blue-400 mr-2" />
        <p class="text-sm text-blue-300">
          <span class="font-medium">{{ filteredRecordCount.toLocaleString() }}</span> records will be exported with current settings
        </p>
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
  adjustedNpas?: Set<string>;
  includeSessionHistory?: boolean;
}>();

const emit = defineEmits<{
  'update:options': [value: USExportFormatOptions];
  'update:filtered-count': [count: number];
  'update:include-session-history': [value: boolean];
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

// Session history state
const includeSessionHistory = computed({
  get: () => props.includeSessionHistory || false,
  set: (value) => emit('update:include-session-history', value)
});
const adjustedNpasCount = computed(() => props.adjustedNpas?.size || 0);

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