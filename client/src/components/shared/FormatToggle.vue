<template>
  <!-- Compact CSV | XLSX segmented control (ADR-0010). Presentational; v-model'd. -->
  <div
    class="inline-flex border border-line-strong"
    role="radiogroup"
    aria-label="Export file format"
  >
    <button
      v-for="opt in options"
      :key="opt"
      type="button"
      role="radio"
      :aria-checked="modelValue === opt"
      @click="$emit('update:modelValue', opt)"
      class="px-3 py-1.5 font-display text-[11px] font-medium uppercase tracking-[0.06em] transition-colors"
      :class="
        modelValue === opt
          ? 'bg-accent-soft text-accent'
          : 'text-fg-faint hover:text-fg hover:bg-row-hover'
      "
    >
      {{ opt }}
    </button>
  </div>
</template>

<script setup lang="ts">
  import type { TabularFormat } from '@/utils/tabular-io';

  defineProps<{ modelValue: TabularFormat }>();
  defineEmits<{ (e: 'update:modelValue', value: TabularFormat): void }>();

  const options: TabularFormat[] = ['csv', 'xlsx'];
</script>
