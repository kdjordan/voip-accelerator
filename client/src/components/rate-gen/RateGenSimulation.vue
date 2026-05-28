<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import type { RateGenService } from '@/services/rate-gen.service';
import { selectLeanRecords } from '@/services/rate-gen.service';
import {
  winRateByType,
  singleSourcedCount,
  providersUsed,
  avgInterstate,
  avgIntrastate,
  avgIndeterminate,
} from '@/utils/rate-gen-aggregates';
import {
  LCR_STRATEGIES,
  type LCRConfig,
  type LCRStrategy,
  type RateGenRecord,
  type WinRateByType,
} from '@/types/domains/rate-gen-types';
import BaseButton from '@/components/shared/BaseButton.vue';
import NoticeModal from '@/components/shared/NoticeModal.vue';
import { PlusIcon, ArrowPathIcon, TrashIcon, BoltIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{ service: RateGenService }>();

// Global effective date (owned by RateGenUSView, applied to committed decks).
const effectiveDate = defineModel<string>('effectiveDate', { required: true });
const minDate = new Date().toISOString().split('T')[0];

const store = useRateGenStore();

// Sandbox limits (ADR-0008: sample 5k, scenarios ≤4, concurrent decks ≤3).
const SAMPLE_SIZE = 5000;
const MAX_SCENARIOS = 4;
const MAX_DECKS = 3;

// Stable per-provider colors (mirrors the upload/strategy cards' slot order).
const PALETTE = ['#a78bfa', '#38bdf8', '#fbbf24', '#fb7185', '#34d399'];

interface Scenario {
  id: string;
  name: string;
  strategy: LCRStrategy;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
}

interface ScenarioResult {
  id: string;
  sampleSize: number;
  winRateByType: WinRateByType;
  providersUsed: string[];
  avgInter: number;
  avgIntra: number;
  avgIndet: number;
}

// --- Loaded provider data (non-reactive internals: shallowRef + plain arrays/maps) ---
const loading = ref(true);
const loadError = ref<string | null>(null);
const dataByPrefix = shallowRef<Map<string, RateGenRecord[]>>(new Map());
const universe = shallowRef<string[]>([]); // union of all provider prefixes

// Scenario-INDEPENDENT figures — EXACT over the full union (not the sample).
const totalPrefixes = ref(0);
const singleSourced = ref(0);

// The fixed sample reused across every scenario in the comparison.
const sample = shallowRef<string[]>([]);

const scenarios = ref<Scenario[]>([]);
const results = shallowRef<ScenarioResult[]>([]);
const committingId = ref<string | null>(null);

const notice = ref<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'info' }>({
  open: false,
  title: '',
  message: '',
  variant: 'info',
});

const providers = computed(() => store.providerList);
const allProviderIds = computed(() => providers.value.map((p) => p.id));
// Current names (post-upload renames) so sample win-rates match the committed deck.
const namesById = computed(() => new Map(providers.value.map((p) => [p.id, p.name])));
const canSimulate = computed(() => providers.value.length >= 2);
const availableStrategies = computed(() => store.availableLCRStrategies as LCRStrategy[]);
const atScenarioCap = computed(() => scenarios.value.length >= MAX_SCENARIOS);
const atDeckCap = computed(() => store.generatedDecks.length >= MAX_DECKS);
const singleSourcedPct = computed(() =>
  totalPrefixes.value > 0 ? (singleSourced.value / totalPrefixes.value) * 100 : 0
);
// When the whole union fits in the sample, the sample IS the universe — there is
// nothing random to re-roll (every draw is identical), so re-roll is disabled.
const isFullUniverse = computed(() => universe.value.length <= SAMPLE_SIZE);
const justRerolled = ref(false);
let rerollTimer: ReturnType<typeof setTimeout> | undefined;

const providerColor = (name: string): string => {
  const idx = providers.value.findIndex((p) => p.name === name);
  return idx >= 0 ? PALETTE[idx % PALETTE.length] : '#71717a'; // zinc-500 for joined/unknown
};

const strategyLabel = (s: LCRStrategy): string =>
  LCR_STRATEGIES.find((o) => o.value === s)?.label ?? s;

// --- Sampling: fixed random subset of the universe (partial Fisher–Yates). ---
function drawSample(): void {
  const pool = universe.value;
  if (pool.length <= SAMPLE_SIZE) {
    sample.value = pool.slice();
    return;
  }
  const arr = pool.slice();
  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  sample.value = arr.slice(0, SAMPLE_SIZE);
}

function scenarioConfig(s: Scenario): LCRConfig {
  return {
    name: s.name.trim() || 'Scenario',
    strategy: s.strategy,
    markupPercentage: s.markupType === 'percentage' ? s.markupValue : 0,
    markupFixed: s.markupType === 'fixed' ? s.markupValue : 0,
    providerIds: allProviderIds.value,
    effectiveDate: new Date(effectiveDate.value),
  };
}

// Re-run every scenario against the SAME sample (fast: ≤4 × 5k selections).
function recompute(): void {
  if (!sample.value.length || !scenarios.value.length) {
    results.value = [];
    return;
  }
  results.value = scenarios.value.map((s) => {
    const records = selectLeanRecords(sample.value, dataByPrefix.value, scenarioConfig(s), namesById.value);
    return {
      id: s.id,
      sampleSize: records.length,
      winRateByType: winRateByType(records),
      providersUsed: providersUsed(records),
      avgInter: avgInterstate(records),
      avgIntra: avgIntrastate(records),
      avgIndet: avgIndeterminate(records),
    };
  });
}

function resultFor(id: string): ScenarioResult | undefined {
  return results.value.find((r) => r.id === id);
}

function newScenarioId(): string {
  return `scn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function addScenario(): void {
  if (atScenarioCap.value || !availableStrategies.value.length) return;
  scenarios.value.push({
    id: newScenarioId(),
    name: `Scenario ${scenarios.value.length + 1}`,
    strategy: availableStrategies.value[0],
    markupType: 'percentage',
    markupValue: 0,
  });
}

function removeScenario(id: string): void {
  scenarios.value = scenarios.value.filter((s) => s.id !== id);
}

function reroll(): void {
  if (isFullUniverse.value) return; // identical draw — nothing to do
  drawSample();
  justRerolled.value = true;
  if (rerollTimer) clearTimeout(rerollTimer);
  rerollTimer = setTimeout(() => (justRerolled.value = false), 1400);
}

async function commitScenario(s: Scenario): Promise<void> {
  if (atDeckCap.value) {
    notice.value = {
      open: true,
      title: 'Generated-deck limit reached',
      message: `You can hold up to ${MAX_DECKS} generated decks at once. Remove one from the Generated Decks tab before generating another.`,
      variant: 'info',
    };
    return;
  }
  committingId.value = s.id;
  try {
    const deck = await props.service.generateRateDeck(scenarioConfig(s));
    notice.value = {
      open: true,
      title: 'Rate deck generated',
      message: `“${deck.name}” was generated over all ${deck.rowCount.toLocaleString()} prefixes — see the Generated Decks tab.`,
      variant: 'success',
    };
  } catch (e) {
    notice.value = {
      open: true,
      title: 'Generation failed',
      message: (e as Error).message || 'Could not generate the rate deck.',
      variant: 'error',
    };
  } finally {
    committingId.value = null;
  }
}

async function loadData(): Promise<void> {
  loading.value = true;
  loadError.value = null;
  try {
    const map = await props.service.getProviderDataByPrefix();
    dataByPrefix.value = map;
    universe.value = Array.from(map.keys());
    totalPrefixes.value = universe.value.length;
    singleSourced.value = singleSourcedCount(universe.value, map, allProviderIds.value);
    drawSample();
    if (scenarios.value.length === 0) addScenario();
    recompute();
  } catch (e) {
    loadError.value = (e as Error).message || 'Failed to load provider data.';
  } finally {
    loading.value = false;
  }
}

// Recompute on any scenario edit (add/remove/strategy/markup) or a fresh sample.
watch(scenarios, recompute, { deep: true });
watch(sample, recompute);

// If a scenario's strategy stops being available (decks changed), snap to the first valid one.
watch(availableStrategies, (strategies) => {
  if (!strategies.length) return;
  for (const s of scenarios.value) {
    if (!strategies.includes(s.strategy)) s.strategy = strategies[0];
  }
});

const fmtRate = (n: number): string => n.toFixed(6);
const markupLabel = (s: Scenario): string =>
  s.markupType === 'percentage' ? `+${s.markupValue || 0}%` : `+$${(s.markupValue || 0).toFixed(4)}`;

onMounted(loadData);
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center">
      <ArrowPathIcon class="mx-auto h-6 w-6 animate-spin text-emerald-300" />
      <p class="mt-3 text-sm text-zinc-400">Loading uploaded prefixes…</p>
    </div>

    <!-- Load error -->
    <div
      v-else-if="loadError"
      class="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-sm text-rose-300"
    >
      {{ loadError }}
    </div>

    <!-- Needs ≥2 decks -->
    <div
      v-else-if="!canSimulate"
      class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center"
    >
      <h2 class="text-lg font-semibold text-white">Upload at least two provider decks</h2>
      <p class="mt-2 text-sm text-zinc-400">
        The simulation compares LCR strategies across your uploaded decks. Add a second deck on the
        Upload tab to start building scenarios.
      </p>
    </div>

    <!-- Sandbox -->
    <template v-else>
      <!-- Universe summary + sample controls (scenario-INDEPENDENT, exact) -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="flex flex-wrap gap-6">
            <div>
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Total prefixes</p>
              <p class="font-secondary text-2xl font-semibold text-white">
                {{ totalPrefixes.toLocaleString() }}
              </p>
              <p class="text-xs text-zinc-500">union of {{ providers.length }} decks · exact</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Single-sourced</p>
              <p class="font-secondary text-2xl font-semibold text-white">
                {{ singleSourced.toLocaleString() }}
              </p>
              <p class="text-xs text-zinc-500">{{ singleSourcedPct.toFixed(1) }}% · one provider only</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Simulation sample</p>
              <p class="font-secondary text-2xl font-semibold text-white">
                {{ sample.length.toLocaleString() }}
              </p>
              <p class="text-xs text-zinc-500">
                {{ isFullUniverse ? 'full universe · no sampling' : 'prefixes · shared across scenarios' }}
              </p>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1">
            <BaseButton
              variant="secondary"
              size="standard"
              :icon="ArrowPathIcon"
              :disabled="isFullUniverse"
              @click="reroll"
            >
              Re-roll sample
            </BaseButton>
            <span v-if="justRerolled" class="text-xs text-emerald-300">Re-rolled ✓</span>
            <span v-else-if="isFullUniverse" class="max-w-[12rem] text-right text-xs text-zinc-500">
              All {{ totalPrefixes.toLocaleString() }} prefixes fit the sample — nothing to re-roll.
            </span>
          </div>
        </div>
        <p class="mt-3 text-xs text-zinc-500">
          Win rates &amp; average rates are estimated from the sample; total prefixes and
          single-sourced are exact over the full union and become exact for win rates once a
          scenario is generated.
        </p>

        <!-- Effective date (applied to every generated deck) -->
        <div class="mt-4 border-t border-white/[0.07] pt-4">
          <label for="effective-date" class="mb-2 block text-sm font-medium text-zinc-300">
            Effective Date
          </label>
          <input
            id="effective-date"
            v-model="effectiveDate"
            type="date"
            :min="minDate"
            class="w-full max-w-xs rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60 [color-scheme:dark]"
          />
          <p class="mt-1.5 text-xs text-zinc-500">Applied to every generated rate deck.</p>
        </div>
      </div>

      <!-- Scenario cards (side-by-side compare) -->
      <div class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <div
          v-for="(s, i) in scenarios"
          :key="s.id"
          class="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
        >
          <!-- Header: name + remove -->
          <div class="flex items-center gap-2">
            <span
              class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-400/15 font-secondary text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
            >
              {{ i + 1 }}
            </span>
            <input
              v-model="s.name"
              type="text"
              placeholder="Scenario name"
              class="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            />
            <button
              type="button"
              class="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
              :aria-label="`Remove ${s.name}`"
              @click="removeScenario(s.id)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>

          <!-- Strategy -->
          <div class="mt-3">
            <label class="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">LCR strategy</label>
            <select
              v-model="s.strategy"
              class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-sm text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <option v-for="opt in availableStrategies" :key="opt" :value="opt">
                {{ strategyLabel(opt) }}
              </option>
            </select>
          </div>

          <!-- Markup -->
          <div class="mt-3">
            <label class="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Markup</label>
            <div class="mb-2 flex gap-3 text-xs text-zinc-300">
              <label class="flex cursor-pointer items-center gap-1.5">
                <input v-model="s.markupType" type="radio" value="percentage" class="accent-emerald-400" />
                %
              </label>
              <label class="flex cursor-pointer items-center gap-1.5">
                <input v-model="s.markupType" type="radio" value="fixed" class="accent-emerald-400" />
                Fixed $
              </label>
            </div>
            <div class="relative">
              <input
                v-model.number="s.markupValue"
                type="number"
                :step="s.markupType === 'percentage' ? '1' : '0.0001'"
                :min="0"
                placeholder="0"
                class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 pr-7 font-secondary text-sm text-white placeholder-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
              <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                {{ s.markupType === 'percentage' ? '%' : '$' }}
              </span>
            </div>
          </div>

          <!-- KPIs -->
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Providers used</p>
              <p class="font-secondary text-white">{{ resultFor(s.id)?.providersUsed.length ?? 0 }}</p>
            </div>
            <div class="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Markup</p>
              <p class="font-secondary text-emerald-300">{{ markupLabel(s) }}</p>
            </div>
          </div>

          <!-- Avg rates after markup (sample) -->
          <div class="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <p class="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">Avg rate after markup</p>
            <div class="space-y-1 font-secondary text-xs">
              <div class="flex items-center justify-between">
                <span class="text-zinc-500">Inter</span>
                <span class="text-white">${{ fmtRate(resultFor(s.id)?.avgInter ?? 0) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-zinc-500">Intra</span>
                <span class="text-white">${{ fmtRate(resultFor(s.id)?.avgIntra ?? 0) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-zinc-500">Indet</span>
                <span class="text-white">${{ fmtRate(resultFor(s.id)?.avgIndet ?? 0) }}</span>
              </div>
            </div>
          </div>

          <!-- Win rate by type (PRIMARY) -->
          <div class="mt-3 space-y-3">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500">Win rate by rate type</p>
            <div
              v-for="grp in [
                { key: 'interstate', label: 'Interstate' },
                { key: 'intrastate', label: 'Intrastate' },
                { key: 'indeterminate', label: 'Indeterminate' },
              ]"
              :key="grp.key"
            >
              <p class="mb-1 text-xs font-medium text-zinc-400">{{ grp.label }}</p>
              <div class="space-y-1">
                <div
                  v-for="row in (resultFor(s.id)?.winRateByType[grp.key as keyof WinRateByType] ?? [])"
                  :key="row.provider"
                  class="flex items-center gap-2"
                >
                  <span class="w-20 shrink-0 truncate text-[11px] text-zinc-400" :title="row.provider">{{
                    row.provider
                  }}</span>
                  <span class="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <span
                      class="absolute inset-y-0 left-0 rounded-full"
                      :style="{ width: row.percentage + '%', backgroundColor: providerColor(row.provider) }"
                    ></span>
                  </span>
                  <span class="w-10 shrink-0 text-right font-secondary text-[11px] text-zinc-300">{{
                    row.percentage.toFixed(0)
                  }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Commit -->
          <div class="mt-4 pt-3">
            <BaseButton
              variant="primary"
              size="standard"
              class="w-full"
              :icon="BoltIcon"
              :loading="committingId === s.id"
              :disabled="committingId !== null"
              @click="commitScenario(s)"
            >
              {{ committingId === s.id ? 'Generating…' : 'Generate Rate Deck' }}
            </BaseButton>
          </div>
        </div>

        <!-- Add scenario -->
        <button
          v-if="!atScenarioCap"
          type="button"
          class="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-4 text-zinc-400 transition-colors hover:border-emerald-400/40 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
          @click="addScenario"
        >
          <PlusIcon class="h-6 w-6" />
          <span class="text-sm font-medium">Add scenario</span>
          <span class="text-xs text-zinc-500">{{ scenarios.length }} / {{ MAX_SCENARIOS }}</span>
        </button>
      </div>

      <p v-if="atScenarioCap" class="text-xs text-zinc-500">
        Scenario limit reached ({{ MAX_SCENARIOS }}). Remove one to add another.
      </p>
    </template>

    <NoticeModal
      v-model="notice.open"
      :title="notice.title"
      :message="notice.message"
      :variant="notice.variant"
    />
  </div>
</template>
