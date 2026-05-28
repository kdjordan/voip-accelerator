<template>
  <div class="w-full">
    <!-- Top ticker strip — quiet "SESSION · LOCAL · EPHEMERAL" by default; live KPIs where provided. -->
    <TheTicker
      :items="tickerItems"
      variant="portal"
      :live="tickerLive ?? tickerItems.length > 0"
      class="mb-6"
    />

    <!-- Editorial running head: SECTION N — TITLE ———— right meta -->
    <RunningHead :left="section" :right="right" class="px-1 mb-3" />

    <!-- Title row -->
    <div class="relative px-1 mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1
            class="flex items-center gap-2 font-display text-3xl md:text-4xl font-semibold leading-none tracking-[-0.035em] text-fg"
          >
            <slot name="title-icon" />
            {{ title }}
          </h1>
          <slot name="title-suffix" />
        </div>
        <p v-if="subtitle" class="mt-2 font-sans text-sm text-fg-dim max-w-2xl">{{ subtitle }}</p>
      </div>

      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import TheTicker, { type TickerItem } from '@/components/shared/TheTicker.vue';
  import RunningHead from '@/components/shared/RunningHead.vue';

  withDefaults(
    defineProps<{
      /** Eyebrow on the running head, e.g. "Section II — US NPANXX". */
      section: string;
      /** Page title (mono h1). */
      title: string;
      /** Right-hand meta on the running head, e.g. "File A vs File B". */
      right?: string;
      /** Sub-line under the title. */
      subtitle?: string;
      /** Portal ticker entries. Empty → quiet SESSION · LOCAL · EPHEMERAL state. */
      tickerItems?: TickerItem[];
      /** Force the ● LIVE chip; defaults to true when tickerItems is non-empty. */
      tickerLive?: boolean;
    }>(),
    { tickerItems: () => [] }
  );
</script>
