<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-fbWhite">Rate Deck Insights</h3>
        <BaseButton
          variant="destructive"
          size="small"
          @click="$emit('close')"
        >
          ×
        </BaseButton>
      </div>
      
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-gray-700/50 rounded-lg p-4">
          <div class="text-sm text-gray-400">Strategy Used</div>
          <div class="text-lg font-semibold text-fbWhite">{{ deck.lcrStrategy }}</div>
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

      <!-- Average Rates Across All Prefixes -->
      <div v-if="!loading && averageRates" class="bg-gray-700/30 rounded-lg p-4 mb-6">
        <h4 class="text-sm font-medium text-gray-300 mb-3">Average Rates (All {{ deck.rowCount.toLocaleString() }} Prefixes)</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-accent/10 rounded-lg p-3 border border-accent/50">
            <div class="text-xs font-medium text-accent mb-1">Interstate</div>
            <div class="text-lg font-semibold text-fbWhite font-mono">
              ${{ averageRates.interstate.toFixed(6) }}
            </div>
          </div>
          <div class="bg-accent/10 rounded-lg p-3 border border-accent/50">
            <div class="text-xs font-medium text-accent mb-1">Intrastate</div>
            <div class="text-lg font-semibold text-fbWhite font-mono">
              ${{ averageRates.intrastate.toFixed(6) }}
            </div>
          </div>
          <div class="bg-accent/10 rounded-lg p-3 border border-accent/50">
            <div class="text-xs font-medium text-accent mb-1">Indeterminate</div>
            <div class="text-lg font-semibold text-fbWhite font-mono">
              ${{ averageRates.indeterminate.toFixed(6) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sample Calculations -->
      <div class="flex-1 overflow-auto">
        <h4 class="text-lg font-medium text-fbWhite mb-4">Sample Calculations (Random 5 Prefixes)</h4>
        
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
              <span class="text-sm text-gray-400">Sample {{ index + 1 }}/5</span>
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
                  <div class="bg-accent/10 border border-accent/50 rounded p-2 text-xs">
                    <div class="font-medium text-accent">Interstate</div>
                    <div class="text-fbWhite">
                      ${{ rate.debug.selectedRates.inter.rate.toFixed(6) }}
                      <span class="text-gray-400 ml-1">({{ rate.debug.selectedRates.inter.provider }})</span>
                    </div>
                  </div>
                  <div class="bg-accent/10 border border-accent/50 rounded p-2 text-xs">
                    <div class="font-medium text-accent">Intrastate</div>
                    <div class="text-fbWhite">
                      ${{ rate.debug.selectedRates.intra.rate.toFixed(6) }}
                      <span class="text-gray-400 ml-1">({{ rate.debug.selectedRates.intra.provider }})</span>
                    </div>
                  </div>
                  <div class="bg-accent/10 border border-accent/50 rounded p-2 text-xs">
                    <div class="font-medium text-accent">Indeterminate</div>
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
                    <div class="font-medium">Interstate</div>
                    <div class="text-fbWhite font-mono">
                      ${{ rate.rate.toFixed(6) }}
                      <div class="text-gray-400 text-xs mt-1">
                        (${{ rate.debug.appliedMarkup.originalRates.inter.toFixed(6) }} + markup)
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-800/50 rounded p-2 text-xs">
                    <div class="font-medium">Intrastate</div>
                    <div class="text-fbWhite font-mono">
                      ${{ rate.intrastate.toFixed(6) }}
                      <div class="text-gray-400 text-xs mt-1">
                        (${{ rate.debug.appliedMarkup.originalRates.intra.toFixed(6) }} + markup)
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-800/50 rounded p-2 text-xs">
                    <div class="font-medium">Indeterminate</div>
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
              <div class="mt-3">
                <BaseBadge :variant="getValidationVariant(rate)" size="small">
                  {{ getValidationMessage(rate) }}
                </BaseBadge>
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
        <BaseButton
          variant="destructive"
          size="standard"
          @click="$emit('close')"
        >
          Close
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { GeneratedRateDeck, GeneratedRateRecord } from '@/types/domains/rate-gen-types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';
import BaseBadge from '@/components/shared/BaseBadge.vue';
import BaseButton from '@/components/shared/BaseButton.vue';

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
const averageRates = ref<{
  interstate: number;
  intrastate: number;
  indeterminate: number;
} | null>(null);

// Methods
async function loadSampleRates() {
  try {
    loading.value = true;
    const { loadFromDexieDB } = useDexieDB();

    // Load all rates for this deck
    const allRates = await loadFromDexieDB<GeneratedRateRecord>(DBName.RATE_GEN_RESULTS, 'generated_rates');
    const deckRates = allRates.filter((r: any) => r.deckId === props.deck.id);

    // Calculate average rates across all prefixes
    if (deckRates.length > 0) {
      const totalInterstate = deckRates.reduce((sum: number, r: any) => sum + (r.rate || 0), 0);
      const totalIntrastate = deckRates.reduce((sum: number, r: any) => sum + (r.intrastate || 0), 0);
      const totalIndeterminate = deckRates.reduce((sum: number, r: any) => sum + (r.indeterminate || 0), 0);

      averageRates.value = {
        interstate: totalInterstate / deckRates.length,
        intrastate: totalIntrastate / deckRates.length,
        indeterminate: totalIndeterminate / deckRates.length
      };

      console.log('[RateDeckInsights] Average rates calculated:', averageRates.value);
    }

    // Randomly select 5 rates with debug information
    const ratesWithDebug = deckRates.filter((r: any) => r.debug);
    if (ratesWithDebug.length > 0) {
      // Shuffle array using Fisher-Yates algorithm
      const shuffled = [...ratesWithDebug];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // Take first 5 from shuffled array
      sampleRates.value = shuffled.slice(0, 5);
    }

    console.log('[RateDeckInsights] Loaded random sample rates:', sampleRates.value.length);

  } catch (error) {
    console.error('[LCRValidationModal] Error loading sample rates:', error);
  } finally {
    loading.value = false;
  }
}

function getValidationVariant(rate: GeneratedRateRecord): 'success' | 'destructive' | 'neutral' {
  if (!rate.debug) return 'neutral';

  const isValid = validateLCRCalculation(rate);
  return isValid ? 'success' : 'destructive';
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