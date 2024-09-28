<template>
  <div class="az-pricing-report bg-background rounded-lg m-auto p-8 w-full max-w-[1400px] font-sans relative">
    <div class="mb-10 text-center">
      <h1 class="text-5xl font-bold text-foreground uppercase inline-block">
        AZ PRICING REPORT
      </h1>
    </div>
    
    <button class="absolute top-8 right-8 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-lg">
      Reset
    </button>
    
    <div v-if="report" class="space-y-10">
      <!-- Buy Section -->
      <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <h2 class="py-4 text-2xl font-semibold text-center text-foreground bg-gradient-to-r from-blue-950 via-cyan-900 to-teal-900 px-6">
          <span class="text-gray-300">{{ report.fileName1 }} SHOULD BUY THESE DESTINATIONS FROM {{ report.fileName2 }}</span>
        </h2>
        <div class="p-6 overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="py-3 text-left text-gray-400 px-4">Dial Code(s)</th>
                <th class="py-3 text-left text-gray-400 px-4">Destination</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName1 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName2 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Difference (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.higherRatesForFile1" :key="item.dialCode" class="border-b border-gray-700">
                <td class="py-3 text-foreground px-4">{{ item.dialCode }}</td>
                <td class="py-3 text-foreground px-4">{{ item.destName }}</td>
                <td class="py-3 text-right text-foreground px-4">{{ item.rateFile1 }}</td>
                <td class="py-3 text-right text-foreground px-4">{{ item.rateFile2 }}</td>
                <td class="py-3 text-right text-green-500 px-4">{{ formatPercentage(item.percentageDifference) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sell Section -->
      <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <h2 class="py-4 text-2xl font-semibold text-center text-foreground bg-gradient-to-r from-blue-950 via-cyan-900 to-teal-900 px-6">
          <span class="text-gray-300">{{ report.fileName1 }} SHOULD SELL THESE DESTINATIONS TO {{ report.fileName2 }}</span>
        </h2>
        <div class="p-6 overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="py-3 text-left text-gray-400 px-4">Dial Code(s)</th>
                <th class="py-3 text-left text-gray-400 px-4">Destination</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName1 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName2 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Difference (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.higherRatesForFile2" :key="item.dialCode" class="border-b border-gray-700">
                <td class="py-3 text-foreground px-4">{{ item.dialCode }}</td>
                <td class="py-3 text-foreground px-4">{{ item.destName }}</td>
                <td class="py-3 text-right text-foreground px-4">{{ item.rateFile1 }}</td>
                <td class="py-3 text-right text-foreground px-4">{{ item.rateFile2 }}</td>
                <td class="py-3 text-right text-red-500 px-4">{{ formatPercentage(item.percentageDifference) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Same Rates Section -->
      <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <h2 class="py-4 text-2xl font-semibold text-center text-foreground bg-gradient-to-r from-blue-950 via-cyan-900 to-teal-900 px-6">
          <span class="text-gray-300">Same Rates</span>
        </h2>
        <div class="p-6 overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="py-3 text-left text-gray-400 px-4">Dial Code(s)</th>
                <th class="py-3 text-left text-gray-400 px-4">Destination</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName1 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName2 }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.sameRates" :key="item.dialCode" class="border-b border-gray-700">
                <td class="py-3 text-foreground px-4">{{ item.dialCode }}</td>
                <td class="py-3 text-foreground px-4">{{ item.destName }}</td>
                <td class="py-3 text-right text-foreground px-4">{{ item.rateFile1 }}</td>
                <td class="py-3 text-right text-foreground px-4">{{ item.rateFile2 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Unmatched Codes Section -->
      <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div class="py-4 px-6 bg-gradient-to-r from-blue-950 via-cyan-900 to-teal-900 flex justify-between items-center">
          <div class="w-1/4"></div>
          <h2 class="text-2xl font-semibold text-center text-gray-300 flex-grow">
            Unmatched Codes
          </h2>
          <div class="w-1/4 flex justify-end">
            <button 
              @click="toggleUnmatchedCodes" 
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg text-lg"
            >
              {{ showUnmatchedCodes ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>
        <div class="p-6">
          <div v-if="showUnmatchedCodes">
            <ul class="list-disc list-inside text-foreground space-y-2">
              <li v-for="code in report.nonMatchingCodes" :key="code.dialCode">
                {{ code.dialCode }} - {{ code.destName }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center text-xl text-muted-foreground">
      No pricing report data available.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { type AzPricingReport, type NonMatchingCode } from '../../types/app-types';

const props = defineProps<{
  report: AzPricingReport | null;
}>();

const showUnmatchedCodes = ref(false);

function toggleUnmatchedCodes() {
  showUnmatchedCodes.value = !showUnmatchedCodes.value;
}

function formatPercentage(value: number): string {
  return value.toFixed(2);
}
</script>