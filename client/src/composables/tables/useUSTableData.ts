import { ref, Ref } from 'vue';
import {
  useTableData,
  UseTableDataConfig,
  UseTableDataReturn,
} from './useTableData';
import { sortRegionCodesByName } from '@/types/constants/region-codes';
import type { USRateSheetEntry } from '@/types/domains/rate-sheet-types';
import type { USPricingComparisonRecord } from '@/types/domains/us-types';

// Extended configuration for US tables
export interface UseUSTableDataConfig<T> extends UseTableDataConfig<T> {
  stateCodeField?: keyof T; // The field name that contains state code
}

// Extended return type for US tables
export interface UseUSTableDataReturn<T> extends UseTableDataReturn<T> {
  availableStates: Ref<string[]>;
  fetchUniqueStates: () => Promise<void>;
  fetchUniqueStatesFromData: () => Promise<void>;
}

export function useUSTableData<T extends USRateSheetEntry | USPricingComparisonRecord>(
  config: UseUSTableDataConfig<T>
): UseUSTableDataReturn<T> {
  const { stateCodeField = 'stateCode' as keyof T, ...baseConfig } = config;

  // Get base functionality from useTableData
  const baseTableData = useTableData<T>(baseConfig);

  // Additional state for US-specific features
  const availableStates = ref<string[]>([]);

  // Fetch unique states/provinces/countries from LERG store
  async function fetchUniqueStates() {
    try {
      // Import LERG store dynamically to avoid circular dependencies
      const { useLergStoreV2 } = await import('@/stores/lerg-store-v2');
      const lergStore = useLergStoreV2();

      // Ensure LERG data is loaded
      if (!lergStore.isInitialized) {
        await lergStore.loadFromSupabase();
      }

      const regionCodes: string[] = [];

      // Add US states
      lergStore.getUSStates.forEach(state => {
        regionCodes.push(state.code);
      });

      // Add Canadian provinces
      lergStore.getCanadianProvinces.forEach(province => {
        regionCodes.push(province.code);
      });

      // Add other countries
      lergStore.getDistinctCountries.forEach(country => {
        regionCodes.push(country.code);
      });

      // Filter out invalid codes and sort
      const validCodes = regionCodes.filter(code => {
        // Exclude common invalid/placeholder codes
        const invalidCodes = ['NN', 'N/A', 'NA', 'XX', 'UNK', 'UNKNOWN', ''];
        return !invalidCodes.includes(code.toUpperCase());
      });
      
      availableStates.value = sortRegionCodesByName(validCodes);
    } catch (err: any) {
      availableStates.value = [];
      baseTableData.dataError.value = 'Could not load state/province/country filter options.';
    }
  }

  // Fetch unique states/provinces/countries from actual uploaded data
  async function fetchUniqueStatesFromData() {
    try {
      // Initialize database if not already done
      if (!baseTableData.dbInstance.value) {
        console.log('[useUSTableData] Database not initialized, initializing now...');
        await baseTableData.initializeDB();
        
        // Check again after initialization
        if (!baseTableData.dbInstance.value) {
          console.warn('[useUSTableData] Failed to initialize database');
          availableStates.value = [];
          return;
        }
      }

      // Import LERG store dynamically to avoid circular dependencies
      const { useLergStoreV2 } = await import('@/stores/lerg-store-v2');
      const lergStore = useLergStoreV2();

      // Ensure LERG data is loaded for NPA lookups
      if (!lergStore.isInitialized) {
        await lergStore.loadFromSupabase();
      }

      // Get unique NPAs from the table more efficiently
      const table = baseTableData.dbInstance.value.table<T>(baseConfig.tableName);
      
      // Check if table has any records
      const recordCount = await table.count();
      if (recordCount === 0) {
        console.log('[useUSTableData] No records found in database');
        availableStates.value = [];
        return;
      }

      // Extract unique NPAs using a more efficient approach
      const uniqueNPAs = new Set<string>();
      
      try {
        // Try to use orderBy for better performance if 'npa' is indexed
        await table.orderBy('npa').each(record => {
          const npa = (record as any).npa;
          if (npa && typeof npa === 'string') {
            uniqueNPAs.add(npa);
          }
        });
      } catch (indexError) {
        // Fallback to regular iteration if 'npa' is not indexed
        console.log('[useUSTableData] NPA field not indexed, using fallback method');
        await table.each(record => {
          const npa = (record as any).npa;
          if (npa && typeof npa === 'string') {
            uniqueNPAs.add(npa);
          }
        });
      }

      console.log(`[useUSTableData] Found ${uniqueNPAs.size} unique NPAs in uploaded data`);

      // Get state/province codes from LERG for these NPAs
      const regionCodes = new Set<string>();
      
      uniqueNPAs.forEach(npa => {
        const npaInfo = lergStore.getNPAInfo(npa);
        if (npaInfo?.state_province_code) {
          regionCodes.add(npaInfo.state_province_code);
        }
      });

      console.log(`[useUSTableData] Found ${regionCodes.size} unique state/province codes`);

      // Filter out invalid codes
      const validCodes = Array.from(regionCodes).filter(code => {
        const invalidCodes = ['NN', 'N/A', 'NA', 'XX', 'UNK', 'UNKNOWN', ''];
        return !invalidCodes.includes(code.toUpperCase());
      });

      // Sort the codes by their display names
      availableStates.value = sortRegionCodesByName(validCodes);
      
      console.log(`[useUSTableData] Available states populated with ${availableStates.value.length} regions from uploaded data`);
    } catch (err: any) {
      console.error('[useUSTableData] Error fetching unique states from data:', err);
      console.log('[useUSTableData] Falling back to all states from LERG');
      
      // Fallback to showing all states if there's an error
      await fetchUniqueStates();
    }
  }

  return {
    ...baseTableData,
    availableStates,
    fetchUniqueStates,
    fetchUniqueStatesFromData,
  };
}
