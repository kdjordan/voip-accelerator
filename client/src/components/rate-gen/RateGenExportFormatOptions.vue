<template>
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
            <label class="flex items-center">
              <input
                type="checkbox"
                :checked="formatOptions.includeProviderColumn"
                @change="updateProviderColumn($event.target.checked)"
                class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
              />
              <span class="ml-2 text-sm text-fbWhite">Provider column</span>
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

    <!-- Second full-width bento box for Geographic Data Options -->
    <div class="border border-fbWhite/20 rounded-lg p-6 bg-fbBlack/50">
      <h4 class="text-lg font-semibold text-fbWhite block">Geographic Data Options</h4>
      <p class="text-xs font-normal text-fbWhite/70 mb-6">
        Add geographic context to your rate data using LERG database information
      </p>
      
      <!-- Geographic Columns -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label class="text-sm font-semibold text-fbWhite mb-3 block">Geographic Columns</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                :checked="formatOptions.includeStateColumn"
                @change="updateStateColumn($event.target.checked)"
                class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
              />
              <span class="ml-2 text-sm text-fbWhite">State/Province</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                :checked="formatOptions.includeCountryColumn"
                @change="updateCountryColumn($event.target.checked)"
                class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
              />
              <span class="ml-2 text-sm text-fbWhite">Country</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                :checked="formatOptions.includeRegionColumn"
                @change="updateRegionColumn($event.target.checked)"
                class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
              />
              <span class="ml-2 text-sm text-fbWhite">Region</span>
            </label>
          </div>
        </div>

        <!-- Advanced Options -->
        <div>
          <label class="text-sm font-semibold text-fbWhite mb-3 block">Advanced Options</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                :checked="formatOptions.includeCalculationDetails"
                @change="updateCalculationDetails($event.target.checked)"
                class="h-4 w-4 text-accent focus:ring-accent border-fbWhite/20 bg-fbHover rounded"
              />
              <span class="ml-2 text-sm text-fbWhite">Debug information</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Record count info -->
      <div class="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div class="flex items-center">
          <InformationCircleIcon class="h-5 w-5 text-blue-400 mr-2" />
          <p class="text-sm text-blue-300">
            <span class="font-medium">{{ filteredRecordCount.toLocaleString() }}</span> records will be exported with current settings
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RateGenExportOptions } from '@/types/domains/rate-gen-types';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  options: RateGenExportOptions;
  data: any[];
  totalRecords?: number;
  filteredRecords?: number;
}>();

const emit = defineEmits<{
  'update:options': [value: RateGenExportOptions];
  'update:filtered-count': [count: number];
}>();

// Use computed for reactive options
const formatOptions = computed({
  get: () => props.options,
  set: (value) => emit('update:options', value)
});

// For now, filtered count is just the total (will enhance with country filtering later)
const filteredRecordCount = computed(() => {
  return props.data?.length || props.totalRecords || 0;
});

// Emit filtered count changes
emit('update:filtered-count', filteredRecordCount.value);

// Update functions
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

function updateRegionColumn(checked: boolean) {
  emit('update:options', { ...props.options, includeRegionColumn: checked });
}

function updateProviderColumn(checked: boolean) {
  emit('update:options', { ...props.options, includeProviderColumn: checked });
}

function updateCalculationDetails(checked: boolean) {
  emit('update:options', { ...props.options, includeCalculationDetails: checked });
}
</script>