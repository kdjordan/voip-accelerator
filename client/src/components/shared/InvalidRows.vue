<template>
  <div v-if="items && items.length > 0" class="-mx-6 px-6">
    <div
      @click="toggleDetails"
      class="w-full py-3 cursor-pointer flex items-center justify-between"
    >
      <div class="flex items-center space-x-2">
        <h3 class="font-display text-sm font-medium uppercase tracking-wide text-down">{{ title }}</h3>
        <span class="font-display text-sm font-medium tabular-nums text-down">({{ items.length }})</span>
      </div>
      <component :is="showDetails ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4 text-down" />
    </div>

    <div v-if="showDetails" class="transition-all duration-300 ease-in-out mt-1">
      <div class="py-3">
        <div class="border border-line bg-surface overflow-hidden">
          <table class="w-full min-w-full">
            <thead>
              <tr class="bg-row">
                <th class="px-4 py-2 text-left font-display text-[11px] font-medium uppercase tracking-wider text-fg-faint">ROW</th>
                <th class="px-4 py-2 text-left font-display text-[11px] font-medium uppercase tracking-wider text-fg-faint">NAME</th>
                <th class="px-4 py-2 text-left font-display text-[11px] font-medium uppercase tracking-wider text-fg-faint">PREFIX</th>
                <th class="px-4 py-2 text-right font-display text-[11px] font-medium uppercase tracking-wider text-fg-faint">RATE</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line-divider">
              <tr
                v-for="(item, index) in items"
                :key="index + item.identifier"
                class="hover:bg-row-hover"
              >
                <td class="px-4 py-2 text-sm font-display tabular-nums text-fg-dim">
                  {{ item.rowNumber }}
                </td>
                <td class="px-4 py-2 text-sm" :class="item.name === 'N/A' ? 'text-down' : 'text-fg-dim'">
                  {{ item.name }}
                </td>
                <td class="px-4 py-2 text-sm font-display tabular-nums" :class="item.identifier === 'N/A' ? 'text-down' : 'text-fg-dim'">
                  {{ item.identifier }}
                </td>
                <td
                  class="px-4 py-2 text-sm text-right font-display tabular-nums"
                  :class="item.problemValue === 'N/A' ? 'text-down' : 'text-fg-dim'"
                >
                  {{ item.problemValue }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
