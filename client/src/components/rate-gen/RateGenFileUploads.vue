<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';
import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline';
import PreviewModal from '@/components/shared/PreviewModal.vue';
import RateGenProgressIndicator from '@/components/rate-gen/RateGenProgressIndicator.vue';
import TestDataLoader from '@/components/rate-gen/TestDataLoader.vue';
import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
import Papa from 'papaparse';
import { USColumnRole } from '@/types/domains/us-types';
import type { RateGenComponentId, ProviderInfo, RateGenColumnMapping } from '@/types/domains/rate-gen-types';
import { useUploadTracking } from '@/composables/useUploadTracking';
import { useGlobalUploadLimit } from '@/composables/useGlobalUploadLimit';
import UploadLimitBanner from '@/components/shared/UploadLimitBanner.vue';
import PlanSelectionModal from '@/components/shared/PlanSelectionModal.vue';

// Store and service
const store = useRateGenStore();
const service = new RateGenService();
const uploadTracking = useUploadTracking();
const globalUploadLimit = useGlobalUploadLimit();

// Component refs for progress tracking - Rate Gen specific
const progressIndicators = ref<Record<RateGenComponentId, InstanceType<typeof RateGenProgressIndicator> | null>>({
  provider1: null,
  provider2: null,
  provider3: null,
  provider4: null,
  provider5: null,
});

// Upload progress row count tracking - match USFileUploads pattern
const uploadingFileRowCount = ref<Record<RateGenComponentId, number>>({
  provider1: 0,
  provider2: 0,
  provider3: 0,
  provider4: 0,
  provider5: 0,
});

// Drag states for each provider zone
const dragStates = ref<Record<RateGenComponentId, boolean>>({
  provider1: false,
  provider2: false,
  provider3: false,
  provider4: false,
  provider5: false,
});

// Upload errors
const uploadErrors = ref<Record<RateGenComponentId, string | null>>({
  provider1: null,
  provider2: null,
  provider3: null,
  provider4: null,
  provider5: null,
});

// PreviewModal state
const showPreviewModal = ref(false);
const previewData = ref<string[][]>([]);
const previewColumns = ref<string[]>([]);
const currentFile = ref<File | null>(null);
const currentZoneId = ref<RateGenComponentId | null>(null);
const columnMappings = ref<Record<string, string>>({});
const isModalValid = ref(false);
const startLine = ref(1);
const providerName = ref('');

// Confirmation modal state
const showConfirmModal = ref(false);
const confirmingRemovalZoneId = ref<RateGenComponentId | null>(null);
const confirmingProviderName = ref('');

// Rate Gen specific column options - match USFileUploads exactly
const rateGenColumnOptions = [
  { value: USColumnRole.NPANXX, label: 'NPANXX', required: false },
  { value: USColumnRole.NPA, label: 'NPA', required: false },
  { value: USColumnRole.NXX, label: 'NXX', required: false },
  { value: USColumnRole.INTERSTATE, label: 'Interstate Rate', required: true },
  { value: USColumnRole.INTRASTATE, label: 'Intrastate Rate', required: true },
  { value: USColumnRole.INDETERMINATE, label: 'Indeterminate Rate', required: false },
];

// Progressive zone visibility
const visibleZones = computed(() => {
  const zones: RateGenComponentId[] = [];
  const providerCount = store.providerCount;
  
  // Always show provider1
  zones.push('provider1');
  
  // Show provider2 after provider1 is uploaded or uploading
  if (providerCount >= 1 || store.isComponentUploading('provider1')) {
    zones.push('provider2');
  }
  
  // Show provider3 after provider2 is uploaded
  if (providerCount >= 2) {
    zones.push('provider3');
  }
  
  // Show provider4 after provider3 is uploaded
  if (providerCount >= 3) {
    zones.push('provider4');
  }
  
  // Show provider5 after provider4 is uploaded
  if (providerCount >= 4) {
    zones.push('provider5');
  }
  
  return zones;
});

// Check if a zone should show as completed (summary view)
const isZoneCompleted = (zoneId: RateGenComponentId) => {
  return store.providerList.some(p => p.id === zoneId);
};

// Check if upload is in progress for any zone
const isAnyUploadInProgress = computed(() => {
  return store.isProcessing || showPreviewModal.value;
});

// Note: Debug progress code removed - now using UploadProgressIndicator component

// Get provider info for a zone
const getProviderForZone = (zoneId: RateGenComponentId): ProviderInfo | undefined => {
  return store.providerList.find(p => p.id === zoneId);
};

// Check if progress should be shown
const shouldShowProgress = (zoneId: RateGenComponentId): boolean => {
  return store.isComponentUploading(zoneId);
};

// Drag and drop handlers
const handleDragEnter = (zoneId: RateGenComponentId) => {
  if (!canAcceptDrop(zoneId)) return;
  dragStates.value[zoneId] = true;
};

const handleDragLeave = (zoneId: RateGenComponentId) => {
  dragStates.value[zoneId] = false;
};

const handleDragOver = (zoneId: RateGenComponentId, event: DragEvent) => {
  if (!canAcceptDrop(zoneId)) return;
  event.preventDefault();
};

const handleDrop = async (zoneId: RateGenComponentId, event: DragEvent) => {
  event.preventDefault();
  dragStates.value[zoneId] = false;
  
  if (!canAcceptDrop(zoneId)) return;
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    await handleFileUpload(files[0], zoneId);
  }
};

const handleFileChange = async (event: Event, zoneId: RateGenComponentId) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (files && files.length > 0) {
    await handleFileUpload(files[0], zoneId);
  }
  
  // Reset input
  target.value = '';
};

// Check if zone can accept drops/uploads
const canAcceptDrop = (zoneId: RateGenComponentId): boolean => {
  // Prevent any drops/uploads if global upload limit is reached
  if (globalUploadLimit.isUploadBlocked.value) return false;
  
  // Prevent any drops/uploads if modal is open or any upload is in progress
  if (isAnyUploadInProgress.value) return false;
  
  return !store.isComponentUploading(zoneId) && 
         !isZoneCompleted(zoneId) && 
         !store.isProcessing;
};

// Handle file upload - show PreviewModal for column mapping and provider naming
const handleFileUpload = async (file: File, zoneId: RateGenComponentId) => {
  // Check global upload limit first
  const canUpload = await globalUploadLimit.checkGlobalUploadLimit();
  if (!canUpload) {
    return;
  }
  
  // Prevent upload if already in progress
  if (store.isComponentUploading(zoneId) || showPreviewModal.value) {
    return;
  }
  
  // Validate file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    uploadErrors.value[zoneId] = 'Please upload a CSV file';
    return;
  }
  
  // Clear previous error
  uploadErrors.value[zoneId] = null;
  
  try {
    // Store current file and zone for modal processing
    currentFile.value = file;
    currentZoneId.value = zoneId;
    
    // Parse CSV to show preview
    await parseFileForPreview(file);
    
  } catch (error) {
    uploadErrors.value[zoneId] = `Upload failed: ${(error as Error).message}`;
    console.error('[RateGenFileUploads] File upload error:', error);
    
    // Reset state on error
    currentFile.value = null;
    currentZoneId.value = null;
  }
};

// Parse file for preview modal and count rows for progress tracking
const parseFileForPreview = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const previewRows: string[][] = [];
    let rowCount = 0;
    
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      step: (results) => {
        if (rowCount < 20) { // Only take first 20 rows for preview
          previewRows.push(results.data as string[]);
        }
        rowCount++;
      },
      complete: () => {
        if (previewRows.length === 0) {
          reject(new Error('No data found in CSV file'));
          return;
        }
        
        // Store total row count for progress tracking (similar to USFileUploads pattern)
        if (currentZoneId.value) {
          uploadingFileRowCount.value[currentZoneId.value] = Math.max(0, rowCount - 1); // Subtract header row
        }
        
        // Set preview data
        previewData.value = previewRows;
        previewColumns.value = previewRows[0] || [];
        
        // Reset modal state
        columnMappings.value = {};
        isModalValid.value = false;
        startLine.value = 1;
        
        // Set a better default provider name based on the zone
        const zoneNumber = currentZoneId.value ? parseInt(currentZoneId.value.replace('provider', '')) : 1;
        providerName.value = `Provider ${zoneNumber}`;
        
        // Show modal
        showPreviewModal.value = true;
        
        resolve();
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
};

// Remove provider - show confirmation modal
const handleRemoveProvider = (zoneId: RateGenComponentId) => {
  const provider = getProviderForZone(zoneId);
  if (!provider) return;
  
  confirmingRemovalZoneId.value = zoneId;
  confirmingProviderName.value = provider.name;
  showConfirmModal.value = true;
};

// Confirm provider removal
const confirmRemoveProvider = async () => {
  if (!confirmingRemovalZoneId.value) return;
  
  const provider = getProviderForZone(confirmingRemovalZoneId.value);
  if (!provider) return;
  
  try {
    await service.removeProvider(provider.id);
    uploadErrors.value[confirmingRemovalZoneId.value] = null;
    
    // Reset confirmation state
    showConfirmModal.value = false;
    confirmingRemovalZoneId.value = null;
    confirmingProviderName.value = '';
  } catch (error) {
    store.addError(`Failed to remove provider: ${(error as Error).message}`);
    // Keep modal open on error
  }
};

// Get zone label
const getZoneLabel = (zoneId: RateGenComponentId): string => {
  const zoneNumber = parseInt(zoneId.replace('provider', ''));
  return `Provider ${zoneNumber}`;
};

// PreviewModal event handlers
const handleModalConfirm = async (mappings: Record<string, string>, indeterminateDefinition?: string, effectiveDate?: string, modalProviderName?: string) => {
  if (!currentFile.value || !currentZoneId.value) {
    console.error('[RateGenFileUploads] No current file or zone for upload');
    return;
  }
  
  try {
    showPreviewModal.value = false;
    
    // Convert mappings to RateGenColumnMapping
    const columnMapping: RateGenColumnMapping = {
      rateInter: -1,
      rateIntra: -1,
    };
    
    // Map the column indices
    Object.entries(mappings).forEach(([columnIndex, role]) => {
      const index = parseInt(columnIndex);
      switch (role) {
        case USColumnRole.NPANXX:
          columnMapping.npanxx = index;
          break;
        case USColumnRole.NPA:
          columnMapping.npa = index;
          break;
        case USColumnRole.NXX:
          columnMapping.nxx = index;
          break;
        case USColumnRole.INTERSTATE:
          columnMapping.rateInter = index;
          break;
        case USColumnRole.INTRASTATE:
          columnMapping.rateIntra = index;
          break;
        case USColumnRole.INDETERMINATE:
          columnMapping.rateIndeterminate = index;
          break;
      }
    });
    
    // Validate required mappings
    if (columnMapping.rateInter === -1 || columnMapping.rateIntra === -1) {
      uploadErrors.value[currentZoneId.value] = 'Interstate and Intrastate rate columns are required';
      return;
    }
    
    // Validate prefix mapping (either npanxx OR both npa+nxx)
    const hasNpanxx = columnMapping.npanxx !== undefined;
    const hasNpaAndNxx = columnMapping.npa !== undefined && columnMapping.nxx !== undefined;
    
    if (!hasNpanxx && !hasNpaAndNxx) {
      uploadErrors.value[currentZoneId.value] = 'Either NPANXX column or both NPA and NXX columns are required';
      return;
    }
    
    const finalProviderName = modalProviderName?.trim() || `Provider ${currentZoneId.value.replace('provider', '')}`;
    
    // Process the file with the service
    await service.processProviderFile(
      currentFile.value,
      currentZoneId.value,
      finalProviderName,
      columnMapping,
      startLine.value
    );
    
    // Complete progress indicator if it exists (matching USFileUploads pattern)
    if (currentZoneId.value && progressIndicators.value[currentZoneId.value]) {
      progressIndicators.value[currentZoneId.value]?.complete();
    }
    
    // Reset state after successful processing
    currentFile.value = null;
    if (currentZoneId.value) {
      uploadingFileRowCount.value[currentZoneId.value] = 0; // Reset row count
    }
    currentZoneId.value = null;
    columnMappings.value = {};
    isModalValid.value = false;
    startLine.value = 1;
    providerName.value = '';
    
  } catch (error) {
    console.error('[RateGenFileUploads] Error processing file:', error);
    
    if (currentZoneId.value) {
      uploadErrors.value[currentZoneId.value] = `Processing failed: ${(error as Error).message}`;
    }
    
    // Reset state on error as well
    currentFile.value = null;
    if (currentZoneId.value) {
      uploadingFileRowCount.value[currentZoneId.value] = 0; // Reset row count on error
    }
    currentZoneId.value = null;
    columnMappings.value = {};
    isModalValid.value = false;
    startLine.value = 1;
    providerName.value = '';
  }
};

const handleModalCancel = () => {
  showPreviewModal.value = false;
  currentFile.value = null;
  // Reset row count on cancel
  if (currentZoneId.value) {
    uploadingFileRowCount.value[currentZoneId.value] = 0;
  }
  currentZoneId.value = null;
  // Reset all modal state
  columnMappings.value = {};
  isModalValid.value = false;
  startLine.value = 1;
  providerName.value = '';
};

// Watch for errors from store
watch(() => store.uploadErrors, (newErrors) => {
  // Update local error states from store
  Object.keys(newErrors).forEach(providerId => {
    const zoneId = providerId as RateGenComponentId;
    const error = store.getUploadError(providerId);
    if (error) {
      uploadErrors.value[zoneId] = error;
    }
  });
}, { deep: true });

// Format rate to 6 decimal places
const formatRate = (rate: number | undefined): string => {
  if (rate === undefined || rate === null) return '0.000000';
  return rate.toFixed(6);
};
</script>

<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- Global Upload Limit Banner -->
    <UploadLimitBanner
      :show="globalUploadLimit.showUploadLimitBanner.value"
      @upgrade="globalUploadLimit.handleUpgradeClick"
    />
    
    <!-- Test Data Loader (Development Only) -->
    <TestDataLoader />
    
    <!-- Upload Zones Container -->
    <div class="overflow-x-auto">
      <div class="bg-gray-800 rounded-lg p-6 w-full">
        <div class="grid grid-cols-2 gap-6">
          <!-- Left Column -->
          <div class="space-y-6">
            <!-- Provider 1 Zone -->
            <transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 transform scale-95"
              enter-to-class="opacity-100 transform scale-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 transform scale-100"
              leave-to-class="opacity-0 transform scale-95"
            >
              <div v-if="visibleZones.includes('provider1')" key="provider1">
              <!-- Completed State -->
              <template v-if="isZoneCompleted('provider1')">
                <div class="bg-gray-700 rounded-lg p-4 border border-accent/30">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-fbWhite">
                      {{ getProviderForZone('provider1')?.name }}
                    </h3>
                    <button
                      @click="handleRemoveProvider('provider1')"
                      class="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div class="text-xs text-gray-400">
                    <p>{{ (getProviderForZone('provider1')?.rowCount || getProviderForZone('provider1')?.recordCount || 0).toLocaleString() }} rates uploaded</p>
                    <p>{{ getProviderForZone('provider1')?.fileName }}</p>
                    <p class="mt-1">Avg rates: {{ formatRate(getProviderForZone('provider1')?.avgInterRate) }} / {{ formatRate(getProviderForZone('provider1')?.avgIntraRate) }} / {{ formatRate(getProviderForZone('provider1')?.avgIndeterminateRate) }}</p>
                  </div>
                </div>
              </template>
              
              <!-- Upload State -->
              <template v-else>
                <div
                  class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center transition-all"
                  :class="[
                    dragStates.provider1
                      ? 'border-accent bg-fbWhite/10 border-solid'
                      : canAcceptDrop('provider1')
                        ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 cursor-pointer'
                        : store.isComponentUploading('provider1')
                          ? 'border-gray-600 border-dashed cursor-not-allowed'
                          : 'border-gray-600 border-dashed opacity-50 cursor-not-allowed',
                    uploadErrors.provider1 ? 'border-red-500 border-solid' : '',
                  ]"
                  @dragenter.prevent="handleDragEnter('provider1')"
                  @dragleave.prevent="handleDragLeave('provider1')"
                  @dragover.prevent="handleDragOver('provider1', $event)"
                  @drop.prevent="handleDrop('provider1', $event)"
                >
                  <!-- File Input -->
                  <input
                    type="file"
                    accept=".csv"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    :disabled="!canAcceptDrop('provider1')"
                    @change="(e) => handleFileChange(e, 'provider1')"
                  />

                  <div class="flex flex-col items-center justify-center w-full h-full text-center">
                    <!-- Uploading State -->
                    <template v-if="store.isComponentUploading('provider1')">
                      <RateGenProgressIndicator 
                        :total-rows="uploadingFileRowCount.provider1"
                        :progress="store.getUploadProgress('provider1')"
                        ref="progressIndicators.provider1"
                      />
                    </template>

                    <!-- Default State -->
                    <template v-else>
                      <!-- Error notification -->
                      <div
                        v-if="uploadErrors.provider1"
                        class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full max-w-xs mx-auto"
                      >
                        <p class="text-red-500 font-medium text-xs">{{ uploadErrors.provider1 }}</p>
                      </div>

                      <ArrowUpTrayIcon
                        class="w-10 h-10 mx-auto border rounded-full p-2"
                        :class="
                          uploadErrors.provider1
                            ? 'text-red-500 border-red-500/50 bg-red-500/10'
                            : 'text-accent border-accent/50 bg-accent/10'
                        "
                      />
                      <p
                        class="mt-2 text-base"
                        :class="uploadErrors.provider1 ? 'text-red-500' : 'text-accent'"
                      >
                        {{ uploadErrors.provider1 ? 'Please try again' : 'DRAG & DROP or CLICK to upload' }}
                      </p>
                    </template>
                  </div>
                </div>
              </template>
              </div>
            </transition>

            <!-- Provider 3 Zone -->
            <div v-if="visibleZones.includes('provider3')">
              <!-- Similar structure to Provider 1 -->
              <template v-if="isZoneCompleted('provider3')">
                <div class="bg-gray-700 rounded-lg p-4 border border-accent/30">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-fbWhite">
                      {{ getProviderForZone('provider3')?.name }}
                    </h3>
                    <button
                      @click="handleRemoveProvider('provider3')"
                      class="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div class="text-xs text-gray-400">
                    <p>{{ (getProviderForZone('provider3')?.rowCount || getProviderForZone('provider3')?.recordCount || 0).toLocaleString() }} rates uploaded</p>
                    <p>{{ getProviderForZone('provider3')?.fileName }}</p>
                    <p class="mt-1">Avg rates: {{ formatRate(getProviderForZone('provider3')?.avgInterRate) }} / {{ formatRate(getProviderForZone('provider3')?.avgIntraRate) }} / {{ formatRate(getProviderForZone('provider3')?.avgIndeterminateRate) }}</p>
                  </div>
                </div>
              </template>
              <template v-else>
                <!-- Upload zone for provider3 (similar to provider1) -->
                <div
                  class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center transition-all"
                  :class="[
                    dragStates.provider3
                      ? 'border-accent bg-fbWhite/10 border-solid'
                      : canAcceptDrop('provider3')
                        ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 cursor-pointer'
                        : store.isComponentUploading('provider3')
                          ? 'border-gray-600 border-dashed cursor-not-allowed'
                          : 'border-gray-600 border-dashed opacity-50 cursor-not-allowed',
                    uploadErrors.provider3 ? 'border-red-500 border-solid' : '',
                  ]"
                  @dragenter.prevent="handleDragEnter('provider3')"
                  @dragleave.prevent="handleDragLeave('provider3')"
                  @dragover.prevent="handleDragOver('provider3', $event)"
                  @drop.prevent="handleDrop('provider3', $event)"
                >
                  <input
                    type="file"
                    accept=".csv"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    :disabled="!canAcceptDrop('provider3')"
                    @change="(e) => handleFileChange(e, 'provider3')"
                  />

                  <div class="flex flex-col items-center justify-center w-full h-full text-center">
                    <!-- Uploading State -->
                    <template v-if="store.isComponentUploading('provider3')">
                      <RateGenProgressIndicator 
                        :total-rows="uploadingFileRowCount.provider3"
                        :progress="store.getUploadProgress('provider3')"
                        ref="progressIndicators.provider3"
                      />
                    </template>

                    <!-- Default State -->
                    <template v-else>
                      <!-- Error notification -->
                      <div
                        v-if="uploadErrors.provider3"
                        class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full max-w-xs mx-auto"
                      >
                        <p class="text-red-500 font-medium text-xs">{{ uploadErrors.provider3 }}</p>
                      </div>

                      <ArrowUpTrayIcon
                        class="w-10 h-10 mx-auto border rounded-full p-2"
                        :class="
                          uploadErrors.provider3
                            ? 'text-red-500 border-red-500/50 bg-red-500/10'
                            : 'text-accent border-accent/50 bg-accent/10'
                        "
                      />
                      <p
                        class="mt-2 text-base"
                        :class="uploadErrors.provider3 ? 'text-red-500' : 'text-accent'"
                      >
                        {{ uploadErrors.provider3 ? 'Please try again' : 'DRAG & DROP or CLICK to upload' }}
                      </p>
                    </template>
                  </div>
                </div>
              </template>
            </div>

            <!-- Provider 5 Zone -->
            <div v-if="visibleZones.includes('provider5')">
              <!-- Completed State -->
              <template v-if="isZoneCompleted('provider5')">
                <div class="bg-gray-700 rounded-lg p-4 border border-accent/30">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-fbWhite">
                      {{ getProviderForZone('provider5')?.name }}
                    </h3>
                    <button
                      @click="handleRemoveProvider('provider5')"
                      class="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div class="text-xs text-gray-400">
                    <p>{{ (getProviderForZone('provider5')?.rowCount || getProviderForZone('provider5')?.recordCount || 0).toLocaleString() }} rates uploaded</p>
                    <p>{{ getProviderForZone('provider5')?.fileName }}</p>
                    <p class="mt-1">Avg rates: {{ formatRate(getProviderForZone('provider5')?.avgInterRate) }} / {{ formatRate(getProviderForZone('provider5')?.avgIntraRate) }} / {{ formatRate(getProviderForZone('provider5')?.avgIndeterminateRate) }}</p>
                  </div>
                </div>
              </template>
              
              <!-- Upload State -->
              <template v-else>
              <div
                class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center transition-all"
                :class="[
                  dragStates.provider5
                    ? 'border-accent bg-fbWhite/10 border-solid'
                    : canAcceptDrop('provider5')
                      ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 cursor-pointer'
                      : 'border-gray-600 border-dashed opacity-50 cursor-not-allowed',
                  uploadErrors.provider5 ? 'border-red-500 border-solid' : '',
                ]"
                @dragenter.prevent="handleDragEnter('provider5')"
                @dragleave.prevent="handleDragLeave('provider5')"
                @dragover.prevent="handleDragOver('provider5', $event)"
                @drop.prevent="handleDrop('provider5', $event)"
              >
                <input
                  type="file"
                  accept=".csv"
                  class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  :disabled="!canAcceptDrop('provider5')"
                  @change="(e) => handleFileChange(e, 'provider5')"
                />

                <div class="flex flex-col items-center justify-center w-full h-full text-center">
                  <!-- Uploading State -->
                  <template v-if="store.isComponentUploading('provider5')">
                    <RateGenProgressIndicator 
                      :total-rows="uploadingFileRowCount.provider5"
                      :progress="store.getUploadProgress('provider5')"
                      ref="progressIndicators.provider5"
                    />
                  </template>

                  <!-- Default State -->
                  <template v-else>
                    <!-- Error notification -->
                    <div
                      v-if="uploadErrors.provider5"
                      class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full max-w-xs mx-auto"
                    >
                      <p class="text-red-500 font-medium text-xs">{{ uploadErrors.provider5 }}</p>
                    </div>

                    <ArrowUpTrayIcon
                      class="w-10 h-10 mx-auto border rounded-full p-2"
                      :class="
                        uploadErrors.provider5
                          ? 'text-red-500 border-red-500/50 bg-red-500/10'
                          : 'text-accent border-accent/50 bg-accent/10'
                      "
                    />
                    <p
                      class="mt-2 text-base"
                      :class="uploadErrors.provider5 ? 'text-red-500' : 'text-accent'"
                    >
                      {{ uploadErrors.provider5 ? 'Please try again' : 'DRAG & DROP or CLICK to upload' }}
                    </p>
                  </template>
                </div>
              </div>
              </template>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Provider 2 Zone -->
            <div v-if="visibleZones.includes('provider2')">
              <!-- Similar structure to Provider 1 -->
              <template v-if="isZoneCompleted('provider2')">
                <div class="bg-gray-700 rounded-lg p-4 border border-accent/30">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-fbWhite">
                      {{ getProviderForZone('provider2')?.name }}
                    </h3>
                    <button
                      @click="handleRemoveProvider('provider2')"
                      class="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div class="text-xs text-gray-400">
                    <p>{{ (getProviderForZone('provider2')?.rowCount || getProviderForZone('provider2')?.recordCount || 0).toLocaleString() }} rates uploaded</p>
                    <p>{{ getProviderForZone('provider2')?.fileName }}</p>
                    <p class="mt-1">Avg rates: {{ formatRate(getProviderForZone('provider2')?.avgInterRate) }} / {{ formatRate(getProviderForZone('provider2')?.avgIntraRate) }} / {{ formatRate(getProviderForZone('provider2')?.avgIndeterminateRate) }}</p>
                  </div>
                </div>
              </template>
              <template v-else>
                <div
                  class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center transition-all"
                  :class="[
                    dragStates.provider2
                      ? 'border-accent bg-fbWhite/10 border-solid'
                      : canAcceptDrop('provider2')
                        ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 cursor-pointer'
                        : store.isComponentUploading('provider2')
                          ? 'border-gray-600 border-dashed cursor-not-allowed'
                          : 'border-gray-600 border-dashed opacity-50 cursor-not-allowed',
                    uploadErrors.provider2 ? 'border-red-500 border-solid' : '',
                  ]"
                  @dragenter.prevent="handleDragEnter('provider2')"
                  @dragleave.prevent="handleDragLeave('provider2')"
                  @dragover.prevent="handleDragOver('provider2', $event)"
                  @drop.prevent="handleDrop('provider2', $event)"
                >
                  <input
                    type="file"
                    accept=".csv"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    :disabled="!canAcceptDrop('provider2')"
                    @change="(e) => handleFileChange(e, 'provider2')"
                  />

                  <div class="flex flex-col items-center justify-center w-full h-full text-center">
                    <!-- Uploading State -->
                    <template v-if="store.isComponentUploading('provider2')">
                      <RateGenProgressIndicator 
                        :total-rows="uploadingFileRowCount.provider2"
                        :progress="store.getUploadProgress('provider2')"
                        ref="progressIndicators.provider2"
                      />
                    </template>

                    <!-- Default State -->
                    <template v-else>
                      <!-- Error notification -->
                      <div
                        v-if="uploadErrors.provider2"
                        class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full max-w-xs mx-auto"
                      >
                        <p class="text-red-500 font-medium text-xs">{{ uploadErrors.provider2 }}</p>
                      </div>

                      <ArrowUpTrayIcon
                        class="w-10 h-10 mx-auto border rounded-full p-2"
                        :class="
                          uploadErrors.provider2
                            ? 'text-red-500 border-red-500/50 bg-red-500/10'
                            : 'text-accent border-accent/50 bg-accent/10'
                        "
                      />
                      <p
                        class="mt-2 text-base"
                        :class="uploadErrors.provider2 ? 'text-red-500' : 'text-accent'"
                      >
                        {{ uploadErrors.provider2 ? 'Please try again' : 'DRAG & DROP or CLICK to upload' }}
                      </p>
                    </template>
                  </div>
                </div>
              </template>
            </div>

            <!-- Provider 4 Zone -->
            <div v-if="visibleZones.includes('provider4')">
              <!-- Completed State -->
              <template v-if="isZoneCompleted('provider4')">
                <div class="bg-gray-700 rounded-lg p-4 border border-accent/30">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-fbWhite">
                      {{ getProviderForZone('provider4')?.name }}
                    </h3>
                    <button
                      @click="handleRemoveProvider('provider4')"
                      class="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div class="text-xs text-gray-400">
                    <p>{{ (getProviderForZone('provider4')?.rowCount || getProviderForZone('provider4')?.recordCount || 0).toLocaleString() }} rates uploaded</p>
                    <p>{{ getProviderForZone('provider4')?.fileName }}</p>
                    <p class="mt-1">Avg rates: {{ formatRate(getProviderForZone('provider4')?.avgInterRate) }} / {{ formatRate(getProviderForZone('provider4')?.avgIntraRate) }} / {{ formatRate(getProviderForZone('provider4')?.avgIndeterminateRate) }}</p>
                  </div>
                </div>
              </template>
              
              <!-- Upload State -->
              <template v-else>
              <div
                class="relative border-2 rounded-lg p-6 h-[120px] flex items-center justify-center transition-all"
                :class="[
                  dragStates.provider4
                    ? 'border-accent bg-fbWhite/10 border-solid'
                    : canAcceptDrop('provider4')
                      ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 cursor-pointer'
                      : store.isComponentUploading('provider4')
                        ? 'border-gray-600 border-dashed cursor-not-allowed'
                        : 'border-gray-600 border-dashed opacity-50 cursor-not-allowed',
                  uploadErrors.provider4 ? 'border-red-500 border-solid' : '',
                ]"
                @dragenter.prevent="handleDragEnter('provider4')"
                @dragleave.prevent="handleDragLeave('provider4')"
                @dragover.prevent="handleDragOver('provider4', $event)"
                @drop.prevent="handleDrop('provider4', $event)"
              >
                <input
                  type="file"
                  accept=".csv"
                  class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  :disabled="!canAcceptDrop('provider4')"
                  @change="(e) => handleFileChange(e, 'provider4')"
                />

                <div class="flex flex-col items-center justify-center w-full h-full text-center">
                  <!-- Uploading State -->
                  <template v-if="store.isComponentUploading('provider4')">
                    <RateGenProgressIndicator 
                      :total-rows="uploadingFileRowCount.provider4"
                      :progress="store.getUploadProgress('provider4')"
                      ref="progressIndicators.provider4"
                    />
                  </template>

                  <!-- Default State -->
                  <template v-else>
                    <!-- Error notification -->
                    <div
                      v-if="uploadErrors.provider4"
                      class="bg-red-500/20 py-2 px-4 rounded-lg mb-2 w-full max-w-xs mx-auto"
                    >
                      <p class="text-red-500 font-medium text-xs">{{ uploadErrors.provider4 }}</p>
                    </div>

                    <ArrowUpTrayIcon
                      class="w-10 h-10 mx-auto border rounded-full p-2"
                      :class="
                        uploadErrors.provider4
                          ? 'text-red-500 border-red-500/50 bg-red-500/10'
                          : 'text-accent border-accent/50 bg-accent/10'
                      "
                    />
                    <p
                      class="mt-2 text-base"
                      :class="uploadErrors.provider4 ? 'text-red-500' : 'text-accent'"
                    >
                      {{ uploadErrors.provider4 ? 'Please try again' : 'DRAG & DROP or CLICK to upload' }}
                    </p>
                  </template>
                </div>
              </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Status Info -->
        <div class="mt-6 pt-4 border-t border-gray-700">
          <div class="flex items-center justify-between text-sm">
            <div class="text-gray-400">
              Providers uploaded: {{ store.providerCount }}/5
            </div>
            <div class="text-accent" v-if="store.providerCount >= 2">
              Ready to generate rates!
            </div>
            <div class="text-gray-500" v-else>
              Upload at least 2 providers to generate rates
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PreviewModal for column mapping and provider naming -->
    <PreviewModal
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="previewColumns"
      :startLine="startLine"
      :previewData="previewData"
      :columnOptions="rateGenColumnOptions"
      :validateRequired="true"
      :requireProviderName="true"
      :providerName="providerName"
      @update:mappings="columnMappings = $event"
      @update:valid="isModalValid = $event"
      @update:start-line="startLine = $event"
      @update:provider-name="providerName = $event"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

    <!-- Confirmation Modal for Provider Removal -->
    <ConfirmationModal
      v-model="showConfirmModal"
      title="Remove Provider"
      :message="`Are you sure you want to remove '${confirmingProviderName}'? This action cannot be undone.`"
      confirm-button-text="Remove"
      cancel-button-text="Cancel"
      variant="destructive"
      @confirm="confirmRemoveProvider"
    />

    <!-- Plan Selection Modal -->
    <PlanSelectionModal
      :show="globalUploadLimit.showPlanSelectionModal.value"
      @close="globalUploadLimit.closePlanSelectionModal"
      @select-plan="globalUploadLimit.handlePlanSelection"
    />
  </div>
</template>

<style scoped>
/* Any additional custom styles if needed */
</style>