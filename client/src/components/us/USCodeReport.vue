<template>
  <div class="flex flex-col items-center">
    <h2>Code Report</h2>
  </div>
</template>

<script setup lang="ts">
  import type { USCodeReport } from '../../types/domains/us-types';

  defineProps<{
    report: USCodeReport | null;
  }>();

  function formatKey(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
</script>
