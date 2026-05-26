<template>
  <!-- Pricing Studio workspace: filters | command bar + table | operations -->
  <div class="flex flex-col xl:flex-row gap-4">
    <!-- LEFT: Filter panel -->
    <aside class="xl:w-72 flex-shrink-0">
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-secondary uppercase tracking-wider text-zinc-400">Filters</h3>
          <button
            @click="handleClearAllFilters"
            class="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowPathIcon class="h-3 w-3" /> Reset Filters
          </button>
        </div>

        <!-- NPA / NPANXX search -->
        <div>
          <label for="npanxx-search" class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">NPA / NPANXX</label>
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              id="npanxx-search"
              v-model="searchQuery"
              type="text"
              placeholder="e.g. 201, 301333…"
              class="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent"
            />
          </div>
        </div>

        <!-- State / Province / Country -->
        <div>
          <label for="state-filter" class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">State / Province / Country</label>
          <select
            id="state-filter"
            v-model="selectedState"
            class="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent"
          >
            <option value="">All States / Provinces / Countries</option>
            <option value="GROUP_UNITED_STATES">All United States</option>
            <option value="GROUP_CANADA">All Canada</option>
            <option value="GROUP_OTHER_COUNTRIES">All Other Countries</option>
            <optgroup
              v-for="group in groupedAvailableStates"
              :key="group.label"
              :label="group.label"
            >
              <option v-for="code in group.codes" :key="code" :value="code">
                {{ getRegionDisplayName(code) }} ({{ code }})
              </option>
            </optgroup>
          </select>
        </div>

        <!-- Metro Area (compact) -->
        <div>
          <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Metro Area</label>
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              v-model="metroSearchQuery"
              type="text"
              placeholder="Search metros…"
              @focus="isMetroAreaVisible = true"
              class="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-8 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent"
            />
            <button
              @click="isMetroAreaVisible = !isMetroAreaVisible"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              aria-label="Toggle metro list"
            >
              <ChevronDownIcon class="h-4 w-4 transition-transform" :class="{ 'rotate-180': isMetroAreaVisible }" />
            </button>
          </div>

          <!-- Quick selects -->
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="n in [10, 25]"
              :key="n"
              @click="selectTopNMetros(n)"
              class="text-[11px] px-2 py-1 rounded border border-white/10 text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 transition-colors"
            >
              Top {{ n }}
            </button>
            <button
              v-if="selectedMetros.length"
              @click="clearAllSelectedMetros"
              class="text-[11px] px-2 py-1 rounded border border-white/10 text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 transition-colors"
            >
              Clear
            </button>
          </div>

          <!-- Collapsible list -->
          <transition name="fade">
            <div
              v-if="isMetroAreaVisible"
              class="mt-2 max-h-44 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] divide-y divide-white/[0.05]"
            >
              <button
                v-for="metro in filteredMetroOptions"
                :key="metro.key"
                @click="toggleMetroSelection(metro)"
                class="w-full flex items-center justify-between px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.04] transition-colors"
                :class="isMetroSelected(metro) ? 'text-emerald-300' : 'text-zinc-300'"
              >
                <span class="truncate">{{ metro.displayName }}</span>
                <CheckIcon v-if="isMetroSelected(metro)" class="h-3.5 w-3.5 flex-shrink-0" />
              </button>
              <p v-if="!filteredMetroOptions.length" class="px-2.5 py-2 text-xs text-zinc-600">No metros match.</p>
            </div>
          </transition>

          <!-- Selected chips -->
          <div v-if="selectedMetros.length" class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="metro in chipMetros"
              :key="metro.key"
              class="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] pl-2 pr-1 py-0.5 text-[11px] text-zinc-300"
            >
              {{ metro.displayName }}
              <button @click="removeSelectedMetro(metro)" class="text-zinc-500 hover:text-zinc-200" aria-label="Remove metro">
                <XMarkIcon class="h-3 w-3" />
              </button>
            </span>
            <span v-if="selectedMetros.length > 3" class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-400">
              +{{ selectedMetros.length - 3 }} more
            </span>
          </div>
        </div>

        <!-- Rate jurisdiction (drives the adjustment target) -->
        <div>
          <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Rate Jurisdiction</label>
          <div class="grid grid-cols-4 gap-1">
            <button
              v-for="opt in adjustmentTargetRateOptions"
              :key="opt.value"
              @click="adjustmentTargetRate = opt.value"
              class="text-[11px] px-1.5 py-1.5 rounded border transition-colors"
              :class="
                adjustmentTargetRate === opt.value
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : 'border-white/10 text-zinc-400 hover:bg-white/[0.05]'
              "
            >
              {{ opt.short }}
            </button>
          </div>
        </div>

        <!-- Export filtered rates -->
        <button
          @click="exportRatesCsv"
          :disabled="totalFilteredItems === 0 || isExporting"
          class="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.06] px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowDownTrayIcon class="h-4 w-4" /> Export Rates
        </button>

        <!-- Local storage trust note -->
        <div class="flex items-start gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
          <LockClosedIcon class="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
          <p class="text-[11px] text-zinc-500 leading-relaxed">
            All data is stored in your browser. Your rate sheets never leave your device.
          </p>
        </div>
      </div>
    </aside>

    <!-- CENTER: command bar + preview + table -->
    <div class="flex-1 min-w-0 space-y-4">
      <!-- Command bar -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        <h3 class="text-xs font-secondary uppercase tracking-wider text-zinc-400 mb-3">Create Pricing Adjustment</h3>

        <!-- Declarative sentence -->
        <p class="mb-4 text-sm text-zinc-400 leading-relaxed">
          <span class="font-secondary font-semibold uppercase text-emerald-400">{{ adjustmentType }}</span>
          <span class="font-secondary text-white"> {{ valuePhrase }} </span>
          <span class="text-zinc-500">on</span>
          <span class="text-zinc-200"> {{ targetLabel(adjustmentTargetRate) }} </span>
          <span class="text-zinc-500">for</span>
          <span class="text-zinc-200"> {{ scopeLabel }}</span>
        </p>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <!-- Operation -->
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Operation</label>
            <select v-model="adjustmentType" class="w-full bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60">
              <option v-for="o in adjustmentTypeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <!-- Method -->
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Method</label>
            <select v-model="adjustmentValueType" :disabled="adjustmentType === 'set'" class="w-full bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-50" :class="adjustmentType === 'set' ? 'text-zinc-500' : 'text-white'">
              <option v-for="o in adjustmentValueTypeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <!-- Value -->
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Value</label>
            <input v-model.number="adjustmentValue" type="number" min="0" step="any" placeholder="0" class="w-full bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/60" />
          </div>
          <!-- Target -->
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Target Rate</label>
            <select v-model="adjustmentTargetRate" class="w-full bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60">
              <option v-for="o in adjustmentTargetRateOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <!-- Preview -->
          <button
            @click="handlePreview"
            :disabled="!canAdjust"
            class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <EyeIcon class="h-4 w-4" /> Preview
          </button>
          <!-- Apply + Freeze -->
          <button
            @click="handleApplyAndFreeze"
            :disabled="!canAdjust || isApplyingAdjustment"
            class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-ink hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon v-if="isApplyingAdjustment" class="h-4 w-4 animate-spin" />
            <LockClosedIcon v-else class="h-4 w-4" />
            Apply + Freeze
          </button>
        </div>

        <!-- Preview impact card -->
        <div v-if="previewImpact" class="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div class="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Preview Impact</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Rows Affected</p>
              <p class="font-secondary text-white">{{ fmtInt(previewImpact.rowsAffected) }}
                <span class="text-xs text-zinc-500">{{ pctOfTotal(previewImpact.rowsAffected) }}</span>
              </p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">NPAs Affected</p>
              <p class="font-secondary text-white">{{ fmtInt(previewImpact.npasAffected) }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Frozen Rows Excluded</p>
              <p class="font-secondary text-violet-300">{{ fmtInt(previewImpact.frozenRowsExcluded) }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wider text-zinc-500">Avg Delta</p>
              <p class="font-secondary text-emerald-400">{{ avgDeltaLabel }}</p>
            </div>
            <p class="ml-auto inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <LockClosedIcon class="h-3.5 w-3.5" /> Existing frozen rows will not be changed
            </p>
          </div>
        </div>

        <!-- Feedback -->
        <div v-if="adjustmentStatusMessage || adjustmentError" class="mt-3 text-xs">
          <p v-if="adjustmentStatusMessage" class="text-emerald-400">{{ adjustmentStatusMessage }}</p>
          <p v-if="adjustmentError" class="text-rose-400">Error: {{ adjustmentError }}</p>
        </div>
      </div>

      <!-- Table card -->
      <div class="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
          <p v-if="!isDataLoading" class="text-sm text-zinc-500">
            Showing <span class="font-secondary text-zinc-300">{{ displayedData.length }}</span>
            of <span class="font-secondary text-zinc-300">{{ totalFilteredItems.toLocaleString() }}</span> rows
          </p>
          <span v-else class="text-sm text-zinc-500">Loading…</span>

          <div class="flex items-center gap-2">
            <label for="status-filter" class="text-xs text-zinc-500">Show</label>
            <select
              id="status-filter"
              v-model="statusFilter"
              class="bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <option value="all">All Rows</option>
              <option value="modified">Modified</option>
              <option value="frozen">Frozen</option>
              <option value="original">Original</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto overflow-y-auto max-h-[600px] relative min-h-[280px]">
          <transition name="fade">
            <div v-if="isFiltering" class="absolute inset-0 bg-ink/60 flex items-center justify-center z-20">
              <ArrowPathIcon class="animate-spin w-7 h-7 text-emerald-400" />
            </div>
          </transition>

          <table class="min-w-full text-sm">
            <thead class="sticky top-0 z-10 bg-ink-raised">
              <tr class="text-[11px] uppercase tracking-wider text-zinc-500">
                <th
                  v-for="header in tableHeaders"
                  :key="header.key"
                  scope="col"
                  class="px-4 py-2.5 font-medium whitespace-nowrap"
                  :class="[
                    header.numeric ? 'text-right' : 'text-left',
                    header.sortable ? 'cursor-pointer hover:text-zinc-300 select-none' : '',
                  ]"
                  @click="header.sortable ? handleSort(header.key) : null"
                >
                  <span class="inline-flex items-center gap-1" :class="header.numeric ? 'justify-end w-full' : ''">
                    {{ header.label }}
                    <ArrowUpIcon v-if="currentSortKey === header.key && currentSortDirection === 'asc'" class="w-3 h-3 text-emerald-400" />
                    <ArrowDownIcon v-else-if="currentSortKey === header.key && currentSortDirection === 'desc'" class="w-3 h-3 text-emerald-400" />
                  </span>
                </th>
                <th scope="col" class="px-3 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isDataLoading && !isFiltering">
                <td :colspan="tableHeaders.length + 1" class="text-center py-12">
                  <div class="flex items-center justify-center gap-2 text-emerald-400">
                    <ArrowPathIcon class="animate-spin w-5 h-5" /> Loading rate deck…
                  </div>
                </td>
              </tr>

              <template v-else-if="displayedData.length > 0">
                <tr
                  v-for="entry in displayedData"
                  :key="entry.npanxx"
                  class="border-t border-white/[0.05] transition-colors"
                  :class="rowClass(entry)"
                >
                  <td class="px-4 py-2 font-secondary text-zinc-300">{{ entry.npanxx }}</td>
                  <td class="px-4 py-2 text-zinc-400">{{ stateOf(entry) }}</td>
                  <td class="px-4 py-2 text-zinc-400">{{ countryOf(entry) }}</td>
                  <td class="px-4 py-2 text-right font-secondary text-white">{{ formatRate(entry.interRate) }}</td>
                  <td class="px-4 py-2 text-right font-secondary text-white">{{ formatRate(entry.intraRate) }}</td>
                  <td class="px-4 py-2 text-right font-secondary text-white">{{ formatRate(entry.indetermRate) }}</td>
                  <td class="px-4 py-2 text-zinc-500 font-secondary whitespace-nowrap">{{ store.getCurrentEffectiveDate || 'N/A' }}</td>
                  <td class="px-4 py-2">
                    <span
                      class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                      :class="statusBadgeClass(rowStatus(entry))"
                    >
                      <LockClosedIcon v-if="rowStatus(entry) === 'frozen'" class="h-2.5 w-2.5" />
                      <span v-else class="h-1.5 w-1.5 rounded-full" :class="rowStatus(entry) === 'modified' ? 'bg-emerald-400' : 'bg-zinc-600'"></span>
                      {{ statusLabel(rowStatus(entry)) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-right">
                    <button
                      @click="toggleRowFreeze(entry)"
                      class="text-zinc-600 hover:text-zinc-300 transition-colors"
                      :title="isRowFrozen(entry) ? 'Unfreeze this NPANXX' : 'Freeze this NPANXX'"
                    >
                      <LockOpenIcon v-if="isRowFrozen(entry)" class="h-4 w-4" />
                      <LockClosedIcon v-else class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </template>

              <tr v-else>
                <td :colspan="tableHeaders.length + 1" class="text-center text-zinc-500 py-12">
                  {{ store.hasUsRateSheetData ? 'No rows match the current filters.' : 'No rate deck loaded. Upload a CSV to begin.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.06] text-sm text-zinc-500">
          <div class="flex items-center gap-2">
            <span>Show</span>
            <select v-model="itemsPerPage" :disabled="isDataLoading || isFiltering" class="bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60">
              <option v-for="option in itemsPerPageOptions" :key="option" :value="option">{{ option }}</option>
            </select>
            <span>per page</span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap justify-center">
            <button @click="() => goToFirstPage(createDisplayFilters())" :disabled="!canGoToPreviousPage || isDataLoading || isFiltering" class="px-2 py-1 rounded border border-white/10 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed">« First</button>
            <button @click="() => goToPreviousPage(createDisplayFilters())" :disabled="!canGoToPreviousPage || isDataLoading || isFiltering" class="px-2 py-1 rounded border border-white/10 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed">‹ Prev</button>
            <span class="flex items-center gap-1.5 px-1">
              Page
              <input type="number" v-model.number="directPageInput" @change="() => handleDirectPageInput(createDisplayFilters())" @keyup.enter="() => handleDirectPageInput(createDisplayFilters())" min="1" :max="totalPages" :disabled="isDataLoading || isFiltering" class="bg-white/[0.03] border border-white/10 rounded w-14 text-center py-1 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60" />
              of {{ totalPages.toLocaleString() }}
            </span>
            <button @click="() => goToNextPage(createDisplayFilters())" :disabled="!canGoToNextPage || isDataLoading || isFiltering" class="px-2 py-1 rounded border border-white/10 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed">Next ›</button>
            <button @click="() => goToLastPage(createDisplayFilters())" :disabled="!canGoToNextPage || currentPage === totalPages || isDataLoading || isFiltering" class="px-2 py-1 rounded border border-white/10 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed">Last »</button>
          </div>

          <span class="min-w-[140px] text-right">Total: {{ totalFilteredItems.toLocaleString() }} records</span>
        </div>
      </div>
    </div>

    <!-- RIGHT: operations panel -->
    <aside class="xl:w-80 flex-shrink-0">
      <PricingOperationsPanel />
    </aside>

    <NoticeModal v-model="showNotice" :title="noticeTitle" :message="noticeMessage" :variant="noticeVariant" />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    CheckIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    ChevronDownIcon,
  } from '@heroicons/vue/20/solid';
  import { LockClosedIcon, LockOpenIcon, EyeIcon } from '@heroicons/vue/24/outline';
  import type { USRateSheetEntry } from '@/types/domains/rate-sheet-types';
  import { useUsRateSheetStore } from '@/stores/us-rate-sheet-store';
  import { usePricingStudioStore } from '@/stores/pricing-studio-store';
  import NoticeModal from '@/components/shared/NoticeModal.vue';
  import PricingOperationsPanel from '@/components/rate-sheet/us/pricing-studio/PricingOperationsPanel.vue';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  import { useDebounceFn } from '@vueuse/core';
  import { DBName } from '@/types/app-types';
  import type {
    AdjustmentType,
    AdjustmentValueType,
    TargetRateType,
  } from '@/types/domains/rate-sheet-types';
  import Dexie from 'dexie';
  import { useMetroFilter } from '@/composables/filters/useMetroFilter';
  import { groupRegionCodes } from '@/types/constants/region-codes';
  import { useCSVExport } from '@/composables/exports/useCSVExport';
  import { useUSTableData } from '@/composables/tables/useUSTableData';
  import type { FilterFunction } from '@/composables/tables/useTableData';
  import {
    classifyRow,
    buildRateDeckCsv,
    computeReadiness,
    type Adjustment,
    type AdjustmentImpact,
    type RowStatus,
    type GeoInfo,
  } from '@/utils/pricing-engine';
  import { downloadAuditPdf } from '@/utils/pricing-audit-pdf';
  import UsRateAdjusterWorker from '@/workers/us-rate-adjuster.worker?worker';
  import type {
    UsRateAdjusterRequest,
    UsRateAdjusterResponse,
  } from '@/workers/us-rate-adjuster.worker';

  interface RateAverages {
    inter: number | null;
    intra: number | null;
    indeterm: number | null;
  }

  const store = useUsRateSheetStore();
  const psStore = usePricingStudioStore();
  const lergStore = useLergStoreV2();
  const RATE_SHEET_TABLE_NAME = 'entries';

  // Table headers. `getValue` forces client-side sort (works for LERG-derived
  // columns like Country that aren't stored fields); `numeric` drives alignment.
  const tableHeaders = ref([
    { key: 'npanxx', label: 'NPANXX', sortable: true, numeric: false, getValue: (e: USRateSheetEntry) => e.npanxx },
    { key: 'stateCode', label: 'State', sortable: true, numeric: false, getValue: (e: USRateSheetEntry) => lergStore.getNPAInfo(e.npa)?.state_province_code || 'N/A' },
    { key: 'countryCode', label: 'Country', sortable: true, numeric: false, getValue: (e: USRateSheetEntry) => lergStore.getNPAInfo(e.npa)?.country_code || 'N/A' },
    { key: 'interRate', label: 'Interstate Rate', sortable: true, numeric: true, getValue: (e: USRateSheetEntry) => e.interRate },
    { key: 'intraRate', label: 'Intrastate Rate', sortable: true, numeric: true, getValue: (e: USRateSheetEntry) => e.intraRate },
    { key: 'indetermRate', label: 'Indeterminate Rate', sortable: true, numeric: true, getValue: (e: USRateSheetEntry) => e.indetermRate },
    { key: 'effectiveDateGlobal', label: 'Effective Date', sortable: false, numeric: false },
    { key: 'status', label: 'Status', sortable: false, numeric: false },
  ]);

  const {
    displayedData,
    totalFilteredItems,
    isDataLoading,
    isFiltering,
    dataError,
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    totalPages,
    canGoToPreviousPage,
    canGoToNextPage,
    directPageInput,
    currentSortKey,
    currentSortDirection,
    initializeDB,
    resetPaginationAndLoad,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
    goToLastPage,
    handleDirectPageInput,
    dbInstance,
    availableStates,
    fetchUniqueStates,
    fetchUniqueStatesFromData,
  } = useUSTableData<USRateSheetEntry>({
    dbName: DBName.US_RATE_SHEET,
    tableName: RATE_SHEET_TABLE_NAME,
    itemsPerPage: 100,
    sortKey: 'npanxx',
    sortDirection: 'asc',
    tableHeaders: tableHeaders.value,
  });

  const {
    selectedMetros,
    metroSearchQuery,
    filteredMetroOptions,
    metroAreaCodesToFilter,
    toggleMetroSelection,
    isMetroSelected,
    removeSelectedMetro,
    selectTopNMetros,
    clearAllSelectedMetros,
  } = useMetroFilter();

  // Adjustment option data (short labels for the jurisdiction segmented control).
  const adjustmentTypeOptions = [
    { value: 'markup', label: 'Markup' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'set', label: 'Set To Value' },
  ] as const;
  const adjustmentValueTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount' },
  ] as const;
  const adjustmentTargetRateOptions = [
    { value: 'inter', label: 'Interstate Only', short: 'Inter' },
    { value: 'intra', label: 'Intrastate Only', short: 'Intra' },
    { value: 'indeterm', label: 'Indeterminate Only', short: 'Indet' },
    { value: 'all', label: 'All Rates', short: 'All' },
  ] as const;

  const adjustmentType = ref<AdjustmentType>('markup');
  const adjustmentValueType = ref<AdjustmentValueType>('percentage');
  const adjustmentValue = ref<number | null>(null);
  const adjustmentTargetRate = ref<TargetRateType>('inter');
  const isApplyingAdjustment = ref(false);
  const adjustmentStatusMessage = ref<string | null>(null);
  const adjustmentError = ref<string | null>(null);
  const previewImpact = ref<AdjustmentImpact | null>(null);
  let adjustmentStatusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const searchQuery = ref('');
  const debouncedSearchQuery = ref<string[]>([]);
  const selectedState = ref<string>('');
  const statusFilter = ref<'all' | RowStatus>('all');
  const isMetroAreaVisible = ref(false);

  const currentDisplayAverages = ref<RateAverages>({ inter: null, intra: null, indeterm: null });
  const isCalculatingAverages = ref(false);

  // First three selected metros become chips; the rest collapse into "+N more".
  const chipMetros = computed(() => selectedMetros.value.slice(0, 3));

  const canAdjust = computed(
    () => adjustmentValue.value !== null && adjustmentValue.value > 0 && totalFilteredItems.value > 0
  );

  const valuePhrase = computed(() => {
    const v = adjustmentValue.value ?? 0;
    if (adjustmentType.value === 'set') return `to $${v}`;
    const sign = adjustmentType.value === 'markup' ? '+' : '−';
    return `${sign}${v}${adjustmentValueType.value === 'percentage' ? '%' : ''}`;
  });

  const scopeLabel = computed(() => describeScope());

  const avgDeltaLabel = computed(() => {
    if (!previewImpact.value) return '—';
    const d = previewImpact.value.avgDelta;
    const pick =
      adjustmentTargetRate.value === 'intra'
        ? d.intra
        : adjustmentTargetRate.value === 'indeterm'
          ? d.indeterm
          : d.inter;
    if (pick === null) return '—';
    return `${pick >= 0 ? '+' : ''}$${pick.toFixed(6)}`;
  });

  // --- Filters ---
  function createFilters(): FilterFunction<USRateSheetEntry>[] {
    const filters: FilterFunction<USRateSheetEntry>[] = [];

    if (debouncedSearchQuery.value.length > 0) {
      filters.push((record) => {
        const lower = record.npanxx.toLowerCase();
        return debouncedSearchQuery.value.some((term) => lower.startsWith(term));
      });
    }

    if (selectedState.value) {
      filters.push((record) => {
        if (selectedState.value === 'GROUP_UNITED_STATES') {
          const npaInfo = lergStore.getNPAInfo(record.npa);
          return (
            npaInfo?.country_code === 'US' &&
            !['PR', 'VI', 'GU', 'AS', 'MP'].includes(npaInfo.state_province_code)
          );
        } else if (selectedState.value === 'GROUP_CANADA') {
          return lergStore.getNPAInfo(record.npa)?.country_code === 'CA';
        } else if (selectedState.value === 'GROUP_OTHER_COUNTRIES') {
          const npaInfo = lergStore.getNPAInfo(record.npa);
          return !!npaInfo && npaInfo.country_code !== 'US' && npaInfo.country_code !== 'CA';
        }
        return record.stateCode === selectedState.value;
      });
    }

    if (metroAreaCodesToFilter.value.length > 0) {
      const npaSet = new Set(metroAreaCodesToFilter.value);
      filters.push((record) => npaSet.has(record.npa));
    }

    return filters;
  }

  // Display-only filters add the Status predicate on top of the scope filters, so
  // status never alters the adjustment scope, averages, or export.
  function createDisplayFilters(): FilterFunction<USRateSheetEntry>[] {
    const filters = createFilters();
    if (statusFilter.value !== 'all') {
      filters.push(
        (record) =>
          classifyRow(record, psStore.freezeState, psStore.modifiedNpanxx) === statusFilter.value
      );
    }
    return filters;
  }

  const debouncedSearch = useDebounceFn(async () => {
    debouncedSearchQuery.value = searchQuery.value
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';
    previewImpact.value = null;
    await resetPaginationAndLoad(createDisplayFilters());
    await recalculateAndDisplayAverages();
  }, 300);

  const stopSearchWatcher = watch(searchQuery, debouncedSearch);
  const stopItemsPerPageWatcher = watch(itemsPerPage, async () => {
    await resetPaginationAndLoad(createDisplayFilters());
  });
  const stopStateWatcher = watch(selectedState, async () => {
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';
    previewImpact.value = null;
    await resetPaginationAndLoad(createDisplayFilters());
    await recalculateAndDisplayAverages();
  });
  const stopMetroWatcher = watch(
    selectedMetros,
    async () => {
      previewImpact.value = null;
      await resetPaginationAndLoad(createDisplayFilters());
      await recalculateAndDisplayAverages();
    },
    { deep: true }
  );
  const stopStatusWatcher = watch(statusFilter, async () => {
    await resetPaginationAndLoad(createDisplayFilters());
  });
  const stopDataChangeWatcher = watch(
    () => store.lastDbUpdateTime,
    async () => {
      if (store.getHasUsRateSheetData && !store.getIsUploadInProgress) {
        await fetchUniqueStatesFromData();
        if (
          selectedState.value &&
          !availableStates.value.includes(selectedState.value) &&
          !selectedState.value.startsWith('GROUP_')
        ) {
          selectedState.value = '';
        }
      }
    }
  );

  // --- Averages (deck/selection scan; feeds the readiness strip's avg inter) ---
  async function calculateAverages(): Promise<RateAverages | null> {
    if (!dbInstance.value) await initializeDB();
    if (!dbInstance.value) return null;

    let sumInter = 0;
    let sumIntra = 0;
    let sumIndeterm = 0;
    let count = 0;
    try {
      const table = dbInstance.value.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
      let queryChain: Dexie.Collection<USRateSheetEntry, any> = table.toCollection();
      const filters = createFilters();
      if (filters.length > 0) {
        queryChain = queryChain.filter((record) => filters.every((fn) => fn(record)));
      }
      await queryChain.each((entry) => {
        if (typeof entry.interRate === 'number') sumInter += entry.interRate;
        if (typeof entry.intraRate === 'number') sumIntra += entry.intraRate;
        if (typeof entry.indetermRate === 'number') sumIndeterm += entry.indetermRate;
        if (
          typeof entry.interRate === 'number' ||
          typeof entry.intraRate === 'number' ||
          typeof entry.indetermRate === 'number'
        ) {
          count++;
        }
      });
      return {
        inter: count > 0 && !isNaN(sumInter) ? sumInter / count : null,
        intra: count > 0 && !isNaN(sumIntra) ? sumIntra / count : null,
        indeterm: count > 0 && !isNaN(sumIndeterm) ? sumIndeterm / count : null,
      };
    } catch (err: any) {
      dataError.value = err.message || 'Failed to calculate averages';
      return null;
    }
  }

  async function recalculateAndDisplayAverages() {
    isCalculatingAverages.value = true;
    await nextTick();
    const averages = await calculateAverages();
    currentDisplayAverages.value = averages ?? { inter: null, intra: null, indeterm: null };
    psStore.setDeckAvgInterRate(currentDisplayAverages.value.inter);
    isCalculatingAverages.value = false;
  }

  // --- Lifecycle ---
  onMounted(async () => {
    if (store.getHasUsRateSheetData && !store.getIsUploadInProgress) {
      if (!dbInstance.value) await initializeDB();
      await fetchUniqueStatesFromData();
      await resetPaginationAndLoad(createDisplayFilters());
      await recalculateAndDisplayAverages();
    } else if (!store.getIsUploadInProgress) {
      await fetchUniqueStates();
    }
  });

  const stopUploadGateWatcher = watch(
    () => store.getIsUploadInProgress,
    async (isUploading, wasUploading) => {
      if (wasUploading && !isUploading && store.getHasUsRateSheetData) {
        await fetchUniqueStatesFromData();
        await resetPaginationAndLoad(createDisplayFilters());
        await recalculateAndDisplayAverages();
      }
    }
  );

  const stopHasDataWatcher = watch(
    () => store.getHasUsRateSheetData,
    async (hasData, oldHasData) => {
      if (hasData === oldHasData) return;
      if (!hasData) {
        selectedState.value = '';
        searchQuery.value = '';
        statusFilter.value = 'all';
        previewImpact.value = null;
        currentDisplayAverages.value = { inter: null, intra: null, indeterm: null };
      } else if (!store.getIsUploadInProgress) {
        await fetchUniqueStatesFromData();
        await resetPaginationAndLoad(createDisplayFilters());
        await recalculateAndDisplayAverages();
      }
    }
  );

  onBeforeUnmount(() => {
    stopSearchWatcher();
    stopStateWatcher();
    stopMetroWatcher();
    stopItemsPerPageWatcher();
    stopStatusWatcher();
    stopUploadGateWatcher();
    stopDataChangeWatcher();
    stopHasDataWatcher();
    if (adjustmentStatusTimeoutId) clearTimeout(adjustmentStatusTimeoutId);
  });

  // --- Display helpers ---
  function formatRate(rate: number | string | null | undefined): string {
    if (rate === null || rate === undefined || typeof rate !== 'number') return 'N/A';
    return rate.toFixed(6);
  }
  function fmtInt(n: number): string {
    return n.toLocaleString('en-US');
  }
  function pctOfTotal(n: number): string {
    const total = store.getTotalRecords;
    return total ? `(${((n / total) * 100).toFixed(2)}%)` : '';
  }
  function geoOf(npa: string): GeoInfo {
    const info = lergStore.getNPAInfo(npa);
    return { state: info?.state_province_code || '', country: info?.country_code || '' };
  }
  function stateOf(entry: USRateSheetEntry): string {
    return geoOf(entry.npa).state || 'N/A';
  }
  function countryOf(entry: USRateSheetEntry): string {
    return geoOf(entry.npa).country || 'N/A';
  }
  function targetLabel(target: TargetRateType): string {
    return (
      { all: 'All Rates', inter: 'Interstate Rates', intra: 'Intrastate Rates', indeterm: 'Indeterminate Rates' } as Record<TargetRateType, string>
    )[target];
  }
  function rowStatus(entry: USRateSheetEntry): RowStatus {
    return classifyRow(entry, psStore.freezeState, psStore.modifiedNpanxx);
  }
  function isRowFrozen(entry: USRateSheetEntry): boolean {
    return rowStatus(entry) === 'frozen' || psStore.npanxxOverrides.get(entry.npanxx) === 'frozen';
  }
  function rowClass(entry: USRateSheetEntry): string {
    return rowStatus(entry) === 'frozen' ? 'bg-violet-400/[0.04] hover:bg-violet-400/[0.08]' : 'hover:bg-white/[0.02]';
  }
  function statusLabel(s: RowStatus): string {
    return { frozen: 'Frozen', modified: 'Modified', original: 'Original' }[s];
  }
  function statusBadgeClass(s: RowStatus): string {
    return {
      frozen: 'text-violet-300 bg-violet-400/10 ring-1 ring-violet-400/30',
      modified: 'text-emerald-300 bg-emerald-400/10 ring-1 ring-emerald-400/30',
      original: 'text-zinc-400 bg-white/[0.04]',
    }[s];
  }

  // --- Region/state select helpers ---
  function getRegionDisplayName(code: string): string {
    const territoryNames: Record<string, string> = {
      PR: 'Puerto Rico',
      VI: 'U.S. Virgin Islands',
      GU: 'Guam',
      AS: 'American Samoa',
      MP: 'Northern Mariana Islands',
      DC: 'District of Columbia',
    };
    if (territoryNames[code]) return territoryNames[code];
    const usState = lergStore.getUSStates.find((s) => s.code === code);
    if (usState) return usState.name;
    const caProvince = lergStore.getCanadianProvinces.find((p) => p.code === code);
    if (caProvince) return caProvince.name;
    const country = lergStore.getDistinctCountries.find((c) => c.code === code);
    return country ? country.name : code;
  }
  const groupedAvailableStates = computed(() => {
    const grouped = groupRegionCodes(availableStates.value);
    return [
      { label: 'United States', codes: grouped['US'] || [] },
      { label: 'Canada', codes: grouped['CA'] || [] },
      { label: 'Other Countries', codes: grouped['OTHER'] || [] },
    ].filter((g) => g.codes.length > 0);
  });

  // --- Sorting / clearing ---
  async function handleSort(key: string) {
    const header = tableHeaders.value.find((h) => h.key === key);
    if (!header || !header.sortable) return;
    if (currentSortKey.value === key) {
      currentSortDirection.value = currentSortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortKey.value = key;
      currentSortDirection.value = 'asc';
    }
    await resetPaginationAndLoad(createDisplayFilters());
  }

  async function handleClearAllFilters() {
    searchQuery.value = '';
    selectedState.value = '';
    statusFilter.value = 'all';
    clearAllSelectedMetros();
    currentSortKey.value = 'npanxx';
    currentSortDirection.value = 'asc';
    previewImpact.value = null;
    await resetPaginationAndLoad(createDisplayFilters());
    await recalculateAndDisplayAverages();
  }

  // --- Scope description (for the command sentence + operation record) ---
  function describeScope(): string {
    const parts = describeFilters();
    return parts.length ? 'Filtered Results' : 'All Records';
  }
  function describeFilters(): string[] {
    const out: string[] = [];
    if (debouncedSearchQuery.value.length > 0) {
      out.push(`NPANXX starts with ${debouncedSearchQuery.value.join(', ')}`);
    }
    if (selectedState.value) {
      if (selectedState.value.startsWith('GROUP_')) {
        out.push(`Region: ${selectedState.value.replace('GROUP_', '').replace(/_/g, ' ')}`);
      } else {
        out.push(`Region: ${selectedState.value}`);
      }
    }
    if (selectedMetros.value.length > 0) {
      out.push(`Metro: ${selectedMetros.value.map((m) => m.displayName).join(', ')}`);
    }
    return out;
  }

  // --- Load filtered records into memory for preview/apply (matches legacy path) ---
  async function loadFilteredRecords(): Promise<USRateSheetEntry[]> {
    if (!dbInstance.value) await initializeDB();
    if (!dbInstance.value) return [];
    const table = dbInstance.value.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
    let query: Dexie.Collection<USRateSheetEntry, any> = table.toCollection();
    const filters = createFilters();
    if (filters.length > 0) query = query.filter((record) => filters.every((fn) => fn(record)));
    return query.toArray();
  }

  function buildAdjustment(): Adjustment {
    return {
      type: adjustmentType.value,
      valueType: adjustmentValueType.value,
      value: adjustmentValue.value!,
      target: adjustmentTargetRate.value,
    };
  }

  // Plain NPA→geo map for the worker (no lergStore closure crosses the boundary).
  // Mirrors lergStore.getNPAInfo, built once per run from the ~449 LERG records.
  function buildNpaGeoMap(): UsRateAdjusterRequest['npaGeoMap'] {
    const map: UsRateAdjusterRequest['npaGeoMap'] = {};
    for (const rec of lergStore.allNPAs) {
      map[rec.npa] = {
        country_code: rec.country_code,
        state_province_code: rec.state_province_code,
      };
    }
    return map;
  }

  // Serialize the current scope + adjustment for the worker. Freeze Set/Map are
  // cloned to plain collections — Vue reactive proxies don't structured-clone.
  function buildWorkerRequest(mode: 'apply' | 'preview'): UsRateAdjusterRequest {
    return {
      searchTerms: [...debouncedSearchQuery.value],
      selectedState: selectedState.value,
      metroNpas: [...metroAreaCodesToFilter.value],
      npaGeoMap: buildNpaGeoMap(),
      adjustment: buildAdjustment(),
      freeze: {
        frozenNpas: new Set(psStore.frozenNpas),
        npanxxOverrides: new Map(psStore.npanxxOverrides),
      },
      scopeLabel: describeScope(),
      filtersApplied: describeFilters(),
      mode,
    };
  }

  // Spawn the off-thread adjuster, relay progress, resolve on complete / reject
  // on error, and always terminate the worker before settling.
  function runAdjusterWorker(
    request: UsRateAdjusterRequest,
    onProgress?: (p: { phase: 'reading' | 'writing'; percentage: number }) => void
  ): Promise<UsRateAdjusterResponse> {
    return new Promise((resolve, reject) => {
      const worker = new UsRateAdjusterWorker();
      worker.onmessage = (event: MessageEvent<UsRateAdjusterResponse>) => {
        const msg = event.data;
        if (msg.type === 'progress') {
          onProgress?.({ phase: msg.phase, percentage: msg.percentage });
          return;
        }
        worker.terminate();
        if (msg.type === 'error') reject(new Error(msg.message));
        else resolve(msg);
      };
      worker.onerror = (err) => {
        worker.terminate();
        reject(new Error(err.message || 'Rate adjuster worker crashed.'));
      };
      worker.postMessage(request);
    });
  }

  // --- Preview (dry run; does not commit) — runs off-thread ---
  async function handlePreview() {
    if (!canAdjust.value) return;
    adjustmentError.value = null;
    try {
      const result = await runAdjusterWorker(buildWorkerRequest('preview'));
      if (result.type === 'complete' && result.mode === 'preview') {
        previewImpact.value = result.impact;
      }
    } catch (err: any) {
      adjustmentError.value = err.message || 'Preview failed.';
    }
  }

  // --- Apply + Freeze (worker commits to Dexie; main thread records session state) ---
  async function handleApplyAndFreeze() {
    if (!canAdjust.value || isApplyingAdjustment.value) return;
    if (adjustmentStatusTimeoutId) {
      clearTimeout(adjustmentStatusTimeoutId);
      adjustmentStatusTimeoutId = null;
    }
    isApplyingAdjustment.value = true;
    adjustmentStatusMessage.value = null;
    adjustmentError.value = null;
    const startTime = performance.now();

    try {
      const result = await runAdjusterWorker(buildWorkerRequest('apply'), (p) => {
        const label = p.phase === 'reading' ? 'Scanning rows' : 'Applying';
        adjustmentStatusMessage.value = `${label}… ${Math.round(p.percentage)}%`;
      });
      if (result.type !== 'complete' || result.mode !== 'apply') return;

      if (result.impact.rowsAffected === 0) {
        adjustmentStatusMessage.value =
          result.impact.frozenRowsExcluded > 0
            ? 'All matching rows are frozen — no changes applied.'
            : 'No changes needed for the matching rows.';
        previewImpact.value = result.impact;
        return;
      }

      // Record freeze + modified + operation into the session store (the worker
      // already committed the rate writes to IndexedDB).
      psStore.recordAdjustment({
        newlyFrozenNpas: result.newlyFrozenNpas,
        modifiedNpanxx: result.modifiedNpanxx,
        operation: result.operation,
      });

      // Use the worker's single-pass averages instead of a second full scan.
      currentDisplayAverages.value = result.averages;
      psStore.setDeckAvgInterRate(result.averages.inter);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      adjustmentStatusMessage.value = `Applied to ${result.impact.rowsAffected.toLocaleString()} rows and froze ${result.newlyFrozenNpas.length} NPA(s) in ${duration}s.`;
      previewImpact.value = null;
      adjustmentValue.value = null;

      await resetPaginationAndLoad(createDisplayFilters());
      store.lastDbUpdateTime = Date.now();

      adjustmentStatusTimeoutId = setTimeout(() => {
        adjustmentStatusMessage.value = null;
        adjustmentStatusTimeoutId = null;
      }, 4000);
    } catch (err: any) {
      adjustmentError.value = err.message || 'An unknown error occurred during adjustment.';
    } finally {
      isApplyingAdjustment.value = false;
    }
  }

  // --- Per-NPANXX freeze/thaw override ---
  function toggleRowFreeze(entry: USRateSheetEntry) {
    if (isRowFrozen(entry)) {
      psStore.thawNpanxx(entry.npanxx);
    } else {
      psStore.freezeNpanxx(entry.npanxx);
    }
  }

  // --- Export ---
  const { isExporting, exportToCSV } = useCSVExport();

  async function buildDeckCsvAndDownload(records: USRateSheetEntry[], filenameParts: string[]) {
    const { headers, rows } = buildRateDeckCsv(records, {
      effectiveDate: store.getCurrentEffectiveDate,
      getGeo: geoOf,
      formatRate: (n) => (typeof n === 'number' ? n.toFixed(6) : 'N/A'),
    });
    await exportToCSV(
      { headers, rows },
      { filename: 'us-rate-deck', additionalNameParts: filenameParts, timestamp: true, quoteFields: true }
    );
  }

  // Filter-panel "Export Rates": current filtered deck as CSV only.
  async function exportRatesCsv() {
    if (isExporting.value) return;
    try {
      const records = await loadFilteredRecords();
      if (records.length === 0) {
        showNoticeModal('Nothing to Export', 'No rows match the current filters.', 'info');
        return;
      }
      const parts: string[] = [];
      if (selectedState.value) parts.push(selectedState.value.replace(/\s+/g, '_'));
      if (debouncedSearchQuery.value.length) parts.push(`search_${debouncedSearchQuery.value.join('-')}`);
      await buildDeckCsvAndDownload(records, parts);
    } catch (err: any) {
      showNoticeModal('Export Failed', err.message || 'Failed to export rates.', 'error');
    }
  }

  // Header "Export Package": full final deck CSV + branded change-audit PDF.
  async function exportPackage() {
    if (isExporting.value || !store.getHasUsRateSheetData) return;
    try {
      if (!dbInstance.value) await initializeDB();
      if (!dbInstance.value) {
        showNoticeModal('Export Failed', 'Database is not ready.', 'error');
        return;
      }
      const table = dbInstance.value.table<USRateSheetEntry>(RATE_SHEET_TABLE_NAME);
      const allRecords = await table.toArray();
      if (allRecords.length === 0) {
        showNoticeModal('Nothing to Export', 'No rate deck data to export.', 'info');
        return;
      }
      // 1) Final rate deck CSV
      await buildDeckCsvAndDownload(allRecords, ['final']);
      // 2) Branded change-audit PDF
      const readiness = computeReadiness({
        totalRecords: store.getTotalRecords,
        operations: psStore.operations,
        freeze: psStore.freezeState,
        avgInterRate: psStore.deckAvgInterRate,
      });
      downloadAuditPdf(psStore.operations, {
        generatedAt: new Date(),
        totalRecords: store.getTotalRecords,
        modifiedRows: readiness.modifiedRows,
        frozenScopes: readiness.frozenScopes,
        effectiveDate: store.getCurrentEffectiveDate,
      });
      showNoticeModal(
        'Export Package Ready',
        'Two files downloaded: the final rate deck (CSV) and the change audit (PDF).',
        'success'
      );
    } catch (err: any) {
      showNoticeModal('Export Failed', err.message || 'Failed to export package.', 'error');
    }
  }

  defineExpose({ exportPackage });

  // --- Notice modal ---
  const showNotice = ref(false);
  const noticeTitle = ref('');
  const noticeMessage = ref('');
  const noticeVariant = ref<'success' | 'error' | 'info'>('info');
  function showNoticeModal(title: string, message: string, variant: 'success' | 'error' | 'info' = 'info') {
    noticeTitle.value = title;
    noticeMessage.value = message;
    noticeVariant.value = variant;
    showNotice.value = true;
  }
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
