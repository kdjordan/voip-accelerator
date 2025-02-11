<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-3xl font-bold mb-8">Rate Sheet Formalizer</h1>

    <!-- Stats Dashboard -->
    <div class="flex flex-col gap-6 mb-8">
      <div class="bg-gray-800 rounded-lg p-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 gap-3 border-b border-gray-700/50 pb-4 mb-6">
          <!-- Storage Status -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Storage Status</h3>
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="[
                    isLocallyStored
                      ? 'bg-green-500 animate-status-pulse-success'
                      : 'bg-red-500 animate-status-pulse-error',
                  ]"
                ></div>
                <span>{{ isLocallyStored ? 'Data Stored' : 'No Data' }}</span>
              </div>
            </div>
          </div>
          <!-- Discrepancy Count -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Destinations with Rate Discrepancies</h3>
              <div class="text-2xl font-bold">{{ store.getDiscrepancyCount }}</div>
            </div>
          </div>
        </div>

        <!-- File Upload Section -->
        <div v-if="!isLocallyStored">
          <div
            class="relative border-2 border-dashed rounded-lg p-6 min-h-[160px] flex items-center justify-center"
            :class="[
              isDragging ? 'border-accent bg-fbWhite/10' : 'hover:border-accent-hover hover:bg-fbWhite/10',
              isProcessing ? 'animate-pulse border-muted bg-muted/30 cursor-not-allowed' : 'cursor-pointer',
              uploadError ? 'border-red-500 bg-red-500/5' : 'border-fbWhite',
            ]"
            @dragenter.prevent="handleDragEnter"
            @dragleave.prevent="handleDragLeave"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
          >
            <input
              type="file"
              accept=".csv"
              class="absolute inset-0 h-full opacity-0 cursor-pointer"
              :disabled="isProcessing"
              @change="handleFileChange"
            />
            <div class="text-center">
              <ArrowUpTrayIcon
                class="w-6 h-6 mx-auto"
                :class="uploadError ? 'text-red-500' : 'text-accent'"
              />
              <p class="mt-2 text-sm text-foreground">
                <template v-if="uploadError">
                  <span class="text-red-400">{{ uploadError }}</span>
                </template>
                <template v-else> Drop your rate sheet CSV file here or click to browse </template>
              </p>
              <p
                v-if="uploadError"
                class="mt-1 text-xs text-red-400"
              >
                Please try again with a correctly formatted CSV file
              </p>
            </div>
          </div>
        </div>

        <!-- Instructions when data exists -->
        <div
          v-else
          class="text-center text-sm text-gray-400"
        >
          Use the table below to review and fix rate discrepancies
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div
      v-if="isLocallyStored"
      class="mt-8"
    >
      <RateSheetTable />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';

  import { useRateSheetStore } from '@/stores/rate-sheet-store';
  import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/vue/24/outline';
  import { useRateSheetFileHandler } from '@/composables/useRateSheetFileHandler';
  import RateSheetTable from '@/components/rate-sheet/RateSheetTable.vue';

  const store = useRateSheetStore();
  const isLocallyStored = computed(() => store.isLocallyStored);
  const isDragging = ref(false);
  const isProcessing = ref(false);
  const uploadError = ref<string | null>(null);

  const { handleFileInput } = useRateSheetFileHandler();

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    isDragging.value = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging.value = false;
  }

  async function handleFileDrop(event: DragEvent) {
    event.preventDefault();
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      await handleFileChange({ target: { files: [file] } } as unknown as Event);
    }
  }

  async function handleFileChange(event: Event) {
    if (!event.target) return;

    isProcessing.value = true;
    uploadError.value = null;
    try {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        uploadError.value = 'No file selected';
        return;
      }
      if (!file.name.endsWith('.csv')) {
        uploadError.value = 'Please upload a CSV file';
        return;
      }
      await handleFileInput(event);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Missing required columns')) {
          uploadError.value =
            'Invalid CSV format. Required columns: name, prefix, rate, effective, min duration, increments';
        } else {
          uploadError.value = error.message;
        }
      }
    } finally {
      isProcessing.value = false;
    }
  }

  async function handleClearData() {
    if (confirm('Are you sure you want to clear all rate sheet data?')) {
      isProcessing.value = true;
      try {
        await store.clearData();
      } catch (error) {
        console.error('Error clearing data:', error);
      } finally {
        isProcessing.value = false;
      }
    }
  }
</script>
