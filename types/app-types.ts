export interface State {
  globalDBVersion: number;
  filesUploaded: UploadedFileTracker;
  globalFileIsUploading: boolean;
  componentFileIsUploading: string | undefined; // Allow string or undefined
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

export interface RateComparison {
  dialCode: number;
  destName: string;
  rateFile1: number;
  rateFile2: number;
  percentageDifference: number;
}
export interface ConsolidatedData {
  destName: string;
  rateFile1: number;
  rateFile2: number;
  dialCode: string;
  percentageDifference: number;
}

export interface ComparisonReport {
  higherRatesForFile1: ConsolidatedData[];
  higherRatesForFile2: ConsolidatedData[];
  sameRates: ConsolidatedData[];
  nonMatchingCodes: NonMatchingCode[];
}


export interface NonMatchingCode {
  dialCode: number;
  destName: string;
  rate: number;
  file: 'file1' | 'file2';
}

export type FileUpload = {
  dbName: string;
  fileName: string;
};

export type UploadedFileTracker = Map<string, FileUpload>;