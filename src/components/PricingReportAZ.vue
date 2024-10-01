<template>
  <div class="bg-background rounded-lg m-auto p-6 w-full relative">
    <div class="mb-10 text-center">
      <h1 class="text-5xl font-bold text-foreground uppercase inline-block">
        AZ PRICING REPORT
      </h1>
    </div>
    
    <button @click="handleReset" class="absolute top-8 right-6 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
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
                <th class="py-3 text-left text-gray-400 px-4 max-w-[250px] w-[250px]">Dial Code(s)</th>
                <th class="py-3 text-left text-gray-400 px-4">Destination</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName1 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName2 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Difference (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.higherRatesForFile1" :key="item.dialCode" class="border-b border-gray-700">
                <td class="py-3 text-foreground px-4 max-w-[250px] w-[250px]">
                  <div v-if="item.dialCode.split(',').length > 3">
                    <span v-if="!isRowExpanded(item.dialCode)">
                      {{ item.dialCode.split(',')[0] }}
                    </span>
                    <span v-else>
                      {{ item.dialCode }}
                    </span>
                    <button 
                      @click="toggleExpandRow(item.dialCode)" 
                      class="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-800 transition-colors duration-300"
w                    >
                      {{ isRowExpanded(item.dialCode) ? 'Show Less' : 'Show More' }}
                    </button>
                  </div>
                  <div v-else>
                    {{ item.dialCode }}
                  </div>
                </td>
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
                <th class="py-3 text-left text-gray-400 px-4 max-w-[250px] w-[250px]">Dial Code(s)</th>
                <th class="py-3 text-left text-gray-400 px-4">Destination</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName1 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName2 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Difference (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.higherRatesForFile2" :key="item.dialCode" class="border-b border-gray-700">
                <td class="py-3 text-foreground px-4 max-w-[250px] w-[250px]">
                  <div v-if="item.dialCode.split(',').length > 3">
                    <span v-if="!isRowExpanded(item.dialCode)">
                      {{ item.dialCode.split(',')[0] }}
                    </span>
                    <span v-else>
                      {{ item.dialCode }}
                    </span>
                    <button 
                      @click="toggleExpandRow(item.dialCode)" 
                      class="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-800 transition-colors duration-300"
                    >
                      {{ isRowExpanded(item.dialCode) ? 'Show Less' : 'Show More' }}
                    </button>
                  </div>
                  <div v-else>
                    {{ item.dialCode }}
                  </div>
                </td>
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
                <th class="py-3 text-left text-gray-400 px-4 max-w-[250px] w-[250px]">Dial Code(s)</th>
                <th class="py-3 text-left text-gray-400 px-4">Destination</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName1 }}</th>
                <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName2 }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.sameRates" :key="item.dialCode" class="border-b border-gray-700">
                <td class="py-3 text-foreground px-4 max-w-[250px] w-[250px]">
                  <div v-if="item.dialCode.split(',').length > 3">
                    <span v-if="!isRowExpanded(item.dialCode)">
                      {{ item.dialCode.split(',')[0] }}
                    </span>
                    <span v-else>
                      {{ item.dialCode }}
                    </span>
                    <button 
                      @click="toggleExpandRow(item.dialCode)" 
                      class="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-800 transition-colors duration-300"
                    >
                      {{ isRowExpanded(item.dialCode) ? 'Show Less' : 'Show More' }}
                    </button>
                  </div>
                  <div v-else>
                    {{ item.dialCode }}
                  </div>
                </td>
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
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-700">
                  <th class="py-3 text-left text-gray-400 px-4 max-w-[250px] w-[250px]">Dial Code(s)</th>
                  <th class="py-3 text-left text-gray-400 px-4">Destination</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="code in report.nonMatchingCodes" :key="code.dialCode" class="border-b border-gray-700">
                  <td class="py-3 text-foreground px-4 max-w-[250px] w-[250px]">
                    <div v-if="code.dialCode.split(',').length > 3">
                      <span v-if="!isRowExpanded(code.dialCode)">
                        {{ code.dialCode.split(',')[0] }}
                      </span>
                      <span v-else>
                        {{ code.dialCode }}
                      </span>
                      <button 
                        @click="toggleExpandRow(code.dialCode)" 
                        class="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-800 transition-colors duration-300"
                      >
                        {{ isRowExpanded(code.dialCode) ? 'Show Less' : 'Show More' }}
                      </button>
                    </div>
                    <div v-else>
                      {{ code.dialCode }}
                    </div>
                  </td>
                  <td class="py-3 text-foreground px-4">{{ code.destName }}</td>
                </tr>
              </tbody>
            </table>
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
import { resetReportApi } from '@/API/api';
import { useDBstate } from '@/stores/dbStore';

const dbStore = useDBstate();
const expandedRows = ref<Set<string>>(new Set());

const props = defineProps<{
  report: AzPricingReport | null;
}>();

const showUnmatchedCodes = ref(false);

function toggleUnmatchedCodes() {
  showUnmatchedCodes.value = !showUnmatchedCodes.value;
}

function toggleExpandRow(dialCode: string) {
  if (expandedRows.value.has(dialCode)) {
    expandedRows.value.delete(dialCode);
  } else {
    expandedRows.value.add(dialCode);
  }
}

function isRowExpanded(dialCode: string): boolean {
  return expandedRows.value.has(dialCode);
}

function formatPercentage(value: number): string {
  return value.toFixed(2);
}

async function handleReset() {
  console.log('Resetting the AZ report');
  await resetReportApi('az');
  dbStore.resetAzReportInStore();
  dbStore.setShowAzUploadComponents(true);
}
</script>