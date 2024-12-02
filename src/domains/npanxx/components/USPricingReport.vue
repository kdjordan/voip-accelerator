<template>
  <div class="flex flex-col items-center">
    <h2>Pricing Report</h2>
  </div>
</template>

<script setup lang="ts">
import type { USPricingReport } from '../types/npanxx-types';

defineProps<{
  report: USPricingReport | null;
}>();

function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatValue(value: number | string): string {
  if (typeof value === 'number') {
    return value.toFixed(4);
  }
  return value.toString();
}
</script>
