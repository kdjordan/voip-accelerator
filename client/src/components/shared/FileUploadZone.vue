<template>
  <div
    class="relative border border-fbWhite border-dashed rounded-lg p-6 min-h-[160px] flex items-center justify-center"
    :class="[
      isProcessing || isUploading
        ? 'animate-pulse border-muted bg-muted/30'
        : disabled
        ? 'border-gray-500 bg-gray-800/50'
        : 'border-accent hover:border-accent-hover hover:bg-fbWhite/10',
      isProcessing || disabled || isUploading ? 'cursor-not-allowed' : 'cursor-pointer',
      isDragging ? 'border-accent bg-fbWhite/10' : '',
    ]"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @dragover.prevent
    @drop.prevent="handleDrop"
  >
    <input
      type="file"
      accept=".csv"
      class="absolute inset-0 w-full h-full opacity-0"
      :disabled="isProcessing || disabled || isUploading"
      @change="handleFileInput"
    />
    <slot
      :is-processing="isProcessing"
      :is-uploading="isUploading"
      :is-disabled="disabled"
      :file-name="fileName"
      @remove="$emit('remove')"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  disabled: boolean;
  isProcessing: boolean;
  isUploading: boolean;
  fileName?: string;
}>();

const emit = defineEmits<{
  (e: 'fileSelected', file: File): void;
  (e: 'remove'): void;
}>();

// ... drag and drop logic here
</script> 