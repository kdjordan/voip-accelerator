export interface RateSheetRecord {
  name: string;
  prefix: string;
  rate: number;
  effective: string;
  changeCode: ChangeCodeType;
  minDuration?: number;
  increments?: number;
}

// --- US Rate Sheet Adjustment Types ---
export type AdjustmentType = 'markup' | 'markdown' | 'set';
export type AdjustmentValueType = 'percentage' | 'fixed';
export type TargetRateType = 'all' | 'inter' | 'intra' | 'indeterm';

export interface RateAdjustmentSettings {
  adjustmentType: AdjustmentType;
  adjustmentValueType: AdjustmentValueType;
  adjustmentValue: number;
  targetRateType: TargetRateType;
}
// --- End US Rate Sheet Adjustment Types ---

export interface EffectiveDateSettings {
  same: 'today' | 'tomorrow' | 'custom';
  increase: 'today' | 'tomorrow' | 'week' | 'custom';
  decrease: 'today' | 'tomorrow' | 'custom';
  sameCustomDate: string;
  increaseCustomDate: string;
  decreaseCustomDate: string;
}

export interface EffectiveDateStoreSettings {
  same: string;
  increase: string;
  decrease: string;
  sameCustomDate: string;
  increaseCustomDate: string;
  decreaseCustomDate: string;
}

export const ChangeCode = {
  SAME: 'SAME',
  INCREASE: 'INCREASE',
  DECREASE: 'DECREASE',
} as const;

export type ChangeCodeType = (typeof ChangeCode)[keyof typeof ChangeCode];

export interface RateStatistics {
  rate: number;
  count: number;
  percentage: number;
  isCommon: boolean;
}

export interface RateSheetRow {
  name: string;
  prefix: string;
  rate: string;
  effective: string;
  changeCode: string;
  'min duration': string;
  increments: string;
}

export interface GroupedRateData {
  destinationName: string;
  codes: string[];
  rates: RateStatistics[];
  hasDiscrepancy: boolean;
  effectiveDate: string;
  changeCode: ChangeCodeType;
  minDuration?: number;
  increments?: number;
}

export interface InvalidRow {
  destinationName: string;
  prefix: string;
  invalidRate: string;
  rowNumber?: number;
}

export interface RateSheetState {
  error: string | null;
  isProcessing: boolean;
  isLocallyStored: boolean;
  groupedData: GroupedRateData[];
  originalData: RateSheetRecord[];
  invalidRows: InvalidRow[];
  optionalFields: {
    hasMinDuration: boolean;
    hasIncrements: boolean;
  };
  effectiveDateSettings: EffectiveDateStoreSettings;
}

export const RequiredRFColumnRole = {
  NAME: 'name',
  PREFIX: 'prefix',
  RATE: 'rate',
} as const;

export const OptionalRFColumnRole = {
  MIN_DURATION: 'minDuration',
  INCREMENTS: 'increments',
} as const;

export const RFColumnRole = {
  ...RequiredRFColumnRole,
  ...OptionalRFColumnRole,
  SELECT: '',
} as const;

export type RFColumnRole = (typeof RFColumnRole)[keyof typeof RFColumnRole];

export interface RFColumnRoleOption {
  value: RFColumnRole;
  label: string;
  required?: boolean;
}

export const RF_COLUMN_ROLE_OPTIONS: RFColumnRoleOption[] = [
  { value: RFColumnRole.NAME, label: 'Name', required: true },
  { value: RFColumnRole.PREFIX, label: 'Prefix', required: true },
  { value: RFColumnRole.RATE, label: 'Rate', required: true },
  { value: RFColumnRole.MIN_DURATION, label: 'Min Duration' },
  { value: RFColumnRole.INCREMENTS, label: 'Increments' },
];

/**
 * Types for the rate sheet table component
 */
export interface CustomRateModal {
  isOpen: boolean;
  destinationName: string;
  value: string;
}

export type ProcessingPhase = 'idle' | 'preparing' | 'processing' | 'updating' | 'finalizing';

export type FilterStatus =
  | 'all'
  | 'conflicts'
  | 'no-conflicts'
  | 'change-same'
  | 'change-increase'
  | 'change-decrease';

export interface PendingUIUpdates {
  progress?: any;
  error?: any;
  result?: any;
  scheduled?: boolean;
}

/**
 * Rate sheet report state types
 */
export interface ReportSectionState {
  expandedRows: Set<string>;
  expandedSections: {
    buy: boolean;
    sell: boolean;
    same: boolean;
    unmatched: boolean;
  };
  expandedDestinations: {
    buy: Set<string>;
    sell: Set<string>;
    same: Set<string>;
    unmatched: Set<string>;
  };
  searchQuery: string;
  sortBy: string;
}

export interface InvalidRowsState {
  expandedInvalidSections: Record<string, boolean>;
  expandedDestinations: Record<string, Set<string>>;
}

export type FileKey = 'file1' | 'file2';

/**
 * Types for the US Rate Sheet entries
 */
// Specific fields for a US Rate Sheet Entry
export interface USRateSheetEntry {
  id?: number; // Primary key added by Dexie
  npa: string;
  nxx: string;
  npanxx: string;
  stateCode: string; // Add stateCode
  interRate: number | null;
  intraRate: number | null;
  indetermRate: number | null; // Keep indetermRate as requested
}
