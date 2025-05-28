<template>
  <tr class="border-b border-gray-700 last:border-b-0">
    <td class="py-2 px-2">{{ label }}</td>
    <td class="py-2 px-2 text-right text-foreground">{{ data.matchCount }}</td>
    <td class="py-2 px-2 text-right text-foreground">{{ data.percentOfComparable.toFixed(1) }}%</td>
  </tr>
</template>

<script setup lang="ts">
  import { type MarginBucketDetailAZ } from '@/types/domains/az-types';

  defineProps<{
    label: string;
    data: MarginBucketDetailAZ;
  }>();
</script>
