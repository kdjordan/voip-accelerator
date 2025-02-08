<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-3xl font-bold mb-8">LERG Administration</h1>

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
              <h3 class="text-gray-400">Total Records</h3>
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
                      ? 'bg-green-500 animate-status-pulse-success'
                      : 'bg-red-500 animate-status-pulse-error'
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
                      ? 'bg-green-500 animate-status-pulse-success'
                      : 'bg-red-500 animate-status-pulse-error',
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
                  v-for="country in store.getCountryData.filter(c => c.country !== 'US' && c.npaCount > 1)"
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
                  v-for="country in store.getCountryData.filter(c => c.country !== 'US' && c.npaCount === 1)"
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
            accept=".txt"
            @change="handleLergFileChange"
          />
          <button
            @click="$refs.lergFileInput.click()"
            :disabled="isLergUploading"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            :class="{ 'opacity-50 cursor-not-allowed': isLergUploading }"
          >
            Choose File
          </button>
          <p class="text-sm text-gray-400 mt-2">or drag and drop your LERG file here</p>
          <p class="text-xs text-gray-500 mt-1">Supports TXT files (max 500MB)</p>
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
    <div class="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
      <div class="flex items-center justify-end space-x-4">
        <button
          @click="confirmClearLergData"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Clear LERG Data
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useLergStore } from '@/stores/lerg-store';
  import { lergApiService } from '@/services/lerg-api.service';
  import { ChevronDownIcon } from '@heroicons/vue/24/outline';
  import { getCountryName } from '@/constants/country-codes';
  import { getStateName } from '@/constants/state-codes';

  const store = useLergStore();
  const lergStats = computed(() => store.stats);
  const isLergProcessing = computed(() => store.isProcessing);
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

  const stateNPAs = computed(() => store.stateNPAs);
  console.log('Current state mappings:', stateNPAs.value);

  const dbStatus = ref({
    connected: false,
    error: '',
  });

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

    if (
      !confirm(
        'Uploading a new LERG file will delete all existing LERG data. This action cannot be undone. Are you sure you want to continue?'
      )
    ) {
      // Clear the file input
      if (event.target) {
        (event.target as HTMLInputElement).value = '';
      }
      return;
    }

    console.log('📁 File received in AdminLergView:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file type
    if (!file.name.endsWith('.txt') || file.type !== 'text/plain') {
      lergUploadStatus.value = {
        type: 'error',
        message: 'Error uploading - please reload page and try again',
      };
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      isLergUploading.value = true;
      lergUploadStatus.value = { type: 'success', message: 'Uploading LERG file...' };

      await lergApiService.uploadLergFile(formData);
      lergUploadStatus.value = { type: 'success', message: 'LERG file uploaded successfully' };
      setTimeout(() => {
        if (lergUploadStatus.value?.type === 'success') {
          lergUploadStatus.value = null;
        }
      }, 5000);
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

  function toggleExpand(countryName: string) {
    const index = expandedCountries.value.indexOf(countryName);
    if (index === -1) {
      expandedCountries.value.push(countryName);
    } else {
      expandedCountries.value.splice(index, 1);
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
</script>

<style>
  @keyframes status-pulse-success {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    50% {
      opacity: 0.6;
      box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
    }
  }

  @keyframes status-pulse-error {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    50% {
      opacity: 0.6;
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
    }
  }

  .animate-status-pulse-success {
    animation: status-pulse-success 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-status-pulse-error {
    animation: status-pulse-error 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
