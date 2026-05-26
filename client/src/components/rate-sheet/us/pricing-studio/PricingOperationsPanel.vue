<template>
  <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-secondary uppercase tracking-wider text-zinc-400">Recent Operations</h3>
        <span
          v-if="operations.length"
          class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/10 text-[10px] font-secondary text-zinc-300"
        >
          {{ operations.length }}
        </span>
      </div>
      <button
        v-if="operations.length"
        @click="psStore.clearOperations()"
        class="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        Clear All
      </button>
    </div>

    <!-- Operations list (newest first) -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[120px]">
      <p v-if="!operations.length" class="text-sm text-zinc-500 text-center py-8">
        No operations yet. Apply an adjustment to start sculpting.
      </p>

      <div
        v-for="op in reversed"
        :key="op.id"
        class="rounded-lg border bg-white/[0.02] p-3"
        :class="isLock(op) ? 'border-violet-400/20' : 'border-white/[0.06]'"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="badgeClass(op)"
            >
              {{ kindLabel(op) }}
            </span>
            <span class="text-sm font-secondary text-white truncate">{{ valueLabel(op) }}</span>
            <span v-if="op.target" class="text-xs text-zinc-400 truncate">{{ targetLabel(op.target) }}</span>
          </div>
        </div>

        <p class="mt-1.5 text-xs text-zinc-500 truncate">Applied to: {{ op.scopeLabel }}</p>

        <div class="mt-2 flex items-end justify-between">
          <div class="text-[11px] text-zinc-500">
            <span class="font-secondary text-zinc-300">{{ fmtInt(op.recordsAffected) }}</span>
            {{ isLock(op) ? 'row locked' : 'rows affected' }}
            <span class="mx-1.5 text-zinc-700">·</span>
            {{ fmtTime(op.timestamp) }}
          </div>
          <span
            v-if="!isLock(op)"
            class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-violet-300 bg-violet-400/10 ring-1 ring-violet-400/30"
          >
            <LockClosedIcon class="h-2.5 w-2.5" /> Frozen
          </span>
        </div>
      </div>
    </div>

    <!-- Footer note -->
    <div class="px-4 py-2.5 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] text-zinc-600">
      <CircleStackIcon class="h-3 w-3" /> Operations are stored locally in your browser.
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { LockClosedIcon, CircleStackIcon } from '@heroicons/vue/24/outline';
  import { usePricingStudioStore } from '@/stores/pricing-studio-store';
  import type { PricingOperation } from '@/utils/pricing-engine';
  import type { TargetRateType } from '@/types/domains/rate-sheet-types';

  const psStore = usePricingStudioStore();
  const operations = computed(() => psStore.operations);
  const reversed = computed(() => [...psStore.operations].reverse());

  function isLock(op: PricingOperation): boolean {
    return op.kind === 'lock' || op.kind === 'unlock';
  }

  function kindLabel(op: PricingOperation): string {
    const map: Record<string, string> = {
      markup: 'Markup',
      markdown: 'Markdown',
      set: 'Set',
      lock: 'Locked',
      unlock: 'Unlocked',
    };
    return map[op.kind] ?? op.kind;
  }

  function badgeClass(op: PricingOperation): string {
    if (op.kind === 'lock') return 'text-violet-300 bg-violet-400/10';
    if (op.kind === 'unlock') return 'text-zinc-300 bg-white/10';
    return 'text-emerald-300 bg-emerald-400/10';
  }

  function valueLabel(op: PricingOperation): string {
    if (op.kind === 'lock' || op.kind === 'unlock') return op.scopeLabel.replace('NPANXX ', '');
    if (op.value == null) return '';
    if (op.kind === 'set') return `$${op.value}`;
    const sign = op.kind === 'markup' ? '+' : '−';
    return `${sign}${op.value}${op.valueType === 'percentage' ? '%' : ''}`;
  }

  function targetLabel(target: TargetRateType): string {
    const map: Record<TargetRateType, string> = {
      all: 'All Rates',
      inter: 'Interstate',
      intra: 'Intrastate',
      indeterm: 'Indeterminate',
    };
    return map[target];
  }

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
