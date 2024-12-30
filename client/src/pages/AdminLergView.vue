<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4 text-fbWhite">LERG Administration</h1>

    <!-- Clear Data Button -->
    <div class="mb-4">
      <button
        @click="handleClearData"
        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        :disabled="isClearing"
      >
        {{ isClearing ? 'Clearing...' : 'Clear All Data' }}
      </button>
    </div>

    <!-- Stats Section -->
    <div class="mb-6 bg-fbBlack rounded-lg shadow p-4 border border-fbBorder">
      <h2 class="text-lg font-semibold mb-3 text-fbWhite">Database Stats</h2>
      <div
        v-if="stats"
        class="grid grid-cols-2 gap-4"
      >
        <div class="p-3 bg-fbHover rounded">
          <p class="text-sm text-fbWhite">Total Records</p>
          <p class="text-xl font-bold text-fbWhite">{{ stats.totalRecords.toLocaleString() }}</p>
        </div>
        <div class="p-3 bg-fbHover rounded">
          <p class="text-sm text-fbWhite">Last Updated</p>
          <p class="text-xl font-bold text-fbWhite">
            {{ stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'Never' }}
          </p>
        </div>
      </div>
      <div
        v-else
        class="text-fbWhite"
      >
        Loading stats...
      </div>
    </div>

    <!-- Upload Section -->
    <div
      class="border-2 border-dashed border-fbBorder rounded-lg p-8 text-center mb-4"
      :class="{ 'border-fbGreen bg-fbHover': isDragging }"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <div v-if="!isUploading">
        <p class="text-fbWhite mb-2">
          Drag and drop your LERG file here, or
          <label class="text-fbGreen cursor-pointer hover:text-fbGreen/80">
            <input
              type="file"
              class="hidden"
              accept=".txt"
              @change="handleFileSelect"
            />
            browse
          </label>
        </p>
        <p class="text-sm text-fbWhite/70">Supports TXT files</p>
      </div>
      <div v-else>
        <p class="text-fbWhite">Uploading...</p>
      </div>
    </div>

    <!-- Upload Status -->
    <div
      v-if="uploadStatus"
      class="mt-4"
    >
      <div :class="uploadStatus.success ? 'text-fbGreen' : 'text-red-500'">
        {{ uploadStatus.message }}
      </div>
      <div
        v-if="uploadStatus.details"
        class="mt-2 text-sm text-fbWhite/70"
      >
        {{ uploadStatus.details }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { lergApiService } from '../domains/lerg/services/lerg-api.service';
  import type { LERGStats } from '../domains/lerg/types/types';

  const isDragging = ref(false);
  const isUploading = ref(false);
  const stats = ref<LERGStats | null>(null);
  const uploadStatus = ref<{ success: boolean; message: string; details?: string } | null>(null);
  const isClearing = ref(false);

  const loadStats = async () => {
    try {
      stats.value = await lergApiService.getStats();
    } catch (error) {
      console.error('Failed to load stats:', error);
      stats.value = { totalRecords: 0, lastUpdated: null }; // Provide default values
    }
  };

  onMounted(() => {
    loadStats();
  });

  const handleDrop = async (event: DragEvent) => {
    isDragging.value = false;
    const files = event.dataTransfer?.files;
    if (files?.length) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (event: Event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.txt')) {
      uploadStatus.value = {
        success: false,
        message: 'Please select a TXT file',
      };
      return;
    }

    try {
      isUploading.value = true;
      uploadStatus.value = null;

      const formData = new FormData();
      formData.append('file', file);

      const response = await lergApiService.uploadLERGFile(formData);

      uploadStatus.value = {
        success: true,
        message: 'File uploaded successfully',
        details: `Processed ${response.processedRecords} of ${response.totalRecords} records`,
      };

      // Refresh stats after successful upload
      await loadStats();
    } catch (error) {
      uploadStatus.value = {
        success: false,
        message: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      isUploading.value = false;
    }
  };

  async function handleClearData() {
    if (!confirm('Are you sure you want to delete all LERG data? This cannot be undone.')) {
      return;
    }

    try {
      isClearing.value = true;
      await lergApiService.clearAllData();
      await loadStats(); // Refresh stats after clearing
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      isClearing.value = false;
    }
  }
</script>
