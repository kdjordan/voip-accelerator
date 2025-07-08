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
                  <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 sm:mx-0 sm:h-10 sm:w-10">
                    <DocumentArrowDownIcon class="h-6 w-6 text-accent" aria-hidden="true" />
                  </div>
                  <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-fbWhite">
                      Export {{ exportType }} Data
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-fbWhite/70">
                        Review your export settings and filters before downloading. You can customize the format to match your requirements.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-6 space-y-6">
                  <!-- Active Filters Summary -->
                  <USExportFilters
                    :filters="filters"
                    :total-records="totalRecords"
                    :filtered-records="filteredRecords"
                  />

                  <!-- Format Options -->
                  <USExportFormatOptions
                    v-model:options="formatOptions"
                    v-model:include-session-history="includeSessionHistory"
                    :export-type="exportType"
                    :data="data"
                    :adjusted-npas="adjustedNpas"
                    @update:filtered-count="updateFilteredCount"
                  />

                  <!-- Preview -->
                  <USExportPreview
                    v-if="exportType === 'rate-sheet'"
                    :data="previewData"
                    :format-options="formatOptions"
                    :loading="loadingPreview"
                  />
                  <USComparisonExportPreview
                    v-else
                    :data="previewData"
                    :format-options="formatOptions"
                    :loading="loadingPreview"
                  />
                </div>
              </div>

              <div class="bg-fbHover px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <BaseButton
                  variant="primary"
                  :disabled="isExporting || currentFilteredCount === 0"
                  :loading="isExporting"
                  @click="handleExport"
                  class="sm:ml-3 sm:w-auto w-full"
                >
                  Export CSV
                </BaseButton>
                <BaseButton
                  variant="secondary"
                  @click="$emit('update:open', false)"
                  :disabled="isExporting"
                  class="mt-3 sm:mt-0 sm:w-auto w-full"
                >
                  Cancel
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
import { DocumentArrowDownIcon } from '@heroicons/vue/24/outline';
import BaseButton from '@/components/shared/BaseButton.vue';
import USExportFilters from './USExportFilters.vue';
import USExportFormatOptions from './USExportFormatOptions.vue';
import USExportPreview from './USExportPreview.vue';
import USComparisonExportPreview from './USComparisonExportPreview.vue';
import type { USExportFilters as USExportFiltersType, USExportFormatOptions as FormatOptionsType } from '@/types/exports';

const props = defineProps<{
  open: boolean;
  exportType: 'rate-sheet' | 'comparison';
  filters: USExportFiltersType;
  data: any[];
  totalRecords: number;
  adjustedNpas?: Set<string>;
  adjustmentDetails?: Map<string, {
    recordsAffected: number;
    beforeRates: { inter?: number; intra?: number; indeterm?: number };
    afterRates: { inter?: number; intra?: number; indeterm?: number };
    adjustmentType: string;
    adjustmentValue: number;
    adjustmentValueType: string;
    targetRate: string;
  }>;
  adjustmentSettings?: {
    type: string;
    valueType: string;
    value: number | null;
    targetRate: string;
  };
  onExport: (data: any[], options: FormatOptionsType) => Promise<void>;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const formatOptions = ref<FormatOptionsType>({
  npanxxFormat: 'combined',
  includeCountryCode: true,
  includeStateColumn: false,
  includeCountryColumn: false,
  selectedCountries: [],
  excludeCountries: false,
});

const isExporting = ref(false);
const loadingPreview = ref(false);
const previewData = ref<any[]>([]);
const currentFilteredCount = ref(0);
const includeSessionHistory = ref(false);

const filteredRecords = computed(() => currentFilteredCount.value);

function updateFilteredCount(count: number) {
  currentFilteredCount.value = count;
}

function exportSessionHistory(adjustedNpas: Set<string>) {
  console.log('[Session Export] Starting CSV session history export...');
  console.log('[Session Export] Adjusted NPAs:', adjustedNpas);
  console.log('[Session Export] Adjustment details:', props.adjustmentDetails);
  
  const sessionDate = new Date().toISOString().split('T')[0];
  
  if (!props.adjustmentDetails || props.adjustmentDetails.size === 0) {
    console.warn('[Session Export] No detailed adjustment data available, falling back to basic export');
    // Fallback to basic CSV if no details available
    const adjustedNpasList = Array.from(adjustedNpas).sort();
    
    const csvRows = [
      'NPA,Records Affected,Adjustment Type,Adjustment Value,Target Rates',
      ...adjustedNpasList.map(npa => `${npa},Unknown,Unknown,Unknown,Unknown`)
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `us-rate-session-${sessionDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // Enhanced CSV export with clean, actionable data
  const sortedNpas = Array.from(props.adjustmentDetails.keys()).sort();
  const csvRows = ['NPA,Records Affected,Adjustment Type,Adjustment Value,Target Rates'];
  
  sortedNpas.forEach(npa => {
    const details = props.adjustmentDetails!.get(npa)!;
    
    // Format adjustment type and value
    const adjType = details.adjustmentType === 'markup' ? 'Markup' : 
                   details.adjustmentType === 'markdown' ? 'Markdown' : 'Set To';
    
    const adjValue = details.adjustmentValueType === 'percentage' ? 
                    `${details.adjustmentValue}%` : 
                    details.adjustmentType === 'set' ? 
                    `$${details.adjustmentValue}` : 
                    `$${details.adjustmentValue}`;
    
    const targetRates = details.targetRate === 'all' ? 'All' : 
                       details.targetRate === 'inter' ? 'Interstate' : 
                       details.targetRate === 'intra' ? 'Intrastate' : 'Indeterminate';
    
    csvRows.push(`${npa},${details.recordsAffected},${adjType},${adjValue},${targetRates}`);
  });

  const csvContent = csvRows.join('\n');
  console.log('[Session Export] CSV content prepared, rows:', csvRows.length);

  try {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    console.log('[Session Export] CSV blob created, size:', blob.size);
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `us-rate-session-${sessionDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('[Session Export] CSV export completed');
  } catch (error) {
    console.error('[Session Export] Error during CSV export:', error);
  }
}

// Generate preview data when format options change
watch([() => props.data, formatOptions], async () => {
  if (props.data.length > 0) {
    loadingPreview.value = true;
    await nextTick();
    // Take first 10 records for preview
    previewData.value = props.data.slice(0, 10);
    await nextTick();
    loadingPreview.value = false;
  }
}, { immediate: true, deep: true, flush: 'post' });

async function handleExport() {
  console.log('[Export] Starting export process...');
  console.log('[Export] Include session history?', includeSessionHistory.value);
  console.log('[Export] Adjusted NPAs available?', props.adjustedNpas?.size);
  
  // Prevent export if no data would be exported
  if (currentFilteredCount.value === 0) {
    console.warn('Export cancelled: No data matches current filters');
    return;
  }

  isExporting.value = true;
  
  // Track whether both exports should happen
  const shouldExportSession = includeSessionHistory.value && props.adjustedNpas?.size > 0;
  
  try {
    // Export main CSV first
    console.log('[Export] Starting main CSV export...');
    await props.onExport(props.data, formatOptions.value);
    console.log('[Export] Main CSV export completed successfully');
    
    // If session history requested, start it immediately but don't wait
    if (shouldExportSession) {
      console.log('[Export] Starting session history export immediately...');
      
      // Start session export in next tick to avoid blocking
      setTimeout(() => {
        exportSessionHistory(props.adjustedNpas);
      }, 100);
    }
    
    // Close modal after brief delay to allow both downloads to start
    setTimeout(() => {
      console.log('[Export] Closing modal...');
      emit('update:open', false);
    }, shouldExportSession ? 800 : 100);
    
  } catch (error) {
    console.error('[Export] Export failed:', error);
    emit('update:open', false);
  } finally {
    // Reset loading state after appropriate delay
    setTimeout(() => {
      isExporting.value = false;
    }, shouldExportSession ? 1000 : 100);
  }
}
</script>