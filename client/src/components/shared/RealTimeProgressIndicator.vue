<template>
  <div v-if="isUploading" class="flex-1 flex flex-col items-center justify-center w-full space-y-4 px-8">
    <!-- Progress Bar Container -->
    <div class="w-full max-w-md space-y-2">
      <!-- Status Text -->
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-400">{{ progressText }}</span>
        <span class="text-accent font-medium">{{ Math.round(progress) }}%</span>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
        <div 
          class="bg-accent h-full rounded-full transition-all duration-300 ease-out"
          :style="`width: ${Math.round(progress)}%`"
        />
      </div>
      
      <!-- Details Row -->
      <div class="flex justify-between items-center text-xs text-gray-500">
        <span>{{ formattedRowsProcessed }}{{ totalRows ? ` of ${formattedTotalRows}` : '' }} rows</span>
        <span v-if="stage !== 'finalizing'">{{ stageText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UploadStage } from '@/types/components/upload-progress-types';

interface Props {
  isUploading: boolean;
  progress: number;
  stage: UploadStage;
  rowsProcessed: number;
  totalRows?: number;
}

const props = defineProps<Props>();

const progressText = computed(() => {
  const stageLabels = {
    parsing: 'Reading CSV file...',
    validating: 'Validating data...',
    storing: 'Storing on your browser...',
    finalizing: 'Finalizing upload...'
  };
  
  return stageLabels[props.stage] || 'Processing...';
});

const stageText = computed(() => {
  const stageNames = {
    parsing: 'Parsing',
    validating: 'Validating', 
    storing: 'Storing',
    finalizing: 'Finalizing'
  };
  
  return stageNames[props.stage] || 'Processing';
});

const formattedRowsProcessed = computed(() => 
  props.rowsProcessed.toLocaleString()
);

const formattedTotalRows = computed(() => 
  props.totalRows?.toLocaleString() || ''
);
</script>