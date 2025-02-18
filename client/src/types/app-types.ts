import type { AZStandardizedData, AzPricingReport, AzCodeReport } from '@/types/az-types';
import type { USStandardizedData, USPricingReport, USCodeReport } from '@/types/us-types';
import type { AZJourneyState } from '@/constants/az-messages';

// Add this type definition
export type DomainStoreType = DomainStore<AzPricingReport, AzCodeReport> | DomainStore<USPricingReport, USCodeReport>;

export interface DomainStore<P = AzPricingReport | USPricingReport, C = AzCodeReport | USCodeReport> {
  // State properties
  reportsGenerated: boolean;
  showUploadComponents: boolean;
  activeReportType: ReportType;

  // Getters
  isComponentDisabled: (componentName: string) => boolean;
  isComponentUploading: (componentName: string) => boolean;
  isFull: boolean;
  getFileNames: string[];
  getActiveReportType: ReportType;
  getPricingReport: P | null;
  getCodeReport: C | null;
  getFileNameByComponent: (componentId: string) => string;
  hasExistingFile: (fileName: string) => boolean;

  // Add temp file methods
  setTempFile: (componentId: string, file: File) => void;
  getTempFile: (componentId: string) => File | undefined;
  clearTempFile: (componentId: string) => void;

  // Actions
  setComponentUploading: (componentName: string, isUploading: boolean) => void;
  addFileUploaded: (componentName: string, fileName: string) => void;
  removeFile: (fileName: string) => void;
  setReports: (pricing: P, code: C) => void;
  setActiveReportType: (type: ReportType) => void;
  checkFileNameAvailable: (fileName: string) => boolean;
  setComponentFileIsUploading: (componentName: string) => void;
  getStoreNameByComponent: (componentName: string) => string;
  resetFiles: () => void;

  // Add the journey state getter
  getJourneyState: AZJourneyState;
}

// Union type of all possible standardized data types
export type StandardizedData = AZStandardizedData | USStandardizedData;

// Replace enum with const map for better type safety
export const DBName = {
  AZ: 'az',
  US: 'us',
  LERG: 'lerg',
  RATE_SHEET: 'rate_sheet',
} as const;

export type DBNameType = (typeof DBName)[keyof typeof DBName];

// Add shared report types
export const ReportTypes = {
  FILES: 'files',
  CODE: 'code',
  PRICING: 'pricing',
} as const;

export type ReportType = (typeof ReportTypes)[keyof typeof ReportTypes];

// Define supported DB types for schemas
export type SchemaDBType = typeof DBName.AZ | typeof DBName.US | typeof DBName.RATE_SHEET;

export const DBSchemas = {
  [DBName.AZ]: '++id, destName, dialCode, rate',
  [DBName.US]: '++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, *npanxxIdx',
  [DBName.RATE_SHEET]: '++id, destinationName, code, rate, effectiveDate, minDuration, increments',
} as const;

// Type guard to check if a DBNameType is supported for schemas
export function isSchemaSupported(dbName: DBNameType): dbName is SchemaDBType {
  return dbName === DBName.AZ || dbName === DBName.US || dbName === DBName.RATE_SHEET;
}
