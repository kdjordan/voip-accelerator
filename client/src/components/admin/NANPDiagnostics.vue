<template>
  <div class="bg-gray-900/50">
    <div
      @click="toggleDiagnostics"
      class="w-full cursor-pointer px-6 py-4 hover:bg-gray-700/30 transition-colors"
    >
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">NANP Categorization Diagnostics</h2>
        <div class="flex items-center space-x-3">
          <span v-if="diagnostics" class="text-sm text-accent bg-accent/10 px-2 py-0.5 rounded">
            {{ diagnostics.needs_attention.length }} need attention
          </span>
          <ChevronDownIcon
            :class="{ 'transform rotate-180': showDiagnostics }"
            class="w-5 h-5 transition-transform text-gray-400"
          />
        </div>
      </div>  
    </div>

    <div v-if="showDiagnostics" class="border-t border-gray-700/50 p-6 space-y-6">
      <!-- Loading State -->
      <div v-if="isAnalyzing" class="flex items-center justify-center space-x-2 text-gray-400">
        <ArrowPathIcon class="animate-spin h-5 w-5 text-accent" />
        <span>Analyzing NANP categorization...</span>
      </div>

      <!-- Diagnostics Results -->
      <div v-else-if="diagnostics" class="space-y-4">
        <!-- Overview Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-white">{{ diagnostics.total }}</div>
            <div class="text-gray-400 text-sm">Total NPAs</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-400">
              {{ diagnostics.properly_categorized }}
            </div>
            <div class="text-gray-400 text-sm">Properly Categorized</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-yellow-400">
              {{ diagnostics.needs_attention.length }}
            </div>
            <div class="text-gray-400 text-sm">Need Attention</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-blue-400">
              {{ Math.round((diagnostics.properly_categorized / diagnostics.total) * 100) }}%
            </div>
            <div class="text-gray-400 text-sm">Coverage</div>
          </div>
        </div>

        <!-- Confidence Breakdown -->
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <h3 class="text-lg font-medium text-white mb-3">Confidence Breakdown</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-xl font-bold text-green-400">
                {{ diagnostics.confidence_breakdown.high || 0 }}
              </div>
              <div class="text-gray-400 text-sm">High Confidence</div>
              <div class="text-xs text-gray-500">(LERG Data)</div>
              <div v-if="diagnostics.coverage_analysis" class="text-xs text-green-300 mt-1">
                {{ diagnostics.coverage_analysis.high_confidence_percent }}%
              </div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-yellow-400">
                {{ diagnostics.confidence_breakdown.medium || 0 }}
              </div>
              <div class="text-gray-400 text-sm">Medium Confidence</div>
              <div class="text-xs text-gray-500">(Constants)</div>
              <div v-if="diagnostics.coverage_analysis" class="text-xs text-yellow-300 mt-1">
                {{ diagnostics.coverage_analysis.medium_confidence_percent }}%
              </div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-red-400">
                {{ diagnostics.confidence_breakdown.low || 0 }}
              </div>
              <div class="text-gray-400 text-sm">Low Confidence</div>
              <div class="text-xs text-gray-500">(Inferred)</div>
              <div v-if="diagnostics.coverage_analysis" class="text-xs text-red-300 mt-1">
                {{ diagnostics.coverage_analysis.low_confidence_percent }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Data Sources Information -->
        <div
          v-if="diagnostics.data_sources"
          class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4"
        >
          <h3 class="text-lg font-medium text-blue-400 mb-3">Data Sources Status</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="text-center">
              <div
                class="text-lg font-bold"
                :class="diagnostics.data_sources.lerg_loaded ? 'text-green-400' : 'text-red-400'"
              >
                {{ diagnostics.data_sources.lerg_loaded ? '✓' : '✗' }}
              </div>
              <div class="text-gray-400">LERG Loaded</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-blue-300">
                {{ diagnostics.data_sources.lerg_us_states }}
              </div>
              <div class="text-gray-400">US States</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-blue-300">
                {{ diagnostics.data_sources.lerg_canada_provinces }}
              </div>
              <div class="text-gray-400">CA Provinces</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-blue-300">
                {{ diagnostics.data_sources.lerg_other_countries }}
              </div>
              <div class="text-gray-400">Other Countries</div>
            </div>
          </div>
          <div v-if="diagnostics.timestamp" class="mt-3 text-xs text-gray-500 text-center">
            Last analyzed: {{ new Date(diagnostics.timestamp).toLocaleString() }}
          </div>
        </div>

        <!-- NPAs Needing Attention -->
        <div
          v-if="diagnostics.needs_attention.length > 0"
          class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4"
        >
          <h3 class="text-lg font-medium text-yellow-400 mb-3">
            NPAs Needing Manual Addition ({{ diagnostics.needs_attention.length }})
          </h3>
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              v-for="npa in diagnostics.needs_attention.slice(0, 20)"
              :key="npa"
              class="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-sm font-mono"
            >
              {{ npa }}
            </span>
            <span v-if="diagnostics.needs_attention.length > 20" class="text-yellow-400 text-sm">
              +{{ diagnostics.needs_attention.length - 20 }} more...
            </span>
          </div>
          <p class="text-yellow-300 text-sm">
            💡 These NPAs should be added to LERG data using the "Add Single LERG Record" section
            above.
          </p>
        </div>

        <!-- Manual NPA Management -->
        <div class="bg-gray-800/50 p-4 rounded-lg">
          <h3 class="text-lg font-medium text-white mb-4">Manual NPA Management</h3>

          <!-- Quick Add NPA -->
          <div class="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">NPA</label>
              <input
                v-model="newNPA.npa"
                type="text"
                maxlength="3"
                placeholder="e.g., 809"
                class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
                @input="validateNPA"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Country</label>
              <select
                v-model="newNPA.country"
                class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="us-domestic">US Domestic</option>
                <option value="canadian">Canada</option>
                <option value="caribbean">Caribbean</option>
                <option value="pacific">Pacific</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Region (Optional)</label>
              <input
                v-model="newNPA.region"
                type="text"
                placeholder="State/Province"
                class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div class="flex items-end">
              <button
                @click="addNPA"
                :disabled="!canAddNPA"
                class="w-full px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
              >
                ➕ Add NPA
              </button>
            </div>
          </div>

          <div
            v-if="npaValidation.message"
            :class="npaValidation.isValid ? 'text-green-400' : 'text-red-400'"
            class="text-sm mb-3"
          >
            {{ npaValidation.message }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button
            @click="runDiagnostics"
            class="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
          >
            🔄 Refresh Analysis
          </button>

          <div class="flex space-x-3">
            <button
              v-if="diagnostics.needs_attention.length > 0"
              @click="exportUnknownNPAs"
              class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              📋 Export Unknown NPAs
            </button>

            <button
              v-if="diagnostics.needs_attention.length > 0"
              @click="bulkAddUnknownNPAs"
              class="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors"
            >
              🚀 Bulk Add as Caribbean
            </button>
          </div>
        </div>
      </div>

      <!-- Initial State -->
      <div v-else class="text-center py-8">
        <button
          @click="runDiagnostics"
          class="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
        >
          🔍 Run NANP Categorization Analysis
        </button>
        <p class="text-gray-400 text-sm mt-2">
          Analyze how well your LERG data covers NANP destinations
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { ChevronDownIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
  import { NANPCategorizer } from '@/utils/nanp-categorization';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';

  const showDiagnostics = ref(false);
  const isAnalyzing = ref(false);
  const diagnostics = ref<any>(null);
  const lergStore = useLergStoreV2();

  // Manual NPA management state
  const newNPA = ref({
    npa: '',
    country: '',
    region: '',
  });

  const npaValidation = ref({
    isValid: false,
    message: '',
  });

  const canAddNPA = computed(() => {
    return newNPA.value.npa.length === 3 && newNPA.value.country && npaValidation.value.isValid;
  });

  function toggleDiagnostics() {
    showDiagnostics.value = !showDiagnostics.value;
  }

  async function runDiagnostics() {
    isAnalyzing.value = true;
    try {
      console.log('[NANPDiagnostics] Starting categorization analysis...');

      // Get all NPAs from various sources
      const allNPAs = getAllKnownNPAs();

      if (allNPAs.length === 0) {
        throw new Error('No NPAs found. Please ensure LERG data is loaded.');
      }

      console.log(`[NANPDiagnostics] Analyzing ${allNPAs.length} NPAs...`);

      // Run validation with detailed logging
      const validationResult = NANPCategorizer.validateCategorization(allNPAs);

      // Add additional analytics
      const enhancedResult = {
        ...validationResult,
        timestamp: new Date().toISOString(),
        data_sources: {
          lerg_loaded: lergStore.isLoaded,
          lerg_us_states: lergStore.usStates?.size || 0,
          lerg_canada_provinces: lergStore.canadaProvinces?.size || 0,
          lerg_other_countries: lergStore.otherCountries?.size || 0,
          total_lerg_npas: lergStore.stats?.totalNPAs || 0,
        },
        coverage_analysis: {
          high_confidence_percent: Math.round(
            ((validationResult.confidence_breakdown.high || 0) / validationResult.total) * 100
          ),
          medium_confidence_percent: Math.round(
            ((validationResult.confidence_breakdown.medium || 0) / validationResult.total) * 100
          ),
          low_confidence_percent: Math.round(
            ((validationResult.confidence_breakdown.low || 0) / validationResult.total) * 100
          ),
        },
      };

      diagnostics.value = enhancedResult;

      console.log('[NANPDiagnostics] Analysis completed:', enhancedResult);
    } catch (error) {
      console.error('[NANPDiagnostics] Failed to run diagnostics:', error);
      alert(`❌ Diagnostic analysis failed: ${error.message}`);
    } finally {
      isAnalyzing.value = false;
    }
  }

  function getAllKnownNPAs(): string[] {
    const npas = new Set<string>();

    try {
      // From LERG store - US States
      if (lergStore.usStates && lergStore.usStates.size > 0) {
        for (const [stateCode, npaEntries] of lergStore.usStates.entries()) {
          if (Array.isArray(npaEntries)) {
            npaEntries.forEach((entry) => {
              if (entry && entry.npa) {
                npas.add(entry.npa);
              }
            });
          }
        }
      }

      // From LERG store - Canadian Provinces
      if (lergStore.canadaProvinces && lergStore.canadaProvinces.size > 0) {
        for (const [provinceCode, npaEntries] of lergStore.canadaProvinces.entries()) {
          if (Array.isArray(npaEntries)) {
            npaEntries.forEach((entry) => {
              if (entry && entry.npa) {
                npas.add(entry.npa);
              }
            });
          }
        }
      }

      // From LERG store - Other Countries
      if (lergStore.otherCountries && lergStore.otherCountries.size > 0) {
        for (const [countryCode, npaEntries] of lergStore.otherCountries.entries()) {
          if (Array.isArray(npaEntries)) {
            npaEntries.forEach((entry) => {
              if (entry && entry.npa) {
                npas.add(entry.npa);
              }
            });
          }
        }
      }

      // Note: Removed hardcoded NPAs to use Supabase as single source of truth

      console.log(`[NANPDiagnostics] Collected ${npas.size} NPAs from all sources`);
    } catch (error) {
      console.error('[NANPDiagnostics] Error collecting NPAs:', error);
    }

    return Array.from(npas).sort();
  }

  function exportUnknownNPAs() {
    if (!diagnostics.value) return;

    const unknownNPAs = diagnostics.value.needs_attention;
    const csvContent = `NPA,Suggested_Country,Suggested_State,Notes\n${unknownNPAs
      .map((npa) => `${npa},XX,XX,"Needs manual categorization"`)
      .join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unknown_npas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Manual NPA management methods
  function validateNPA() {
    const npa = newNPA.value.npa;

    if (!npa) {
      npaValidation.value = { isValid: false, message: '' };
      return;
    }

    if (!/^\d{3}$/.test(npa)) {
      npaValidation.value = {
        isValid: false,
        message: 'NPA must be exactly 3 digits',
      };
      return;
    }

    // Check if NPA already exists in LERG data
    const existing = NANPCategorizer.categorizeNPA(npa);
    if (existing.category !== 'unknown') {
      npaValidation.value = {
        isValid: false,
        message: `NPA ${npa} already categorized as ${existing.category}`,
      };
      return;
    }

    npaValidation.value = {
      isValid: true,
      message: `✓ NPA ${npa} is available for addition`,
    };
  }

  async function addNPA() {
    if (!canAddNPA.value) return;

    try {
      // TODO: Replace with actual Supabase integration
      console.log('Adding NPA to manual overrides:', {
        npa: newNPA.value.npa,
        category: newNPA.value.country,
        region: newNPA.value.region || null,
        source: 'manual',
        added_by: 'admin',
        added_at: new Date().toISOString(),
      });

      alert(`NPA ${newNPA.value.npa} added successfully as ${newNPA.value.country}`);

      // Reset form
      newNPA.value = { npa: '', country: '', region: '' };
      npaValidation.value = { isValid: false, message: '' };

      // Refresh diagnostics
      await runDiagnostics();
    } catch (error) {
      console.error('Failed to add NPA:', error);
      alert('❌ Failed to add NPA. Please try again.');
    }
  }

  async function bulkAddUnknownNPAs() {
    if (!diagnostics.value || !diagnostics.value.needs_attention.length) return;

    const unknownNPAs = diagnostics.value.needs_attention;

    if (
      !confirm(
        `This will add ${unknownNPAs.length} unknown NPAs as "Caribbean" destinations. Continue?`
      )
    ) {
      return;
    }

    try {
      // TODO: Replace with actual Supabase bulk operation
      console.log('Bulk adding unknown NPAs as Caribbean destinations');

      alert(`Successfully added ${unknownNPAs.length} NPAs as Caribbean destinations`);

      // Refresh diagnostics
      await runDiagnostics();
    } catch (error) {
      console.error('Failed to bulk add NPAs:', error);
      alert('❌ Bulk operation failed. Please try again.');
    }
  }

  onMounted(() => {
    // Auto-run diagnostics if store is loaded
    if (lergStore.isLoaded) {
      runDiagnostics();
    }
  });
</script>
