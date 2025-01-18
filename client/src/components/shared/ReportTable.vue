<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-gray-700">
          <th v-for="header in headers" :key="header" class="p-3 text-left font-medium text-gray-400">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in items"
          :key="index"
          class="border-b border-gray-700 hover:bg-gray-800 hover:bg-opacity-50"
        >
          <td v-for="(value, key) in item" :key="key" class="p-3" :class="{ 'w-48 max-w-xs': key === 'dialCode' }">
            <template v-if="key === 'dialCode'">
              <div v-if="value.length > 20">
                <button @click="toggleDialCodes(index)" class="text-blue-500 hover:underline">
                  {{ expandedDialCodes[index] ? 'Hide Codes' : 'Show Codes' }}
                </button>
                <div v-if="expandedDialCodes[index]" class="mt-2 overflow-x-auto max-h-40">
                  <div class="whitespace-normal break-words">{{ value }}</div>
                </div>
              </div>
              <div v-else class="whitespace-normal break-words">
                {{ value }}
              </div>
            </template>
            <template v-else>
              {{ value }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  headers: string[];
  items: Record<string, any>[];
}>();

const expandedDialCodes = ref<Record<number, boolean>>({});

function toggleDialCodes(index: number) {
  expandedDialCodes.value[index] = !expandedDialCodes.value[index];
}
</script>