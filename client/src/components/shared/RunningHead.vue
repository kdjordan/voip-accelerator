<template>
  <div class="flex items-center gap-3.5">
    <span
      class="font-display text-[11px] uppercase tracking-[0.20em] whitespace-nowrap"
      :class="leftAccent ? 'text-accent' : 'text-fg-faint'"
    >
      {{ left }}
    </span>
    <span class="flex-1 h-px" :style="ruleStyle" />
    <span
      v-if="right || $slots.right"
      class="font-display text-[11px] uppercase tracking-[0.12em] text-fg-faint whitespace-nowrap"
    >
      <slot name="right">{{ right }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{
      /** Eyebrow text on the left. */
      left: string;
      /** Optional meta text on the right (or use the `right` slot for rich meta). */
      right?: string;
      /** Render the left eyebrow in accent red (default) vs muted. */
      leftAccent?: boolean;
    }>(),
    { leftAccent: true }
  );

  const ruleStyle = { background: 'var(--rule)', opacity: 'var(--rule-opacity)' };
</script>
