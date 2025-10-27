<template>
  <div class="text-white pt-2 w-full">
    <h1 class="text-xl md:text-2xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
      Admin Dashboard
    </h1>

    <!-- Stats Dashboard -->
    <div class="flex flex-col gap-6 bg-gray-800 pb-6">
      <!-- Test Payment Flow (Admin Only) -->
      <div v-if="isAdmin" class="bg-gray-700 rounded-lg p-6 mx-4 mt-4">
        <h2 class="text-xl font-semibold text-accent mb-4">🧪 Test Payment Flow</h2>
        <div class="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-4">
          <p class="text-yellow-200 text-sm">
            <strong>⚠️ Admin Testing Tool:</strong> This creates a real $1.00/month subscription for testing the complete payment flow.
          </p>
          <p class="text-yellow-200 text-sm mt-2">
            Tests: Checkout → Webhook → Database Updates → Monthly Renewals
          </p>
        </div>

        <div class="flex items-center gap-4">
          <button
            @click="handleTestCheckout"
            :disabled="isTestCheckoutLoading"
            class="bg-accent hover:bg-accent/80 text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isTestCheckoutLoading ? 'Creating Checkout...' : 'Test Checkout ($1.00/month)' }}
          </button>

          <div v-if="testCheckoutStatus" class="flex-1">
            <div :class="getStatusClass(testCheckoutStatus.type)" class="rounded-lg p-3">
              <p :class="getStatusTextClass(testCheckoutStatus.type)" class="font-semibold">
                {{ testCheckoutStatus.message }}
              </p>
              <p v-if="testCheckoutStatus.details" :class="getStatusTextClass(testCheckoutStatus.type)" class="text-sm mt-1">
                {{ testCheckoutStatus.details }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Unified NANP Management -->
      <UnifiedNANPManagement />

      <!-- User Management (Admin Only) -->
      <UserManagement v-if="isAdmin" />
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
      :validate-required="true"
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
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  import { useLergOperations } from '@/composables/useLergOperations';
  import { usePingStatus } from '@/composables/usePingStatus';
  import { useUserStore } from '@/stores/user-store';
  import { supabase } from '@/utils/supabase';
  import {
    TrashIcon,
    ArrowUpTrayIcon,
    DocumentIcon,
    PlusCircleIcon,
    ArrowPathIcon,
  } from '@heroicons/vue/24/outline';
  // Static constants removed - using enhanced LERG data directly
  import type { LERGRecord } from '@/types/domains/lerg-types';
  import { LERG_COLUMN_ROLE_OPTIONS } from '@/types/domains/lerg-types';
  import PreviewModal from '@/components/shared/PreviewModal.vue';
  import Papa from 'papaparse';
  import type { ParseResult } from 'papaparse';
  import { useDragDrop } from '@/composables/useDragDrop';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import UnifiedNANPManagement from '@/components/admin/UnifiedNANPManagement.vue';
  import UserManagement from '@/components/admin/UserManagement.vue';

  const store = useLergStoreV2();
  const userStore = useUserStore();
  const {
    uploadLerg,
    downloadLerg,
    clearLerg,
    checkEdgeFunctionStatus,
    isLoading,
    error,
    isInitialized,
    isEdgeFunctionAvailable,
    addRecord,
  } = useLergOperations();
  const lergFileInput = ref<HTMLInputElement>();
  const lergStats = computed(() => store.stats);
  const expandedCountries = ref<string[]>([]);
  const showStateDetails = ref(false);
  const expandedStates = ref<string[]>([]);
  const expandedProvinces = ref<string[]>([]);
  const showCountryDetails = ref(false);
  const showLergSection = ref(false);
  const showAddLergSection = ref(true);

  // Check if user is admin
  const isAdmin = computed(() => userStore.isAdmin);

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

  // Test checkout state
  const isTestCheckoutLoading = ref(false);
  const testCheckoutStatus = ref<UploadStatus | null>(null);

  const isFormValid = computed(() => {
    return (
      /^[0-9]{3}$/.test(newRecord.npa) &&
      /^[A-Za-z]{2}$/.test(newRecord.state) &&
      /^[A-Za-z]{2}$/.test(newRecord.country) &&
      Object.values(validationErrors).every((err) => !err)
    );
  });

  // Edge status computed property
  const edgeStatusClass = computed(() => {
    const status = pingStatus.value;
    if (!status) {
      return 'bg-gray-500'; // Loading/unknown
    }
    
    if (status.hasLergTable && !status.error) {
      return 'bg-accent animate-status-pulse-success'; // Green pulsing
    } else {
      return 'bg-red-500 animate-status-pulse-error'; // Red pulsing
    }
  });

  onMounted(async () => {
    await checkPingStatus();
    
    // Note: Enhanced LERG data initialization is handled by Dashboard.vue
    // No need to initialize here to avoid duplicate operations

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
    return store.canadaTotalNPAs;
  });

  const getUSTotalNPAs = computed(() => {
    return store.usTotalNPAs;
  });

  const getNonUSTotalNPAs = computed(() => {
    return store.caribbeanTotalNPAs;
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
    } else {
      // Enhanced validation - will be handled by the backend
      // No need for static constant validation
    }

    if (!/^[A-Za-z]{2}$/.test(newRecord.country)) {
      validationErrors.country = 'Country must be exactly 2 letters.';
      isValid = false;
    } else {
      // Enhanced validation - will be handled by the backend
      // No need for static constant validation
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
      await addRecord({
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

  /**
   * Handle test checkout - creates a $1.00/month subscription for testing
   */
  async function handleTestCheckout() {
    try {
      isTestCheckoutLoading.value = true;
      testCheckoutStatus.value = {
        type: 'warning',
        message: 'Creating test checkout session...',
      };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const testPriceId = import.meta.env.VITE_STRIPE_PRICE_TEST_CHARGE;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration');
      }

      if (!testPriceId) {
        throw new Error('Test price ID not configured in environment variables');
      }

      // Get the user's session token
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionToken = sessionData?.session?.access_token;

      if (!sessionToken) {
        throw new Error('No active session. Please log in again.');
      }

      // Call the create-checkout-session edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          priceId: testPriceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      if (!sessionId) {
        throw new Error('No checkout session ID returned');
      }

      testCheckoutStatus.value = {
        type: 'success',
        message: 'Redirecting to Stripe checkout...',
        details: 'You will be redirected to complete the $1.00/month test subscription',
      };

      // Load Stripe.js and redirect to checkout
      const stripe = await (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message || 'Failed to redirect to checkout');
      }

    } catch (err) {
      console.error('Test checkout error:', err);
      isTestCheckoutLoading.value = false;
      testCheckoutStatus.value = {
        type: 'error',
        message: 'Failed to create test checkout',
        details: err instanceof Error ? err.message : 'Unknown error occurred',
      };
    }
  }
</script>
