<template>
  <div class="border border-fbWhite/20 rounded-lg p-4">
    <h4 class="text-sm font-medium text-fbWhite mb-3">Format Options</h4>
    
    <div class="space-y-4">
      <!-- NPANXX Format -->
      <div>
        <label class="text-sm font-medium text-fbWhite/70">NPANXX Format</label>
        <div class="mt-2 space-y-2">
          <label class="flex items-center">
            <input
              type="radio"
              :checked="formatOptions.npanxxFormat === 'combined'"
              @change="updateNpanxxFormat('combined')"
              class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover"
            />
            <span class="ml-2 text-sm text-fbWhite">Combined NPANXX (e.g., 213555)</span>
          </label>
          <label class="flex items-center">
            <input
              type="radio"
              :checked="formatOptions.npanxxFormat === 'split'"
              @change="updateNpanxxFormat('split')"
              class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover"
            />
            <span class="ml-2 text-sm text-fbWhite">Split NPA/NXX columns (e.g., 213 | 555)</span>
          </label>
        </div>
      </div>

      <!-- Country Code Options -->
      <div>
        <label class="text-sm font-medium text-fbWhite/70">Country Code</label>
        <div class="mt-2">
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

      <!-- Additional Columns -->
      <div>
        <label class="text-sm font-medium text-fbWhite/70">Additional Columns</label>
        <div class="mt-2 space-y-2">
          <label class="flex items-center">
            <input
              type="checkbox"
              :checked="formatOptions.includeStateColumn"
              @change="updateStateColumn($event.target.checked)"
              class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
            />
            <span class="ml-2 text-sm text-fbWhite">Include state abbreviation column</span>
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              :checked="formatOptions.includeMetroColumn"
              @change="updateMetroColumn($event.target.checked)"
              class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
            />
            <span class="ml-2 text-sm text-fbWhite">Include metro area column</span>
          </label>
        </div>
      </div>

      <!-- Country Filter -->
      <div>
        <label class="text-sm font-medium text-fbWhite/70">Country Filter</label>
        <div class="mt-2 space-y-2">
          <label class="flex items-center">
            <input
              type="radio"
              v-model="countryFilterMode"
              value="all"
              class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover"
            />
            <span class="ml-2 text-sm text-fbWhite">Include all countries</span>
          </label>
          <label class="flex items-center">
            <input
              type="radio"
              v-model="countryFilterMode"
              value="include"
              class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover"
            />
            <span class="ml-2 text-sm text-fbWhite">Include only selected countries</span>
          </label>
          <label class="flex items-center">
            <input
              type="radio"
              v-model="countryFilterMode"
              value="exclude"
              class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover"
            />
            <span class="ml-2 text-sm text-fbWhite">Exclude selected countries</span>
          </label>
        </div>

        <!-- Country Selection -->
        <div v-if="countryFilterMode !== 'all'" class="mt-3">
          <label class="block text-xs font-medium text-fbWhite/70 mb-1">
            Select countries to {{ countryFilterMode }}:
          </label>
          <div class="grid grid-cols-3 gap-2 p-3 bg-fbHover rounded max-h-32 overflow-y-auto">
            <label
              v-for="country in availableCountries"
              :key="country"
              class="flex items-center text-sm"
            >
              <input
                type="checkbox"
                :value="country"
                :checked="formatOptions.selectedCountries.includes(country)"
                @change="updateSelectedCountries(country, $event.target.checked)"
                class="h-3 w-3 text-accent focus:ring-accent border-fbWhite/20 bg-fbBlack rounded"
              />
              <span class="ml-1 text-fbWhite">{{ country }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { USExportFormatOptions } from '@/types/exports';

const props = defineProps<{
  options: USExportFormatOptions;
  exportType: 'rate-sheet' | 'comparison';
}>();

const emit = defineEmits<{
  'update:options': [value: USExportFormatOptions];
}>();

// Use computed for reactive options - eliminates circular updates
const formatOptions = computed({
  get: () => props.options,
  set: (value) => emit('update:options', value)
});

// Country filter mode for UI
const countryFilterMode = computed({
  get: () => {
    if (props.options.selectedCountries.length > 0) {
      return props.options.excludeCountries ? 'exclude' : 'include';
    }
    return 'all';
  },
  set: (mode) => {
    const newOptions = { ...props.options };
    if (mode === 'all') {
      newOptions.selectedCountries = [];
      newOptions.excludeCountries = false;
    } else if (mode === 'exclude') {
      newOptions.excludeCountries = true;
    } else {
      newOptions.excludeCountries = false;
    }
    emit('update:options', newOptions);
  }
});

// Common countries in telecom data
const availableCountries = [
  'US', 'CA', 'MX', 'PR', 'VI', 'GU', 
  'AS', 'MP', 'BS', 'BB', 'BM', 'DO',
  'GD', 'JM', 'KY', 'TC', 'TT', 'VG'
];

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

function updateMetroColumn(checked: boolean) {
  emit('update:options', { ...props.options, includeMetroColumn: checked });
}

function updateSelectedCountries(country: string, checked: boolean) {
  const newCountries = checked 
    ? [...props.options.selectedCountries, country]
    : props.options.selectedCountries.filter(c => c !== country);
  
  emit('update:options', { ...props.options, selectedCountries: newCountries });
}


</script>