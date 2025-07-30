<template>
  <div class="space-y-6">
    <!-- Rate Decks Table -->
    <div v-if="allDecks.length > 0" class="bg-gray-700/50 rounded-lg border border-gray-600 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-800/50 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <th class="px-4 py-3 text-left">Rate Deck</th>
            <th class="px-4 py-3 text-left">Strategy</th>
            <th class="px-4 py-3 text-left">Markup</th>
            <th class="px-4 py-3 text-left">Total Rates</th>
            <th class="px-4 py-3 text-left">Providers</th>
            <th class="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="deck in allDecks" 
            :key="deck.id"
            class="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors"
          >
            <!-- Rate Deck Name -->
            <td class="px-4 py-4">
              <div>
                <p class="text-sm font-medium text-fbWhite">{{ deck.name }}</p>
                <p class="text-xs text-gray-400">{{ formatDate(deck.generatedAt) }}</p>
              </div>
            </td>
            
            <!-- Strategy -->
            <td class="px-4 py-4">
              <span class="text-sm text-accent font-medium">{{ deck.strategy }}</span>
            </td>
            
            <!-- Markup -->
            <td class="px-4 py-4">
              <span class="text-sm text-fbWhite">
                {{ deck.markupType === 'percentage' ? `${deck.markupValue}%` : `$${deck.markupValue.toFixed(4)}` }}
              </span>
            </td>
            
            <!-- Total Rates -->
            <td class="px-4 py-4">
              <span class="text-sm text-fbWhite font-bold">{{ deck.rowCount.toLocaleString() }}</span>
            </td>
            
            <!-- Providers -->
            <td class="px-4 py-4">
              <div class="text-xs space-y-1">
                <div v-for="provider in getProviderBreakdown(deck.id).slice(0, 3)" :key="provider.name" class="flex items-center justify-between">
                  <span class="text-gray-300 truncate mr-2 max-w-[120px]" :title="provider.name">{{ provider.name }}</span>
                  <span class="text-gray-400 font-medium whitespace-nowrap">{{ provider.percentage.toFixed(1) }}%</span>
                </div>
                <div v-if="getProviderBreakdown(deck.id).length > 3" class="text-gray-500 text-xs mt-1">
                  +{{ getProviderBreakdown(deck.id).length - 3 }} more
                </div>
                <div v-if="getProviderBreakdown(deck.id).length === 0" class="text-gray-400">
                  Calculating...
                </div>
              </div>
            </td>
            
            <!-- Actions -->
            <td class="px-4 py-4">
              <div class="flex items-center space-x-2">
                <button
                  @click="handleExportDeck(deck.id)"
                  class="p-1.5 rounded bg-accent/20 hover:bg-accent/30 text-accent transition-colors"
                  title="Export as CSV"
                >
                  <ArrowDownTrayIcon class="w-4 h-4" />
                </button>
                
                <button
                  @click="handleValidateDeck(deck)"
                  class="p-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                  title="Validate calculations"
                >
                  <CheckCircleIcon class="w-4 h-4" />
                </button>
                
                <button
                  @click="handleDeleteDeck(deck.id, deck.name)"
                  class="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                  title="Delete deck"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Generate New Deck Button (bottom right) -->
    <div v-if="allDecks.length > 0" class="flex justify-end">
      <BaseButton
        variant="primary"
        size="standard"
        @click="$emit('generate-new')"
        :disabled="!canGenerateNew"
      >
        Generate New Deck
      </BaseButton>
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-700/30 rounded-lg border border-gray-600 border-dashed">
      <p class="text-gray-400 mb-4">No rate decks have been generated yet.</p>
      <BaseButton
        variant="primary"
        size="standard"
        @click="$emit('generate-new')"
        :disabled="!canGenerateNew"
      >
        Generate Your First Deck
      </BaseButton>
    </div>
    
    
    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteModal"
      title="Delete Rate Deck"
      :message="`Are you sure you want to delete '${deletingDeckName}'? This action cannot be undone.`"
      confirm-button-text="Delete"
      cancel-button-text="Cancel"
      @confirm="confirmDelete"
    />
    
    <!-- LCR Validation Modal -->
    <LCRValidationModal 
      v-if="validatingDeck"
      :show="showValidationModal"
      :deck="validatingDeck"
      @close="showValidationModal = false"
    />
    
    <!-- Export Modal -->
    <RateGenExportModal
      :open="showExportModal"
      :deck="exportingDeck"
      :on-export="handleExportWithOptions"
      @update:open="showExportModal = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';
import type { GeneratedRateDeck, RateGenExportOptions } from '@/types/domains/rate-gen-types';
import { 
  ArrowDownTrayIcon, 
  TrashIcon,
  CheckCircleIcon 
} from '@heroicons/vue/24/outline';
import BaseButton from '@/components/shared/BaseButton.vue';
import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
import LCRValidationModal from './LCRValidationModal.vue';
import RateGenExportModal from './RateGenExportModal.vue';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';

// Emits
const emit = defineEmits<{
  'generate-new': [];
}>();

// Store and service
const store = useRateGenStore();
const service = new RateGenService();
const dexieDB = useDexieDB();

// State
const allDecks = ref<any[]>([]);
const showDeleteModal = ref(false);
const deletingDeckId = ref<string | null>(null);
const deletingDeckName = ref('');
const showValidationModal = ref(false);
const validatingDeck = ref<GeneratedRateDeck | null>(null);
const showExportModal = ref(false);
const exportingDeck = ref<GeneratedRateDeck | null>(null);
const deckProviderStats = ref<Map<string, Map<string, number>>>(new Map());

// Computed
const canGenerateNew = computed(() => store.providerCount >= 2);

// Load all decks on mount
onMounted(async () => {
  await loadAllDecks();
  // Calculate provider stats for all decks
  await calculateAllDeckProviderStats();
});

// Watch for new deck generation
watch(() => store.generatedDeck, async (newDeck) => {
  if (newDeck) {
    // Reload decks to include the new one
    await loadAllDecks();
  }
});

// Load all decks from the database
async function loadAllDecks() {
  try {
    allDecks.value = await service.getAllDecks();
    store.setGeneratedDecks(allDecks.value.map(d => ({
      id: d.id,
      name: d.name,
      lcrStrategy: d.strategy,
      markupPercentage: d.markupType === 'percentage' ? d.markupValue : 0,
      markupFixed: d.markupType === 'fixed' ? d.markupValue : 0,
      providerIds: [],
      generatedDate: new Date(d.generatedAt),
      effectiveDate: d.effectiveDate ? new Date(d.effectiveDate) : undefined,
      rowCount: d.rowCount
    })));
  } catch (error) {
    console.error('Failed to load decks:', error);
    store.addError('Failed to load rate decks');
  }
}



// Handle deck export - open export modal
function handleExportDeck(deckId: string) {
  const deck = allDecks.value.find(d => d.id === deckId);
  if (deck) {
    // Convert to GeneratedRateDeck format
    exportingDeck.value = {
      id: deck.id,
      name: deck.name,
      lcrStrategy: deck.strategy,
      markupPercentage: deck.markupType === 'percentage' ? deck.markupValue : 0,
      markupFixed: deck.markupType === 'fixed' ? deck.markupValue : 0,
      providerIds: [],
      generatedDate: new Date(deck.generatedAt),
      effectiveDate: deck.effectiveDate ? new Date(deck.effectiveDate) : undefined,
      rowCount: deck.rowCount
    };
    showExportModal.value = true;
  }
}

// Handle export with options
async function handleExportWithOptions(deckId: string, options: RateGenExportOptions) {
  try {
    console.log('[RateGenResults] Exporting deck with options:', deckId, options);
    const blob = await service.exportRateDeck(deckId, 'csv', options);
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const deck = allDecks.value.find(d => d.id === deckId);
    a.download = `${deck?.name || 'rate-deck'}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('[RateGenResults] Export completed successfully');
  } catch (error) {
    console.error('[RateGenResults] Export failed:', error);
    store.addError('Failed to export rate deck');
    throw error; // Re-throw to let modal handle it
  }
}

// Handle deck validation
function handleValidateDeck(deck: any) {
  // Convert to GeneratedRateDeck format for validation modal
  validatingDeck.value = {
    id: deck.id,
    name: deck.name,
    lcrStrategy: deck.strategy,
    markupPercentage: deck.markupType === 'percentage' ? deck.markupValue : 0,
    markupFixed: deck.markupType === 'fixed' ? deck.markupValue : 0,
    providerIds: [],
    generatedDate: new Date(deck.generatedAt),
    effectiveDate: deck.effectiveDate ? new Date(deck.effectiveDate) : undefined,
    rowCount: deck.rowCount
  };
  showValidationModal.value = true;
}

// Handle deck deletion
function handleDeleteDeck(deckId: string, deckName: string) {
  deletingDeckId.value = deckId;
  deletingDeckName.value = deckName;
  showDeleteModal.value = true;
}

// Confirm deletion
async function confirmDelete() {
  if (!deletingDeckId.value) return;
  
  try {
    await service.deleteDeck(deletingDeckId.value);
    await loadAllDecks();
    showDeleteModal.value = false;
    deletingDeckId.value = null;
    deletingDeckName.value = '';
  } catch (error) {
    store.addError('Failed to delete rate deck');
  }
}

// Format date
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Calculate provider statistics for all decks
async function calculateAllDeckProviderStats() {
  const { loadFromDexieDB } = dexieDB;
  
  try {
    // Load all generated rates
    const allRates = await loadFromDexieDB(DBName.RATE_GEN_RESULTS, 'generated_rates');
    
    // Group by deckId and count providers
    const stats = new Map<string, Map<string, number>>();
    
    for (const rate of allRates) {
      if (!rate.deckId || !rate.selectedProvider) continue;
      
      if (!stats.has(rate.deckId)) {
        stats.set(rate.deckId, new Map());
      }
      
      const deckStats = stats.get(rate.deckId)!;
      const currentCount = deckStats.get(rate.selectedProvider) || 0;
      deckStats.set(rate.selectedProvider, currentCount + 1);
    }
    
    deckProviderStats.value = stats;
  } catch (error) {
    console.error('Failed to calculate provider stats:', error);
  }
}

// Get provider breakdown for a specific deck
function getProviderBreakdown(deckId: string): Array<{name: string, count: number, percentage: number}> {
  const stats = deckProviderStats.value.get(deckId);
  if (!stats) return [];
  
  const deck = allDecks.value.find(d => d.id === deckId);
  if (!deck) return [];
  
  const totalRates = deck.rowCount;
  const breakdown: Array<{name: string, count: number, percentage: number}> = [];
  
  stats.forEach((count, provider) => {
    breakdown.push({
      name: provider,
      count,
      percentage: (count / totalRates) * 100
    });
  });
  
  // Sort by percentage descending
  return breakdown.sort((a, b) => b.percentage - a.percentage);
}
</script>