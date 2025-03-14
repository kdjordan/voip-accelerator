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
      <div
        v-if="!isLoadingDatabaseInfo && allDatabaseTables.length > 0"
        class="bg-gray-800 rounded-lg p-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Database Tables</h2>
          <div class="text-xs text-accent flex items-center gap-2">
            <span class="text-green-400">Live</span>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-400 border-b border-gray-700">
                <th class="pb-2 pl-2">Table Name</th>
                <th class="pb-2">Storage</th>
                <th class="pb-2">Records</th>
                <th class="pb-2">Module</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="table in allDatabaseTables"
                :key="`${table.name}-${table.storage}`"
                class="border-b border-gray-700/30"
              >
                <td class="py-3 pl-2 font-mono text-accent">{{ table.name }}</td>
                <td class="py-3">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="table.storage === 'memory' 
                      ? 'bg-violet-900/30 text-violet-300' 
                      : 'bg-blue-900/30 text-blue-300'"
                  >
                    {{ table.storage === 'memory' ? 'Memory' : 'IndexedDB' }}
                  </span>
                </td>
                <td class="py-3 text-green-400">{{ table.count.toLocaleString() }}</td>
                <td class="py-3">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="{
                      'bg-blue-900/30 text-blue-300': getModuleForTable(table.name) === 'AZ',
                      'bg-green-900/30 text-green-300': getModuleForTable(table.name) === 'US',
                      'bg-yellow-900/30 text-yellow-300': getModuleForTable(table.name) === 'LERG',
                      'bg-purple-900/30 text-purple-300': getModuleForTable(table.name) === 'Rate Sheet',
                      'bg-gray-900/30 text-gray-300': getModuleForTable(table.name) === 'Other'
                    }"
                  >
                    {{ getModuleForTable(table.name) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mt-4 text-xs text-gray-400">
          <p>Memory: {{ totalMemoryRecords.toLocaleString() }} records | IndexedDB: {{ totalIndexedDbRecords.toLocaleString() }} records</p>
          <p>Total records: {{ totalRecords.toLocaleString() }}</p>
        </div>
      </div>
      <div 
        v-else-if="isLoadingDatabaseInfo" 
        class="bg-gray-800 rounded-lg p-6 flex justify-center items-center h-36"
      >
        <div class="text-center">
          <p class="text-lg mb-3">Loading database information...</p>
          <div class="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
      <div 
        v-else 
        class="bg-gray-800 rounded-lg p-6 flex justify-center items-center h-36"
      >
        <div class="text-center text-lg text-gray-500">
          <p>No database tables found</p>
          <p class="text-sm mt-2">Database information will automatically update when data becomes available</p>
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
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { storageConfig } from '@/config/storage-config';
  import { DBName } from '@/types/app-types';
  import StorageNotification from '@/components/common/StorageNotification.vue';
  import { StorageType } from '@/config/storage-config';
  import { AZService } from '@/services/az.service';
  import { USService } from '@/services/us.service';
  import { useSharedStore } from '@/stores/shared-store';
  import { PlanTier } from '@/types/user-types';
  import { useAzStore } from '@/stores/az-store';
  import { useUsStore } from '@/stores/us-store';
  import { useLergStore } from '@/stores/lerg-store';
  import { useRateSheetStore } from '@/stores/rate-sheet-store';

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
  const isLoadingDatabaseInfo = ref(false);
  
  // Define interface for table data
  interface DatabaseTable {
    name: string;
    count: number;
    storage: 'memory' | 'indexeddb';
  }
  
  // Stores for accessing memory (Pinia) data
  const azStore = useAzStore();
  const usStore = useUsStore();
  const lergStore = useLergStore();
  const rateSheetStore = useRateSheetStore();
  
  // Services for accessing IndexedDB data
  const azService = new AZService();
  const usService = new USService();
  
  // Reactive database tables
  const memoryTables = ref<DatabaseTable[]>([]);
  const indexedDbTables = ref<DatabaseTable[]>([]);
  const allDatabaseTables = ref<DatabaseTable[]>([]);
  
  // Reactive computed values
  const totalMemoryRecords = computed(() => {
    return memoryTables.value.reduce((acc, table) => acc + table.count, 0);
  });

  const totalIndexedDbRecords = computed(() => {
    return indexedDbTables.value.reduce((acc, table) => acc + table.count, 0);
  });

  const totalRecords = computed(() => {
    return totalMemoryRecords.value + totalIndexedDbRecords.value;
  });
  
  // Storage strategy notification state
  const storageStrategyChanged = ref(false);
  const strategyNotification = ref({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error'
  });

  // Determine module type based on table name
  function getModuleForTable(tableName: string): string {
    const lowerTableName = tableName.toLowerCase();
    
    // Check for AZ tables
    if (lowerTableName.startsWith('az') || 
        lowerTableName.includes(DBName.AZ.toLowerCase().replace('_', ''))) {
      return 'AZ';
    }
    
    // Check for US tables
    if (lowerTableName.startsWith('us') || 
        lowerTableName.includes(DBName.US.toLowerCase().replace('_', '')) || 
        /us\d+/.test(lowerTableName)) {
      return 'US';
    }
    
    // Check for LERG tables
    if (lowerTableName.includes('lerg') || 
        lowerTableName.includes(DBName.LERG.toLowerCase())) {
      return 'LERG';
    }
    
    // Check for Rate Sheet tables
    if (lowerTableName.includes('rate') || 
        lowerTableName.includes('sheet') || 
        lowerTableName.includes(DBName.RATE_SHEET.toLowerCase().replace('_', ''))) {
      return 'Rate Sheet';
    }
    
    // Default for unknown types
    return 'Other';
  }

  /**
   * Get memory tables from Pinia stores - focusing on actual database tables, not derived properties
   * This function correctly detects in-memory data across different possible storage patterns
   */
  function getMemoryTables(): DatabaseTable[] {
    console.log('Starting getMemoryTables with full inspection');
    const tables: DatabaseTable[] = [];
    
    // AZ Store: Check for in-memory data
    try {
      let azRecords = 0;
      console.log('AZ Store Structure:', JSON.stringify((azStore as any).$state, null, 2));
      
      // Try to directly access the inMemoryData from the store
      if ((azStore as any).$state && (azStore as any).$state.inMemoryData) {
        Object.entries((azStore as any).$state.inMemoryData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            azRecords += value.length;
            console.log(`Found AZ memory data in $state.inMemoryData.${key}: ${value.length} records`);
          }
        });
      } 
      // Also check nested inMemoryData property
      else if (typeof azStore.getInMemoryData === 'function') {
        const inMemoryData = azStore.getInMemoryData(DBName.AZ);
        if (inMemoryData && typeof inMemoryData === 'object') {
          Object.entries(inMemoryData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              azRecords += value.length;
              console.log(`Found AZ memory data in getInMemoryData().${key}: ${value.length} records`);
            }
          });
        }
      } 
      // Check the direct azStore store for arrays
      else {
        // Direct inspection of store looking for arrays
        for (const key in azStore) {
          if (key === '$state') continue; // Skip $state as we already checked it

          const value = (azStore as any)[key];
          if (Array.isArray(value) && value.length > 0) {
            azRecords += value.length;
            console.log(`Found AZ memory data in root property ${key}: ${value.length} records`);
          } else if (typeof value === 'object' && value !== null) {
            // Check one level deeper
            for (const nestedKey in value) {
              const nestedValue = value[nestedKey];
              if (Array.isArray(nestedValue) && nestedValue.length > 0) {
                azRecords += nestedValue.length;
                console.log(`Found AZ memory data in ${key}.${nestedKey}: ${nestedValue.length} records`);
              }
            }
          }
        }
      }
      
      // If we found data, add it
      if (azRecords > 0) {
        tables.push({
          name: DBName.AZ,
          count: azRecords,
          storage: 'memory' as const
        });
      }
      // Last resort: check raw store
      else if ((azStore as any).isLocallyStored) {
        console.log('Fallback: Using getStoreRecordCount for AZ data');
        const recordCount = getStoreRecordCount(azStore);
        if (recordCount > 0) {
          tables.push({
            name: DBName.AZ,
            count: recordCount,
            storage: 'memory' as const
          });
        }
      }
    } catch (error) {
      console.warn('Error checking AZ memory store:', error);
    }
    
    // US Store: Similar approach with enhanced detection
    try {
      let usRecords = 0;
      
      // Direct access to state inMemoryData
      if ((usStore as any).$state && (usStore as any).$state.inMemoryData) {
        Object.entries((usStore as any).$state.inMemoryData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            usRecords += value.length;
            console.log(`Found US memory data in $state.inMemoryData.${key}: ${value.length} records`);
          }
        });
      } 
      // Method-based approach
      else if (typeof usStore.getInMemoryData === 'function') {
        const inMemoryData = usStore.getInMemoryData(DBName.US);
        if (inMemoryData && typeof inMemoryData === 'object') {
          Object.entries(inMemoryData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              usRecords += value.length;
              console.log(`Found US memory data in getInMemoryData().${key}: ${value.length} records`);
            }
          });
        }
      }
      // Direct store inspection
      else {
        for (const key in usStore) {
          if (key === '$state') continue;

          const value = (usStore as any)[key];
          if (Array.isArray(value) && value.length > 0) {
            usRecords += value.length;
            console.log(`Found US memory data in root property ${key}: ${value.length} records`);
          } else if (typeof value === 'object' && value !== null) {
            // Check one level deeper
            for (const nestedKey in value) {
              const nestedValue = value[nestedKey];
              if (Array.isArray(nestedValue) && nestedValue.length > 0) {
                usRecords += nestedValue.length;
                console.log(`Found US memory data in ${key}.${nestedKey}: ${nestedValue.length} records`);
              }
            }
          }
        }
      }
      
      if (usRecords > 0) {
        tables.push({
          name: DBName.US,
          count: usRecords,
          storage: 'memory' as const
        });
      } else if ((usStore as any).isLocallyStored) {
        console.log('Fallback: Using getStoreRecordCount for US data');
        const recordCount = getStoreRecordCount(usStore);
        if (recordCount > 0) {
          tables.push({
            name: DBName.US,
            count: recordCount,
            storage: 'memory' as const
          });
        }
      }
    } catch (error) {
      console.warn('Error checking US memory store:', error);
    }
    
    // Rate Sheet Store - enhanced detection
    try {
      let rateSheetRecords = 0;
      
      // Direct access to state
      if ((rateSheetStore as any).$state && (rateSheetStore as any).$state.inMemoryData) {
        Object.entries((rateSheetStore as any).$state.inMemoryData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            rateSheetRecords += value.length;
            console.log(`Found RateSheet memory data in $state.inMemoryData.${key}: ${value.length} records`);
          }
        });
      } 
      // Method-based approach
      else if (typeof (rateSheetStore as any).getInMemoryData === 'function') {
        const inMemoryData = (rateSheetStore as any).getInMemoryData(DBName.RATE_SHEET);
        if (inMemoryData && typeof inMemoryData === 'object') {
          Object.entries(inMemoryData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              rateSheetRecords += value.length;
              console.log(`Found RateSheet memory data in getInMemoryData().${key}: ${value.length} records`);
            }
          });
        }
      }
      // Direct inspection
      else {
        for (const key in rateSheetStore) {
          if (key === '$state') continue;

          const value = (rateSheetStore as any)[key];
          if (Array.isArray(value) && value.length > 0) {
            rateSheetRecords += value.length;
            console.log(`Found RateSheet memory data in property ${key}: ${value.length} records`);
          } else if (typeof value === 'object' && value !== null) {
            // Check one level deeper
            for (const nestedKey in value) {
              const nestedValue = value[nestedKey];
              if (Array.isArray(nestedValue) && nestedValue.length > 0) {
                rateSheetRecords += nestedValue.length;
                console.log(`Found RateSheet memory data in ${key}.${nestedKey}: ${nestedValue.length} records`);
              }
            }
          }
        }
      }
      
      if (rateSheetRecords > 0) {
        tables.push({
          name: DBName.RATE_SHEET,
          count: rateSheetRecords,
          storage: 'memory' as const
        });
      } else if ((rateSheetStore as any).isLocallyStored) {
        console.log('Fallback: Using getStoreRecordCount for RateSheet data');
        const recordCount = getStoreRecordCount(rateSheetStore);
        if (recordCount > 0) {
          tables.push({
            name: DBName.RATE_SHEET,
            count: recordCount,
            storage: 'memory' as const
          });
        }
      }
    } catch (error) {
      console.warn('Error checking RateSheet memory store:', error);
    }
    
    // LERG is always in IndexedDB, never in memory
    
    console.log('Completed getMemoryTables, found', tables.length, 'tables');
    tables.forEach(table => {
      console.log(`Memory table: ${table.name}, Records: ${table.count}`);
    });
    
    return tables;
  }

  /**
   * Get the total record count from a store by finding the main data array
   */
  function getStoreRecordCount(store: any): number {
    try {
      // Common property names that might contain the main data array
      const dataPropertyNames = ['data', 'records', 'items', 'rows', 'entries'];
      
      // Check if any of these properties exist and contain arrays
      for (const prop of dataPropertyNames) {
        if (store[prop] && Array.isArray(store[prop])) {
          return store[prop].length;
        }
      }
      
      // If no common properties found, look for the largest array property
      let maxLength = 0;
      let mainDataProperty = null;
      
      // Check all properties of the store
      for (const key of Object.keys(store)) {
        const value = (store as any)[key];
        
        // Skip functions, primitive values, and obvious non-data properties
        if (typeof value === 'function' || 
            typeof value !== 'object' || 
            value === null ||
            key === 'error' || 
            key === 'isProcessing' || 
            key === 'isLocallyStored') {
          continue;
        }
        
        // If it's an array with more items than we've seen so far, track it
        if (Array.isArray(value) && value.length > maxLength) {
          maxLength = value.length;
          mainDataProperty = key;
        }
        
        // Also check nested properties one level deep
        if (typeof value === 'object') {
          for (const nestedKey of Object.keys(value)) {
            const nestedValue = value[nestedKey];
            if (Array.isArray(nestedValue) && nestedValue.length > maxLength) {
              maxLength = nestedValue.length;
              mainDataProperty = `${key}.${nestedKey}`;
            }
          }
        }
      }
      
      // For LERG store specifically, use the totalRecords value if available
      if (store.stats && typeof store.stats.totalRecords === 'number') {
        return store.stats.totalRecords;
      }
      
      console.log('Found main data property:', mainDataProperty, 'with', maxLength, 'records');
      return maxLength;
    } catch (e) {
      console.warn('Error getting store record count:', e);
      return 0;
    }
  }
  
  /**
   * Get IndexedDB tables using services - correctly check if databases exist
   */
  async function getIndexedDbTables(): Promise<DatabaseTable[]> {
    console.log('Starting getIndexedDbTables');
    const tables: DatabaseTable[] = [];
    
    try {
      // For AZ and US, we need to directly verify if data exists in IndexedDB
      // We can't just rely on the service's listTables method as it might return
      // data from the current strategy (which could be memory)
      
      // For AZ: Try to verify if data truly exists in IndexedDB
      try {
        // Force check the IndexedDB strategy directly regardless of current strategy
        const { DexieStrategy } = await import('@/services/storage/dexie-strategy');
        
        // Initialize a direct connection to AZ IndexedDB (not using the service)
        const azDexieStrategy = new DexieStrategy(DBName.AZ);
        await azDexieStrategy.initialize();
        
        // Check if tables truly exist in IndexedDB with data
        const indexedDbAzTables = await azDexieStrategy.listTables();
        const totalAzRecords = indexedDbAzTables.reduce((sum, item) => sum + item.recordCount, 0);
        
        if (totalAzRecords > 0) {
          console.log(`Found ${indexedDbAzTables.length} AZ tables in IndexedDB with ${totalAzRecords} total records`);
          tables.push({
            name: DBName.AZ,
            count: totalAzRecords,
            storage: 'indexeddb' as const
          });
        } else {
          console.log('No AZ records found in IndexedDB');
        }
      } catch (error) {
        console.warn('Error directly checking AZ IndexedDB:', error);
        // If error, AZ data is likely not in IndexedDB
      }
      
      // For US: Similar approach
      try {
        const { DexieStrategy } = await import('@/services/storage/dexie-strategy');
        const usDexieStrategy = new DexieStrategy(DBName.US);
        await usDexieStrategy.initialize();
        
        const indexedDbUsTables = await usDexieStrategy.listTables();
        const totalUsRecords = indexedDbUsTables.reduce((sum, item) => sum + item.recordCount, 0);
        
        if (totalUsRecords > 0) {
          console.log(`Found ${indexedDbUsTables.length} US tables in IndexedDB with ${totalUsRecords} total records`);
          tables.push({
            name: DBName.US,
            count: totalUsRecords,
            storage: 'indexeddb' as const
          });
        } else {
          console.log('No US records found in IndexedDB');
        }
      } catch (error) {
        console.warn('Error directly checking US IndexedDB:', error);
      }
      
      // LERG is always in IndexedDB regardless of current strategy
      if ((lergStore as any).stats?.totalRecords > 0) {
        console.log(`Found LERG data in IndexedDB with ${(lergStore as any).stats.totalRecords} records`);
        tables.push({
          name: DBName.LERG,
          count: (lergStore as any).stats.totalRecords,
          storage: 'indexeddb' as const
        });
      } else {
        console.log('No LERG records found in IndexedDB');
      }
      
      // For Rate Sheet (if implemented in IndexedDB)
      try {
        const { DexieStrategy } = await import('@/services/storage/dexie-strategy');
        const rateSheetDexieStrategy = new DexieStrategy(DBName.RATE_SHEET);
        await rateSheetDexieStrategy.initialize();
        
        const indexedDbRateSheetTables = await rateSheetDexieStrategy.listTables();
        const totalRateSheetRecords = indexedDbRateSheetTables.reduce((sum, item) => sum + item.recordCount, 0);
        
        if (totalRateSheetRecords > 0) {
          console.log(`Found ${indexedDbRateSheetTables.length} Rate Sheet tables in IndexedDB with ${totalRateSheetRecords} total records`);
          tables.push({
            name: DBName.RATE_SHEET,
            count: totalRateSheetRecords,
            storage: 'indexeddb' as const
          });
        }
      } catch (error) {
        console.warn('Error directly checking Rate Sheet IndexedDB:', error);
      }
      
    } catch (error) {
      console.error('Error fetching IndexedDB tables:', error);
    }
    
    console.log('Completed getIndexedDbTables, found', tables.length, 'tables');
    tables.forEach(table => {
      console.log(`IndexedDB table: ${table.name}, Records: ${table.count}`);
    });
    
    return tables;
  }
  
  /**
   * Debug output to help diagnose why tables aren't showing
   */
  function debugDatabaseInfo() {
    console.log('----------- DATABASE DEBUG INFO -----------');
    console.log('LERG Store:', lergStore);
    console.log('LERG Stats:', (lergStore as any).stats);
    console.log('Memory Tables:', memoryTables.value);
    console.log('IndexedDB Tables:', indexedDbTables.value);
    console.log('All Tables:', allDatabaseTables.value);
    console.log('----------------------------------------');
  }
  
  /**
   * Refresh database information from all sources
   * This function gathers data from both memory (Pinia) and IndexedDB, 
   * regardless of the current storage strategy
   */
  async function refreshDatabaseInfo() {
    isLoadingDatabaseInfo.value = true;
    
    try {
      console.log('====== REFRESHING DATABASE INFO ======');
      console.log('Current storage strategy:', storageConfig.storageType);
      
      // Get tables from memory (Pinia stores) regardless of current strategy
      // This ensures we detect data even if the current strategy is IndexedDB
      memoryTables.value = getMemoryTables();
      console.log(`Found ${memoryTables.value.length} tables in memory`);
      
      // Get tables from IndexedDB regardless of current strategy
      // This ensures we detect data even if the current strategy is memory
      indexedDbTables.value = await getIndexedDbTables();
      console.log(`Found ${indexedDbTables.value.length} tables in IndexedDB`);
      
      // Combine and sort by name for display
      // If a table exists in both memory and IndexedDB, we'll show both entries
      allDatabaseTables.value = [...memoryTables.value, ...indexedDbTables.value]
        .sort((a, b) => a.name.localeCompare(b.name));
      
      // Debug output to help diagnose issues
      debugDatabaseInfo();
      
      console.log('Database info refreshed:');
      console.log('- Memory tables:', memoryTables.value.length); 
      console.log('- IndexedDB tables:', indexedDbTables.value.length);
      console.log('- Total unique tables:', allDatabaseTables.value.length);
      console.log('====== REFRESH COMPLETE ======');
    } catch (error) {
      console.error('Failed to refresh database info:', error);
    } finally {
      isLoadingDatabaseInfo.value = false;
    }
  }

  // Update memoryTables whenever any of our stores change
  watch(
    [azStore, usStore, lergStore, rateSheetStore],
    () => {
      console.log('Store changed, updating memory tables');
      
      // We need to update our memory tables whenever any of the stores change
      // but don't need to update indexedDbTables since they don't change with store updates
      memoryTables.value = getMemoryTables();
      
      // Also run the targeted check for specific data structures
      checkForSpecificData();
      
      // Recalculate allDatabaseTables with the new memory tables
      allDatabaseTables.value = [...memoryTables.value, ...indexedDbTables.value]
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log('Updated tables after store change:', { 
        memory: memoryTables.value.length, 
        all: allDatabaseTables.value.length 
      });
    },
    { 
      deep: true,
      // Debounce updates to prevent too many refreshes when multiple stores change at once
      flush: 'post'
    }
  );

  /**
   * Handle storage strategy change event
   */
  function handleStorageStrategyChange(event: Event) {
    // Cast to CustomEvent to access the detail property
    const customEvent = event as CustomEvent;
    const { newType, reason } = customEvent.detail as { newType: StorageType; reason: string };
    
    // Log the event for debugging
    console.log('Storage strategy changed:', customEvent.detail);
    
    // Show notification about the strategy change
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
    
    // Refresh database information to capture the changes
    refreshDatabaseInfo();
  }

  /**
   * Directly inspect the Pinia store for the exact data we're looking for
   * This is a more targeted approach for specific data structures we know exist
   */
  function checkForSpecificData(): void {
    console.log('Performing targeted data check for AZ in-memory data');
    
    // Check for the specific az-test1 and az-test2 arrays
    try {
      const inMemoryData = (azStore as any).$state?.inMemoryData;
      if (inMemoryData) {
        // Look for az-test1 and az-test2
        if (Array.isArray(inMemoryData['az-test1']) || Array.isArray(inMemoryData['az-test2'])) {
          let count = 0;
          
          if (Array.isArray(inMemoryData['az-test1'])) {
            count += inMemoryData['az-test1'].length;
            console.log(`Found az-test1 array with ${inMemoryData['az-test1'].length} records`);
          }
          
          if (Array.isArray(inMemoryData['az-test2'])) {
            count += inMemoryData['az-test2'].length;
            console.log(`Found az-test2 array with ${inMemoryData['az-test2'].length} records`);
          }
          
          if (count > 0) {
            console.log(`Direct check found total of ${count} AZ records in memory`);
            
            // Make sure this data is reflected in our tables
            const existingAzIndex = memoryTables.value.findIndex(t => t.name === DBName.AZ);
            if (existingAzIndex >= 0) {
              memoryTables.value[existingAzIndex].count = count;
            } else {
              memoryTables.value.push({
                name: DBName.AZ,
                count: count,
                storage: 'memory'
              });
            }
            
            // Refresh the combined view
            allDatabaseTables.value = [...memoryTables.value, ...indexedDbTables.value]
              .sort((a, b) => a.name.localeCompare(b.name));
          }
        }
      }
    } catch (error) {
      console.warn('Error during targeted data check:', error);
    }
    
    // Check for the redundant -storage Pinia stores
    try {
      const redundantStores = ['az_rate_deck_db-storage', 'us_rate_deck_db-storage'];
      console.log(`Checking for existence of redundant stores: ${redundantStores.join(', ')}`);
      
      // This is purely informational - they don't affect functionality but are confusing
      for (const storeName of redundantStores) {
        if ((azStore as any)[storeName] || (usStore as any)[storeName]) {
          console.warn(`Found redundant store: ${storeName} - This is a side effect of storage implementation and does not affect functionality`);
        }
      }
    } catch (error) {
      console.warn('Error checking redundant stores:', error);
    }
  }

  // Lifecycle hooks
  onMounted(async () => {
    // Listen for storage strategy changes
    window.addEventListener('storage-strategy-changed', handleStorageStrategyChange);
    
    // Debug: directly examine Pinia store structure 
    console.log('==== EXAMINING STORE STRUCTURE ====');
    
    // Direct check of AZ store inMemoryData property
    try {
      if ((azStore as any).$state?.inMemoryData) {
        const inMemData = (azStore as any).$state.inMemoryData;
        console.log('AZ Store inMemoryData keys:', Object.keys(inMemData));
        
        for (const key in inMemData) {
          if (Array.isArray(inMemData[key])) {
            console.log(`- ${key}: ${inMemData[key].length} items`);
          }
        }
      } else {
        console.log('AZ Store: No $state.inMemoryData property found');
      }
    } catch (error) {
      console.warn('Error checking AZ store structure:', error);
    }
    
    // Initial load of database info
    await refreshDatabaseInfo();
    
    // Special check for specific data structures that might be missed
    checkForSpecificData();
    
    // Log information about redundant stores for debugging
    console.log('Note: az_rate_deck_db-storage and us_rate_deck_db-storage are implementation details');
    console.log('They are used internally by the storage system and should be ignored in the UI');
  });
  
  onUnmounted(() => {
    // Remove event listeners
    window.removeEventListener('storage-strategy-changed', handleStorageStrategyChange);
  });
</script>
