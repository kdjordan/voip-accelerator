<template>
  <div
    class="border bg-surface p-3"
    :class="isLock ? 'border-info' : 'border-line'"
  >
    <div class="flex items-center gap-2 min-w-0">
      <span
        class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        :class="badgeClass"
      >
        {{ kindLabel }}
      </span>
      <span class="text-sm font-secondary text-fg truncate">{{ valueLabel }}</span>
      <span v-if="op.target" class="text-xs text-fg-faint truncate">{{ targetLabel }}</span>
    </div>

    <p class="mt-1.5 text-xs text-fg-faint truncate">Applied to: {{ op.scopeLabel }}</p>

    <div class="mt-2 flex items-end justify-between">
      <div class="text-[11px] text-fg-faint">
        <span class="font-secondary text-fg-dim">{{ fmtInt(op.recordsAffected) }}</span>
        {{ isLock ? 'row locked' : 'rows affected' }}
        <span class="mx-1.5 text-fg-mute">·</span>
        {{ fmtTime(op.timestamp) }}
      </div>
      <span
        v-if="!isLock"
        class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-info bg-info-soft ring-1 ring-info"
      >
        <LockClosedIcon class="h-2.5 w-2.5" /> Frozen
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { LockClosedIcon } from '@heroicons/vue/24/outline';
  import type { PricingOperation } from '@/utils/pricing-engine';
  import type { TargetRateType } from '@/types/domains/rate-sheet-types';

  const props = defineProps<{ op: PricingOperation }>();

  const isLock = computed(() => props.op.kind === 'lock' || props.op.kind === 'unlock');

  const kindLabel = computed(() => {
    const map: Record<string, string> = {
      markup: 'Markup',
      markdown: 'Markdown',
      set: 'Set',
      lock: 'Locked',
      unlock: 'Unlocked',
    };
    return map[props.op.kind] ?? props.op.kind;
  });

  const badgeClass = computed(() => {
    switch (props.op.kind) {
      case 'lock':
        return 'text-info bg-info-soft';
      case 'unlock':
        return 'text-fg-dim bg-row';
      case 'markup':
        return 'text-warn bg-warn-soft';
      case 'markdown':
        return 'text-accent bg-accent-soft';
      default:
        return 'text-fg bg-row'; // set
    }
  });

  const valueLabel = computed(() => {
    const op = props.op;
    if (op.kind === 'lock' || op.kind === 'unlock') return op.scopeLabel.replace('NPANXX ', '');
    if (op.value == null) return '';
    if (op.kind === 'set') return `$${op.value}`;
    const sign = op.kind === 'markup' ? '+' : '−';
    return `${sign}${op.value}${op.valueType === 'percentage' ? '%' : ''}`;
  });

  const targetLabel = computed(() => {
    if (!props.op.target) return '';
    const map: Record<TargetRateType, string> = {
      all: 'All Rates',
      inter: 'Interstate',
      intra: 'Intrastate',
      indeterm: 'Indeterminate',
    };
    return map[props.op.target];
  });

  function fmtInt(n: number): string {
    return n.toLocaleString('en-US');
  }
  function fmtTime(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
</script>
