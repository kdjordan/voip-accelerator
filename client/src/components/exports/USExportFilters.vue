<template>
  <div class="border border-fbWhite/20 rounded-lg p-4 bg-fbHover">
    <h4 class="text-sm font-medium text-fbWhite mb-3">Active Filters</h4>
    
    <div class="space-y-2">
      <!-- Record Count -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-fbWhite/70">Records to export:</span>
        <span class="text-sm font-medium text-fbWhite">
          {{ filteredRecords.toLocaleString() }} of {{ totalRecords.toLocaleString() }}
        </span>
      </div>

      <!-- States Filter -->
      <div v-if="filters.states?.length > 0" class="flex items-start">
        <span class="text-sm text-fbWhite/70 mr-2">States:</span>
        <div class="flex-1">
          <span class="text-sm text-fbWhite">
            {{ filters.excludeStates ? 'Excluding: ' : '' }}
            <span class="font-medium">{{ filters.states.join(', ') }}</span>
          </span>
        </div>
      </div>

      <!-- NPANXX Search -->
      <div v-if="filters.npanxxSearch" class="flex items-start">
        <span class="text-sm text-fbWhite/70 mr-2">NPANXX Search:</span>
        <span class="text-sm font-medium text-fbWhite">{{ filters.npanxxSearch }}</span>
      </div>

      <!-- Metro Areas -->
      <div v-if="filters.metroAreas?.length > 0" class="flex items-start">
        <span class="text-sm text-fbWhite/70 mr-2">Metro Areas:</span>
        <div class="flex-1">
          <span class="text-sm font-medium text-fbWhite">{{ filters.metroAreas.join(', ') }}</span>
        </div>
      </div>

      <!-- Countries -->
      <div v-if="filters.countries?.length > 0" class="flex items-start">
        <span class="text-sm text-fbWhite/70 mr-2">Countries:</span>
        <div class="flex-1">
          <span class="text-sm text-fbWhite">
            {{ filters.excludeCountries ? 'Excluding: ' : 'Including: ' }}
            <span class="font-medium">{{ filters.countries.join(', ') }}</span>
          </span>
        </div>
      </div>

      <!-- Rate Types (for comparison exports) -->
      <div v-if="filters.rateTypes?.length > 0" class="flex items-start">
        <span class="text-sm text-fbWhite/70 mr-2">Rate Types:</span>
        <div class="flex-1">
          <span class="text-sm font-medium text-fbWhite">{{ filters.rateTypes.join(', ') }}</span>
        </div>
      </div>

      <!-- No Filters Message -->
      <div v-if="!hasActiveFilters" class="text-sm text-fbWhite/70">
        No filters applied - exporting all available records
      </div>
    </div>

    <!-- Warning if filtered -->
    <div v-if="isFiltered" class="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
      <p class="text-sm text-yellow-400">
        <ExclamationTriangleIcon class="inline h-4 w-4 mr-1" />
        You are exporting a filtered subset of data. Make sure this is intentional.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import type { USExportFilters } from '@/types/exports';

const props = defineProps<{
  filters: USExportFilters;
  totalRecords: number;
  filteredRecords: number;
}>();

const hasActiveFilters = computed(() => {
  return (
    (props.filters.states?.length > 0) ||
    props.filters.npanxxSearch ||
    (props.filters.metroAreas?.length > 0) ||
    (props.filters.countries?.length > 0) ||
    (props.filters.rateTypes?.length > 0)
  );
});

const isFiltered = computed(() => {
  return props.filteredRecords < props.totalRecords;
});
</script>