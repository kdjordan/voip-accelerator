<template>
  <transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-[200] flex items-center justify-center p-4"
      @keydown.esc="close"
    >
      <div class="absolute inset-0 bg-ink/70 backdrop-blur-sm" @click="close"></div>

      <div class="relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink-raised shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 class="flex items-center gap-2 text-base font-semibold text-white">
            <ArrowDownTrayIcon class="h-5 w-5 text-emerald-400" />
            {{ mode === 'package' ? 'Export Package' : 'Export Rates' }}
          </h3>
          <button @click="close" class="text-zinc-500 hover:text-zinc-200" aria-label="Close">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-5">
          <p class="text-sm text-zinc-400">
            Exporting the <span class="text-zinc-200">full deck</span>
            (<span class="font-secondary text-zinc-200">{{ recordCount.toLocaleString() }}</span> rows) —
            filters don't affect the export. Choose your column format.
          </p>

          <!-- NPANXX format -->
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">NPANXX Format</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="formatOptions.npanxxFormat = 'combined'"
                class="rounded-lg border px-3 py-2 text-left transition-colors"
                :class="formatOptions.npanxxFormat === 'combined' ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-white/10 hover:bg-white/[0.05]'"
              >
                <span class="block text-sm text-zinc-200">Combined</span>
                <span class="block text-[11px] text-zinc-500 font-secondary">{{ example.combined }}</span>
              </button>
              <button
                @click="formatOptions.npanxxFormat = 'split'"
                class="rounded-lg border px-3 py-2 text-left transition-colors"
                :class="formatOptions.npanxxFormat === 'split' ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-white/10 hover:bg-white/[0.05]'"
              >
                <span class="block text-sm text-zinc-200">Split NPA + NXX</span>
                <span class="block text-[11px] text-zinc-500 font-secondary">{{ example.split }}</span>
              </button>
            </div>
          </div>

          <!-- Toggles -->
          <div class="space-y-2.5">
            <label class="flex items-center gap-2.5 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" v-model="formatOptions.includeCountryCode" class="accent-emerald-400 h-4 w-4" />
              Prepend country code <span class="font-secondary text-zinc-400">“1”</span>
              <span class="text-xs text-zinc-600">(e.g. {{ example.combined }})</span>
            </label>
            <label class="flex items-center gap-2.5 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" v-model="formatOptions.includeStateColumn" class="accent-emerald-400 h-4 w-4" />
              Include State column
            </label>
            <label class="flex items-center gap-2.5 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" v-model="formatOptions.includeCountryColumn" class="accent-emerald-400 h-4 w-4" />
              Include Country column
            </label>
          </div>

          <!-- Column preview -->
          <div class="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Columns</p>
            <p class="text-[11px] font-secondary text-zinc-300 break-words">{{ previewHeaders.join(', ') }}</p>
          </div>

          <p v-if="mode === 'package'" class="flex items-start gap-2 text-xs text-zinc-500">
            <DocumentArrowDownIcon class="h-4 w-4 flex-shrink-0 mt-0.5" />
            Downloads a single <span class="font-secondary text-zinc-400">.zip</span> with the rate-deck CSV and the branded change-audit PDF.
          </p>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button
            @click="close"
            :disabled="busy"
            class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.06] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="$emit('confirm', { ...formatOptions })"
            :disabled="busy"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-ink hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

  const props = defineProps<{
    open: boolean;
    mode: 'package' | 'rates';
    recordCount: number;
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    'update:open': [value: boolean];
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
