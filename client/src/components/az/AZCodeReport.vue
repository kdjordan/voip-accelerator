<template>
  <div class="rounded-lg p-6 min-w-content bg-gray-800 pt-4">
    <div
      v-if="report"
      class="space-y-8"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          v-for="file in fileKeys"
          :key="file"
          class="rounded-lg overflow-hidden border border-fbBorder"
        >
          <h2 class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700">
            <span class="text-accent">{{ getFileName(file) }}</span>
          </h2>
          <div class="p-6">
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 text-gray-400">Total Codes:</td>
                  <td class="py-2 text-right">
                    {{ getTotalCodes(file) }}
                  </td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 text-gray-400">Total Destinations:</td>
                  <td class="py-2 text-right">
                    {{ getTotalDestinations(file) }}
                  </td>
                </tr>
                <tr :class="{'border-b border-gray-700': hasInvalidRows(getFileName(file))}">
                  <td class="py-2 font-medium text-gray-400">Unique Destinations Percentage:</td>
                  <td class="py-2 text-right">{{ getUniqueDestinationsPercentage(file) }}%</td>
                </tr>
              </tbody>
            </table>

            <!-- Invalid Rows Section for each file -->
            <div
              v-if="hasInvalidRows(getFileName(file))"
              class="bg-destructive/10 border border-destructive/50 rounded-lg p-2 mt-4"
            >
              <div
                @click="toggleInvalidRowsDetails(file)"
                class="p-2 w-full cursor-pointer rounded-md"
              >
                <div class="flex justify-between items-center">
                  <span class="font-medium text-red-400">Invalid Rows</span>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm bg-red-900/50 text-red-400 px-2 py-0.5 rounded">
                      {{ getInvalidRowsForFile(getFileName(file)).length }}
                    </span>
                    <ChevronDownIcon
                      :class="{ 'transform rotate-180': expandedInvalidSections[file] }"
                      class="w-4 h-4 transition-transform text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <!-- Invalid Rows Content -->
              <div
                v-if="expandedInvalidSections[file]"
                class="mt-2 space-y-2 max-h-[300px] overflow-y-auto"
              >
                <!-- Group invalid rows by destination -->
                <div
                  v-for="(group, destName) in groupInvalidRowsByDestination(getFileName(file))"
                  :key="destName"
                  class="bg-gray-900/80 p-3 rounded-lg"
                >
                  <div
                    @click="toggleExpandInvalidRow(file, destName)"
                    class="flex justify-between items-center cursor-pointer p-1 rounded"
                  >
                    <span class="font-medium text-sm">{{ destName || 'Unknown Destination' }}</span>
                    <div class="flex items-center space-x-3">
                      <span class="text-xs text-gray-400">{{ group.length }} invalid entries</span>
                      <ChevronDownIcon
                        :class="{ 'transform rotate-180': isDestExpanded(file, destName) }"
                        class="w-3 h-3 transition-transform"
                      />
                    </div>
                  </div>

                  <!-- Expanded invalid entries list -->
                  <div
                    v-if="isDestExpanded(file, destName)"
                    class="mt-2 pl-2 space-y-1"
                  >
                    <div
                      v-for="row in group"
                      :key="`${row.rowIndex}-${row.dialCode}`"
                      class="flex justify-between items-center  px-3 py-1.5 rounded text-sm"
                    >
                      <div class="flex flex-col">
                        <span class="text-gray-300">{{ row.dialCode || 'No Code' }}</span>
                        <span class="text-gray-400 text-xs">{{ row.reason }}</span>
                      </div>
                      <span class="text-red-400">{{ row.invalidRate }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg overflow-hidden border border-fbBorder">
        <h2 class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700">
          <span class="text-accent">Comparison</span>
        </h2>
        <div class="p-6">
          <table class="w-full">
            <tbody>
              <tr class="border-b border-gray-700">
                <td class="py-2 font-medium text-gray-400">Matched Codes:</td>
                <td class="py-2 text-right text-foreground">
                  {{ report.matchedCodes }}
                </td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="py-2 font-medium text-gray-400">Non-Matched Codes:</td>
                <td class="py-2 text-right text-foreground">
                  {{ report.nonMatchedCodes }}
                </td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="py-2 font-medium text-gray-400">Matched Codes Percentage:</td>
                <td class="py-2 text-right text-foreground">{{ report.matchedCodesPercentage.toFixed(2) }}%</td>
              </tr>
              <tr>
                <td class="py-2 font-medium text-gray-400">Non-Matched Codes Percentage:</td>
                <td class="py-2 text-right text-foreground">{{ report.nonMatchedCodesPercentage.toFixed(2) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-else
      class="text-center text-xl text-muted-foreground"
    >
      No code report data available.
    </div>
  </div>
</template>

<script setup lang="ts">
  import { type AzCodeReport, type InvalidAzRow } from '@/types/domains/az-types';
  import { ref, reactive, computed } from 'vue';
  import { ChevronDownIcon } from '@heroicons/vue/24/outline';
  import { useAzStore } from '@/stores/az-store';

  const props = defineProps<{
    report: AzCodeReport | null;
  }>();

  const store = useAzStore();
  const fileKeys = ['file1', 'file2'] as const;
  type FileKey = (typeof fileKeys)[number];

  // State for invalid rows UI
  const expandedInvalidSections = reactive<Record<FileKey, boolean>>({
    file1: false,
    file2: false,
  });

  const expandedDestinations = reactive<Record<FileKey, Set<string>>>({
    file1: new Set(),
    file2: new Set(),
  });

  function getFileName(file: FileKey): string {
    return props.report?.[file].fileName ?? '';
  }

  function getTotalCodes(file: FileKey): number {
    return props.report?.[file].totalCodes ?? 0;
  }

  function getTotalDestinations(file: FileKey): number {
    return props.report?.[file].totalDestinations ?? 0;
  }

  function getUniqueDestinationsPercentage(file: FileKey): string {
    return props.report?.[file].uniqueDestinationsPercentage.toFixed(2) ?? '0.00';
  }

  function toggleInvalidRowsDetails(file: FileKey): void {
    expandedInvalidSections[file] = !expandedInvalidSections[file];
  }

  function toggleExpandInvalidRow(file: FileKey, destName: string): void {
    if (expandedDestinations[file].has(destName)) {
      expandedDestinations[file].delete(destName);
    } else {
      expandedDestinations[file].add(destName);
    }
  }

  function isDestExpanded(file: FileKey, destName: string): boolean {
    return expandedDestinations[file].has(destName);
  }

  // Helper functions to access the store's invalidRows
  function hasInvalidRows(fileName: string): boolean {
    return store.invalidRows.has(fileName) && (store.invalidRows.get(fileName)?.length || 0) > 0;
  }

  function getInvalidRowsForFile(fileName: string): InvalidAzRow[] {
    return store.invalidRows.get(fileName) || [];
  }

  function groupInvalidRowsByDestination(fileName: string): Record<string, InvalidAzRow[]> {
    const invalidRows = getInvalidRowsForFile(fileName);
    const grouped: Record<string, InvalidAzRow[]> = {};

    invalidRows.forEach((row: InvalidAzRow) => {
      const destName = row.destName || 'Unknown';
      if (!grouped[destName]) {
        grouped[destName] = [];
      }
      grouped[destName].push(row);
    });

    return grouped;
  }
</script>
