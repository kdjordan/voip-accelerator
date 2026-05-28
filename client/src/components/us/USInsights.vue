<template>
  <div v-if="s" class="space-y-4">
    <!-- ===== KPI row (connected slab grid) ===== -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-px border border-line bg-line"
    >
      <div v-for="k in kpis" :key="k.label" class="bg-surface px-5 py-[18px]">
        <div class="font-display text-[10px] uppercase tracking-[0.16em] text-fg-faint">
          {{ k.label }}
        </div>
        <div
          class="mt-2 font-display font-semibold text-[30px] leading-none tracking-[-0.025em] tabular-nums"
          :class="toneClass(k.tone)"
        >
          {{ k.value }}
        </div>
        <div class="mt-1.5 font-display text-[10.5px] text-fg-faint">{{ k.sub }}</div>
      </div>
    </div>

    <!-- ===== Opportunity tables (side by side) ===== -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Top Sell To -->
      <div class="border border-line bg-surface p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-display text-[10px] uppercase tracking-[0.16em] text-warn">
              Sell side · A &lt; B
            </div>
            <h3 class="mt-1 font-display text-base font-semibold tracking-[-0.015em] text-fg">
              Top Sell To Opportunities
            </h3>
            <p class="mt-0.5 font-sans text-xs text-fg-faint">File A rates lower than File B</p>
          </div>
          <button
            class="inline-flex items-center gap-1 font-display text-[11px] uppercase tracking-[0.04em] text-warn transition-opacity hover:opacity-80 whitespace-nowrap"
            @click="viewAll"
          >
            View all ({{ s.sellToCount.toLocaleString() }}) <ArrowRightIcon class="h-3 w-3" />
          </button>
        </div>
        <OpportunityTable :rows="s.topSell" accent="warn" />
      </div>

      <!-- Top Buy From -->
      <div class="border border-line bg-surface p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-display text-[10px] uppercase tracking-[0.16em] text-accent">
              Buy side · A &gt; B
            </div>
            <h3 class="mt-1 font-display text-base font-semibold tracking-[-0.015em] text-fg">
              Top Buy From Opportunities
            </h3>
            <p class="mt-0.5 font-sans text-xs text-fg-faint">File A rates higher than File B</p>
          </div>
          <button
            class="inline-flex items-center gap-1 font-display text-[11px] uppercase tracking-[0.04em] text-accent transition-opacity hover:opacity-80 whitespace-nowrap"
            @click="viewAll"
          >
            View all ({{ s.buyFromCount.toLocaleString() }}) <ArrowRightIcon class="h-3 w-3" />
          </button>
        </div>
        <OpportunityTable :rows="s.topBuy" accent="accent" />
      </div>
    </div>

    <!-- ===== Match Distribution (full width) ===== -->
    <div class="border border-line bg-surface p-5">
      <div class="flex items-baseline justify-between gap-4">
        <div>
          <div class="font-display text-[10px] uppercase tracking-[0.16em] text-accent">Fig. 2</div>
          <h3 class="mt-1 font-display text-base font-semibold tracking-[-0.015em] text-fg">
            Match Distribution (by Margin)
          </h3>
        </div>
        <div class="flex items-center gap-4 font-display text-[11px] text-fg-dim">
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 bg-warn"></span> Sell To (A &lt; B)
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 bg-accent"></span> Buy From (A &gt; B)
          </span>
        </div>
      </div>
      <div class="relative mt-4 h-[230px]">
        <Bar :data="distributionBars" :options="barOptions" />
      </div>
      <p class="mt-3 font-display text-[10.5px] text-fg-mute">
        Margin = | File B − File A | / File A
      </p>
    </div>

    <!-- ===== NPA Coverage (per deck, collapsible) ===== -->
    <div class="border border-line bg-surface p-5">
      <button
        type="button"
        class="flex w-full items-center justify-between text-left"
        @click="showNpaCoverage = !showNpaCoverage"
      >
        <div>
          <h3 class="font-display text-base font-semibold tracking-[-0.015em] text-fg">
            NPA Coverage
          </h3>
          <p class="mt-0.5 font-sans text-xs text-fg-faint">Which NPAs each rate deck contains</p>
        </div>
        <ChevronDownIcon
          class="h-5 w-5 text-fg-faint transition-transform"
          :class="{ 'rotate-180': showNpaCoverage }"
        />
      </button>
      <div v-if="showNpaCoverage" class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- File A -->
        <div>
          <div class="mb-2 flex items-baseline gap-2">
            <span class="font-display text-sm font-semibold text-fg">File A</span>
            <span class="font-display text-xs text-warn truncate" :title="fileNameA">{{
              fileNameA
            }}</span>
          </div>
          <USCodeSummary component-id="us1" npa-coverage-only />
        </div>
        <!-- File B -->
        <div>
          <div class="mb-2 flex items-baseline gap-2">
            <span class="font-display text-sm font-semibold text-fg">File B</span>
            <span class="font-display text-xs text-accent truncate" :title="fileNameB">{{
              fileNameB
            }}</span>
          </div>
          <USCodeSummary component-id="us2" npa-coverage-only />
        </div>
      </div>
    </div>
  </div>

  <!-- Fallback -->
  <div v-else class="text-center font-sans text-fg-faint p-10">
    Insights are being generated or unavailable. Please run an analysis first.
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { Bar } from 'vue-chartjs';
  import {
    Chart as ChartJS,
    Tooltip,
    BarElement,
    CategoryScale,
    LinearScale,
  } from 'chart.js';
  import { ArrowRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
  import { useUsStore } from '@/stores/us-store';
  import { ReportTypes } from '@/types/app-types';
  import { useTheme } from '@/composables/useTheme';
  import OpportunityTable from '@/components/us/USOpportunityTable.vue';
  import USCodeSummary from '@/components/us/USCodeSummary.vue';

  ChartJS.register(Tooltip, BarElement, CategoryScale, LinearScale);

  const usStore = useUsStore();
  const { resolvedTheme } = useTheme();
  const s = computed(() => usStore.getInsightsSummary);

  // NPA Coverage explorer (per deck) — collapsed by default.
  const showNpaCoverage = ref(false);
  const fileNameA = computed(() => usStore.getFileNames[0]?.replace(/\.csv$/i, '') ?? 'File A');
  const fileNameB = computed(() => usStore.getFileNames[1]?.replace(/\.csv$/i, '') ?? 'File B');

  function fmtRate(v: number): string {
    return `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(4)}`;
  }

  function viewAll() {
    // Drill into the granular grid (Explorer tab)
    usStore.setActiveReportType(ReportTypes.PRICING);
  }

  // --- KPI tiles (portal palette: warn=positive/Sell, accent=negative/Buy) ---
  type Tone = 'text' | 'warn' | 'accent' | 'up' | 'down';
  const kpis = computed(() => {
    const v = s.value;
    if (!v) return [] as { label: string; value: string; sub: string; tone: Tone }[];
    return [
      {
        label: 'Coverage Match',
        value: `${v.coverageMatchPct.toFixed(2)}%`,
        sub: `${v.matchedCodes.toLocaleString()} of ${v.totalFile1Codes.toLocaleString()} codes`,
        tone: 'warn' as Tone,
      },
      {
        label: 'Comparable Codes',
        value: v.matchedCodes.toLocaleString(),
        sub: `${v.coverageMatchPct.toFixed(2)}% of File A`,
        tone: 'text' as Tone,
      },
      {
        label: 'Avg Margin Δ (Inter)',
        value: fmtRate(v.marginDeltaInter),
        sub: 'File A − File B',
        tone: (v.marginDeltaInter >= 0 ? 'warn' : 'accent') as Tone,
      },
      {
        label: 'Avg Margin Δ (Intra)',
        value: fmtRate(v.marginDeltaIntra),
        sub: `A: ${fmtRate(v.avgFile1Intra)} · B: ${fmtRate(v.avgFile2Intra)}`,
        tone: (v.marginDeltaIntra >= 0 ? 'warn' : 'accent') as Tone,
      },
      {
        label: 'Total Opportunities',
        value: v.totalOpportunities.toLocaleString(),
        sub: `Sell ${v.sellToCount.toLocaleString()} · Buy ${v.buyFromCount.toLocaleString()}`,
        tone: 'accent' as Tone,
      },
    ];
  });

  function toneClass(tone: Tone): string {
    const map: Record<Tone, string> = {
      text: 'text-fg',
      warn: 'text-warn',
      accent: 'text-accent',
      up: 'text-up',
      down: 'text-down',
    };
    return map[tone];
  }

  // --- Theme-aware chart colors (read CSS vars; recompute on theme flip) ---
  function cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  const chartColors = computed(() => {
    // Reference resolvedTheme so the colors recompute when the theme changes.
    void resolvedTheme.value;
    return {
      sell: cssVar('--warn', '#fbbf24'),
      buy: cssVar('--accent', '#ef3434'),
      grid: cssVar('--border', 'rgba(255,255,255,0.06)'),
      tick: cssVar('--text-faint', 'rgba(161,161,170,0.8)'),
    };
  });

  // --- Distribution grouped bars ---
  const distributionBars = computed(() => {
    const dist = s.value?.distribution ?? [];
    const c = chartColors.value;
    return {
      labels: dist.map((b) => b.label),
      datasets: [
        {
          label: 'Sell To (A < B)',
          data: dist.map((b) => b.sell),
          backgroundColor: c.sell,
          borderRadius: 0,
          categoryPercentage: 0.7,
          barPercentage: 0.9,
        },
        {
          label: 'Buy From (A > B)',
          data: dist.map((b) => b.buy),
          backgroundColor: c.buy,
          borderRadius: 0,
          categoryPercentage: 0.7,
          barPercentage: 0.9,
        },
      ],
    };
  });

  const barOptions = computed(() => {
    const c = chartColors.value;
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: c.tick, font: { size: 9 }, maxRotation: 0, autoSkip: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: c.grid },
          ticks: { color: c.tick, font: { size: 10 }, precision: 0 },
        },
      },
    };
  });
</script>
