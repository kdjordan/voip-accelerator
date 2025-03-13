<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-sizeXl tracking-wide text-accent uppercase mb-8 font-secondary">Dashboard</h1>

    <!-- Storage Statistics Dashboard -->
    <div class="flex flex-col gap-6 mb-8">
      <!-- Combined Stats Box -->
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-lg font-semibold">Storage Statistics</h2>
          <div class="text-sm text-gray-400">
            Press <kbd class="px-1 py-0.5 bg-gray-700 rounded">Ctrl+Shift+P</kbd> to toggle Performance Metrics
          </div>
        </div>
        
        <div class="grid grid-cols-1 gap-3 border-b border-gray-700/50 pb-4 mb-6">
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Current Storage Strategy</h3>
              <div class="text-lg">
                <span class="text-sm font-medium px-2 py-1 rounded" 
                      :class="currentStrategy === 'memory' ? 'bg-violet-900 text-violet-300' : 'bg-blue-900 text-blue-300'">
                  {{ currentStrategy === 'memory' ? 'Memory (Pinia)' : 'IndexedDB' }}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Memory Usage</h3>
              <div class="text-lg" 
                   :class="{'text-red-400': memoryPercentage > 80, 'text-yellow-400': memoryPercentage > 50, 'text-green-400': memoryPercentage <= 50}">
                {{ memoryUsage.toFixed(1) }} MB ({{ memoryPercentage.toFixed(0) }}%)
              </div>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                class="h-2 rounded-full" 
                :class="{
                  'bg-red-500': memoryPercentage > 80,
                  'bg-yellow-500': memoryPercentage > 50 && memoryPercentage <= 80,
                  'bg-green-500': memoryPercentage <= 50
                }"
                :style="{ width: `${Math.min(memoryPercentage, 100)}%` }"
              ></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Auto-Fallback Status</h3>
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="autoFallback ? 'bg-accent animate-status-pulse-success' : 'bg-gray-500'"
                ></div>
                <span class="text-sm">{{ autoFallback ? 'Enabled' : 'Disabled' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Storage Control Section -->
        <div class="space-y-4">
          <div class="flex gap-4">
            <button 
              @click="switchToMemory"
              class="flex-1 py-2 px-4 rounded bg-violet-700 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="currentStrategy === 'memory'"
            >
              Use Memory Storage
            </button>
            
            <button 
              @click="switchToIndexedDB"
              class="flex-1 py-2 px-4 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="currentStrategy === 'indexeddb'"
            >
              Use IndexedDB Storage
            </button>
          </div>
          
          <div class="text-xs text-gray-400 grid grid-cols-2 gap-4 border-t border-gray-700/50 pt-4">
            <div>
              <div class="flex justify-between mb-1">
                <span>Memory Threshold:</span>
                <span>{{ memoryThreshold }} MB</span>
              </div>
              
              <div class="flex justify-between">
                <span>Update Interval:</span>
                <span>{{ updateIntervalSeconds }}s</span>
              </div>
            </div>
            
            <div>
              <div class="flex justify-between mb-1">
                <span>Current Strategy:</span>
                <span class="font-semibold" :class="{
                  'text-green-400': currentStrategy === 'memory',
                  'text-blue-400': currentStrategy === 'indexeddb'
                }">
                  {{ currentStrategy === 'memory' ? 'Memory (Pinia)' : 'IndexedDB' }}
                </span>
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

      <!-- Performance Metrics Section -->
      <div v-if="showPerformanceSection" class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Performance Metrics</h2>
          <button @click="showPerformanceSection = !showPerformanceSection" class="text-gray-400 hover:text-white text-sm">
            Hide Section
          </button>
        </div>
        
        <div v-if="metrics.length > 0" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-400 border-b border-gray-700">
                <th class="pb-2">Operation</th>
                <th class="pb-2">Records</th>
                <th class="pb-2">Memory</th>
                <th class="pb-2">IndexedDB</th>
                <th class="pb-2">Speedup</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(group, i) in groupedMetrics" :key="i" class="border-b border-gray-700/30">
                <td class="py-3">{{ group.operation }}</td>
                <td class="py-3">{{ group.recordCount }}</td>
                <td class="py-3" :class="{'text-green-400': group.speedup > 1, 'text-red-400': group.speedup < 1}">
                  {{ group.memoryTime.toFixed(0) }}ms
                </td>
                <td class="py-3" :class="{'text-green-400': group.speedup < 1, 'text-red-400': group.speedup > 1}">
                  {{ group.indexeddbTime.toFixed(0) }}ms
                </td>
                <td class="py-3" :class="{'text-green-400': group.speedup > 1, 'text-red-400': group.speedup < 1}">
                  {{ group.speedup.toFixed(1) }}x
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="text-gray-500 text-center py-8">
          No metrics available yet. Run tests to see performance data.
        </div>
        
        <div class="mt-4 flex justify-end">
          <button 
            @click="runPerformanceTests"
            class="py-2 px-4 rounded bg-accent hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isRunningTests"
          >
            {{ isRunningTests ? 'Running Tests...' : 'Run Performance Tests' }}
          </button>
        </div>
      </div>
      
      <!-- Button to show metrics when hidden -->
      <button 
        v-if="!showPerformanceSection" 
        @click="showPerformanceSection = true"
        class="bg-gray-800 rounded-lg p-4 text-center text-gray-400 hover:text-white hover:bg-gray-700/80 transition-colors"
      >
        Show Performance Metrics
      </button>
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
  import { storageConfig, updateStorageConfig, useMemoryStorage, useIndexedDbStorage } from '@/config/storage-config';
  import { setupMemoryMonitoring } from '@/services/storage/storage-factory';
  import { runPerformanceTest, type PerformanceMetric } from '@/services/storage/storage-test-utils';
  import { DBName } from '@/types/app-types';
  import StorageNotification from '@/components/common/StorageNotification.vue';
  import { StorageType } from '@/config/storage-config';
  import { AZService } from '@/services/az.service';
  import { USService } from '@/services/us.service';

  interface MetricGroup {
    operation: string;
    recordCount: number;
    memoryTime: number;
    indexeddbTime: number;
    speedup: number;
  }

  // Component state
  const memoryUsage = ref(0);
  const memoryPercentage = ref(0);
  const updateInterval = ref<number | null>(null);
  const metrics = ref<PerformanceMetric[]>([]);
  const isRunningTests = ref(false);
  const showPerformanceSection = ref(true);
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

  // Computed properties
  const currentStrategy = computed(() => storageConfig.storageType);
  const autoFallback = computed(() => storageConfig.autoFallbackOnMemoryPressure);
  const memoryThreshold = computed(() => storageConfig.memoryThresholdMB);
  const updateIntervalSeconds = computed(() => 5);

  // Group metrics by operation and record count
  const groupedMetrics = computed(() => {
    const groups: Record<string, MetricGroup> = {};
    
    metrics.value.forEach(metric => {
      const key = `${metric.operation}_${metric.recordCount}`;
      
      if (!groups[key]) {
        groups[key] = {
          operation: metric.operation,
          recordCount: metric.recordCount,
          memoryTime: 0,
          indexeddbTime: 0,
          speedup: 0
        };
      }
      
      if (metric.strategy === 'memory') {
        groups[key].memoryTime = metric.durationMs;
      } else {
        groups[key].indexeddbTime = metric.durationMs;
      }
    });
    
    // Calculate speedup ratio
    Object.values(groups).forEach(group => {
      if (group.indexeddbTime > 0 && group.memoryTime > 0) {
        group.speedup = group.indexeddbTime / group.memoryTime;
      }
    });
    
    return Object.values(groups);
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

  // Methods
  function updateMemoryUsage() {
    if (!('performance' in window) || !('memory' in (performance as any))) {
      memoryUsage.value = 0;
      memoryPercentage.value = 0;
      return;
    }
    
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      const usedJSHeapSize = memoryInfo.usedJSHeapSize;
      const jsHeapSizeLimit = memoryInfo.jsHeapSizeLimit;
      
      memoryUsage.value = usedJSHeapSize / (1024 * 1024);
      memoryPercentage.value = (usedJSHeapSize / jsHeapSizeLimit) * 100;
    }
  }

  function switchToMemory() {
    useMemoryStorage();
    updateMemoryUsage();
    refreshDatabaseInfo();
    
    // Show notification
    strategyNotification.value = {
      title: 'Storage Strategy Changed',
      message: 'The application is now using in-memory storage for faster performance.',
      type: 'info'
    };
    storageStrategyChanged.value = true;
  }

  function switchToIndexedDB() {
    useIndexedDbStorage();
    updateMemoryUsage();
    refreshDatabaseInfo();
    
    // Show notification
    strategyNotification.value = {
      title: 'Storage Strategy Changed',
      message: 'The application is now using IndexedDB storage for better stability and persistence.',
      type: 'info'
    };
    storageStrategyChanged.value = true;
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

  async function runPerformanceTests() {
    if (isRunningTests.value) return;
    
    isRunningTests.value = true;
    
    try {
      // Generate test data
      const generateTestData = (count: number) => {
        return Array.from({ length: count }, (_, i) => ({
          id: i,
          name: `Test ${i}`,
          value: Math.random() * 1000,
          timestamp: Date.now()
        }));
      };
      
      // Run tests for both AZ and US databases
      const azMetrics = await runPerformanceTest(
        DBName.AZ,
        generateTestData,
        [100, 1000, 5000]
      );
      
      metrics.value = azMetrics;
    } catch (error) {
      console.error('Error running performance tests', error);
    } finally {
      isRunningTests.value = false;
    }
  }
  
  // Toggle performance section visibility with keyboard shortcut (Ctrl+Shift+P)
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
      showPerformanceSection.value = !showPerformanceSection.value;
    }
  };

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
    // Initial update
    updateMemoryUsage();
    
    // Setup periodic updates
    updateInterval.value = window.setInterval(() => {
      updateMemoryUsage();
    }, updateIntervalSeconds.value * 1000);
    
    // Listen for storage strategy changes
    window.addEventListener('storage-strategy-changed', handleStorageStrategyChange as EventListener);
    
    // Add keyboard shortcut for performance section toggle
    window.addEventListener('keydown', handleKeyDown);
    
    // Initial load of database info
    refreshDatabaseInfo();
  });
  
  onUnmounted(() => {
    // Clear interval on component unmount
    if (updateInterval.value) {
      clearInterval(updateInterval.value);
    }
    
    // Remove event listeners
    window.removeEventListener('storage-strategy-changed', handleStorageStrategyChange as EventListener);
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>
