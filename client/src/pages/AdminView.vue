<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-sizeXl tracking-wide text-accent uppercase mb-8 font-secondary">
      Admin Dashboard
    </h1>

    <!-- Stats Dashboard -->
    <div class="flex flex-col gap-6 bg-gray-800 pb-6">
      <!-- LERG Details Section -->
      <div class="bg-gray-900/50">
        <div
          @click="toggleLergDetails"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">LERG Details</h2>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': showLergDetails }"
              class="w-5 h-5 transition-transform text-gray-400"
            />
          </div>
        </div>

        <!-- LERG Stats Grid -->
        <div v-if="showLergDetails" class="border-t border-gray-700/50 p-6 space-y-6">
          <div class="grid grid-cols-1 gap-3 border-b border-gray-700/50 pb-4 mb-6">
            <!-- Last Updated -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Last Updated</h3>
                <div class="text-lg">{{ formatDate(lergStats.lastUpdated) }}</div>
              </div>
            </div>
            <!-- Total Records -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Total NPA Records</h3>
                <div class="text-2xl font-bold">{{ formatNumber(lergStats.totalNPAs) }}</div>
              </div>
            </div>
            <!-- Total Countries -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Total Countries</h3>
                <div class="text-2xl font-bold">{{ store.getCountryCount }}</div>
              </div>
            </div>
            <!-- Database Connection Status -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">LERG DB</h3>
                <div class="flex items-center space-x-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="
                      dbStatus.connected
                        ? 'bg-accent animate-status-pulse-success'
                        : 'bg-destructive animate-status-pulse-error'
                    "
                  ></div>
                </div>
              </div>
            </div>
            <!-- Edge Function Status -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Edge Status</h3>
                <div class="flex items-center space-x-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="
                      pingStatus.isOnline
                        ? 'bg-accent animate-status-pulse-success'
                        : 'bg-destructive animate-status-pulse-error'
                    "
                  ></div>
                </div>
              </div>
            </div>
            <!-- Storage Status -->
            <div>
              <div class="flex justify-between items-center">
                <h3 class="text-gray-400">Stored Locally</h3>
                <div class="flex items-center space-x-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="[
                      isLergLocallyStored
                        ? 'bg-accent animate-status-pulse-success'
                        : 'bg-destructive animate-status-pulse-error',
                    ]"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Breakdown Sections -->
          <div class="space-y-6">
            <!-- US States Section -->
            <div class="bg-gray-900/50">
              <div
                @click="toggleStateDetails"
                class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
              >
                <div class="flex justify-between items-center">
                  <span class="font-medium text-lg">US States</span>
                  <div class="flex items-center space-x-3">
                    <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {{ getUSTotalNPAs }} NPAs
                    </span>
                    <ChevronDownIcon
                      :class="{ 'transform rotate-180': showStateDetails }"
                      class="w-5 h-5 transition-transform text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <!-- US States Content -->
              <div v-if="showStateDetails" class="border-t border-gray-700/50 p-6 space-y-4">
                <!-- Full width rows for multi-NPA states -->
                <div class="space-y-2">
                  <div
                    v-for="state in store.getUSStates.filter((s) => s.npas.length > 1)"
                    :key="state.code"
                    @click="toggleExpandState(state.code)"
                    class="bg-gray-900/80 p-4 rounded-lg w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium text-lg">{{ getStateName(state.code, 'US') }}</span>
                      <div class="flex items-center space-x-3">
                        <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {{ state.npas.length }} NPAs
                        </span>
                        <ChevronDownIcon
                          :class="{ 'transform rotate-180': expandedStates.includes(state.code) }"
                          class="w-5 h-5 transition-transform"
                        />
                      </div>
                    </div>

                    <!-- Expanded NPAs list -->
                    <div v-if="expandedStates.includes(state.code)" class="mt-3 pl-4">
                      <div class="flex flex-wrap gap-2">
                        <div
                          v-for="npa in state.npas"
                          :key="npa"
                          class="text-gray-300 bg-gray-800/50 px-3 py-1 rounded"
                        >
                          {{ npa }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Grid for single NPA states -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="state in store.getUSStates.filter((s) => s.npas.length === 1)"
                    :key="state.code"
                    class="bg-gray-900/50 p-4 rounded-lg"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium">{{ getStateName(state.code, 'US') }}</span>
                      <span class="text-gray-300">{{ state.npas[0] }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Canadian Provinces Section -->
            <div class="bg-gray-900/50">
              <div
                @click="toggleCanadianDetails"
                class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
              >
                <div class="flex justify-between items-center">
                  <span class="font-medium text-lg">Canada</span>
                  <div class="flex items-center space-x-3">
                    <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {{ getCanadaTotalNPAs }} NPAs
                    </span>
                    <ChevronDownIcon
                      :class="{ 'transform rotate-180': showCanadianDetails }"
                      class="w-5 h-5 transition-transform text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div v-if="showCanadianDetails" class="border-t border-gray-700/50 p-6 space-y-4">
                <!-- Show this if no provinces have NPAs -->
                <div
                  v-if="store.getCanadianProvinces.length === 0"
                  class="text-gray-400 text-center p-4"
                >
                  No Canadian provinces with NPAs found in LERG data
                </div>

                <!-- Multi-NPA provinces -->
                <div
                  v-for="province in store.getCanadianProvinces.filter((p) => p.npas.length > 1)"
                  :key="province.code"
                  class="bg-gray-900/80 p-4 rounded-lg cursor-pointer hover:bg-gray-600/40 transition-colors mb-3"
                  @click.stop="toggleExpandProvince(province.code)"
                >
                  <div class="flex justify-between items-center">
                    <span class="font-medium text-lg">{{ getStateName(province.code, 'CA') }}</span>
                    <div class="flex items-center space-x-3">
                      <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                        {{ province.npas.length }} NPAs
                      </span>
                      <ChevronDownIcon
                        :class="{
                          'transform rotate-180': expandedProvinces.includes(province.code),
                        }"
                        class="w-5 h-5 transition-transform"
                      />
                    </div>
                  </div>
                  <!-- Expanded NPAs list for provinces -->
                  <div v-if="expandedProvinces.includes(province.code)" class="mt-3">
                    <div class="flex flex-wrap gap-2">
                      <div
                        v-for="npa in province.npas"
                        :key="npa"
                        class="text-gray-300 bg-gray-700/50 px-3 py-1 rounded"
                      >
                        {{ npa }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Single-NPA provinces grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="province in store.getCanadianProvinces.filter(
                      (p) => p.npas.length === 1
                    )"
                    :key="province.code"
                    class="bg-gray-800/50 p-4 rounded-lg"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium text-lg">{{
                        getStateName(province.code, 'CA')
                      }}</span>
                      <span class="text-gray-300">{{ province.npas[0] }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Non-US States Section -->
            <div class="bg-gray-900/50">
              <div
                @click="toggleCountryDetails"
                class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
              >
                <div class="flex justify-between items-center">
                  <span class="font-medium text-lg">Non-US States</span>
                  <div class="flex items-center space-x-3">
                    <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {{ getNonUSTotalNPAs }} NPAs
                    </span>
                    <ChevronDownIcon
                      :class="{ 'transform rotate-180': showCountryDetails }"
                      class="w-5 h-5 transition-transform text-gray-400"
                    />
                  </div>
                </div>
              </div>
              <!-- Non-US States Content -->
              <div v-if="showCountryDetails" class="border-t border-gray-700/50 p-6 space-y-4">
                <!-- Other Countries Section -->
                <!-- Full width rows for multi-NPA countries -->
                <div class="space-y-2">
                  <div
                    v-for="country in store.getDistinctCountries.filter((c) => c.npaCount > 1)"
                    :key="country.country"
                    @click="toggleExpandCountry(country.country)"
                    class="bg-gray-900/80 p-4 rounded-lg w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium text-lg">{{ getCountryName(country.country) }}</span>
                      <div class="flex items-center space-x-3">
                        <span class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {{ country.npaCount }} NPAs
                        </span>
                        <ChevronDownIcon
                          :class="{
                            'transform rotate-180': expandedCountries.includes(country.country),
                          }"
                          class="w-5 h-5 transition-transform"
                        />
                      </div>
                    </div>

                    <!-- Expanded NPAs list -->
                    <div v-if="expandedCountries.includes(country.country)" class="mt-3 pl-4">
                      <div class="flex flex-wrap gap-2">
                        <div
                          v-for="npa in country.npas"
                          :key="npa"
                          class="text-gray-300 bg-gray-800/50 px-3 py-1 rounded"
                        >
                          {{ npa }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Grid for single NPA countries -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="country in store.getDistinctCountries.filter((c) => c.npaCount === 1)"
                    :key="country.country"
                    class="bg-gray-900/50 p-4 rounded-lg"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-medium">{{ getCountryName(country.country) }}</span>
                      <span class="text-gray-300">{{ country.npas[0] }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LERG Management Section -->
      <div class="bg-gray-900/50">
        <div
          @click="toggleLergSection"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">LERG File Management</h2>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': showLergSection }"
              class="w-5 h-5 transition-transform text-gray-400"
            />
          </div>
        </div>

        <!-- Expandable content -->
        <div v-if="showLergSection" class="border-t border-gray-700/50 p-6 space-y-6">
          <!-- LERG Upload -->
          <div>
            <h3 class="text-lg font-medium mb-4">Upload LERG File</h3>
            <div
              class="relative border-2 rounded-lg p-8 h-[160px] flex items-center justify-center"
              :class="[
                isDragging
                  ? 'border-accent bg-fbWhite/10'
                  : 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600',
                isLergUploading ? 'animate-upload-pulse cursor-not-allowed' : 'cursor-pointer',
                lergUploadStatus?.type === 'error' ? 'border-red-500' : '',
              ]"
              @dragenter.prevent="() => (isDragging = true)"
              @dragleave.prevent="() => (isDragging = false)"
              @dragover.prevent
              @drop.prevent="handleLergFileDrop"
            >
              <input
                type="file"
                ref="lergFileInput"
                class="absolute inset-0 opacity-0 cursor-pointer"
                :class="{ 'pointer-events-none': isLergUploading }"
                accept=".csv"
                @change="handleLergFileChange"
              />

              <!-- Empty State -->
              <div v-if="!isLergUploading && !lergUploadStatus" class="text-center">
                <ArrowUpTrayIcon
                  class="w-12 h-12 text-accent mx-auto border border-accent/50 rounded-full p-2 bg-accent/10"
                />
                <p class="mt-2 text-base text-foreground text-accent">
                  DRAG & DROP to upload or CLICK to select file
                </p>
                <p class="text-xs text-gray-500 mt-1">Supports CSV files (max 500MB)</p>
              </div>

              <!-- Processing/Uploading State -->
              <div v-else-if="isLergUploading" class="text-center">
                <DocumentIcon
                  class="w-12 h-12 text-accent mx-auto border border-accent/50 rounded-full p-2 bg-accent/10 animate-pulse"
                />
                <p class="mt-2 text-base text-accent">Processing your file...</p>
                <div class="w-full mt-2 h-2 rounded-full bg-gray-700">
                  <div class="h-full bg-accent rounded-full animate-pulse-width"></div>
                </div>
              </div>

              <!-- Error State -->
              <div v-else-if="lergUploadStatus?.type === 'error'" class="text-center">
                <div class="bg-red-500/10 p-4 rounded-lg">
                  <p class="text-red-400 font-medium">{{ lergUploadStatus.message }}</p>
                  <p v-if="lergUploadStatus.source" class="text-xs text-red-300 mt-1">
                    Source: {{ lergUploadStatus.source }}
                  </p>
                  <p v-if="lergUploadStatus.details" class="text-xs text-red-300 mt-1">
                    {{ lergUploadStatus.details }}
                  </p>
                  <p class="text-xs text-red-400 mt-2">
                    Please try again or contact support if the issue persists
                  </p>
                </div>
              </div>

              <!-- Warning State -->
              <div v-else-if="lergUploadStatus?.type === 'warning'" class="text-center">
                <div class="bg-yellow-500/10 p-4 rounded-lg">
                  <p class="text-yellow-400 font-medium">{{ lergUploadStatus.message }}</p>
                  <p v-if="lergUploadStatus.details" class="text-xs text-yellow-300 mt-1">
                    {{ lergUploadStatus.details }}
                  </p>
                  <div class="w-full mt-3 h-2 rounded-full bg-gray-700">
                    <div class="h-full bg-yellow-500 rounded-full animate-pulse-width"></div>
                  </div>
                </div>
              </div>

              <!-- Success State -->
              <div v-else-if="lergUploadStatus?.type === 'success'" class="text-center">
                <div class="bg-green-500/10 p-4 rounded-lg">
                  <DocumentIcon
                    class="w-12 h-12 text-accent mx-auto border border-accent/50 rounded-full p-2 bg-accent/10"
                  />
                  <p class="mt-2 text-xl text-accent">{{ lergUploadStatus.message }}</p>
                  <p v-if="lergUploadStatus.details" class="text-sm text-accent/80 mt-1">
                    {{ lergUploadStatus.details }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-destructive/10 border border-destructive/50 rounded-lg p-6 mt-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-destructive">Danger Zone</h3>
              <button
                @click="confirmClearLergData"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-destructive/50 bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all rounded-md"
              >
                <TrashIcon class="w-3.5 h-3.5" />
                Clear All LERG Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Preview Modal -->
    <PreviewModal
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :start-line="startLine"
      :column-options="LERG_COLUMN_ROLE_OPTIONS"
      :source="'LERG'"
      @update:mappings="handleMappingUpdate"
      @update:valid="(isValid) => (isModalValid = isValid)"
      @update:start-line="(newStartLine) => (startLine = newStartLine)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useLergStore } from '@/stores/lerg-store';
import { useLergData } from '@/composables/useLergData';
import { usePingStatus } from '@/composables/usePingStatus';
import {
  ChevronDownIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
} from '@heroicons/vue/24/outline';
import { getCountryName } from '@/types/constants/country-codes';
import { getStateName, STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';
import { LERG_COLUMN_ROLE_OPTIONS } from '@/types/domains/lerg-types';
import PreviewModal from '@/components/shared/PreviewModal.vue';
import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';

const store = useLergStore();
const {
  uploadLerg,
  downloadLerg,
  clearLerg,
  checkEdgeFunctionStatus,
  isLoading,
  error,
  isInitialized,
  isEdgeFunctionAvailable,
  initializeLergData,
} = useLergData();
const lergFileInput = ref<HTMLInputElement>();
const lergStats = computed(() => store.stats);
const expandedCountries = ref<string[]>([]);
const showStateDetails = ref(false);
const expandedStates = ref<string[]>([]);
const expandedProvinces = ref<string[]>([]);
const showCountryDetails = ref(false);
const showLergSection = ref(false);
const showLergDetails = ref(true);

const isLergLocallyStored = computed(() => {
  return store.$state.isLoaded;
});

// Define interfaces for status objects
interface UploadStatus {
  type: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  source?: string;
}

interface DbStatus {
  connected: boolean;
  error: string | null;
}

const isDragging = ref(false);
const lergUploadStatus = ref<UploadStatus | null>(null);
const isLergUploading = ref(false);
const dbStatus = computed<{
  connected: boolean;
  error: string | null;
}>(() => ({
  connected: pingStatus.value?.hasLergTable === true,
  error: error.value,
}));

// Preview state
const showPreviewModal = ref(false);
const columns = ref<string[]>([]);
const previewData = ref<string[][]>([]);
const columnRoles = ref<string[]>([]);
const startLine = ref(0);
const isModalValid = ref(false);
const columnMappings = ref<Record<string, string>>({});
const selectedFile = ref<File | null>(null);

// Added state for Canadian provinces section
const showCanadianDetails = ref(false);

// Add ping status
const { status: pingStatus, checkPingStatus } = usePingStatus();
const pingInterval = ref<number | null>(null);

onMounted(async () => {
  try {
    // Initialize LERG data
    await initializeLergData();
  } catch (err) {
    console.error('Failed to initialize LERG service:', err);
    error.value = err instanceof Error ? err.message : 'Failed to initialize LERG service';
  }

  // Initial ping check
  await checkPingStatus();

  // Setup periodic ping checks every 30 seconds
  pingInterval.value = window.setInterval(async () => {
    await checkPingStatus();
  }, 30000);
});

onUnmounted(() => {
  // Clear ping interval
  if (pingInterval.value) {
    clearInterval(pingInterval.value);
  }
});

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

function formatDate(date: Date | string | null): string {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(date: Date): string {
  if (!date) return 'Never';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

async function checkConnection() {
  try {
    await checkEdgeFunctionStatus();
  } catch (err) {
    console.error('Connection check failed:', err);
    error.value = err instanceof Error ? err.message : 'Connection check failed';
  }
}

function formatErrorMessage(error: Error): string {
  return error.message || 'An unknown error occurred';
}

async function handleLergFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  selectedFile.value = file;

  Papa.parse(file, {
    header: false,
    skipEmptyLines: true,
    complete: (results: ParseResult<string[]>) => {
      columns.value = results.data[0].map((h) => h.trim());
      previewData.value = results.data
        .slice(0, 10)
        .map((row) => (Array.isArray(row) ? row.map((cell) => cell?.trim() || '') : []));
      startLine.value = 1;
      showPreviewModal.value = true;
    },
  });
}

async function handleModalConfirm(mappings: Record<string, string>) {
  showPreviewModal.value = false;
  columnMappings.value = mappings;

  const file = selectedFile.value;
  if (!file) {
    lergUploadStatus.value = {
      type: 'error',
      message: 'No file selected for upload',
      details: 'Please select a file and try again',
    };
    return;
  }

  try {
    isLergUploading.value = true;
    lergUploadStatus.value = {
      type: 'warning',
      message: 'Uploading LERG file...',
      details: 'This may take a few minutes for large files',
    };

    await uploadLerg(file, {
      mappings: columnMappings.value,
      startLine: startLine.value,
    });

    isLergUploading.value = false;

    lergUploadStatus.value = {
      type: 'success',
      message: 'LERG file uploaded successfully',
      details: `Processed ${store.stats?.totalNPAs || 0} records`,
    };

    selectedFile.value = null;
    if (lergFileInput.value) {
      lergFileInput.value.value = '';
    }
  } catch (err) {
    console.error('Failed to upload LERG file:', err);
    isLergUploading.value = false;

    lergUploadStatus.value = {
      type: 'error',
      message: err instanceof Error ? err.message : 'Failed to upload LERG file',
      details: 'Please try again or contact support if the issue persists',
    };
  }
}

function handleModalCancel() {
  showPreviewModal.value = false;
  if (lergFileInput.value) {
    lergFileInput.value.value = '';
  }

  // Clear any previous upload status
  lergUploadStatus.value = null;
}

async function confirmClearLergData() {
  if (!confirm('Are you sure you want to clear all LERG codes? This action cannot be undone.')) {
    return;
  }

  try {
    isLergUploading.value = true;
    lergUploadStatus.value = {
      type: 'warning',
      message: 'Clearing LERG data...',
      details: 'This may take a moment',
    };

    // Check edge function availability first
    await checkEdgeFunctionStatus();

    if (!isEdgeFunctionAvailable.value) {
      throw new Error(
        'Edge functions are not available. Cannot clear LERG data from the database.'
      );
    }

    // Use the composable to clear all data (local and remote)
    await clearLerg();

    isLergUploading.value = false;
    lergUploadStatus.value = {
      type: 'success',
      message: 'LERG data cleared successfully',
      details: 'Data has been removed from both the local store and the database',
    };

    // Refresh connection status
    await checkConnection();
    await checkPingStatus();
  } catch (error) {
    console.error('Failed to clear LERG data:', error);

    isLergUploading.value = false;
    lergUploadStatus.value = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to clear data',
      details: 'There was an issue clearing the LERG data. Please try again or contact support.',
    };
  }
}

async function handleLergFileDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    await handleLergFileChange({ target: { files: [file] } } as unknown as Event);
  }
}

function toggleExpandState(stateCode: string) {
  const index = expandedStates.value.indexOf(stateCode);
  if (index === -1) {
    expandedStates.value.push(stateCode);
  } else {
    expandedStates.value.splice(index, 1);
  }
}

function toggleStateDetails() {
  showStateDetails.value = !showStateDetails.value;
}

function toggleCountryDetails() {
  showCountryDetails.value = !showCountryDetails.value;
}

function toggleExpandCountry(countryCode: string) {
  const index = expandedCountries.value.indexOf(countryCode);
  if (index === -1) {
    expandedCountries.value.push(countryCode);
  } else {
    expandedCountries.value.splice(index, 1);
  }
}

function toggleExpandProvince(code: string) {
  const index = expandedProvinces.value.indexOf(code);
  if (index === -1) {
    expandedProvinces.value.push(code);
  } else {
    expandedProvinces.value.splice(index, 1);
  }
}

function toggleLergSection() {
  showLergSection.value = !showLergSection.value;
}

function toggleLergDetails() {
  showLergDetails.value = !showLergDetails.value;
}

function handleMappingUpdate(newMappings: Record<string, string>) {
  columnMappings.value = newMappings;
}

// Toggle function for Canadian section
function toggleCanadianDetails() {
  showCanadianDetails.value = !showCanadianDetails.value;
}

// Computed property to get total Canadian NPAs
const getCanadaTotalNPAs = computed(() => {
  return store.getCanadianProvinces.reduce((total, province) => {
    return total + province.npas.length;
  }, 0);
});

// Computed property to get total US NPAs
const getUSTotalNPAs = computed(() => {
  return store.getUSStates.reduce((total, state) => {
    return total + state.npas.length;
  }, 0);
});

// Computed property to get total Non-US NPAs
const getNonUSTotalNPAs = computed(() => {
  return store.getDistinctCountries.reduce((total, country) => {
    return total + country.npaCount;
  }, 0);
});
</script>

<style>
@keyframes pulse-width {
  0% {
    width: 5%;
  }
  50% {
    width: 75%;
  }
  100% {
    width: 5%;
  }
}

.animate-pulse-width {
  animation: pulse-width 2s infinite ease-in-out;
}

.animate-status-pulse-success {
  animation: pulse 2s infinite;
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.5);
  width: 12px;
  height: 12px;
}

.animate-status-pulse-error {
  animation: pulse 2s infinite;
  box-shadow: 0 0 12px rgba(244, 67, 54, 0.5);
  width: 12px;
  height: 12px;
}

@keyframes pulse {
  0% {
    opacity: 0.5;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.5;
    transform: scale(0.95);
  }
}
</style>
