<template>
  <div class="rounded-lg p-6 min-w-content bg-gray-800 pt-4">
    <div v-if="hasSingleFile || hasTwoFiles" class="space-y-8">
      <!-- Individual File Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- File 1 Stats (if fileNameAz1 exists) -->
        <div v-if="fileNameAz1" class="rounded-lg overflow-hidden bg-gray-900/50">
          <h2 class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700">
            <span class="text-accent">{{ fileNameAz1 }}</span>
          </h2>
          <div class="p-6">
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 text-gray-400">Total Codes:</td>
                  <td class="py-2 text-right">{{ statsAz1.totalCodes }}</td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 text-gray-400">Total Destinations:</td>
                  <td class="py-2 text-right">{{ statsAz1.totalDestinations }}</td>
                </tr>
                <tr :class="{ 'border-b border-gray-700': hasInvalidRows(fileNameAz1) }">
                  <td class="py-2 font-medium text-gray-400">Unique Destinations %:</td>
                  <td class="py-2 text-right">
                    {{ statsAz1.uniqueDestinationsPercentage.toFixed(2) }}%
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Invalid Rows Section for File 1 -->
            <div v-if="hasInvalidRows(fileNameAz1)" class="mt-4">
              <div
                @click="toggleInvalidRowsDetails('az1')"
                class="flex items-center justify-between w-full px-6 py-3 rounded-md cursor-pointer bg-red-900/50 border border-red-500/40 hover:bg-red-900/70 hover:border-red-500/60 transition-colors shadow-sm"
              >
                <div class="flex items-center space-x-2">
                  <h3 class="text-sm font-medium text-red-400">Invalid Rows Not Uploaded</h3>
                  <span class="text-sm font-medium text-red-400"
                    >({{ getInvalidRowsForFile(fileNameAz1).length }})</span
                  >
                </div>
                <ChevronDownIcon
                  :class="{ 'transform rotate-180': expandedInvalidSections.az1 }"
                  class="w-4 h-4 text-red-400"
                />
              </div>
              <div
                v-if="expandedInvalidSections.az1"
                class="mt-1 transition-all duration-300 ease-in-out bg-red-900/50 rounded-b-md overflow-hidden border-x border-b border-red-500/40"
              >
                <div class="px-6 py-4">
                  <!-- Invalid Rows Table for File 1 -->
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
                        v-for="row in getInvalidRowsForFile(fileNameAz1)"
                        :key="`az1-${row.rowIndex}-${row.dialCode}`"
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

        <!-- File 2 Stats (if fileNameAz2 exists) -->
        <div v-if="fileNameAz2" class="rounded-lg overflow-hidden bg-gray-900/50">
          <h2 class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700">
            <span class="text-accent">{{ fileNameAz2 }}</span>
          </h2>
          <div class="p-6">
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 text-gray-400">Total Codes:</td>
                  <td class="py-2 text-right">{{ statsAz2.totalCodes }}</td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 text-gray-400">Total Destinations:</td>
                  <td class="py-2 text-right">{{ statsAz2.totalDestinations }}</td>
                </tr>
                <tr :class="{ 'border-b border-gray-700': hasInvalidRows(fileNameAz2) }">
                  <td class="py-2 font-medium text-gray-400">Unique Destinations %:</td>
                  <td class="py-2 text-right">
                    {{ statsAz2.uniqueDestinationsPercentage.toFixed(2) }}%
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Invalid Rows Section for File 2 -->
            <div v-if="hasInvalidRows(fileNameAz2)" class="mt-4">
              <div
                @click="toggleInvalidRowsDetails('az2')"
                class="flex items-center justify-between w-full px-6 py-3 rounded-md cursor-pointer bg-red-900/50 border border-red-500/40 hover:bg-red-900/70 hover:border-red-500/60 transition-colors shadow-sm"
              >
                <div class="flex items-center space-x-2">
                  <h3 class="text-sm font-medium text-red-400">Invalid Rows Not Uploaded</h3>
                  <span class="text-sm font-medium text-red-400"
                    >({{ getInvalidRowsForFile(fileNameAz2).length }})</span
                  >
                </div>
                <ChevronDownIcon
                  :class="{ 'transform rotate-180': expandedInvalidSections.az2 }"
                  class="w-4 h-4 text-red-400"
                />
              </div>
              <div
                v-if="expandedInvalidSections.az2"
                class="mt-1 transition-all duration-300 ease-in-out bg-red-900/50 rounded-b-md overflow-hidden border-x border-b border-red-500/40"
              >
                <div class="px-6 py-4">
                  <!-- Invalid Rows Table for File 2 -->
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
                        v-for="row in getInvalidRowsForFile(fileNameAz2)"
                        :key="`az2-${row.rowIndex}-${row.dialCode}`"
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

      <!-- Comparison Section - Only show when comparison report is available -->
      <div
        v-if="showComparisonSection && comparisonReport"
        class="rounded-lg overflow-hidden bg-gray-900/50"
      >
        <h2 class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700">
          <span class="text-accent">Comparison Summary</span>
        </h2>
        <div class="p-6">
          <table class="w-full">
            <tbody>
              <tr class="border-b border-gray-700">
                <td class="py-2 font-medium text-gray-400">Matched Codes:</td>
                <td class="py-2 text-right text-foreground">
                  {{ comparisonReport.matchedCodes }}
                </td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="py-2 font-medium text-gray-400">Non-Matched Codes:</td>
                <td class="py-2 text-right text-foreground">
                  {{ comparisonReport.nonMatchedCodes }}
                </td>
              </tr>
              <tr class="border-b border-gray-700">
                <td class="py-2 font-medium text-gray-400">Matched Codes Percentage:</td>
                <td class="py-2 text-right text-foreground">
                  {{ comparisonReport.matchedCodesPercentage.toFixed(2) }}%
                </td>
              </tr>
              <tr>
                <td class="py-2 font-medium text-gray-400">Non-Matched Codes Percentage:</td>
                <td class="py-2 text-right text-foreground">
                  {{ comparisonReport.nonMatchedCodesPercentage.toFixed(2) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Message if no files are uploaded -->
    <div v-else class="text-center text-xl text-muted-foreground">
      Upload files to view code report details.
    </div>
  </div>
</template>

<script setup lang="ts">
import { type AzCodeReport, type InvalidAzRow } from '@/types/domains/az-types';
import { ref, reactive, computed } from 'vue';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import { useAzStore } from '@/stores/az-store';

// Remove the props definition, get data from store directly
// const props = defineProps<{
//   report: AzCodeReport | null;
// }>();

const store = useAzStore();

type ComponentId = 'az1' | 'az2';

// --- Computed properties to get data from the store ---

const fileNameAz1 = computed(() => store.getFileNameByComponent('az1'));
const fileNameAz2 = computed(() => store.getFileNameByComponent('az2'));

const statsAz1 = computed(() => store.getFileStats('az1'));
const statsAz2 = computed(() => store.getFileStats('az2'));

const comparisonReport = computed(() => store.getCodeReport);

const hasSingleFile = computed(() => store.getNumberOfFilesUploaded === 1);
const hasTwoFiles = computed(() => store.getNumberOfFilesUploaded === 2);
const showComparisonSection = computed(
  () => store.reportsGenerated && comparisonReport.value !== null
);

// --- State for UI (Invalid Rows) ---
const expandedInvalidSections = reactive<Record<ComponentId, boolean>>({
  az1: false,
  az2: false,
});

const expandedDestinations = reactive<Record<ComponentId, Set<string>>>({
  az1: new Set(),
  az2: new Set(),
});

// --- Helper functions ---

// Keep these as they correctly use the store
function hasInvalidRows(fileName: string): boolean {
  return store.invalidRows.has(fileName) && (store.invalidRows.get(fileName)?.length || 0) > 0;
}

function getInvalidRowsForFile(fileName: string): InvalidAzRow[] {
  return store.invalidRows.get(fileName) || [];
}

// Adapt toggle functions to use ComponentId
function toggleInvalidRowsDetails(componentId: ComponentId): void {
  expandedInvalidSections[componentId] = !expandedInvalidSections[componentId];
}

function toggleExpandInvalidRow(componentId: ComponentId, destName: string): void {
  if (expandedDestinations[componentId].has(destName)) {
    expandedDestinations[componentId].delete(destName);
  } else {
    expandedDestinations[componentId].add(destName);
  }
}

function isDestExpanded(componentId: ComponentId, destName: string): boolean {
  return expandedDestinations[componentId].has(destName);
}

// --- Removed functions relying on props.report ---
// function getFileName(file: FileKey): string {
// function getTotalCodes(file: FileKey): number {
// function getTotalDestinations(file: FileKey): number {
// function getUniqueDestinationsPercentage(file: FileKey): string {
// function groupInvalidRowsByDestination(fileName: string): Record<string, InvalidAzRow[]> {
</script>
