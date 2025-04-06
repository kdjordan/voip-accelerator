<template>
  <div class="p-4 bg-white rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4">Database Maintenance</h2>

    <!-- Information Section -->
    <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
      <p class="text-blue-800 mb-2">
        This tool helps you consolidate duplicate tables in the database and clean up unnecessary
        data.
      </p>
      <p class="text-blue-700 text-sm">
        <span class="font-semibold">Note:</span> This process will merge all tables of each type
        into their standard tables and remove duplicates. Original table data will be preserved
        through metadata.
      </p>
    </div>

    <!-- Actions Section -->
    <div class="flex flex-col space-y-4">
      <div class="flex flex-col">
        <button
          class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          @click="consolidateAll"
          :disabled="isProcessing"
        >
          <span v-if="isProcessing" class="mr-2">
            <svg
              class="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
          Consolidate All Tables
        </button>

        <div class="flex space-x-4 mt-3">
          <button
            class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="consolidateUS"
            :disabled="isProcessing"
          >
            Consolidate US Tables
          </button>

          <button
            class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="consolidateAZ"
            :disabled="isProcessing"
          >
            Consolidate AZ Tables
          </button>
        </div>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="result" class="mt-6 pt-4 border-t border-gray-200">
      <h3 class="text-lg font-medium mb-3">Consolidation Results</h3>

      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 bg-gray-100 p-3 rounded-md">
            <p class="text-gray-700 font-semibold">Summary</p>
            <div class="flex justify-between mt-2">
              <span>Total Tables Removed:</span>
              <span class="font-medium">{{ result.totalTablesRemoved }}</span>
            </div>
            <div class="flex justify-between mt-1">
              <span>Total Records Migrated:</span>
              <span class="font-medium">{{ result.totalRecordsMigrated }}</span>
            </div>
            <div class="flex justify-between mt-1">
              <span>Total Duplicates Removed:</span>
              <span class="font-medium">{{ result.totalDuplicatesRemoved }}</span>
            </div>
          </div>

          <div v-if="result.us" class="bg-blue-50 p-3 rounded-md">
            <p class="text-blue-700 font-semibold">US Tables</p>
            <div class="mt-2 text-sm">
              <div class="flex justify-between">
                <span>Records Processed:</span>
                <span>{{ result.us.total }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span>Duplicates Removed:</span>
                <span>{{ result.us.deduplicated }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span>Tables Deleted:</span>
                <span>{{ result.us.deletedTables.length }}</span>
              </div>
            </div>
            <div v-if="result.us.deletedTables.length" class="mt-2 text-xs text-blue-600">
              <p>Deleted tables: {{ result.us.deletedTables.join(', ') }}</p>
            </div>
          </div>

          <div v-if="result.az" class="bg-green-50 p-3 rounded-md">
            <p class="text-green-700 font-semibold">AZ Tables</p>
            <div class="mt-2 text-sm">
              <div class="flex justify-between">
                <span>Records Processed:</span>
                <span>{{ result.az.total }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span>Duplicates Removed:</span>
                <span>{{ result.az.deduplicated }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span>Tables Deleted:</span>
                <span>{{ result.az.deletedTables.length }}</span>
              </div>
            </div>
            <div v-if="result.az.deletedTables.length" class="mt-2 text-xs text-green-600">
              <p>Deleted tables: {{ result.az.deletedTables.join(', ') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  runDatabaseConsolidation,
  consolidateUSTables,
  consolidateAZTables,
} from '@/utils/db-migration';

// Component state
const isProcessing = ref(false);
const result = ref<any>(null);

// Consolidate all tables
async function consolidateAll() {
  if (isProcessing.value) return;

  try {
    isProcessing.value = true;
    result.value = await runDatabaseConsolidation();
    console.log('Consolidation complete:', result.value);
  } catch (error) {
    console.error('Error during consolidation:', error);
  } finally {
    isProcessing.value = false;
  }
}

// Consolidate just US tables
async function consolidateUS() {
  if (isProcessing.value) return;

  try {
    isProcessing.value = true;
    const usStats = await consolidateUSTables();
    result.value = {
      us: usStats,
      totalTablesRemoved: usStats.deletedTables.length,
      totalRecordsMigrated: usStats.total,
      totalDuplicatesRemoved: usStats.deduplicated,
    };
  } catch (error) {
    console.error('Error during US consolidation:', error);
  } finally {
    isProcessing.value = false;
  }
}

// Consolidate just AZ tables
async function consolidateAZ() {
  if (isProcessing.value) return;

  try {
    isProcessing.value = true;
    const azStats = await consolidateAZTables();
    result.value = {
      az: azStats,
      totalTablesRemoved: azStats.deletedTables.length,
      totalRecordsMigrated: azStats.total,
      totalDuplicatesRemoved: azStats.deduplicated,
    };
  } catch (error) {
    console.error('Error during AZ consolidation:', error);
  } finally {
    isProcessing.value = false;
  }
}
</script>
