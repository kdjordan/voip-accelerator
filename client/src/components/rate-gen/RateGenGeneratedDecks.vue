<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { RateGenService } from '@/services/rate-gen.service';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { useLergStoreV2 } from '@/stores/lerg-store-v2';
import { useHandoffStore } from '@/stores/handoff-store';
import { buildHandoffFromGenerated } from '@/utils/deck-handoff';
import type { HandoffTarget } from '@/types/domains/handoff-types';
import { computeAnalytics } from '@/utils/rate-gen-aggregates';
import { selectionLabel, type GeneratedRateDeck, type RateGenAnalytics, type LeanGeneratedRecord, type RateGenRecord } from '@/types/domains/rate-gen-types';
import {
  buildFinalDeckCsv,
  buildRouteDistributionCsv,
  downloadCsv,
  DEFAULT_FINAL_DECK_CSV_OPTIONS,
  type FinalDeckCsvOptions,
  type NpaGeo,
} from '@/utils/rate-gen-deck-csv';
import { downloadBuildSummaryPdf } from '@/utils/rate-gen-summary-pdf';
import BaseButton from '@/components/shared/BaseButton.vue';
import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';

const props = defineProps<{ service: RateGenService }>();

const store = useRateGenStore();
const lergStore = useLergStoreV2();
const handoffStore = useHandoffStore();
const router = useRouter();

// Hand-off: snapshot a generated deck's rates and push it into another US module.
// The payload is built at click time (before navigation) so it survives the route change.
// See docs/adr/0009-cross-module-rate-deck-handoff.md.
const HANDOFF_PATHS: Record<HandoffTarget, string> = {
  adjuster: '/us-rate-sheet',
  analyzer: '/usview',
};

function sendDeckTo(deck: GeneratedRateDeck, target: HandoffTarget) {
  const records = props.service.getGeneratedRecords(deck.id);
  if (!records?.length) return;
  handoffStore.setPending(buildHandoffFromGenerated(records, { name: deck.name, target }));
  router.push(HANDOFF_PATHS[target]);
}

// Per-deck analytics are computed lazily (they scan the in-memory records +
// provider-data map). Keyed by deck id; null while loading.
const analyticsByDeck = ref<Record<string, RateGenAnalytics | null>>({});
const previewByDeck = ref<Record<string, LeanGeneratedRecord[]>>({});
const loadingDeck = ref<Record<string, boolean>>({});

const PREVIEW_ROWS = 50;

const decks = computed<GeneratedRateDeck[]>(() => store.generatedDecks);

// Geo lookup closure for CSV enrichment, backed by the LERG store.
function npaLookup(npa: string): NpaGeo | null {
  const info = lergStore.getNPAInfo(npa);
  if (!info) return null;
  return {
    state: info.state_province_code,
    country: info.country_code || 'US',
    region: info.region,
  };
}

async function loadDeckAnalytics(deck: GeneratedRateDeck): Promise<void> {
  if (analyticsByDeck.value[deck.id] || loadingDeck.value[deck.id]) return;
  const records = props.service.getGeneratedRecords(deck.id);
  if (!records) {
    // Session-only: deck metadata survived but its records didn't (e.g. reload).
    analyticsByDeck.value[deck.id] = null;
    return;
  }
  loadingDeck.value[deck.id] = true;
  try {
    previewByDeck.value[deck.id] = records.slice(0, PREVIEW_ROWS);
    const dataByPrefix: Map<string, RateGenRecord[]> = await props.service.getProviderDataByPrefix();
    const prefixes = records.map((r) => r.prefix);
    analyticsByDeck.value[deck.id] = computeAnalytics(records, prefixes, dataByPrefix, deck.providerIds);
  } finally {
    loadingDeck.value[deck.id] = false;
  }
}

onMounted(() => {
  decks.value.forEach((d) => loadDeckAnalytics(d));
});

// --- Rename (inline) ---------------------------------------------------------
const editingDeckId = ref<string | null>(null);
const editingName = ref('');

function startRename(deck: GeneratedRateDeck) {
  editingDeckId.value = deck.id;
  editingName.value = deck.name;
}

function commitRename(deck: GeneratedRateDeck) {
  const trimmed = editingName.value.trim();
  if (trimmed) deck.name = trimmed;
  editingDeckId.value = null;
}

function cancelRename() {
  editingDeckId.value = null;
}

// --- Delete (shared ConfirmationModal) --------------------------------------
const deleteTarget = ref<GeneratedRateDeck | null>(null);
const deleteModalOpen = ref(false);
const deleting = ref(false);

function askDelete(deck: GeneratedRateDeck) {
  deleteTarget.value = deck;
  deleteModalOpen.value = true;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  const id = deleteTarget.value.id;
  deleting.value = true;
  try {
    await props.service.deleteDeck(id);
    store.removeGeneratedDeck(id);
    delete analyticsByDeck.value[id];
    delete previewByDeck.value[id];
  } finally {
    deleting.value = false;
    deleteModalOpen.value = false;
    deleteTarget.value = null;
  }
}

// --- Downloads ---------------------------------------------------------------
function deckEffectiveDate(deck: GeneratedRateDeck): Date {
  return deck.effectiveDate ? new Date(deck.effectiveDate) : new Date();
}

function safeName(deck: GeneratedRateDeck): string {
  return deck.name.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'deck';
}

// Final Rate Deck CSV — compact format dialog
const formatDialogOpen = ref(false);
const formatDeck = ref<GeneratedRateDeck | null>(null);
const formatOptions = ref<FinalDeckCsvOptions>({ ...DEFAULT_FINAL_DECK_CSV_OPTIONS });

function openFormatDialog(deck: GeneratedRateDeck) {
  formatDeck.value = deck;
  formatOptions.value = { ...DEFAULT_FINAL_DECK_CSV_OPTIONS };
  formatDialogOpen.value = true;
}

function downloadFinalDeck() {
  const deck = formatDeck.value;
  if (!deck) return;
  const records = props.service.getGeneratedRecords(deck.id);
  if (!records) return;
  const csv = buildFinalDeckCsv(records, formatOptions.value, deckEffectiveDate(deck), npaLookup);
  downloadCsv(csv, `${safeName(deck)}-rate-deck.csv`);
  formatDialogOpen.value = false;
}

function downloadRouteDistribution(deck: GeneratedRateDeck) {
  const records = props.service.getGeneratedRecords(deck.id);
  if (!records) return;
  const csv = buildRouteDistributionCsv(records);
  downloadCsv(csv, `${safeName(deck)}-route-distribution.csv`);
}

function downloadSummary(deck: GeneratedRateDeck) {
  const analytics = analyticsByDeck.value[deck.id];
  if (!analytics) return;
  downloadBuildSummaryPdf(deck, analytics, `${safeName(deck)}-build-summary`);
}

// --- formatting helpers ------------------------------------------------------
function fmtRate(n: number): string {
  return n.toFixed(6);
}

function markupLabel(deck: GeneratedRateDeck): string {
  if (deck.markupFixed && deck.markupFixed > 0) return `$${deck.markupFixed} fixed`;
  return `${deck.markupPercentage}%`;
}
</script>

<template>
  <div>
    <!-- Empty state -->
    <div
      v-if="decks.length === 0"
      class="rounded-2xl border border-line bg-surface p-8 text-center"
    >
      <h2 class="text-lg font-semibold text-fg">No generated decks yet</h2>
      <p class="mt-2 text-sm text-fg-dim">
        Commit a scenario from the Simulation Preview tab to generate a deck. Generated decks live
        in memory for this session only.
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Session-only reminder (decks live in memory only; persisting was rejected — ADR-0008) -->
      <div class="border-l-2 border-info bg-info-soft px-4 py-3 text-sm text-fg-dim">
        <span class="font-display text-xs uppercase tracking-wider text-info">Session-only</span>
        — leaving this page or reloading clears generated decks. Send one to the Adjuster or
        Analyzer, or export it, before you go.
      </div>
      <div
        v-for="deck in decks"
        :key="deck.id"
        class="rounded-2xl border border-line bg-surface p-5"
      >
        <!-- Header: name + rename + delete -->
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div v-if="editingDeckId === deck.id" class="flex items-center gap-2">
              <input
                v-model="editingName"
                type="text"
                class="rounded-lg border border-line bg-input px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                @keyup.enter="commitRename(deck)"
                @keyup.escape="cancelRename"
              />
              <button class="text-sm text-accent hover:text-accent-text" @click="commitRename(deck)">
                Save
              </button>
              <button class="text-sm text-fg-dim hover:text-fg" @click="cancelRename">
                Cancel
              </button>
            </div>
            <div v-else class="flex items-center gap-2">
              <h3 class="truncate text-base font-semibold text-fg">{{ deck.name }}</h3>
              <button
                class="text-xs text-fg-dim hover:text-accent"
                @click="startRename(deck)"
              >
                Rename
              </button>
            </div>
            <p class="mt-1 text-xs text-fg-faint">
              {{ selectionLabel(deck.depth, deck.mode) }} · {{ markupLabel(deck) }} markup ·
              {{ deck.rowCount.toLocaleString() }} prefixes
            </p>
          </div>
          <BaseButton variant="destructive" size="small" @click="askDelete(deck)">
            Delete
          </BaseButton>
        </div>

        <template v-if="props.service.getGeneratedRecords(deck.id)">
          <!-- KPIs -->
          <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-lg bg-row px-3 py-2">
              <div class="text-xs text-fg-faint">Total prefixes</div>
              <div class="text-sm font-semibold text-fg">
                {{ analyticsByDeck[deck.id]?.totalPrefixes.toLocaleString() ?? '—' }}
              </div>
            </div>
            <div class="rounded-lg bg-row px-3 py-2">
              <div class="text-xs text-fg-faint">Single-sourced</div>
              <div class="text-sm font-semibold text-fg">
                {{ analyticsByDeck[deck.id]?.singleSourcedCount.toLocaleString() ?? '—' }}
              </div>
            </div>
            <div class="rounded-lg bg-row px-3 py-2">
              <div class="text-xs text-fg-faint">Providers used</div>
              <div class="text-sm font-semibold text-fg">
                {{ analyticsByDeck[deck.id]?.providersUsed.length ?? '—' }}
              </div>
            </div>
            <div class="rounded-lg bg-row px-3 py-2">
              <div class="text-xs text-fg-faint">Markup</div>
              <div class="text-sm font-semibold text-fg">{{ markupLabel(deck) }}</div>
            </div>
          </div>

          <!-- Avg rates -->
          <div v-if="analyticsByDeck[deck.id]" class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-fg-dim">
            <span>Avg inter: <span class="text-fg">{{ fmtRate(analyticsByDeck[deck.id]!.avgInterstate) }}</span></span>
            <span>Avg intra: <span class="text-fg">{{ fmtRate(analyticsByDeck[deck.id]!.avgIntrastate) }}</span></span>
            <span>Avg indet: <span class="text-fg">{{ fmtRate(analyticsByDeck[deck.id]!.avgIndeterminate) }}</span></span>
          </div>

          <!-- Win rate by type -->
          <div v-if="analyticsByDeck[deck.id]" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div
              v-for="rt in (['interstate', 'intrastate', 'indeterminate'] as const)"
              :key="rt"
              class="rounded-lg border border-line p-3"
            >
              <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-dim">
                {{ rt }} win rate
              </div>
              <ul class="space-y-1">
                <li
                  v-for="stat in analyticsByDeck[deck.id]!.winRateByType[rt]"
                  :key="stat.provider"
                  class="flex items-center justify-between text-xs"
                >
                  <span class="truncate text-fg-dim">{{ stat.provider }}</span>
                  <span class="text-fg-faint">{{ stat.percentage.toFixed(1) }}%</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Preview -->
          <details class="mt-4 group">
            <summary class="cursor-pointer text-xs text-fg-dim hover:text-fg">
              Preview first {{ Math.min(PREVIEW_ROWS, deck.rowCount) }} rows
            </summary>
            <div class="mt-2 max-h-64 overflow-auto rounded-lg border border-line">
              <table class="w-full text-left text-xs">
                <thead class="sticky top-0 bg-surface text-fg-dim">
                  <tr>
                    <th class="px-3 py-1.5 font-medium">Prefix</th>
                    <th class="px-3 py-1.5 font-medium">Inter</th>
                    <th class="px-3 py-1.5 font-medium">Intra</th>
                    <th class="px-3 py-1.5 font-medium">Indet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in previewByDeck[deck.id]"
                    :key="row.prefix"
                    class="border-t border-line text-fg-dim"
                  >
                    <td class="px-3 py-1 font-mono">{{ row.prefix }}</td>
                    <td class="px-3 py-1 font-mono">{{ fmtRate(row.rate) }}</td>
                    <td class="px-3 py-1 font-mono">{{ fmtRate(row.intrastate) }}</td>
                    <td class="px-3 py-1 font-mono">{{ fmtRate(row.indeterminate) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>

          <!-- Downloads -->
          <div class="mt-5 flex flex-wrap gap-3">
            <BaseButton variant="primary" size="small" @click="openFormatDialog(deck)">
              Final Rate Deck CSV
            </BaseButton>
            <BaseButton variant="secondary" size="small" @click="downloadRouteDistribution(deck)">
              Route Distribution CSV
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="small"
              :disabled="!analyticsByDeck[deck.id]"
              @click="downloadSummary(deck)"
            >
              Build Summary PDF
            </BaseButton>
            <BaseButton
              variant="secondary-outline"
              size="small"
              :disabled="!props.service.getGeneratedRecords(deck.id)?.length"
              @click="sendDeckTo(deck, 'adjuster')"
            >
              Send to Adjuster
            </BaseButton>
            <BaseButton
              variant="secondary-outline"
              size="small"
              :disabled="!props.service.getGeneratedRecords(deck.id)?.length"
              @click="sendDeckTo(deck, 'analyzer')"
            >
              Send to Analyzer
            </BaseButton>
          </div>
        </template>
      </div>
    </div>

    <!-- Delete confirmation -->
    <ConfirmationModal
      v-model="deleteModalOpen"
      title="Delete generated deck"
      :message="`Delete &quot;${deleteTarget?.name ?? ''}&quot;? This removes it from this session — you can regenerate it from the Simulation Preview tab.`"
      confirm-button-text="Delete"
      :loading="deleting"
      @confirm="confirmDelete"
    />

    <!-- Final Rate Deck CSV — compact format dialog -->
    <Teleport to="body">
      <div
        v-if="formatDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="formatDialogOpen = false"
      >
        <div class="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
          <h3 class="mb-1 text-lg font-semibold text-fg">Final Rate Deck CSV</h3>
          <p class="mb-4 text-sm text-fg-dim">Choose the export format options.</p>

          <div class="space-y-4">
            <div>
              <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-dim">
                NPANXX format
              </div>
              <div class="flex gap-4 text-sm text-fg">
                <label class="flex items-center gap-2">
                  <input v-model="formatOptions.npanxxFormat" type="radio" value="combined" class="accent-accent" />
                  Combined (213555)
                </label>
                <label class="flex items-center gap-2">
                  <input v-model="formatOptions.npanxxFormat" type="radio" value="split" class="accent-accent" />
                  Split (213 | 555)
                </label>
              </div>
            </div>

            <label class="flex items-center gap-2 text-sm text-fg">
              <input v-model="formatOptions.includeCountryCode" type="checkbox" class="accent-accent" />
              Include +1 prefix
            </label>

            <div>
              <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-dim">
                Geo columns
              </div>
              <div class="space-y-2 text-sm text-fg">
                <label class="flex items-center gap-2">
                  <input v-model="formatOptions.includeStateColumn" type="checkbox" class="accent-accent" />
                  State
                </label>
                <label class="flex items-center gap-2">
                  <input v-model="formatOptions.includeCountryColumn" type="checkbox" class="accent-accent" />
                  Country
                </label>
                <label class="flex items-center gap-2">
                  <input v-model="formatOptions.includeRegionColumn" type="checkbox" class="accent-accent" />
                  Region
                </label>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <BaseButton variant="secondary" @click="formatDialogOpen = false">Cancel</BaseButton>
            <BaseButton variant="primary" @click="downloadFinalDeck">Download CSV</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
