<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="handleCancel"
  >
    <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon class="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-white">Mixed Rate Deck Detected</h2>
            <p class="text-gray-400 text-sm">This file contains both international and +1 destinations</p>
          </div>
        </div>
        <button
          @click="handleCancel"
          class="text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Detection Summary -->
      <div class="bg-gray-900/50 rounded-lg p-4 mb-6">
        <h3 class="text-lg font-medium text-white mb-3">File Analysis</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-400">Total Destinations:</span>
            <span class="text-white ml-2 font-mono">{{ analysis.totalDestinations.toLocaleString() }}</span>
          </div>
          <div>
            <span class="text-gray-400">Contains +1 Codes:</span>
            <span class="text-green-400 ml-2 font-medium">{{ analysis.hasPlusOne ? 'YES' : 'NO' }}</span>
          </div>
        </div>
      </div>

      <!-- +1 Breakdown -->
      <div class="bg-gray-900/30 rounded-lg p-4 mb-6">
        <h3 class="text-lg font-medium text-white mb-4">North American (+1) Destinations Found</h3>
        <div class="space-y-3">
          <!-- US NPAs -->
          <div v-if="analysis.plusOneBreakdown.usNPAs.length > 0" class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">🇺🇸</span>
              <span class="text-white">US Domestic</span>
            </div>
            <div class="text-right">
              <div class="text-white font-mono">{{ analysis.plusOneBreakdown.usNPAs.length }} NPAs</div>
              <div class="text-xs text-gray-400">{{ analysis.plusOneBreakdown.usNPAs.slice(0, 5).join(', ') }}{{ analysis.plusOneBreakdown.usNPAs.length > 5 ? '...' : '' }}</div>
            </div>
          </div>

          <!-- Canadian NPAs -->
          <div v-if="analysis.plusOneBreakdown.canadianNPAs.length > 0" class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">🇨🇦</span>
              <span class="text-white">Canada</span>
            </div>
            <div class="text-right">
              <div class="text-white font-mono">{{ analysis.plusOneBreakdown.canadianNPAs.length }} NPAs</div>
              <div class="text-xs text-gray-400">{{ analysis.plusOneBreakdown.canadianNPAs.slice(0, 5).join(', ') }}{{ analysis.plusOneBreakdown.canadianNPAs.length > 5 ? '...' : '' }}</div>
            </div>
          </div>

          <!-- Caribbean NPAs -->
          <div v-if="analysis.plusOneBreakdown.caribbeanNPAs.length > 0" class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">🏝️</span>
              <span class="text-white">Caribbean</span>
            </div>
            <div class="text-right">
              <div class="text-white font-mono">{{ analysis.plusOneBreakdown.caribbeanNPAs.length }} NPAs</div>
              <div class="text-xs text-gray-400">{{ analysis.plusOneBreakdown.caribbeanNPAs.slice(0, 5).join(', ') }}{{ analysis.plusOneBreakdown.caribbeanNPAs.length > 5 ? '...' : '' }}</div>
            </div>
          </div>

          <!-- Unknown NPAs -->
          <div v-if="analysis.plusOneBreakdown.unknownNPAs.length > 0" class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">❓</span>
              <span class="text-white">Unknown +1</span>
            </div>
            <div class="text-right">
              <div class="text-white font-mono">{{ analysis.plusOneBreakdown.unknownNPAs.length }} NPAs</div>
              <div class="text-xs text-gray-400">{{ analysis.plusOneBreakdown.unknownNPAs.slice(0, 5).join(', ') }}{{ analysis.plusOneBreakdown.unknownNPAs.length > 5 ? '...' : '' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Selection -->
      <div class="mb-6">
        <h3 class="text-lg font-medium text-white mb-4">How would you like to proceed?</h3>
        <div class="space-y-3">
          <!-- Option 1: Include All -->
          <label class="flex items-start space-x-3 p-4 border border-gray-600 rounded-lg cursor-pointer transition-colors hover:border-accent hover:bg-accent/5">
            <input
              type="radio"
              v-model="selectedAction"
              value="include-all"
              class="mt-1"
            />
            <div class="flex-1">
              <div class="text-white font-medium">Include All Destinations</div>
              <div class="text-gray-400 text-sm mt-1">
                Process the entire file as international rates, including +1 destinations
              </div>
              <div class="text-xs text-gray-500 mt-1">
                Recommended for: International carrier rate sheets
              </div>
            </div>
          </label>

          <!-- Option 2: Filter Out +1 -->
          <label class="flex items-start space-x-3 p-4 border border-gray-600 rounded-lg cursor-pointer transition-colors hover:border-accent hover:bg-accent/5">
            <input
              type="radio"
              v-model="selectedAction"
              value="filter-plus-one"
              class="mt-1"
            />
            <div class="flex-1">
              <div class="text-white font-medium">Remove +1 Destinations</div>
              <div class="text-gray-400 text-sm mt-1">
                Filter out all North American (+1) codes and process only international destinations
              </div>
              <div class="text-xs text-gray-500 mt-1">
                This will remove {{ getTotalPlusOneCount() }} destinations from your file
              </div>
            </div>
          </label>

          <!-- Option 3: Extract +1 Only -->
          <label class="flex items-start space-x-3 p-4 border border-gray-600 rounded-lg cursor-pointer transition-colors hover:border-accent hover:bg-accent/5">
            <input
              type="radio"
              v-model="selectedAction"
              value="extract-plus-one"
              class="mt-1"
            />
            <div class="flex-1">
              <div class="text-white font-medium">Extract +1 Destinations Only</div>
              <div class="text-gray-400 text-sm mt-1">
                Process only the North American (+1) destinations, filtering out international codes
              </div>
              <div class="text-xs text-gray-500 mt-1">
                This will process {{ getTotalPlusOneCount() }} destinations
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3">
        <button
          @click="handleCancel"
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleProceed"
          :disabled="!selectedAction"
          class="px-6 py-2 bg-accent hover:bg-accent-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Proceed
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import type { PlusOneAnalysis } from '@/utils/plus-one-detector';

export interface PlusOneHandlingModalProps {
  showModal: boolean;
  analysis: PlusOneAnalysis;
}

export interface PlusOneHandlingModalEmits {
  (e: 'proceed', action: 'include-all' | 'filter-plus-one' | 'extract-plus-one'): void;
  (e: 'cancel'): void;
}

const props = defineProps<PlusOneHandlingModalProps>();
const emit = defineEmits<PlusOneHandlingModalEmits>();

const selectedAction = ref<'include-all' | 'filter-plus-one' | 'extract-plus-one' | null>(null);

const getTotalPlusOneCount = () => {
  const breakdown = props.analysis.plusOneBreakdown;
  return breakdown.usNPAs.length + 
         breakdown.canadianNPAs.length + 
         breakdown.caribbeanNPAs.length + 
         breakdown.unknownNPAs.length;
};

function handleProceed() {
  if (selectedAction.value) {
    emit('proceed', selectedAction.value);
  }
}

function handleCancel() {
  emit('cancel');
}
</script>