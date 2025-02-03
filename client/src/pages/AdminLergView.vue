<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-3xl font-bold mb-8">LERG Administration</h1>

    <!-- Stats Dashboard -->
    <div class="flex flex-col gap-6 mb-8">
      <!-- LERG Database Stats -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">LERG Database Stats</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Total Records</span>
            <div
              v-if="isLergProcessing"
              class="animate-spin h-5 w-5"
            >
              <svg
                class="text-accent"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  fill="none"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <span
              v-else
              class="text-2xl font-bold"
              >{{ formatNumber(lergStats.totalRecords) }}</span
            >
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Last Updated</span>
            <div
              v-if="isLergProcessing"
              class="animate-spin h-5 w-5"
            >
              <svg
                class="text-accent"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  fill="none"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <span
              v-else
              class="text-lg"
              >{{ formatDate(lergStats.lastUpdated) }}</span
            >
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Stored locally</span>
            <div class="flex items-center">
              <div
                class="w-3 h-3 rounded-full transition-colors duration-200"
                :class="[
                  isLergLocallyStored
                    ? 'bg-green-500 animate-status-pulse-success'
                    : 'bg-red-500 animate-status-pulse-error',
                ]"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Special Codes Section -->
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="space-y-6">
          <!-- Special Codes Stats -->
          <div>
            <h2 class="text-xl font-semibold mb-6">Special Area Codes</h2>
            <div class="space-y-4">
              <!-- Total Special Codes -->
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Total Special Codes</span>
                <span class="text-2xl font-bold">{{ formatNumber(store.specialCodes.stats.totalCodes) }}</span>
              </div>
              <!-- Last Updated -->
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Last Updated</span>
                <span class="text-gray-200">{{ formatDate(store.specialCodes.stats.lastUpdated) }}</span>
              </div>
              <!-- Stored locally -->
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Stored locally</span>
                <div
                  class="w-3 h-3 rounded-full"
                  :class="[
                    isSpecialCodesLocallyStored
                      ? 'bg-green-500 animate-status-pulse-success'
                      : 'bg-red-500 animate-status-pulse-error',
                  ]"
                ></div>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-700/50 pt-6">
            <!-- Table -->
            <div class="space-y-4">
              <!-- Full width rows for multi-NPA countries -->
              <div class="space-y-2">
                <div
                  v-for="country in sortedCountries.filter(c => c.npas.length > 1)"
                  :key="country.name"
                  class="bg-gray-900/50 p-4 rounded-lg w-full"
                >
                  <div class="flex justify-between items-center">
                    <!-- Country Name -->
                    <span class="font-medium">{{ country.name }}</span>

                    <!-- NPAs -->
                    <div class="flex items-center space-x-4">
                      <button
                        @click="toggleExpand(country.name)"
                        class="flex items-center space-x-2 px-2 py-1 rounded"
                      >
                        <span class="text-sm text-gray-400">{{ country.npas.length }} NPAs</span>
                        <ChevronDownIcon
                          :class="{ 'transform rotate-180': expandedCountries.includes(country.name) }"
                          class="w-4 h-4 transition-transform"
                        />
                      </button>
                    </div>
                  </div>

                  <!-- Expanded NPAs list -->
                  <div
                    v-if="expandedCountries.includes(country.name)"
                    class="mt-3 pl-4"
                  >
                    <div class="flex flex-wrap gap-2">
                      <div
                        v-for="npa in country.npas"
                        :key="npa"
                        class="text-gray-300 bg-gray-800/50 px-3 py-1 rounded"
                      >
                        {{ npa }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Grid for single NPA countries -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="country in sortedCountries.filter(c => c.npas.length === 1)"
                  :key="country.name"
                  class="bg-gray-900/50 p-4 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{{ country.name }}</span>
                    <span class="text-gray-300">{{ country.npas[0] }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Upload Sections -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- LERG Upload -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Upload LERG File</h2>
        <div class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <input
            type="file"
            ref="lergFileInput"
            class="hidden"
            accept=".txt"
            @change="handleLergFileChange"
          />
          <button
            @click="$refs.lergFileInput.click()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Choose File
          </button>
          <p class="text-sm text-gray-400 mt-2">or drag and drop your LERG file here</p>
          <p class="text-xs text-gray-500 mt-1">Supports TXT files</p>
        </div>
      </div>

      <!-- Special Codes Upload -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Upload Special Codes</h2>
        <div
          @dragover.prevent
          @drop.prevent="handleSpecialCodesDrop"
          class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center"
          :class="{ 'border-green-500': isDragging }"
        >
          <input
            type="file"
            ref="specialCodesFileInput"
            class="hidden"
            accept=".csv"
            @change="handleSpecialCodesFileSelect"
          />
          <button
            @click="$refs.specialCodesFileInput.click()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Choose File
          </button>
          <p class="text-sm text-gray-400 mt-2">or drag and drop your special codes file here</p>
          <p class="text-xs text-gray-500 mt-1">Supports CSV files</p>
        </div>

        <!-- Upload Status -->
        <div
          v-if="uploadStatus"
          class="mt-4"
        >
          <p :class="['text-sm', uploadStatus.type === 'error' ? 'text-red-400' : 'text-green-400']">
            {{ uploadStatus.message }}
          </p>
        </div>
      </div>
    </div>

    <!-- Data Recovery -->
    <div class="bg-green-900/20 border border-green-500/50 rounded-lg p-6 mb-4">
      <h2 class="text-xl font-semibold text-green-400 mb-4">Data Recovery</h2>
      <div class="flex items-center justify-end space-x-4">
        <button
          @click="confirmReloadSpecial"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          Reload Special Codes
        </button>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
      <div class="flex items-center justify-end space-x-4">
        <button
          @click="confirmClearLergData"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Clear LERG Data
        </button>

        <button
          @click="confirmClearSpecialData"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Clear Special Codes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useLergStore } from '@/stores/lerg-store';
  import { lergApiService } from '@/services/lerg-api.service';
  import { ChevronDownIcon } from '@heroicons/vue/24/outline';

  const store = useLergStore();
  const lergStats = computed(() => store.lerg.stats);
  const isLergProcessing = computed(() => store.lerg.isProcessing);
  const expandedCountries = ref<string[]>([]);

  const isLergLocallyStored = computed(() => {
    return store.lerg.isLocallyStored;
  });
  const isSpecialCodesLocallyStored = computed(() => store.specialCodes.isLocallyStored);


  const isDragging = ref(false);
  const uploadStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);

  const sortedCountries = computed(() => store.sortedCountriesWithNPAs);

  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  function formatDate(date: string | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  async function handleLergFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await lergApiService.uploadLergFile(formData);
      // await fetchStats();
    } catch (error) {
      console.error('Failed to upload LERG file:', error);
    }
  }

  async function handleSpecialCodesDrop(e: DragEvent) {
    isDragging.value = false;
    const file = e.dataTransfer?.files[0];
    if (file) {
      await uploadSpecialCodesFile(file);
    }
  }

  async function handleSpecialCodesFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      await uploadSpecialCodesFile(file);
    }
  }

  async function uploadSpecialCodesFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      uploadStatus.value = { type: 'error', message: 'Please upload a CSV file' };
      return;
    }

    try {
      uploadStatus.value = { type: 'success', message: 'Uploading...' };
      const formData = new FormData();
      formData.append('file', file);

      await lergApiService.uploadSpecialCodesFile(formData);
      uploadStatus.value = { type: 'success', message: 'Upload successful' };
    } catch (error) {
      console.error('Upload failed:', error);
      uploadStatus.value = {
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async function confirmClearLergData() {
    if (!confirm('Are you sure you want to clear all LERG codes? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch('/api/admin/lerg/clear/lerg', { method: 'DELETE' });
      console.log('LERG codes cleared successfully');
    } catch (error) {
      console.error('Failed to clear LERG data:', error);
    }
  }

  async function confirmClearSpecialData() {
    if (!confirm('Are you sure you want to clear all special area codes? This action cannot be undone.')) {
      return;
    }

    try {
      await lergApiService.clearSpecialCodesData();
      console.log('Special codes cleared successfully');
    } catch (error) {
      console.error('Failed to clear special codes:', error);
    }
  }

  async function confirmReloadSpecial() {
    if (!confirm('Are you sure you want to reload the special codes data?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/lerg/reload/special', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Reload failed');
      }

      await response.json();
      // await fetchStats();
    } catch (error) {
      console.error('Failed to reload special codes:', error);
      if (error instanceof Error) {
        console.error('Error:', error.message);
      }
    }
  }

  function toggleExpand(countryName: string) {
    const index = expandedCountries.value.indexOf(countryName);
    if (index === -1) {
      expandedCountries.value.push(countryName);
    } else {
      expandedCountries.value.splice(index, 1);
    }
  }
</script>

<style>
  @keyframes status-pulse-success {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    50% {
      opacity: 0.6;
      box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
    }
  }

  @keyframes status-pulse-error {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    50% {
      opacity: 0.6;
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
    }
  }

  .animate-status-pulse-success {
    animation: status-pulse-success 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-status-pulse-error {
    animation: status-pulse-error 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
