<script setup lang="ts">
import { ref } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';

// Components
import RateGenFileUploads from '@/components/rate-gen/RateGenFileUploads.vue';
import RateGenSimulation from '@/components/rate-gen/RateGenSimulation.vue';
import RateGenGeneratedDecks from '@/components/rate-gen/RateGenGeneratedDecks.vue';
import ReportTabButton from '@/components/shared/ReportsTabButton.vue';

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
