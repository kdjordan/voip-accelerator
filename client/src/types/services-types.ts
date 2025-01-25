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

export interface CSVProcessingService extends BaseService {
  processFile<T>(file: File, options: CSVProcessingOptions): Promise<CSVProcessingResult<T>>;
  validateHeaders(headers: string[], expectedHeaders: string[]): string[];
  processChunk<T>(chunk: string, schema: unknown): T[];
}

// Other service interfaces...
