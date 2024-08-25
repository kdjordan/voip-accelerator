<template>
  <div class="bg-background rounded-lg m-auto p-6">
    <h1 class="text-center text-5xl font-bold mb-4 text-foreground uppercase">
      AZ PRICING REPORT
    </h1>

    <div class="flex justify-center mb-8">
      <button
        @click="resetReport"
        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Reset
      </button>
    </div>

    <div class="mb-6 flex justify-center w-full">
      <h2 class="w-2/3 px-6 py-3 text-xl font-semibold mb-4 text-foreground bg-gradient-to-r from-blue-700 via-blue-600 to-purple-600 border border-blue-500 rounded-md shadow-xl text-center">
        <span class="text-gray-900 font-bold underline mr-2">{{ report.fileName1 }}</span>
        <span class="text-sm font-normal text-gray-200 uppercase mr-2"> should buy these destinations from </span>
        <span class="text-gray-900 font-bold underline">{{ report.fileName2 }}</span>
      </h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-gray-700">
            <th class="p-3 text-left font-medium text-gray-400">Dial Code(s)</th>
            <th class="p-3 text-left font-medium text-gray-400">Destination</th>
            <th class="p-3 text-right font-medium text-gray-400">Rate - {{ report.fileName1 }}</th>
            <th class="p-3 text-right font-medium text-gray-400">Rate - {{ report.fileName2 }}</th>
            <th class="p-3 text-right font-medium text-gray-400">Difference (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in report.higherRatesForFile1"
            :key="index"
            class="border-b border-gray-700 hover:bg-gray-800 hover:bg-opacity-50"
          >
            <td class="p-3 w-48 max-w-xs">
              <div v-if="item.dialCode.length > 20">
                <button @click="toggleDialCodes('file1', index)" class="text-blue-500 hover:underline">
                  {{ expandedDialCodes.file1[index] ? 'Hide Codes' : 'Show Codes' }}
                </button>
                <div v-if="expandedDialCodes.file1[index]" class="mt-2 overflow-x-auto max-h-40 custom-scrollbar">
                  <div class="whitespace-normal break-words">{{ item.dialCode }}</div>
                </div>
              </div>
              <div v-else class="whitespace-normal break-words">
                {{ item.dialCode }}
              </div>
            </td>
            <td class="p-3">{{ item.destName }}</td>
            <td class="p-3 text-right">{{ formatNumber(item.rateFile1) }}</td>
            <td class="p-3 text-right">{{ formatNumber(item.rateFile2) }}</td>
            <td class="p-3 text-right" :class="getDifferenceClass(item.percentageDifference)">
              {{ formatNumber(item.percentageDifference, 2) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="my-10 flex justify-center w-full">
      <h2 class="w-2/3 px-6 py-3 text-xl font-semibold mb-4 text-foreground bg-gradient-to-r from-blue-700 via-blue-600 to-purple-600 border border-blue-500 rounded-md shadow-xl text-center">
        <span class="text-gray-900 font-bold underline mr-2">{{ report.fileName1 }}</span>
        <span class="text-sm font-normal text-gray-200 mr-2 uppercase"> should sell these destinations to </span>
        <span class="text-gray-900 font-bold underline">{{ report.fileName2 }}</span>
      </h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-gray-700">
            <th class="p-3 text-left font-medium text-gray-400">Dial Code(s)</th>
            <th class="p-3 text-left font-medium text-gray-400">Destination</th>
            <th class="p-3 text-right font-medium text-gray-400">Rate - {{ report.fileName1 }}</th>
            <th class="p-3 text-right font-medium text-gray-400">Rate - {{ report.fileName2 }}</th>
            <th class="p-3 text-right font-medium text-gray-400">Difference (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in report.higherRatesForFile2"
            :key="index"
            class="border-b border-gray-700 hover:bg-gray-800 hover:bg-opacity-50"
          >
            <td class="p-3 w-48 max-w-xs">
              <div v-if="item.dialCode.length > 20">
                <button @click="toggleDialCodes('file2', index)" class="text-blue-500 hover:underline">
                  {{ expandedDialCodes.file2[index] ? 'Hide Codes' : 'Show Codes' }}
                </button>
                <div v-if="expandedDialCodes.file2[index]" class="mt-2 overflow-x-auto max-h-40 custom-scrollbar">
                  <div class="whitespace-normal break-words">{{ item.dialCode }}</div>
                </div>
              </div>
              <div v-else class="whitespace-normal break-words">
                {{ item.dialCode }}
              </div>
            </td>
            <td class="p-3">{{ item.destName }}</td>
            <td class="p-3 text-right">{{ formatNumber(item.rateFile1) }}</td>
            <td class="p-3 text-right">{{ formatNumber(item.rateFile2) }}</td>
            <td class="p-3 text-right" :class="getDifferenceClass(item.percentageDifference)">
              {{ formatNumber(item.percentageDifference, 2) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="my-10 flex justify-center w-full">
      <h2 class="w-2/3 px-6 py-3 text-xl font-semibold mb-4 text-foreground bg-gradient-to-r from-blue-700 via-blue-600 to-purple-600 border border-blue-500 rounded-md shadow-xl text-center">
        <span class="text-gray-200 font-bold">Same Rates</span>
      </h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-gray-700">
            <th class="p-3 text-left font-medium text-gray-400">Dial Code(s)</th>
            <th class="p-3 text-left font-medium text-gray-400">Destination</th>
            <th class="p-3 text-right font-medium text-gray-400">Rate - {{ report.fileName1 }}</th>
            <th class="p-3 text-right font-medium text-gray-400">Rate - {{ report.fileName2 }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in report.sameRates"
            :key="index"
            class="border-b border-gray-700 hover:bg-gray-800 hover:bg-opacity-50"
          >
            <td class="p-3 w-48 max-w-xs">
              <div v-if="item.dialCode.length > 20">
                <button @click="toggleDialCodes('same', index)" class="text-blue-500 hover:underline">
                  {{ expandedDialCodes.same[index] ? 'Hide Codes' : 'Show Codes' }}
                </button>
                <div v-if="expandedDialCodes.same[index]" class="mt-2 overflow-x-auto max-h-40 custom-scrollbar">
                  <div class="whitespace-normal break-words">{{ item.dialCode }}</div>
                </div>
              </div>
              <div v-else class="whitespace-normal break-words">
                {{ item.dialCode }}
              </div>
            </td>
            <td class="p-3">{{ item.destName }}</td>
            <td class="p-3 text-right">{{ formatNumber(item.rateFile1) }}</td>
            <td class="p-3 text-right">{{ formatNumber(item.rateFile2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="my-10 flex justify-center w-full">
      <h2 class="w-2/3 px-6 py-3 text-xl font-semibold mb-4 text-foreground bg-gradient-to-r from-blue-700 via-blue-600 to-purple-600 border border-blue-500 rounded-md shadow-xl text-center">
        <span class="text-gray-200 font-bold">Unmatched Codes</span>
      </h2>
    </div>
    
    <div class="flex justify-end mb-4">
      <button
        @click="toggleUnmatchedCodes"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {{ buttonText }}
      </button>
    </div>

    <div v-if="showUnmatchedCodes" class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-gray-700">
            <th class="p-3 text-left font-medium text-gray-400">Dial Code</th>
            <th class="p-3 text-left font-medium text-gray-400">Destination</th>
            <th class="p-3 text-right font-medium text-gray-400">Rate</th>
            <th class="p-3 text-right font-medium text-gray-400">Missing</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in report.nonMatchingCodes"
            :key="index"
            class="border-b border-gray-700 hover:bg-gray-800 hover:bg-opacity-50"
          >
            <td class="p-3 w-48 max-w-xs">
              <div v-if="item.dialCode.length > 20">
                <button @click="toggleDialCodes('unmatched', index)" class="text-blue-500 hover:underline">
                  {{ expandedDialCodes.unmatched[index] ? 'Hide Codes' : 'Show Codes' }}
                </button>
                <div v-if="expandedDialCodes.unmatched[index]" class="mt-2 overflow-x-auto max-h-40 custom-scrollbar">
                  <div class="whitespace-normal break-words">{{ item.dialCode }}</div>
                </div>
              </div>
              <div v-else class="whitespace-normal break-words">
                {{ item.dialCode }}
              </div>
            </td>
            <td class="p-3">{{ item.destName }}</td>
            <td class="p-3 text-right">{{ formatNumber(item.rate) }}</td>
            <td class="p-3 text-right">{{ item.file }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { type ComparisonReport } from '../../types/app-types';

const props = defineProps<{
  report: ComparisonReport;
}>();

const emit = defineEmits(['resetReport']);

const showUnmatchedCodes = ref<boolean>(false);
const expandedDialCodes = ref({
  file1: {} as Record<number, boolean>,
  file2: {} as Record<number, boolean>,
  same: {} as Record<number, boolean>,
  unmatched: {} as Record<number, boolean>,
});

function toggleUnmatchedCodes() {
  showUnmatchedCodes.value = !showUnmatchedCodes.value;
}

function toggleDialCodes(section: 'file1' | 'file2' | 'same' | 'unmatched', index: number) {
  expandedDialCodes.value[section][index] = !expandedDialCodes.value[section][index];
}

const buttonText = computed(() => {
  return showUnmatchedCodes.value ? 'Hide Unmatched Codes' : 'Show Unmatched Codes';
});

function formatNumber(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}

function getDifferenceClass(difference: number): string {
  if (difference > 5) return 'text-green-600';
  if (difference < -5) return 'text-red-600';
  return 'text-gray-600';
}

function resetReport() {
  emit('resetReport');
}
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.blue.500') theme('colors.gray.700');
}

.custom-scrollbar::-webkit-scrollbar {
  width: theme('spacing.2');
  height: theme('spacing.2');
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: theme('colors.gray.700');
  border-radius: theme('borderRadius.full');
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: theme('colors.blue.500');
  border-radius: theme('borderRadius.full');
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.blue.600');
}
</style>