<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-3xl font-bold mb-8">System Health Check</h1>

    <!-- Stats Dashboard -->
    <div class="flex flex-col gap-6 mb-8">
      <!-- Database Connection Status -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Database Connection Status</h2>
        <div class="flex items-center space-x-3">
          <div
            class="w-3 h-3 rounded-full"
            :class="dbStatus.connected ? 'bg-green-500' : 'bg-red-500'"
          ></div>
          <span class="text-lg">
            {{ dbStatus.connected ? 'Connected' : 'Disconnected' }}
          </span>
          <span
            v-if="!dbStatus.connected"
            class="text-red-400 text-sm"
          >
            {{ dbStatus.error }}
          </span>
        </div>
      </div>

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
            <span class="text-2xl font-bold">{{ formatNumber(stats.specialCodes?.totalCodes || 0) }}</span>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-medium text-gray-400 mb-2">Country Breakdown</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="country in stats.specialCodes?.countryBreakdown"
                :key="country.countryCode"
                class="bg-gray-700 rounded overflow-hidden"
              >
                <div class="px-4 py-3 flex justify-between items-center">
                  <span class="text-sm">{{ getCountryName(country.countryCode) }}</span>
                  <span class="font-medium">{{ formatNumber(country.count) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { lergApiService } from '@/API/api';
  import type { LERGStats } from '@/types/api-types';

  const stats = ref<LERGStats>({
    totalRecords: 0,
    lastUpdated: new Date(),
    specialCodes: {
      totalCodes: 0,
      countryBreakdown: [],
    },
  });

  const dbStatus = ref({
    connected: false,
    error: '',
  });

  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  function formatDate(date: Date | string | null): string {
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
      ' United States': 'United States',
      'Dominican Republic': 'Dominican Republic',
      Jamaica: 'Jamaica',
      // Add more as needed
    };
    return countries[code] || code;
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/lerg/stats');
      stats.value = await response.json();
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function checkConnection() {
    try {
      await lergApiService.testConnection();
      dbStatus.value = {
        connected: true,
        error: '',
      };
    } catch (error) {
      dbStatus.value = {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  onMounted(async () => {
    await checkConnection();
    await fetchStats();
  });
</script>
