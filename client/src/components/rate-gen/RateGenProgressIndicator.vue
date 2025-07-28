<template>
  <div class="flex-1 flex flex-col items-center justify-center w-full space-y-4 px-8">
    <!-- Progress Bar Container -->
    <div class="w-full max-w-md space-y-2">
      <!-- Status Text -->
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-400">{{ progressText }}</span>
        <span class="text-accent font-medium">{{ Math.min(100, Math.round(progress)) }}%</span>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
        <div 
          class="bg-accent h-full rounded-full transition-all duration-300 ease-out"
          :style="`width: ${Math.min(100, progress)}%`"
        />
      </div>
      
      <!-- Details Row -->
      <div class="flex justify-between items-center text-xs text-gray-500">
        <span>{{ formattedRowsProcessed }} of {{ formattedTotalRows }} rows</span>
        <span v-if="timeRemaining">{{ timeRemaining }} remaining</span>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';

interface Props {
  totalRows: number;
  progress: number; // Progress from 0-100 (comes from store)
}

const props = defineProps<Props>();

// Track start time for time estimates
const startTime = ref<number>(0);

// Track when we hit 90% for metadata detection
const timeAt90 = ref<number>(0);

// Computed values
const progressText = computed(() => {
  if (props.progress < 30) {
    return 'Reading CSV file...';
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

const estimatedRowsProcessed = computed(() => {
  const progressRatio = props.progress / 100;
  return Math.floor(props.totalRows * progressRatio);
});

const formattedRowsProcessed = computed(() => 
  estimatedRowsProcessed.value.toLocaleString()
);

const formattedTotalRows = computed(() => 
  props.totalRows.toLocaleString()
);

const timeRemaining = computed(() => {
  if (props.progress === 0 || props.progress >= 110) return null;
  
  // Don't show time estimates during metadata gathering (100%+)
  if (props.progress >= 100) return null;
  
  const elapsed = (Date.now() - startTime.value) / 1000;
  if (elapsed < 1) return null; // Not enough data yet
  
  const rate = props.progress / elapsed;
  const remaining = (100 - props.progress) / rate;
  
  if (remaining < 1) return 'Less than 1s';
  if (remaining < 60) return `${Math.round(remaining)}s`;
  
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.round(remaining % 60);
  return `${minutes}m ${seconds}s`;
});

// Lifecycle
onMounted(() => {
  startTime.value = Date.now();
});

// Watch progress changes
watch(() => props.progress, (newProgress, oldProgress) => {
  // Progress monitoring for component updates
}, { immediate: true });

// Public method to mark as complete (for API compatibility with UploadProgressIndicator)
defineExpose({
  complete() {
    // This component is reactive to props.progress, so completion is handled externally
  }
});
</script>