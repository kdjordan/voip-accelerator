<template>
  <div
    v-if="usStore.getFileNameByComponent(componentId) !== ''"
    class="mt-8 pt-8 border-t border-gray-700/50"
  >
    <!-- Code Report heading with file name pill -->
    <div class="mb-4 flex items-center justify-between">
      <span class="text-xl text-fbWhite font-secondary">Code Report</span>
      <div
        class="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 border border-accent/50"
      >
        <span class="text-sm text-accent">{{ usStore.getFileNameByComponent(componentId) }}</span>
      </div>
    </div>

    <!-- Code Report Content - Dark bento box style -->
    <div class="bg-gray-900 rounded-lg p-4">
      <div class="space-y-4">
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-1">Total Codes:</div>
          <div class="text-xl text-white">{{ usStore.getFileStats(componentId).totalCodes }}</div>
        </div>

        <!-- NPAs Section with Coverage -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">US NPA Statistics:</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">LERG Count</div>
              <div class="text-lg text-white">
                {{ lergStore.getTotalUSNPAs }}
              </div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">File Count</div>
              <div class="text-lg text-white">
                {{ usStore.getFileStats(componentId).totalDestinations }}
              </div>
            </div>

            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Coverage</div>
              <div class="text-lg text-white">
                {{ usStore.getFileStats(componentId).usNPACoveragePercentage }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Rate Statistics Section -->
        <div class="bg-gray-800 p-3 rounded-lg">
          <div class="text-gray-400 mb-2">Average Rates:</div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Interstate</div>
              <div class="text-lg text-white">
                ${{ usStore.getFileStats(componentId).avgInterRate }}
              </div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Intrastate</div>
              <div class="text-lg text-white">
                ${{ usStore.getFileStats(componentId).avgIntraRate }}
              </div>
            </div>
            <div class="bg-gray-900 p-2 rounded-lg">
              <div class="text-gray-400 text-sm mb-1">Indeterminate</div>
              <div class="text-lg text-white">
                ${{ usStore.getFileStats(componentId).avgIndetermRate }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUsStore } from '@/stores/us-store';
import { useLergStore } from '@/stores/lerg-store';

// Define props
const props = defineProps<{
  componentId: string;
}>();

const usStore = useUsStore();
const lergStore = useLergStore();
</script>
