<template>
  <div class="bg-row">
    <div class="px-6 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <h2 class="text-xl font-semibold">LERG Management</h2>
          <div class="w-3 h-3 rounded-full" :class="edgeStatusClass" :title="edgeStatusTitle"></div>
        </div>
        <BaseBadge v-if="stats" variant="accent" size="small"> {{ stats.total }} NPAs </BaseBadge>
      </div>
    </div>

    <div class="border-t border-line p-6 space-y-6">
      <!-- Statistics Dashboard -->
      <div v-if="stats" class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-surface p-4 rounded-lg">
          <div class="text-2xl font-bold text-fg">{{ stats.total }}</div>
          <div class="text-fg-faint text-sm">Total NPAs</div>
        </div>
        <div class="bg-surface p-4 rounded-lg">
          <div class="text-xl font-bold text-fg">{{ stats.us_domestic }}</div>
          <div class="text-fg-faint text-sm">US Domestic</div>
        </div>
        <div class="bg-surface p-4 rounded-lg">
          <div class="text-xl font-bold text-fg">{{ stats.canadian }}</div>
          <div class="text-fg-faint text-sm">Canada</div>
        </div>
        <div class="bg-surface p-4 rounded-lg">
          <div class="text-xl font-bold text-fg">{{ stats.caribbean }}</div>
          <div class="text-fg-faint text-sm">Caribbean</div>
        </div>
        <div class="bg-surface p-4 rounded-lg">
          <div class="text-xl font-bold text-fg">{{ stats.pacific }}</div>
          <div class="text-fg-faint text-sm">Pacific</div>
        </div>
      </div>

      <!-- Management Tabs -->
      <div class="border-b border-line">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-fg-faint hover:text-fg-dim hover:border-line',
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="mt-6">
        <!-- Monthly LERG Upload Tab -->
        <div v-if="activeTab === 'upload'" class="space-y-6">
        

          <!-- File Upload Area -->
          <div
            class="border-2 rounded-lg p-8 text-center transition-colors"
            :class="[
              isDragging
                ? 'border-solid border-accent bg-accent-soft'
                : 'border-dashed border-line-strong hover:border-accent hover:bg-row',
            ]"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @dragover="handleDragOver"
            @drop="handleDrop"
          >
            <div class="space-y-4">
              <DocumentIcon class="mx-auto h-12 w-12 text-fg-faint" />
              <div>
                <h3 class="text-lg font-medium text-fg">Drop LERG CSV file here</h3>
                <p class="text-fg-faint text-sm">or click to browse</p>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                @change="handleFileSelect"
                class="hidden"
                ref="fileInput"
              />
              <BaseButton
                @click="$refs.fileInput?.click()"
                variant="primary"
                size="standard"
                :icon="DocumentIcon"
              >
                Select File
              </BaseButton>
            </div>
          </div>

          <!-- Upload Status -->
          <div
            v-if="uploadStatus"
            class="p-4 rounded-lg"
            :class="getStatusClass(uploadStatus.type)"
          >
            <div class="flex items-start space-x-3">
              <span class="text-xl">
                {{
                  uploadStatus.type === 'success'
                    ? '✅'
                    : uploadStatus.type === 'error'
                      ? '❌'
                      : 'ℹ️'
                }}
              </span>
              <div>
                <h3 class="font-medium" :class="getStatusTextClass(uploadStatus.type)">
                  {{ uploadStatus.message }}
                </h3>
                <p
                  v-if="uploadStatus.details"
                  class="text-sm mt-1"
                  :class="getStatusTextClass(uploadStatus.type)"
                >
                  {{ uploadStatus.details }}
                </p>
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex items-center justify-center space-x-2 text-fg-faint">
            <ArrowPathIcon class="animate-spin h-5 w-5 text-accent" />
            <span>Processing LERG data... Please wait.</span>
          </div>
        </div>

        <!-- Single Record Add Tab -->
        <div v-if="activeTab === 'add-single'" class="space-y-6">
          <div class="bg-row border border-line rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <span class="text-2xl">➕</span>
              <div>
                <h3 class="text-lg font-medium text-fg mb-2">Add Single NPA Record</h3>
                <p class="text-fg-dim text-sm">
                  Manually add individual NPA records when you discover missing data or need
                  immediate updates.
                </p>
              </div>
            </div>
          </div>

          <!-- Single Record Form -->
          <form @submit.prevent="handleAddSingleRecord" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- NPA Input -->
              <div>
                <label for="npa" class="block text-sm font-medium text-fg-dim mb-1">NPA *</label>
                <input
                  type="text"
                  id="npa"
                  v-model="newRecord.npa"
                  required
                  maxlength="3"
                  pattern="^[0-9]{3}$"
                  placeholder="e.g., 212"
                  class="w-full px-3 py-2 bg-input border border-line-strong rounded-md shadow-sm placeholder-fg-mute focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
                <p v-if="validationErrors.npa" class="mt-1 text-xs text-down">
                  {{ validationErrors.npa }}
                </p>
              </div>

              <!-- State Input -->
              <div>
                <label for="state" class="block text-sm font-medium text-fg-dim mb-1">
                  State/Province *
                </label>
                <input
                  type="text"
                  id="state"
                  v-model="newRecord.state"
                  required
                  maxlength="2"
                  pattern="^[A-Za-z]{2}$"
                  placeholder="e.g., NY, ON"
                  @input="newRecord.state = newRecord.state.toUpperCase()"
                  class="w-full px-3 py-2 bg-input border border-line-strong rounded-md shadow-sm placeholder-fg-mute focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
                <p v-if="validationErrors.state" class="mt-1 text-xs text-down">
                  {{ validationErrors.state }}
                </p>
              </div>

              <!-- Country Input -->
              <div>
                <Listbox v-model="newRecord.country" as="div">
                  <ListboxLabel class="block text-sm font-medium text-fg-dim mb-1">
                    Country *
                  </ListboxLabel>
                  <div class="relative mt-1">
                    <ListboxButton
                      class="relative w-full cursor-default rounded-md bg-input py-2.5 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:text-sm border border-line-strong"
                    >
                      <span class="block truncate text-fg">{{
                        getCountryLabel(newRecord.country)
                      }}</span>
                      <span
                        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                      >
                        <ChevronUpDownIcon class="h-5 w-5 text-fg-faint" aria-hidden="true" />
                      </span>
                    </ListboxButton>
                    <transition
                      leave-active-class="transition duration-100 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <ListboxOptions
                        class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface py-1 text-base shadow-lg ring-1 ring-line focus:outline-none sm:text-sm"
                      >
                        <ListboxOption v-slot="{ active, selected }" :value="''" as="template">
                          <li
                            :class="[
                              active ? 'bg-accent-soft text-accent' : 'text-fg-dim',
                              'relative cursor-default select-none py-2 pl-10 pr-4',
                            ]"
                          >
                            <span
                              :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']"
                            >
                              Select country...
                            </span>
                            <span
                              v-if="selected"
                              class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent"
                            >
                              <CheckIcon class="h-5 w-5" aria-hidden="true" />
                            </span>
                          </li>
                        </ListboxOption>
                        <ListboxOption
                          v-for="country in countryOptions"
                          :key="country.value"
                          v-slot="{ active, selected }"
                          :value="country.value"
                          as="template"
                        >
                          <li
                            :class="[
                              active ? 'bg-accent-soft text-accent' : 'text-fg-dim',
                              'relative cursor-default select-none py-2 pl-10 pr-4',
                            ]"
                          >
                            <span
                              :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']"
                            >
                              {{ country.label }}
                            </span>
                            <span
                              v-if="selected"
                              class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent"
                            >
                              <CheckIcon class="h-5 w-5" aria-hidden="true" />
                            </span>
                          </li>
                        </ListboxOption>
                      </ListboxOptions>
                    </transition>
                  </div>
                </Listbox>
                <p v-if="validationErrors.country" class="mt-1 text-xs text-down">
                  {{ validationErrors.country }}
                </p>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <!-- Success Message -->
                <p v-if="addSuccessMessage" class="text-sm text-warn">
                  {{ addSuccessMessage }}
                </p>
                <!-- Error Message -->
                <p v-if="error && !isLoading" class="text-sm text-down">
                  {{ error }}
                </p>
              </div>

              <div class="flex items-center space-x-3">
                <!-- Loading Indicator -->
                <div v-if="isLoading" class="flex items-center space-x-2 text-sm text-fg-faint">
                  <ArrowPathIcon class="animate-spin h-4 w-4 text-accent" />
                  <span>Adding...</span>
                </div>

                <BaseButton
                  type="submit"
                  :disabled="!isFormValid"
                  :loading="isLoading"
                  variant="primary"
                  size="standard"
                >
                  Add Record
                </BaseButton>
              </div>
            </div>
          </form>
        </div>

        <!-- Data Management Tab -->
        <div v-if="activeTab === 'manage'" class="space-y-6">
          <!-- Search and Actions -->
          <div class="flex flex-wrap gap-4 items-center justify-between">
            <div class="flex-1 min-w-64">
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Search NPAs, countries, or regions..."
                class="w-full bg-input border border-line-strong rounded px-3 py-2 text-fg text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div class="flex space-x-2">
              <Listbox v-model="selectedCategory" as="div" class="relative">
                <ListboxButton
                  class="relative min-w-[160px] cursor-default rounded-md bg-input py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas text-sm border border-line-strong"
                >
                  <span class="block truncate text-fg">{{
                    getCategoryLabel(selectedCategory)
                  }}</span>
                  <span
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <ChevronUpDownIcon class="h-5 w-5 text-fg-faint" aria-hidden="true" />
                  </span>
                </ListboxButton>
                <transition
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <ListboxOptions
                    class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface py-1 text-base shadow-lg ring-1 ring-line focus:outline-none sm:text-sm"
                  >
                    <ListboxOption
                      v-for="category in categoryOptions"
                      :key="category.value"
                      v-slot="{ active, selected }"
                      :value="category.value"
                      as="template"
                    >
                      <li
                        :class="[
                          active ? 'bg-accent-soft text-accent' : 'text-fg-dim',
                          'relative cursor-default select-none py-2 pl-10 pr-4',
                        ]"
                      >
                        <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                          {{ category.label }}
                        </span>
                        <span
                          v-if="selected"
                          class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent"
                        >
                          <CheckIcon class="h-5 w-5" aria-hidden="true" />
                        </span>
                      </li>
                    </ListboxOption>
                  </ListboxOptions>
                </transition>
              </Listbox>
              <BaseButton @click="exportData" variant="secondary" size="standard">
                Export
              </BaseButton>
              <BaseButton @click="loadData" variant="primary" size="standard" :icon="ArrowPathIcon">
                Refresh
              </BaseButton>
              <BaseButton
                @click="confirmClearLergData"
                variant="destructive"
                size="standard"
                :loading="isLoading"
              >
                Clear All Data
              </BaseButton>
            </div>
          </div>

          <!-- Operation Error -->
          <p v-if="error && !isLoading" class="text-sm text-down">{{ error }}</p>

          <!-- Data Table -->
          <div class="bg-surface rounded-lg overflow-hidden">
            <div class="max-h-96 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="bg-row sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left text-fg-dim">NPA</th>
                    <th class="px-4 py-3 text-left text-fg-dim">Location</th>
                    <th class="px-4 py-3 text-left text-fg-dim">Category</th>
                    <th class="px-4 py-3 text-right text-fg-dim">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  <tr v-for="npa in filteredNPAs" :key="npa.npa" class="hover:bg-row-hover">
                    <td class="px-4 py-3 font-mono text-accent">{{ npa.npa }}</td>
                    <td class="px-4 py-3">
                      <div>
                        <div class="text-fg text-sm">
                          {{ npa.state_province_name }}, {{ npa.country_name }}
                        </div>
                        <div class="text-fg-faint text-xs">
                          {{ npa.state_province_code }}, {{ npa.country_code }}
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <BaseBadge :variant="getCategoryBadgeVariant(getNPACategory(npa))" size="small">
                        {{ formatCategory(getNPACategory(npa)) }}
                      </BaseBadge>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <BaseButton
                        variant="destructive"
                        size="small"
                        :icon="TrashIcon"
                        title="Delete NPA"
                        @click="confirmDeleteNPA(npa.npa)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="filteredNPAs.length === 0" class="text-center py-8 text-fg-mute">
              <div v-if="isLoading">Loading NPAs...</div>
              <div v-else>No NPAs found matching your criteria.</div>
            </div>
          </div>

          <!-- Table Footer -->
          <div
            v-if="filteredNPAs.length > 0"
            class="flex justify-between items-center text-sm text-fg-faint"
          >
            <span>Showing {{ filteredNPAs.length }} of {{ allNPAs.length }} NPAs</span>
            <span v-if="stats?.last_updated">
              Last updated: {{ new Date(stats.last_updated).toLocaleString() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Preview Modal (for LERG upload) -->
  <PreviewModal
    v-if="showPreviewModal"
    :showModal="showPreviewModal"
    :columns="columns"
    :preview-data="previewData"
    :start-line="startLine"
    :column-options="LERG_COLUMN_ROLE_OPTIONS"
    :source="'LERG'"
    :validate-required="true"
    @update:mappings="handleMappingUpdate"
    @update:valid="(isValid) => (isModalValid = isValid)"
    @update:start-line="(newStartLine) => (startLine = newStartLine)"
    @confirm="handleModalConfirm"
    @cancel="handleModalCancel"
  />

  <!-- Delete NPA Confirmation -->
  <ConfirmationModal
    v-model="showDeleteModal"
    title="Delete NPA"
    :message="`Delete NPA ${npaToDelete}? It will be removed from active LERG data.`"
    confirmButtonText="Delete"
    @confirm="handleDeleteConfirm"
  />

  <!-- Clear All LERG Confirmation -->
  <ConfirmationModal
    v-model="showClearModal"
    title="Clear All LERG Data"
    :message="clearMessage"
    confirm-button-text="Clear All Data"
    :requires-confirmation-phrase="true"
    confirmation-phrase="CLEAR"
    @confirm="doClearLergData"
  />

  <NoticeModal
    v-model="showNotice"
    :title="noticeTitle"
    :message="noticeMessage"
    :variant="noticeVariant"
  />
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, reactive } from 'vue';
  import {
    ChevronDownIcon,
    ArrowPathIcon,
    DocumentIcon,
    ChevronUpDownIcon,
    CheckIcon,
    TrashIcon,
  } from '@heroicons/vue/24/outline';
  import {
    Listbox,
    ListboxButton,
    ListboxLabel,
    ListboxOption,
    ListboxOptions,
  } from '@headlessui/vue';
  import { useLergStoreV2, type EnhancedNPARecord } from '@/stores/lerg-store-v2';
  import { useLergOperations } from '@/composables/useLergOperations';
  import { useDragDrop } from '@/composables/useDragDrop';
  import { usePingStatus } from '@/composables/usePingStatus';
  import PreviewModal from '@/components/shared/PreviewModal.vue';
  import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
  import NoticeModal from '@/components/shared/NoticeModal.vue';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import Papa from 'papaparse';

  // LERG column options for preview modal
  const LERG_COLUMN_ROLE_OPTIONS = [
    { value: 'npa', label: 'NPA', required: true },
    { value: 'state', label: 'State/Province', required: true },
    { value: 'country', label: 'Country', required: true },
  ];

  // Tabs configuration
  const tabs = [
    { id: 'upload', label: 'Monthly LERG Upload' },
    { id: 'add-single', label: 'Add Single Record' },
    { id: 'manage', label: 'Manage Data' },
  ];

  // New simplified LERG store and operations
  const store = useLergStoreV2();
  const { isLoading, error, uploadLerg, addRecord, deleteRecord, clearLerg, downloadLerg, initializeLergData } = useLergOperations();
  const { status: pingStatus, checkPingStatus } = usePingStatus();

  // Store data access
  const allNPAs = computed(() => store.allNPAs);
  const stats = computed(() => store.stats);

  // Country options for dropdown
  const countryOptions = [
    { value: 'US', label: 'US - United States' },
    { value: 'CA', label: 'CA - Canada' },
    { value: 'BS', label: 'BS - Bahamas' },
    { value: 'BB', label: 'BB - Barbados' },
    { value: 'JM', label: 'JM - Jamaica' },
    { value: 'TT', label: 'TT - Trinidad & Tobago' },
    { value: 'GU', label: 'GU - Guam' },
    { value: 'AS', label: 'AS - American Samoa' },
    { value: 'MP', label: 'MP - N. Mariana Islands' },
  ];

  // Category options for dropdown
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'us-domestic', label: 'US Domestic' },
    { value: 'canadian', label: 'Canada' },
    { value: 'caribbean', label: 'Caribbean' },
    { value: 'pacific', label: 'Pacific' },
  ];

  // UI State
  const activeTab = ref('upload');

  // File Upload State
  const showPreviewModal = ref(false);
  const columns = ref<string[]>([]);
  const previewData = ref<string[][]>([]);
  const startLine = ref(1);
  const isModalValid = ref(false);
  const uploadStatus = ref<any>(null);
  const selectedFile = ref<File | null>(null);

  // Single Record Add State
  const newRecord = reactive({
    npa: '',
    state: '',
    country: '',
  });

  const validationErrors = reactive({
    npa: '',
    state: '',
    country: '',
  });

  const addSuccessMessage = ref('');

  // Data Management State
  const searchTerm = ref('');
  const selectedCategory = ref('');

  // Per-NPA delete confirmation state
  const showDeleteModal = ref(false);
  const npaToDelete = ref('');
  const showClearModal = ref(false);
  const clearMessage = ref('');
  const showNotice = ref(false);
  const noticeTitle = ref('');
  const noticeMessage = ref('');
  const noticeVariant = ref<'success' | 'error' | 'info'>('info');

  function showNoticeModal(
    title: string,
    message: string,
    variant: 'success' | 'error' | 'info' = 'info'
  ) {
    noticeTitle.value = title;
    noticeMessage.value = message;
    noticeVariant.value = variant;
    showNotice.value = true;
  }

  // Computed Properties
  const isFormValid = computed(() => {
    return (
      newRecord.npa.length === 3 && newRecord.state.length === 2 && newRecord.country.length === 2
    );
  });

  const filteredNPAs = computed(() => {
    // Simple search and filter using store data
    let filtered = allNPAs.value;

    // Debug logging
    console.log('All NPAs count:', allNPAs.value.length);
    console.log('Search term:', searchTerm.value);
    console.log('Selected category:', selectedCategory.value);
    
    // Check if 242 exists in the store
    const npa242 = allNPAs.value.find(npa => npa.npa === '242');
    console.log('NPA 242 in store:', npa242);

    // Apply search term filter
    if (searchTerm.value) {
      const term = searchTerm.value.toLowerCase();
      filtered = filtered.filter(
        (npa) =>
          npa.npa.includes(term) ||
          npa.country_name.toLowerCase().includes(term) ||
          npa.state_province_name.toLowerCase().includes(term)
      );
      console.log('After search filter:', filtered.length);
    }

    // Apply category filter based on country_code and region
    if (selectedCategory.value) {
      filtered = filtered.filter((npa) => {
        const category = getNPACategory(npa);
        return category === selectedCategory.value;
      });
      console.log('After category filter:', filtered.length);
    }

    return filtered.sort((a, b) => a.npa.localeCompare(b.npa));
  });

  // Edge status computed properties
  const edgeStatusClass = computed(() => {
    const status = pingStatus.value;
    console.log('Edge status debug:', status); // Debug log

    if (!status) {
      return 'bg-fg-mute'; // Loading/unknown
    }

    if (status.hasLergTable === true && status.isOnline === true) {
      return 'bg-accent animate-status-pulse-success'; // Green pulsing
    } else {
      return 'bg-down animate-status-pulse-error'; // Red pulsing
    }
  });

  const edgeStatusTitle = computed(() => {
    const status = pingStatus.value;
    if (!status) {
      return 'Checking API status...';
    }

    if (status.hasLergTable === true && status.isOnline === true) {
      return 'API connected';
    } else {
      return `API disconnected${status.error ? ': ' + status.error : ''}`;
    }
  });

  // Drag and Drop Setup
  const handleFileDrop = (file: File) => {
    selectedFile.value = file;
    uploadStatus.value = null;

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.errors.length > 0) {
          uploadStatus.value = {
            type: 'error',
            message: 'Failed to parse CSV',
            details: results.errors[0].message,
          };
          return;
        }
        if (results.data.length === 0 || results.data[0].length === 0) {
          uploadStatus.value = {
            type: 'error',
            message: 'Empty or invalid CSV file',
            details: 'The file appears to be empty or could not be parsed correctly.',
          };
          return;
        }
        columns.value = results.data[0].map((h: string) => h.trim());
        previewData.value = results.data
          .slice(0, 10)
          .map((row: any) =>
            Array.isArray(row) ? row.map((cell: any) => cell?.trim() || '') : []
          );
        startLine.value = 1;
        showPreviewModal.value = true;
      },
      error: (error: Error) => {
        uploadStatus.value = {
          type: 'error',
          message: 'Failed to read file',
          details: error.message,
        };
      },
    });
  };

  const {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop: handleDropFromComposable,
  } = useDragDrop({
    acceptedExtensions: ['.csv', '.txt'],
    onDropCallback: handleFileDrop,
    onError: (message: string) => {
      uploadStatus.value = { type: 'error', message };
    },
  });

  // Methods

  async function loadData() {
    console.log('[UnifiedNANPManagement] Refreshing LERG data...');
    try {
      await initializeLergData({ force: true });
      console.log('[UnifiedNANPManagement] LERG data refreshed, count:', lergStore.allNPAs.length);
    } catch (err) {
      console.error('[UnifiedNANPManagement] Failed to refresh LERG data:', err);
    }
  }

  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      handleFileDrop(file);
    }
  }

  function handleDrop(event: DragEvent) {
    handleDropFromComposable(event);
  }

  function handleMappingUpdate(mappings: Record<string, string>) {
    // Store mappings for modal confirmation
  }

  async function handleModalConfirm(mappings: Record<string, string>) {
    if (!selectedFile.value) return;

    try {
      showPreviewModal.value = false;
      uploadStatus.value = { type: 'info', message: 'Processing LERG upload...' };

      await uploadLerg(selectedFile.value, {
        mappings,
        startLine: startLine.value,
      });

      uploadStatus.value = {
        type: 'success',
        message: 'LERG data uploaded successfully',
        details: 'New NPA records have been added to the database.',
      };

      // Data is automatically refreshed by the operations composable
    } catch (err: any) {
      uploadStatus.value = {
        type: 'error',
        message: 'Upload failed',
        details: err.message,
      };
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    selectedFile.value = null;
  }

  async function handleAddSingleRecord() {
    // Clear previous messages
    addSuccessMessage.value = '';
    Object.keys(validationErrors).forEach((key) => {
      (validationErrors as any)[key] = '';
    });

    try {
      await addRecord({
        npa: newRecord.npa,
        state: newRecord.state,
        country: newRecord.country,
      });

      addSuccessMessage.value = `✅ NPA ${newRecord.npa} added successfully`;

      // Reset form
      newRecord.npa = '';
      newRecord.state = '';
      newRecord.country = '';

      // Data is automatically refreshed by the operations composable

      // Clear success message after delay
      setTimeout(() => {
        addSuccessMessage.value = '';
      }, 5000);
    } catch (err: any) {
      console.error('[UnifiedNANPManagement] Failed to add record:', err);
    }
  }

  async function exportData() {
    try {
      const blob = await downloadLerg();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nanp-data-enhanced-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('[UnifiedNANPManagement] Export failed:', err);
      showNoticeModal('Export Failed', err.message, 'error');
    }
  }

  function confirmDeleteNPA(npa: string) {
    npaToDelete.value = npa;
    showDeleteModal.value = true;
  }

  async function handleDeleteConfirm() {
    try {
      await deleteRecord(npaToDelete.value);
    } catch (err: any) {
      // Error surfaced via the composable's `error` channel.
      console.error('[UnifiedNANPManagement] Delete failed:', err);
    } finally {
      showDeleteModal.value = false;
    }
  }

  function confirmClearLergData() {
    clearMessage.value =
      'WARNING: This will permanently clear ALL LERG data from the database.\n\n' +
      'This action cannot be undone. All ' +
      (stats.value?.total || 0) +
      ' NPA records will be removed.';
    showClearModal.value = true;
  }

  async function doClearLergData() {
    showClearModal.value = false;

    try {
      await clearLerg();
      showNoticeModal('LERG Data Cleared', 'Successfully cleared all LERG data from the database.', 'success');
    } catch (err: any) {
      console.error('[UnifiedNANPManagement] Clear failed:', err);
      showNoticeModal('Clear Failed', 'Failed to clear LERG data: ' + err.message, 'error');
    }
  }

  // Helper Functions
  function getStatusClass(type: string) {
    switch (type) {
      case 'success':
        return 'bg-warn-soft border border-warn';
      case 'error':
        return 'bg-down-soft border border-down';
      default:
        return 'bg-info-soft border border-info';
    }
  }

  function getStatusTextClass(type: string) {
    switch (type) {
      case 'success':
        return 'text-warn';
      case 'error':
        return 'text-down';
      default:
        return 'text-info';
    }
  }

  function getCategoryBadgeVariant(
    category: string
  ): 'success' | 'info' | 'warning' | 'neutral' {
    switch (category) {
      case 'us-domestic':
        return 'success';
      case 'canadian':
        return 'info';
      case 'caribbean':
        return 'warning';
      case 'pacific':
        return 'neutral';
      default:
        return 'neutral';
    }
  }

  function getNPACategory(npa: EnhancedNPARecord): string {
    // Determine category based on country_code, state_province_code, and region
    
    // Check for US territories first (before general US check)
    if (npa.country_code === 'US') {
      // Pacific territories: American Samoa, Guam, Northern Mariana Islands
      const pacificTerritories = ['AS', 'GU', 'MP', 'NN'];
      // Caribbean territories: Puerto Rico, US Virgin Islands
      const caribbeanTerritories = ['PR', 'VI'];
      
      if (pacificTerritories.includes(npa.state_province_code)) {
        return 'pacific';
      } else if (caribbeanTerritories.includes(npa.state_province_code)) {
        return 'caribbean';
      }
      // Otherwise it's US domestic (continental US states)
      return 'us-domestic';
    } else if (npa.country_code === 'CA') {
      return 'canadian';
    } else if (npa.region === 'Caribbean') {
      return 'caribbean';
    } else if (npa.region === 'Pacific') {
      return 'pacific';
    } else {
      // Default to caribbean for other countries (most are Caribbean)
      return 'caribbean';
    }
  }

  function formatCategory(category: string) {
    switch (category) {
      case 'us-domestic':
        return 'US Domestic';
      case 'canadian':
        return 'Canada';
      case 'caribbean':
        return 'Caribbean';
      case 'pacific':
        return 'Pacific';
      default:
        return category || 'Unknown';
    }
  }

  // Helper functions for labels
  function getCountryLabel(value: string): string {
    if (!value) return 'Select country...';
    const country = countryOptions.find((c) => c.value === value);
    return country ? country.label : value;
  }

  function getCategoryLabel(value: string): string {
    const category = categoryOptions.find((c) => c.value === value);
    return category ? category.label : 'All Categories';
  }

  onMounted(async () => {
    await loadData();
    await checkPingStatus();
  });
</script>
