<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-3xl font-bold mb-8">LERG Administration</h1>

    <!-- Stats Dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- LERG Database Stats -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">LERG Database Stats</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Total Records</span>
            <span class="text-2xl font-bold">{{ formatNumber(stats.totalRecords) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Last Updated</span>
            <span class="text-lg">{{ formatDate(stats.lastUpdated) }}</span>
          </div>
        </div>
      </div>

      <!-- Special Codes Stats -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Special Area Codes</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Total Special Codes</span>
            <span class="text-2xl font-bold">{{ formatNumber(stats.specialCodes?.totalCodes ?? 0) }}</span>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-medium text-gray-400 mb-2">Country Breakdown</h3>
            <div class="max-h-48 overflow-y-auto space-y-2">
              <div
                v-for="country in stats.specialCodes?.countryBreakdown"
                :key="country.countryCode"
                class="flex justify-between items-center bg-gray-700 p-2 rounded"
              >
                <span class="text-sm">{{ getCountryName(country.countryCode) }}</span>
                <span class="font-medium">{{ formatNumber(country.count) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Upload Section -->
    <div class="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Upload LERG File</h2>
      <div class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
        <input
          type="file"
          ref="fileInput"
          class="hidden"
          accept=".txt"
          @change="handleFileChange"
        />
        <button
          @click="$refs.fileInput.click()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Choose File
        </button>
        <p class="text-sm text-gray-400 mt-2">or drag and drop your LERG file here</p>
        <p class="text-xs text-gray-500 mt-1">Supports TXT files</p>
      </div>
    </div>

    <!-- Data Recovery -->
    <div class="bg-green-900/20 border border-green-500/50 rounded-lg p-6 mb-4">
      <h2 class="text-xl font-semibold text-green-400 mb-4">Data Recovery</h2>
      <div class="flex items-center justify-end space-x-4">
        <button
          @click="confirmReloadLerg"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          Reload LERG
        </button>

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
  import { ref, onMounted } from 'vue';
  import type { LERGStats } from '../domains/lerg/types/api.types';

  const stats = ref<LERGStats>({
    totalRecords: 0,
    lastUpdated: new Date(),
    specialCodes: {
      totalCodes: 0,
      countryBreakdown: [],
    },
  });

  // Format large numbers with commas
  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  // Format dates in a readable way
  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Get country name from country code
  function getCountryName(code: string): string {
    const countries: Record<string, string> = {
      '+1': 'United States/Canada',
      '+44': 'United Kingdom',
      // Add more country codes as needed
    };
    return countries[code] || code;
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/lerg/stats');
      stats.value = await response.json();
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/lerg/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      console.log('File uploaded successfully');
      await fetchStats();
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  }

  async function confirmClearLergData() {
    if (!confirm('Are you sure you want to clear all LERG codes? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch('/api/lerg/clear/lerg', { method: 'DELETE' });
      console.log('LERG codes cleared successfully');
      await fetchStats();
    } catch (error) {
      console.error('Failed to clear LERG data:', error);
    }
  }

  async function confirmClearSpecialData() {
    if (!confirm('Are you sure you want to clear all special area codes? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch('/api/lerg/clear/special', { method: 'DELETE' });
      console.log('Special codes cleared successfully');
      await fetchStats();
    } catch (error) {
      console.error('Failed to clear special codes:', error);
    }
  }

  async function confirmReloadLerg() {
    if (!confirm('Are you sure you want to reload the last known good LERG data?')) {
      return;
    }

    try {
      const response = await fetch('/api/lerg/reload/lerg', { method: 'POST' });
      if (!response.ok) throw new Error('Reload failed');

      console.log('LERG data reloaded successfully');
      await fetchStats();
    } catch (error) {
      console.error('Failed to reload LERG data:', error);
    }
  }

  async function confirmReloadSpecial() {
    if (!confirm('Are you sure you want to reload the special codes data?')) {
      return;
    }

    try {
      const response = await fetch('/api/lerg/reload/special', {
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
      await fetchStats();
    } catch (error) {
      console.error('Failed to reload special codes:', error);
      if (error instanceof Error) {
        console.error('Error:', error.message);
      }
    }
  }

  onMounted(fetchStats);
</script>
