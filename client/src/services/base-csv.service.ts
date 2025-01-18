import type { CSVProcessingConfig } from '../types/csv-types';

export interface CSVProcessor<T> {
  process(file: File, config: CSVProcessingConfig): Promise<T[]>;
  validate(data: T[]): boolean;
}

export function createBaseCSVService<T>(): CSVProcessor<T> {
  return {
    async process(file: File, config: CSVProcessingConfig): Promise<T[]> {
      // Implementation
      throw new Error('Not implemented');
    },

    validate(data: T[]): boolean {
      // Implementation
      throw new Error('Not implemented');
    },
  };
}
