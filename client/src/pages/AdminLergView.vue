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
            <span class="text-2xl font-bold">{{ formatNumber(stats.totalRecords) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Last Updated</span>
            <span class="text-lg">{{ formatDate(stats.lastUpdated) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Stored locally</span>
            <div class="flex items-center">
              <div
                class="w-3 h-3 rounded-full transition-colors duration-200"
                :class="[
                  isLocallyStored
                    ? 'bg-green-500 animate-status-pulse-success'
                    : 'bg-red-500 animate-status-pulse-error',
                ]"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Special Codes Stats -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Special Area Codes</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Stored locally</span>
            <div class="flex items-center">
              <div
                class="w-3 h-3 rounded-full transition-colors duration-200"
                :class="[
                  specialCodesLocallyStored
                    ? 'bg-green-500 animate-status-pulse-success'
                    : 'bg-red-500 animate-status-pulse-error',
                ]"
              ></div>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Total Special Codes</span>
            <span class="text-2xl font-bold">{{ formatNumber(stats.specialCodes?.totalCodes ?? 0) }}</span>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-medium text-gray-400 mb-2">Country Breakdown</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="country in stats.specialCodes?.countryBreakdown"
                :key="country.countryCode"
                class="bg-gray-700 rounded overflow-hidden"
              >
                <!-- Clickable Header -->
                <button
                  @click="toggleCountryDetails(country.countryCode)"
                  class="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-600 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <span class="text-sm">{{ getCountryName(country.countryCode) }}</span>
                    <span class="font-medium">{{ formatNumber(country.count) }}</span>
                    <svg
                      :class="[
                        'w-4 h-4 transform transition-transform',
                        expandedCountries.includes(country.countryCode) ? 'rotate-180' : '',
                      ]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                <!-- Expandable Content -->
                <div
                  v-if="expandedCountries.includes(country.countryCode)"
                  class="px-4 py-3 bg-gray-800/50 border-t border-gray-600"
                >
                  <div class="space-y-4">
                    <div
                      v-for="group in countryDetails[country.countryCode]"
                      :key="group.province"
                      class="space-y-1"
                    >
                      <h4 class="text-sm font-medium text-gray-300 mb-1">{{ group.province }}</h4>
                      <div class="grid grid-cols-3 gap-2">
                        <div
                          v-for="npa in group.npas"
                          :key="npa"
                          class="bg-gray-700/50 rounded px-3 py-1"
                        >
                          <span class="font-medium">{{ npa }}</span>
                        </div>
                      </div>
                    </div>
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
        <div class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <input
            type="file"
            ref="specialCodesFileInput"
            class="hidden"
            accept=".csv"
            @change="handleSpecialCodesFileChange"
          />
          <button
            @click="$refs.specialCodesFileInput.click()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Choose File
          </button>
          <p class="text-sm text-gray-400 mt-2">or drag and drop your Special Codes file here</p>
          <p class="text-xs text-gray-500 mt-1">Supports CSV files</p>
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
  import { ref, onMounted, computed } from 'vue';
  import type { LERGStats } from '@/types/lerg-types';
  import { useLergStore } from '@/stores/lerg-store';
  import { lergApiService } from '@/services/lerg-api.service';

  const store = useLergStore();
  const stats = computed(() => store.stats);
  const expandedCountries = ref<string[]>([]);
  const countryDetails = ref<Record<string, Array<{ province: string; npas: string[] }>>>({});

  const isLocallyStored = computed(() => store.isLocallyStored);
  const specialCodesLocallyStored = computed(() => store.specialCodesLocallyStored);

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

  function getCountryName(code: string): string {
    const countries: Record<string, string> = {
      Canada: 'Canada',
      'United States': 'United States',
      'Dominican Republic': 'Dominican Republic',
      Jamaica: 'Jamaica',
      // Add more as needed
    };
    return countries[code] || code;
  }

  // async function fetchStats() {
  //   try {
  //     console.log('Fetching stats from AdminLergView.vue');
  //     stats.value = await lergService.getStats();
  //   } catch (error) {
  //     console.error('Failed to fetch stats:', error);
  //   }
  // }

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

  async function handleSpecialCodesFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await lergApiService.uploadSpecialCodesFile(formData);
      // await fetchStats();
    } catch (error) {
      console.error('Failed to upload special codes file:', error);
    }
  }

  async function confirmClearLergData() {
    if (!confirm('Are you sure you want to clear all LERG codes? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch('/api/admin/lerg/clear/lerg', { method: 'DELETE' });
      console.log('LERG codes cleared successfully');
      // await fetchStats();
    } catch (error) {
      console.error('Failed to clear LERG data:', error);
    }
  }

  async function confirmClearSpecialData() {
    if (!confirm('Are you sure you want to clear all special area codes? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch('/api/admin/lerg/clear/special', { method: 'DELETE' });
      console.log('Special codes cleared successfully');
      // await fetchStats();
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

  async function toggleCountryDetails(countryCode: string) {
    const index = expandedCountries.value.indexOf(countryCode);

    if (index === -1) {
      // Expand
      expandedCountries.value.push(countryCode);

      // Fetch details if we don't have them yet
      if (!countryDetails.value[countryCode]) {
        try {
          const response = await fetch(`/api/lerg/special-codes/${countryCode}`);
          if (!response.ok) throw new Error('Failed to fetch country details');
          countryDetails.value[countryCode] = await response.json();
        } catch (error) {
          console.error(`Failed to fetch details for ${countryCode}:`, error);
          expandedCountries.value = expandedCountries.value.filter(c => c !== countryCode);
        }
      }
    } else {
      // Collapse
      expandedCountries.value.splice(index, 1);
    }
  }

  // onMounted(fetchStats);
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
