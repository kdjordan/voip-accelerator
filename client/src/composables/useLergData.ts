import { ref } from 'vue';
import { LergService } from '@/services/lerg.service';
import { supabase } from '@/utils/supabase';
import { useLergStore } from '@/stores/lerg-store';
import type { LERGRecord, StateNPAMapping, CountryLergData } from '@/types/domains/lerg-types';
import Papa from 'papaparse';

interface CSVRow {
  NPA?: string;
  State?: string;
  Country?: string;
  [key: string]: string | undefined;
}

export function useLergData() {
  const lergService = LergService.getInstance();
  const lergStore = useLergStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isInitialized = ref(false);
  const isEdgeFunctionAvailable = ref(false);

  const checkEdgeFunctionStatus = async () => {
    try {
      const { data, error: pingError } = await supabase.functions.invoke('ping-status');
      if (pingError) {
        console.error('Edge function ping error:', pingError);
        isEdgeFunctionAvailable.value = false;
        return false;
      }
      isEdgeFunctionAvailable.value = data?.status === 'ok';
      return data?.status === 'ok';
    } catch (err) {
      console.error('Edge function ping error:', err);
      isEdgeFunctionAvailable.value = false;
      return false;
    }
  };

  const uploadLerg = async (
    file: File | null,
    options?: { mappings?: Record<string, string>; startLine?: number }
  ) => {
    try {
      console.log('🚀 Starting LERG upload process');
      console.log('📝 Input parameters:', {
        hasFile: Boolean(file),
        fileName: file?.name,
        fileSize: file?.size,
        mappings: options?.mappings,
      });

      isLoading.value = true;
      error.value = null;

      // Always check edge function status first
      console.log('🔍 Checking edge function availability...');
      const isAvailable = await checkEdgeFunctionStatus();
      console.log('Edge function status:', isAvailable ? '✅ Available' : '❌ Not available');

      if (!isAvailable) {
        throw new Error('Edge functions are not available');
      }

      // If no file is provided, just check if LERG data exists
      if (!file) {
        console.log('📊 No file provided, checking existing LERG data...');
        const { data: pingData, error: pingError } = await supabase.functions.invoke('ping-status');
        if (pingError) throw new Error(pingError.message);

        if (!pingData?.hasLergTable) {
          console.log('❌ No LERG data found in Supabase');
          return null;
        }

        console.log('📥 Fetching existing LERG data...');
        const { data: lergData, error: lergError } = await supabase.functions.invoke(
          'get-lerg-data'
        );
        if (lergError) throw new Error(lergError.message);

        if (lergData?.data?.length) {
          console.log(`✅ Found ${lergData.data.length} existing LERG records`);
          console.log('📝 Initializing local database...');
          await lergService.initializeLergTable(lergData.data);
          await updateStoreData();
        }
        return lergData;
      }

      // Read and parse the CSV file
      console.log('📄 Reading and parsing CSV file...');
      const fileText = await file.text();

      // Parse CSV with Papa Parse - without headers
      const { data: csvData, errors } = Papa.parse<string[]>(fileText, {
        header: false,
        skipEmptyLines: true,
        transform: (value) => value.trim(),
      });

      if (errors.length > 0) {
        console.error('❌ CSV parsing errors:', errors);
        throw new Error('Failed to parse CSV file: ' + errors[0].message);
      }

      console.log(`📊 Parsed ${csvData.length} rows from CSV`);

      // Map columns using provided mappings
      const mappings = options?.mappings || {};
      console.log('📋 Using column mappings:', mappings);

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

      console.log('🔍 Found column indices:', { npaIndex, stateIndex, countryIndex });

      if (!npaIndex || !stateIndex || !countryIndex) {
        console.error('❌ Missing required mappings:', {
          providedMappings: mappings,
          npaIndex,
          stateIndex,
          countryIndex,
        });
        throw new Error('Required mappings (NPA, State, Country) not found');
      }

      // Skip header row if specified
      const startLine = options?.startLine || 0;
      const dataRows = startLine > 0 ? csvData.slice(startLine) : csvData;

      // Process and deduplicate records
      console.log('🔄 Processing and deduplicating records...');
      const uniqueRecords = new Map<string, LERGRecord>();

      for (const row of dataRows) {
        const npa = row[parseInt(npaIndex)]?.trim();
        const state = row[parseInt(stateIndex)]?.trim();
        const country = row[parseInt(countryIndex)]?.trim();

        if (npa && state && country) {
          // Validate NPA format (3 digits)
          if (!/^[0-9]{3}$/.test(npa)) {
            console.warn('⚠️ Skipping invalid NPA:', npa);
            continue;
          }

          // Validate state (2 characters)
          if (state.length !== 2) {
            console.warn('⚠️ Skipping invalid state:', state);
            continue;
          }

          // Validate country (2 characters)
          if (country.length !== 2) {
            console.warn('⚠️ Skipping invalid country:', country);
            continue;
          }

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
      console.log(
        `✨ Processed ${records.length} unique records from ${dataRows.length} total rows`
      );

      // Send to edge function
      console.log('🚀 Sending records to edge function...');
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'upload-lerg',
        {
          body: { records },
        }
      );

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      if (!uploadData) {
        throw new Error('No response data from upload function');
      }

      console.log('✅ Upload successful:', uploadData);
      console.log('📥 Fetching processed LERG data...');

      const { data: lergData, error: lergError } = await supabase.functions.invoke('get-lerg-data');
      if (lergError) throw new Error(lergError.message);

      if (lergData?.data?.length) {
        console.log(`📊 Received ${lergData.data.length} LERG records`);
        console.log('💾 Initializing local database...');
        await lergService.initializeLergTable(lergData.data);
        await updateStoreData();
        console.log('✅ Local database updated successfully');
      }

      return lergData;
    } catch (err) {
      console.error('❌ LERG upload error:', err);
      error.value = err instanceof Error ? err.message : 'Failed to upload LERG data';
      throw err;
    } finally {
      isLoading.value = false;
      console.log('🏁 LERG upload process completed');
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
      console.error('LERG download error:', err);
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

      const { error: clearError } = await supabase.functions.invoke('clear-lerg-data');
      if (clearError) throw new Error(clearError.message);

      await lergService.clearLergData();
      lergStore.clearLergData();
    } catch (err) {
      console.error('LERG clear error:', err);
      error.value = err instanceof Error ? err.message : 'Failed to clear LERG data';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getProcessed = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const data = await lergService.getProcessedData();
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getAll = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const data = await lergService.getAllRecords();
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const ping = async () => {
    try {
      const { data, error: pingError } = await supabase.functions.invoke('ping-status');
      if (pingError) {
        console.error('LERG ping error:', pingError);
        return false;
      }
      return data?.status === 'ok';
    } catch (err) {
      console.error('LERG ping error:', err);
      return false;
    }
  };

  const updateStoreData = async () => {
    try {
      const { stateMapping, countryData, count } = await lergService.getProcessedData();
      const { lastUpdated } = await lergService.getLastUpdatedTimestamp();

      lergStore.setStateNPAs(stateMapping);
      lergStore.setCountryData(countryData);
      lergStore.setLergStats(count, lastUpdated);
      lergStore.setLergLocallyStored(true);
      isInitialized.value = true;
    } catch (err) {
      console.error('Store update error:', err);
      error.value = err instanceof Error ? err.message : 'Failed to update store data';
      throw err;
    }
  };

  return {
    uploadLerg,
    downloadLerg,
    clearLerg,
    getProcessed,
    getAll,
    ping,
    isLoading,
    error,
    isInitialized,
    isEdgeFunctionAvailable,
    checkEdgeFunctionStatus,
  };
}
