<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-10" @close="$emit('close')">
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

      <div class="fixed inset-0 z-10 overflow-y-auto">
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
                    :export-type="exportType"
                  />

                  <!-- Preview -->
                  <USExportPreview
                    :data="previewData"
                    :format-options="formatOptions"
                    :loading="loadingPreview"
                  />
                </div>
              </div>

              <div class="bg-fbHover px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <BaseButton
                  variant="primary"
                  :disabled="isExporting"
                  :loading="isExporting"
                  @click="handleExport"
                  class="sm:ml-3 sm:w-auto w-full"
                >
                  Export CSV
                </BaseButton>
                <BaseButton
                  variant="secondary"
                  @click="$emit('close')"
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
import type { USExportFilters as USExportFiltersType, USExportFormatOptions as FormatOptionsType } from '@/types/exports';

const props = defineProps<{
  open: boolean;
  exportType: 'rate-sheet' | 'comparison';
  filters: USExportFiltersType;
  data: any[];
  totalRecords: number;
  onExport: (data: any[], options: FormatOptionsType) => Promise<void>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const formatOptions = ref<FormatOptionsType>({
  npanxxFormat: 'combined',
  includeCountryCode: true,
  includeStateColumn: false,
  includeMetroColumn: false,
  selectedCountries: [],
  excludeCountries: false,
});

const isExporting = ref(false);
const loadingPreview = ref(false);
const previewData = ref<any[]>([]);

const filteredRecords = computed(() => props.data.length);

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
  isExporting.value = true;
  try {
    await props.onExport(props.data, formatOptions.value);
    emit('close');
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    isExporting.value = false;
  }
}
</script>