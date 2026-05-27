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
} from '@heroicons/vue/24/outline';
import PreviewModal from '@/components/shared/PreviewModal.vue';
import RateGenProgressIndicator from '@/components/rate-gen/RateGenProgressIndicator.vue';
import TestDataLoader from '@/components/rate-gen/TestDataLoader.vue';
import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
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

// Solid identity color per provider slot (matches the target mock: violet, blue, …).
const AVATAR_STYLES = [
  'bg-violet-500/90 text-white',
  'bg-sky-500/90 text-white',
  'bg-amber-500/90 text-white',
  'bg-rose-500/90 text-white',
  'bg-emerald-500/90 text-white',
];

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
  () => !store.isProcessing && !showPreviewModal.value && store.getNextAvailableSlot() !== null
);

const slotNumber = (p: ProviderInfo): number => parseInt(p.id.replace('provider', ''), 10) || 1;
const avatarStyle = (p: ProviderInfo): string =>
  AVATAR_STYLES[(slotNumber(p) - 1) % AVATAR_STYLES.length];

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

  if (!file.name.toLowerCase().endsWith('.csv')) {
    dropzoneError.value = 'Please upload a CSV file';
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

const parseFileForPreview = (file: File): Promise<void> =>
  new Promise((resolve, reject) => {
    const previewRows: string[][] = [];
    let rowCount = 0;
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      step: (results) => {
        if (rowCount < 20) previewRows.push(results.data as string[]);
        rowCount++;
      },
      complete: () => {
        if (previewRows.length === 0) {
          reject(new Error('No data found in CSV file'));
          return;
        }
        pendingRowCount.value = Math.max(0, rowCount - 1);
        previewData.value = previewRows;
        previewColumns.value = previewRows[0] || [];
        columnMappings.value = {};
        isModalValid.value = false;
        startLine.value = 1;
        providerName.value = `Provider ${currentZoneId.value?.replace('provider', '') ?? ''}`.trim();
        showPreviewModal.value = true;
        resolve();
      },
      error: (error) => reject(new Error(`CSV parsing error: ${error.message}`)),
    });
  });

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
      indeterminateDefinition
    );
  } catch (error) {
    dropzoneError.value = `Processing failed: ${(error as Error).message}`;
  } finally {
    resetUploadState();
  }
};

const handleModalCancel = () => {
  showPreviewModal.value = false;
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
          class="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/15 font-secondary text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
        >
          1
        </span>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-white">Provider Inputs</h2>
      </div>
      <div class="mt-2 flex items-center justify-between">
        <p class="text-sm text-zinc-400">Upload up to {{ MAX_PROVIDERS }} rate decks</p>
        <p class="font-secondary text-sm text-emerald-300">
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
          ? 'border-solid border-emerald-400 bg-emerald-400/[0.07]'
          : 'border-dashed border-white/15 bg-white/[0.02]',
        canUpload && !dragOver ? 'hover:border-emerald-400/50 hover:bg-white/[0.02]' : '',
        dropzoneError ? 'border-solid border-rose-500' : '',
      ]"
      @dragenter.prevent="canUpload && (dragOver = true)"
      @dragover.prevent
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
    >
      <input
        v-if="canUpload"
        type="file"
        accept=".csv"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        @change="handleFileChange"
      />

      <!-- Uploading -->
      <template v-if="isUploading">
        <RateGenProgressIndicator
          :total-rows="pendingRowCount"
          :progress="currentZoneId ? store.getUploadProgress(currentZoneId) : 0"
        />
      </template>

      <!-- Idle -->
      <template v-else>
        <div
          v-if="dropzoneError"
          class="mx-auto mb-3 inline-block rounded-lg bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-300"
        >
          {{ dropzoneError }}
        </div>
        <CloudArrowUpIcon class="mx-auto h-10 w-10 text-zinc-500" />
        <p class="mt-3 font-medium text-white">Drag &amp; drop files here</p>
        <p class="text-sm text-zinc-400">or click to browse</p>
        <p class="mt-1 text-xs text-zinc-500">CSV rate decks only</p>
      </template>
    </div>

    <!-- Provider cards -->
    <div
      v-for="p in store.providerList"
      :key="p.id"
      class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="grid h-9 w-9 shrink-0 place-items-center rounded-full font-secondary text-xs font-semibold"
            :class="avatarStyle(p)"
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
                class="w-44 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-white placeholder-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                @keyup.enter="commitEdit"
                @keyup.esc="cancelEdit"
              />
              <button
                type="button"
                class="rounded-md p-1 text-emerald-300 transition-colors hover:bg-emerald-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                aria-label="Save name"
                @click="commitEdit"
              >
                <CheckIcon class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                aria-label="Cancel"
                @click="cancelEdit"
              >
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>
            <!-- Name + uploaded file name -->
            <template v-else>
              <h3 class="truncate text-base font-semibold leading-tight text-white">{{ p.name }}</h3>
              <p class="truncate font-secondary text-xs text-zinc-500">{{ p.fileName }}</p>
            </template>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <button
            v-if="editingId !== p.id"
            type="button"
            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            @click="startEdit(p)"
          >
            <PencilSquareIcon class="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            class="rounded-md p-1 text-zinc-400 transition-colors hover:bg-rose-400/10 hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
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
          :class="i % 3 === 0 ? 'pr-4' : 'border-l border-white/[0.06] px-4'"
        >
          <dd class="font-secondary text-sm text-white">{{ s.value }}</dd>
          <dt class="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{{ s.label }}</dt>
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
      variant="destructive"
      @confirm="confirmRemove"
    />
  </div>
</template>
