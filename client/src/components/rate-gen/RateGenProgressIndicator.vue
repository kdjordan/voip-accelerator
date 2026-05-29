<template>
  <div class="flex-1 flex flex-col items-center justify-center w-full space-y-4 px-8">
    <!-- Progress Bar Container -->
    <div class="w-full max-w-md space-y-2">
      <!-- Status Text -->
      <div class="flex justify-between items-center text-sm">
        <span class="flex items-center gap-2 text-gray-400">
          <!-- Bar is full at 100%+ but the metadata routine runs a few more
               seconds — a spinner shows it's still working, not done. -->
          <ArrowPathIcon v-if="isGatheringMeta" class="h-4 w-4 animate-spin text-accent" />
          {{ progressText }}
        </span>
        <span class="font-medium text-accent">{{ Math.min(100, Math.round(progress)) }}%</span>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
        <div
          class="h-full rounded-full bg-accent transition-all duration-300 ease-out"
          :style="`width: ${Math.min(100, progress)}%;`"
        />
      </div>

      <!-- Row count (no time estimate — just rows processed of total) -->
      <div class="text-xs text-gray-500">
        {{ formattedRowsProcessed }} of {{ formattedTotalRows }} rows
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowPathIcon } from '@heroicons/vue/24/outline';

interface Props {
  totalRows: number;
  progress: number; // Progress from 0-100 (comes from store)
}

const props = defineProps<Props>();

// 100–110 = post-store metadata gathering: bar is full but a stats routine is
// still running, so show a spinner.
const isGatheringMeta = computed(() => props.progress >= 100 && props.progress < 110);

// Rows processed (derived from progress, clamped to the total at 100%+).
const formattedRowsProcessed = computed(() =>
  Math.floor((props.totalRows * Math.min(100, props.progress)) / 100).toLocaleString()
);
const formattedTotalRows = computed(() => props.totalRows.toLocaleString());

const progressText = computed(() => {
  if (props.progress < 30) {
    return 'Reading file...';
  } else if (props.progress < 70) {
    return 'Validating data...';
  } else if (props.progress < 100) {
    return 'Storing on your browser...';
  } else if (props.progress <= 105) {
    // At 100%, the real processing (metadata gathering) begins
    return 'Gathering MetaData...';
  } else {
    // Above 105%, everything is truly complete
    return 'Processing complete!';
  }
});

// Public method to mark as complete (for API compatibility with UploadProgressIndicator)
defineExpose({
  complete() {
    // This component is reactive to props.progress, so completion is handled externally
  }
});
</script>