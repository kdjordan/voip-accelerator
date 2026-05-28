<template>
  <div class="border border-line bg-surface px-5 py-[18px]">
    <div class="font-display text-[10px] uppercase tracking-[0.16em] text-fg-faint">
      {{ label }}
    </div>
    <div
      class="mt-2 font-display font-semibold text-[30px] leading-none tracking-[-0.025em] tabular-nums"
      :class="toneClass"
    >
      {{ value }}
    </div>
    <div v-if="sub" class="mt-1.5 font-display text-[10.5px] text-fg-faint">
      {{ sub }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  type Tone = 'text' | 'accent' | 'warn' | 'down' | 'up';

  const props = withDefaults(
    defineProps<{
      /** Uppercase label above the value. */
      label: string;
      /** The KPI value (already formatted). */
      value: string;
      /** Optional sub-line beneath the value. */
      sub?: string;
      /** Color of the value. `text` → neutral fg; others map to the matching token. */
      tone?: Tone;
    }>(),
    { tone: 'text' }
  );

  const toneClass = computed(() => {
    const map: Record<Tone, string> = {
      text: 'text-fg',
      accent: 'text-accent',
      warn: 'text-warn',
      down: 'text-down',
      up: 'text-up',
    };
    return map[props.tone];
  });
</script>
