import { describe, it, expect } from 'vitest';
import { defaultExportFormat } from '@/utils/export-format';

describe('defaultExportFormat', () => {
  it('returns xlsx when all sources are xlsx', () => {
    expect(defaultExportFormat(['xlsx', 'xlsx'])).toBe('xlsx');
    expect(defaultExportFormat(['xlsx'])).toBe('xlsx');
  });

  it('returns csv when all sources are csv', () => {
    expect(defaultExportFormat(['csv', 'csv'])).toBe('csv');
    expect(defaultExportFormat(['csv'])).toBe('csv');
  });

  it('returns csv for a mixed set', () => {
    expect(defaultExportFormat(['csv', 'xlsx'])).toBe('csv');
    expect(defaultExportFormat(['xlsx', 'csv'])).toBe('csv');
  });

  it('returns csv for an empty set', () => {
    expect(defaultExportFormat([])).toBe('csv');
  });
});
