<template>
  <transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-[200] flex items-center justify-center p-4"
      @keydown.esc="close"
    >
      <div class="absolute inset-0 bg-canvas/70 backdrop-blur-sm" @click="close"></div>

      <div class="relative w-full max-w-lg border border-line-strong bg-surface shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 class="flex items-center gap-2 text-base font-semibold text-fg">
            <ArrowDownTrayIcon class="h-5 w-5 text-accent" />
            {{ mode === 'package' ? 'Export Package' : 'Export Rates' }}
          </h3>
          <button @click="close" class="text-fg-faint hover:text-fg" aria-label="Close">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-5">
          <p class="text-sm text-fg-dim">
            Exporting the <span class="text-fg">full deck</span>
            (<span class="font-secondary text-fg">{{ recordCount.toLocaleString() }}</span> rows) —
            filters don't affect the export. Choose your column format.
          </p>

          <!-- File format (CSV | XLSX) -->
          <div class="flex items-center justify-between gap-2">
            <label class="text-[10px] uppercase tracking-wider text-fg-faint">File Format</label>
            <FormatToggle
              :model-value="exportFormat"
              @update:model-value="(v) => emit('update:exportFormat', v)"
            />
          </div>

          <!-- NPANXX format -->
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-fg-faint mb-1.5">NPANXX Format</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="formatOptions.npanxxFormat = 'combined'"
                class="rounded-lg border px-3 py-2 text-left transition-colors"
                :class="formatOptions.npanxxFormat === 'combined' ? 'border-accent bg-accent-soft' : 'border-line hover:bg-row'"
              >
                <span class="block text-sm text-fg">Combined</span>
                <span class="block text-[11px] text-fg-faint font-secondary">{{ example.combined }}</span>
              </button>
              <button
                @click="formatOptions.npanxxFormat = 'split'"
                class="rounded-lg border px-3 py-2 text-left transition-colors"
                :class="formatOptions.npanxxFormat === 'split' ? 'border-accent bg-accent-soft' : 'border-line hover:bg-row'"
              >
                <span class="block text-sm text-fg">Split NPA + NXX</span>
                <span class="block text-[11px] text-fg-faint font-secondary">{{ example.split }}</span>
              </button>
            </div>
          </div>

          <!-- Toggles -->
          <div class="space-y-2.5">
            <label class="flex items-center gap-2.5 text-sm text-fg-dim cursor-pointer">
              <input type="checkbox" v-model="formatOptions.includeCountryCode" class="accent-accent h-4 w-4" />
              Prepend country code <span class="font-secondary text-fg-faint">“1”</span>
              <span class="text-xs text-fg-mute">(e.g. {{ example.combined }})</span>
            </label>
            <label class="flex items-center gap-2.5 text-sm text-fg-dim cursor-pointer">
              <input type="checkbox" v-model="formatOptions.includeStateColumn" class="accent-accent h-4 w-4" />
              Include State column
            </label>
            <label class="flex items-center gap-2.5 text-sm text-fg-dim cursor-pointer">
              <input type="checkbox" v-model="formatOptions.includeCountryColumn" class="accent-accent h-4 w-4" />
              Include Country column
            </label>
          </div>

          <!-- Column preview -->
          <div class="rounded-lg border border-line bg-row p-3">
            <p class="text-[10px] uppercase tracking-wider text-fg-faint mb-1">Columns</p>
            <p class="text-[11px] font-secondary text-fg-dim break-words">{{ previewHeaders.join(', ') }}</p>
          </div>

          <p v-if="mode === 'package'" class="flex items-start gap-2 text-xs text-fg-faint">
            <DocumentArrowDownIcon class="h-4 w-4 flex-shrink-0 mt-0.5" />
            Downloads a single <span class="font-secondary text-fg-dim">.zip</span> with the rate deck (<span class="font-secondary text-fg-dim">{{ exportFormat.toUpperCase() }}</span>) and the branded change-audit PDF.
          </p>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-5 py-4 border-t border-line">
          <button
            @click="close"
            :disabled="busy"
            class="rounded-lg border border-line bg-input px-3 py-2 text-sm text-fg-dim hover:bg-row disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="$emit('confirm', { ...formatOptions })"
            :disabled="busy"
            class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon v-if="busy" class="h-4 w-4 animate-spin" />
            <ArrowDownTrayIcon v-else class="h-4 w-4" />
            {{ busy ? 'Exporting…' : 'Export' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { ArrowDownTrayIcon, XMarkIcon, ArrowPathIcon, DocumentArrowDownIcon } from '@heroicons/vue/20/solid';
  import { useUSExportConfig } from '@/composables/exports/useUSExportConfig';
  import FormatToggle from '@/components/shared/FormatToggle.vue';
  import type { TabularFormat } from '@/utils/tabular-io';

  const props = defineProps<{
    open: boolean;
    mode: 'package' | 'rates';
    recordCount: number;
    busy?: boolean;
    exportFormat: TabularFormat;
  }>();

  const emit = defineEmits<{
    'update:open': [value: boolean];
    'update:exportFormat': [value: TabularFormat];
    confirm: [options: ReturnType<typeof useUSExportConfig>['formatOptions']['value']];
  }>();

  // Persisted format prefs (localStorage) shared with the rest of the export system.
  const { formatOptions } = useUSExportConfig();

  function close() {
    if (props.busy) return;
    emit('update:open', false);
  }

  const example = computed(() => {
    const one = formatOptions.value.includeCountryCode ? '1' : '';
    return { combined: `${one}201200`, split: `${one}201 · 200` };
  });

  const previewHeaders = computed(() => {
    const h: string[] = [];
    if (formatOptions.value.npanxxFormat === 'split') h.push('NPA', 'NXX');
    else h.push('NPANXX');
    if (formatOptions.value.includeStateColumn) h.push('State');
    if (formatOptions.value.includeCountryColumn) h.push('Country');
    h.push('Interstate Rate', 'Intrastate Rate', 'Indeterminate Rate', 'Effective Date');
    return h;
  });
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.15s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
