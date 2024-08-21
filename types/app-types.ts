export enum AZColumnRole {
  Destination = 'destName',
  DialCode = 'dialCode',
  Rate = 'rate',
  SelectRole = '' // This will represent our "Select Column Role" option
}

export enum DBName {
  AZ = 'AZ',
  US = 'US',
  CAN = 'CAN'
}


export interface State {
  globalDBVersion: number;
  filesUploaded: UploadedFileTracker;
  globalFileIsUploading: boolean;
  componentFileIsUploading: string | undefined; // Allow string or undefined
}

export interface PricingReportInput {
  fileName1: string;
  fileName2: string;
  file1Data: StandardizedData[]; 
  file2Data: StandardizedData[]; 
}

export interface StandardizedData {
  destName: string;
  dialCode: number;
  rate: number;
  [key: string]: string | number; // Allow additional properties
}

export interface FileEmit {
  file: File;
  data: StandardizedData[];
}

export interface ParsedResults {
  data: string[][];
}

export interface ConsolidatedData {
  dialCode: string;
  destName: string;
  rateFile1: number;
  rateFile2: number;
  percentageDifference: number;
}


export interface ComparisonReport {
  higherRatesForFile1: ConsolidatedData[];
  higherRatesForFile2: ConsolidatedData[];
  sameRates: ConsolidatedData[];
  nonMatchingCodes: NonMatchingCode[];
  fileName1: string;
  fileName2: string;
}


export interface NonMatchingCode {
  dialCode: string;
  destName: string;
  rate: number;
  file: string;
}

export type FileUpload = {
  dbName: string;
  fileName: string;
};

export type UploadedFileTracker = Map<string, FileUpload>;