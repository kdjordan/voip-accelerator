<template>
  <tr class="border-b border-white/[0.06] last:border-b-0">
    <td class="py-2 px-2">{{ label }}</td>
    <td class="py-2 px-2 text-right font-secondary text-zinc-300">{{ data.matchInter }}</td>
    <td class="py-2 px-2 text-right font-secondary text-zinc-300">{{ data.percentInter.toFixed(1) }}%</td>
    <td class="py-2 px-2 text-right font-secondary text-zinc-300">{{ data.matchIntra }}</td>
    <td class="py-2 px-2 text-right font-secondary text-zinc-300">{{ data.percentIntra.toFixed(1) }}%</td>
  </tr>
</template>

<script setup lang="ts">
  import { type MarginBucketDetail } from '@/types/domains/us-types';

  defineProps<{
    label: string;
    data: MarginBucketDetail;
  }>();
</script>
