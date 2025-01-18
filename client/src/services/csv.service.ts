import type { CSVProcessingConfig } from '../types';

export interface CSVProcessor<T> {
  process(file: File, config: CSVProcessingConfig): Promise<T[]>;
  validate(data: T[]): boolean;
}

export function createCSVService<T>(): CSVProcessor<T> {
  return {
    async process(file: File, config: CSVProcessingConfig): Promise<T[]> {
      throw new Error('Not implemented');
    },

    validate(data: T[]): boolean {
      throw new Error('Not implemented');
    }
  };
}
