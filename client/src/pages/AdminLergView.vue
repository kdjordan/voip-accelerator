<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-sizeXl tracking-wide text-accent uppercase mb-8">Lerg Administration</h1>

    <!-- Stats Dashboard -->
    <div class="flex flex-col gap-6 mb-8">
      <!-- Combined Stats Box -->
      <div class="bg-gray-800 rounded-lg p-6">
        <!-- LERG Stats Grid -->
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
              <div class="text-2xl font-bold">{{ formatNumber(lergStats.totalRecords) }}</div>
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
              <h3 class="text-gray-400">Database Status</h3>
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="
                    dbStatus.connected
                      ? 'bg-accent animate-status-pulse-success'
                      : 'bg-destructive animate-status-pulse-error'
                  "
                ></div>
                <span
                  v-if="!dbStatus.connected"
                  class="text-red-400 text-sm"
                  >{{ dbStatus.error }}</span
                >
              </div>
            </div>
          </div>
          <!-- Storage Status -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-gray-400">Storage Status</h3>
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
          <div class="bg-gray-900/30 rounded-lg overflow-hidden">
            <div
              @click="toggleStateDetails"
              class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium">US States</span>
                <ChevronDownIcon
                  :class="{ 'transform rotate-180': showStateDetails }"
                  class="w-4 h-4 transition-transform"
                />
              </div>
            </div>
            <!-- US States Content -->
            <div
              v-if="showStateDetails"
              class="p-4 space-y-4"
            >
              <!-- Full width rows for multi-NPA states -->
              <div class="space-y-2">
                <div
                  v-for="state in store.sortedStatesWithNPAs.filter(s => s.npas.length > 1)"
                  :key="state.code"
                  @click="toggleExpandState(state.code)"
                  class="bg-gray-900/80 p-4 rounded-lg w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
                >
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{{ getStateName(state.code, 'US') }}</span>
                    <div class="flex items-center space-x-4">
                      <div class="flex items-center space-x-2 px-2 py-1 rounded">
                        <span class="text-sm text-gray-400">{{ state.npas.length }} NPAs</span>
                        <ChevronDownIcon
                          :class="{ 'transform rotate-180': expandedStates.includes(state.code) }"
                          class="w-4 h-4 transition-transform"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Expanded NPAs list -->
                  <div
                    v-if="expandedStates.includes(state.code)"
                    class="mt-3 pl-4"
                  >
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
                  v-for="state in store.sortedStatesWithNPAs.filter(s => s.npas.length === 1)"
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

          <!-- Non-US States Section -->
          <div class="bg-gray-900/30 rounded-lg overflow-hidden">
            <div
              @click="toggleCountryDetails"
              class="p-4 w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium">Non-US States</span>
                <ChevronDownIcon
                  :class="{ 'transform rotate-180': showCountryDetails }"
                  class="w-4 h-4 transition-transform"
                />
              </div>
            </div>
            <!-- Non-US States Content -->
            <div
              v-if="showCountryDetails"
              class="p-4 space-y-4"
            >
              <!-- Full width rows for multi-NPA countries -->
              <div class="space-y-2">
                <div
                  v-for="country in store.getCountryData.filter(
                    c => c.country !== 'US' && !(c.country === 'CA' && !c.provinces) && c.npaCount > 1
                  )"
                  :key="country.country"
                  @click="toggleExpandCountry(country.country)"
                  class="bg-gray-900/80 p-4 rounded-lg w-full hover:bg-gray-600/40 transition-colors cursor-pointer"
                >
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{{ getCountryName(country.country) }}</span>
                    <div class="flex items-center space-x-4">
                      <div class="flex items-center space-x-2 px-2 py-1 rounded">
                        <span class="text-sm text-gray-400">{{ country.npaCount }} NPAs</span>
                        <ChevronDownIcon
                          :class="{ 'transform rotate-180': expandedCountries.includes(country.country) }"
                          class="w-4 h-4 transition-transform"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Expanded NPAs list -->
                  <div
                    v-if="expandedCountries.includes(country.country)"
                    class="mt-3 pl-4"
                  >
                    <!-- Show provinces for Canada -->
                    <div
                      v-if="country.country === 'CA'"
                      class="space-y-3"
                    >
                      <!-- Multi-NPA provinces -->
                      <div
                        v-for="province in country.provinces?.filter(p => p.npas.length > 1)"
                        :key="province.code"
                        class="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-600/40 transition-colors"
                        @click.stop="toggleExpandProvince(province.code)"
                      >
                        <div class="flex justify-between items-center">
                          <span class="font-medium">{{ getStateName(province.code, 'CA') }}</span>
                          <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-400">{{ province.npas.length }} NPAs</span>
                            <ChevronDownIcon
                              :class="{ 'transform rotate-180': expandedProvinces.includes(province.code) }"
                              class="w-4 h-4 transition-transform"
                            />
                          </div>
                        </div>
                        <!-- Expanded NPAs list for provinces -->
                        <div
                          v-if="expandedProvinces.includes(province.code)"
                          class="mt-3"
                        >
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
                          v-for="province in country.provinces?.filter(p => p.npas.length === 1)"
                          :key="province.code"
                          class="bg-gray-800/50 p-4 rounded-lg"
                        >
                          <div class="flex justify-between items-center">
                            <span class="font-medium">{{ getStateName(province.code, 'CA') }}</span>
                            <span class="text-gray-300">{{ province.npas[0] }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Show regular NPA list for other countries -->
                    <div
                      v-else
                      class="flex flex-wrap gap-2"
                    >
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
                  v-for="country in store.getCountryData.filter(
                    c => c.country !== 'US' && !(c.country === 'CA' && !c.provinces) && c.npaCount === 1
                  )"
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

    <!-- File Upload Sections -->
    <div class="grid grid-cols-1 gap-6 mb-8">
      <!-- LERG Upload -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Upload LERG File</h2>
        <div
          @dragover.prevent
          @drop.prevent="handleLergFileDrop"
          class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center relative"
          :class="[
            isDragging ? 'border-green-500' : '',
            lergUploadStatus?.type === 'error' ? 'border-red-500' : '',
            isLergUploading ? 'border-blue-500' : '',
          ]"
        >
          <input
            type="file"
            ref="lergFileInput"
            class="hidden"
            accept=".csv"
            @change="handleLergFileChange"
          />
          <button
            @click="$refs.lergFileInput.click()"
            :disabled="isLergUploading"
            class="px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:border disabled:border-gray-700"
            :class="{ 'animate-upload-pulse': isLergUploading }"
          >
            <div class="flex items-center justify-center space-x-2">
              <ArrowUpTrayIcon class="w-4 h-4 text-accent" />
              <span class="text-sm text-accent">Choose File</span>
            </div>
          </button>
          <p class="text-xs text-gray-500 mt-1">Supports CSV files (max 500MB)</p>
        </div>
        <!-- Upload Status -->
        <div
          v-if="lergUploadStatus"
          class="mt-4 text-center"
        >
          <p :class="['text-sm', lergUploadStatus.type === 'error' ? 'text-red-400' : 'text-green-400']">
            {{ lergUploadStatus.message }}
          </p>
        </div>
      </div>
    </div>

    <!-- Data Recovery -->
    <!-- <div class="bg-green-900/20 border border-green-500/50 rounded-lg p-6 mb-4">
      <h2 class="text-xl font-semibold text-green-400 mb-4">Data Recovery</h2>
      <div class="flex items-center justify-end space-x-4"></div>
    </div> -->

    <!-- Danger Zone -->
    <div class="bg-destructive/10 border border-destructive/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-destructive">Danger Zone</h3>
        <button
          @click="confirmClearLergData"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-destructive/50 bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all rounded-md"
        >
          <TrashIcon class="w-3.5 h-3.5" />
          LERG
        </button>
      </div>
    </div>

    <!-- New Preview Modal -->
    <PreviewModal2
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :start-line="startLine"
      :column-options="LERG_COLUMN_ROLE_OPTIONS"
      @update:mappings="handleMappingUpdate"
      @update:valid="isValid => (isModalValid = isValid)"
      @update:start-line="newStartLine => (startLine = newStartLine)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useLergStore } from '@/stores/lerg-store';
  import { lergApiService } from '@/services/lerg-api.service';
  import { ChevronDownIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline';
  import { getCountryName } from '@/types/country-codes';
  import { getStateName } from '@/types/state-codes';
  import { LERG_COLUMN_ROLE_OPTIONS } from '@/types/lerg-types';
  import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
  import Papa from 'papaparse';
  import type { ParseResult } from 'papaparse';

  const store = useLergStore();
  const lergFileInput = ref<HTMLInputElement>();
  const lergStats = computed(() => store.stats);
  const expandedCountries = ref<string[]>([]);
  const showStateDetails = ref(false);
  const expandedStates = ref<string[]>([]);
  const expandedProvinces = ref<string[]>([]);
  const showCountryDetails = ref(false);

  const isLergLocallyStored = computed(() => {
    return store.isLocallyStored;
  });

  const isDragging = ref(false);
  const lergUploadStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);

  const isLergUploading = ref(false);

  const dbStatus = ref({
    connected: false,
    error: '',
  });

  // Preview state
  const showPreviewModal = ref(false);
  const columns = ref<string[]>([]);
  const previewData = ref<string[][]>([]);
  const columnRoles = ref<string[]>([]);
  const startLine = ref(0);
  const isModalValid = ref(false);
  const columnMappings = ref<Record<string, string>>({});
  const selectedFile = ref<File | null>(null);

  async function checkConnection() {
    try {
      await lergApiService.testConnection();
      dbStatus.value = {
        connected: true,
        error: '',
      };
    } catch (error) {
      dbStatus.value = {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  onMounted(async () => {
    await checkConnection();
    console.log('Initializing LERG service...');
    await lergApiService.initialize();
  });

  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  function formatDate(date: string | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function handleLergFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    selectedFile.value = file;

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: ParseResult<string[]>) => {
        columns.value = results.data[0].map(h => h.trim());
        previewData.value = results.data
          .slice(0, 10)
          .map(row => (Array.isArray(row) ? row.map(cell => cell?.trim() || '') : []));
        startLine.value = 1;
        showPreviewModal.value = true;
      },
    });
  }

  async function handleModalConfirm(mappings: Record<string, string>) {
    console.log('Modal confirmed with mappings:', mappings);
    showPreviewModal.value = false;
    columnMappings.value = mappings;

    // Continue with file upload using mapped columns
    const file = selectedFile.value;
    console.log('File to upload:', file);
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mappings', JSON.stringify(columnMappings.value));
    formData.append('startLine', startLine.value.toString());

    console.log('FormData contents:', {
      file: formData.get('file'),
      mappings: formData.get('mappings'),
      startLine: formData.get('startLine'),
    });

    try {
      isLergUploading.value = true;
      lergUploadStatus.value = { type: 'success', message: 'Uploading LERG file...' };

      console.log('About to call lergApiService.uploadLergFile');
      await lergApiService.uploadLergFile(formData);
      lergUploadStatus.value = { type: 'success', message: 'LERG file uploaded successfully' };

      // Clear the selected file after successful upload
      selectedFile.value = null;
      if (lergFileInput.value) {
        lergFileInput.value.value = '';
      }
    } catch (error) {
      console.error('Failed to upload LERG file:', error);
      lergUploadStatus.value = {
        type: 'error',
        message: 'Error uploading - please reload page and try again',
      };
    } finally {
      isLergUploading.value = false;
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    if (lergFileInput.value) {
      lergFileInput.value.value = '';
    }
  }

  async function confirmClearLergData() {
    if (!confirm('Are you sure you want to clear all LERG codes? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch('/api/admin/lerg/clear/lerg', { method: 'DELETE' });
      console.log('LERG codes cleared successfully');
    } catch (error) {
      console.error('Failed to clear LERG data:', error);
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

  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }
</script>
