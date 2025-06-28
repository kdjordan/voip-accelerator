<template>
  <div class="bg-gray-900/50">
    <div
      @click="toggleDiagnostics"
      class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
    >
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">NANP Categorization Diagnostics</h2>
        <div class="flex items-center space-x-3">
          <span v-if="diagnostics" class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
            {{ diagnostics.needs_attention.length }} need attention
          </span>
          <ChevronDownIcon
            :class="{ 'transform rotate-180': showDiagnostics }"
            class="w-5 h-5 transition-transform text-gray-400"
          />
        </div>
      </div>
    </div>

    <div v-if="showDiagnostics" class="border-t border-gray-700/50 p-6 space-y-6">
      <!-- Loading State -->
      <div v-if="isAnalyzing" class="flex items-center justify-center space-x-2 text-gray-400">
        <ArrowPathIcon class="animate-spin h-5 w-5 text-accent" />
        <span>Analyzing NANP categorization...</span>
      </div>

      <!-- Diagnostics Results -->
      <div v-else-if="diagnostics" class="space-y-4">
        <!-- Overview Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-white">{{ diagnostics.total }}</div>
            <div class="text-gray-400 text-sm">Total NPAs</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-400">{{ diagnostics.properly_categorized }}</div>
            <div class="text-gray-400 text-sm">Properly Categorized</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-yellow-400">{{ diagnostics.needs_attention.length }}</div>
            <div class="text-gray-400 text-sm">Need Attention</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-blue-400">
              {{ Math.round((diagnostics.properly_categorized / diagnostics.total) * 100) }}%
            </div>
            <div class="text-gray-400 text-sm">Coverage</div>
          </div>
        </div>

        <!-- Confidence Breakdown -->
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <h3 class="text-lg font-medium text-white mb-3">Confidence Breakdown</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-xl font-bold text-green-400">
                {{ diagnostics.confidence_breakdown.high || 0 }}
              </div>
              <div class="text-gray-400 text-sm">High Confidence</div>
              <div class="text-xs text-gray-500">(LERG Data)</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-yellow-400">
                {{ diagnostics.confidence_breakdown.medium || 0 }}
              </div>
              <div class="text-gray-400 text-sm">Medium Confidence</div>
              <div class="text-xs text-gray-500">(Constants)</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-red-400">
                {{ diagnostics.confidence_breakdown.low || 0 }}
              </div>
              <div class="text-gray-400 text-sm">Low Confidence</div>
              <div class="text-xs text-gray-500">(Inferred)</div>
            </div>
          </div>
        </div>

        <!-- NPAs Needing Attention -->
        <div v-if="diagnostics.needs_attention.length > 0" class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <h3 class="text-lg font-medium text-yellow-400 mb-3">
            NPAs Needing Manual Addition ({{ diagnostics.needs_attention.length }})
          </h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              v-for="npa in diagnostics.needs_attention.slice(0, 20)"
              :key="npa"
              class="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-sm font-mono"
            >
              {{ npa }}
            </span>
            <span v-if="diagnostics.needs_attention.length > 20" class="text-yellow-400 text-sm">
              +{{ diagnostics.needs_attention.length - 20 }} more...
            </span>
          </div>
          <p class="text-yellow-300 text-sm">
            💡 These NPAs should be added to LERG data using the "Add Single LERG Record" section above.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button
            @click="runDiagnostics"
            class="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
          >
            🔄 Refresh Analysis
          </button>
          
          <button
            v-if="diagnostics.needs_attention.length > 0"
            @click="exportUnknownNPAs"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            📋 Export Unknown NPAs
          </button>
        </div>
      </div>

      <!-- Initial State -->
      <div v-else class="text-center py-8">
        <button
          @click="runDiagnostics"
          class="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
        >
          🔍 Run NANP Categorization Analysis
        </button>
        <p class="text-gray-400 text-sm mt-2">
          Analyze how well your LERG data covers NANP destinations
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ChevronDownIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { NANPCategorizer } from '@/utils/nanp-categorization';
import { useLergStore } from '@/stores/lerg-store';

const showDiagnostics = ref(false);
const isAnalyzing = ref(false);
const diagnostics = ref<any>(null);
const lergStore = useLergStore();

function toggleDiagnostics() {
  showDiagnostics.value = !showDiagnostics.value;
}

async function runDiagnostics() {
  isAnalyzing.value = true;
  try {
    // Get all NPAs from your system (you'd need to implement this)
    const allNPAs = getAllKnownNPAs();
    
    // Run validation
    diagnostics.value = NANPCategorizer.validateCategorization(allNPAs);
    
    console.log('🔍 NANP Categorization Diagnostics:', diagnostics.value);
  } catch (error) {
    console.error('Failed to run diagnostics:', error);
  } finally {
    isAnalyzing.value = false;
  }
}

function getAllKnownNPAs(): string[] {
  // This would collect NPAs from various sources
  // You'd implement this based on your data structure
  const npas = new Set<string>();
  
  // From LERG store
  lergStore.usStates.forEach(state => {
    state.npas.forEach(npa => npas.add(npa));
  });
  
  lergStore.canadaProvinces.forEach(province => {
    province.npas.forEach(npa => npas.add(npa));
  });
  
  lergStore.otherCountries.forEach(country => {
    country.npas.forEach(npa => npas.add(npa));
  });
  
  // Add some common NPAs that might be missing
  const commonNPAs = [
    '212', '213', '214', '215', '216', '217', '218', '219', // US examples
    '204', '226', '236', '249', '250', '263', '289', '306', // Canadian examples  
    '242', '246', '264', '268', '284', '340', '345', '441', // Caribbean examples
    '649', '664', '670', '671', '684', '721', '758', '767',
    '784', '787', '809', '829', '849', '868', '869', '876',
    '939', '987'
  ];
  
  commonNPAs.forEach(npa => npas.add(npa));
  
  return Array.from(npas).sort();
}

function exportUnknownNPAs() {
  if (!diagnostics.value) return;
  
  const unknownNPAs = diagnostics.value.needs_attention;
  const csvContent = `NPA,Suggested_Country,Suggested_State,Notes\n${
    unknownNPAs.map(npa => `${npa},XX,XX,"Needs manual categorization"`).join('\n')
  }`;
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unknown_npas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

onMounted(() => {
  // Auto-run diagnostics if store is loaded
  if (lergStore.isLoaded) {
    runDiagnostics();
  }
});
</script>