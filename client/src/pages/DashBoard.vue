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
                  Welcome back, {{ userStore.auth.user?.email || 'Guest' }}
                </h2>
                <p class="text-gray-400 mt-1">{{ userStore.auth.user?.email }}</p>
              </div>

              <div class="mt-3 md:mt-0">
                <BaseBadge variant="accent" uppercase> {{ currentPlan }} Plan </BaseBadge>
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
              <div class="p-2 bg-blue-900/30 rounded-lg border border-blue-400/50">
                <InformationCircleIcon class="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div class="bg-gray-900/40 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Uploads Today</p>
                <p class="text-lg font-medium mt-1">{{ userUsage?.uploadsToday ?? 0 }}</p>
              </div>
              <div class="p-2 bg-yellow-900/30 rounded-lg border border-yellow-400/50">
                <ArrowUpTrayIcon class="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>

          <div class="bg-gray-900/40 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Account Created</p>
                <p class="text-lg font-medium mt-1">{{ formattedCreatedAt }}</p>
              </div>
              <div class="p-2 bg-accent/30 rounded-lg border border-accent/50">
                <CalendarDaysIcon class="h-5 w-5 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Settings -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
        <h2 class="text-lg font-semibold mb-4">Account Settings</h2>

        <!-- Trial Status -->
        <div class="mb-6 pb-6 border-b border-gray-700/50">
          <h3 class="text-md font-medium mb-2">Trial Information</h3>
          <p v-if="trialEndsAt && trialEndsAt > new Date()" class="text-sm text-gray-300">
            Your trial ends on:
            <span class="font-semibold text-accent">{{ formattedTrialEndsAt }}</span>
          </p>
          <p v-else-if="trialEndsAt && trialEndsAt <= new Date()" class="text-sm text-yellow-400">
            Your trial has ended.
          </p>
          <p v-else class="text-sm text-gray-400">No trial information available.</p>
          <!-- Add upgrade button/info here later -->
        </div>

        <!-- Email Change -->
        <div>
          <h3 class="text-md font-medium mb-3">Update Email Address</h3>
          <p class="text-sm text-gray-400 mb-4">
            Current email:
            <span class="font-medium">{{ userStore.profile?.email || userStore.user?.email }}</span>
            <br />
            Changing your email will require you to confirm the new address.
          </p>
          <form
            @submit.prevent="handleEmailUpdate"
            class="flex flex-col sm:flex-row items-start sm:items-end gap-3"
          >
            <div class="flex-grow w-full sm:w-auto">
              <label for="new-email" class="block text-sm font-medium text-gray-300 mb-1"
                >New Email</label
              >
              <input
                id="new-email"
                v-model="newEmail"
                type="email"
                required
                placeholder="Enter new email address"
                class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-sm"
              />
            </div>
            <BaseButton
              type="submit"
              :is-loading="isUpdatingEmail"
              :disabled="
                isUpdatingEmail ||
                !newEmail ||
                newEmail === (userStore.profile?.email || userStore.user?.email)
              "
            >
              {{ isUpdatingEmail ? 'Updating...' : 'Update Email' }}
            </BaseButton>
          </form>
          <p
            v-if="emailUpdateMessage"
            :class="['mt-3 text-sm', emailUpdateError ? 'text-red-400' : 'text-green-400']"
          >
            {{ emailUpdateMessage }}
          </p>
        </div>
      </div>

      <!-- Database Tables Info -->
      <div
        v-if="!isLoadingDatabaseInfo && allDatabaseTables.length > 0"
        class="bg-gray-800 rounded-lg p-6 border border-gray-700/50"
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
                class="border-b border-gray-700/30 hover:bg-gray-700/20"
              >
                <td class="py-3 pl-2 font-mono text-accent">{{ table.name }}</td>
                <td class="py-3">
                  <BaseBadge size="small" variant="info">
                    {{ 'IndexedDB' }}
                  </BaseBadge>
                </td>
                <td class="py-3 text-green-400">{{ table.count.toLocaleString() }}</td>
                <td class="py-3">
                  <BaseBadge size="small" :variant="getModuleBadgeVariant(table.name)">
                    {{ getModuleForTable(table.name) }}
                  </BaseBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 text-xs text-gray-400">
          <p>Total IndexedDB records: {{ totalRecords.toLocaleString() }}</p>
        </div>
      </div>
      <div
        v-else-if="isLoadingDatabaseInfo"
        class="bg-gray-800 rounded-lg p-6 flex justify-center items-center h-36 border border-gray-700/50"
      >
        <div class="flex-1 flex flex-col items-center justify-center w-full space-y-2">
          <ArrowPathIcon class="w-8 h-8 text-accent animate-spin" />
          <p class="text-sm text-accent">Loading database information...</p>
        </div>
      </div>
      <div
        v-else
        class="bg-gray-800 rounded-lg p-6 flex justify-center items-center h-36 border border-gray-700/50"
      >
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
  import { useUserStore } from '@/stores/user-store';
  import { useAzStore } from '@/stores/az-store';
  import { useUsStore } from '@/stores/us-store';
  import { useLergStore } from '@/stores/lerg-store';
  import { useLergData } from '@/composables/useLergData';
  import useDexieDB from '@/composables/useDexieDB';
  import { DBName } from '@/types/app-types';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import type { BaseBadgeProps, DBNameType } from '@/types/app-types';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import Dexie from 'dexie';
  import { ArrowPathIcon } from '@heroicons/vue/24/outline';
  import {
    InformationCircleIcon,
    ArrowUpTrayIcon,
    CalendarDaysIcon,
  } from '@heroicons/vue/24/solid';

  // User store for user info
  const userStore = useUserStore();

  // User data from store (using root store state directly for simplicity)
  // const userProfile = computed(() => userStore.profile);
  // const authUser = computed(() => userStore.user);

  const currentPlan = computed(() => userStore.profile?.subscription_status ?? 'Free');
  const userUsage = computed(() => ({ uploadsToday: 0 }));

  // Trial Information
  const trialEndsAt = computed(() => {
    const endsAt = userStore.getUserProfile?.trial_ends_at;
    return endsAt ? new Date(endsAt) : null;
  });

  const formattedTrialEndsAt = computed(() => {
    if (!trialEndsAt.value) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(trialEndsAt.value);
    } catch (e) {
      console.error('Error formatting trial end date:', trialEndsAt.value, e);
      return 'Invalid Date';
    }
  });

  // Computed properties for user display
  const userInitials = computed(() => {
    const email = userStore.user?.email;
    if (!email) return '?';
    const nameSource = email;
    return nameSource
      .split(' ')
      .map((name: string) => name.charAt(0))
      .join('')
      .toUpperCase();
  });

  const formattedLastLogin = computed(() => {
    const lastSignIn = userStore.getUser?.last_sign_in_at;
    if (!lastSignIn) {
      return 'Never';
    }
    try {
      const date = new Date(lastSignIn);
      const formatted = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
      return formatted;
    } catch (e) {
      console.error('Error formatting last login date:', lastSignIn, e);
      return 'Invalid Date';
    }
  });

  const formattedCreatedAt = computed(() => {
    const createdAt = userStore.getUserProfile?.created_at;
    if (!createdAt) {
      return 'Never';
    }
    try {
      const date = new Date(createdAt);
      const formatted = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
      return formatted;
    } catch (e) {
      console.error('Error formatting account created date:', createdAt, e);
      return 'Invalid Date';
    }
  });

  // Email Update State
  const newEmail = ref('');
  const isUpdatingEmail = ref(false);
  const emailUpdateMessage = ref('');
  const emailUpdateError = ref(false);

  async function handleEmailUpdate() {
    if (!newEmail.value || newEmail.value === userStore.user?.email || isUpdatingEmail.value) {
      return;
    }

    isUpdatingEmail.value = true;
    emailUpdateMessage.value = '';
    emailUpdateError.value = false;

    try {
      // Assuming userStore has an action like updateUserEmail
      await userStore.updateUserEmail(newEmail.value);
      emailUpdateMessage.value =
        'Confirmation email sent to your new address. Please check your inbox.';
      newEmail.value = ''; // Clear input on success
    } catch (error: any) {
      console.error('Email update failed:', error);
      emailUpdateMessage.value = error.message || 'Failed to update email. Please try again.';
      emailUpdateError.value = true;
    } finally {
      isUpdatingEmail.value = false;
    }
  }

  // DexieDB instance
  const dexieDB = useDexieDB();

  // Database tables information
  const isLoadingDatabaseInfo = ref(false);
  const allDatabaseTables = ref<
    Array<{
      name: string;
      storage: 'indexeddb';
      count: number;
    }>
  >([]);

  // Calculate totals for records
  const totalIndexedDbRecords = computed(() => {
    return allDatabaseTables.value.reduce((sum, table) => sum + table.count, 0);
  });

  // Simplify totalRecords computation
  const totalRecords = computed(() => {
    return totalIndexedDbRecords.value;
  });

  // Function to determine module based on table name
  function getModuleForTable(tableName: string): string {
    if (tableName.toLowerCase().startsWith('az') || tableName.toLowerCase().includes('az_')) {
      return 'AZ';
    } else if (
      tableName.toLowerCase().startsWith('us') ||
      tableName.toLowerCase().includes('us_')
    ) {
      return 'US';
    } else if (tableName.toLowerCase().includes('lerg')) {
      return 'LERG';
    } else if (tableName.toLowerCase().includes('rate_sheet')) {
      return 'Rate Sheet';
    } else if (tableName.toLowerCase().includes('comparison')) {
      return 'US Comparison';
    } else {
      return 'Other';
    }
  }

  // Helper function to map module name to badge variant
  function getModuleBadgeVariant(tableName: string): BaseBadgeProps['variant'] {
    const module = getModuleForTable(tableName);
    switch (module) {
      case 'AZ':
        return 'info';
      case 'US':
        return 'success';
      case 'LERG':
        return 'warning';
      case 'Rate Sheet':
        return 'violet';
      case 'US Comparison':
        return 'accent';
      case 'Other':
      default:
        return 'neutral';
    }
  }

  // Stores for accessing memory (Pinia) data and triggering updates
  const azStore = useAzStore();
  const usStore = useUsStore();
  const lergStore = useLergStore();

  // LERG initialization
  const { initializeLergData, error: lergError } = useLergData();

  // Function to load database information from IndexedDB
  async function loadDatabaseInfo() {
    isLoadingDatabaseInfo.value = true;
    allDatabaseTables.value = [];
    console.log('[DashBoard] Loading database info...');

    try {
      // 1. Get names of all IndexedDB databases present in the browser
      const existingDbNames = await Dexie.getDatabaseNames();
      console.log('[DashBoard] Found existing databases:', existingDbNames);

      // 2. Filter to get only our application's known databases that currently exist
      const knownAppDbNames = Object.values(DBName) as DBNameType[];
      const relevantExistingDbNames = existingDbNames.filter((name) =>
        knownAppDbNames.includes(name as DBNameType)
      );
      console.log('[DashBoard] Relevant existing app databases:', relevantExistingDbNames);

      // 3. Iterate only over the databases that actually exist
      for (const dbName of relevantExistingDbNames) {
        console.log(`[DashBoard] Checking existing DB: ${dbName}`);
        // We still need getDB to get table names/counts, but now only for existing DBs
        // getDB ensures the connection is open if needed
        const dbInstance = await dexieDB.getDB(dbName as DBNameType); // Cast to DBNameType
        const storeNames = await dexieDB.getAllStoreNamesForDB(dbName as DBNameType); // Cast to DBNameType
        console.log(`[DashBoard] Stores found in ${dbName}:`, storeNames);

        for (const storeName of storeNames) {
          try {
            // Use the specific dbInstance obtained above for counting
            const count = await dbInstance.table(storeName).count();
            allDatabaseTables.value.push({
              name: storeName,
              storage: 'indexeddb',
              count: count,
            });
            console.log(`[DashBoard] Added table: ${dbName}/${storeName} (${count} records)`);
          } catch (loadError) {
            console.error(
              `[DashBoard] Failed to load count for ${dbName}/${storeName}:`,
              loadError
            );
            // Optionally add an entry indicating the error
            allDatabaseTables.value.push({
              name: `${storeName} (Error Loading Count)`,
              storage: 'indexeddb',
              count: 0,
            });
          }
        }
      }
      console.log('[DashBoard] Finished loading database info. Tables:', allDatabaseTables.value);
    } catch (error) {
      console.error('[DashBoard] Error loading database info:', error);
    } finally {
      isLoadingDatabaseInfo.value = false;
    }
  }

  // Initialize LERG data and load DB info on component mount
  onMounted(async () => {
    try {
      await initializeLergData();
    } catch (err) {
      console.error('[DashBoard] Failed to initialize LERG:', err);
    }

    await loadDatabaseInfo();
  });

  watch(
    () => azStore.filesUploaded.size,
    async (newSize, oldSize) => {
      if (newSize !== oldSize) {
        console.log('[DashBoard] AZ Store uploads changed, reloading DB info...');
        await loadDatabaseInfo();
      }
    }
  );

  watch(
    () => usStore.filesUploaded.size,
    async (newSize, oldSize) => {
      if (newSize !== oldSize) {
        console.log('[DashBoard] US Store uploads changed, reloading DB info...');
        await loadDatabaseInfo();
      }
    }
  );
</script>

<style scoped>
  /* Add specific styles if needed, otherwise rely on Tailwind */
</style>
