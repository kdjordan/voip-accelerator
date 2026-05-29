<template>
  <div class="flex-1 flex flex-col items-center justify-center w-full space-y-4 px-8">
    <!-- Indeterminate: still parsing (e.g. unzipping an .xlsx) and the row count
         isn't known yet — show a spinner, not a frozen-looking 0% / 0-of-0 bar. -->
    <div v-if="indeterminate" class="flex flex-col items-center gap-3">
      <ArrowPathIcon class="h-8 w-8 animate-spin text-accent" />
      <span class="text-sm text-fg-dim">{{ statusText }}</span>
    </div>

    <!-- Progress Bar Container -->
    <div v-else class="w-full max-w-md space-y-2">
      <!-- Status Text -->
      <div class="flex justify-between items-center text-sm">
        <span class="flex items-center gap-2 text-fg-dim">
          <!-- Bar is full at 100%+ but a metadata/stats routine runs a few more
               seconds — a spinner shows it's still working, not done. -->
          <ArrowPathIcon v-if="isGatheringMeta" class="h-4 w-4 animate-spin text-accent" />
          {{ statusText }}
        </span>
        <span class="font-medium text-accent">{{ pct }}%</span>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-row rounded-full h-2.5 overflow-hidden">
        <div
          class="h-full rounded-full bg-accent transition-all duration-300 ease-out"
          :style="`width: ${pct}%;`"
        />
      </div>

      <!-- Row count (no time estimate — just rows processed of total) -->
      <div class="text-xs text-fg-faint">
        {{ formattedRowsProcessed }}{{ totalRows ? ` of ${formattedTotalRows}` : '' }} rows
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowPathIcon } from '@heroicons/vue/24/outline';

interface Props {
  // 0–110. <100 = determinate bar; 100–110 = metadata-gathering band (bar full +
  // spinner); the indicator is normally unmounted by its parent once work is done.
  progress: number;
  totalRows?: number;
  // Optional explicit count; when omitted it's derived from progress × totalRows.
  rowsProcessed?: number;
  // Optional status-text override; when omitted, derived from the progress band.
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  totalRows: 0,
});

// Bar is clamped to 100 (progress can run to 110 for the metadata band).
const pct = computed(() => Math.min(100, Math.round(props.progress)));

// 100–110 = post-write metadata gathering: bar is full but a stats routine is
// still running, so show a spinner next to the label.
const isGatheringMeta = computed(() => props.progress >= 100 && props.progress < 110);

// Indeterminate while we don't yet know the row count and the determinate bar
// hasn't started — drives the spinner instead of a misleading 0% / 0-of-0 bar.
const indeterminate = computed(
  () => (!props.totalRows || props.totalRows <= 0) && props.progress < 100
);

// Rows processed: explicit when provided, else derived from progress (clamped to total).
const formattedRowsProcessed = computed(() => {
  const value =
    props.rowsProcessed ??
    Math.floor((props.totalRows * Math.min(100, props.progress)) / 100);
  return value.toLocaleString();
});
const formattedTotalRows = computed(() => props.totalRows.toLocaleString());

const statusText = computed(() => {
  if (props.label) return props.label;
  if (props.progress < 30) return 'Reading file...';
  if (props.progress < 70) return 'Validating data...';
  if (props.progress < 100) return 'Storing on your browser...';
  if (props.progress <= 105) return 'Gathering metadata...';
  return 'Processing complete!';
});
</script>
