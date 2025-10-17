<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-50" @close="$emit('update:open', false)">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/80 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-fbBlack text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
              <div class="bg-fbBlack px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left flex-1">
                    <DialogTitle as="h3" class="text-2xl font-secondary uppercase text-accent tracking-wider">
                      Export Rate Deck
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-fbWhite/70">
                        Review your export settings and options before downloading. You can customize the format to match your requirements.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-6 space-y-6">
                  <!-- Active Information Summary -->
                  <RateGenExportFilters
                    :deck="deck"
                    :total-records="totalRecords"
                    :filtered-records="filteredRecords"
                  />

                  <!-- Format Options -->
                  <RateGenExportFormatOptions
                    v-model:options="formatOptions"
                    :data="previewData"
                    :total-records="totalRecords"
                    :filtered-records="filteredRecords"
                    @update:filtered-count="updateFilteredCount"
                  />

                  <!-- Preview -->
                  <RateGenExportPreview
                    :data="previewData"
                    :format-options="formatOptions"
                    :loading="loadingPreview"
                    :total-records="totalRecords"
                  />
                </div>
              </div>
              <div class="bg-fbHover px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <BaseButton
                  variant="secondary"
                  @click="$emit('update:open', false)"
                  size="small"
                  :disabled="isExporting"
                  class="mt-3 sm:ml-3 sm:mt-0 sm:w-auto w-full"
                >
                  Cancel
                </BaseButton>
                <BaseButton
                  variant="primary"
                  size="small"
                  :disabled="isExporting || currentFilteredCount === 0"
                  :loading="isExporting"
                  @click="handleExport"
                  class="sm:w-auto w-full"
                >
                  Export CSV
                </BaseButton>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import BaseButton from '@/components/shared/BaseButton.vue';
import RateGenExportFilters from './RateGenExportFilters.vue';
import RateGenExportFormatOptions from './RateGenExportFormatOptions.vue';
import RateGenExportPreview from './RateGenExportPreview.vue';
import type { GeneratedRateDeck, RateGenExportOptions } from '@/types/domains/rate-gen-types';
import { RateGenService } from '@/services/rate-gen.service';
import { useLergStoreV2 } from '@/stores/lerg-store-v2';

const props = defineProps<{
  open: boolean;
  deck: GeneratedRateDeck | null;
  onExport: (deckId: string, options: RateGenExportOptions) => Promise<void>;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const formatOptions = ref<RateGenExportOptions>({
  npanxxFormat: 'combined',
  includeCountryCode: false,
  includeStateColumn: false,
  includeCountryColumn: false,
  includeRegionColumn: false,
  selectedCountries: [],
  excludeCountries: false,
  includeProviderColumn: false,
  includeCalculationDetails: false,
});

const isExporting = ref(false);
const loadingPreview = ref(false);
const previewData = ref<any[]>([]);
const currentFilteredCount = ref(0);

// Computed values
const totalRecords = computed(() => props.deck?.rowCount || 0);
const filteredRecords = computed(() => currentFilteredCount.value);

function updateFilteredCount(count: number) {
  currentFilteredCount.value = count;
}

// Generate preview data when deck changes
watch(() => props.deck, async (newDeck) => {
  if (newDeck) {
    loadingPreview.value = true;
    await nextTick();
    
    try {
      // Load actual data from the deck
      const service = new RateGenService();
      const lergStore = useLergStoreV2();
      const allRates = await service.loadRatesForDeck(newDeck.id);
      
      // Take first 10 records for preview and enrich with geographic data
      const previewRates = allRates.slice(0, 10).map(rate => {
        const npa = rate.prefix?.substring(0, 3);
        const npaInfo = npa ? lergStore.getNPAInfo(npa) : null;
        
        return {
          ...rate,
          npa,
          state: npaInfo?.state_province_name,
          stateCode: npaInfo?.state_province_code,
          country: npaInfo?.country_name || 'United States',
          countryCode: npaInfo?.country_code || 'US',
          region: npaInfo?.region
        };
      });
      
      previewData.value = previewRates;
      
      // Set initial filtered count
      currentFilteredCount.value = newDeck.rowCount;
    } catch (error) {
      console.error('Failed to load preview data:', error);
      // Fallback to mock data if loading fails
      previewData.value = Array.from({ length: Math.min(10, newDeck.rowCount) }, (_, i) => ({
        prefix: `${201000 + i}`,
        rate: 0.003500 + (i * 0.000100),
        intrastate: 0.003200 + (i * 0.000100),
        indeterminate: 0.003500 + (i * 0.000100),
        selectedProvider: `Provider ${(i % 3) + 1}`,
        stateCode: 'NJ',
        countryCode: 'US'
      }));
    }
    
    await nextTick();
    loadingPreview.value = false;
  }
}, { immediate: true });

async function handleExport() {
  if (!props.deck) return;
  
  // Prevent export if no data would be exported
  if (currentFilteredCount.value === 0) {
    console.warn('Export cancelled: No data matches current options');
    return;
  }

  isExporting.value = true;
  
  try {
    console.log('[RateGenExportModal] Starting export...');
    await props.onExport(props.deck.id, formatOptions.value);
    console.log('[RateGenExportModal] Export completed successfully');
    
    // Close modal after brief delay
    setTimeout(() => {
      emit('update:open', false);
    }, 100);
    
  } catch (error) {
    console.error('[RateGenExportModal] Export failed:', error);
    emit('update:open', false);
  } finally {
    setTimeout(() => {
      isExporting.value = false;
    }, 100);
  }
}
</script>