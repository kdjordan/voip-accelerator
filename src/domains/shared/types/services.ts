export interface BaseService {
  initialize(): Promise<void>;
}

export interface CSVProcessingResult<T> {
  data: T[];
  errors: string[];
  warnings: string[];
}

export interface CSVProcessingOptions {
  hasHeaders: boolean;
  delimiter?: string;
  encoding?: string;
  chunkSize?: number;
} 