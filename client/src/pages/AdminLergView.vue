<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-semibold mb-6">LERG Database Management</h1>

      <div class="bg-white shadow rounded-lg p-6">
        <div class="mb-6">
          <h2 class="text-lg font-medium mb-2">Upload LERG File</h2>
          <p class="text-gray-600 text-sm mb-4">
            Upload the LERG.txt file to update the NPA-NXX database. Duplicates will be automatically removed during
            processing.
          </p>

          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              accept=".txt"
              @change="handleFileSelect"
            />
            <button
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="$refs.fileInput.click()"
              :disabled="isProcessing"
            >
              <span v-if="!isProcessing">Select LERG File</span>
              <span v-else>Processing...</span>
            </button>

            <p
              v-if="selectedFile"
              class="mt-2 text-sm text-gray-600"
            >
              Selected: {{ selectedFile.name }}
            </p>
          </div>
        </div>

        <!-- Processing Status -->
        <div
          v-if="isProcessing"
          class="mt-4"
        >
          <div class="bg-gray-100 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium">Processing Progress</span>
              <span class="text-sm text-gray-600">{{ progress }}%</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full">
              <div
                class="h-2 bg-blue-600 rounded-full transition-all duration-300"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Status Messages -->
        <div
          v-if="statusMessage"
          class="mt-4"
        >
          <p
            :class="[
              'text-sm p-4 rounded-lg',
              statusType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
            ]"
          >
            {{ statusMessage }}
          </p>
        </div>
      </div>

      <!-- Database Stats -->
      <div class="mt-6 bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium mb-4">Database Statistics</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600">Total Records</p>
            <p class="text-2xl font-semibold">{{ stats.totalRecords }}</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600">Last Updated</p>
            <p class="text-2xl font-semibold">{{ stats.lastUpdated }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useLergStore } from '../domains/lerg/stores/lerg.store';
  import { LergApiService } from '@/domains/lerg/services/lerg-api.service';

  const fileInput = ref<HTMLInputElement | null>(null);
  const selectedFile = ref<File | null>(null);
  const isProcessing = ref(false);
  const progress = ref(0);
  const statusMessage = ref('');
  const statusType = ref<'error' | 'success'>('success');

  const stats = ref({
    totalRecords: 0,
    lastUpdated: '',
  });

  const lergStore = useLergStore();

  async function testDatabaseConnection() {
    try {
      const apiService = LergApiService.getInstance();
      await apiService.testConnection();
      console.log('✅ PostgreSQL connection successful');
      statusType.value = 'success';
      statusMessage.value = 'Database connection established';
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      statusType.value = 'error';
      statusMessage.value = 'Failed to connect to database';
    }
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    selectedFile.value = input.files[0];
    await processFile(input.files[0]);
  }

  async function processFile(file: File) {
    try {
      isProcessing.value = true;
      progress.value = 0;
      statusMessage.value = '';

      // TODO: Implement file processing logic
      // This will be handled by the LERG processing service

      statusType.value = 'success';
      statusMessage.value = 'LERG database updated successfully';
      await updateStats();
    } catch (error) {
      statusType.value = 'error';
      statusMessage.value = error instanceof Error ? error.message : 'An error occurred';
    } finally {
      isProcessing.value = false;
    }
  }

  async function updateStats() {
    // TODO: Implement stats fetching from the store
  }

  onMounted(async () => {
    await testDatabaseConnection();
    await updateStats();
  });
</script>
