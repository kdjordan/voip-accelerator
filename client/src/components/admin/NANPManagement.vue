<template>
  <div class="bg-gray-900/50">
    <div
      @click="toggleManagement"
      class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
    >
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">NANP Management</h2>
        <div class="flex items-center space-x-3">
          <span v-if="supabaseStats" class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
            {{ supabaseStats.total }} NPAs in database
          </span>
          <ChevronDownIcon
            :class="{ 'transform rotate-180': showManagement }"
            class="w-5 h-5 transition-transform text-gray-400"
          />
        </div>
      </div>
    </div>

    <div v-if="showManagement" class="border-t border-gray-700/50 p-6 space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center space-x-2 text-gray-400">
        <ArrowPathIcon class="animate-spin h-5 w-5 text-accent" />
        <span>Loading NANP data from Supabase...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <span class="text-2xl">❌</span>
          <div>
            <h3 class="text-lg font-medium text-red-400 mb-2">Database Connection Error</h3>
            <p class="text-red-300 text-sm mb-3">{{ error }}</p>
            <button
              @click="loadData"
              class="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors"
            >
              🔄 Retry Connection
            </button>
          </div>
        </div>
      </div>

      <!-- Main Management Interface -->
      <div v-else class="space-y-6">
        <!-- Statistics Dashboard -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-white">{{ supabaseStats?.total || 0 }}</div>
            <div class="text-gray-400 text-sm">Total NPAs</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-400">{{ supabaseStats?.us || 0 }}</div>
            <div class="text-gray-400 text-sm">US Domestic</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-blue-400">{{ supabaseStats?.canada || 0 }}</div>
            <div class="text-gray-400 text-sm">Canada</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-yellow-400">{{ supabaseStats?.caribbean || 0 }}</div>
            <div class="text-gray-400 text-sm">Caribbean</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex flex-wrap gap-3">
          <button
            @click="loadData"
            class="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
          >
            🔄 Refresh Data
          </button>
          
          <button
            @click="showAddModal = true"
            class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
          >
            ➕ Add NPA
          </button>
          
          <button
            @click="exportData"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            📋 Export CSV
          </button>
          
          <button
            @click="showImportModal = true"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            📥 Import CSV
          </button>
        </div>

        <!-- Search and Filter -->
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-64">
              <label class="block text-sm text-gray-400 mb-1">Search NPAs</label>
              <input 
                v-model="searchTerm" 
                type="text" 
                placeholder="Search by NPA, country, or region..."
                class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Category</label>
              <select 
                v-model="selectedCategory" 
                class="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="us-domestic">US Domestic</option>
                <option value="canadian">Canada</option>
                <option value="caribbean">Caribbean</option>
                <option value="pacific">Pacific</option>
              </select>
            </div>
          </div>
        </div>

        <!-- NPA Data Table -->
        <div class="bg-gray-800/50 rounded-lg overflow-hidden">
          <div class="max-h-96 overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-700/50 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left text-gray-300">NPA</th>
                  <th class="px-4 py-3 text-left text-gray-300">Category</th>
                  <th class="px-4 py-3 text-left text-gray-300">Country</th>
                  <th class="px-4 py-3 text-left text-gray-300">Region</th>
                  <th class="px-4 py-3 text-left text-gray-300">Source</th>
                  <th class="px-4 py-3 text-center text-gray-300">Actions</th>
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
                    <span 
                      class="px-2 py-1 rounded text-xs"
                      :class="getCategoryBadgeClass(npa.category)"
                    >
                      {{ formatCategory(npa.category) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-300">{{ npa.country_name || npa.country }}</td>
                  <td class="px-4 py-3 text-gray-300">{{ npa.region_name || npa.region || '-' }}</td>
                  <td class="px-4 py-3 text-gray-400">{{ npa.source || 'lerg' }}</td>
                  <td class="px-4 py-3 text-center">
                    <button
                      @click="editNPA(npa)"
                      class="text-blue-400 hover:text-blue-300 mr-2"
                      title="Edit NPA"
                    >
                      ✏️
                    </button>
                    <button
                      @click="deleteNPA(npa)"
                      class="text-red-400 hover:text-red-300"
                      title="Delete NPA"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="filteredNPAs.length === 0" class="text-center py-8 text-gray-500">
            No NPAs found matching your criteria.
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="filteredNPAs.length > 0" class="flex justify-between items-center text-sm text-gray-400">
          <span>Showing {{ filteredNPAs.length }} of {{ allNPAs.length }} NPAs</span>
          <span v-if="supabaseStats?.last_updated">
            Last updated: {{ new Date(supabaseStats.last_updated).toLocaleString() }}
          </span>
        </div>
      </div>
    </div>

    <!-- Add NPA Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-semibold text-white mb-4">Add New NPA</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">NPA *</label>
            <input 
              v-model="newNPA.npa" 
              type="text" 
              maxlength="3"
              placeholder="e.g., 555"
              class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          
          <div>
            <label class="block text-sm text-gray-400 mb-1">Category *</label>
            <select 
              v-model="newNPA.category" 
              class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-accent focus:outline-none"
            >
              <option value="">Select category...</option>
              <option value="us-domestic">US Domestic</option>
              <option value="canadian">Canada</option>
              <option value="caribbean">Caribbean</option>
              <option value="pacific">Pacific</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm text-gray-400 mb-1">Country *</label>
            <input 
              v-model="newNPA.country" 
              type="text" 
              placeholder="e.g., US, CA, JM"
              class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          
          <div>
            <label class="block text-sm text-gray-400 mb-1">Region</label>
            <input 
              v-model="newNPA.region" 
              type="text" 
              placeholder="e.g., California, Ontario"
              class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="showAddModal = false"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            @click="addNPA"
            :disabled="!canAddNPA"
            class="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Add NPA
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ChevronDownIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { useNANPManagement, type NPARecord } from '@/composables/useNANPManagement';

// NANP Management composable
const {
  isLoading,
  error,
  allNPAs,
  stats: supabaseStats,
  loadNPAs,
  addNPA: addNPAToDatabase,
  exportNPAs: exportNPAsToCSV
} = useNANPManagement();

// State
const showManagement = ref(false);

// UI State
const showAddModal = ref(false);
const showImportModal = ref(false);
const searchTerm = ref('');
const selectedCategory = ref('');

// Form State
const newNPA = ref<Partial<NPARecord>>({
  npa: '',
  category: undefined,
  country: '',
  region: ''
});

// Computed
const canAddNPA = computed(() => {
  return newNPA.value.npa?.length === 3 && 
         newNPA.value.category && 
         newNPA.value.country;
});

const filteredNPAs = computed(() => {
  let filtered = allNPAs.value;
  
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(npa => 
      npa.npa.includes(term) ||
      npa.country?.toLowerCase().includes(term) ||
      npa.region?.toLowerCase().includes(term) ||
      npa.country_name?.toLowerCase().includes(term) ||
      npa.region_name?.toLowerCase().includes(term)
    );
  }
  
  if (selectedCategory.value) {
    filtered = filtered.filter(npa => npa.category === selectedCategory.value);
  }
  
  return filtered.sort((a, b) => a.npa.localeCompare(b.npa));
});

// Methods
function toggleManagement() {
  showManagement.value = !showManagement.value;
  if (showManagement.value && allNPAs.value.length === 0) {
    loadData();
  }
}

async function loadData() {
  try {
    await loadNPAs();
  } catch (err: any) {
    console.error('[NANPManagement] Failed to load data:', err);
  }
}

async function addNPA() {
  if (!canAddNPA.value || !newNPA.value.category) return;
  
  try {
    await addNPAToDatabase({
      npa: newNPA.value.npa!,
      category: newNPA.value.category,
      country: newNPA.value.country!,
      region: newNPA.value.region,
      source: 'manual'
    });
    
    // Reset form
    newNPA.value = { npa: '', category: undefined, country: '', region: '' };
    showAddModal.value = false;
    
    alert('✅ NPA added successfully');
    
  } catch (err: any) {
    console.error('[NANPManagement] Failed to add NPA:', err);
    alert('❌ Failed to add NPA: ' + err.message);
  }
}

function editNPA(npa: any) {
  // TODO: Implement edit functionality
  console.log('[NANPManagement] Edit NPA:', npa);
  alert('🚧 Edit functionality coming soon');
}

function deleteNPA(npa: any) {
  if (!confirm(`Delete NPA ${npa.npa}?`)) return;
  
  // TODO: Implement delete functionality
  console.log('[NANPManagement] Delete NPA:', npa);
  alert('🚧 Delete functionality coming soon');
}

function exportData() {
  try {
    const csvData = exportNPAsToCSV();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nanp-data-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('[NANPManagement] Export failed:', err);
    alert('❌ Export failed: ' + err.message);
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
  // Auto-load if expanded
  if (showManagement.value) {
    loadData();
  }
});
</script>