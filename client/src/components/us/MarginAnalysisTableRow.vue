<template>
  <tr class="border-b border-gray-700 last:border-b-0">
    <td class="py-2 px-2">{{ label }}</td>
    <td class="py-2 px-2 text-right text-foreground">{{ data.matchInter }}</td>
    <td class="py-2 px-2 text-right text-foreground">{{ data.percentInter.toFixed(1) }}%</td>
    <td class="py-2 px-2 text-right text-foreground">{{ data.matchIntra }}</td>
    <td class="py-2 px-2 text-right text-foreground">{{ data.percentIntra.toFixed(1) }}%</td>
  </tr>
</template>

<script setup lang="ts">
  import { type MarginBucketDetail } from '@/types/domains/us-types';

  defineProps<{
    label: string;
    data: MarginBucketDetail;
  }>();
</script>
