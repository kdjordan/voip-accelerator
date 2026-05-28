<template>
  <!-- Main Page Content -->
  <div class="text-fg pt-2 w-full">
    <PageMasthead
      section="Section II — US NPANXX"
      title="US Rate Deck Analyzer"
      right="File A vs File B"
      subtitle="Upload two rate decks to compare coverage and rate aggregates across destinations."
      :ticker-items="tickerItems"
    >
      <template #actions>
        <button
          @click="openInfoModal"
          class="inline-flex items-center gap-2 border border-line-strong bg-surface px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.06em] text-fg-dim hover:bg-row hover:text-fg transition-colors"
          aria-label="How the US Rate Deck Analyzer works"
        >
          <QuestionMarkCircleIcon class="w-4 h-4" /> How it works
        </button>
      </template>
    </PageMasthead>

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

        <!-- Quiet provenance line for a landed hand-off deck -->
        <p
          v-if="handoffProvenance"
          class="mb-4 inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-fg-mute"
        >
          <ArrowDownTrayIcon class="h-3.5 w-3.5 text-fg-faint" />
          Loaded · {{ handoffProvenance }}
        </p>

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

    <!-- Hand-off slot chooser (both comparison slots full — pick which to replace) -->
    <Teleport to="body">
      <div
        v-if="showSlotChooser"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click.self="cancelSlotChooser"
      >
        <div class="w-full max-w-md border border-line-strong bg-surface p-6">
          <h3 class="mb-3 font-display text-lg font-semibold uppercase tracking-wider text-fg">
            Both decks are full
          </h3>
          <p class="mb-2 font-sans text-sm text-fg-dim">
            Choose which comparison slot to replace with the landed deck
            <span v-if="pendingHandoffName" class="text-fg">“{{ pendingHandoffName }}”</span>.
          </p>
          <p class="mb-6 font-sans text-sm text-fg-mute">This replaces the slot's current data.</p>
          <div class="flex flex-col gap-3">
            <button
              type="button"
              class="flex items-center justify-between border border-line-strong bg-row px-4 py-3 text-left transition-colors hover:border-accent hover:bg-accent-soft"
              @click="chooseSlot('us1')"
            >
              <span class="font-display text-sm font-medium text-fg">Replace Rate Deck A</span>
              <span class="font-display text-[11px] text-fg-faint truncate max-w-[55%]">{{
                usStore.getFileNameByComponent('us1')
              }}</span>
            </button>
            <button
              type="button"
              class="flex items-center justify-between border border-line-strong bg-row px-4 py-3 text-left transition-colors hover:border-accent hover:bg-accent-soft"
              @click="chooseSlot('us2')"
            >
              <span class="font-display text-sm font-medium text-fg">Replace Rate Deck B</span>
              <span class="font-display text-[11px] text-fg-faint truncate max-w-[55%]">{{
                usStore.getFileNameByComponent('us2')
              }}</span>
            </button>
          </div>
          <div class="mt-6 flex justify-end">
            <button
              type="button"
              class="border border-line-strong bg-surface px-4 py-2 font-display text-[11px] uppercase tracking-[0.06em] text-fg-dim transition-colors hover:bg-row hover:text-fg"
              @click="cancelSlotChooser"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>

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
  import PageMasthead from '@/components/shared/PageMasthead.vue';
  import { type TickerItem } from '@/components/shared/TheTicker.vue';
  import {
    QuestionMarkCircleIcon,
    SparklesIcon,
    ArrowRightIcon,
    LockClosedIcon,
    CheckIcon,
    ArrowDownTrayIcon,
  } from '@heroicons/vue/24/outline';
  import { ArrowPathIcon } from '@heroicons/vue/20/solid';
  import { useUsStore } from '@/stores/us-store';
  import { useHandoffStore } from '@/stores/handoff-store';
  import { ReportTypes, type ComponentId } from '@/types/app-types';
  import { onMounted, ref, computed, nextTick } from 'vue';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  import { pickAnalyzerSlot, ASK_WHICH_SLOT } from '@/utils/handoff-landing-analyzer';
  import type { RateDeckHandoff } from '@/types/domains/handoff-types';
  import type { USStandardizedData } from '@/types/domains/us-types';

  const usStore = useUsStore();
  const lergStore = useLergStoreV2();
  const handoffStore = useHandoffStore();

  const showInfoModal = ref(false);
  const error = ref<string | null>(null);

  // ===== Rate-deck hand-off landing (this view is a destination; see ADR 0009) =====
  const ANALYZER_SLOTS = ['us1', 'us2'] as const;
  const handoffProvenance = ref<string | null>(null);
  const showSlotChooser = ref(false);
  // The hand-off awaiting a slot choice (both slots full). Consumed only once landed.
  const chooserHandoff = ref<RateDeckHandoff | null>(null);
  const pendingHandoffName = computed(() => chooserHandoff.value?.name ?? '');

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

  // Drive USFileUploads' exposed landHandoff with the given deck + slot, then show
  // the provenance line. Rows are already USStandardizedData-shaped (ADR 0009).
  async function landInto(handoff: RateDeckHandoff, componentId: ComponentId) {
    await nextTick(); // ensure USFileUploads is mounted and its ref is set
    try {
      await fileUploadsRef.value?.landHandoff(
        handoff.rows as unknown as USStandardizedData[],
        handoff.name,
        componentId
      );
      handoffProvenance.value = handoff.provenance;
    } catch (err) {
      console.error('[UsView] Failed to land hand-off:', err);
    }
  }

  function chooseSlot(componentId: ComponentId) {
    const handoff = chooserHandoff.value;
    showSlotChooser.value = false;
    chooserHandoff.value = null;
    if (handoff) landInto(handoff, componentId);
  }

  function cancelSlotChooser() {
    // User declined to replace a slot — drop the pending hand-off, change nothing.
    showSlotChooser.value = false;
    chooserHandoff.value = null;
    handoffStore.clear();
  }

  function maybeLandHandoff() {
    if (!handoffStore.hasPending || handoffStore.pending?.target !== 'analyzer') return;

    const occupied = new Set(ANALYZER_SLOTS.filter((slot) => usStore.isComponentDisabled(slot)));
    const slot = pickAnalyzerSlot(ANALYZER_SLOTS, occupied);

    if (slot === ASK_WHICH_SLOT) {
      // Both slots full — hold the deck and ask which to replace. consume() is
      // deferred until a choice is made (chooseSlot consumes; cancel clears).
      chooserHandoff.value = handoffStore.consume();
      showSlotChooser.value = chooserHandoff.value !== null;
      return;
    }

    // One-shot consume, then land into the chosen empty slot.
    const handoff = handoffStore.consume();
    if (handoff) landInto(handoff, slot as ComponentId);
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

    // Consume a pending rate-deck hand-off targeting the analyzer (one-shot).
    maybeLandHandoff();
  });
</script>
