<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="bg-gray-800 rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <h3 class="text-sm font-medium text-gray-300">Table Controls</h3>
          <span class="text-sm text-gray-400">
            Showing {{ filteredData.length }} destinations
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handleClearData"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-md text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 transition-colors"
          >
            <TrashIcon class="w-4 h-4" />
            Clear Rate Sheet Data
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-3 gap-4">
        <!-- Filter -->
        <div>
          <label class="block text-sm text-gray-400 mb-1">View Filter</label>
          <select
            v-model="filterStatus"
            class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
          >
            <option value="all">All Destinations</option>
            <option value="conflicts">Rate Conflicts</option>
            <option value="no-conflicts">No Conflicts</option>
          </select>
        </div>
        
        <!-- Search -->
        <div>
          <label class="block text-sm text-gray-400 mb-1">Search</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search destinations..."
            class="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-300 px-3 py-2"
          />
        </div>
        
        <!-- Actions Column -->
        <div>
          <!-- Bulk Actions -->
          <div v-if="store.getDiscrepancyCount > 0">
            <label class="block text-sm text-gray-400 mb-1">Bulk Actions</label>
            <div class="space-y-2">
              <!-- Progress bar when processing -->
              <div v-if="isBulkProcessing" class="w-full bg-gray-700 rounded-full h-2">
                <div
                  class="bg-accent h-2 rounded-full transition-all duration-200"
                  :style="{ width: `${(processedCount / totalToProcess) * 100}%` }"
                ></div>
              </div>
              
              <!-- Action buttons -->
              <div class="flex gap-2">
                <button
                  @click="handleBulkUpdate('highest')"
                  :disabled="isBulkProcessing"
                  class="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300"
                  :class="{ 'opacity-50 cursor-not-allowed': isBulkProcessing }"
                >
                  {{ isBulkProcessing ? `Processing ${processedCount}/${totalToProcess}...` : 'Use Highest' }}
                </button>
                <button
                  @click="handleBulkUpdate('lowest')"
                  :disabled="isBulkProcessing"
                  class="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300"
                  :class="{ 'opacity-50 cursor-not-allowed': isBulkProcessing }"
                >
                  {{ isBulkProcessing ? `Processing ${processedCount}/${totalToProcess}...` : 'Use Lowest' }}
                </button>
              </div>
            </div>
          </div>
          <!-- Export Action -->
          <div v-else-if="!isBulkProcessing && store.getDiscrepancyCount === 0">
            <label class="block text-sm text-gray-400 mb-1">Actions</label>
            <button
              @click="handleExport"
              class="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-md text-green-400 hover:text-green-300 bg-green-400/10 hover:bg-green-400/20 transition-colors"
            >
              <ArrowDownTrayIcon class="w-4 h-4" />
              Export Rate Sheet
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="filteredData.length > 0" class="overflow-hidden rounded-lg bg-gray-800 shadow">
      <table class="min-w-full divide-y divide-gray-700">
        <thead class="bg-gray-900/50">
          <tr>
            <th scope="col" class="w-8 px-3 py-3"></th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">Destination</th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">Codes</th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">Rate</th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">Effective</th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">Duration</th>
            <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-300">Increments</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <template v-for="group in filteredData" :key="group.destinationName">
            <!-- Main Row -->
            <tr 
              class="hover:bg-gray-700/50 cursor-pointer"
              :class="{ 'bg-red-900/10': group.hasDiscrepancy }"
              @click="toggleExpand(group.destinationName)"
            >
              <td class="px-3 py-4">
                <ChevronRightIcon
                  class="h-5 w-5 text-gray-400 transition-transform"
                  :class="{ 'rotate-90': expandedRows.includes(group.destinationName) }"
                />
              </td>
              <td class="px-3 py-4 text-sm">
                <div class="flex items-center">
                  <span class="font-medium text-white">{{ group.destinationName }}</span>
                  <div 
                    v-if="group.hasDiscrepancy"
                    class="ml-2 inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20"
                  >
                    Rate Conflict
                  </div>
                </div>
              </td>
              <td class="px-3 py-4 text-sm text-gray-300">
                {{ group.codes.length }} codes
              </td>
              <td class="px-3 py-4 text-sm text-gray-300">
                <template v-if="!group.hasDiscrepancy">
                  {{ formatRate(group.rates[0].rate) }}
                </template>
                <template v-else>
                  Multiple Rates
                </template>
              </td>
              <td class="px-3 py-4 text-sm text-gray-300">{{ group.effectiveDate }}</td>
              <td class="px-3 py-4 text-sm text-gray-300">{{ group.minDuration }}</td>
              <td class="px-3 py-4 text-sm text-gray-300">{{ group.increments }}</td>
            </tr>
            
            <!-- Expanded Details -->
            <tr v-if="expandedRows.includes(group.destinationName)">
              <td colspan="7" class="px-3 py-4 bg-gray-900/30">
                <div class="pl-8">
                  <div class="flex items-center justify-between mb-4">
                    <h4 class="text-sm font-medium text-gray-300">Rate Distribution</h4>
                    <button
                      v-if="hasUnsavedChanges(group.destinationName)"
                      @click="saveRateSelection(group)"
                      class="px-3 py-1 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                  <div class="space-y-2">
                    <div 
                      v-for="rate in group.rates" 
                      :key="rate.rate"
                      class="flex items-center justify-between text-sm p-2 rounded-md"
                      :class="{'bg-gray-800/50': isSelectedRate(group.destinationName, rate.rate)}"
                    >
                      <label class="flex items-center gap-2 flex-1 cursor-pointer">
                        <input
                          type="radio"
                          :name="`rate-${group.destinationName}`"
                          :value="rate.rate"
                          :checked="isSelectedRate(group.destinationName, rate.rate)"
                          @change="selectRate(group.destinationName, rate.rate)"
                          class="text-accent"
                        />
                        <div 
                          class="w-2 h-2 rounded-full"
                          :class="rate.isCommon ? 'bg-green-500' : 'bg-yellow-500'"
                        ></div>
                        <span class="text-white">{{ formatRate(rate.rate) }}</span>
                      </label>
                      <div class="text-gray-400">
                        {{ rate.count }} codes ({{ Math.round(rate.percentage) }}%)
                      </div>
                    </div>
                   
                    <!-- Custom Rate Option -->
                    <div 
                      class="flex items-center justify-between text-sm p-2 rounded-md"
                      @click.stop
                    >
                      <label class="flex items-center gap-2 flex-1 cursor-pointer">
                        <input
                          type="radio"
                          :name="`rate-${group.destinationName}`"
                          value="custom"
                          :checked="isCustomRate(group.destinationName)"
                          @change="enableCustomRate(group.destinationName)"
                          class="text-accent"
                        />
                        <div class="flex items-center gap-2">
                          <span class="text-white">Custom Rate:</span>
                          <span v-if="customRates[group.destinationName]" class="text-accent">
                            {{ formatRate(customRates[group.destinationName]) }}
                          </span>
                          <button
                            @click.stop="openCustomRateInput(group.destinationName)"
                            class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded ml-2"
                          >
                            {{ customRates[group.destinationName] ? 'Edit' : 'Set Rate' }}
                          </button>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12 bg-gray-800 rounded-lg"
    >
      <p class="text-gray-400">No destinations found matching your filters</p>
    </div>

    <!-- Custom Rate Modal -->
    <div
      v-if="customRateModal.isOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center"
      @click.self="customRateModal.isOpen = false"
    >
      <div class="bg-gray-800 p-4 rounded-lg w-96">
        <h3 class="text-lg font-medium mb-4">Set Custom Rate</h3>
        <input
          ref="customRateInput"
          type="number"
          step="0.000001"
          v-model="customRateModal.value"
          class="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full text-white mb-4"
          @keyup.enter="saveCustomRate"
        />
        <div class="flex justify-end gap-2">
          <button
            @click="customRateModal.isOpen = false"
            class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            @click="saveCustomRate"
            class="px-3 py-1 text-sm bg-accent hover:bg-accent-hover text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { ChevronRightIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import type { GroupedRateData } from '@/types/rate-sheet-types';
import { useRateSheetStore } from '@/stores/rate-sheet-store';

const store = useRateSheetStore();
const groupedData = computed(() => store.getGroupedData);
const expandedRows = ref<string[]>([]);
const filterStatus = ref<'all' | 'conflicts' | 'no-conflicts'>('all');
const searchQuery = ref('');
const selectedRates = ref<Record<string, number>>({});
const customRates = ref<Record<string, number>>({});
const originalRates = ref<Record<string, number>>({});
const customRateModal = ref({
  isOpen: false,
  destinationName: '',
  value: '',
});
const customRateInput = ref<HTMLInputElement | null>(null);

// Add new refs for processing state
const isBulkProcessing = ref(false);
const processedCount = ref(0);
const totalToProcess = ref(0);

const filteredData = computed(() => {
  let filtered = groupedData.value;
  
  // Apply status filter
  if (filterStatus.value === 'conflicts') {
    filtered = filtered.filter(group => group.hasDiscrepancy);
  } else if (filterStatus.value === 'no-conflicts') {
    filtered = filtered.filter(group => !group.hasDiscrepancy);
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(group => 
      group.destinationName.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

function toggleExpand(destinationName: string) {
  const index = expandedRows.value.indexOf(destinationName);
  if (index > -1) {
    expandedRows.value.splice(index, 1);
  } else {
    expandedRows.value.push(destinationName);
  }
}

function formatRate(rate: number): string {
  return rate.toFixed(6);
}

function isSelectedRate(destinationName: string, rate: number): boolean {
  return selectedRates.value[destinationName] === rate;
}

function isCustomRate(destinationName: string): boolean {
  return selectedRates.value[destinationName] === customRates.value[destinationName];
}

function selectRate(destinationName: string, rate: number) {
  selectedRates.value[destinationName] = rate;
}

function enableCustomRate(destinationName: string) {
  if (!customRates.value[destinationName]) {
    customRates.value[destinationName] = 0;
  }
  selectedRates.value[destinationName] = customRates.value[destinationName];
}

function handleCustomRateInput(destinationName: string, event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value);
  if (!isNaN(value)) {
    customRates.value[destinationName] = value;
    selectedRates.value[destinationName] = value;
  }
}

function hasUnsavedChanges(destinationName: string): boolean {
  return selectedRates.value[destinationName] !== originalRates.value[destinationName];
}

async function saveRateSelection(group: GroupedRateData) {
  const newRate = selectedRates.value[group.destinationName];
  if (newRate !== undefined) {
    await store.updateDestinationRate(group.destinationName, newRate);
    originalRates.value[group.destinationName] = newRate;
    store.setGroupedData(store.getGroupedData);
    const index = expandedRows.value.indexOf(group.destinationName);
    if (index > -1) {
      expandedRows.value.splice(index, 1);
    }
  }
}

function openCustomRateInput(destinationName: string) {
  customRateModal.value = {
    isOpen: true,
    destinationName,
    value: customRates.value[destinationName]?.toString() || '',
  };
  nextTick(() => {
    customRateInput.value?.focus();
  });
}

function saveCustomRate() {
  const value = parseFloat(customRateModal.value.value);
  if (!isNaN(value)) {
    const { destinationName } = customRateModal.value;
    customRates.value[destinationName] = value;
    selectedRates.value[destinationName] = value;
    customRateModal.value.isOpen = false;
  }
}

async function handleBulkUpdate(mode: 'highest' | 'lowest') {
  isBulkProcessing.value = true;
  processedCount.value = 0;
  
  // Get all destinations with discrepancies
  const destinationsToFix = groupedData.value.filter(group => group.hasDiscrepancy);
  totalToProcess.value = destinationsToFix.length;

  try {
    // Process in chunks to allow UI updates
    for (let i = 0; i < destinationsToFix.length; i++) {
      const group = destinationsToFix[i];
      const rates = group.rates.map(r => r.rate);
      const newRate = mode === 'highest' ? Math.max(...rates) : Math.min(...rates);
      await store.updateDestinationRate(group.destinationName, newRate);
      processedCount.value++;
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    // Force a final update of the grouped data
    store.setGroupedData(store.getGroupedData);
  } finally {
    isBulkProcessing.value = false;
    processedCount.value = 0;
    totalToProcess.value = 0;
  }
}

function handleClearData() {
  if (confirm('Are you sure you want to clear all rate sheet data?')) {
    store.clearData();
  }
}

function handleExport() {
  // Convert data to CSV format
  const headers = ['name', 'prefix', 'rate', 'effective', 'min duration', 'increments'];
  const rows = store.originalData.map(record => [
    record.name,
    record.prefix,
    record.rate.toFixed(6),
    record.effective,
    record.minDuration,
    record.increments,
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'rate_sheet_formalized.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script> 