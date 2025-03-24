<template>
  <div class="rounded-lg p-6 min-w-content bg-gray-800 pt-4">
    <div v-if="report" class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          v-for="file in visibleFileKeys"
          :key="file"
          class="rounded-lg overflow-hidden bg-gray-900/50"
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
                <tr :class="{ 'border-b border-gray-700': hasInvalidRows(getFileName(file)) }">
                  <td class="py-2 font-medium text-gray-400">Unique Destinations Percentage:</td>
                  <td class="py-2 text-right">{{ getUniqueDestinationsPercentage(file) }}%</td>
                </tr>
              </tbody>
            </table>

            <!-- Invalid Rows Section for each file -->
            <div v-if="hasInvalidRows(getFileName(file))" class="-mx-6 mt-4">
              <div
                @click="toggleInvalidRowsDetails(file)"
                class="bg-red-900/50 px-6 py-3 border-y border-red-500/30 cursor-pointer hover:bg-red-900/70 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <h3 class="text-sm font-medium text-red-400">Invalid Rows Not Uploaded</h3>
                    <span class="text-sm font-medium text-red-400"
                      >({{ getInvalidRowsForFile(getFileName(file)).length }})</span
                    >
                  </div>
                  <ChevronDownIcon
                    :class="{ 'transform rotate-180': expandedInvalidSections[file] }"
                    class="w-4 h-4 text-red-400"
                  />
                </div>
              </div>

              <!-- Invalid Rows Content -->
              <div
                v-if="expandedInvalidSections[file]"
                class="transition-all duration-300 ease-in-out bg-red-900/50"
              >
                <div class="px-6 py-4">
                  <table class="w-full min-w-full border-separate border-spacing-0">
                    <thead class="bg-gray-800/80">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-300">ROW</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-300">NAME</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-300">
                          PREFIX
                        </th>
                        <th class="px-4 py-2 text-right text-xs font-medium text-gray-300">RATE</th>
                      </tr>
                    </thead>
                    <tbody class="bg-gray-900/80">
                      <tr
                        v-for="row in getInvalidRowsForFile(getFileName(file))"
                        :key="`${row.rowIndex}-${row.dialCode}`"
                        class="hover:bg-gray-800/50"
                      >
                        <td class="px-4 py-2 text-sm text-gray-300 border-t border-gray-800/50">
                          {{ row.rowIndex }}
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-300 border-t border-gray-800/50">
                          {{ row.destName || 'Unknown' }}
                        </td>
                        <td
                          class="px-4 py-2 text-sm text-gray-300 font-mono border-t border-gray-800/50"
                        >
                          {{ row.dialCode || 'No Code' }}
                        </td>
                        <td
                          class="px-4 py-2 text-sm text-red-400 text-right font-mono border-t border-gray-800/50"
                        >
                          {{ row.invalidRate }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Section - Only show when two files are available -->
      <div v-if="isTwoFileReport" class="rounded-lg overflow-hidden bg-gray-900/50">
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
                <td class="py-2 text-right text-foreground">
                  {{ report.matchedCodesPercentage.toFixed(2) }}%
                </td>
              </tr>
              <tr>
                <td class="py-2 font-medium text-gray-400">Non-Matched Codes Percentage:</td>
                <td class="py-2 text-right text-foreground">
                  {{ report.nonMatchedCodesPercentage.toFixed(2) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-xl text-muted-foreground">
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

// Determine which file keys to show based on the report
const visibleFileKeys = computed(() => {
  if (!props.report) return [];

  // If file2 has a filename, show both files
  if (props.report.file2.fileName) {
    return fileKeys;
  }

  // Otherwise, only show file1
  return ['file1'] as const;
});

// Determine if this is a two-file report or a single-file report
const isTwoFileReport = computed(() => {
  return props.report?.file2.fileName !== '';
});

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
