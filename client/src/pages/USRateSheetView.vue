<template>
  <!-- Pricing Studio — browser-local rate-deck transformation workspace -->
  <div class="text-fg-dim pt-2 w-full">
    <PageMasthead
      section="Section III — Repricing"
      title="Pricing Studio"
      right="Browser-local · ephemeral"
      subtitle="All processing is done locally in your browser."
      :ticker-items="tickerItems"
    >
      <template #title-suffix>
        <span
          v-if="isLocallyStored"
          class="inline-flex items-center gap-1.5 border border-warn bg-warn-soft px-2.5 py-1 font-display text-[10px] uppercase tracking-wider text-warn"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-warn animate-status-pulse-success"></span>
          Data loaded
        </span>
      </template>
      <template #actions>
        <button
          @click="openInfoModal"
          class="inline-flex items-center gap-2 border border-line-strong bg-surface px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.06em] text-fg-dim hover:bg-row hover:text-fg transition-colors"
          aria-label="How Pricing Studio works"
        >
          <QuestionMarkCircleIcon class="w-4 h-4" /> How it works
        </button>

        <template v-if="isLocallyStored">
          <div class="flex items-center gap-2">
            <label
              for="effective-date"
              class="font-display text-[10px] uppercase tracking-wider text-fg-faint whitespace-nowrap"
              >Effective Date</label
            >
            <input
              id="effective-date"
              type="date"
              v-model="selectedEffectiveDate"
              :min="minDate"
              @change="handleApplyEffectiveDate"
              class="bg-input border border-line-strong px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>

          <button
            @click="handleExportPackage"
            :disabled="!readiness.exportReady"
            class="inline-flex items-center gap-2 bg-accent px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.06em] text-accent-ink hover:bg-accent-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon class="h-4 w-4" /> Export Package
          </button>

          <button
            @click="requestReset"
            class="inline-flex items-center gap-2 border border-down bg-down-soft px-3 py-2 font-display text-[11px] uppercase tracking-[0.06em] text-down hover:opacity-80 transition-opacity"
          >
            Reset All
          </button>
        </template>
      </template>
    </PageMasthead>

    <!-- Readiness summary — one calm line; expands to the full metric strip -->
    <div v-if="isLocallyStored" class="mb-5 px-1">
      <button
        @click="showStrip = !showStrip"
        class="flex w-full items-center gap-x-5 gap-y-1 border border-line bg-surface px-4 py-2.5 text-sm hover:bg-row transition-colors flex-wrap"
      >
        <span class="font-secondary text-fg">{{ readiness.modifiedRows.toLocaleString() }}</span>
        <span class="text-fg-faint">modified ({{ readiness.modifiedPct }}%)</span>
        <span class="text-fg-mute">·</span>
        <span class="font-secondary text-info">{{ readiness.frozenScopes }}</span>
        <span class="text-fg-faint">frozen</span>
        <span class="text-fg-mute">·</span>
        <span class="text-fg-faint">avg inter</span>
        <span class="font-secondary text-fg">{{ avgInterLabel }}</span>
        <span
          class="ml-auto inline-flex items-center gap-1.5"
          :class="readiness.exportReady ? 'text-warn' : 'text-fg-faint'"
        >
          <CheckCircleIcon class="h-4 w-4" /> {{ readiness.exportReady ? 'Export ready' : 'Not ready' }}
          <ChevronDownIcon class="h-4 w-4 text-fg-faint transition-transform" :class="{ 'rotate-180': showStrip }" />
        </span>
      </button>
      <PricingStudioMetricStrip v-if="showStrip" :stats="readiness" class="mt-3" />
    </div>

    <!-- Invalid rows surfaced after upload — collapsed to a chip -->
    <div v-if="store.hasInvalidRateSheetRows" class="mb-5 px-1">
      <button
        @click="showInvalid = !showInvalid"
        class="inline-flex items-center gap-2 border border-warn bg-warn-soft px-3 py-1.5 font-display text-xs uppercase tracking-wider text-warn hover:opacity-80 transition-opacity"
      >
        <ExclamationTriangleIcon class="h-3.5 w-3.5" />
        {{ usInvalidRowEntries.length }} invalid {{ usInvalidRowEntries.length === 1 ? 'row' : 'rows' }} not uploaded — review
        <ChevronDownIcon class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-180': showInvalid }" />
      </button>
      <InvalidRows
        v-if="showInvalid"
        :items="usInvalidRowEntries"
        title="Invalid Rows Not Uploaded"
        class="mt-3"
      />
    </div>

    <!-- UPLOAD STATE -->
    <div
      v-if="!isLocallyStored"
      class="border border-line bg-surface p-6 md:p-8"
    >
      <div
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @dragover.prevent="handleDragOver"
        @drop.prevent="handleDrop"
        class="relative p-8 min-h-[160px] flex items-center justify-center transition-colors duration-200"
        :class="[
          isDragging && !isProcessing && !showPreviewModal
            ? 'border-2 border-solid border-accent bg-accent-soft'
            : 'border-2 border-dashed border-line-strong',
          !isProcessing && !showPreviewModal
            ? 'hover:border-accent hover:bg-row cursor-pointer'
            : isProcessing
              ? 'cursor-not-allowed'
              : 'cursor-default',
          uploadError ? 'border-2 border-solid border-down' : '',
        ]"
      >
        <input
          type="file"
          accept=".csv"
          class="absolute inset-0 opacity-0 w-full h-full"
          :class="{ 'pointer-events-none': isProcessing || showPreviewModal }"
          :disabled="isProcessing || showPreviewModal"
          @change="handleFileChange"
        />
        <template v-if="!isProcessing">
          <div class="text-center">
            <ArrowUpTrayIcon
              class="w-12 h-12 mx-auto rounded-full p-3 border"
              :class="
                uploadError
                  ? 'text-down border-down bg-down-soft'
                  : 'text-accent border-accent-ring bg-accent-soft'
              "
            />
            <p class="mt-3 text-base font-medium" :class="uploadError ? 'text-down' : 'text-fg'">
              <template v-if="uploadError">{{ uploadError }}</template>
              <template v-else>Drag &amp; drop a rate deck to upload, or click to select</template>
            </p>
            <p class="mt-1 text-sm text-fg-faint">
              {{ uploadError ? 'Please try again with a CSV file' : 'CSV rate sheet — parsed locally, never uploaded' }}
            </p>
          </div>
        </template>
        <template v-else>
          <RealTimeProgressIndicator
            :is-uploading="store.getUploadProgress.isUploading"
            :progress="store.getUploadProgress.progress"
            :stage="store.getUploadProgress.stage"
            :rows-processed="store.getUploadProgress.rowsProcessed"
            :total-rows="store.getUploadProgress.totalRows"
          />
        </template>
      </div>

      <!-- Local-processing trust note -->
      <div class="mt-5 flex items-start gap-3 border border-line bg-surface p-4">
        <LockClosedIcon class="h-5 w-5 text-fg-faint flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 class="font-display text-sm font-semibold text-fg">All data is stored in your browser</h3>
          <p class="mt-1 text-sm text-fg-faint leading-relaxed">
            Your rate sheets never leave your device — parsing and pricing run entirely locally, and
            the deck is cleared when you reload. We never upload or store your data.
          </p>
        </div>
      </div>
    </div>

    <!-- WORKSPACE STATE -->
    <div v-else>
      <USRateSheetTable ref="tableRef" />
    </div>

    <!-- Preview Modal (column mapping) -->
    <PreviewModal
      v-if="showPreviewModal"
      :show-modal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :column-options="US_COLUMN_ROLE_OPTIONS"
      :start-line="startLine"
      :validate-required="false"
      :source="'US'"
      @update:mappings="handleMappingUpdate"
      @update:valid="(newValid) => (isValid = newValid)"
      @update:start-line="(newStartLine) => (startLine = newStartLine)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

    <!-- Info Modal -->
    <InfoModal :show-modal="showInfoModal" :type="'us_rate_sheet'" @close="closeInfoModal" />

    <!-- Reset All confirmation (wipes the loaded deck + session) -->
    <ConfirmationModal
      v-model="showResetConfirm"
      title="Reset Pricing Studio"
      message="This clears the loaded rate deck and all session changes (frozen scopes and operations) from your browser. This cannot be undone."
      confirm-button-text="Reset Everything"
      :requires-confirmation-phrase="true"
      confirmation-phrase="RESET"
      @confirm="confirmReset"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, watch } from 'vue';
  import InfoModal from '@/components/shared/InfoModal.vue';
  import InvalidRows from '@/components/shared/InvalidRows.vue';
  import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
  import PricingStudioMetricStrip from '@/components/rate-sheet/us/pricing-studio/PricingStudioMetricStrip.vue';
  import PageMasthead from '@/components/shared/PageMasthead.vue';
  import { type TickerItem } from '@/components/shared/TheTicker.vue';
  import type { InvalidRowEntry } from '@/types/components/invalid-rows-types';

  import {
    ArrowUpTrayIcon,
    LockClosedIcon,
    QuestionMarkCircleIcon,
  } from '@heroicons/vue/24/outline';
  import {
    ArrowDownTrayIcon,
    ChevronDownIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
  } from '@heroicons/vue/20/solid';
  import USRateSheetTable from '@/components/rate-sheet/us/USRateSheetTable.vue';
  import PreviewModal from '@/components/shared/PreviewModal.vue';
  import RealTimeProgressIndicator from '@/components/shared/RealTimeProgressIndicator.vue';
  import { US_COLUMN_ROLE_OPTIONS } from '@/types/domains/us-types';
  import Papa from 'papaparse';
  import type { ParseResult } from 'papaparse';
  import { USRateSheetService } from '@/services/us-rate-sheet.service';
  import { USColumnRole } from '@/types/domains/us-types';
  import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
  import { usePricingStudioStore } from '@/stores/pricing-studio-store';
  import { computeReadiness, type ReadinessStats } from '@/utils/pricing-engine';
  import { useDragDrop } from '@/composables/useDragDrop';

  const store = useUsRateSheetStore();
  const psStore = usePricingStudioStore();
  const usRateSheetService = new USRateSheetService();
  const isLocallyStored = computed(() => store.getHasUsRateSheetData);
  const uploadError = ref<string | null>(store.getError);
  const rfUploadStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);
  const isProcessing = computed(() => store.isLoading);

  // Readiness strip stats (pure derivation; avg inter rate is fed by the table).
  const readiness = computed<ReadinessStats>(() =>
    computeReadiness({
      totalRecords: store.getTotalRecords,
      operations: psStore.operations,
      freeze: psStore.freezeState,
      avgInterRate: psStore.deckAvgInterRate,
    })
  );

  // Readiness summary line is collapsed by default; the invalid-rows table starts hidden behind a chip.
  const showStrip = ref(false);
  const showInvalid = ref(false);
  const avgInterLabel = computed(() =>
    readiness.value.avgInterRate != null ? `$${readiness.value.avgInterRate.toFixed(6)}` : '—'
  );

  // Masthead ticker — live pricing-session stats once a deck is loaded; quiet otherwise.
  const tickerItems = computed<TickerItem[]>(() => {
    if (!isLocallyStored.value) return [];
    const r = readiness.value;
    return [
      { sym: 'RECORDS', value: r.totalRecords.toLocaleString(), dir: 'neutral' },
      { sym: 'MODIFIED', value: `${r.modifiedRows.toLocaleString()} · ${r.modifiedPct}%`, dir: 'warn' },
      { sym: 'FROZEN SCOPES', value: r.frozenScopes.toLocaleString(), dir: 'neutral' },
      { sym: 'AVG INTER', value: avgInterLabel.value, dir: 'neutral' },
      { sym: 'EXPORT', value: r.exportReady ? 'READY' : 'NOT READY', dir: r.exportReady ? 'warn' : 'neutral' },
    ];
  });

  // Workspace child exposes exportPackage()/resetAll() (added in Phase 5).
  const tableRef = ref<InstanceType<typeof USRateSheetTable> | null>(null);
  const showResetConfirm = ref(false);

  // Preview Modal state
  const showPreviewModal = ref(false);
  const previewData = ref<string[][]>([]);
  const columns = ref<string[]>([]);
  const startLine = ref(1);
  const columnMappings = ref<Record<string, string>>({});
  const isValid = ref(false);
  const selectedFile = ref<File | null>(null);

  // Progress tracking
  const uploadingFileRowCount = ref(0);

  // Effective Date State
  const selectedEffectiveDate = ref<string>('');
  const minDate = computed(() => new Date().toISOString().split('T')[0]);

  watch(
    () => store.getCurrentEffectiveDate,
    (newDate) => {
      if (newDate && newDate !== selectedEffectiveDate.value) {
        selectedEffectiveDate.value = newDate;
      }
    },
    { immediate: true }
  );

  // Drag and Drop Setup
  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, clearError } =
    useDragDrop({
      acceptedExtensions: ['.csv'],
      onDropCallback: async (file: File) => {
        uploadError.value = null;
        clearError();
        processFile(file);
      },
      onError: (message: string) => {
        uploadError.value = message;
        store.setError(message);
      },
    });

  onMounted(async () => {
    store.setLoading(false);
  });

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    uploadError.value = null;
    clearError();
    const file = input.files[0];
    processFile(file);
  }

  function processFile(file: File) {
    selectedFile.value = file;

    try {
      Papa.parse(file, {
        preview: 20,
        skipEmptyLines: true,
        complete: (results: ParseResult<string[]>) => {
          if (results.data.length === 0) {
            const emptyErrorMessage = 'CSV file appears to be empty or invalid.';
            uploadError.value = emptyErrorMessage;
            store.setError(emptyErrorMessage);
            showPreviewModal.value = false;
            return;
          }
          columns.value = results.data[0].map((h) => h?.trim() || '');
          previewData.value = results.data
            .slice(0, 11)
            .map((row) => (Array.isArray(row) ? row.map((cell) => cell?.trim() || '') : []));
          startLine.value = 1;
          showPreviewModal.value = true;
        },
        error: (error) => {
          const parseErrorMessage = 'Failed to parse CSV file: ' + error.message;
          uploadError.value = parseErrorMessage;
          store.setError(parseErrorMessage);
          showPreviewModal.value = false;
        },
      });
    } catch (error) {
      const processErrorMessage =
        'Failed to process file: ' + (error instanceof Error ? error.message : String(error));
      uploadError.value = processErrorMessage;
      store.setError(processErrorMessage);
      showPreviewModal.value = false;
    }
  }

  // Info Modal State
  const showInfoModal = ref(false);

  async function handleModalConfirm(
    mappings: Record<string, string>,
    indeterminateDefinition?: string,
    effectiveDate?: string
  ) {
    if (!selectedFile.value) {
      return;
    }

    // Fresh upload → clear any prior sculpting session.
    psStore.reset();

    store.setLoading(true);
    store.setError(null);
    store.setUploadInProgress(true);
    uploadError.value = null;
    rfUploadStatus.value = null;

    try {
      const fileToProcess = selectedFile.value;

      // Count rows for progress tracking
      let rowCount = 0;
      await new Promise<void>((resolve) => {
        Papa.parse(fileToProcess, {
          step: () => {
            rowCount++;
          },
          complete: () => {
            uploadingFileRowCount.value = Math.max(0, rowCount - startLine.value);
            resolve();
          },
          skipEmptyLines: true,
        });
      });

      showPreviewModal.value = false;

      store.startUploadProgress(uploadingFileRowCount.value);

      const mappedColumns = Object.entries(mappings).reduce(
        (acc, [indexStr, role]) => {
          if (role) {
            const index = parseInt(indexStr, 10);
            switch (role) {
              case USColumnRole.NPANXX:
                acc.npanxx = index;
                break;
              case USColumnRole.NPA:
                acc.npa = index;
                break;
              case USColumnRole.NXX:
                acc.nxx = index;
                break;
              case USColumnRole.INTERSTATE:
                acc.interstate = index;
                break;
              case USColumnRole.INTRASTATE:
                acc.intrastate = index;
                break;
              case USColumnRole.INDETERMINATE:
                acc.indeterminate = index;
                break;
            }
          }
          return acc;
        },
        {
          npanxx: -1,
          npa: -1,
          nxx: -1,
          interstate: -1,
          intrastate: -1,
          indeterminate: -1,
        }
      );

      if (
        mappedColumns.interstate === -1 ||
        mappedColumns.intrastate === -1 ||
        (mappedColumns.npanxx === -1 && (mappedColumns.npa === -1 || mappedColumns.nxx === -1))
      ) {
        throw new Error(
          'Required columns (NPANXX/NPA+NXX, Interstate, Intrastate) are not mapped.'
        );
      }

      const processedData = await usRateSheetService.processFile(
        fileToProcess,
        mappedColumns,
        startLine.value,
        indeterminateDefinition,
        effectiveDate,
        (progress, stage, rowsProcessed, totalRows) => {
          store.setUploadProgress(progress, stage, rowsProcessed, totalRows);
        }
      );

      await store.handleUploadSuccess(processedData);

      store.completeUploadProgress();

      store.setUploadInProgress(false);
      selectedFile.value = null;
      uploadingFileRowCount.value = 0;
      rfUploadStatus.value = { type: 'success', message: 'File processed successfully!' };
    } catch (error: any) {
      uploadError.value = `Error processing file: ${error.message || 'Unknown error'}`;
      await store.clearUsRateSheetData();
      store.resetUploadProgress();
      selectedFile.value = null;
      uploadingFileRowCount.value = 0;
      rfUploadStatus.value = { type: 'error', message: 'File processing failed.' };
    } finally {
      store.setLoading(false);
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    selectedFile.value = null;
    uploadingFileRowCount.value = 0;
    store.resetUploadProgress();
  }

  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }

  async function handleApplyEffectiveDate() {
    const isValidDateString = /^\d{4}-\d{2}-\d{2}$/.test(selectedEffectiveDate.value);
    if (!isValidDateString || selectedEffectiveDate.value === store.getCurrentEffectiveDate) {
      return;
    }
    await store.updateEffectiveDate(selectedEffectiveDate.value);
  }

  function requestReset() {
    showResetConfirm.value = true;
  }

  async function confirmReset() {
    showResetConfirm.value = false;
    psStore.reset();
    await store.clearUsRateSheetData();
  }

  function handleExportPackage() {
    // Workspace owns the export logic (rate deck CSV + branded audit PDF); wired in Phase 5.
    (tableRef.value as unknown as { exportPackage?: () => void } | null)?.exportPackage?.();
  }

  function openInfoModal() {
    showInfoModal.value = true;
  }

  function closeInfoModal() {
    showInfoModal.value = false;
  }

  const usInvalidRowEntries = computed((): InvalidRowEntry[] => {
    if (!store.invalidRateSheetRows) return [];
    return store.invalidRateSheetRows.map((row: any) => {
      let problemValue = 'N/A';

      if (typeof row.interRate === 'string' && isNaN(parseFloat(row.interRate)))
        problemValue = row.interRate;
      else if (typeof row.intraRate === 'string' && isNaN(parseFloat(row.intraRate)))
        problemValue = row.intraRate;
      else if (typeof row.indetermRate === 'string' && isNaN(parseFloat(row.indetermRate)))
        problemValue = row.indetermRate;
      else if (row.interRate !== undefined && row.interRate !== null)
        problemValue = String(row.interRate);
      else if (row.intraRate !== undefined && row.intraRate !== null)
        problemValue = String(row.intraRate);
      else if (row.indetermRate !== undefined && row.indetermRate !== null)
        problemValue = String(row.indetermRate);

      return {
        rowNumber: row.rowIndex,
        name: row.reason || 'No reason provided',
        identifier: row.npanxx || 'N/A',
        problemValue: problemValue,
      };
    });
  });
</script>
