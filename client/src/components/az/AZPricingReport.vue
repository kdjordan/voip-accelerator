<template>
  <div
    v-if="report"
    class="space-y-6 bg-gray-800 p-6"
  >
    <!-- Buy Section -->
    <div class="bg-gray-900/30 rounded-lg overflow-hidden">
      <div
        @click="toggleSection('buy')"
        class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-lg">
            <span class="uppercase">{{ report.fileName1 }}</span> should BUY from
            <span class="uppercase">{{ report.fileName2 }}</span>
          </span>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
              {{ report.higherRatesForFile1.length }} destinations
            </span>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedSections.buy }"
              class="w-5 h-5 transition-transform"
            />
          </div>
        </div>
      </div>

      <!-- Buy Content -->
      <div
        v-if="expandedSections.buy"
        class="p-4 space-y-4"
      >
        <div
          v-for="item in report.higherRatesForFile1"
          :key="item.dialCode"
          class="bg-gray-900/80 p-4 rounded-lg hover:bg-gray-600/40 transition-colors"
        >
          <div class="flex justify-between items-center">
            <div class="space-y-1">
              <div class="font-medium">{{ item.destName }}</div>
              <div class="text-sm text-gray-400">
                <span v-if="!isRowExpanded(item.dialCode) && item.dialCode.split(',').length > 3">
                  {{ item.dialCode.split(',')[0] }}
                  <button
                    @click.stop="toggleExpandRow(item.dialCode)"
                    class="ml-2 text-accent hover:text-accent/80"
                  >
                    Show All ({{ item.dialCode.split(',').length }})
                  </button>
                </span>
                <span v-else>{{ item.dialCode }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-8 text-right">
              <div>
                <div class="text-sm text-gray-400">Current Rate</div>
                <div class="font-medium">{{ item.rateFile1 }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-400">Target Rate</div>
                <div class="font-medium">{{ item.rateFile2 }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-400">Difference</div>
                <div class="font-medium text-green-500">{{ formatPercentage(item.percentageDifference) }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sell Section -->
    <div class="bg-gray-900/30 rounded-lg overflow-hidden">
      <div
        @click="toggleSection('sell')"
        class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-lg">
            <span class="uppercase">{{ report.fileName1 }}</span> should SELL to
            <span class="uppercase">{{ report.fileName2 }}</span>
          </span>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
              {{ report.higherRatesForFile2.length }} destinations
            </span>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedSections.sell }"
              class="w-5 h-5 transition-transform"
            />
          </div>
        </div>
      </div>

      <!-- Sell Content -->
      <div
        v-if="expandedSections.sell"
        class="p-4 space-y-4"
      >
        <div
          v-for="item in report.higherRatesForFile2"
          :key="item.dialCode"
          class="bg-gray-900/80 p-4 rounded-lg hover:bg-gray-600/40 transition-colors"
        >
          <div class="flex justify-between items-center">
            <div class="space-y-1">
              <div class="font-medium">{{ item.destName }}</div>
              <div class="text-sm text-gray-400">
                <span v-if="!isRowExpanded(item.dialCode) && item.dialCode.split(',').length > 3">
                  {{ item.dialCode.split(',')[0] }}
                  <button
                    @click.stop="toggleExpandRow(item.dialCode)"
                    class="ml-2 text-accent hover:text-accent/80"
                  >
                    Show All ({{ item.dialCode.split(',').length }})
                  </button>
                </span>
                <span v-else>{{ item.dialCode }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-8 text-right">
              <div>
                <div class="text-sm text-gray-400">Current Rate</div>
                <div class="font-medium">{{ item.rateFile1 }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-400">Target Rate</div>
                <div class="font-medium">{{ item.rateFile2 }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-400">Difference</div>
                <div class="font-medium text-red-500">{{ formatPercentage(item.percentageDifference) }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Same Rates Section -->
    <div class="bg-gray-900/30 rounded-lg overflow-hidden">
      <div
        @click="toggleSection('same')"
        class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-lg">Same Rates</span>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
              {{ report.sameRates.length }} destinations
            </span>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedSections.same }"
              class="w-5 h-5 transition-transform"
            />
          </div>
        </div>
      </div>

      <!-- Same Rates Content -->
      <div
        v-if="expandedSections.same"
        class="p-4 space-y-4"
      >
        <div
          v-for="item in report.sameRates"
          :key="item.dialCode"
          class="bg-gray-900/80 p-4 rounded-lg hover:bg-gray-600/40 transition-colors"
        >
          <div class="flex justify-between items-center">
            <div class="space-y-1">
              <div class="font-medium">{{ item.destName }}</div>
              <div class="text-sm text-gray-400">
                <span v-if="!isRowExpanded(item.dialCode) && item.dialCode.split(',').length > 3">
                  {{ item.dialCode.split(',')[0] }}
                  <button
                    @click.stop="toggleExpandRow(item.dialCode)"
                    class="ml-2 text-accent hover:text-accent/80"
                  >
                    Show All ({{ item.dialCode.split(',').length }})
                  </button>
                </span>
                <span v-else>{{ item.dialCode }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-8 text-right">
              <div>
                <div class="text-sm text-gray-400">Rate</div>
                <div class="font-medium">{{ item.rateFile1 }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unmatched Codes Section -->
    <div class="bg-gray-900/30 rounded-lg overflow-hidden">
      <div
        @click="toggleSection('unmatched')"
        class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium text-lg">Unmatched Codes</span>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
              {{ report.nonMatchingCodes.length }} destinations
            </span>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': expandedSections.unmatched }"
              class="w-5 h-5 transition-transform"
            />
          </div>
        </div>
      </div>

      <!-- Unmatched Content -->
      <div
        v-if="expandedSections.unmatched"
        class="p-4 space-y-4"
      >
        <div
          v-for="code in report.nonMatchingCodes"
          :key="code.dialCode"
          class="bg-gray-900/80 p-4 rounded-lg hover:bg-gray-600/40 transition-colors"
        >
          <div class="flex justify-between items-center">
            <div class="space-y-1">
              <div class="font-medium">{{ code.destName }}</div>
              <div class="text-sm text-gray-400">
                <span v-if="!isRowExpanded(code.dialCode) && code.dialCode.split(',').length > 3">
                  {{ code.dialCode.split(',')[0] }}
                  <button
                    @click.stop="toggleExpandRow(code.dialCode)"
                    class="ml-2 text-accent hover:text-accent/80"
                  >
                    Show All ({{ code.dialCode.split(',').length }})
                  </button>
                </span>
                <span v-else>{{ code.dialCode }}</span>
              </div>
            </div>
            <div class="text-sm text-gray-400">
              Found in: <span class="text-accent">{{ code.file }}</span>
            </div>
          </div>
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
  import { ref, reactive } from 'vue';
  import { ChevronDownIcon } from '@heroicons/vue/24/outline';
  import type { AzPricingReport } from '@/types/domains/az-types';

  const props = defineProps<{
    report: AzPricingReport | null;
  }>();

  const expandedRows = ref<Set<string>>(new Set());
  const expandedSections = reactive({
    buy: false,
    sell: false,
    same: false,
    unmatched: false,
  });

  function toggleSection(section: keyof typeof expandedSections) {
    expandedSections[section] = !expandedSections[section];
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
