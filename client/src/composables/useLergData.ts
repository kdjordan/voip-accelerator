import { ref } from 'vue';
import { supabase } from '@/utils/supabase';
import { useLergStore } from '@/stores/lerg-store';
import { LergService } from '@/services/lerg.service';
import type {
  LERGRecord,
  StateNPAMapping,
  CountryLergData,
  NPAEntry,
} from '@/types/domains/lerg-types';
import Papa from 'papaparse';

export function useLergData() {
  // Get the LERG service using the singleton instance
  const lergService = LergService.getInstance();
  const lergStore = useLergStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isInitialized = ref(false);
  const isEdgeFunctionAvailable = ref(false);
  const isInitializing = ref(false);

  const checkEdgeFunctionStatus = async () => {
    try {
      const { data, error: pingError } = await supabase.functions.invoke('ping-status');
      if (pingError) {
        isEdgeFunctionAvailable.value = false;
        return false;
      }
      isEdgeFunctionAvailable.value = data?.status === 'ok';
      return data?.status === 'ok';
    } catch (err) {
      isEdgeFunctionAvailable.value = false;
      return false;
    }
  };

  const initializeLergData = async () => {
    if (isInitializing.value) return;

    isInitializing.value = true;
    error.value = null;

    try {
      // First check if we already have LERG data in the store
      if (lergStore.stats?.totalNPAs > 0) return;

      // Check edge function availability first
      await checkEdgeFunctionStatus();

      if (isEdgeFunctionAvailable.value) {
        await uploadLerg(null);
      } else {
        error.value = 'Edge functions are not available';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize LERG service';
      throw err;
    } finally {
      isInitializing.value = false;
    }
  };

  const uploadLerg = async (
    file: File | null,
    options?: { mappings?: Record<string, string>; startLine?: number }
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Always check edge function status first
      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available');
      }

      // If no file is provided, just check if LERG data exists
      if (!file) {
        const { data: pingData, error: pingError } = await supabase.functions.invoke('ping-status');
        if (pingError) throw new Error(pingError.message);

        if (!pingData?.hasLergTable) {
          return null;
        }

        const { data: lergData, error: lergError } = await supabase.functions.invoke(
          'get-lerg-data'
        );
        if (lergError) throw new Error(lergError.message);

        if (lergData?.data?.length) {
          // Extract the last_updated timestamp from the first record
          const lastUpdated = lergData.data[0]?.last_updated
            ? new Date(lergData.data[0].last_updated)
            : new Date();

          // Set each record's last_updated field
          const recordsWithTimestamp = lergData.data.map((record: LERGRecord) => ({
            ...record,
            last_updated: lastUpdated,
          }));

          // Use the Dexie service to initialize the table
          await lergService.initializeLergTable(recordsWithTimestamp);
          await updateStoreData();
        }
        return lergData;
      }

      // Read and parse the CSV file
      const fileText = await file.text();

      // Parse CSV with Papa Parse - without headers
      const { data: csvData, errors } = Papa.parse<string[]>(fileText, {
        header: false,
        skipEmptyLines: true,
        transform: (value) => value.trim(),
      });

      if (errors.length > 0) {
        throw new Error('Failed to parse CSV file: ' + errors[0].message);
      }

      // Map columns using provided mappings
      const mappings = options?.mappings || {};

      // Find the indices for our required fields
      const npaIndex = Object.entries(mappings).find(
        ([_, val]) => val.toUpperCase() === 'NPA'
      )?.[0];
      const stateIndex = Object.entries(mappings).find(
        ([_, val]) => val.toUpperCase() === 'STATE'
      )?.[0];
      const countryIndex = Object.entries(mappings).find(
        ([_, val]) => val.toUpperCase() === 'COUNTRY'
      )?.[0];

      if (!npaIndex || !stateIndex || !countryIndex) {
        throw new Error('Required mappings (NPA, State, Country) not found');
      }

      // Skip header row if specified
      const startLine = options?.startLine || 0;
      const dataRows = startLine > 0 ? csvData.slice(startLine) : csvData;

      // Process and deduplicate records
      const uniqueRecords = new Map<string, LERGRecord>();

      for (const row of dataRows) {
        const npa = row[parseInt(npaIndex)]?.trim();
        const state = row[parseInt(stateIndex)]?.trim();
        const country = row[parseInt(countryIndex)]?.trim();

        if (npa && state && country) {
          // Validate NPA format (3 digits)
          if (!/^[0-9]{3}$/.test(npa)) continue;

          // Validate state (2 characters)
          if (state.length !== 2) continue;

          // Validate country (2 characters)
          if (country.length !== 2) continue;

          if (!uniqueRecords.has(npa)) {
            uniqueRecords.set(npa, {
              npa,
              state,
              country,
            });
          }
        }
      }

      const records = Array.from(uniqueRecords.values());

      // Send to edge function
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'upload-lerg',
        {
          body: { records },
        }
      );

      if (uploadError) throw uploadError;
      if (!uploadData) throw new Error('No response data from upload function');

      const { data: lergData, error: lergError } = await supabase.functions.invoke('get-lerg-data');
      if (lergError) throw new Error(lergError.message);

      if (lergData?.data?.length) {
        // Extract the last_updated timestamp from the first record or use current date
        const lastUpdated = lergData.data[0]?.last_updated
          ? new Date(lergData.data[0].last_updated)
          : new Date();

        // Set each record's last_updated field
        const recordsWithTimestamp = lergData.data.map((record: LERGRecord) => ({
          ...record,
          last_updated: lastUpdated,
        }));

        // Use the Dexie service to initialize the table
        await lergService.initializeLergTable(recordsWithTimestamp);
        await updateStoreData();
      }

      return lergData;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload LERG data';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const downloadLerg = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available');
      }

      const { data, error: downloadError } = await supabase.functions.invoke('get-lerg-data');
      if (downloadError) throw new Error(downloadError.message);

      if (data?.data?.length) {
        await lergService.initializeLergTable(data.data);
        await updateStoreData();
      }

      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download LERG data';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearLerg = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available');
      }

      const { data: clearData, error: clearError } = await supabase.functions.invoke('clear-lerg');
      if (clearError) throw clearError;

      // Clear the store
      lergStore.clearLergData();

      // Clear IndexedDB using our Dexie service
      await lergService.clearLergData();

      return { success: true };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear LERG data';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getProcessed = async (): Promise<{
    stateMapping: StateNPAMapping;
    canadaProvinces: Record<string, Set<string>>;
    countryData: CountryLergData[];
    count: number;
  }> => {
    try {
      isLoading.value = true;
      error.value = null;

      // Call the LERG service to get processed data
      const processedData = await lergService.processLergData();

      // Check if data is valid and not null
      if (!processedData?.stateMapping || !processedData?.countryData) {
        error.value = 'Failed to process LERG data: received invalid data';
        throw new Error('Failed to process LERG data: received invalid data');
      }

      // Return the structured data
      return {
        stateMapping: processedData.stateMapping,
        canadaProvinces: processedData.canadaProvinces,
        countryData: processedData.countryData,
        count: processedData.countryData.reduce((total, country) => total + country.npaCount, 0),
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to process LERG data';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getAll = async (): Promise<LERGRecord[]> => {
    try {
      isLoading.value = true;
      error.value = null;
      // Call the LERG service to get all records
      const records = await lergService.getAllRecords();
      return records || [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch all LERG records';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const ping = async () => {
    try {
      const { data, error: pingError } = await supabase.functions.invoke('ping-status');
      if (pingError) return false;
      return data?.status === 'ok';
    } catch (err) {
      return false;
    }
  };

  const updateStoreData = async () => {
    try {
      // Destructure the new return shape from getProcessed (which calls service.getProcessedData)
      const {
        stateMapping,
        canadaProvinces: processedCanadaProvinces,
        countryData,
        count,
      } = await getProcessed();
      const { lastUpdated } = await lergService.getLastUpdatedTimestamp();

      // Prepare maps for the store
      const usStatesMap = new Map<string, NPAEntry[]>();
      const canadaProvincesMap = new Map<string, NPAEntry[]>();
      const otherCountriesMap = new Map<string, NPAEntry[]>();

      // Process stateMapping (primarily US states)
      Object.entries(stateMapping).forEach(([stateCode, npas]) => {
        // We still only expect US states (or potentially XX) here based on service logic
        if (lergService.isUSState(stateCode)) {
          usStatesMap.set(
            stateCode,
            npas.map((npa) => ({ npa }))
          );
        } else if (stateCode === 'XX') {
          // Handle the special 'XX' case if needed, maybe add to canadaProvinces or a separate category?
          // For now, let's add it to canadaProvincesMap as 'Other Canadian Areas'
          // canadaProvincesMap.set(stateCode, npas.map((npa) => ({ npa })));
          console.warn(
            `[useLergData] Found stateMapping entry for '${stateCode}', currently ignored for store maps.`
          );
        }
      });

      // Process the explicitly returned processedCanadaProvinces map
      Object.entries(processedCanadaProvinces).forEach(([provinceCode, npaSet]) => {
        // No need to check isCanadianProvince here, as the service already segregated them
        canadaProvincesMap.set(
          provinceCode,
          Array.from(npaSet).map((npa) => ({ npa }))
        );
      });

      // Process country data for other countries (remains the same)
      countryData
        .filter((country) => country.country !== 'US' && country.country !== 'CA')
        .forEach((country) => {
          otherCountriesMap.set(
            country.country,
            country.npas.map((npa) => ({ npa }))
          );
        });

      // Set data in the store using new methods
      lergStore.setUSStates(usStatesMap);
      lergStore.setCanadaProvinces(canadaProvincesMap); // Pass the correctly populated map
      lergStore.setOtherCountries(otherCountriesMap);

      // Update stats and status
      lergStore.updateStats();
      lergStore.setLastUpdated(lastUpdated ? new Date(lastUpdated) : null);
      lergStore.setLoaded(true);

      console.log(
        `[useLergData] LERG Store updated. US States: ${usStatesMap.size}, CA Prov: ${canadaProvincesMap.size}, Other Countries: ${otherCountriesMap.size}`
      );
    } catch (err) {
      console.error('[useLergData] Failed to update LERG store data:', err);
      lergStore.setError(err instanceof Error ? err.message : 'Failed to update store data');
    }
  };

  return {
    uploadLerg,
    downloadLerg,
    clearLerg,
    getProcessed,
    getAll,
    ping,
    initializeLergData,
    isLoading,
    error,
    isInitialized,
    isEdgeFunctionAvailable,
    checkEdgeFunctionStatus,
  };
}
