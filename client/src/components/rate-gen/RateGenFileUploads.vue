<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { useLergStoreV2 } from '@/stores/lerg-store-v2';
import { RateGenService } from '@/services/rate-gen.service';
import {
  CloudArrowUpIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';
import PreviewModal from '@/components/shared/PreviewModal.vue';
import RateGenProgressIndicator from '@/components/rate-gen/RateGenProgressIndicator.vue';
import TestDataLoader from '@/components/rate-gen/TestDataLoader.vue';
import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
import { parseTabularFile, detectFormat } from '@/utils/tabular-io';
import Papa from 'papaparse';
import { USColumnRole } from '@/types/domains/us-types';
import {
  MAX_PROVIDERS,
  type RateGenComponentId,
  type ProviderInfo,
  type RateGenColumnMapping,
} from '@/types/domains/rate-gen-types';

const store = useRateGenStore();
const lergStore = useLergStoreV2();
const service = new RateGenService();

const rateGenColumnOptions = [
  { value: USColumnRole.NPANXX, label: 'NPANXX', required: false },
  { value: USColumnRole.NPA, label: 'NPA', required: false },
  { value: USColumnRole.NXX, label: 'NXX', required: false },
  { value: USColumnRole.INTERSTATE, label: 'Interstate Rate', required: true },
  { value: USColumnRole.INTRASTATE, label: 'Intrastate Rate', required: true },
  { value: USColumnRole.INDETERMINATE, label: 'Indeterminate Rate', required: false },
];

// ── Dropzone / upload state (single zone, targets the next free slot) ──
const dragOver = ref(false);
const dropzoneError = ref<string | null>(null);
// True while the preview parse runs — XLSX must be fully unzipped+parsed (~6s on
// a big deck), so the zone shows a spinner instead of nothing.
const isParsingPreview = ref(false);

// Full parsed rows per xlsx zone, held NON-reactively (a plain Map — never a
// ref/reactive, or 50K+ rows would choke Vue). Parsed once at preview time and
// reused at ingest (passed as preParsedRows) so the workbook isn't parsed twice.
// Cleared after ingest / cancel. CSV isn't cached (it re-streams cheaply).
// (Source format is tracked on the provider in the store via the service's
// detectFormat() — the generated-deck export default reads it from there.)
const xlsxRowsCache = new Map<string, string[][]>();

// PreviewModal state
const showPreviewModal = ref(false);
const previewData = ref<string[][]>([]);
const previewColumns = ref<string[]>([]);
const currentFile = ref<File | null>(null);
const currentZoneId = ref<RateGenComponentId | null>(null);
const pendingRowCount = ref(0);
const columnMappings = ref<Record<string, string>>({});
const isModalValid = ref(false);
const startLine = ref(1);
const providerName = ref('');

// Remove-confirmation state
const showConfirmModal = ref(false);
const removingProvider = ref<ProviderInfo | null>(null);

// Inline rename state
const editingId = ref<string | null>(null);
const editName = ref('');
const editInput = ref<HTMLInputElement | null>(null);

const atCapacity = computed(() => store.providerCount >= MAX_PROVIDERS);
const isUploading = computed(() => store.isProcessing);
const canUpload = computed(
  () =>
    !store.isProcessing &&
    !showPreviewModal.value &&
    !isParsingPreview.value &&
    store.getNextAvailableSlot() !== null
);

const slotNumber = (p: ProviderInfo): number => parseInt(p.id.replace('provider', ''), 10) || 1;

const formatRate = (rate: number | undefined): string =>
  rate === undefined || rate === null ? '0.000000' : rate.toFixed(6);

const coverage = (p: ProviderInfo): string => {
  const total = lergStore.usTotalNPAs; // NPAs they have vs our LERG; US-focus denominator
  if (!total) return '—';
  const pct = Math.min(100, (p.npaCount / total) * 100);
  return pct >= 99.95 ? '100%' : `${pct.toFixed(1)}%`;
};

const statsFor = (p: ProviderInfo) => [
  { label: 'Prefixes', value: p.rowCount.toLocaleString() },
  { label: 'Avg Inter Rate', value: formatRate(p.avgInterRate) },
  { label: 'Avg Intra Rate', value: formatRate(p.avgIntraRate) },
  { label: 'Avg Indet Rate', value: formatRate(p.avgIndeterminateRate) },
  { label: 'Coverage', value: coverage(p) },
];

// ── Upload flow ──
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) await handleFileUpload(file);
  target.value = '';
};

const handleDrop = async (event: DragEvent) => {
  dragOver.value = false;
  if (!canUpload.value) return;
  const file = event.dataTransfer?.files?.[0];
  if (file) await handleFileUpload(file);
};

const handleFileUpload = async (file: File) => {
  if (!canUpload.value) return;

  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.xlsx')) {
    dropzoneError.value = 'Please upload a CSV or XLSX file';
    return;
  }

  const slot = store.getNextAvailableSlot();
  if (!slot) {
    dropzoneError.value = `Maximum of ${MAX_PROVIDERS} rate decks reached`;
    return;
  }

  dropzoneError.value = null;
  currentFile.value = file;
  currentZoneId.value = slot;

  try {
    await parseFileForPreview(file);
  } catch (error) {
    dropzoneError.value = `Upload failed: ${(error as Error).message}`;
    currentFile.value = null;
    currentZoneId.value = null;
  }
};

// Cheap streaming row count for the CSV progress total (excludes the header row).
const countCsvDataRows = (file: File): Promise<number> =>
  new Promise((resolve) => {
    let count = 0;
    Papa.parse(file, {
      skipEmptyLines: true,
      step: () => {
        count++;
      },
      complete: () => resolve(Math.max(0, count - 1)),
      error: () => resolve(0),
    });
  });

const parseFileForPreview = async (file: File): Promise<void> => {
  const zoneId = currentZoneId.value;
  const fmt = detectFormat(file);
  isParsingPreview.value = true;
  try {
    // XLSX must be fully unzipped+parsed to read anything (no partial read), so
    // parse it ONCE here — FULL — and stash the rows (non-reactively) to reuse at
    // ingest, avoiding a second ~6s parse on confirm. CSV is cheap to re-read (it
    // streams at ingest), so just grab a capped sample (header + 20 preview rows).
    const rows =
      fmt === 'xlsx'
        ? await parseTabularFile(file)
        : await parseTabularFile(file, { maxRows: 21 });

    if (rows.length === 0) {
      throw new Error(`No data found in ${fmt.toUpperCase()} file`);
    }

    if (fmt === 'xlsx' && zoneId) xlsxRowsCache.set(zoneId, rows);

    // Indicator total: XLSX has the full row set in hand; CSV preview is capped to
    // 21 rows, so stream a cheap full count to keep the "of N rows" display accurate.
    pendingRowCount.value =
      fmt === 'xlsx' ? Math.max(0, rows.length - 1) : await countCsvDataRows(file);
    previewData.value = rows.slice(0, 21);
    previewColumns.value = rows[0] || [];
    columnMappings.value = {};
    isModalValid.value = false;
    startLine.value = 1;
    providerName.value = `Provider ${zoneId?.replace('provider', '') ?? ''}`.trim();
    showPreviewModal.value = true;
  } finally {
    isParsingPreview.value = false;
  }
};

const handleModalConfirm = async (
  mappings: Record<string, string>,
  indeterminateDefinition?: string,
  _effectiveDate?: string,
  modalProviderName?: string
) => {
  if (!currentFile.value || !currentZoneId.value) return;
  const zoneId = currentZoneId.value;

  try {
    showPreviewModal.value = false;

    const columnMapping: RateGenColumnMapping = { rateInter: -1, rateIntra: -1 };
    Object.entries(mappings).forEach(([columnIndex, role]) => {
      const index = parseInt(columnIndex);
      switch (role) {
        case USColumnRole.NPANXX: columnMapping.npanxx = index; break;
        case USColumnRole.NPA: columnMapping.npa = index; break;
        case USColumnRole.NXX: columnMapping.nxx = index; break;
        case USColumnRole.INTERSTATE: columnMapping.rateInter = index; break;
        case USColumnRole.INTRASTATE: columnMapping.rateIntra = index; break;
        case USColumnRole.INDETERMINATE: columnMapping.rateIndeterminate = index; break;
      }
    });

    if (columnMapping.rateInter === -1 || columnMapping.rateIntra === -1) {
      dropzoneError.value = 'Interstate and Intrastate rate columns are required';
      return;
    }
    const hasNpanxx = columnMapping.npanxx !== undefined;
    const hasNpaAndNxx = columnMapping.npa !== undefined && columnMapping.nxx !== undefined;
    if (!hasNpanxx && !hasNpaAndNxx) {
      dropzoneError.value = 'Either NPANXX column or both NPA and NXX columns are required';
      return;
    }

    const finalProviderName =
      modalProviderName?.trim() || `Provider ${zoneId.replace('provider', '')}`;

    await service.processProviderFile(
      currentFile.value,
      zoneId,
      finalProviderName,
      columnMapping,
      startLine.value,
      indeterminateDefinition,
      // Reuse the full xlsx parse from preview (undefined for CSV → service streams it).
      xlsxRowsCache.get(zoneId)
    );
  } catch (error) {
    dropzoneError.value = `Processing failed: ${(error as Error).message}`;
  } finally {
    xlsxRowsCache.delete(zoneId); // free the cached full rows (~50K+)
    resetUploadState();
  }
};

const handleModalCancel = () => {
  showPreviewModal.value = false;
  if (currentZoneId.value) {
    xlsxRowsCache.delete(currentZoneId.value); // free the cached rows on cancel
  }
  resetUploadState();
};

const resetUploadState = () => {
  currentFile.value = null;
  currentZoneId.value = null;
  pendingRowCount.value = 0;
  columnMappings.value = {};
  isModalValid.value = false;
  startLine.value = 1;
  providerName.value = '';
};

// ── Rename ──
const startEdit = async (p: ProviderInfo) => {
  editingId.value = p.id;
  editName.value = p.name;
  await nextTick();
  editInput.value?.focus();
  editInput.value?.select();
};
const commitEdit = () => {
  if (editingId.value) store.renameProvider(editingId.value, editName.value);
  editingId.value = null;
};
const cancelEdit = () => {
  editingId.value = null;
};

// ── Remove ──
const requestRemove = (p: ProviderInfo) => {
  removingProvider.value = p;
  showConfirmModal.value = true;
};
const confirmRemove = async () => {
  if (!removingProvider.value) return;
  try {
    await service.removeProvider(removingProvider.value.id);
    showConfirmModal.value = false;
    removingProvider.value = null;
  } catch (error) {
    store.addError(`Failed to remove provider: ${(error as Error).message}`);
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Test Data Loader (Development Only) -->
    <TestDataLoader />

    <!-- Section header -->
    <div>
      <div class="flex items-center gap-3">
        <span
          class="grid h-7 w-7 place-items-center rounded-full bg-accent-soft font-secondary text-sm font-semibold text-accent ring-1 ring-accent-ring"
        >
          1
        </span>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-fg">Provider Inputs</h2>
      </div>
      <div class="mt-2 flex items-center justify-between">
        <p class="text-sm text-fg-dim">Upload up to {{ MAX_PROVIDERS }} rate decks</p>
        <p class="font-secondary text-sm text-warn">
          {{ store.providerCount }} / {{ MAX_PROVIDERS }} uploaded
        </p>
      </div>
    </div>

    <!-- Dropzone -->
    <div
      v-if="!atCapacity"
      class="relative rounded-2xl border-2 p-8 text-center transition-colors"
      :class="[
        dragOver
          ? 'border-solid border-accent bg-accent-soft'
          : 'border-dashed border-line-strong bg-surface',
        canUpload && !dragOver ? 'hover:border-accent hover:bg-row' : '',
        dropzoneError ? 'border-solid border-down' : '',
      ]"
      @dragenter.prevent="canUpload && (dragOver = true)"
      @dragover.prevent
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
    >
      <input
        v-if="canUpload && !isParsingPreview"
        type="file"
        accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        @change="handleFileChange"
      />

      <!-- Reading file (XLSX preview parse can take a few seconds) -->
      <template v-if="isParsingPreview">
        <ArrowPathIcon class="mx-auto h-10 w-10 animate-spin text-accent" />
        <p class="mt-3 font-medium text-fg">Reading file…</p>
        <p class="text-sm text-fg-dim">Parsing your rate deck</p>
      </template>

      <!-- Uploading -->
      <template v-else-if="isUploading">
        <RateGenProgressIndicator
          :total-rows="pendingRowCount"
          :progress="currentZoneId ? store.getUploadProgress(currentZoneId) : 0"
        />
      </template>

      <!-- Idle -->
      <template v-else>
        <div
          v-if="dropzoneError"
          class="mx-auto mb-3 inline-block rounded-lg bg-down-soft px-3 py-1.5 text-xs font-medium text-down"
        >
          {{ dropzoneError }}
        </div>
        <CloudArrowUpIcon class="mx-auto h-10 w-10 text-fg-faint" />
        <p class="mt-3 font-medium text-fg">Drag &amp; drop files here</p>
        <p class="text-sm text-fg-dim">or click to browse</p>
        <p class="mt-1 text-xs text-fg-faint">CSV or XLSX rate decks</p>
      </template>
    </div>

    <!-- Provider cards -->
    <div
      v-for="p in store.providerList"
      :key="p.id"
      class="rounded-2xl border border-line bg-surface p-4"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line-strong bg-row font-secondary text-xs font-semibold text-fg"
          >
            P{{ slotNumber(p) }}
          </span>
          <div class="min-w-0">
            <!-- Inline rename -->
            <div v-if="editingId === p.id" class="flex items-center gap-2">
              <input
                ref="editInput"
                v-model="editName"
                type="text"
                maxlength="40"
                class="w-44 rounded-lg border border-line bg-input px-3 py-1 text-sm text-fg placeholder-fg-mute focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                @keyup.enter="commitEdit"
                @keyup.esc="cancelEdit"
              />
              <button
                type="button"
                class="rounded-md p-1 text-accent transition-colors hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Save name"
                @click="commitEdit"
              >
                <CheckIcon class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-md p-1 text-fg-dim transition-colors hover:bg-row focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Cancel"
                @click="cancelEdit"
              >
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>
            <!-- Name + uploaded file name -->
            <template v-else>
              <h3 class="truncate text-base font-semibold leading-tight text-fg">{{ p.name }}</h3>
              <p class="truncate font-secondary text-xs text-fg-faint">{{ p.fileName }}</p>
            </template>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <button
            v-if="editingId !== p.id"
            type="button"
            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-dim transition-colors hover:bg-row hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            @click="startEdit(p)"
          >
            <PencilSquareIcon class="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            class="rounded-md p-1 text-fg-dim transition-colors hover:bg-down-soft hover:text-down focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Remove provider"
            @click="requestRemove(p)"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Stats -->
      <dl class="mt-4 grid grid-cols-3 gap-y-3">
        <div
          v-for="(s, i) in statsFor(p)"
          :key="s.label"
          :class="i % 3 === 0 ? 'pr-4' : 'border-l border-line px-4'"
        >
          <dd class="font-secondary text-sm text-fg">{{ s.value }}</dd>
          <dt class="mt-0.5 text-[10px] uppercase tracking-wider text-fg-faint">{{ s.label }}</dt>
        </div>
      </dl>
    </div>

    <!-- PreviewModal: column mapping + provider naming -->
    <PreviewModal
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="previewColumns"
      :startLine="startLine"
      :previewData="previewData"
      :columnOptions="rateGenColumnOptions"
      :validateRequired="true"
      :requireProviderName="true"
      :providerName="providerName"
      @update:mappings="columnMappings = $event"
      @update:valid="isModalValid = $event"
      @update:start-line="startLine = $event"
      @update:provider-name="providerName = $event"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

    <!-- Remove confirmation -->
    <ConfirmationModal
      v-model="showConfirmModal"
      title="Remove Provider"
      :message="`Are you sure you want to remove '${removingProvider?.name ?? ''}'? This action cannot be undone.`"
      confirm-button-text="Remove"
      cancel-button-text="Cancel"
      @confirm="confirmRemove"
    />
  </div>
</template>
