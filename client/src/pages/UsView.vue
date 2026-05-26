<template>
  <!-- Main Page Content -->
  <div class="text-white pt-2 w-full">
    <!-- Header -->
    <div class="relative px-1 mb-6">
      <p class="text-xs font-secondary uppercase tracking-wider text-emerald-400/80">US Analyzer</p>
      <h1 class="text-2xl md:text-3xl text-white font-bold tracking-tight">US Rate Deck Analyzer</h1>
      <p class="mt-1.5 text-sm text-zinc-400 max-w-2xl">
        Upload two rate deck CSV files to analyze and compare rates, destinations, and call details.
      </p>
      <button
        @click="openInfoModal"
        class="absolute top-0 right-1 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
        aria-label="How the US Rate Deck Analyzer works"
      >
        <QuestionMarkCircleIcon class="w-4 h-4" /> How it works
      </button>
    </div>

    <!-- UPLOAD STATE: stepper + upload cards + what's next + start analysis -->
    <template v-if="usStore.activeReportType === ReportTypes.FILES">
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 md:p-8">
        <!-- Stepper -->
        <ol class="flex items-start justify-between gap-2 mb-8 max-w-3xl mx-auto">
          <li v-for="(step, i) in steps" :key="step.n" class="flex-1 flex items-start">
            <div class="flex-1 flex flex-col items-center text-center">
              <span
                class="h-9 w-9 grid place-items-center rounded-full text-sm font-secondary font-semibold transition-colors"
                :class="
                  currentStep > step.n
                    ? 'bg-emerald-400 text-ink'
                    : currentStep === step.n
                      ? 'bg-emerald-400 text-ink ring-4 ring-emerald-400/20'
                      : 'bg-white/[0.04] text-zinc-500 ring-1 ring-white/10'
                "
              >
                <CheckIcon v-if="currentStep > step.n" class="h-4 w-4" />
                <template v-else>{{ step.n }}</template>
              </span>
              <span
                class="mt-2 text-sm font-medium"
                :class="currentStep >= step.n ? 'text-zinc-100' : 'text-zinc-500'"
                >{{ step.label }}</span
              >
              <span class="mt-0.5 text-xs text-zinc-500 max-w-[12rem]">{{ step.desc }}</span>
            </div>
            <!-- connector -->
            <span
              v-if="i < steps.length - 1"
              class="hidden sm:block h-px flex-1 mt-[18px] -mx-2"
              :class="currentStep > step.n ? 'bg-emerald-400/40' : 'bg-white/10'"
              style="border-top: 1px dashed currentColor; background: none"
            ></span>
          </li>
        </ol>

        <!-- Upload cards (Rate Deck A / VS / Rate Deck B) -->
        <USFileUploads />

        <!-- What happens next -->
        <div class="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5 flex gap-4">
          <SparklesIcon class="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="text-sm font-semibold text-white">What happens next?</h3>
            <p class="mt-1 text-sm text-zinc-400 leading-relaxed">
              We'll analyze both files, identify matching destinations, compare rates, and highlight
              the differences — so you can see coverage gaps and where the margin is, fast.
            </p>
          </div>
        </div>

        <!-- Start Analysis -->
        <div class="mt-6 flex flex-col items-center">
          <button
            :disabled="!bothDecksUploaded"
            class="w-full max-w-md inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors"
            :class="
              bothDecksUploaded
                ? 'bg-emerald-400 text-ink hover:bg-emerald-300'
                : 'bg-white/[0.03] text-zinc-500 border border-white/10 cursor-not-allowed'
            "
            @click="startAnalysis"
          >
            <ArrowPathIcon v-if="bothDecksUploaded && !usStore.isCodeReportReady" class="h-4 w-4 animate-spin" />
            {{ startButtonLabel }}
            <ArrowRightIcon v-if="bothDecksUploaded && usStore.isCodeReportReady" class="h-4 w-4" />
          </button>
          <p v-if="!bothDecksUploaded" class="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-500">
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
            <USCodeReport
              v-if="usStore.activeReportType === ReportTypes.CODE && usStore.isCodeReportReady"
              :report="usStore.getCodeReport"
            />
            <USPricingReport
              v-if="usStore.activeReportType === ReportTypes.PRICING && usStore.isCodeReportReady"
              :report="usStore.getPricingReport"
            />
            <div
              v-else-if="usStore.activeReportType === ReportTypes.PRICING && !usStore.isCodeReportReady"
              class="text-center p-10 text-zinc-400"
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
  import USCodeReport from '@/components/us/USCodeReport.vue';
  import USPricingReport from '@/components/us/USPricingReport.vue';
  import USContentHeader from '@/components/us/USContentHeader.vue';
  import InfoModal from '@/components/shared/InfoModal.vue';
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
    { n: 1, label: 'Upload Files', desc: 'Upload two CSV files to compare' },
    { n: 2, label: 'Map & Review', desc: 'Map columns and confirm a preview' },
    { n: 3, label: 'Analyze', desc: 'Get the detailed comparison and insights' },
  ];

  const bothDecksUploaded = computed(() => usStore.getNumberOfFilesUploaded === 2);

  const currentStep = computed(() => {
    if (bothDecksUploaded.value) return 3;
    if (usStore.getNumberOfFilesUploaded === 1) return 2;
    return 1;
  });

  const startButtonLabel = computed(() => {
    if (!bothDecksUploaded.value) return 'Start Analysis';
    return usStore.isCodeReportReady ? 'View Analysis' : 'Analyzing…';
  });

  function startAnalysis() {
    if (bothDecksUploaded.value && usStore.isCodeReportReady) {
      usStore.setActiveReportType(ReportTypes.CODE);
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
