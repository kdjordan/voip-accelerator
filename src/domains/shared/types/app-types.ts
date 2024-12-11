import type { AZStandardizedData, AzPricingReport, AzCodeReport } from '@/domains/az/types/az-types';
import type { USStandardizedData, USPricingReport, USCodeReport } from '@/domains/npanxx/types/npanxx-types';

export interface DomainStore<P = AzPricingReport | USPricingReport, C = AzCodeReport | USCodeReport> {
  isComponentUploading: (componentName: string) => boolean;
  setComponentUploading: (componentName: string, isUploading: boolean) => void;
  checkFileNameAvailable: (fileName: string) => boolean;
  setComponentFileIsUploading: (componentName: string) => void;
  getStoreNameByComponent: (componentName: string) => string;
  addFileUploaded: (componentName: string, fileName: string) => void;
  removeFile: (fileName: string) => void;
  isComponentDisabled: (componentName: string) => boolean;
  getActiveReportType: () => ReportType;
  getPricingReport: () => P | null;
  getCodeReport: () => C | null;
  reportsGenerated: boolean;
  showUploadComponents: boolean;
  isFull: boolean;
  getFileNames: string[];
  setReports: (pricing: any, code: any) => void;
}


export interface FileEmit {
  file: File;
  data: StandardizedData[];
}

export interface ParsedResults {
  data: string[][];
}

// Union type of all possible standardized data types
export type StandardizedData = AZStandardizedData | USStandardizedData;

export interface DataTransformer<T> {
  transform(row: Record<string, string>, columnRoles: string[]): T;
  validate(data: T): boolean;
}

export interface BaseStandardizedData {
  id?: number;
}

// Replace enum with const map for better type safety
export const DBName = {
  AZ: 'az',
  US: 'us',
  CAN: 'can',
  USCodes: 'uscodes',
} as const;

export type DBNameType = typeof DBName[keyof typeof DBName];

// Add shared report types
export const ReportTypes = {
  FILES: 'files',
  CODE: 'code',
  PRICING: 'pricing',
} as const;

export type ReportType = typeof ReportTypes[keyof typeof ReportTypes];


// Add this interface
export interface ColumnRoleOption {
  value: string;
  label: string;
}
