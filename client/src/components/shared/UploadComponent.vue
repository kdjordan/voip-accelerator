<template>
  <div class="upload-component">
    <!-- 
      IMPORTANT UI FEEDBACK - DO NOT REMOVE
      The animate-pulse class on the container during processing/uploading states
      provides essential visual feedback to users. This animation indicates that
      the system is actively handling their file.

      Hover states are conditionally applied:
      - Only active when component is enabled (no file uploaded)
      - Disabled when:
        - File is uploaded (disabled state)
        - File is processing
        - File is uploading
      This prevents misleading UI feedback when the dropzone is inactive

      CRITICAL LAYOUT REQUIREMENTS - DO NOT MODIFY
      - min-h-[160px] maintains consistent height across all states
      - flex/items-center/justify-center ensures content stays centered
      - These classes prevent layout shift during state changes
    -->
    <div
      class="relative border border-fbWhite border-dashed rounded-lg p-6 min-h-[160px] flex items-center justify-center"
      :class="[
        isProcessingState || isUploading
          ? 'animate-pulse border-muted bg-muted/30'
          : disabled
          ? 'border-gray-500 bg-gray-800/50'
          : 'border-accent hover:border-accent-hover hover:bg-fbWhite/10',
        isProcessingState || disabled || isUploading ? 'cursor-not-allowed' : 'cursor-pointer',
        isDragging ? 'border-accent bg-fbWhite/10' : '',
      ]"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <!-- Upload Zone -->
      <div class="flex flex-col items-center justify-center space-y-2">
        <input
          type="file"
          accept=".csv"
          class="absolute inset-0 w-full h-full opacity-0"
          :disabled="isProcessingState || disabled || isUploading"
          @change="handleFileInput"
        />

        <!-- Upload Icon/Status -->
        <div class="text-center">
          <template v-if="!disabled && !isProcessingState && !isUploading">
            <ArrowUpTrayIcon class="w-6 h-6 text-accent mx-auto" />
            <p class="mt-2 text-sm text-foreground">
              Drop your {{ typeOfComponent }}'s CSV file here or click to browse
            </p>
          </template>
          <template v-if="isUploading">
            <div class="text-2xl text-accent">
              <i class="fas fa-upload"></i>
            </div>
            <p class="mt-2 text-sm text-mutedForeground">Uploading file...</p>
          </template>
          <!-- 
            IMPORTANT PROCESSING STATE UI - DO NOT REMOVE
            This processing state provides crucial feedback during file handling:
            - Container pulses (see above)
            - Uses darker text (text-muted) for better contrast
          -->
          <template v-if="isProcessingState">
            <p class="text-sm text-muted">Processing your file...</p>
          </template>
          <template v-if="disabled && !isProcessingState && !isUploading">
            <i class="fas fa-check-circle text-2xl text-green-500"></i>
            <p class="mt-2 text-sm text-foreground">
              {{ currentFileName }}
            </p>
            <div class="relative z-10">
              <button
                @click="handleRemoveFile"
                class="border border-white/20 hover:bg-muted/80 transition-all text-xl rounded-md px-2 mt-4"
              >
                &times;
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <TheModal
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="columns"
      :previewData="previewData"
      :columnRoles="columnRoles"
      :startLine="startLine"
      :columnRoleOptions="columnRoleOptions"
      :deckType="DBname"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import TheModal from './PreviewModal.vue';
  import { DBName, type DBNameType, type DomainStoreType } from '@/types/app-types';
  import { useAzStore } from '@/stores/az-store';
  import { useUsStore } from '@/stores/us-store';
  import type { ColumnRoleOption } from '@/types';
  import { useUploadState } from '@/composables/XXuseUploadState';
  import { useFileHandler } from '@/composables/useFileHandler';
  import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline';

  const props = defineProps<{
    typeOfComponent: 'owner' | 'carrier'; //used for displaying name in UI when 2 upload 
    DBname: DBNameType; //used to determine which store to use
    componentName: string; //used to identify the component in the store
    disabled: boolean; //used to disable the component if it has a large file currently uploading
    columnRoleOptions: ColumnRoleOption[]; //used to display the column roles in the modal
  }>();

  const emit = defineEmits<{
    (e: 'fileUploaded', componentName: string, fileName: string): void;
    (e: 'fileDeleted', componentName: string, DBname: DBNameType): void;
  }>();

  const store = computed((): DomainStoreType => {
    switch (props.DBname) {
      case DBName.AZ:
        return useAzStore();
      case DBName.US:
        return useUsStore();
      default:
        throw new Error(`Invalid DBname: ${props.DBname}`);
    }
  });

  const {
    isProcessing: isProcessingState,
    isDragging,
    isDropzoneDisabled,
    handleDragEnter,
    handleDragLeave,
    setProcessing,
    resetState,
  } = useUploadState();

  const isUploading = computed(() => store.value.isComponentUploading(props.componentName));

  // Create a handler for processing files
  const processFile = async (file: File) => {
    setProcessing(true);
    try {
      await handleFileInput({ target: { files: [file] } } as unknown as Event);
      showPreviewModal.value = true;
    } catch (error) {
      console.error('Error handling file:', error);
    } finally {
      setProcessing(false);
    }
  };

  const {
    file,
    showPreviewModal,
    previewData,
    columns,
    columnRoles,
    startLine,
    handleFileInput,
    handlePreviewConfirm,
    handlePreviewCancel,
    handleRemoveFile,
  } = useFileHandler({
    DBname: props.DBname,
    componentName: props.componentName,
    onFileAccepted: async (file: File) => {
      setProcessing(true);
      try {
        showPreviewModal.value = true;
      } catch (error) {
        console.error('Error handling file:', error);
      } finally {
        setProcessing(false);
      }
    },
    onFileRemoved: () => {
      // First update the store
      store.value.removeFile(props.componentName);
      // Then emit the event
      emit('fileDeleted', props.componentName, props.DBname);
      // Reset all states
      setProcessing(false);
      resetState();
      file.value = null;
      showPreviewModal.value = false;
    },
  });

  async function handleModalConfirm(confirmation: { columnRoles: string[]; startLine: number }) {
    setProcessing(true);
    try {
      await handlePreviewConfirm(confirmation);
      emit('fileUploaded', props.componentName, file.value?.name || '');
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setProcessing(false);
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    file.value = null;
  }

  // Update drop handler
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (!isProcessingState.value && !props.disabled && event.dataTransfer?.files) {
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile) {
        processFile(droppedFile);
      }
    }
  }

  // Add computed property for file name
  const currentFileName = computed(() => {
    if (!file.value) return 'File uploaded successfully';
    return file.value.name;
  });
</script>
<style scoped>
  .upload-component {
    @apply w-full;
  }
</style>
