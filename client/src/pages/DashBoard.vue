<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-sizeXl tracking-wide text-accent uppercase mb-8 font-secondary">Dashboard</h1>

    <!-- Dashboard Content -->
    <div class="flex flex-col gap-6 mb-8">
      <!-- Welcome Box -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
        <div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <!-- User Initial Avatar -->
          <div class="flex-shrink-0">
            <div class="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border-2 border-accent/30">
              <span class="text-xl font-medium text-accent">{{ userInitials }}</span>
            </div>
          </div>
          
          <!-- User Info Section -->
          <div class="flex-grow">
            <div class="flex flex-col md:flex-row md:items-center justify-between w-full">
              <div>
                <h2 class="text-xl font-semibold">Welcome back, {{ userInfo?.username || 'Guest' }}</h2>
                <p class="text-gray-400 mt-1">{{ userInfo?.email }}</p>
              </div>
              
              <div class="mt-3 md:mt-0">
                <span class="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
                  {{ planLabel }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700/50">
          <div class="bg-gray-900/40 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Last Login</p>
                <p class="text-lg font-medium mt-1">{{ formattedLastLogin }}</p>
              </div>
              <div class="p-2 bg-blue-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 10.75a.75.75 0 01-1.5 0V7.75a.75.75 0 011.5 0v5z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-900/40 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Uploads Today</p>
                <p class="text-lg font-medium mt-1">{{ userUsage.uploadsToday }}</p>
              </div>
              <div class="p-2 bg-violet-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-900/40 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Account Created</p>
                <p class="text-lg font-medium mt-1">{{ formattedCreatedAt }}</p>
              </div>
              <div class="p-2 bg-green-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
       
      </div>
      
      <!-- Database Tables Info -->
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Database Tables</h2>
          <button 
            @click="refreshDatabaseInfo" 
            class="text-xs text-accent underline flex items-center gap-1"
            :class="{ 'opacity-50 cursor-wait': isRefreshingDBInfo }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'animate-spin': isRefreshingDBInfo }">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        <div v-if="databaseTables.length === 0" class="text-gray-500 text-center py-8">
          No database tables found. Upload files in AZ or US modules to see data.
        </div>
        
        <div v-else>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-400 border-b border-gray-700">
                  <th class="pb-2 pl-2">Table Name</th>
                  <th class="pb-2">Records</th>
                  <th class="pb-2">Module</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(table, i) in databaseTables" :key="i" class="border-b border-gray-700/30">
                  <td class="py-3 pl-2 font-mono text-accent">{{ table.name }}</td>
                  <td class="py-3 text-green-400">{{ table.count }}</td>
                  <td class="py-3">{{ getModuleForTable(table.name) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="mt-4 text-xs text-gray-400">
            <p>Total tables: {{ databaseTables.length }}</p>
            <p>Total records: {{ databaseTables.reduce((sum, table) => sum + table.count, 0) }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Storage Strategy Notifications -->
    <StorageNotification
      v-if="storageStrategyChanged"
      :title="strategyNotification.title"
      :message="strategyNotification.message"
      :type="strategyNotification.type"
      @dismissed="storageStrategyChanged = false"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { storageConfig } from '@/config/storage-config';
  import { DBName } from '@/types/app-types';
  import StorageNotification from '@/components/common/StorageNotification.vue';
  import { StorageType } from '@/config/storage-config';
  import { AZService } from '@/services/az.service';
  import { USService } from '@/services/us.service';
  import { useSharedStore } from '@/stores/shared-store';
  import { PlanTier } from '@/types/user-types';

  // Shared store for user info
  const sharedStore = useSharedStore();
  
  // User data from store
  const userInfo = computed(() => sharedStore.user.info);
  const currentPlan = computed(() => sharedStore.user.currentPlan);
  const userUsage = computed(() => sharedStore.user.usage);
  
  // Computed properties for user display
  const userInitials = computed(() => {
    if (!userInfo.value?.username) return '?';
    return userInfo.value.username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  });
  
  const formattedLastLogin = computed(() => {
    if (!userInfo.value?.lastLoggedIn) return 'Never';
    return new Date(userInfo.value.lastLoggedIn).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });
  
  const formattedCreatedAt = computed(() => {
    if (!userInfo.value?.createdAt) return 'Never';
    return new Date(userInfo.value.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });
  
  const planLabel = computed(() => {
    switch (currentPlan.value) {
      case PlanTier.PRO:
        return 'Pro Plan';
      case PlanTier.ENTERPRISE:
        return 'Enterprise Plan';
      default:
        return 'Free Plan';
    }
  });

  // Component state
  const isRefreshingDBInfo = ref(false);
  const databaseTables = ref<{name: string; count: number}[]>([]);
  
  // Services
  const azService = new AZService();
  const usService = new USService();
  
  // Storage strategy notification state
  const storageStrategyChanged = ref(false);
  const strategyNotification = ref({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error'
  });

  // Guess the module based on table name
  function getModuleForTable(tableName: string): string {
    if (tableName.toLowerCase().startsWith('az-')) {
      return 'AZ';
    } else if (tableName.toLowerCase().startsWith('us') || 
               /us\d+/.test(tableName.toLowerCase())) {
      return 'US';
    } else {
      return 'Other';
    }
  }

  async function refreshDatabaseInfo() {
    isRefreshingDBInfo.value = true;
    try {
      const azTables = await azService.listTables();
      const usTables = await usService.listTables();
      
      // Combine the tables from both services
      const allTables = [
        ...Object.entries(azTables).map(([name, count]) => ({ name, count })),
        ...Object.entries(usTables).map(([name, count]) => ({ name, count }))
      ];
      
      // Sort by table name
      databaseTables.value = allTables.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching database info:', error);
    } finally {
      isRefreshingDBInfo.value = false;
    }
  }

  // Handle storage strategy change events
  const handleStorageStrategyChange = (event: CustomEvent) => {
    const { newType, reason } = event.detail as { newType: StorageType; reason: string };
    
    if (newType === 'indexeddb' && reason === 'memory-pressure') {
      strategyNotification.value = {
        title: 'Storage Strategy Changed',
        message: 'Due to high memory usage, the application has automatically switched to IndexedDB storage for better stability.',
        type: 'warning'
      };
      storageStrategyChanged.value = true;
    } else if (newType === 'memory') {
      strategyNotification.value = {
        title: 'Storage Strategy Changed',
        message: 'The application is now using in-memory storage for faster performance.',
        type: 'info'
      };
      storageStrategyChanged.value = true;
    }
    
    // Refresh database info after strategy change
    refreshDatabaseInfo();
  };

  // Lifecycle hooks
  onMounted(() => {
    // Listen for storage strategy changes
    window.addEventListener('storage-strategy-changed', handleStorageStrategyChange as EventListener);
    
    // Initial load of database info
    refreshDatabaseInfo();
  });
  
  onUnmounted(() => {
    // Remove event listeners
    window.removeEventListener('storage-strategy-changed', handleStorageStrategyChange as EventListener);
  });
</script>
