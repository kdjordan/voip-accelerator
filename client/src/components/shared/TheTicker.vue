<template>
  <div class="bg-surface border-b border-line overflow-hidden whitespace-nowrap">
    <!-- Empty / quiet state -->
    <div v-if="!items.length" class="flex items-center">
      <span class="px-4 py-[7px] font-display text-[11px] text-fg-faint tracking-[0.04em]">
        SESSION&nbsp;·&nbsp;LOCAL&nbsp;·&nbsp;EPHEMERAL
      </span>
    </div>

    <!-- Landing variant — auto-scroll crawl over a tripled list -->
    <div
      v-else-if="variant === 'landing'"
      class="ticker-crawl inline-flex items-center py-2 font-display text-[11px] tracking-[0.03em]"
    >
      <span
        v-for="(t, i) in trebled"
        :key="i"
        class="inline-flex gap-2 px-[18px] border-r border-line"
      >
        <span class="text-fg-faint">{{ t.sym }}</span>
        <span class="font-semibold" :class="dirClass(t.dir)">{{ t.value }}</span>
      </span>
    </div>

    <!-- Portal variant — static row with optional LIVE chip -->
    <div v-else class="flex items-center">
      <span
        v-if="live"
        class="px-3.5 py-[7px] font-display text-[10px] uppercase tracking-[0.16em] text-accent bg-accent-soft border-r border-line"
      >
        ● LIVE
      </span>
      <span
        v-for="(t, i) in items"
        :key="i"
        class="inline-flex gap-2 px-4 py-[7px] border-r border-line font-display text-[11px]"
      >
        <span class="text-fg-faint">{{ t.sym }}</span>
        <span class="font-semibold" :class="dirClass(t.dir)">{{ t.value }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  export interface TickerItem {
    sym: string;
    value: string;
    dir?: 'up' | 'down' | 'warn' | 'accent' | 'neutral';
  }

  const props = withDefaults(
    defineProps<{
      /** Entries to display. Empty → quiet "SESSION · LOCAL · EPHEMERAL" state. */
      items: TickerItem[];
      /** `portal` (static row, default) or `landing` (auto-scroll crawl). */
      variant?: 'landing' | 'portal';
      /** Portal only — show a leading ● LIVE chip. */
      live?: boolean;
    }>(),
    { variant: 'portal', live: false }
  );

  // Landing crawl translates 0 → -33.333%, so the list is tripled for a seamless loop.
  const trebled = computed(() => [...props.items, ...props.items, ...props.items]);

  function dirClass(dir?: TickerItem['dir']): string {
    switch (dir) {
      case 'up':
        return 'text-up';
      case 'down':
        return 'text-down';
      case 'warn':
        return 'text-warn';
      case 'accent':
        return 'text-accent';
      default:
        return 'text-fg';
    }
  }
</script>

<style scoped>
  .ticker-crawl {
    animation: ticker-slide 60s linear infinite;
  }
  @keyframes ticker-slide {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-33.333%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ticker-crawl {
      animation: none;
    }
  }
</style>
