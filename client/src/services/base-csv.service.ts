import type { CSVProcessingConfig, StandardizedData } from '@/types';

export interface CSVService<T extends StandardizedData> {
  process(file: File, config: CSVProcessingConfig): Promise<T[]>;
  validate(data: T[]): boolean;
  validateHeaders(headers: string[], expectedHeaders: string[]): string[];
  processChunk(chunk: string[], columnMapping: Record<string, string>): T;
}

export function createBaseCSVService<T extends StandardizedData>(): CSVService<T> {
  return {
    async process(file: File, config: CSVProcessingConfig): Promise<T[]> {
      const text = await file.text();
      const lines = text.split('\n').slice(config.startLine);
      const data: T[] = [];

      for (const line of lines) {
        if (line.trim()) {
          const values = line.split(',').map(value => value.trim());
          const processed = this.processChunk(values, config.columnMapping);
          data.push(processed);
        }
      }

      return data;
    },

    validate(data: T[]): boolean {
      return Array.isArray(data) && data.length > 0;
    },

    validateHeaders(headers: string[], expectedHeaders: string[]): string[] {
      return headers.filter(header => expectedHeaders.includes(header));
    },

    processChunk(chunk: string[], columnMapping: Record<string, string>): T {
      throw new Error('processChunk must be implemented by derived service');
    },
  };
}
