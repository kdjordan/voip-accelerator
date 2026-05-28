<template>
  <div class="overflow-x-auto border border-line bg-surface">
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-row border-b border-line">
          <th v-for="header in headers" :key="header" class="p-3 text-left font-display text-[11px] font-medium uppercase tracking-wider text-fg-faint">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in items"
          :key="index"
          class="border-b border-line-divider hover:bg-row-hover"
        >
          <td v-for="(value, key) in item" :key="key" class="p-3 tabular-nums text-fg-dim" :class="{ 'w-48 max-w-xs': key === 'dialCode' }">
            <template v-if="key === 'dialCode'">
              <div v-if="value.length > 20">
                <button @click="toggleDialCodes(index)" class="text-accent hover:text-accent-text hover:underline">
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