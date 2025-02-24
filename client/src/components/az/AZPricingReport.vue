<template>
  <div
    v-if="report"
    class="space-y-10 bg-gray-800 p-6"
  >
    <!-- Buy Section -->
    <div class="rounded-lg">
      <h2 class="py-4 text-sizeLg text-center text-fbWhite px-6 border-b border-gray-700">
        <span class="text-fbWhite">
          <span class="uppercase">{{ report.fileName1 }}</span>
          should BUY these destinations from
          <span class="uppercase">{{ report.fileName2 }}</span>
        </span>
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
            <tr
              v-for="item in report.higherRatesForFile1"
              :key="item.dialCode"
              class="border-b border-gray-700"
            >
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
                    w
                  >
                    {{ isRowExpanded(item.dialCode) ? 'Show Less' : 'Show More' }}
                  </button>
                </div>
                <div v-else>
                  {{ item.dialCode }}
                </div>
              </td>
              <td class="py-3 text-foreground px-4">{{ item.destName }}</td>
              <td class="py-3 text-right text-foreground px-4">
                {{ item.rateFile1 }}
              </td>
              <td class="py-3 text-right text-foreground px-4">
                {{ item.rateFile2 }}
              </td>
              <td class="py-3 text-right text-green-500 px-4">
                {{ formatPercentage(item.percentageDifference) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sell Section -->
    <div class="rounded-lg w-full">
      <h2 class="py-4 text-sizeLg text-center text-fbWhite px-6 border-b border-fbBorder">
        <span class="text-fbWhite">
          <span class="uppercase">{{ report.fileName1 }}</span>
          should SELL these destinations from
          <span class="uppercase">{{ report.fileName2 }}</span>
        </span>
      </h2>
      <div class="p-6 overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-fbBorder">
              <th class="py-3 text-left px-4 max-w-[250px] w-[250px]">Dial Code(s)</th>
              <th class="py-3 text-left text-gray-400 px-4">Destination</th>
              <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName1 }}</th>
              <th class="py-3 text-right text-gray-400 px-4">Rate - {{ report.fileName2 }}</th>
              <th class="py-3 text-right text-gray-400 px-4">Difference (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in report.higherRatesForFile2"
              :key="item.dialCode"
              class="border-b border-gray-700"
            >
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
              <td class="py-3 text-right text-foreground px-4">
                {{ item.rateFile1 }}
              </td>
              <td class="py-3 text-right text-foreground px-4">
                {{ item.rateFile2 }}
              </td>
              <td class="py-3 text-right text-red-500 px-4">
                {{ formatPercentage(item.percentageDifference) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Same Rates Section -->
    <div class="rounded-lg overflow-hidden border border-fbBorder">
      <h2 class="py-4 text-sizeLg text-center text-fbWhite px-6 border-b border-fbBorder">Same Rates</h2>
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
            <tr
              v-for="item in report.sameRates"
              :key="item.dialCode"
              class="border-b border-gray-700"
            >
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
              <td class="py-3 text-right text-foreground px-4">
                {{ item.rateFile1 }}
              </td>
              <td class="py-3 text-right text-foreground px-4">
                {{ item.rateFile2 }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Unmatched Codes Section -->
    <div class="rounded-lg overflow-hidden border border-fbBorder">
      <div class="py-4 px-6 flex justify-between items-center border-b border-fbBorder">
        <div class="w-1/4"></div>
        <h2 class="py-4 text-sizeLg text-center text-fbWhite px-6">Unmatched Codes</h2>
        <div class="w-1/4 flex justify-end">
          <button
            @click="toggleUnmatchedCodes"
            class="btn-accent btn-lg"
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
              <tr
                v-for="code in report.nonMatchingCodes"
                :key="code.dialCode"
                class="border-b border-gray-700"
              >
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

  <div
    v-else
    class="text-center text-xl text-muted-foreground"
  >
    No pricing report data available.
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useAzStore } from '@/stores/az-store';
  import type { AzPricingReport } from '@/types/domains/az-types';

  const azStore = useAzStore();
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
</script>
