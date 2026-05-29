<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';

// Components
import RateGenFileUploads from '@/components/rate-gen/RateGenFileUploads.vue';
import RateGenSimulation from '@/components/rate-gen/RateGenSimulation.vue';
import RateGenGeneratedDecks from '@/components/rate-gen/RateGenGeneratedDecks.vue';
import ReportTabButton from '@/components/shared/ReportsTabButton.vue';
import PageMasthead from '@/components/shared/PageMasthead.vue';

const store = useRateGenStore();

// One RateGenService instance shared across the studio's tabs so committed
// decks' in-memory (session-only) records are visible to the Generated Decks
// tab (slice E) — consume THIS instance there, do NOT `new RateGenService()`.
const service = new RateGenService();

type StudioTab = 'upload' | 'simulation' | 'decks';
const TABS: { value: StudioTab; label: string }[] = [
  { value: 'upload', label: 'Upload' },
  { value: 'simulation', label: 'Simulation Preview' },
  { value: 'decks', label: 'Generated Decks' },
];

// Free-navigation tab state — any tab is clickable at any time.
const activeTab = ref<StudioTab>('upload');

// Global effective date for the generated decks. Owned here, lifted into the
// Simulation sandbox via v-model. Default: today + 7 days.
const getDefaultEffectiveDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};
const effectiveDate = ref(getDefaultEffectiveDate());

// Generated decks are session-only: their records live in THIS service instance,
// which is fresh on every view mount. So any deck metadata carried over in the
// store from a previous visit has no records behind it — drop it on mount so the
// user returns to a clean slate instead of stale "no longer in memory" cards they'd
// have to delete by hand. (Persisting decks was deliberately rejected — see ADR-0008.)
onMounted(() => {
  store.setGeneratedDecks([]);
  store.clearGeneratedDeck();
});
</script>

<template>
  <!-- Main Page Content -->
  <div class="flex flex-col w-full text-fg-dim pt-2">
    <PageMasthead
      section="Section IV — Composition"
      title="Rate Composition Studio"
      right="Up to 5 providers · local"
      subtitle="Blend up to five provider rate decks into a new NPANXX deck — entirely in your browser."
    />

    <!-- Tab Navigation -->
    <div>
      <div class="flex items-center border-b border-line-strong px-1">
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
    <div class="pb-2 flex-1">
      <!-- Upload -->
      <div v-if="activeTab === 'upload'" class="pt-6">
        <RateGenFileUploads />
      </div>

      <!-- Simulation Preview (scenario sandbox) -->
      <div v-else-if="activeTab === 'simulation'" class="pt-6">
        <RateGenSimulation v-model:effective-date="effectiveDate" :service="service" />
      </div>

      <!-- Generated Decks -->
      <div v-else class="pt-6">
        <RateGenGeneratedDecks :service="service" />
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="store.errors.length > 0" class="pb-4">
      <div
        v-for="(error, index) in store.errors"
        :key="index"
        class="bg-down-soft border border-down text-down px-3 sm:px-4 py-2 sm:py-3 mb-2 flex items-center justify-between text-sm sm:text-base"
      >
        <span class="flex-1 mr-2">{{ error }}</span>
        <button
          @click="store.removeError(index)"
          class="ml-2 sm:ml-4 text-down hover:opacity-80 text-lg sm:text-xl font-bold flex-shrink-0"
          :aria-label="`Dismiss error: ${error}`"
          role="button"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>
