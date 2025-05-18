<template>
  <div class="overflow-x-auto">
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
              <InvalidRows
                v-if="hasInvalidRows(fileNameAz1)"
                :items="invalidRowsFile1"
                title="Invalid Rows Not Uploaded"
                class="mt-4 -mx-6"
              />
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
              <InvalidRows
                v-if="hasInvalidRows(fileNameAz2)"
                :items="invalidRowsFile2"
                title="Invalid Rows Not Uploaded"
                class="mt-4 -mx-6"
              />
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
  </div>
</template>

<script setup lang="ts">
  import { type AzCodeReport, type InvalidAzRow } from '@/types/domains/az-types';
  import { ref, reactive, computed } from 'vue';
  import { ChevronDownIcon } from '@heroicons/vue/24/outline';
  import { useAzStore } from '@/stores/az-store';
  import InvalidRows from '@/components/shared/InvalidRows.vue';
  import type { InvalidRowEntry } from '@/types/components/invalid-rows-types';

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

  // --- Computed properties for InvalidRows component ---
  const invalidRowsFile1 = computed<InvalidRowEntry[]>(() => {
    if (!fileNameAz1.value) return [];
    return getInvalidRowsForFile(fileNameAz1.value).map((row) => ({
      rowNumber: row.rowIndex,
      name: row.destName || 'Unknown',
      identifier: row.dialCode || 'No Code',
      problemValue: String(row.invalidRate),
    }));
  });

  const invalidRowsFile2 = computed<InvalidRowEntry[]>(() => {
    if (!fileNameAz2.value) return [];
    return getInvalidRowsForFile(fileNameAz2.value).map((row) => ({
      rowNumber: row.rowIndex,
      name: row.destName || 'Unknown',
      identifier: row.dialCode || 'No Code',
      problemValue: String(row.invalidRate),
    }));
  });

  // --- Removed functions relying on props.report ---
  // function getFileName(file: FileKey): string {
  // function getTotalCodes(file: FileKey): number {
  // function getTotalDestinations(file: FileKey): number {
  // function getUniqueDestinationsPercentage(file: FileKey): string {
  // function groupInvalidRowsByDestination(fileName: string): Record<string, InvalidAzRow[]> {
</script>
