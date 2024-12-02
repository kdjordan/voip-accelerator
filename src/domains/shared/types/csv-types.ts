export interface CSVProcessingConfig {
    startLine: number;
    columnMapping: Record<string, string>;
    validation?: (row: any) => boolean;
  }
  
  export interface StandardizedData {
    dialCode: string;
    destName: string;
    rate: number;
  }