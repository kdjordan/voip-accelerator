<template>
  <div class="flex-1 flex flex-col items-center justify-center w-full space-y-4 px-8">
    <!-- Progress Bar Container -->
    <div class="w-full max-w-md space-y-2">
      <!-- Status Text -->
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-400">{{ progressText }}</span>
        <span class="text-accent font-medium">{{ percentage }}%</span>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
        <div 
          class="bg-accent h-full rounded-full transition-all duration-300 ease-out"
          :style="`width: ${percentage}%`"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  totalRows: number;
  rowsPerSecond?: number;
  startDelay?: number;
  stages?: Array<{
    name: string;
    label: string;
    weight: number;
  }>;
}

const props = withDefaults(defineProps<Props>(), {
  rowsPerSecond: 14000, // Based on your measurements
  startDelay: 500, // Small delay before starting
  stages: () => [
    { name: 'parsing', label: 'Reading', weight: 0.25 },
    { name: 'validating', label: 'Validating', weight: 0.35 },
    { name: 'storing', label: 'Storing', weight: 0.40 }
  ]
});

// Progress state
const startTime = ref<number>(0);
const currentStageIndex = ref(0);
const stageProgress = ref(0);
const isComplete = ref(false);
let animationFrame: number | null = null;

// Computed values
const percentage = computed(() => {
  if (isComplete.value) return 100;
  
  let totalProgress = 0;
  
  // Add completed stages
  for (let i = 0; i < currentStageIndex.value; i++) {
    totalProgress += props.stages[i].weight * 100;
  }
  
  // Add current stage progress
  if (currentStageIndex.value < props.stages.length) {
    totalProgress += stageProgress.value * props.stages[currentStageIndex.value].weight * 100;
  }
  
  // Cap at 99% until truly complete
  return Math.min(99, Math.round(totalProgress));
});

const currentStage = computed(() => 
  props.stages[currentStageIndex.value] || props.stages[props.stages.length - 1]
);

const progressText = computed(() => {
  const stageLabels = {
    parsing: 'Reading CSV file...',
    validating: 'Validating data...',
    storing: 'Storing on your browser...'
  };
  
  return stageLabels[currentStage.value.name] || 'Processing...';
});

const estimatedRowsProcessed = computed(() => {
  const elapsed = (Date.now() - startTime.value) / 1000;
  const totalWeight = props.stages.reduce((sum, s) => sum + s.weight, 0);
  const adjustedRate = props.rowsPerSecond * totalWeight; // Adjust for stage weights
  
  return Math.min(props.totalRows, Math.floor(elapsed * adjustedRate * (percentage.value / 100)));
});

const formattedRowsProcessed = computed(() => 
  estimatedRowsProcessed.value.toLocaleString()
);

const formattedTotalRows = computed(() => 
  props.totalRows.toLocaleString()
);

const timeRemaining = computed(() => {
  if (percentage.value === 0) return null;
  
  const elapsed = (Date.now() - startTime.value) / 1000;
  const rate = percentage.value / elapsed;
  const remaining = (100 - percentage.value) / rate;
  
  if (remaining < 1) return 'Less than 1s';
  if (remaining < 60) return `${Math.round(remaining)}s`;
  
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.round(remaining % 60);
  return `${minutes}m ${seconds}s`;
});

// Animation logic
function animate() {
  if (isComplete.value) return;
  
  const elapsed = (Date.now() - startTime.value) / 1000;
  const totalEstimatedTime = props.totalRows / props.rowsPerSecond;
  
  // Calculate which stage we should be in
  let cumulativeTime = 0;
  let targetStage = 0;
  
  for (let i = 0; i < props.stages.length; i++) {
    const stageTime = totalEstimatedTime * props.stages[i].weight;
    if (elapsed < cumulativeTime + stageTime) {
      targetStage = i;
      stageProgress.value = (elapsed - cumulativeTime) / stageTime;
      break;
    }
    cumulativeTime += stageTime;
  }
  
  currentStageIndex.value = Math.min(targetStage, props.stages.length - 1);
  
  // Continue animation
  animationFrame = requestAnimationFrame(animate);
}


// Lifecycle
onMounted(() => {
  setTimeout(() => {
    startTime.value = Date.now();
    animate();
  }, props.startDelay);
});

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});

// Public method to mark as complete
defineExpose({
  complete() {
    isComplete.value = true;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  }
});
</script>