<template>
  <div class="min-h-screen text-white pt-2 w-full">
    <h1 class="text-3xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
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

      <!-- LERG Management Section (File Upload/Clear - Commented Out) -->
      <div class="bg-gray-900/50">
        <div
          @click="toggleLergSection"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">LERG Management (Upload / Clear)</h2>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': showLergSection }"
              class="w-5 h-5 transition-transform text-gray-400"
            />
          </div>
        </div>

        <div v-if="showLergSection" class="border-t border-gray-700/50 p-6 space-y-6">
          <!-- LERG Upload Card -->
          <div
            class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center transition-colors"
            :class="{
              'border-accent bg-accent/10 border-solid': isDragging,
              'hover:border-accent-hover hover:bg-fbWhite/10 border-dashed border-gray-600':
                !isDragging && !dragDropErrorMessage,
              'border-red-500 border-solid': !!dragDropErrorMessage,
            }"
            @dragenter.prevent="handleDragEnter"
            @dragleave.prevent="handleDragLeave"
            @dragover.prevent="handleDragOver"
            @drop.prevent="handleDropFromComposable"
          >
            <div class="flex flex-col items-center justify-center space-y-4 pointer-events-none">
              <ArrowUpTrayIcon
                class="w-10 h-10 mx-auto border rounded-full p-2"
                :class="
                  !!dragDropErrorMessage
                    ? 'text-red-500 border-red-500/50 bg-red-500/10'
                    : 'text-accent border-accent/50 bg-accent/10'
                "
              />
              <p
                class="mt-2 text-base"
                :class="!!dragDropErrorMessage ? 'text-red-500' : 'text-accent'"
              >
                {{
                  dragDropErrorMessage
                    ? dragDropErrorMessage
                    : 'DRAG & DROP to upload or CLICK to select file'
                }}
              </p>
            </div>
            <input
              ref="lergFileInput"
              type="file"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".csv,.txt"
              :disabled="isLergUploading"
              @change="handleLergFileChange"
            />
          </div>

          <!-- Upload Status -->
          <div
            v-if="lergUploadStatus"
            class="p-4 rounded-md"
            :class="getStatusClass(lergUploadStatus.type)"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <!-- Icon based on status type -->
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium" :class="getStatusTextClass(lergUploadStatus.type)">
                  {{ lergUploadStatus.message }}
                </h3>
                <div
                  class="mt-2 text-sm"
                  :class="getStatusTextClass(lergUploadStatus.type)"
                  v-if="lergUploadStatus.details"
                >
                  <p>{{ lergUploadStatus.details }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading Indicator during Upload/Clear -->
          <div
            v-if="isLergUploading"
            class="flex items-center justify-center space-x-2 text-gray-400"
          >
            <ArrowPathIcon class="animate-spin h-5 w-5 text-accent" />
            <span>Processing LERG data... Please wait.</span>
          </div>

          <!-- Clear LERG Data Button -->
          <div class="flex justify-end">
            <BaseButton
              variant="destructive"
              size="standard"
              :icon="TrashIcon"
              :disabled="isLergUploading"
              @click="confirmClearLergData"
            >
              Clear All LERG Data
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- NEW: Add Single LERG Record Section -->
      <div class="bg-gray-900/50">
        <div
          @click="toggleAddLergSection"
          class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">Add Single LERG Record</h2>
            <ChevronDownIcon
              :class="{ 'transform rotate-180': showAddLergSection }"
              class="w-5 h-5 transition-transform text-gray-400"
            />
          </div>
        </div>

        <div v-if="showAddLergSection" class="border-t border-gray-700/50 p-6 space-y-6">
          <!-- Form for adding a single record -->
          <form @submit.prevent="handleAddSingleRecord" class="space-y-4">
            <!-- Form Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- NPA Input -->
              <div>
                <label for="npa" class="block text-sm font-medium text-gray-300 mb-1">NPA</label>
                <input
                  type="text"
                  id="npa"
                  v-model="newRecord.npa"
                  required
                  maxlength="3"
                  pattern="^[0-9]{3}$"
                  placeholder="e.g., 212"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
                <p v-if="validationErrors.npa" class="mt-1 text-xs text-red-400">
                  {{ validationErrors.npa }}
                </p>
              </div>

              <!-- State Input -->
              <div>
                <label for="state" class="block text-sm font-medium text-gray-300 mb-1"
                  >State/Province (2-Letter Code)</label
                >
                <input
                  type="text"
                  id="state"
                  v-model="newRecord.state"
                  required
                  maxlength="2"
                  pattern="^[A-Za-z]{2}$"
                  placeholder="e.g., NY or ON"
                  @input="newRecord.state = newRecord.state.toUpperCase()"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
                <p v-if="validationErrors.state" class="mt-1 text-xs text-red-400">
                  {{ validationErrors.state }}
                </p>
              </div>

              <!-- Country Input -->
              <div>
                <label for="country" class="block text-sm font-medium text-gray-300 mb-1"
                  >Country (2-Letter Code)</label
                >
                <input
                  type="text"
                  id="country"
                  v-model="newRecord.country"
                  required
                  maxlength="2"
                  pattern="^[A-Za-z]{2}$"
                  placeholder="e.g., US or CA"
                  @input="newRecord.country = newRecord.country.toUpperCase()"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
                <p v-if="validationErrors.country" class="mt-1 text-xs text-red-400">
                  {{ validationErrors.country }}
                </p>
              </div>
            </div>

            <!-- Submission Button and Feedback -->
            <div class="flex items-center justify-end space-x-3">
              <!-- Loading Indicator -->
              <div v-if="isLoading" class="flex items-center space-x-2 text-sm text-gray-400">
                <ArrowPathIcon class="animate-spin h-4 w-4 text-accent" />
                <span>Processing...</span>
              </div>
              <!-- Error Message -->
              <p v-if="error && !isLoading" class="text-sm text-red-400">Error: {{ error }}</p>
              <!-- Success Message -->
              <p v-if="addSuccessMessage" class="text-sm text-green-400">{{ addSuccessMessage }}</p>

              <BaseButton
                type="submit"
                variant="primary"
                size="standard"
                :disabled="isLoading || !isFormValid"
                :loading="isLoading"
              >
                Add Record
              </BaseButton>
            </div>
          </form>
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
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { useLergStore } from '@/stores/lerg-store';
import { useLergData } from '@/composables/useLergData';
import { usePingStatus } from '@/composables/usePingStatus';
import {
  ChevronDownIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  PlusCircleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';
import { COUNTRY_CODES, getCountryName } from '@/types/constants/country-codes';
import { STATE_CODES, getStateName } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';
import type { LERGRecord } from '@/types/domains/lerg-types';
import { LERG_COLUMN_ROLE_OPTIONS } from '@/types/domains/lerg-types';
import PreviewModal from '@/components/shared/PreviewModal.vue';
import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import { useDragDrop } from '@/composables/useDragDrop';
import BaseButton from '@/components/shared/BaseButton.vue';

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
  addAndRefreshLergRecord,
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
const showAddLergSection = ref(true);

const isLergLocallyStored = computed(() => {
  return store.$state.isLoaded;
});

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

const lergUploadStatus = ref<UploadStatus | null>(null);
const isLergUploading = ref(false);
const dbStatus = computed<DbStatus>(() => ({
  connected: pingStatus.value?.hasLergTable === true,
  error: pingStatus.value?.error || null,
}));

const showPreviewModal = ref(false);
const columns = ref<string[]>([]);
const previewData = ref<string[][]>([]);
const columnRoles = ref<string[]>([]);
const startLine = ref(0);
const isModalValid = ref(false);
const columnMappings = ref<Record<string, string>>({});
const selectedFile = ref<File | null>(null);

const showCanadianDetails = ref(false);

const { status: pingStatus, checkPingStatus } = usePingStatus();
const pingInterval = ref<number | null>(null);

const newRecord = reactive<Pick<LERGRecord, 'npa' | 'state' | 'country'>>({
  npa: '',
  state: '',
  country: '',
});
const validationErrors = reactive<{ npa?: string; state?: string; country?: string }>({});
const addSuccessMessage = ref<string | null>(null);

const isFormValid = computed(() => {
  return (
    /^[0-9]{3}$/.test(newRecord.npa) &&
    /^[A-Za-z]{2}$/.test(newRecord.state) &&
    /^[A-Za-z]{2}$/.test(newRecord.country) &&
    Object.values(validationErrors).every((err) => !err)
  );
});

onMounted(async () => {
  try {
    await initializeLergData();
  } catch (err) {
    console.error('Failed to initialize LERG service:', err);
    error.value = err instanceof Error ? err.message : 'Failed to initialize LERG service';
  }

  await checkPingStatus();

  pingInterval.value = window.setInterval(async () => {
    await checkPingStatus();
  }, 30000);
});

onUnmounted(() => {
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

// --- Drag and Drop Setup ---
const handleFileDrop = (file: File) => {
  selectedFile.value = file;
  lergUploadStatus.value = null; // Clear previous status
  clearDragDropError(); // Clear composable error

  Papa.parse(file, {
    header: false,
    skipEmptyLines: true,
    complete: (results: ParseResult<string[]>) => {
      if (results.errors.length > 0) {
        lergUploadStatus.value = {
          type: 'error',
          message: 'Failed to parse CSV',
          details: results.errors[0].message,
        };
        return;
      }
      if (results.data.length === 0 || results.data[0].length === 0) {
        lergUploadStatus.value = {
          type: 'error',
          message: 'Empty or invalid CSV file',
          details: 'The file appears to be empty or could not be parsed correctly.',
        };
        return;
      }
      columns.value = results.data[0].map((h) => h.trim());
      previewData.value = results.data
        .slice(0, 10)
        .map((row) => (Array.isArray(row) ? row.map((cell) => cell?.trim() || '') : []));
      startLine.value = 1;
      showPreviewModal.value = true;
    },
    error: (error: Error) => {
      lergUploadStatus.value = {
        type: 'error',
        message: 'Failed to read file',
        details: error.message,
      };
    },
  });
};

const handleDropError = (message: string) => {
  // Display error using the composable's error message ref
};

const {
  isDragging, // Use isDragging from composable
  errorMessage: dragDropErrorMessage,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop: handleDropFromComposable, // Rename to avoid conflict with template event
  clearError: clearDragDropError,
} = useDragDrop({
  acceptedExtensions: ['.csv', '.txt'],
  onDropCallback: handleFileDrop,
  onError: handleDropError,
});
// --- End Drag and Drop Setup ---

async function handleLergFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  // Clear potential error from composable if user selects via button
  clearDragDropError();
  handleFileDrop(file); // Reuse the file processing logic
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

    await checkEdgeFunctionStatus();

    if (!isEdgeFunctionAvailable.value) {
      throw new Error(
        'Edge functions are not available. Cannot clear LERG data from the database.'
      );
    }

    await clearLerg();

    isLergUploading.value = false;
    lergUploadStatus.value = {
      type: 'success',
      message: 'LERG data cleared successfully',
      details: 'Data has been removed from both the local store and the database',
    };

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

function toggleAddLergSection() {
  showAddLergSection.value = !showAddLergSection.value;
}

function handleMappingUpdate(newMappings: Record<string, string>) {
  columnMappings.value = newMappings;
}

function toggleCanadianDetails() {
  showCanadianDetails.value = !showCanadianDetails.value;
}

const getCanadaTotalNPAs = computed(() => {
  return store.getCanadianProvinces.reduce((total, province) => {
    return total + province.npas.length;
  }, 0);
});

const getUSTotalNPAs = computed(() => {
  return store.getUSStates.reduce((total, state) => {
    return total + state.npas.length;
  }, 0);
});

const getNonUSTotalNPAs = computed(() => {
  return store.getDistinctCountries.reduce((total, country) => {
    return total + country.npaCount;
  }, 0);
});

function validateForm(): boolean {
  let isValid = true;
  validationErrors.npa = undefined;
  validationErrors.state = undefined;
  validationErrors.country = undefined;

  if (!/^[0-9]{3}$/.test(newRecord.npa)) {
    validationErrors.npa = 'NPA must be exactly 3 digits.';
    isValid = false;
  }

  if (!/^[A-Za-z]{2}$/.test(newRecord.state)) {
    validationErrors.state = 'State/Province must be exactly 2 letters.';
    isValid = false;
  } else if (newRecord.country === 'US' && !(newRecord.state in STATE_CODES)) {
    validationErrors.state = `Invalid US State code: ${newRecord.state}`;
    isValid = false;
  } else if (newRecord.country === 'CA' && !(newRecord.state in PROVINCE_CODES)) {
    validationErrors.state = `Invalid Canadian Province code: ${newRecord.state}`;
    isValid = false;
  }

  if (!/^[A-Za-z]{2}$/.test(newRecord.country)) {
    validationErrors.country = 'Country must be exactly 2 letters.';
    isValid = false;
  } else if (!(newRecord.country in COUNTRY_CODES)) {
    validationErrors.country = `Invalid Country code: ${newRecord.country}`;
    isValid = false;
  }

  return isValid;
}

watch(newRecord, () => {
  validateForm();
});

async function handleAddSingleRecord() {
  addSuccessMessage.value = null;
  if (!validateForm()) {
    return;
  }

  try {
    await addAndRefreshLergRecord({
      npa: newRecord.npa,
      state: newRecord.state.toUpperCase(),
      country: newRecord.country.toUpperCase(),
    });

    if (!error.value) {
      addSuccessMessage.value = `Record ${newRecord.npa} added successfully. Data refreshed.`;
      newRecord.npa = '';
      newRecord.state = '';
      newRecord.country = '';
      validationErrors.npa = undefined;
      validationErrors.state = undefined;
      validationErrors.country = undefined;

      setTimeout(() => {
        addSuccessMessage.value = null;
      }, 5000);
    }
  } catch (err) {
    console.error('[AdminView] Error calling addAndRefreshLergRecord:', err);
  }
}

// --- Helper Functions ---

/**
 * Returns Tailwind classes for the status container based on the status type.
 * @param statusType - The type of the status ('success', 'error', 'warning').
 * @returns Tailwind CSS class string.
 */
function getStatusClass(statusType: 'success' | 'error' | 'warning'): string {
  switch (statusType) {
    case 'success':
      return 'bg-green-100 border border-green-400';
    case 'error':
      return 'bg-red-100 border border-red-400';
    case 'warning':
      return 'bg-yellow-100 border border-yellow-400';
    default:
      return 'bg-gray-100 border border-gray-400';
  }
}

/**
 * Returns Tailwind text color classes based on the status type.
 * @param statusType - The type of the status ('success', 'error', 'warning').
 * @returns Tailwind CSS class string for text color.
 */
function getStatusTextClass(statusType: 'success' | 'error' | 'warning'): string {
  switch (statusType) {
    case 'success':
      return 'text-green-800';
    case 'error':
      return 'text-red-800';
    case 'warning':
      return 'text-yellow-800';
    default:
      return 'text-gray-800';
  }
}
</script>
