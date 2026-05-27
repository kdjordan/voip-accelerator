<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';

// Components
import RateGenFileUploads from '@/components/rate-gen/RateGenFileUploads.vue';
import RateGenConfiguration from '@/components/rate-gen/RateGenConfiguration.vue';
import RateGenResults from '@/components/rate-gen/RateGenResults.vue';
import BaseButton from '@/components/shared/BaseButton.vue';

const store = useRateGenStore();
const service = new RateGenService();

// State
const activeTab = ref<'upload' | 'settings' | 'results'>('upload');
const showExportModal = ref(false);

// Computed
const canGenerate = computed(() =>
  store.providerList.length >= 2 &&
  store.currentConfig !== null &&
  !store.isProcessing
);

// Methods
const handleGenerateRates = async () => {
  if (!store.currentConfig) return;

  try {
    await service.generateRateDeck(store.currentConfig);

    const successMessage = `Successfully generated ${store.generatedDeck?.rowCount.toLocaleString()} rates using ${store.generatedDeck?.lcrStrategy} strategy`;
    console.log('[RateGenUSView]', successMessage);

    activeTab.value = 'results';
  } catch (error) {
    console.error('[RateGenUSView] Generation failed:', error);
  }
};

const handleExport = async (format: 'csv' | 'excel') => {
  if (!store.generatedDeck) return;

  try {
    const blob = await service.exportRateDeck(store.generatedDeck.id, format);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate-deck-${store.generatedDeck.lcrStrategy}-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showExportModal.value = false;
  } catch (error) {
    store.addError(`Failed to export: ${(error as Error).message}`);
  }
};

// Lifecycle
onMounted(async () => {
  console.log('[RateGenUSView] Component mounted');

  try {
    const existingDecks = await service.getAllDecks();
    if (existingDecks.length > 0) {
      store.setGeneratedDecks(existingDecks.map(d => ({
        id: d.id,
        name: d.name,
        lcrStrategy: d.strategy,
        markupPercentage: d.markupType === 'percentage' ? d.markupValue : 0,
        markupFixed: d.markupType === 'fixed' ? d.markupValue : 0,
        providerIds: [],
        generatedDate: new Date(d.generatedAt),
        effectiveDate: d.effectiveDate ? new Date(d.effectiveDate) : undefined,
        rowCount: d.rowCount
      })));
      console.log(`[RateGenUSView] Loaded ${existingDecks.length} existing decks`);
    }
  } catch (error) {
    console.error('[RateGenUSView] Failed to load existing decks:', error);
  }
});

onUnmounted(() => {
  console.log('[RateGenUSView] Component unmounted');
});
</script>

<template>
  <!-- Main Page Content -->
  <div class="flex flex-col w-full bg-ink text-zinc-300">
    <!-- Page Title -->
    <div class="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
      <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-white" role="heading" aria-level="1">Rate Composition Studio</h1>
    </div>

    <!-- Step Content - Full Width -->
    <div class="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 flex-1">
      <!-- Upload — bare on the ink canvas; cards are self-contained -->
      <div v-if="activeTab === 'upload'" class="pt-6">
        <RateGenFileUploads />

        <div v-if="store.providerCount >= 2" class="mt-6 flex justify-end">
          <BaseButton variant="primary" @click="activeTab = 'settings'">
            Continue to Configuration
          </BaseButton>
        </div>
      </div>

      <!-- Configuration — bare on the ink canvas (component owns its sections) -->
      <div v-else-if="activeTab === 'settings'" class="pt-6">
        <button
          type="button"
          class="mb-4 inline-flex items-center gap-1 rounded text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
          @click="activeTab = 'upload'"
        >
          ← Back to uploads
        </button>

        <RateGenConfiguration @generate-rates="handleGenerateRates" />
      </div>

      <!-- Results keeps the legacy panel until its redesign slice -->
      <div v-else class="bg-gray-800 rounded-lg p-4 sm:p-6">
        <button
          type="button"
          class="mb-4 inline-flex items-center gap-1 rounded text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
          @click="activeTab = 'upload'"
        >
          ← Back to uploads
        </button>

        <h2 class="text-xl font-semibold text-fbWhite mb-6">Rate Generation History</h2>
        <RateGenResults @generate-new="activeTab = 'settings'" />
      </div>
    </div>


    <!-- Error Display -->
    <div v-if="store.errors.length > 0" class="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
      <div v-for="(error, index) in store.errors" :key="index"
           class="bg-red-500/20 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-2
                  flex items-center justify-between text-sm sm:text-base">
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

    <!-- Export Modal Placeholder -->
    <div v-if="showExportModal && store.generatedDeck"
         class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-fbWhite mb-4">Export Rate Deck</h3>

        <div class="space-y-3">
          <button
            @click="handleExport('csv')"
            class="w-full px-4 py-2 bg-accent text-fbBlack rounded-lg hover:bg-accent/80
                   transition-colors font-medium"
          >
            Export as CSV
          </button>

          <button
            @click="showExportModal = false"
            class="w-full px-4 py-2 bg-gray-600 text-fbWhite rounded-lg hover:bg-gray-500
                   transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
