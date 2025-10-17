<template>
  <div class="border border-fbWhite/20 rounded-lg p-6 bg-fbBlack/50">
    <h4 class="text-lg font-semibold text-fbWhite mb-4">Rate Deck Information</h4>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Deck Name -->
      <div class="bg-fbHover/30 rounded-lg p-4">
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-accent animate-pulse mr-3"></div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Deck Name</p>
            <p class="text-sm font-medium text-fbWhite">{{ deck?.name || 'Unknown' }}</p>
          </div>
        </div>
      </div>

      <!-- Strategy -->
      <div class="bg-fbHover/30 rounded-lg p-4">
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-blue-400 mr-3"></div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Strategy</p>
            <p class="text-sm font-medium text-fbWhite">{{ deck?.lcrStrategy || 'Unknown' }}</p>
          </div>
        </div>
      </div>

      <!-- Total Records -->
      <div class="bg-fbHover/30 rounded-lg p-4">
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-green-400 mr-3"></div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Total Records</p>
            <p class="text-sm font-medium text-fbWhite">{{ totalRecords.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <!-- Generated Date -->
      <div class="bg-fbHover/30 rounded-lg p-4">
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-purple-400 mr-3"></div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Generated</p>
            <p class="text-sm font-medium text-fbWhite">{{ formatDate(deck?.generatedDate) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Markup Information -->
    <div v-if="deck" class="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <div class="flex items-center">
        <InformationCircleIcon class="h-5 w-5 text-yellow-400 mr-2" />
        <div>
          <p class="text-sm font-medium text-yellow-400">Markup Applied</p>
          <p class="text-xs text-yellow-300">
            <template v-if="deck.markupPercentage > 0">
              {{ deck.markupPercentage }}% markup has been applied to all rates
            </template>
            <template v-else-if="deck.markupFixed && deck.markupFixed > 0">
              ${{ deck.markupFixed.toFixed(4) }} fixed markup has been applied to all rates
            </template>
            <template v-else>
              No markup applied - rates exported as calculated
            </template>
          </p>
        </div>
      </div>
    </div>

    <!-- Export Info -->
    <div class="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <div class="flex items-center">
        <InformationCircleIcon class="h-5 w-5 text-blue-400 mr-2" />
        <p class="text-sm text-blue-300">
          Ready to export <span class="font-medium">{{ filteredRecords.toLocaleString() }}</span> 
          rate records from this generated deck
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import type { GeneratedRateDeck } from '@/types/domains/rate-gen-types';

defineProps<{
  deck: GeneratedRateDeck | null;
  totalRecords: number;
  filteredRecords: number;
}>();

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Unknown';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>