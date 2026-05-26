<template>
  <!-- Readiness strip: five KPI tiles summarising the current sculpting session. -->
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
    <!-- Total Records -->
    <div class="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div class="flex items-start justify-between">
        <span class="text-[10px] uppercase tracking-wider text-zinc-500">Total Records</span>
        <CircleStackIcon class="h-4 w-4 text-zinc-600" aria-hidden="true" />
      </div>
      <p class="mt-2 text-2xl font-secondary font-semibold text-white">{{ fmtInt(stats.totalRecords) }}</p>
      <p class="mt-1 text-xs text-zinc-500">NPANXX rows</p>
    </div>

    <!-- Modified Rows -->
    <div class="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div class="flex items-start justify-between">
        <span class="text-[10px] uppercase tracking-wider text-zinc-500">Modified Rows</span>
        <ChartBarIcon class="h-4 w-4 text-zinc-600" aria-hidden="true" />
      </div>
      <p class="mt-2 text-2xl font-secondary font-semibold text-white">{{ fmtInt(stats.modifiedRows) }}</p>
      <p class="mt-1 text-xs text-zinc-500">{{ stats.modifiedPct }}% of total</p>
    </div>

    <!-- Frozen Scopes (violet = protected) -->
    <div class="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div class="flex items-start justify-between">
        <span class="text-[10px] uppercase tracking-wider text-zinc-500">Frozen Scopes</span>
        <LockClosedIcon class="h-4 w-4 text-violet-400/80" aria-hidden="true" />
      </div>
      <p class="mt-2 text-2xl font-secondary font-semibold text-white">{{ fmtInt(stats.frozenScopes) }}</p>
      <p class="mt-1 text-xs text-zinc-500">protected scopes</p>
    </div>

    <!-- Average Rate (Interstate) -->
    <div class="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div class="flex items-start justify-between">
        <span class="text-[10px] uppercase tracking-wider text-zinc-500">Avg Rate (Inter)</span>
        <CurrencyDollarIcon class="h-4 w-4 text-zinc-600" aria-hidden="true" />
      </div>
      <p class="mt-2 text-2xl font-secondary font-semibold text-white">{{ fmtRate(stats.avgInterRate) }}</p>
      <p class="mt-1 text-xs text-zinc-500">across all rows</p>
    </div>

    <!-- Export Ready -->
    <div class="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div class="flex items-start justify-between">
        <span class="text-[10px] uppercase tracking-wider text-zinc-500">Export Ready</span>
        <CheckCircleIcon
          class="h-4 w-4"
          :class="stats.exportReady ? 'text-emerald-400' : 'text-zinc-600'"
          aria-hidden="true"
        />
      </div>
      <p
        class="mt-2 text-2xl font-secondary font-semibold"
        :class="stats.exportReady ? 'text-emerald-400' : 'text-zinc-400'"
      >
        {{ stats.exportReady ? 'Yes' : 'No' }}
      </p>
      <p class="mt-1 text-xs text-zinc-500">
        {{ stats.exportReady ? 'ready to export' : 'upload a deck' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    CircleStackIcon,
    ChartBarIcon,
    LockClosedIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
  } from '@heroicons/vue/24/outline';
  import type { ReadinessStats } from '@/utils/pricing-engine';

  defineProps<{ stats: ReadinessStats }>();

  function fmtInt(n: number): string {
    return n.toLocaleString('en-US');
  }

  function fmtRate(n: number | null): string {
    if (n === null || Number.isNaN(n)) return '—';
    return `$${n.toFixed(6)}`;
  }
</script>
