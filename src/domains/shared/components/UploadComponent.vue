<template>
  <div class="upload-component">
    <div
      class="relative border border-fbWhite border-dashed rounded-lg p-6 hover:bg-fbWhite/10"
      :class="[
        isProcessingState || disabled || isUploading
          ? 'border-gray-500 bg-gray-800/50'
          : 'border-accent hover:border-accent-hover',
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
            <i class="fas fa-cloud-upload-alt text-2xl text-accent"></i>
            <p class="mt-2 text-sm text-foreground">
              Drop your {{ typeOfComponent }}'s CSV file here or click to browse
            </p>
          </template>
          <template v-if="isUploading">
            <div class="animate-pulse text-2xl text-accent">
              <i class="fas fa-upload"></i>
            </div>
            <p class="mt-2 text-sm text-foreground">Uploading large file...</p>
          </template>
          <template v-if="isProcessingState">
            <div class="animate-spin text-2xl text-accent">
              <i class="fas fa-circle-notch"></i>
            </div>
            <p class="mt-2 text-sm text-foreground">Processing file...</p>
          </template>
          <template v-if="disabled && !isProcessingState && !isUploading">
            <i class="fas fa-check-circle text-2xl text-green-500"></i>
            <p class="mt-2 text-sm text-foreground">File uploaded successfully</p>
            <div class="relative z-10">
              <button
                @click="handleRemoveFile"
                class="mt-2 text-xs text-red-500 hover:text-red-400"
              >
                Remove File
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
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import TheModal from './PreviewModal.vue';
  import { DBName, type DBNameType, type DomainStoreType } from '@/domains/shared/types';
  import { useAzStore } from '@/domains/az/store';
  import { useNpanxxStore } from '@/domains/npanxx/store';
  import type { ColumnRoleOption } from '@/domains/shared/types';
  import { useUploadState } from '@/composables/useUploadState';
  import { useFileHandler } from '@/composables/useFileHandler';

  const props = defineProps<{
    typeOfComponent: 'owner' | 'carrier';
    DBname: DBNameType;
    componentName: string;
    disabled: boolean;
    columnRoleOptions: ColumnRoleOption[];
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
        return useNpanxxStore();
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
  } = useUploadState();

  const isUploading = computed(() => store.value.isComponentUploading(props.componentName));

  // Create a handler for processing files
  const processFile = async (file: File) => {
    setProcessing(true)
    try {
      await handleFileInput({ target: { files: [file] } } as unknown as Event)
      showPreviewModal.value = true
    } catch (error) {
      console.error('Error handling file:', error)
    } finally {
      setProcessing(false)
    }
  }

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
    handleRemoveFile
  } = useFileHandler({
    DBname: props.DBname,
    componentName: props.componentName,
    onFileAccepted: async (file: File) => {
      setProcessing(true)
      try {
        showPreviewModal.value = true
      } catch (error) {
        console.error('Error handling file:', error)
      } finally {
        setProcessing(false)
      }
    },
    onFileRemoved: () => {
      emit('fileDeleted', props.componentName, props.DBname)
    }
  })

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
</script>
<style scoped>
  .upload-component {
    @apply w-full;
  }
</style>
