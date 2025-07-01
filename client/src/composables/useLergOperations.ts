import { ref, computed } from 'vue';
import { supabase } from '@/services/supabase.service';
import { useLergStoreV2, type EnhancedNPARecord } from '@/stores/lerg-store-v2';
import Papa from 'papaparse';

export interface LergUploadOptions {
  mappings: Record<string, string>;
  startLine: number;
}

export interface LergRecord {
  npa: string;
  state: string;
  country: string;
}

// Global state for operations
const isLoading = ref(false);
const error = ref<string | null>(null);
const isEdgeFunctionAvailable = ref(true);

export function useLergOperations() {
  const store = useLergStoreV2();

  // Computed state
  const isInitialized = computed(() => store.isInitialized);

  // Check if edge functions are available
  async function checkEdgeFunctionStatus(): Promise<boolean> {
    try {
      const { data, error: funcError } = await supabase.functions.invoke('get-enhanced-lerg-data');
      
      if (funcError) {
        console.warn('[LergOps] Edge function not available:', funcError);
        isEdgeFunctionAvailable.value = false;
        return false;
      }

      isEdgeFunctionAvailable.value = true;
      return true;
    } catch (err) {
      console.warn('[LergOps] Edge function check failed:', err);
      isEdgeFunctionAvailable.value = false;
      return false;
    }
  }

  // Initialize LERG data (called once on app startup)
  async function initializeLergData(): Promise<void> {
    if (store.isLoaded && store.allNPAs.length > 0) {
      console.log('[LergOps] LERG data already loaded, skipping initialization');
      return;
    }

    try {
      await store.loadFromSupabase();
    } catch (err) {
      console.error('[LergOps] Failed to initialize LERG data:', err);
      error.value = err instanceof Error ? err.message : 'Failed to initialize LERG data';
      throw err;
    }
  }

  // Upload LERG CSV file
  async function uploadLerg(file: File, options: LergUploadOptions): Promise<void> {
    if (isLoading.value) {
      throw new Error('Upload already in progress');
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Check edge function availability
      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available. Cannot upload LERG data.');
      }

      // Parse CSV file
      const csvData = await parseCSVFile(file, options);
      
      // Validate CSV data
      if (csvData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      console.log(`[LergOps] Uploading ${csvData.length} LERG records...`);

      // Upload to Supabase via edge function
      const { data, error: uploadError } = await supabase.functions.invoke('upload-lerg-data', {
        body: { records: csvData }
      });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload LERG data');
      }

      console.log(`[LergOps] Successfully uploaded ${csvData.length} records`);

      // Refresh store data
      await store.refresh();

    } catch (err) {
      console.error('[LergOps] Upload failed:', err);
      error.value = err instanceof Error ? err.message : 'Upload failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Add a single LERG record
  async function addRecord(record: LergRecord): Promise<void> {
    if (isLoading.value) {
      throw new Error('Operation already in progress');
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Check edge function availability
      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available. Cannot add LERG record.');
      }

      // Validate record
      if (!record.npa || !record.state || !record.country) {
        throw new Error('NPA, state, and country are required');
      }

      if (!/^[0-9]{3}$/.test(record.npa)) {
        throw new Error('NPA must be exactly 3 digits');
      }

      console.log(`[LergOps] Adding LERG record: ${record.npa}`);

      // Add via edge function
      const { data, error: addError } = await supabase.functions.invoke('add-lerg-record', {
        body: { 
          npa: record.npa,
          state_province_code: record.state.toUpperCase(),
          country_code: record.country.toUpperCase(),
        }
      });

      if (addError) {
        throw new Error(addError.message || 'Failed to add LERG record');
      }

      console.log(`[LergOps] Successfully added record: ${record.npa}`);

      // Refresh store data
      await store.refresh();

    } catch (err) {
      console.error('[LergOps] Add record failed:', err);
      error.value = err instanceof Error ? err.message : 'Failed to add record';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Clear all LERG data
  async function clearLerg(): Promise<void> {
    if (isLoading.value) {
      throw new Error('Operation already in progress');
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Check edge function availability
      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available. Cannot clear LERG data.');
      }

      console.log('[LergOps] Clearing all LERG data...');

      // Clear via edge function
      const { data, error: clearError } = await supabase.functions.invoke('clear-lerg-data');

      if (clearError) {
        throw new Error(clearError.message || 'Failed to clear LERG data');
      }

      console.log('[LergOps] Successfully cleared all LERG data');

      // Clear store data
      store.clearData();

    } catch (err) {
      console.error('[LergOps] Clear failed:', err);
      error.value = err instanceof Error ? err.message : 'Failed to clear data';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Download LERG data as CSV
  async function downloadLerg(): Promise<Blob> {
    try {
      if (!store.isLoaded || store.allNPAs.length === 0) {
        throw new Error('No LERG data available to download');
      }

      // Convert store data to CSV format
      const csvData = store.allNPAs.map(record => ({
        npa: record.npa,
        country_code: record.country_code,
        country_name: record.country_name,
        state_province_code: record.state_province_code,
        state_province_name: record.state_province_name,
        category: record.category,
        confidence_score: record.confidence_score,
        source: record.source,
        is_active: record.is_active,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));

      // Convert to CSV string
      const csv = Papa.unparse(csvData);
      
      // Create blob
      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    } catch (err) {
      console.error('[LergOps] Download failed:', err);
      error.value = err instanceof Error ? err.message : 'Failed to download data';
      throw err;
    }
  }

  // Helper function to parse CSV file
  async function parseCSVFile(file: File, options: LergUploadOptions): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
              return;
            }

            const rows = results.data as string[][];
            if (rows.length <= options.startLine) {
              reject(new Error('File has no data rows'));
              return;
            }

            // Skip header rows
            const dataRows = rows.slice(options.startLine);
            
            // Map columns based on user mappings
            const mappedData = dataRows
              .map((row, index) => {
                try {
                  const record: any = {};
                  
                  // Apply column mappings
                  Object.entries(options.mappings).forEach(([columnIndex, fieldName]) => {
                    const colIndex = parseInt(columnIndex);
                    if (colIndex < row.length) {
                      record[fieldName] = row[colIndex]?.trim() || '';
                    }
                  });

                  // Validate required fields
                  if (!record.npa || !record.state || !record.country) {
                    console.warn(`[LergOps] Skipping row ${index + 1}: missing required fields`);
                    return null;
                  }

                  // Validate NPA format
                  if (!/^[0-9]{3}$/.test(record.npa)) {
                    console.warn(`[LergOps] Skipping row ${index + 1}: invalid NPA format: ${record.npa}`);
                    return null;
                  }

                  return {
                    npa: record.npa,
                    state_province_code: record.state.toUpperCase(),
                    country_code: record.country.toUpperCase(),
                    // Add other mapped fields as needed
                  };
                } catch (err) {
                  console.warn(`[LergOps] Error processing row ${index + 1}:`, err);
                  return null;
                }
              })
              .filter(record => record !== null);

            if (mappedData.length === 0) {
              reject(new Error('No valid records found in CSV file'));
              return;
            }

            resolve(mappedData);
          } catch (err) {
            reject(err);
          }
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    });
  }

  return {
    // State
    isLoading: computed(() => isLoading.value || store.isLoading),
    error: computed(() => error.value || store.error),
    isInitialized,
    isEdgeFunctionAvailable: computed(() => isEdgeFunctionAvailable.value),

    // Actions
    initializeLergData,
    uploadLerg,
    addRecord,
    clearLerg,
    downloadLerg,
    checkEdgeFunctionStatus,
  };
}