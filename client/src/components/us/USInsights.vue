<template>
  <div v-if="s" class="space-y-4">
    <!-- ===== KPI row ===== -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <!-- Coverage Match -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div class="flex items-center gap-1.5 text-sm text-zinc-400">
          Coverage Match <InformationCircleIcon class="h-3.5 w-3.5 text-zinc-600" />
        </div>
        <div class="mt-2 flex items-center justify-between gap-3">
          <div>
            <div class="text-3xl font-bold text-emerald-400 tabular-nums">
              {{ s.coverageMatchPct.toFixed(2) }}%
            </div>
            <p class="mt-1 text-xs text-zinc-500">
              {{ s.matchedCodes.toLocaleString() }} of {{ s.totalFile1Codes.toLocaleString() }} codes
            </p>
          </div>
          <div class="relative h-[68px] w-[68px] flex-shrink-0">
            <Doughnut :data="coverageDonut" :options="donutOptions" />
          </div>
        </div>
      </div>

      <!-- Comparable Codes -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div class="flex items-center gap-1.5 text-sm text-zinc-400">
          Comparable Codes <InformationCircleIcon class="h-3.5 w-3.5 text-zinc-600" />
        </div>
        <div class="mt-2 flex items-start justify-between">
          <div>
            <div class="text-3xl font-bold text-white tabular-nums">
              {{ s.matchedCodes.toLocaleString() }}
            </div>
            <p class="mt-1 text-xs text-zinc-500">{{ s.coverageMatchPct.toFixed(2) }}% of File A</p>
          </div>
          <DocumentTextIcon class="h-5 w-5 text-emerald-400/70" />
        </div>
      </div>

      <!-- Avg Margin Delta (Inter) -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div class="flex items-center gap-1.5 text-sm text-zinc-400">
          Average Margin Delta (Inter) <InformationCircleIcon class="h-3.5 w-3.5 text-zinc-600" />
        </div>
        <div class="mt-2 text-3xl font-bold text-emerald-400 tabular-nums">
          {{ fmtRate(s.marginDeltaInter) }}
        </div>
        <p class="mt-1 text-xs text-zinc-500">File A − File B</p>
      </div>

      <!-- Avg Margin Delta (Intra) -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div class="flex items-center gap-1.5 text-sm text-zinc-400">
          Average Margin Delta (Intra) <InformationCircleIcon class="h-3.5 w-3.5 text-zinc-600" />
        </div>
        <div class="mt-2 text-3xl font-bold text-violet-400 tabular-nums">
          {{ fmtRate(s.marginDeltaIntra) }}
        </div>
        <p class="mt-1 text-xs text-zinc-500">
          File A: {{ fmtRate(s.avgFile1Intra) }} &nbsp;|&nbsp; File B: {{ fmtRate(s.avgFile2Intra) }}
        </p>
      </div>

      <!-- Total Opportunities -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div class="flex items-center gap-1.5 text-sm text-zinc-400">
          Total Opportunities <InformationCircleIcon class="h-3.5 w-3.5 text-zinc-600" />
        </div>
        <div class="mt-2 flex items-start justify-between">
          <div>
            <div class="text-3xl font-bold text-white tabular-nums">
              {{ s.totalOpportunities.toLocaleString() }}
            </div>
            <p class="mt-1 text-xs text-zinc-500">
              Top Sell: {{ s.sellToCount.toLocaleString() }} &nbsp;|&nbsp; Top Buy:
              {{ s.buyFromCount.toLocaleString() }}
            </p>
          </div>
          <StarIcon class="h-5 w-5 text-zinc-600" />
        </div>
      </div>
    </div>

    <!-- ===== Opportunity tables (side by side) ===== -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Top Sell To -->
        <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-base font-semibold text-white">Top Sell To Opportunities</h3>
            <p class="text-xs text-zinc-500">File A rates lower than File B</p>
          </div>
          <button
            class="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            @click="viewAll"
          >
            View all ({{ s.sellToCount.toLocaleString() }}) <ArrowRightIcon class="h-3 w-3" />
          </button>
        </div>
        <OpportunityTable :rows="s.topSell" accent="emerald" />
      </div>

      <!-- Top Buy From -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-base font-semibold text-white">Top Buy From Opportunities</h3>
            <p class="text-xs text-zinc-500">File A rates higher than File B</p>
          </div>
          <button
            class="inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
            @click="viewAll"
          >
            View all ({{ s.buyFromCount.toLocaleString() }}) <ArrowRightIcon class="h-3 w-3" />
          </button>
        </div>
        <OpportunityTable :rows="s.topBuy" accent="violet" />
      </div>
    </div>

    <!-- ===== Match Distribution (full width) ===== -->
    <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <h3 class="text-base font-semibold text-white">Match Distribution (by Margin)</h3>
      <div class="mt-3 flex items-center gap-4 text-xs text-zinc-400">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-emerald-400"></span> Sell To (A &lt; B)
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-violet-400"></span> Buy From (A &gt; B)
        </span>
      </div>
      <div class="relative mt-4 h-[230px]">
        <Bar :data="distributionBars" :options="barOptions" />
      </div>
      <p class="mt-3 text-[11px] text-zinc-600">
        Margin is calculated as: | File B − File A | / File A
      </p>
    </div>

    <!-- ===== NPA Coverage (per deck, collapsible) ===== -->
    <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <button
        type="button"
        class="flex w-full items-center justify-between text-left"
        @click="showNpaCoverage = !showNpaCoverage"
      >
        <div>
          <h3 class="text-base font-semibold text-white">NPA Coverage</h3>
          <p class="text-xs text-zinc-500">Which NPAs each rate deck contains</p>
        </div>
        <ChevronDownIcon
          class="h-5 w-5 text-zinc-400 transition-transform"
          :class="{ 'rotate-180': showNpaCoverage }"
        />
      </button>
      <div v-if="showNpaCoverage" class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- File A -->
        <div>
          <div class="mb-2 flex items-baseline gap-2">
            <span class="text-sm font-semibold text-white">File A</span>
            <span class="text-xs text-emerald-400 truncate" :title="fileNameA">{{ fileNameA }}</span>
          </div>
          <USCodeSummary component-id="us1" npa-coverage-only />
        </div>
        <!-- File B -->
        <div>
          <div class="mb-2 flex items-baseline gap-2">
            <span class="text-sm font-semibold text-white">File B</span>
            <span class="text-xs text-violet-400 truncate" :title="fileNameB">{{ fileNameB }}</span>
          </div>
          <USCodeSummary component-id="us2" npa-coverage-only />
        </div>
      </div>
    </div>
  </div>

  <!-- Fallback -->
  <div v-else class="text-center text-zinc-500 p-10">
    Insights are being generated or unavailable. Please run an analysis first.
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { Doughnut, Bar } from 'vue-chartjs';
  import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    BarElement,
    CategoryScale,
    LinearScale,
  } from 'chart.js';
  import {
    InformationCircleIcon,
    DocumentTextIcon,
    StarIcon,
    ArrowRightIcon,
    ChevronDownIcon,
  } from '@heroicons/vue/24/outline';
  import { useUsStore } from '@/stores/us-store';
  import { ReportTypes } from '@/types/app-types';
  import OpportunityTable from '@/components/us/USOpportunityTable.vue';
  import USCodeSummary from '@/components/us/USCodeSummary.vue';

  ChartJS.register(ArcElement, Tooltip, BarElement, CategoryScale, LinearScale);

  const usStore = useUsStore();
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

  // --- Coverage donut ---
  const coverageDonut = computed(() => {
    const pct = s.value?.coverageMatchPct ?? 0;
    return {
      labels: ['Matched', 'Unmatched'],
      datasets: [
        {
          data: [pct, Math.max(0, 100 - pct)],
          backgroundColor: ['#34d399', 'rgba(255,255,255,0.06)'],
          borderWidth: 0,
        },
      ],
    };
  });

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  // --- Distribution grouped bars ---
  const distributionBars = computed(() => {
    const dist = s.value?.distribution ?? [];
    return {
      labels: dist.map((b) => b.label),
      datasets: [
        {
          label: 'Sell To (A < B)',
          data: dist.map((b) => b.sell),
          backgroundColor: '#34d399',
          borderRadius: 2,
          categoryPercentage: 0.7,
          barPercentage: 0.9,
        },
        {
          label: 'Buy From (A > B)',
          data: dist.map((b) => b.buy),
          backgroundColor: '#a78bfa',
          borderRadius: 2,
          categoryPercentage: 0.7,
          barPercentage: 0.9,
        },
      ],
    };
  });

  const gridColor = 'rgba(255,255,255,0.06)';
  const tickColor = 'rgba(161,161,170,0.8)'; // zinc-400-ish

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 9 }, maxRotation: 0, autoSkip: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 10 }, precision: 0 },
      },
    },
  };
</script>
