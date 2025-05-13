import { ref } from 'vue';
import { supabase } from '@/utils/supabase';
import { useLergStore } from '@/stores/lerg-store';
import { LergService, LergDataError } from '@/services/lerg.service';
import type {
  LERGRecord,
  StateNPAMapping,
  CountryLergData,
  NPAEntry,
} from '@/types/domains/lerg-types';
import Papa from 'papaparse';
import { FunctionsHttpError } from '@supabase/functions-js';

export function useLergData() {
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
    isLoading.value = true;
    error.value = null;

    try {
      if (lergStore.stats?.totalNPAs > 0 && isInitialized.value) {
        isLoading.value = false;
        isInitializing.value = false;
        return;
      }

      await checkEdgeFunctionStatus();

      if (isEdgeFunctionAvailable.value) {
        await uploadLerg(null);
        isInitialized.value = true;
      } else {
        console.warn(
          '[useLergData] Edge functions are not available for LERG data initialization.'
        );
        throw new Error('Edge functions are not available for LERG data initialization.');
      }
    } catch (err) {
      console.error('[useLergData] Error during LERG data initialization:', err);
      error.value = err instanceof Error ? err.message : 'Failed to initialize LERG service';
      isInitialized.value = false;
    } finally {
      isInitializing.value = false;
      isLoading.value = false;
    }
  };

  const uploadLerg = async (
    file: File | null,
    options?: { mappings?: Record<string, string>; startLine?: number }
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const isAvailable = await checkEdgeFunctionStatus();
      if (!isAvailable) {
        throw new Error('Edge functions are not available');
      }

      if (!file) {
        const { data: pingData, error: pingError } = await supabase.functions.invoke('ping-status');
        if (pingError) throw new Error(pingError.message);

        if (!pingData?.hasLergTable) {
          await lergService.clearLergData();
          await updateStoreData();
          return null;
        }

        const { data: lergData, error: lergError } =
          await supabase.functions.invoke('get-lerg-data');
        if (lergError) throw new Error(lergError.message);

        if (lergData?.data?.length > 0) {
          const lastUpdated = lergData.data[0]?.last_updated
            ? new Date(lergData.data[0].last_updated)
            : new Date();

          const recordsWithTimestamp = lergData.data.map((record: LERGRecord) => ({
            ...record,
            last_updated: lastUpdated,
          }));

          await lergService.initializeLergTable(recordsWithTimestamp);

          await updateStoreData();
        } else {
          console.warn('[useLergData] No LERG data found in Supabase. Clearing local data.');
          await lergService.clearLergData();
          await updateStoreData();
        }
        return lergData;
      }

      const fileText = await file.text();

      const { data: csvData, errors } = Papa.parse<string[]>(fileText, {
        header: false,
        skipEmptyLines: true,
        transform: (value) => value.trim(),
      });

      if (errors.length > 0) {
        throw new Error('Failed to parse CSV file: ' + errors[0].message);
      }

      const mappings = options?.mappings || {};

      const npaIndex = Object.entries(mappings).find(
        ([_, val]) => val.toUpperCase() === 'NPA'
      )?.[0];
      const stateIndex = Object.entries(mappings).find(
        ([_, val]) => val.toUpperCase() === 'STATE'
      )?.[0];
      const countryIndex = Object.entries(mappings).find(
        ([_, val]) => val.toUpperCase() === 'COUNTRY'
      )?.[0];

      if (npaIndex === undefined || stateIndex === undefined || countryIndex === undefined) {
        throw new Error('Required mappings (NPA, State, Country) not found');
      }

      const startLine = options?.startLine || 0;
      const dataRows = startLine > 0 ? csvData.slice(startLine) : csvData;

      const uniqueRecords = new Map<string, LERGRecord>();

      for (const row of dataRows) {
        const npa = row[parseInt(npaIndex)]?.trim();
        const state = row[parseInt(stateIndex)]?.trim();
        const country = row[parseInt(countryIndex)]?.trim();

        if (npa && state && country) {
          if (!/^[0-9]{3}$/.test(npa)) {
            console.warn(`Skipping row with invalid NPA: ${npa}`);
            continue;
          }
          if (state.length !== 2) {
            console.warn(`Skipping row with invalid State: ${state} (NPA: ${npa})`);
            continue;
          }
          if (country.length !== 2) {
            console.warn(`Skipping row with invalid Country: ${country} (NPA: ${npa})`);
            continue;
          }

          if (!uniqueRecords.has(npa)) {
            uniqueRecords.set(npa, {
              npa,
              state,
              country,
            });
          } else {
            console.warn(`Duplicate NPA found in file, keeping first occurrence: ${npa}`);
          }
        }
      }

      const records = Array.from(uniqueRecords.values());
      console.log(`Processed ${records.length} unique valid records from file.`);

      console.log('Sending records to upload-lerg function...');
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'upload-lerg',
        {
          body: { records },
        }
      );

      if (uploadError) throw uploadError;
      if (!uploadData) throw new Error('No response data from upload function');
      console.log('upload-lerg function successful:', uploadData);

      console.log('File upload successful. Triggering full data refresh...');
      await initializeLergData();

      return uploadData;
    } catch (err) {
      console.error('Error in uploadLerg:', err);
      error.value = err instanceof Error ? err.message : 'Failed to upload/process LERG data';
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
        const lastUpdated = data.data[0]?.last_updated
          ? new Date(data.data[0].last_updated)
          : new Date();
        const recordsWithTimestamp = data.data.map((record: LERGRecord) => ({
          ...record,
          last_updated: lastUpdated,
        }));
        await lergService.initializeLergTable(recordsWithTimestamp);
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
        throw new Error('Edge functions are not available for clearing LERG data');
      }

      const { error: clearError } = await supabase.functions.invoke('clear-lerg');
      if (clearError) throw new Error(clearError.message);

      await lergService.clearLergData();
      console.log('Cleared LERG data locally and remotely.');

      await updateStoreData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear LERG data';
    } finally {
      isLoading.value = false;
    }
  };

  const getProcessed = async (): Promise<{
    stateMapping: StateNPAMapping;
    canadaProvinces: Record<string, Set<string>>;
    countryData: CountryLergData[];
    count: number;
  } | null> => {
    try {
      const result = await lergService.getProcessedData();
      if (!result || typeof result.canadaProvinces === 'undefined') {
        throw new Error('Processed data from service is missing expected properties.');
      }
      return result;
    } catch (err) {
      console.error('Error getting processed LERG data:', err);
      error.value = err instanceof Error ? err.message : 'Failed to get processed data';
      return null;
    }
  };

  const getAll = async (): Promise<LERGRecord[]> => {
    try {
      return await lergService.getAllRecords();
    } catch (err) {
      console.error('Error getting all LERG records:', err);
      error.value = err instanceof Error ? err.message : 'Failed to get all records';
      return [];
    }
  };

  const ping = async () => {
    return checkEdgeFunctionStatus();
  };

  const updateStoreData = async () => {
    console.log('Updating LERG store data...');
    try {
      const processedData = await lergService.getProcessedData();
      if (!processedData) {
        throw new Error('Failed to get processed data for store update.');
      }

      const { stateMapping, canadaProvinces, countryData, count } = processedData;

      const lastUpdatedResult = await lergService.getLastUpdatedTimestamp();

      const usStatesMap = new Map<string, NPAEntry[]>();
      const canadaProvincesMap = new Map<string, NPAEntry[]>();
      const otherCountriesMap = new Map<string, NPAEntry[]>();

      Object.entries(stateMapping)
        .filter(([code]) => lergService.isUSState(code))
        .forEach(([code, npas]) => {
          usStatesMap.set(
            code,
            npas.map((npa: string) => ({ npa }))
          );
        });

      Object.entries(canadaProvinces).forEach(([code, npaSet]) => {
        canadaProvincesMap.set(
          code,
          Array.from(npaSet).map((npa: string) => ({ npa }))
        );
      });

      countryData
        .filter((c) => c.country !== 'US' && c.country !== 'CA')
        .forEach((c) => {
          otherCountriesMap.set(
            c.country,
            c.npas.map((npa: string) => ({ npa }))
          );
        });

      lergStore.setUSStates(usStatesMap);
      lergStore.setCanadaProvinces(canadaProvincesMap);
      lergStore.setOtherCountries(otherCountriesMap);
      lergStore.setLastUpdated(
        lastUpdatedResult.lastUpdated ? new Date(lastUpdatedResult.lastUpdated) : null
      );
      lergStore.updateStats();
      lergStore.setLoaded(count > 0);
      lergStore.setError(null);
      console.log('LERG store updated successfully.');
    } catch (err) {
      console.error('Failed to update LERG store data:', err);
      lergStore.setError(err instanceof Error ? err.message : 'Failed to update store');
      lergStore.clearLergData();
    }
  };

  const addAndRefreshLergRecord = async (record: Pick<LERGRecord, 'npa' | 'state' | 'country'>) => {
    isLoading.value = true;
    error.value = null;
    let didFunctionFail = false;
    try {
      console.log(`Invoking Supabase function add-lerg-record for: ${JSON.stringify(record)}`);
      const { error: functionError } = await supabase.functions.invoke('add-lerg-record', {
        body: record,
      });

      if (functionError) {
        didFunctionFail = true;
        console.error('Supabase function invocation error:', functionError);
        let errorMessage = 'Failed to add LERG record.';
        if (functionError instanceof FunctionsHttpError) {
          try {
            const errorContext = await functionError.context.json();
            errorMessage = errorContext.error || functionError.message;
          } catch (parseError) {
            errorMessage = functionError.message;
          }

          if (functionError.context.status === 409) {
            error.value = errorMessage;
          } else if (functionError.context.status === 400) {
            error.value = `Invalid data: ${errorMessage}`;
          } else {
            error.value = `Error ${functionError.context.status}: ${errorMessage}`;
          }
        } else {
          error.value = functionError.message;
        }
        throw new Error(error.value ?? 'Supabase function invocation failed');
      }

      console.log('Supabase function "add-lerg-record" successful. Triggering refresh...');
      await initializeLergData();
      console.log('LERG data refresh completed after adding single record.');
    } catch (err) {
      console.error('Error in addAndRefreshLergRecord:', err);
      if (!didFunctionFail) {
        error.value =
          err instanceof Error ? err.message : 'An unexpected error occurred during refresh.';
      }
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    isInitialized,
    isEdgeFunctionAvailable,
    isInitializing,
    initializeLergData,
    uploadLerg,
    downloadLerg,
    clearLerg,
    getProcessed,
    getAll,
    checkEdgeFunctionStatus,
    ping,
    addAndRefreshLergRecord,
  };
}
