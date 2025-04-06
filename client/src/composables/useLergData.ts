import { ref } from 'vue';
import { supabase } from '@/utils/supabase';
import { useLergStore } from '@/stores/lerg-store';
import { getLergService } from '@/services/dexie/db';
import type {
  LERGRecord,
  StateNPAMapping,
  CountryLergData,
  NPAEntry,
  USStateNPAMap,
  CanadaProvinceNPAMap,
  CountryNPAMap,
} from '@/types/domains/lerg-types';
import Papa from 'papaparse';

interface CSVRow {
  NPA?: string;
  State?: string;
  Country?: string;
  [key: string]: string | undefined;
}

export function useLergData() {
  // Get the LERG Dexie service
  const lergService = getLergService();
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

          // Extract the last_updated timestamp from the first record
          const lastUpdated = lergData.data[0]?.last_updated
            ? new Date(lergData.data[0].last_updated)
            : new Date();

          console.log('Last updated from server:', lastUpdated);

          // Set each record's last_updated field
          const recordsWithTimestamp = lergData.data.map((record: LERGRecord) => ({
            ...record,
            last_updated: lastUpdated,
          }));

          // Use the Dexie service to initialize the table
          await lergService.initializeTable(recordsWithTimestamp);
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

        // Extract the last_updated timestamp from the first record or use current date
        const lastUpdated = lergData.data[0]?.last_updated
          ? new Date(lergData.data[0].last_updated)
          : new Date();

        console.log('Last updated from server:', lastUpdated);

        // Set each record's last_updated field
        const recordsWithTimestamp = lergData.data.map((record: LERGRecord) => ({
          ...record,
          last_updated: lastUpdated,
        }));

        // Use the Dexie service to initialize the table
        await lergService.initializeTable(recordsWithTimestamp);
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
        // Use the Dexie service to initialize the table
        await lergService.initializeTable(data.data);
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

      // First check if edge function is available
      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available');
      }

      // Call edge function to clear data from Supabase
      console.log('Calling clear-lerg edge function to clear Supabase data');
      const { data: clearData, error: clearError } = await supabase.functions.invoke('clear-lerg');

      if (clearError) {
        console.error('Error clearing LERG data from Supabase:', clearError);
        throw clearError;
      }

      // Clear the store
      lergStore.clearLergData();

      // Clear IndexedDB using our Dexie service
      await lergService.clear();

      return { success: true };
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

      // Retrieve data directly from the database using our services
      const stateMapping: StateNPAMapping = {};
      const countryData: CountryLergData[] = [];

      // Get all LERG records from the database
      const allRecords = await lergService.getAll();
      const count = allRecords.length;

      // Process US records
      const usRecords = await lergService.getByCountry('US');

      // Group by state
      for (const record of usRecords) {
        if (!stateMapping[record.state]) {
          stateMapping[record.state] = [];
        }
        stateMapping[record.state].push(record.npa);
      }

      // Process Canadian records
      const caRecords = await lergService.getByCountry('CA');

      // Group by province
      const caProvinceMap: Record<string, string[]> = {};
      for (const record of caRecords) {
        if (!caProvinceMap[record.state]) {
          caProvinceMap[record.state] = [];
        }
        caProvinceMap[record.state].push(record.npa);

        // Also add to state mapping
        if (!stateMapping[record.state]) {
          stateMapping[record.state] = [];
        }
        stateMapping[record.state].push(record.npa);
      }

      // Add US data to countryData
      if (usRecords.length > 0) {
        countryData.push({
          country: 'US',
          npaCount: usRecords.length,
          npas: usRecords.map((r) => r.npa).sort(),
        });
      }

      // Add CA data to countryData
      if (caRecords.length > 0) {
        countryData.push({
          country: 'CA',
          npaCount: caRecords.length,
          npas: caRecords.map((r) => r.npa).sort(),
          provinces: Object.entries(caProvinceMap).map(([code, npas]) => ({
            code,
            npas: npas.sort(),
          })),
        });
      }

      // Process other countries
      const countries = [
        ...new Set(
          allRecords.filter((r) => r.country !== 'US' && r.country !== 'CA').map((r) => r.country)
        ),
      ];

      // Add each country's data
      for (const country of countries) {
        const records = await lergService.getByCountry(country);
        countryData.push({
          country,
          npaCount: records.length,
          npas: records.map((r) => r.npa).sort(),
        });
      }

      return {
        stateMapping,
        countryData,
        count,
      };
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

      // Use our Dexie service to get all records
      const data = await lergService.getAll();
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
      // Get processed data from the LERG database using our service
      const { stateMapping, countryData, count } = await getProcessed();

      // Get the last updated timestamp
      const { lastUpdated } = await lergService.getLastUpdatedTimestamp();

      console.log('Last updated timestamp from service:', lastUpdated);

      // Convert stateMapping to USStateNPAMap for US states
      const usStates = new Map<string, NPAEntry[]>();
      const canadaProvinces = new Map<string, NPAEntry[]>();
      const otherCountries = new Map<string, NPAEntry[]>();

      // DEBUG: Log the stateMapping to see Canadian provinces
      console.log('[LERG Debug] stateMapping keys:', Object.keys(stateMapping));

      // Filter and log just Canadian provinces from stateMapping
      const potentialCanadianProvinces = Object.entries(stateMapping).filter(([stateCode]) =>
        lergService.isCanadianProvince(stateCode)
      );

      console.log('[LERG Debug] Potential Canadian provinces:', potentialCanadianProvinces);

      // Process state mappings for US and Canadian provinces
      Object.entries(stateMapping).forEach(([stateCode, npas]) => {
        if (stateCode.length === 2) {
          const npasWithMeta: NPAEntry[] = npas.map((npa) => ({ npa }));

          if (lergService.isUSState(stateCode)) {
            usStates.set(stateCode, npasWithMeta);
          } else if (lergService.isCanadianProvince(stateCode)) {
            console.log(
              `[LERG Debug] Setting Canadian province ${stateCode} with ${npas.length} NPAs`
            );
            canadaProvinces.set(stateCode, npasWithMeta);
          }
        }
      });

      // DEBUG: Log counts after processing
      console.log(
        `[LERG Debug] US States: ${usStates.size}, Canadian Provinces: ${canadaProvinces.size}`
      );
      console.log('[LERG Debug] Canadian Provinces Map:', Array.from(canadaProvinces.entries()));

      // Process country data for other countries
      countryData
        .filter((country) => country.country !== 'US' && country.country !== 'CA')
        .forEach((country) => {
          otherCountries.set(
            country.country,
            country.npas.map((npa) => ({ npa }))
          );
        });

      // Set data in the store using new methods
      lergStore.setUSStates(usStates);
      lergStore.setCanadaProvinces(canadaProvinces);
      lergStore.setOtherCountries(otherCountries);

      // Update timestamp (now in stats) and status
      lergStore.setLastUpdated(lastUpdated ? new Date(lastUpdated) : null);
      lergStore.setProcessing(false);
      lergStore.setLoaded(true);
      lergStore.updateStats();

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
