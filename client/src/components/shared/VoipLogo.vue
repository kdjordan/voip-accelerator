<template>
  <span class="inline-flex items-center gap-3" aria-label="VoIP Accelerator" role="img">
    <span class="brand-chip">
      <BoltIcon class="h-4 w-4 text-white" aria-hidden="true" />
    </span>
    <span class="font-display font-semibold uppercase tracking-[0.04em] text-sm text-fg">
      VoIP Accelerator
    </span>
  </span>
</template>

<script setup lang="ts">
  import { BoltIcon } from '@heroicons/vue/24/solid';
  // No props for now, but can be extended for size/color
</script>
