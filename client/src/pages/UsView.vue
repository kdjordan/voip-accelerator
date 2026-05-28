<template>
  <!-- Main Page Content -->
  <div class="text-fg pt-2 w-full">
    <!-- Portal ticker — live session KPIs (quiet "ephemeral" state before a comparison exists) -->
    <TheTicker :items="tickerItems" variant="portal" :live="tickerItems.length > 0" class="mb-6" />

    <!-- Running head -->
    <RunningHead left="Section II — US NPANXX" right="File A vs File B" class="px-1 mb-3" />

    <!-- Header -->
    <div class="relative px-1 mb-6">
      <h1 class="font-display text-3xl md:text-4xl font-semibold tracking-[-0.035em] text-fg leading-none">
        US Rate Deck Analyzer
      </h1>
      <p class="mt-2 font-sans text-sm text-fg-dim max-w-2xl">
        Upload two rate decks to compare coverage and rate aggregates across destinations.
      </p>
      <button
        @click="openInfoModal"
        class="absolute top-0 right-1 inline-flex items-center gap-2 border border-line-strong bg-surface px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.06em] text-fg-dim hover:bg-row hover:text-fg transition-colors"
        aria-label="How the US Rate Deck Analyzer works"
      >
        <QuestionMarkCircleIcon class="w-4 h-4" /> How it works
      </button>
    </div>

    <!-- UPLOAD STATE: stepper + upload cards + what's next + start analysis -->
    <template v-if="usStore.activeReportType === ReportTypes.FILES">
      <div class="border border-line bg-surface p-6 md:p-8">
        <!-- Stepper -->
        <div class="grid grid-cols-1 sm:grid-cols-3 border border-line bg-canvas mb-8">
          <div
            v-for="(step, i) in steps"
            :key="step.n"
            class="flex flex-col gap-2 px-5 py-5"
            :class="i ? 'border-t border-line sm:border-t-0 sm:border-l' : ''"
          >
            <div class="flex items-center gap-3">
              <span
                class="font-display text-[28px] font-semibold leading-none tracking-[-0.04em]"
                :class="currentStep >= step.n ? 'text-accent' : 'text-fg-mute'"
                >{{ String(step.n).padStart(2, '0') }}</span
              >
              <span
                class="font-display text-sm font-semibold tracking-[-0.005em]"
                :class="currentStep >= step.n ? 'text-fg' : 'text-fg-faint'"
                >{{ step.label }}</span
              >
              <span
                v-if="currentStep > step.n"
                class="ml-auto inline-flex items-center gap-1 font-display text-[10px] uppercase tracking-[0.12em] text-warn"
              >
                <CheckIcon class="h-3 w-3" /> Done
              </span>
              <span
                v-else-if="currentStep === step.n"
                class="ml-auto font-display text-[10px] uppercase tracking-[0.12em] text-accent"
                >● Now</span
              >
            </div>
            <span class="font-display text-[11px] text-fg-faint">{{ step.desc }}</span>
          </div>
        </div>

        <!-- Upload cards (Rate Deck A / VS / Rate Deck B) -->
        <USFileUploads ref="fileUploadsRef" />

        <!-- What happens next -->
        <div
          class="mt-6 flex gap-4 border border-accent-ring bg-accent-soft p-5"
          style="border-left: 3px solid var(--accent)"
        >
          <SparklesIcon class="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <div class="font-display text-[11px] uppercase tracking-[0.16em] text-accent">
              What happens next
            </div>
            <p class="mt-1.5 font-sans text-[13.5px] leading-relaxed text-fg">
              We'll analyze both files, identify matching destinations, compare rates, and highlight
              the differences — so you can see coverage gaps and where the margin is, fast.
            </p>
          </div>
        </div>

        <!-- Start Analysis -->
        <div class="mt-6 flex flex-col items-center">
          <button
            :disabled="!bothDecksUploaded || isStarting"
            class="w-full max-w-md inline-flex items-center justify-center gap-2 px-6 py-3 font-display text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors"
            :class="
              bothDecksUploaded && !isStarting
                ? 'bg-accent text-accent-ink hover:bg-accent-strong'
                : 'bg-row text-fg-mute border border-line cursor-not-allowed'
            "
            @click="startAnalysis"
          >
            <ArrowPathIcon v-if="isStarting" class="h-4 w-4 animate-spin" />
            {{ startButtonLabel }}
            <ArrowRightIcon
              v-if="bothDecksUploaded && usStore.isCodeReportReady && !isStarting"
              class="h-4 w-4"
            />
          </button>
          <p
            v-if="!bothDecksUploaded"
            class="mt-2 inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-[0.06em] text-fg-mute"
          >
            <LockClosedIcon class="h-3.5 w-3.5" /> Upload both decks to start
          </p>
        </div>
      </div>
    </template>

    <!-- REPORT STATE: tabs + report -->
    <template v-else>
      <USContentHeader />
      <div>
        <transition name="fade" mode="out-in" appear>
          <div :key="usStore.getActiveReportType">
            <USInsights
              v-if="usStore.activeReportType === ReportTypes.CODE && usStore.isCodeReportReady"
            />
            <USPricingReport
              v-if="usStore.activeReportType === ReportTypes.PRICING && usStore.isCodeReportReady"
              :report="usStore.getPricingReport"
            />
            <div
              v-else-if="usStore.activeReportType === ReportTypes.PRICING && !usStore.isCodeReportReady"
              class="text-center p-10 font-sans text-sm text-fg-faint"
            >
              <p>Waiting for initial report generation...</p>
            </div>
          </div>
        </transition>
      </div>
    </template>

    <!-- Info Modal -->
    <InfoModal :show-modal="showInfoModal" :type="'us_comparison'" @close="closeInfoModal" />
  </div>
</template>

<script setup lang="ts">
  import USFileUploads from '@/components/us/USFileUploads.vue';
  import USInsights from '@/components/us/USInsights.vue';
  import USPricingReport from '@/components/us/USPricingReport.vue';
  import USContentHeader from '@/components/us/USContentHeader.vue';
  import InfoModal from '@/components/shared/InfoModal.vue';
  import TheTicker, { type TickerItem } from '@/components/shared/TheTicker.vue';
  import RunningHead from '@/components/shared/RunningHead.vue';
  import {
    QuestionMarkCircleIcon,
    SparklesIcon,
    ArrowRightIcon,
    LockClosedIcon,
    CheckIcon,
  } from '@heroicons/vue/24/outline';
  import { ArrowPathIcon } from '@heroicons/vue/20/solid';
  import { useUsStore } from '@/stores/us-store';
  import { ReportTypes } from '@/types/app-types';
  import { onMounted, ref, computed } from 'vue';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';

  const usStore = useUsStore();
  const lergStore = useLergStoreV2();

  const showInfoModal = ref(false);
  const error = ref<string | null>(null);

  const steps = [
    { n: 1, label: 'Rate Deck A', desc: 'Upload & map columns' },
    { n: 2, label: 'Rate Deck B', desc: 'Upload & map columns' },
    { n: 3, label: 'Start Analysis', desc: 'Compare rates & get insights' },
  ];

  const bothDecksUploaded = computed(() => usStore.getNumberOfFilesUploaded === 2);

  // Portal ticker — derived from the live session insights summary. Empty before a
  // comparison exists, so TheTicker shows its quiet "SESSION · LOCAL · EPHEMERAL" state.
  const tickerItems = computed<TickerItem[]>(() => {
    const sum = usStore.getInsightsSummary;
    if (!sum) return [];
    const fmtDelta = (v: number) => `${v < 0 ? '−' : '+'}$${Math.abs(v).toFixed(4)}`;
    return [
      { sym: 'COVERAGE', value: `${sum.coverageMatchPct.toFixed(2)}%`, dir: 'warn' },
      { sym: 'MATCHED', value: sum.matchedCodes.toLocaleString(), dir: 'neutral' },
      {
        sym: 'AVG MARGIN Δ INTER',
        value: fmtDelta(sum.marginDeltaInter),
        dir: sum.marginDeltaInter >= 0 ? 'warn' : 'accent',
      },
      {
        sym: 'AVG MARGIN Δ INTRA',
        value: fmtDelta(sum.marginDeltaIntra),
        dir: sum.marginDeltaIntra >= 0 ? 'warn' : 'accent',
      },
      { sym: 'OPPORTUNITIES', value: sum.totalOpportunities.toLocaleString(), dir: 'accent' },
      { sym: 'TOP SELL', value: sum.sellToCount.toLocaleString(), dir: 'warn' },
      { sym: 'TOP BUY', value: sum.buyFromCount.toLocaleString(), dir: 'accent' },
    ];
  });

  const currentStep = computed(() => {
    if (bothDecksUploaded.value) return 3;
    if (usStore.getNumberOfFilesUploaded === 1) return 2;
    return 1;
  });

  const fileUploadsRef = ref<InstanceType<typeof USFileUploads> | null>(null);
  const isStarting = ref(false);

  const startButtonLabel = computed(() => {
    if (!bothDecksUploaded.value) return 'Start Analysis';
    if (isStarting.value) return 'Analyzing…';
    return usStore.isCodeReportReady ? 'View Analysis' : 'Start Analysis';
  });

  async function startAnalysis() {
    if (!bothDecksUploaded.value) return;
    // Already analyzed → just switch to the report view.
    if (usStore.isCodeReportReady) {
      usStore.setActiveReportType(ReportTypes.CODE);
      return;
    }
    // Trigger generation; USContentHeader's watcher auto-switches to the Insights tab once ready.
    isStarting.value = true;
    try {
      await fileUploadsRef.value?.generateReports();
    } catch (err) {
      console.error('[UsView] Analysis failed:', err);
    } finally {
      isStarting.value = false;
    }
  }

  function openInfoModal() {
    showInfoModal.value = true;
  }

  function closeInfoModal() {
    showInfoModal.value = false;
  }

  onMounted(async () => {
    try {
      const usStates = lergStore.getUSStates;
      const canadaProvinces = lergStore.getCanadianProvinces;
      const countryData = lergStore.getDistinctCountries;
      console.log('[UsView] LERG status:', usStates.length, canadaProvinces.length, countryData.length, lergStore.isInitialized);
    } catch (err) {
      console.error('[UsView] Error pinging LERG service:', err);
      error.value = err instanceof Error ? err.message : 'Failed to ping LERG service';
    }
  });
</script>
