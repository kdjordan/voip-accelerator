  <template>
  <div class="min-h-screen text-white pt-2 w-full">
    <h1 class="text-3xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">Dashboard</h1>

    <!-- Dashboard Content -->
    <div class="flex flex-col gap-6 mb-8">
      <!-- Welcome Box -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
        <div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <!-- User Initial Avatar -->
          <div class="flex-shrink-0">
            <div
              class="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border-2 border-accent/30"
            >
              <span class="text-xl font-medium text-accent">{{ userInitials }}</span>
            </div>
          </div>

          <!-- User Info Section -->
          <div class="flex-grow">
            <div class="flex flex-col md:flex-row md:items-center justify-between w-full">
              <div>
                <h2 class="text-xl font-semibold">
                  Welcome back, {{ userInfo?.username || 'Guest' }}
                </h2>
                <p class="text-gray-400 mt-1">{{ userInfo?.email }}</p>
              </div>

              <div class="mt-3 md:mt-0">
                <span
                  class="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium uppercase"
                >
                  {{ sharedStore.user.currentPlan }} Plan
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 10.75a.75.75 0 01-1.5 0V7.75a.75.75 0 011.5 0v5z"
                    clip-rule="evenodd"
                  />
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-violet-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clip-rule="evenodd"
                  />
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
                    :class="
                      table.storage === 'memory'
                        ? 'bg-violet-900/30 text-violet-300'
                        : 'bg-blue-900/30 text-blue-300'
                    "
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
                      'bg-purple-900/30 text-purple-300':
                        getModuleForTable(table.name) === 'Rate Sheet',
                      'bg-gray-900/30 text-gray-300': getModuleForTable(table.name) === 'Other',
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
          <p>
            Memory: {{ totalMemoryRecords.toLocaleString() }} records | IndexedDB:
            {{ totalIndexedDbRecords.toLocaleString() }} records
          </p>
          <p>Total records: {{ totalRecords.toLocaleString() }}</p>
        </div>
      </div>
      <div
        v-else-if="isLoadingDatabaseInfo"
        class="bg-gray-800 rounded-lg p-6 flex justify-center items-center h-36"
      >
        <div class="text-center">
          <p class="text-lg mb-3">Loading database information...</p>
          <div
            class="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto"
          ></div>
        </div>
      </div>
      <div v-else class="bg-gray-800 rounded-lg p-6 flex justify-center items-center h-36">
        <div class="text-center text-lg text-gray-500">
          <p>No database tables found</p>
          <p class="text-sm mt-2">
            Database information will automatically update when data becomes available
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useSharedStore } from '@/stores/shared-store';
import { useAzStore } from '@/stores/az-store';
import { useUsStore } from '@/stores/us-store';
import { useLergStore } from '@/stores/lerg-store';
import { useLergData } from '@/composables/useLergData';

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
    .map((name) => name.charAt(0))
    .join('')
    .toUpperCase();
});

const formattedLastLogin = computed(() => {
  if (!userInfo.value?.lastLoggedIn) return 'Never';
  return new Date(userInfo.value.lastLoggedIn).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const formattedCreatedAt = computed(() => {
  if (!userInfo.value?.createdAt) return 'Never';
  return new Date(userInfo.value.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// Database tables information
const isLoadingDatabaseInfo = ref(false);
const allDatabaseTables = ref<
  Array<{
    name: string;
    storage: 'memory' | 'indexeddb';
    count: number;
  }>
>([]);

// Calculate totals for records
const totalMemoryRecords = computed(() => {
  return allDatabaseTables.value
    .filter((table) => table.storage === 'memory')
    .reduce((sum, table) => sum + table.count, 0);
});

const totalIndexedDbRecords = computed(() => {
  return allDatabaseTables.value
    .filter((table) => table.storage === 'indexeddb')
    .reduce((sum, table) => sum + table.count, 0);
});

const totalRecords = computed(() => {
  return totalMemoryRecords.value + totalIndexedDbRecords.value;
});

// Function to determine module based on table name
function getModuleForTable(tableName: string): string {
  if (tableName.startsWith('az') || tableName.includes('az_')) {
    return 'AZ';
  } else if (tableName.startsWith('us') || tableName.includes('us_')) {
    return 'US';
  } else if (tableName === 'lerg' || tableName.includes('lerg')) {
    return 'LERG';
  } else if (tableName.includes('rate_sheet')) {
    return 'Rate Sheet';
  } else {
    return 'Other';
  }
}

// Stores for accessing memory (Pinia) data
const azStore = useAzStore();
const usStore = useUsStore();
const lergStore = useLergStore();


// LERG initialization
const { initializeLergData, error: lergError } = useLergData();

// Function to load database information


// Initialize LERG data on component mount
onMounted(async () => {
  try {
    // Initialize LERG data
    await initializeLergData();

  } catch (err) {
    console.error('Failed to initialize services:', err);
  }
});
</script>
