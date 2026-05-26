<template>
  <div v-if="items && items.length > 0" class="-mx-6 px-6">
    <div
      @click="toggleDetails"
      class="w-full py-3 cursor-pointer flex items-center justify-between rounded-lg"
    >
      <div class="flex items-center space-x-2">
        <h3 class="text-sm font-medium text-rose-400">{{ title }}</h3>
        <span class="text-sm font-medium text-rose-400">({{ items.length }})</span>
      </div>
      <component :is="showDetails ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4 text-rose-400" />
    </div>

    <div v-if="showDetails" class="transition-all duration-300 ease-in-out mt-1">
      <div class="py-3">
        <div class="rounded-xl border border-white/[0.07] overflow-hidden">
          <table class="w-full min-w-full">
            <thead>
              <tr class="bg-white/[0.02]">
                <th class="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">ROW</th>
                <th class="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">NAME</th>
                <th class="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">PREFIX</th>
                <th class="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500">RATE</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.06]">
              <tr
                v-for="(item, index) in items"
                :key="index + item.identifier"
                class="hover:bg-white/[0.02]"
              >
                <td class="px-4 py-2 text-sm font-secondary text-zinc-300">
                  {{ item.rowNumber }}
                </td>
                <td class="px-4 py-2 text-sm" :class="item.name === 'N/A' ? 'text-rose-400' : 'text-zinc-300'">
                  {{ item.name }}
                </td>
                <td class="px-4 py-2 text-sm font-secondary" :class="item.identifier === 'N/A' ? 'text-rose-400' : 'text-zinc-300'">
                  {{ item.identifier }}
                </td>
                <td
                  class="px-4 py-2 text-sm text-right font-secondary"
                  :class="item.problemValue === 'N/A' ? 'text-rose-400' : 'text-zinc-300'"
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
