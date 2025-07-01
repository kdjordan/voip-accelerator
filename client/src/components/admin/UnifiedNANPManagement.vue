<template>
  <div class="bg-gray-900/50">
    <div class="px-6 py-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">NANP Data Management</h2>
        <span v-if="stats" class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
          {{ stats.total }} NPAs
        </span>
      </div>
    </div>

    <div class="border-t border-gray-700/50 p-6 space-y-6">

      <!-- Statistics Dashboard -->
      <div v-if="stats" class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-white">{{ stats.total }}</div>
          <div class="text-gray-400 text-sm">Total NPAs</div>
        </div>
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <div class="text-xl font-bold text-green-400">{{ stats.us_domestic }}</div>
          <div class="text-gray-400 text-sm">US Domestic</div>
        </div>
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <div class="text-xl font-bold text-blue-400">{{ stats.canadian }}</div>
          <div class="text-gray-400 text-sm">Canada</div>
        </div>
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <div class="text-xl font-bold text-yellow-400">{{ stats.caribbean }}</div>
          <div class="text-gray-400 text-sm">Caribbean</div>
        </div>
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <div class="text-xl font-bold text-purple-400">{{ stats.pacific }}</div>
          <div class="text-gray-400 text-sm">Pacific</div>
        </div>
      </div>

      <!-- Management Tabs -->
      <div class="border-b border-gray-700">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
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
          <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <span class="text-2xl">📅</span>
              <div>
                <h3 class="text-lg font-medium text-blue-400 mb-2">Monthly LERG Update</h3>
                <p class="text-blue-300 text-sm mb-3">
                  Upload the latest LERG file to add new NPA records to the database. 
                  Existing records will not be overwritten.
                </p>
                <div class="text-xs text-blue-400">
                  💡 Tip: Download the latest LERG data from your provider monthly
                </div>
              </div>
            </div>
          </div>

          <!-- File Upload Area -->
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
            :class="[
              isDragging 
                ? 'border-accent bg-accent/10' 
                : 'border-gray-600 hover:border-gray-500'
            ]"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @dragover="handleDragOver"
            @drop="handleDrop"
          >
            <div class="space-y-4">
              <DocumentIcon class="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <h3 class="text-lg font-medium text-white">Drop LERG CSV file here</h3>
                <p class="text-gray-400 text-sm">or click to browse</p>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                @change="handleFileSelect"
                class="hidden"
                ref="fileInput"
              />
              <button
                @click="$refs.fileInput?.click()"
                class="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
              >
                Select File
              </button>
            </div>
          </div>

          <!-- Upload Status -->
          <div v-if="uploadStatus" class="p-4 rounded-lg" :class="getStatusClass(uploadStatus.type)">
            <div class="flex items-start space-x-3">
              <span class="text-xl">
                {{ uploadStatus.type === 'success' ? '✅' : uploadStatus.type === 'error' ? '❌' : 'ℹ️' }}
              </span>
              <div>
                <h3 class="font-medium" :class="getStatusTextClass(uploadStatus.type)">
                  {{ uploadStatus.message }}
                </h3>
                <p v-if="uploadStatus.details" class="text-sm mt-1" :class="getStatusTextClass(uploadStatus.type)">
                  {{ uploadStatus.details }}
                </p>
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex items-center justify-center space-x-2 text-gray-400">
            <ArrowPathIcon class="animate-spin h-5 w-5 text-accent" />
            <span>Processing LERG data... Please wait.</span>
          </div>
        </div>

        <!-- Single Record Add Tab -->
        <div v-if="activeTab === 'add-single'" class="space-y-6">
          <div class="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <span class="text-2xl">➕</span>
              <div>
                <h3 class="text-lg font-medium text-green-400 mb-2">Add Single NPA Record</h3>
                <p class="text-green-300 text-sm">
                  Manually add individual NPA records when you discover missing data or need immediate updates.
                </p>
              </div>
            </div>
          </div>

          <!-- Single Record Form -->
          <form @submit.prevent="handleAddSingleRecord" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- NPA Input -->
              <div>
                <label for="npa" class="block text-sm font-medium text-gray-300 mb-1">NPA *</label>
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
                <label for="state" class="block text-sm font-medium text-gray-300 mb-1">
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
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
                <p v-if="validationErrors.state" class="mt-1 text-xs text-red-400">
                  {{ validationErrors.state }}
                </p>
              </div>

              <!-- Country Input -->
              <div>
                <label for="country" class="block text-sm font-medium text-gray-300 mb-1">
                  Country *
                </label>
                <select
                  id="country"
                  v-model="newRecord.country"
                  required
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                >
                  <option value="">Select country...</option>
                  <option value="US">US - United States</option>
                  <option value="CA">CA - Canada</option>
                  <option value="BS">BS - Bahamas</option>
                  <option value="BB">BB - Barbados</option>
                  <option value="JM">JM - Jamaica</option>
                  <option value="TT">TT - Trinidad & Tobago</option>
                  <option value="GU">GU - Guam</option>
                  <option value="AS">AS - American Samoa</option>
                  <option value="MP">MP - N. Mariana Islands</option>
                </select>
                <p v-if="validationErrors.country" class="mt-1 text-xs text-red-400">
                  {{ validationErrors.country }}
                </p>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <!-- Success Message -->
                <p v-if="addSuccessMessage" class="text-sm text-green-400">
                  {{ addSuccessMessage }}
                </p>
                <!-- Error Message -->
                <p v-if="error && !isLoading" class="text-sm text-red-400">
                  {{ error }}
                </p>
              </div>

              <div class="flex items-center space-x-3">
                <!-- Loading Indicator -->
                <div v-if="isLoading" class="flex items-center space-x-2 text-sm text-gray-400">
                  <ArrowPathIcon class="animate-spin h-4 w-4 text-accent" />
                  <span>Adding...</span>
                </div>

                <button
                  type="submit"
                  :disabled="isLoading || !isFormValid"
                  class="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  {{ isLoading ? 'Adding...' : 'Add Record' }}
                </button>
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
                class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div class="flex space-x-2">
              <select 
                v-model="selectedCategory" 
                class="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="us-domestic">US Domestic</option>
                <option value="canadian">Canada</option>
                <option value="caribbean">Caribbean</option>
                <option value="pacific">Pacific</option>
              </select>
              <button
                @click="exportData"
                class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                📋 Export
              </button>
              <button
                @click="loadData"
                class="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <!-- Data Table -->
          <div class="bg-gray-800/50 rounded-lg overflow-hidden">
            <div class="max-h-96 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-700/50 sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left text-gray-300">NPA</th>
                    <th class="px-4 py-3 text-left text-gray-300">Location</th>
                    <th class="px-4 py-3 text-left text-gray-300">Category</th>
                    <th class="px-4 py-3 text-left text-gray-300">Source</th>
                    <th class="px-4 py-3 text-left text-gray-300">Quality</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                  <tr 
                    v-for="npa in filteredNPAs" 
                    :key="npa.npa"
                    class="hover:bg-gray-700/30"
                  >
                    <td class="px-4 py-3 font-mono text-accent">{{ npa.npa }}</td>
                    <td class="px-4 py-3">
                      <div>
                        <div class="text-white text-sm">{{ npa.state_province_name }}, {{ npa.country_name }}</div>
                        <div class="text-gray-400 text-xs">{{ npa.state_province_code }}, {{ npa.country_code }}</div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span 
                        class="px-2 py-1 rounded text-xs"
                        :class="getCategoryBadgeClass(npa.category)"
                      >
                        {{ formatCategory(npa.category) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-400">{{ npa.source || 'lerg' }}</td>
                    <td class="px-4 py-3 text-gray-400">
                      <div class="flex items-center space-x-2">
                        <span class="text-xs">{{ (npa.confidence_score * 100).toFixed(0) }}%</span>
                        <div class="w-12 bg-gray-700 rounded-full h-1.5">
                          <div 
                            class="h-1.5 rounded-full"
                            :class="npa.confidence_score >= 0.9 ? 'bg-green-500' : npa.confidence_score >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'"
                            :style="{ width: `${npa.confidence_score * 100}%` }"
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div v-if="filteredNPAs.length === 0" class="text-center py-8 text-gray-500">
              <div v-if="isLoading">Loading NPAs...</div>
              <div v-else>No NPAs found matching your criteria.</div>
            </div>
          </div>

          <!-- Table Footer -->
          <div v-if="filteredNPAs.length > 0" class="flex justify-between items-center text-sm text-gray-400">
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
    @update:mappings="handleMappingUpdate"
    @update:valid="(isValid) => (isModalValid = isValid)"
    @update:start-line="(newStartLine) => (startLine = newStartLine)"
    @confirm="handleModalConfirm"
    @cancel="handleModalCancel"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { ChevronDownIcon, ArrowPathIcon, DocumentIcon } from '@heroicons/vue/24/outline';
import { useLergStoreV2 } from '@/stores/lerg-store-v2';
import { useLergOperations } from '@/composables/useLergOperations';
import { useDragDrop } from '@/composables/useDragDrop';
import PreviewModal from '@/components/shared/PreviewModal.vue';
import Papa from 'papaparse';

// LERG column options for preview modal
const LERG_COLUMN_ROLE_OPTIONS = [
  { value: 'npa', label: 'NPA' },
  { value: 'state', label: 'State/Province' },
  { value: 'country', label: 'Country' },
];

// Tabs configuration
const tabs = [
  { id: 'upload', label: 'Monthly LERG Upload' },
  { id: 'add-single', label: 'Add Single Record' },
  { id: 'manage', label: 'Manage Data' }
];

// New simplified LERG store and operations
const store = useLergStoreV2();
const {
  isLoading,
  error,
  uploadLerg,
  addRecord,
  clearLerg,
  downloadLerg,
} = useLergOperations();

// Store data access
const allNPAs = computed(() => store.allNPAs);
const stats = computed(() => store.stats);


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
  country: ''
});

const validationErrors = reactive({
  npa: '',
  state: '',
  country: ''
});

const addSuccessMessage = ref('');

// Data Management State
const searchTerm = ref('');
const selectedCategory = ref('');

// Computed Properties
const isFormValid = computed(() => {
  return newRecord.npa.length === 3 && 
         newRecord.state.length === 2 && 
         newRecord.country.length === 2;
});

const filteredNPAs = computed(() => {
  // Simple search and filter using store data
  let filtered = allNPAs.value;
  
  // Apply search term filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(npa => 
      npa.npa.includes(term) ||
      npa.country_name.toLowerCase().includes(term) ||
      npa.state_province_name.toLowerCase().includes(term)
    );
  }
  
  // Apply category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(npa => npa.category === selectedCategory.value);
  }
  
  return filtered.sort((a, b) => a.npa.localeCompare(b.npa));
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
        .map((row: any) => (Array.isArray(row) ? row.map((cell: any) => cell?.trim() || '') : []));
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
  // Data is already loaded via Dashboard initialization
  // No need to check edge function status - simplified architecture
  console.log('[UnifiedNANPManagement] Using data from unified store');
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
      startLine: startLine.value
    });

    uploadStatus.value = {
      type: 'success',
      message: 'LERG data uploaded successfully',
      details: 'New NPA records have been added to the database.'
    };

    // Data is automatically refreshed by the operations composable

  } catch (err: any) {
    uploadStatus.value = {
      type: 'error',
      message: 'Upload failed',
      details: err.message
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
  Object.keys(validationErrors).forEach(key => {
    (validationErrors as any)[key] = '';
  });

  try {
    await addRecord({
      npa: newRecord.npa,
      state: newRecord.state,
      country: newRecord.country
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
    alert('❌ Export failed: ' + err.message);
  }
}

// Helper Functions
function getStatusClass(type: string) {
  switch (type) {
    case 'success':
      return 'bg-green-900/20 border border-green-500/30';
    case 'error':
      return 'bg-red-900/20 border border-red-500/30';
    default:
      return 'bg-blue-900/20 border border-blue-500/30';
  }
}

function getStatusTextClass(type: string) {
  switch (type) {
    case 'success':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-blue-400';
  }
}

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case 'us-domestic':
      return 'bg-green-500/20 text-green-300';
    case 'canadian':
      return 'bg-blue-500/20 text-blue-300';
    case 'caribbean':
      return 'bg-yellow-500/20 text-yellow-300';
    case 'pacific':
      return 'bg-purple-500/20 text-purple-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
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

onMounted(() => {
  loadData();
});
</script>