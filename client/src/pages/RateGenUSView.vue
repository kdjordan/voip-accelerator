<script setup lang="ts">
import { ref } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';

// Components
import RateGenFileUploads from '@/components/rate-gen/RateGenFileUploads.vue';
import ReportTabButton from '@/components/shared/ReportsTabButton.vue';

const store = useRateGenStore();

type StudioTab = 'upload' | 'simulation' | 'decks';
const TABS: { value: StudioTab; label: string }[] = [
  { value: 'upload', label: 'Upload' },
  { value: 'simulation', label: 'Simulation Preview' },
  { value: 'decks', label: 'Generated Decks' },
];

// Free-navigation tab state — any tab is clickable at any time.
const activeTab = ref<StudioTab>('upload');

// Global effective date for the generated decks. Lives here so the future
// Simulation Preview sandbox (slice D) can read/lift it. Default: today + 7 days.
const getDefaultEffectiveDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};
const effectiveDate = ref(getDefaultEffectiveDate());
const minDate = new Date().toISOString().split('T')[0];
</script>

<template>
  <!-- Main Page Content -->
  <div class="flex flex-col w-full bg-ink text-zinc-300">
    <!-- Page Title -->
    <div class="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
      <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-white" role="heading" aria-level="1">
        Rate Composition Studio
      </h1>
    </div>

    <!-- Tab Navigation -->
    <div class="px-4 sm:px-6 lg:px-8 pt-4">
      <div class="flex items-center border-b border-white/10">
        <ReportTabButton
          v-for="tab in TABS"
          :key="tab.value"
          :label="tab.label"
          :is-active="activeTab === tab.value"
          @click="activeTab = tab.value"
        />
      </div>
    </div>

    <!-- Tab Content -->
    <div class="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 flex-1">
      <!-- Upload -->
      <div v-if="activeTab === 'upload'" class="pt-6">
        <RateGenFileUploads />
      </div>

      <!-- Simulation Preview (placeholder body + global options) -->
      <div v-else-if="activeTab === 'simulation'" class="pt-6 space-y-6">
        <!-- Placeholder -->
        <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center">
          <h2 class="text-lg font-semibold text-white">Scenario sandbox — coming next</h2>
          <p class="mt-2 text-sm text-zinc-400">
            Build and compare scenarios against a sample of your uploaded prefixes here.
          </p>
        </div>

        <!-- Global options -->
        <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
          <!-- Effective Date -->
          <div>
            <label for="effective-date" class="mb-2 block text-sm font-medium text-zinc-300">
              Effective Date
            </label>
            <input
              id="effective-date"
              v-model="effectiveDate"
              type="date"
              :min="minDate"
              class="w-full max-w-xs rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60 [color-scheme:dark]"
            />
            <p class="mt-1.5 text-xs text-zinc-500">Applies to every generated rate deck.</p>
          </div>

          <!-- How LCR Works (expandable disclosure — no native dialog) -->
          <details class="rounded-lg border border-white/[0.07] bg-white/[0.02]">
            <summary
              class="cursor-pointer select-none px-3 py-2 text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              How LCR works
            </summary>
            <div class="border-t border-white/[0.07] px-3 py-3 text-sm leading-relaxed text-zinc-400 space-y-2">
              <p>
                LCR (Least Cost Routing) picks a rate per prefix by ranking your selected provider
                decks from lowest to highest and choosing one by depth:
              </p>
              <ul class="list-disc list-inside space-y-1 pl-1">
                <li><span class="text-zinc-300">LCR 1</span> — the lowest-cost route.</li>
                <li><span class="text-zinc-300">LCR 2</span> — the 2nd lowest, and so on.</li>
                <li><span class="text-zinc-300">Average</span> — the mean of all selected rates.</li>
              </ul>
              <p>
                Interstate, intrastate, and indeterminate rates are selected independently, so the
                winning provider can differ by jurisdiction within a single prefix.
              </p>
            </div>
          </details>
        </div>
      </div>

      <!-- Generated Decks (placeholder) -->
      <div v-else class="pt-6">
        <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center">
          <h2 class="text-lg font-semibold text-white">No generated decks yet</h2>
          <p class="mt-2 text-sm text-zinc-400">Generated decks will appear here.</p>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="store.errors.length > 0" class="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
      <div
        v-for="(error, index) in store.errors"
        :key="index"
        class="bg-red-500/20 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-2 flex items-center justify-between text-sm sm:text-base"
      >
        <span class="flex-1 mr-2">{{ error }}</span>
        <button
          @click="store.removeError(index)"
          class="ml-2 sm:ml-4 text-red-400 hover:text-red-300 text-lg sm:text-xl font-bold flex-shrink-0"
          :aria-label="`Dismiss error: ${error}`"
          role="button"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>
