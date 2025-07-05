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

  return {
    ...baseTableData,
    availableStates,
    fetchUniqueStates,
  };
}
