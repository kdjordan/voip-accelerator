<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import type { LCRConfig, LCRStrategy, ProviderInfo } from '@/types/domains/rate-gen-types';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/vue/24/outline';
import BaseButton from '@/components/shared/BaseButton.vue';
import InlineGenerationProgress from '@/components/rate-gen/InlineGenerationProgress.vue';

const emit = defineEmits<{ 'generate-rates': [] }>();

const store = useRateGenStore();

// Solid identity color per provider slot (mirrors the upload cards).
const AVATAR_STYLES = [
  'bg-violet-500/90 text-white',
  'bg-sky-500/90 text-white',
  'bg-amber-500/90 text-white',
  'bg-rose-500/90 text-white',
  'bg-emerald-500/90 text-white',
];
const slotNumber = (p: ProviderInfo): number => parseInt(p.id.replace('provider', ''), 10) || 1;
const avatarStyle = (p: ProviderInfo): string =>
  AVATAR_STYLES[(slotNumber(p) - 1) % AVATAR_STYLES.length];

const getDefaultEffectiveDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

const config = ref({
  name: '',
  strategy: '' as '' | LCRStrategy,
  markupType: 'percentage' as 'percentage' | 'fixed',
  markupValue: 0,
  effectiveDate: getDefaultEffectiveDate(),
});

const selectedProviderIds = ref<Set<string>>(new Set());
watch(
  () => store.providerList,
  (providers) => {
    if (providers.length > 0 && selectedProviderIds.value.size === 0) {
      selectedProviderIds.value = new Set(providers.map((p) => p.id));
    }
  },
  { immediate: true }
);

const providerCount = computed(() => selectedProviderIds.value.size);
const minDate = computed(() => new Date().toISOString().split('T')[0]);

// LCR depth options scale with the number of SELECTED decks (existing rule, +Average at ≥2).
const lcrDepths = computed(() => {
  const n = providerCount.value;
  const ordinals = ['lowest', '2nd lowest', '3rd lowest', '4th lowest', '5th lowest'];
  const depths: { value: LCRStrategy; label: string; desc: string }[] = [];
  for (let i = 1; i <= Math.min(n, 5); i++) {
    depths.push({
      value: `LCR${i}` as LCRStrategy,
      label: `LCR ${i}`,
      desc: `Use ${ordinals[i - 1]} cost route`,
    });
  }
  if (n >= 2) {
    depths.push({ value: 'Average', label: 'Average', desc: `Average of all ${n} rates` });
  }
  return depths;
});

const selectedProviders = computed(() =>
  store.providerList.filter((p) => selectedProviderIds.value.has(p.id))
);

// Preview Markup Impact — mean of selected decks' avg rates, then markup applied.
const baseAvg = computed(() => {
  const ps = selectedProviders.value;
  const mean = (k: 'avgInterRate' | 'avgIntraRate' | 'avgIndeterminateRate') =>
    ps.length ? ps.reduce((s, p) => s + p[k], 0) / ps.length : 0;
  return { inter: mean('avgInterRate'), intra: mean('avgIntraRate'), indet: mean('avgIndeterminateRate') };
});
const markedUp = (rate: number): number =>
  config.value.markupType === 'percentage'
    ? rate * (1 + config.value.markupValue / 100)
    : rate + config.value.markupValue;
const markupBadge = computed(() =>
  config.value.markupType === 'percentage'
    ? `+${config.value.markupValue || 0}%`
    : `+$${(config.value.markupValue || 0).toFixed(4)}`
);

// "How LCR Works" — live illustration using selected decks' avg interstate rate.
const sortedByInter = computed(() =>
  [...selectedProviders.value].sort((a, b) => a.avgInterRate - b.avgInterRate)
);
const lcrPickIndex = computed(() => {
  const s = config.value.strategy;
  if (!s || s === 'Average') return -1;
  const depth = parseInt(s.replace('LCR', ''), 10);
  return Math.min(depth - 1, sortedByInter.value.length - 1);
});

const isConfigValid = computed(
  () =>
    !!config.value.name &&
    !!config.value.strategy &&
    config.value.markupValue > 0 &&
    selectedProviderIds.value.size >= 1
);

watch(
  [config, selectedProviderIds],
  ([newConfig, newSelectedIds]) => {
    if (newConfig.name && newConfig.strategy && newConfig.markupValue > 0 && newSelectedIds.size >= 1) {
      const lcrConfig: LCRConfig = {
        strategy: newConfig.strategy as LCRStrategy,
        markupPercentage: newConfig.markupType === 'percentage' ? newConfig.markupValue : 0,
        markupFixed: newConfig.markupType === 'fixed' ? newConfig.markupValue : 0,
        providerIds: Array.from(newSelectedIds),
        name: newConfig.name,
        effectiveDate: new Date(newConfig.effectiveDate),
      };
      store.setConfig(lcrConfig);
    } else {
      store.setConfig(null);
    }
  },
  { deep: true }
);

// If the selected depth is no longer valid (e.g. decks deselected), reset it.
watch(lcrDepths, (depths) => {
  if (config.value.strategy && !depths.some((d) => d.value === config.value.strategy)) {
    config.value.strategy = '';
  }
});

function isProviderSelected(id: string): boolean {
  return selectedProviderIds.value.has(id);
}
function toggleProvider(id: string) {
  const next = new Set(selectedProviderIds.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selectedProviderIds.value = next;
}

const explainer = ref<HTMLElement | null>(null);
function scrollToExplainer() {
  explainer.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatRate(rate: number): string {
  return !rate ? '0.000000' : rate.toFixed(6);
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Section header -->
    <div class="flex items-center gap-3">
      <span
        class="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/15 font-secondary text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
      >
        2
      </span>
      <h2 class="text-sm font-semibold uppercase tracking-wider text-white">Generation Strategy</h2>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- LEFT: strategy controls (2/3) -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Rate Deck Name -->
        <div>
          <label for="rate-deck-name" class="mb-2 block text-sm font-medium text-zinc-300">Rate Deck Name</label>
          <input
            id="rate-deck-name"
            v-model="config.name"
            type="text"
            placeholder="Enter rate deck name"
            class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white placeholder-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          />
        </div>

        <!-- LCR Depth -->
        <div>
          <div class="mb-2 flex items-center justify-between">
            <label class="text-sm font-medium text-zinc-300">LCR (Least Cost Routing) Depth</label>
            <button
              type="button"
              class="rounded text-xs font-medium text-emerald-300 transition-colors hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
              @click="scrollToExplainer"
            >
              What is LCR?
            </button>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="d in lcrDepths"
              :key="d.value"
              type="button"
              class="rounded-xl border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
              :class="
                config.strategy === d.value
                  ? 'border-emerald-400/60 bg-emerald-400/10'
                  : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20'
              "
              @click="config.strategy = d.value"
            >
              <div class="flex items-center justify-between">
                <span
                  class="font-medium"
                  :class="config.strategy === d.value ? 'text-emerald-300' : 'text-white'"
                  >{{ d.label }}</span
                >
                <CheckCircleIcon v-if="config.strategy === d.value" class="h-4 w-4 text-emerald-300" />
              </div>
              <p class="mt-1 text-xs text-zinc-500">{{ d.desc }}</p>
            </button>
          </div>
        </div>

        <!-- Markup -->
        <div>
          <label class="mb-2 block text-sm font-medium text-zinc-300">Markup Configuration</label>
          <div class="mb-3 flex gap-4">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input v-model="config.markupType" type="radio" value="percentage" class="accent-emerald-400" />
              Percentage
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input v-model="config.markupType" type="radio" value="fixed" class="accent-emerald-400" />
              Fixed Amount
            </label>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <div class="relative">
                <input
                  v-model.number="config.markupValue"
                  type="number"
                  :step="config.markupType === 'percentage' ? '1' : '0.0001'"
                  :min="0"
                  placeholder="0"
                  class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 pr-9 font-secondary text-white placeholder-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
                <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{{
                  config.markupType === 'percentage' ? '%' : '$'
                }}</span>
              </div>
              <p class="mt-1.5 text-xs text-zinc-500">Applies to all rates in the generated deck</p>
            </div>

            <!-- Preview Markup Impact -->
            <div class="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <p class="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">Preview Markup Impact</p>
              <div class="space-y-1.5 font-secondary text-xs">
                <div
                  v-for="row in [
                    { k: 'Inter', base: baseAvg.inter },
                    { k: 'Intra', base: baseAvg.intra },
                    { k: 'Indet', base: baseAvg.indet },
                  ]"
                  :key="row.k"
                  class="flex items-center justify-between gap-2"
                >
                  <span class="text-zinc-500">Avg {{ row.k }}</span>
                  <span class="text-zinc-400">${{ formatRate(row.base) }}</span>
                  <span class="text-zinc-600">→</span>
                  <span class="text-white">${{ formatRate(markedUp(row.base)) }}</span>
                  <span class="text-emerald-300">{{ markupBadge }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Effective Date -->
        <div>
          <label for="effective-date" class="mb-2 block text-sm font-medium text-zinc-300">Effective Date</label>
          <input
            id="effective-date"
            v-model="config.effectiveDate"
            type="date"
            :min="minDate"
            class="w-full max-w-xs rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60 [color-scheme:dark]"
          />
        </div>
      </div>

      <!-- RIGHT: deck summary + selection (1/3) -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        <h3 class="text-sm font-semibold text-white">Deck Summary</h3>
        <p class="mt-0.5 text-xs text-zinc-500">Effective {{ formatDate(config.effectiveDate) }}</p>

        <div class="mt-4 space-y-2">
          <button
            v-for="p in store.providerList"
            :key="p.id"
            type="button"
            class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            :class="
              isProviderSelected(p.id)
                ? 'border-emerald-400/40 bg-emerald-400/[0.06]'
                : 'border-white/[0.07] bg-white/[0.02] opacity-60 hover:opacity-100'
            "
            @click="toggleProvider(p.id)"
          >
            <span
              class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full font-secondary text-[10px] font-semibold"
              :class="avatarStyle(p)"
              >P{{ slotNumber(p) }}</span
            >
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="truncate text-sm font-medium text-white">{{ p.name }}</span>
                <CheckCircleIcon v-if="isProviderSelected(p.id)" class="h-4 w-4 shrink-0 text-emerald-300" />
              </span>
              <span class="mt-1 block space-y-0.5 font-secondary text-[11px] text-zinc-500">
                <span class="block">INTER ${{ formatRate(p.avgInterRate) }}</span>
                <span class="block">INTRA ${{ formatRate(p.avgIntraRate) }}</span>
                <span class="block">INDET ${{ formatRate(p.avgIndeterminateRate) }}</span>
              </span>
            </span>
          </button>
        </div>

        <InlineGenerationProgress
          :is-generating="store.isGenerating"
          :progress="store.generationProgress"
          :provider-count="selectedProviderIds.size"
        />
      </div>
    </div>

    <!-- How LCR Works -->
    <div ref="explainer" class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <h3 class="text-sm font-semibold text-white">How LCR Works</h3>
      <p class="mt-1 text-xs text-zinc-500">
        Interstate rates from your selected decks, lowest first.
        {{ config.strategy ? `Current selection: ${config.strategy}.` : 'Pick an LCR depth above.' }}
      </p>
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <div
          v-for="(p, i) in sortedByInter"
          :key="p.id"
          class="flex items-center justify-between rounded-lg border px-3 py-2"
          :class="
            i === lcrPickIndex
              ? 'border-emerald-400/50 bg-emerald-400/10'
              : 'border-white/[0.06] bg-white/[0.02]'
          "
        >
          <span class="flex items-center gap-2">
            <span
              class="grid h-6 w-6 place-items-center rounded-full font-secondary text-[10px] font-semibold"
              :class="avatarStyle(p)"
              >{{ i + 1 }}</span
            >
            <span class="truncate text-sm text-zinc-300">{{ p.name }}</span>
          </span>
          <span class="flex items-center gap-2 font-secondary text-sm text-white">
            ${{ formatRate(p.avgInterRate) }}
            <CheckCircleIcon v-if="i === lcrPickIndex" class="h-4 w-4 text-emerald-300" />
          </span>
        </div>
      </div>
      <p v-if="config.strategy === 'Average'" class="mt-3 text-xs text-emerald-300">
        Average strategy: every rate above is averaged, then markup applied.
      </p>
      <p v-else-if="config.markupValue > 0" class="mt-3 text-xs text-zinc-500">
        Selected route, then markup applied ({{ markupBadge }}).
      </p>
    </div>

    <!-- Generate -->
    <div class="flex justify-end">
      <BaseButton
        variant="primary"
        size="standard"
        :icon="ArrowRightIcon"
        :disabled="!isConfigValid"
        :loading="store.isGenerating"
        @click="emit('generate-rates')"
      >
        {{ store.isGenerating ? `Generating… ${store.generationProgress.toFixed(0)}%` : 'Generate' }}
      </BaseButton>
    </div>
  </div>
</template>
