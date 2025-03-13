<template>
  <div class="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 w-80 text-sm">
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-bold">Storage Performance</h3>
      <button @click="isOpen = !isOpen" class="text-gray-400 hover:text-white">
        <span v-if="isOpen">▼</span>
        <span v-else>◀</span>
      </button>
    </div>
    
    <div v-if="isOpen">
      <div class="mb-4">
        <div class="flex justify-between mb-1">
          <span>Current Strategy:</span>
          <span class="font-semibold" :class="{
            'text-green-400': currentStrategy === 'memory',
            'text-blue-400': currentStrategy === 'indexeddb'
          }">
            {{ currentStrategy === 'memory' ? 'Memory (Pinia)' : 'IndexedDB' }}
          </span>
        </div>
        
        <div class="flex justify-between mb-1">
          <span>Memory Usage:</span>
          <span :class="{'text-red-400': memoryPercentage > 80, 'text-yellow-400': memoryPercentage > 50, 'text-green-400': memoryPercentage <= 50}">
            {{ memoryUsage.toFixed(1) }} MB ({{ memoryPercentage.toFixed(0) }}%)
          </span>
        </div>
        
        <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
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
        
        <div class="flex justify-between mb-2">
          <span>Auto-Fallback:</span>
          <span>{{ autoFallback ? 'Enabled' : 'Disabled' }}</span>
        </div>
        
        <div class="flex flex-col gap-2 mb-4">
          <button 
            @click="switchToMemory"
            class="w-full py-1 px-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentStrategy === 'memory'"
          >
            Use Memory Storage
          </button>
          
          <button 
            @click="switchToIndexedDB"
            class="w-full py-1 px-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentStrategy === 'indexeddb'"
          >
            Use IndexedDB Storage
          </button>
        </div>
        
        <div class="text-xs text-gray-400 mb-2">
          <div class="flex justify-between">
            <span>Threshold:</span>
            <span>{{ memoryThreshold }} MB</span>
          </div>
          
          <div class="flex justify-between">
            <span>Update Interval:</span>
            <span>{{ updateIntervalSeconds }}s</span>
          </div>
        </div>
      </div>
      
      <div class="border-t border-gray-700 pt-2">
        <h4 class="font-semibold mb-1">Performance Metrics</h4>
        <div v-if="metrics.length > 0" class="text-xs">
          <div class="grid grid-cols-4 gap-1 font-medium text-gray-400 mb-1">
            <div>Operation</div>
            <div>Records</div>
            <div>Memory</div>
            <div>IndexedDB</div>
          </div>
          
          <div v-for="(group, i) in groupedMetrics" :key="i" class="grid grid-cols-4 gap-1 mb-1">
            <div>{{ group.operation }}</div>
            <div>{{ group.recordCount }}</div>
            <div :class="{'text-green-400': group.speedup > 1, 'text-red-400': group.speedup < 1}">
              {{ group.memoryTime.toFixed(0) }}ms
            </div>
            <div :class="{'text-green-400': group.speedup < 1, 'text-red-400': group.speedup > 1}">
              {{ group.indexeddbTime.toFixed(0) }}ms
            </div>
          </div>
        </div>
        
        <div v-else class="text-gray-500 text-xs">
          No metrics available yet. Run tests to see performance data.
        </div>
        
        <button 
          @click="runPerformanceTests"
          class="w-full mt-2 py-1 px-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isRunningTests"
        >
          {{ isRunningTests ? 'Running Tests...' : 'Run Performance Tests' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { storageConfig, updateStorageConfig, useMemoryStorage, useIndexedDbStorage } from '@/config/storage-config';
import { setupMemoryMonitoring } from '@/services/storage/storage-factory';
import { runPerformanceTest, PerformanceMetric } from '@/services/storage/storage-test-utils';
import { DBName } from '@/types/app-types';

interface MetricGroup {
  operation: string;
  recordCount: number;
  memoryTime: number;
  indexeddbTime: number;
  speedup: number;
}

// Component state
const isOpen = ref(false);
const memoryUsage = ref(0);
const memoryPercentage = ref(0);
const updateInterval = ref<number | null>(null);
const metrics = ref<PerformanceMetric[]>([]);
const isRunningTests = ref(false);

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
}

function switchToIndexedDB() {
  useIndexedDbStorage();
  updateMemoryUsage();
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

// Lifecycle hooks
onMounted(() => {
  // Initial update
  updateMemoryUsage();
  
  // Setup periodic updates
  updateInterval.value = window.setInterval(() => {
    updateMemoryUsage();
  }, updateIntervalSeconds.value * 1000);
  
  // Listen for storage strategy changes
  window.addEventListener('storage-strategy-changed', updateMemoryUsage);
});

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
  window.removeEventListener('storage-strategy-changed', updateMemoryUsage);
});
</script> 