import { ref, Ref } from 'vue';
import { useTableData, UseTableDataConfig, UseTableDataReturn } from './useTableData';
import type { AZDetailedComparisonEntry } from '@/types/domains/az-types';
import type { RateSheetRecord, AZFlatRateEntry } from '@/types/domains/rate-sheet-types';

// Define AZ-specific record types
export type AZTableRecord = AZDetailedComparisonEntry | RateSheetRecord | AZFlatRateEntry;

// Extended configuration for AZ tables
export interface UseAZTableDataConfig<T> extends UseTableDataConfig<T> {
  // Add any AZ-specific config options here in the future
  // For now, this is a simple wrapper to maintain consistency with US tables
}

// Extended return type for AZ tables
export interface UseAZTableDataReturn<T> extends UseTableDataReturn<T> {
  // Add any AZ-specific reactive properties or methods here in the future
  // For now, this extends the base return type without additional functionality
}

export function useAZTableData<T extends AZTableRecord>(
  config: UseAZTableDataConfig<T>
): UseAZTableDataReturn<T> {
  // Get base functionality from useTableData
  const baseTableData = useTableData<T>(config);

  // Add A-Z specific logic here if needed in the future
  // For now, this is a thin wrapper that allows for future expansion

  return {
    ...baseTableData,
    // Spread any additional A-Z specific returns here when needed
  };
}
