import { ref, computed } from 'vue';
import { supabase } from '@/utils/supabase';
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
      // Ensure LERG data is loaded before proceeding. This is the definitive fix.
      if (!store.isLoaded) {
        console.log('[LergOps] LERG data not loaded. Forcing synchronous load before upload...');
        await store.loadFromSupabase();
        console.log('[LergOps] LERG data load complete.');
      }

      // Check edge function availability
      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available. Cannot upload LERG data.');
      }

      // Parse CSV file, passing the now-guaranteed-to-be-loaded store
      const csvData = await parseCSVFile(file, options, store);

      // Validate CSV data
      if (csvData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      console.log(`[LergOps] Uploading ${csvData.length} LERG records...`);

      // Upload to Supabase via edge function
      const { data, error: uploadError } = await supabase.functions.invoke('upload-lerg', {
        body: { records: csvData },
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

      // Map state codes to names
      const stateNames: Record<string, string> = {
        // US States
        AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
        CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
        FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
        IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
        ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
        MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
        NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
        NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
        PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
        TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
        WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
        // Canadian Provinces
        AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
        NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
        NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
        SK: 'Saskatchewan', YT: 'Yukon',
        // US Territories
        PR: 'Puerto Rico', VI: 'Virgin Islands', GU: 'Guam', AS: 'American Samoa',
        MP: 'Northern Mariana Islands'
      };

      const stateCode = record.state.toUpperCase();
      const stateName = stateNames[stateCode] || stateCode;
      
      // Add via edge function
      const { data, error: addError } = await supabase.functions.invoke('add-enhanced-lerg-record', {
        body: {
          npa: record.npa,
          state_province_code: stateCode,
          country_code: record.country.toUpperCase(),
          state_province_name: stateName,
          country_name: record.country === 'US' ? 'United States' : record.country === 'CA' ? 'Canada' : record.country,
          category: record.country === 'US' ? 'us-domestic' : record.country === 'CA' ? 'canadian' : 'caribbean',
        },
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
      const { data, error: clearError } = await supabase.functions.invoke('clear-lerg');

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
      const csvData = store.allNPAs.map((record) => ({
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
  async function parseCSVFile(
    file: File,
    options: LergUploadOptions,
    lergStore: ReturnType<typeof useLergStoreV2>
  ): Promise<any[]> {
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

            // Create a reverse mapping for easier lookup
            const roleToColumnIndex: Record<string, number> = {};
            console.log('[LergOps] Mapping configuration:', options.mappings);
            
            for (const [columnIndex, roleValue] of Object.entries(options.mappings)) {
              if (roleValue && roleValue !== '') {
                roleToColumnIndex[roleValue] = parseInt(columnIndex);
              }
            }
            
            console.log('[LergOps] Role to column index mapping:', roleToColumnIndex);

            // Map columns based on user mappings
            const mappedData = dataRows
              .map((row, index) => {
                try {
                  const npaIndex = roleToColumnIndex['npa'];
                  const stateIndex = roleToColumnIndex['state'];
                  const countryIndex = roleToColumnIndex['country'];

                  const npa = npaIndex !== undefined ? row[npaIndex]?.trim() : undefined;
                  let state = stateIndex !== undefined ? row[stateIndex]?.trim() : undefined;
                  let country = countryIndex !== undefined ? row[countryIndex]?.trim() : undefined;

                  // Only use LERG store for enrichment if CSV data is missing
                  if (npa && (!state || !country)) {
                    const lergInfo = lergStore.getNPAInfo(npa);
                    if (lergInfo) {
                      if (!state) state = lergInfo.state_province_code;
                      if (!country) country = lergInfo.country_code;
                      console.log(`[LergOps] Enriched NPA ${npa} with LERG data: state=${state}, country=${country}`);
                    }
                  }
                  
                  console.log(`[LergOps] Row ${index + options.startLine + 1}: npa=${npa}, state=${state}, country=${country}`);

                  // More robust validation to prevent crashes from invalid data types
                  if (
                    typeof npa !== 'string' ||
                    npa.trim() === '' ||
                    typeof state !== 'string' ||
                    state.trim() === '' ||
                    typeof country !== 'string' ||
                    country.trim() === ''
                  ) {
                    console.warn(
                      `[LergOps] Skipping row ${
                        index + options.startLine + 1
                      }: missing or invalid required fields after enrichment. Found: npa=${npa}, state=${state}, country=${country}`
                    );
                    return null;
                  }

                  // Validate NPA format
                  if (!/^[0-9]{3}$/.test(npa)) {
                    console.warn(
                      `[LergOps] Skipping row ${
                        index + options.startLine + 1
                      }: invalid NPA format: ${npa}`
                    );
                    return null;
                  }

                  return {
                    npa: npa,
                    state: state.toUpperCase(),
                    country: country.toUpperCase(),
                  };
                } catch (err) {
                  // Enhanced logging to capture the actual error and stack trace
                  const errorMessage = err instanceof Error ? err.message : String(err);
                  console.error(
                    `[LergOps] CRITICAL: Error processing row ${
                      index + options.startLine + 1
                    }. Error: ${errorMessage}`,
                    err
                  );
                  return null;
                }
              })
              .filter((record) => record !== null);

            // Remove duplicates based on NPA
            const seenNPAs = new Set<string>();
            const uniqueData = mappedData.filter((record) => {
              if (seenNPAs.has(record.npa)) {
                console.log(`[LergOps] Skipping duplicate NPA: ${record.npa}`);
                return false;
              }
              seenNPAs.add(record.npa);
              return true;
            });

            console.log(`[LergOps] Removed ${mappedData.length - uniqueData.length} duplicates, ${uniqueData.length} unique NPAs remaining`);

            if (uniqueData.length === 0) {
              reject(new Error('No valid records found after parsing CSV file'));
              return;
            }

            resolve(uniqueData);
          } catch (err) {
            reject(err);
          }
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        },
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
