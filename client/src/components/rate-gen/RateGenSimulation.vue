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
  type LCRConfig,
  type RateGenRecord,
  type Scenario,
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

// The fixed sample (store.simulationSample) and the scenarios (store.scenarios)
// are persisted in the rate-gen store so they survive leaving/returning to this
// tab (which unmounts the component). Derived results stay local.
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
// Max depth = number of uploaded decks; depth options are 1..maxDepth.
const maxDepth = computed(() => store.maxLcrDepth);
const depthOptions = computed(() => Array.from({ length: maxDepth.value }, (_, i) => i + 1));
// Relabel the win-rate chart as participation when any scenario averages (a
// contributor can be in multiple selections, so shares can sum past 100%).
const anyAverage = computed(() => store.scenarios.some((s) => s.mode === 'average'));
const atScenarioCap = computed(() => store.scenarios.length >= MAX_SCENARIOS);
const atDeckCap = computed(() => store.generatedDecks.length >= MAX_DECKS);
const singleSourcedPct = computed(() =>
  totalPrefixes.value > 0 ? (singleSourced.value / totalPrefixes.value) * 100 : 0
);
// When the whole union fits in the sample, the sample IS the universe — there is
// nothing random to re-roll (every draw is identical), so re-roll is disabled.
const isFullUniverse = computed(() => universe.value.length <= SAMPLE_SIZE);
const justRerolled = ref(false);
let rerollTimer: ReturnType<typeof setTimeout> | undefined;

// --- Sampling: fixed random subset of the universe (partial Fisher–Yates).
// Draws a fresh sample and stores it (persisted across tab navigation). ---
function drawSample(): void {
  const pool = universe.value;
  if (pool.length <= SAMPLE_SIZE) {
    store.setSimulationSample(pool.slice());
    return;
  }
  const arr = pool.slice();
  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  store.setSimulationSample(arr.slice(0, SAMPLE_SIZE));
}

function scenarioConfig(s: Scenario): LCRConfig {
  return {
    name: s.name.trim() || 'Scenario',
    depth: s.depth,
    mode: s.mode,
    markupPercentage: s.markupType === 'percentage' ? s.markupValue : 0,
    markupFixed: s.markupType === 'fixed' ? s.markupValue : 0,
    providerIds: allProviderIds.value,
    effectiveDate: new Date(effectiveDate.value),
  };
}

// Re-run every scenario against the SAME sample (fast: ≤4 × 5k selections).
function recompute(): void {
  const sample = store.simulationSample;
  if (!sample.length || !store.scenarios.length) {
    results.value = [];
    return;
  }
  results.value = store.scenarios.map((s) => {
    const records = selectLeanRecords(sample, dataByPrefix.value, scenarioConfig(s), namesById.value);
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
  if (atScenarioCap.value || maxDepth.value < 1) return;
  store.addScenario({
    id: newScenarioId(),
    name: `Scenario ${store.scenarios.length + 1}`,
    depth: 1,
    mode: 'position',
    markupType: 'percentage',
    markupValue: 0,
  });
}

function removeScenario(id: string): void {
  store.removeScenario(id);
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
    // Reuse persisted inputs when returning to the tab: only draw a fresh sample
    // / seed the first scenario on first visit (store empty). recompute() then
    // re-derives results from the reused sample + scenarios — same comparison.
    if (store.simulationSample.length === 0) drawSample();
    if (store.scenarios.length === 0) addScenario();
    recompute();
  } catch (e) {
    loadError.value = (e as Error).message || 'Failed to load provider data.';
  } finally {
    loading.value = false;
  }
}

// Recompute on any scenario edit (add/remove/strategy/markup) or a fresh sample.
watch(() => store.scenarios, recompute, { deep: true });
watch(() => store.simulationSample, recompute);

// If decks are removed, clamp any scenario depth that now exceeds the deck count.
watch(maxDepth, (max) => {
  if (max < 1) return;
  for (const s of store.scenarios) {
    if (s.depth > max) s.depth = max;
  }
});

const fmtRate = (n: number): string => n.toFixed(6);
const markupLabel = (s: Scenario): string =>
  s.markupType === 'percentage' ? `+${s.markupValue || 0}%` : `+$${(s.markupValue || 0).toFixed(4)}`;

// Plain-language explanation of a scenario's depth+mode selection.
const selectionHint = (s: Scenario): string =>
  s.mode === 'average'
    ? `Mean of the ${s.depth} cheapest ${s.depth === 1 ? 'rate' : 'rates'} per jurisdiction`
    : `The depth-${s.depth} cheapest rate per jurisdiction (LCR${s.depth})`;

onMounted(loadData);
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="rounded-2xl border border-line bg-surface p-8 text-center">
      <ArrowPathIcon class="mx-auto h-6 w-6 animate-spin text-accent" />
      <p class="mt-3 text-sm text-fg-dim">Loading uploaded prefixes…</p>
    </div>

    <!-- Load error -->
    <div
      v-else-if="loadError"
      class="rounded-2xl border border-down bg-down-soft p-6 text-center text-sm text-down"
    >
      {{ loadError }}
    </div>

    <!-- Needs ≥2 decks -->
    <div
      v-else-if="!canSimulate"
      class="rounded-2xl border border-line bg-surface p-8 text-center"
    >
      <h2 class="text-lg font-semibold text-fg">Upload at least two provider decks</h2>
      <p class="mt-2 text-sm text-fg-dim">
        The simulation compares LCR strategies across your uploaded decks. Add a second deck on the
        Upload tab to start building scenarios.
      </p>
    </div>

    <!-- Sandbox -->
    <template v-else>
      <!-- Universe summary + sample controls (scenario-INDEPENDENT, exact) -->
      <div class="rounded-2xl border border-line bg-surface p-5">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="flex flex-wrap gap-6">
            <div>
              <p class="text-[10px] uppercase tracking-wider text-fg-faint">Total prefixes</p>
              <p class="font-secondary text-2xl font-semibold text-fg">
                {{ totalPrefixes.toLocaleString() }}
              </p>
              <p class="text-xs text-fg-faint">union of {{ providers.length }} decks · exact</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-fg-faint">Single-sourced</p>
              <p class="font-secondary text-2xl font-semibold text-fg">
                {{ singleSourced.toLocaleString() }}
              </p>
              <p class="text-xs text-fg-faint">{{ singleSourcedPct.toFixed(1) }}% · one provider only</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-fg-faint">Simulation sample</p>
              <p class="font-secondary text-2xl font-semibold text-fg">
                {{ store.simulationSample.length.toLocaleString() }}
              </p>
              <p class="text-xs text-fg-faint">
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
            <span v-if="justRerolled" class="text-xs text-warn">Re-rolled ✓</span>
            <span v-else-if="isFullUniverse" class="max-w-[12rem] text-right text-xs text-fg-faint">
              All {{ totalPrefixes.toLocaleString() }} prefixes fit the sample — nothing to re-roll.
            </span>
          </div>
        </div>
        <p class="mt-3 text-xs text-fg-faint">
          Win rates &amp; average rates are estimated from the sample; total prefixes and
          single-sourced are exact over the full union and become exact for win rates once a
          scenario is generated.
        </p>

        <!-- Effective date (applied to every generated deck) -->
        <div class="mt-4 border-t border-line pt-4">
          <label for="effective-date" class="mb-2 block text-sm font-medium text-fg-dim">
            Effective Date
          </label>
          <input
            id="effective-date"
            v-model="effectiveDate"
            type="date"
            :min="minDate"
            class="w-full max-w-xs rounded-lg border border-line bg-input px-3 py-2 text-fg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p class="mt-1.5 text-xs text-fg-faint">Applied to every generated rate deck.</p>
        </div>
      </div>

      <!-- Scenario cards (side-by-side compare) -->
      <div class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <div
          v-for="(s, i) in store.scenarios"
          :key="s.id"
          class="flex flex-col rounded-2xl border border-line bg-surface p-4"
        >
          <!-- Header: name + remove -->
          <div class="flex items-center gap-2">
            <span
              class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft font-secondary text-xs font-semibold text-accent ring-1 ring-accent-ring"
            >
              {{ i + 1 }}
            </span>
            <input
              v-model="s.name"
              type="text"
              placeholder="Scenario name"
              class="min-w-0 flex-1 rounded-lg border border-line bg-input px-2.5 py-1.5 text-sm text-fg placeholder-fg-mute focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              class="shrink-0 rounded-md p-1.5 text-fg-faint transition-colors hover:bg-row hover:text-down focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              :aria-label="`Remove ${s.name}`"
              @click="removeScenario(s.id)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>

          <!-- Selection: depth + mode -->
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label class="mb-1 block text-[10px] uppercase tracking-wider text-fg-faint">Depth</label>
              <select
                v-model.number="s.depth"
                class="w-full rounded-lg border border-line bg-input px-2.5 py-1.5 text-sm text-fg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option v-for="d in depthOptions" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-[10px] uppercase tracking-wider text-fg-faint">Mode</label>
              <div class="grid grid-cols-2 gap-1 rounded-lg border border-line bg-input p-0.5">
                <button
                  type="button"
                  class="rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  :class="s.mode === 'position' ? 'bg-accent-soft text-accent ring-1 ring-accent-ring' : 'text-fg-dim hover:text-fg'"
                  @click="s.mode = 'position'"
                >
                  Position
                </button>
                <button
                  type="button"
                  class="rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  :class="s.mode === 'average' ? 'bg-accent-soft text-accent ring-1 ring-accent-ring' : 'text-fg-dim hover:text-fg'"
                  @click="s.mode = 'average'"
                >
                  Average
                </button>
              </div>
            </div>
          </div>
          <p class="mt-1.5 text-[11px] text-fg-faint">{{ selectionHint(s) }}</p>

          <!-- Markup -->
          <div class="mt-3">
            <label class="mb-1 block text-[10px] uppercase tracking-wider text-fg-faint">Markup</label>
            <div class="mb-2 flex gap-3 text-xs text-fg-dim">
              <label class="flex cursor-pointer items-center gap-1.5">
                <input v-model="s.markupType" type="radio" value="percentage" class="accent-accent" />
                %
              </label>
              <label class="flex cursor-pointer items-center gap-1.5">
                <input v-model="s.markupType" type="radio" value="fixed" class="accent-accent" />
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
                class="w-full rounded-lg border border-line bg-input px-2.5 py-1.5 pr-7 font-secondary text-sm text-fg placeholder-fg-mute focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-fg-faint">
                {{ s.markupType === 'percentage' ? '%' : '$' }}
              </span>
            </div>
          </div>

          <!-- KPIs -->
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg border border-line bg-row px-2.5 py-2">
              <p class="text-[10px] uppercase tracking-wider text-fg-faint">Providers used</p>
              <p class="font-secondary text-fg">{{ resultFor(s.id)?.providersUsed.length ?? 0 }}</p>
            </div>
            <div class="rounded-lg border border-line bg-row px-2.5 py-2">
              <p class="text-[10px] uppercase tracking-wider text-fg-faint">Markup</p>
              <p class="font-secondary text-accent">{{ markupLabel(s) }}</p>
            </div>
          </div>

          <!-- Avg rates after markup (sample) -->
          <div class="mt-2 rounded-lg border border-line bg-row px-2.5 py-2">
            <p class="mb-1 text-[10px] uppercase tracking-wider text-fg-faint">Avg rate after markup</p>
            <div class="space-y-1 font-secondary text-xs">
              <div class="flex items-center justify-between">
                <span class="text-fg-faint">Inter</span>
                <span class="text-fg">${{ fmtRate(resultFor(s.id)?.avgInter ?? 0) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-fg-faint">Intra</span>
                <span class="text-fg">${{ fmtRate(resultFor(s.id)?.avgIntra ?? 0) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-fg-faint">Indet</span>
                <span class="text-fg">${{ fmtRate(resultFor(s.id)?.avgIndet ?? 0) }}</span>
              </div>
            </div>
          </div>

          <!-- Win rate / participation by type (PRIMARY) -->
          <div class="mt-3 space-y-3">
            <p class="text-[10px] uppercase tracking-wider text-fg-faint">
              {{ anyAverage ? 'Provider participation by rate type' : 'Win rate by rate type' }}
            </p>
            <div
              v-for="grp in [
                { key: 'interstate', label: 'Interstate' },
                { key: 'intrastate', label: 'Intrastate' },
                { key: 'indeterminate', label: 'Indeterminate' },
              ]"
              :key="grp.key"
            >
              <p class="mb-1 text-xs font-medium text-fg-dim">{{ grp.label }}</p>
              <div class="space-y-1">
                <div
                  v-for="row in (resultFor(s.id)?.winRateByType[grp.key as keyof WinRateByType] ?? [])"
                  :key="row.provider"
                  class="flex items-center gap-2"
                >
                  <span class="w-20 shrink-0 truncate text-[11px] text-fg-dim" :title="row.provider">{{
                    row.provider
                  }}</span>
                  <span class="relative h-2 flex-1 overflow-hidden rounded-full bg-row">
                    <span
                      class="absolute inset-y-0 left-0 rounded-full bg-accent"
                      :style="{ width: row.percentage + '%' }"
                    ></span>
                  </span>
                  <span class="w-10 shrink-0 text-right font-secondary text-[11px] text-fg-dim">{{
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
          class="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface p-4 text-fg-dim transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          @click="addScenario"
        >
          <PlusIcon class="h-6 w-6" />
          <span class="text-sm font-medium">Add scenario</span>
          <span class="text-xs text-fg-faint">{{ store.scenarios.length }} / {{ MAX_SCENARIOS }}</span>
        </button>
      </div>

      <p v-if="atScenarioCap" class="text-xs text-fg-faint">
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
