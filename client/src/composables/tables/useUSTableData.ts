import { ref, Ref } from 'vue';
import {
  useTableData,
  UseTableDataConfig,
  UseTableDataReturn,
  FilterFunction,
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

  // Fetch unique states from the database
  async function fetchUniqueStates() {
    if (!baseTableData.dbInstance.value) {
      await baseTableData.initializeDB();
    }

    if (!baseTableData.dbInstance.value) {
      availableStates.value = [];
      return;
    }

    try {
      const uniqueRegionCodes = (await baseTableData.dbInstance.value
        .table<T>(config.tableName)
        .orderBy(stateCodeField as string)
        .uniqueKeys()) as string[];

      // Use the utility function for sorting
      availableStates.value = sortRegionCodesByName(
        uniqueRegionCodes.filter(Boolean) // Remove null/undefined/empty strings
      );
    } catch (err: any) {
      availableStates.value = [];
      baseTableData.dataError.value = 'Could not load state/province filter options.';
    }
  }

  return {
    ...baseTableData,
    availableStates,
    fetchUniqueStates,
  };
}
