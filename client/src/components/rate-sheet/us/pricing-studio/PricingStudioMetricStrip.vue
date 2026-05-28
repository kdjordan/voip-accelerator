<template>
  <!-- Readiness strip: five KPI tiles summarising the current sculpting session. -->
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
    <!-- Total Records -->
    <div class="border border-line bg-surface p-4">
      <div class="flex items-start justify-between">
        <span class="font-display text-[10px] uppercase tracking-wider text-fg-faint">Total Records</span>
        <CircleStackIcon class="h-4 w-4 text-fg-faint" aria-hidden="true" />
      </div>
      <p class="mt-2 font-secondary text-2xl font-semibold text-fg">{{ fmtInt(stats.totalRecords) }}</p>
      <p class="mt-1 text-xs text-fg-faint">NPANXX rows</p>
    </div>

    <!-- Modified Rows -->
    <div class="border border-line bg-surface p-4">
      <div class="flex items-start justify-between">
        <span class="font-display text-[10px] uppercase tracking-wider text-fg-faint">Modified Rows</span>
        <ChartBarIcon class="h-4 w-4 text-fg-faint" aria-hidden="true" />
      </div>
      <p class="mt-2 font-secondary text-2xl font-semibold text-fg">{{ fmtInt(stats.modifiedRows) }}</p>
      <p class="mt-1 text-xs text-fg-faint">{{ stats.modifiedPct }}% of total</p>
    </div>

    <!-- Frozen Scopes (info/blue = protected) -->
    <div class="border border-line bg-surface p-4">
      <div class="flex items-start justify-between">
        <span class="font-display text-[10px] uppercase tracking-wider text-fg-faint">Frozen Scopes</span>
        <LockClosedIcon class="h-4 w-4 text-info" aria-hidden="true" />
      </div>
      <p class="mt-2 font-secondary text-2xl font-semibold text-fg">{{ fmtInt(stats.frozenScopes) }}</p>
      <p class="mt-1 text-xs text-fg-faint">protected scopes</p>
    </div>

    <!-- Average Rate (Interstate) -->
    <div class="border border-line bg-surface p-4">
      <div class="flex items-start justify-between">
        <span class="font-display text-[10px] uppercase tracking-wider text-fg-faint">Avg Rate (Inter)</span>
        <CurrencyDollarIcon class="h-4 w-4 text-fg-faint" aria-hidden="true" />
      </div>
      <p class="mt-2 font-secondary text-2xl font-semibold text-fg">{{ fmtRate(stats.avgInterRate) }}</p>
      <p class="mt-1 text-xs text-fg-faint">across all rows</p>
    </div>

    <!-- Export Ready -->
    <div class="border border-line bg-surface p-4">
      <div class="flex items-start justify-between">
        <span class="font-display text-[10px] uppercase tracking-wider text-fg-faint">Export Ready</span>
        <CheckCircleIcon
          class="h-4 w-4"
          :class="stats.exportReady ? 'text-warn' : 'text-fg-faint'"
          aria-hidden="true"
        />
      </div>
      <p
        class="mt-2 font-secondary text-2xl font-semibold"
        :class="stats.exportReady ? 'text-warn' : 'text-fg-faint'"
      >
        {{ stats.exportReady ? 'Yes' : 'No' }}
      </p>
      <p class="mt-1 text-xs text-fg-faint">
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
