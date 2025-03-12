export interface RateSheetRecord {
  name: string;
  prefix: string;
  rate: number;
  effective: string;
  changeCode: ChangeCodeType;
  minDuration?: number;
  increments?: number;
}

export const ChangeCode = {
  SAME: 'SAME',
  INCREASE: 'INCREASE',
  DECREASE: 'DECREASE'
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
}

export interface RateSheetState {
  error: string | null;
  isProcessing: boolean;
  isLocallyStored: boolean;
  groupedData: GroupedRateData[];
  originalData: RateSheetRecord[];
  hasMinDuration: boolean;
  hasIncrements: boolean;
  invalidRows: InvalidRow[];
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

export const RF_COLUMN_ROLE_OPTIONS_NEW = {
  name: { label: 'Destination Name', required: true },
  prefix: { label: 'Prefix', required: true },
  rate: { label: 'Rate', required: true },
  minDuration: { label: 'Min Duration', required: false },
  increments: { label: 'Increments', required: false },
} as const;
