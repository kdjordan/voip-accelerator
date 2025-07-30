<template>
  <div v-if="isTestModeEnabled" class="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <BeakerIcon class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
      <div class="flex-1">
        <h3 class="text-sm font-semibold text-yellow-500 mb-2">Test Data Mode</h3>
        
        <div v-if="!isLoading">
          <p class="text-xs text-gray-400 mb-3">
            Load sample data for testing without manual CSV uploads
          </p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              v-for="scenario in scenarios"
              :key="scenario.name"
              @click="loadScenario(scenario.name)"
              class="text-left px-3 py-2 bg-gray-700/50 hover:bg-gray-700 
                     border border-gray-600 hover:border-yellow-600/50 
                     rounded transition-all duration-200 group"
              :disabled="store.isProcessing"
            >
              <div class="text-xs font-medium text-gray-300 group-hover:text-yellow-500">
                {{ scenario.description }}
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ scenario.providers.length }} provider{{ scenario.providers.length > 1 ? 's' : '' }}
                • {{ getTotalRecords(scenario) }} total rates
              </div>
            </button>
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-else class="space-y-3">
          <p class="text-sm text-gray-300">Loading test data...</p>
          
          <div v-for="(progress, providerId) in loadingProgress" :key="providerId" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-gray-400">{{ getProviderName(providerId) }}</span>
              <span class="text-gray-500">{{ progress }}%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                class="h-full bg-yellow-500 rounded-full transition-all duration-300"
                :style="{ width: `${progress}%` }"
              />
            </div>
          </div>
          
          <button
            @click="cancelLoading"
            class="text-xs text-red-400 hover:text-red-300 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BeakerIcon } from '@heroicons/vue/24/outline';
import { TestDataService } from '@/services/test-data.service';
import { useRateGenStore } from '@/stores/rate-gen-store';
// Types are defined inline in the service, so we'll define them here too
interface TestScenario {
  name: string;
  description: string;
  providers: Array<{
    id: string;
    name: string;
    fileName: string;
    recordCount: number;
    rateRange: { min: number; max: number };
  }>;
}

const store = useRateGenStore();
const testDataService = new TestDataService();

// State
const isTestModeEnabled = ref(false);
const scenarios = ref<TestScenario[]>([]);
const isLoading = ref(false);
const loadingProgress = ref<Record<string, number>>({});
const currentScenario = ref<string>('');

// Check if test mode is enabled on mount
onMounted(() => {
  isTestModeEnabled.value = testDataService.isTestModeEnabled();
  if (isTestModeEnabled.value) {
    scenarios.value = testDataService.getScenarios();
  }
});

// Load a test scenario
async function loadScenario(scenarioName: string) {
  isLoading.value = true;
  loadingProgress.value = {};
  currentScenario.value = scenarioName;
  
  try {
    // Clear existing data first
    store.clearAllProviders();
    await testDataService.clearTestData();
    
    // Load the test data
    const providers = await testDataService.loadTestData(
      scenarioName,
      (providerId: string, progress: number) => {
        loadingProgress.value[providerId] = progress;
        store.setUploadProgress(providerId, progress);
      }
    );
    
    // Add providers to store
    providers.forEach(provider => {
      store.addProvider(provider);
    });
    
    console.log(`[TestDataLoader] Loaded ${providers.length} test providers`);
    
  } catch (error) {
    console.error('[TestDataLoader] Error loading test data:', error);
    store.addError(`Failed to load test data: ${(error as Error).message}`);
  } finally {
    isLoading.value = false;
    loadingProgress.value = {};
  }
}

// Cancel loading
function cancelLoading() {
  // In a real implementation, we'd have a way to cancel the async operation
  isLoading.value = false;
  loadingProgress.value = {};
}

// Helper to get total records for a scenario
function getTotalRecords(scenario: TestScenario): string {
  const total = scenario.providers.reduce((sum, p) => sum + p.recordCount, 0);
  return total >= 1000 ? `${(total / 1000).toFixed(0)}K` : total.toString();
}

// Helper to get provider name from progress tracking
function getProviderName(providerId: string): string {
  const scenario = scenarios.value.find(s => s.name === currentScenario.value);
  const provider = scenario?.providers.find(p => p.id === providerId);
  return provider?.name || providerId;
}
</script>