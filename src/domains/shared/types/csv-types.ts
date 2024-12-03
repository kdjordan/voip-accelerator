export interface CSVProcessingConfig {
    startLine: number;
    columnMapping: Record<string, string>;
    validation?: (row: any) => boolean;
  }
  