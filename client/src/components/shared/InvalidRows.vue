<template>
  <div v-if="items && items.length > 0" class="-mx-6 px-6">
    <div
      @click="toggleDetails"
      class="w-full py-3 cursor-pointer flex items-center justify-between rounded-md"
    >
      <div class="flex items-center space-x-2">
        <h3 class="text-sm font-medium text-red-400">{{ title }}</h3>
        <span class="text-sm font-medium text-red-400">({{ items.length }})</span>
      </div>
      <component :is="showDetails ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4 text-red-400" />
    </div>

    <div v-if="showDetails" class="transition-all duration-300 ease-in-out rounded-b-md mt-1">
      <div class="px-2 py-4">
        <table class="w-full min-w-full border-separate border-spacing-0">
          <thead class="bg-gray-800/80">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-300">ROW</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-300">NAME</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-300">PREFIX</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-300">RATE</th>
            </tr>
          </thead>
          <tbody class="bg-gray-900/80">
            <tr
              v-for="(item, index) in items"
              :key="index + item.identifier"
              class="hover:bg-gray-800/50"
            >
              <td class="px-4 py-2 text-sm text-gray-300 border-t border-gray-800/50">
                {{ item.rowNumber }}
              </td>
              <td class="px-4 py-2 text-sm text-gray-300 border-t border-gray-800/50">
                {{ item.name }}
              </td>
              <td class="px-4 py-2 text-sm text-gray-300 font-mono border-t border-gray-800/50">
                {{ item.identifier }}
              </td>
              <td
                class="px-4 py-2 text-sm text-red-400 text-right font-mono border-t border-gray-800/50"
              >
                {{ item.problemValue }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline';
  import type { InvalidRowEntry } from '@/types/components/invalid-rows-types';

  interface Props {
    items: InvalidRowEntry[];
    title: string;
  }
  defineProps<Props>();

  const showDetails = ref(false);

  function toggleDetails() {
    showDetails.value = !showDetails.value;
  }
</script>
