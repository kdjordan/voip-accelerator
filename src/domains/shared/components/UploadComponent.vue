<template>
  <div class="upload-component">
    <div
      class="relative border border-fbWhite border-dashed rounded-lg p-6 hover:bg-fbWhite/10"
      :class="[
        isProcessing || disabled || isUploading
          ? 'border-gray-500 bg-gray-800/50'
          : 'border-accent hover:border-accent-hover',
        isProcessing || disabled || isUploading ? 'cursor-not-allowed' : 'cursor-pointer',
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
          :disabled="isProcessing || disabled || isUploading"
          @change="handleFileInput"
        />

        <!-- Upload Icon/Status -->
        <div class="text-center">
          <template v-if="!disabled && !isProcessing && !isUploading">
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
          <template v-if="isProcessing">
            <div class="animate-spin text-2xl text-accent">
              <i class="fas fa-circle-notch"></i>
            </div>
            <p class="mt-2 text-sm text-foreground">Processing file...</p>
          </template>
          <template v-if="disabled && !isProcessing && !isUploading">
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
  import { ref, computed } from 'vue';
  import TheModal from './PreviewModal.vue';
  import { DBName, DBNameType } from '@/domains/shared/types';
  import useCSVProcessing from '@/composables/useCsvProcessing';
  import { useAzStore } from '@/domains/az/store';
  import { useNpanxxStore } from '@/domains/npanxx/store';
  import type { DomainStore } from '@/domains/shared/types';
  import type { ColumnRoleOption } from '@/domains/shared/types';

  const props = defineProps<{
    typeOfComponent: 'owner' | 'carrier' | 'client';
    DBname: DBNameType;
    componentName: string;
    disabled: boolean;
    columnRoleOptions: ColumnRoleOption[];
  }>();

  const emit = defineEmits<{
    (e: 'fileUploaded', componentName: string, fileName: string): void;
    (e: 'fileDeleted', componentName: string, DBname: DBNameType): void;
  }>();

  // const isProcessing = ref(false);
  // const showPreviewModal = ref(false);

  const {
    file,
    startLine,
    previewData,
    columns,
    deckType,
    showPreviewModal,
    DBname,
    columnRoles,
    isProcessing,
    parseCSVForPreview,
    parseCSVForFullProcessing,
  } = useCSVProcessing();

  deckType.value = props.DBname;
  DBname.value = props.DBname;

  console.log('props', props);

  const isDragging = ref(false);
  const dragCounter = ref(0);

  const store = computed((): DomainStore => {
    switch (props.DBname) {
      case DBName.AZ:
        return useAzStore();
      case DBName.US:
        return useNpanxxStore();
      default:
        throw new Error(`Invalid DBname: ${props.DBname}`);
    }
  });

  const isUploading = computed(() => store.value.isComponentUploading(props.componentName));

  async function handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;

    isProcessing.value = true;
    file.value = target.files[0];

    try {
      parseCSVForPreview(file.value);
      showPreviewModal.value = true;
    } catch (error) {
      console.error('Error handling file:', error);
    } finally {
      isProcessing.value = false;
    }
  }

  async function handleModalConfirm(confirmation: { columnRoles: string[]; startLine: number }) {
    showPreviewModal.value = false;
    isProcessing.value = true;

    try {
      columnRoles.value = confirmation.columnRoles;
      startLine.value = confirmation.startLine;
      await parseCSVForFullProcessing();
      emit('fileUploaded', props.componentName, file.value?.name || '');
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      isProcessing.value = false;
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    file.value = null;
  }
  function handleRemoveFile() {
    // Reset local state
    file.value = null;
    isProcessing.value = false;
    showPreviewModal.value = false;
    // Emit event to parent to update store
    emit('fileDeleted', props.componentName, props.DBname);
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    if (!isProcessing.value && !props.disabled) {
      dragCounter.value++;
      isDragging.value = true;
    }
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragCounter.value--;
    if (dragCounter.value === 0) {
      isDragging.value = false;
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragCounter.value = 0;
    isDragging.value = false;
    if (!isProcessing.value && !props.disabled && event.dataTransfer?.files) {
      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileInput({ target: { files: [file] } } as any);
      }
    }
  }
</script>
<style scoped>
  .upload-component {
    @apply w-full;
  }
</style>
