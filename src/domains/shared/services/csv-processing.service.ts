import { BaseService, CSVProcessingResult, CSVProcessingOptions } from '../types/services';

export interface CSVProcessingService extends BaseService {
  processFile<T>(file: File, options: CSVProcessingOptions): Promise<CSVProcessingResult<T>>;
  validateHeaders(headers: string[], expectedHeaders: string[]): string[];
  processChunk<T>(chunk: string, schema: unknown): T[];
} 