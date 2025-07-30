<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-fbWhite">LCR Calculation Validation</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-fbWhite text-2xl font-bold"
        >
          ×
        </button>
      </div>
      
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-gray-700/50 rounded-lg p-4">
          <div class="text-sm text-gray-400">Strategy Used</div>
          <div class="text-lg font-semibold text-accent">{{ deck.lcrStrategy }}</div>
        </div>
        <div class="bg-gray-700/50 rounded-lg p-4">
          <div class="text-sm text-gray-400">Total Prefixes</div>
          <div class="text-lg font-semibold text-fbWhite">{{ deck.rowCount.toLocaleString() }}</div>
        </div>
        <div class="bg-gray-700/50 rounded-lg p-4">
          <div class="text-sm text-gray-400">Markup Applied</div>
          <div class="text-lg font-semibold text-fbWhite">
            {{ deck.markupFixed ? `$${deck.markupFixed.toFixed(4)}` : `${deck.markupPercentage}%` }}
          </div>
        </div>
      </div>
      
      <!-- Sample Calculations -->
      <div class="flex-1 overflow-auto">
        <h4 class="text-lg font-medium text-fbWhite mb-4">Sample Calculations (First 10 Prefixes)</h4>
        
        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-400">Loading calculation details...</div>
        </div>
        
        <div v-else-if="sampleRates.length === 0" class="text-center py-8">
          <div class="text-gray-400">No debug information available</div>
        </div>
        
        <div v-else class="space-y-6">
          <div 
            v-for="(rate, index) in sampleRates" 
            :key="rate.prefix"
            class="bg-gray-700/30 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <h5 class="text-lg font-medium text-fbWhite">Prefix {{ rate.prefix }}</h5>
              <span class="text-sm text-gray-400">Sample {{ index + 1 }}/10</span>
            </div>
            
            <div v-if="rate.debug">
              <!-- Provider Rates Input -->
              <div class="mb-4">
                <h6 class="text-sm font-medium text-gray-300 mb-2">Provider Rates (Input)</h6>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div 
                    v-for="provider in rate.debug.providerRates" 
                    :key="provider.provider"
                    class="bg-gray-800/50 rounded p-2 text-xs"
                  >
                    <div class="font-medium text-fbWhite mb-1">{{ provider.provider }}</div>
                    <div class="text-gray-300">
                      Inter: ${{ provider.interRate.toFixed(6) }}<br>
                      Intra: ${{ provider.intraRate.toFixed(6) }}<br>
                      Indet: ${{ provider.indeterminateRate.toFixed(6) }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- LCR Selection -->
              <div class="mb-4">
                <h6 class="text-sm font-medium text-gray-300 mb-2">LCR Selection ({{ rate.debug.strategy }})</h6>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div class="bg-blue-900/30 rounded p-2 text-xs">
                    <div class="font-medium text-blue-300">Interstate</div>
                    <div class="text-fbWhite">
                      ${{ rate.debug.selectedRates.inter.rate.toFixed(6) }}
                      <span class="text-gray-400 ml-1">({{ rate.debug.selectedRates.inter.provider }})</span>
                    </div>
                  </div>
                  <div class="bg-green-900/30 rounded p-2 text-xs">
                    <div class="font-medium text-green-300">Intrastate</div>
                    <div class="text-fbWhite">
                      ${{ rate.debug.selectedRates.intra.rate.toFixed(6) }}
                      <span class="text-gray-400 ml-1">({{ rate.debug.selectedRates.intra.provider }})</span>
                    </div>
                  </div>
                  <div class="bg-purple-900/30 rounded p-2 text-xs">
                    <div class="font-medium text-purple-300">Indeterminate</div>
                    <div class="text-fbWhite">
                      ${{ rate.debug.selectedRates.indeterminate.rate.toFixed(6) }}
                      <span class="text-gray-400 ml-1">({{ rate.debug.selectedRates.indeterminate.provider }})</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Final Rates (After Markup) -->
              <div>
                <h6 class="text-sm font-medium text-gray-300 mb-2">
                  Final Rates (After {{ rate.debug.appliedMarkup.type }} markup: 
                  {{ rate.debug.appliedMarkup.type === 'percentage' ? `${rate.debug.appliedMarkup.value}%` : `$${rate.debug.appliedMarkup.value.toFixed(4)}` }})
                </h6>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div class="bg-gray-800/50 rounded p-2 text-xs">
                    <div class="font-medium text-accent">Interstate</div>
                    <div class="text-fbWhite font-mono">
                      ${{ rate.rate.toFixed(6) }}
                      <div class="text-gray-400 text-xs mt-1">
                        (${{ rate.debug.appliedMarkup.originalRates.inter.toFixed(6) }} + markup)
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-800/50 rounded p-2 text-xs">
                    <div class="font-medium text-accent">Intrastate</div>
                    <div class="text-fbWhite font-mono">
                      ${{ rate.intrastate.toFixed(6) }}
                      <div class="text-gray-400 text-xs mt-1">
                        (${{ rate.debug.appliedMarkup.originalRates.intra.toFixed(6) }} + markup)
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-800/50 rounded p-2 text-xs">
                    <div class="font-medium text-accent">Indeterminate</div>
                    <div class="text-fbWhite font-mono">
                      ${{ rate.indeterminate.toFixed(6) }}
                      <div class="text-gray-400 text-xs mt-1">
                        (${{ rate.debug.appliedMarkup.originalRates.indeterminate.toFixed(6) }} + markup)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Validation Check -->
              <div class="mt-3 p-2 rounded" :class="getValidationClass(rate)">
                <div class="text-xs font-medium">
                  {{ getValidationMessage(rate) }}
                </div>
              </div>
            </div>
            
            <div v-else class="text-gray-400 text-sm">
              No debug information available for this prefix
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex justify-end mt-6 pt-4 border-t border-gray-600">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-600 text-fbWhite rounded-lg hover:bg-gray-500 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { GeneratedRateDeck, GeneratedRateRecord } from '@/types/domains/rate-gen-types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';

interface Props {
  show: boolean;
  deck: GeneratedRateDeck;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'close': [];
}>();

// State
const sampleRates = ref<GeneratedRateRecord[]>([]);
const loading = ref(true);

// Methods
async function loadSampleRates() {
  try {
    loading.value = true;
    const { loadFromDexieDB } = useDexieDB();
    
    // Load all rates for this deck
    const allRates = await loadFromDexieDB<GeneratedRateRecord>(DBName.RATE_GEN_RESULTS, 'generated_rates');
    const deckRates = allRates.filter((r: any) => r.deckId === props.deck.id);
    
    // Take first 10 rates with debug information
    const ratesWithDebug = deckRates.filter((r: any) => r.debug);
    sampleRates.value = ratesWithDebug.slice(0, 10);
    
    console.log('[LCRValidationModal] Loaded sample rates:', sampleRates.value.length);
    
  } catch (error) {
    console.error('[LCRValidationModal] Error loading sample rates:', error);
  } finally {
    loading.value = false;
  }
}

function getValidationClass(rate: GeneratedRateRecord): string {
  if (!rate.debug) return 'bg-gray-700/50';
  
  const isValid = validateLCRCalculation(rate);
  return isValid ? 'bg-green-900/30' : 'bg-red-900/30';
}

function getValidationMessage(rate: GeneratedRateRecord): string {
  if (!rate.debug) return 'No debug information';
  
  const isValid = validateLCRCalculation(rate);
  return isValid ? '✓ LCR calculation is correct' : '✗ LCR calculation may be incorrect';
}

function validateLCRCalculation(rate: GeneratedRateRecord): boolean {
  if (!rate.debug) return false;
  
  const { strategy, providerRates, selectedRates, appliedMarkup } = rate.debug;
  
  // Sort provider rates for validation
  const sortedInter = providerRates
    .filter(p => p.interRate > 0)
    .sort((a, b) => a.interRate - b.interRate);
  
  let expectedInterRate: number;
  
  // Validate LCR selection logic
  switch (strategy) {
    case 'LCR1':
      expectedInterRate = sortedInter[0]?.interRate || 0;
      break;
    case 'LCR2':
      expectedInterRate = sortedInter[1]?.interRate || sortedInter[0]?.interRate || 0;
      break;
    case 'LCR3':
      expectedInterRate = sortedInter[2]?.interRate || sortedInter[1]?.interRate || sortedInter[0]?.interRate || 0;
      break;
    case 'LCR4':
      expectedInterRate = sortedInter[3]?.interRate || sortedInter[2]?.interRate || sortedInter[1]?.interRate || sortedInter[0]?.interRate || 0;
      break;
    case 'LCR5':
      expectedInterRate = sortedInter[4]?.interRate || sortedInter[3]?.interRate || sortedInter[2]?.interRate || sortedInter[1]?.interRate || sortedInter[0]?.interRate || 0;
      break;
    case 'Average':
      expectedInterRate = sortedInter.reduce((sum, p) => sum + p.interRate, 0) / sortedInter.length;
      break;
    default:
      return false;
  }
  
  // Check if selected rate matches expected (with small tolerance for floating point)
  const tolerance = 0.000001;
  const rateMatches = Math.abs(selectedRates.inter.rate - expectedInterRate) < tolerance;
  
  // Validate markup calculation
  let expectedFinalRate: number;
  if (appliedMarkup.type === 'fixed') {
    expectedFinalRate = selectedRates.inter.rate + appliedMarkup.value;
  } else {
    expectedFinalRate = selectedRates.inter.rate * (1 + appliedMarkup.value / 100);
  }
  
  const finalRateMatches = Math.abs(rate.rate - expectedFinalRate) < tolerance;
  
  return rateMatches && finalRateMatches;
}

// Lifecycle
onMounted(() => {
  if (props.show) {
    loadSampleRates();
  }
});

// Watch for show prop changes
import { watch } from 'vue';
watch(() => props.show, (newShow) => {
  if (newShow) {
    loadSampleRates();
  }
});
</script>