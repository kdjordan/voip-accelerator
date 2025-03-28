export const AZ_DB_CONFIG = {
  version: 1,
  schema: '++id, destName, dialCode, rate',
} as const;

export interface AZStandardizedData {
  id?: number;
  destName: string;
  dialCode: string;
  rate: number;
}

export interface AZReportsInput {
  fileName1: string;
  fileName2: string;
  file1Data: AZStandardizedData[];
  file2Data: AZStandardizedData[];
}

export interface AzPricingReport {
  higherRatesForFile1: ConsolidatedData[];
  higherRatesForFile2: ConsolidatedData[];
  sameRates: ConsolidatedData[];
  nonMatchingCodes: NonMatchingCode[];
  fileName1: string;
  fileName2: string;
}

export interface AzCodeReport {
  file1: {
    fileName: string;
    totalCodes: number;
    totalDestinations: number;
    uniqueDestinationsPercentage: number;
  };
  file2: {
    fileName: string;
    totalCodes: number;
    totalDestinations: number;
    uniqueDestinationsPercentage: number;
  };
  matchedCodes: number;
  nonMatchedCodes: number;
  matchedCodesPercentage: number;
  nonMatchedCodesPercentage: number;
}

export interface ConsolidatedData {
  dialCode: string;
  destName: string;
  rateFile1: number;
  rateFile2: number;
  percentageDifference: number;
}

export interface NonMatchingCode {
  dialCode: string;
  destName: string;
  rate: number;
  file: string;
}

export interface AZCSVRow {
  [key: string]: string;
}

export interface AZParseError {
  message: string;
  row?: number;
  type: string;
}

export interface AZParseResult {
  data: AZCSVRow[];
  errors: AZParseError[];
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };
}

export interface ColumnRoleOption {
  value: AZColumnRole;
  label: string;
}

export const AZColumnRole = {
  DESTINATION: 'destName',
  DIALCODE: 'dialCode',
  RATE: 'rate',
  SELECT: '', // For "Select Column Role" option
} as const;

export type AZColumnRole = (typeof AZColumnRole)[keyof typeof AZColumnRole];

export const AZ_COLUMN_ROLE_OPTIONS: ColumnRoleOption[] = [
  { value: AZColumnRole.DESTINATION, label: 'Destination Name' },
  { value: AZColumnRole.DIALCODE, label: 'Dial Code' },
  { value: AZColumnRole.RATE, label: 'Rate' },
];

// For storing invalid rows in the store
export interface InvalidAzRow {
  rowIndex: number;
  destName: string;
  dialCode: string;
  invalidRate: string;
  reason: string;
}

// Code Report Types
export interface AzCodeReportFileInfo {
  fileName: string;
  totalCodes: number;
  totalDestinations: number;
  uniqueDestinationsPercentage: number;
}

export interface AzCodeReport {
  file1: AzCodeReportFileInfo;
  file2: AzCodeReportFileInfo;
  matchedCodes: number;
  nonMatchedCodes: number;
  matchedCodesPercentage: number;
  nonMatchedCodesPercentage: number;
}

// Pricing Report Types
export interface RateComparison {
  destName: string;
  dialCode: string;
  rateFile1: number;
  rateFile2: number;
  percentageDifference: number;
}

export interface NonMatchingCode {
  destName: string;
  dialCode: string;
  file: string;
}

export interface AzPricingReport {
  fileName1: string;
  fileName2: string;
  higherRatesForFile1: RateComparison[];
  higherRatesForFile2: RateComparison[];
  sameRates: RateComparison[];
  nonMatchingCodes: NonMatchingCode[];
}
