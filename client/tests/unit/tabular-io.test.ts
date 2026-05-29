import { describe, it, expect, vi, beforeEach } from 'vitest';

// `parseTabularFile`'s xlsx branch now spawns `xlsx-parse.worker?worker`, which
// jsdom/Vitest can't instantiate. Mock that worker module with a fake Worker
// that runs the SAME readSheet → empty-check → normalize logic the real worker
// runs, driven by readSheetMock — so the xlsx-path assertions still exercise
// parseTabularFile end-to-end. (vi.hoisted lets the hoisted factories share the
// mock fn.) The conductor verifies the real off-thread parse live.
const { readSheetMock } = vi.hoisted(() => ({ readSheetMock: vi.fn() }));

vi.mock('read-excel-file/web-worker', () => ({
  readSheet: (...args: unknown[]) => readSheetMock(...args),
}));

vi.mock('@/workers/xlsx-parse.worker?worker', async () => {
  const { normalizeCell } = await import('@/utils/xlsx-cell');
  class FakeXlsxParseWorker {
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onerror: ((ev: unknown) => void) | null = null;
    async postMessage(file: File) {
      try {
        const raw = await readSheetMock(file, 1);
        const hasData =
          Array.isArray(raw) && raw.some((r: unknown[]) => r.some((c) => c != null));
        if (!hasData) {
          this.onmessage?.({
            data: {
              error:
                "This workbook's first sheet has no data. Put your rate data on the first sheet and re-upload.",
            },
          } as MessageEvent);
          return;
        }
        const rows = raw.map((r: unknown[]) => r.map((c) => normalizeCell(c)));
        this.onmessage?.({ data: { rows } } as MessageEvent);
      } catch (err) {
        this.onmessage?.({
          data: { error: err instanceof Error ? err.message : String(err) },
        } as MessageEvent);
      }
    }
    terminate() {}
  }
  return { default: FakeXlsxParseWorker };
});

// write-excel-file/browser is import-only here (download path not unit-tested),
// but stub it so the module imports cleanly under jsdom.
vi.mock('write-excel-file/browser', () => ({
  default: () => ({ toBlob: async () => new Blob() }),
}));

import { detectFormat, normalizeCell, parseTabularFile } from '@/utils/tabular-io';

function csvFile(name: string, content: string): File {
  return new File([content], name, { type: 'text/csv' });
}

describe('detectFormat', () => {
  it('detects csv by extension', () => {
    expect(detectFormat(new File([''], 'rates.csv', { type: 'text/csv' }))).toBe('csv');
  });

  it('detects xlsx by extension (case-insensitive)', () => {
    expect(detectFormat(new File([''], 'rates.XLSX'))).toBe('xlsx');
    expect(detectFormat(new File([''], 'rates.xlsx'))).toBe('xlsx');
  });

  it('detects xlsx by MIME when extension is missing/wrong', () => {
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    expect(detectFormat(new File([''], 'rates', { type: mime }))).toBe('xlsx');
  });

  it('defaults to csv for unknown extensions', () => {
    expect(detectFormat(new File([''], 'rates.txt'))).toBe('csv');
    expect(detectFormat(new File([''], 'rates'))).toBe('csv');
  });
});

describe('normalizeCell', () => {
  it('null / undefined → empty string', () => {
    expect(normalizeCell(null)).toBe('');
    expect(normalizeCell(undefined)).toBe('');
  });

  it('integer → plain string', () => {
    expect(normalizeCell(213555)).toBe('213555');
    expect(normalizeCell(0)).toBe('0');
  });

  it('small decimal stays exact, no precision drift', () => {
    expect(normalizeCell(0.008)).toBe('0.008');
    expect(normalizeCell(0.0123)).toBe('0.0123');
  });

  it('very small magnitude → no scientific notation', () => {
    expect(normalizeCell(1e-7)).toBe('0.0000001');
    expect(normalizeCell(0.0000001)).toBe('0.0000001');
  });

  it('NPANXX-as-number → plain digits', () => {
    expect(normalizeCell(2135550100)).toBe('2135550100');
  });

  it('Date → ISO YYYY-MM-DD', () => {
    expect(normalizeCell(new Date('2026-05-28T00:00:00.000Z'))).toBe('2026-05-28');
  });

  it('strings and booleans → String(value)', () => {
    expect(normalizeCell('213555')).toBe('213555');
    expect(normalizeCell(true)).toBe('true');
    expect(normalizeCell(false)).toBe('false');
  });
});

describe('parseTabularFile — CSV path', () => {
  it('returns string[][] with row 0 = header, matching Papa header:false shape', async () => {
    const file = csvFile('rates.csv', 'npanxx,interstate,intrastate\n213555,0.008,0.009\n310555,0.01,0.011\n');
    const rows = await parseTabularFile(file);
    expect(rows[0]).toEqual(['npanxx', 'interstate', 'intrastate']);
    expect(rows[1]).toEqual(['213555', '0.008', '0.009']);
    expect(rows[2]).toEqual(['310555', '0.01', '0.011']);
    // every cell is a string
    expect(rows.every((r) => r.every((c) => typeof c === 'string'))).toBe(true);
  });

  it('skips empty lines', async () => {
    const file = csvFile('rates.csv', 'a,b\n1,2\n\n3,4\n');
    const rows = await parseTabularFile(file);
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });
});

describe('parseTabularFile — XLSX path', () => {
  beforeEach(() => readSheetMock.mockReset());

  it('normalizes typed cells to strings, row 0 = header', async () => {
    readSheetMock.mockResolvedValue([
      ['npanxx', 'interstate', 'effective'],
      [213555, 0.008, new Date('2026-05-28T00:00:00.000Z')],
    ]);
    const rows = await parseTabularFile(new File([''], 'rates.xlsx'));
    expect(rows).toEqual([
      ['npanxx', 'interstate', 'effective'],
      ['213555', '0.008', '2026-05-28'],
    ]);
  });

  it('throws an actionable error when the first sheet has no data', async () => {
    readSheetMock.mockResolvedValue([]);
    await expect(parseTabularFile(new File([''], 'empty.xlsx'))).rejects.toThrow(
      "This workbook's first sheet has no data. Put your rate data on the first sheet and re-upload."
    );
  });

  it('treats an all-blank sheet as empty', async () => {
    readSheetMock.mockResolvedValue([[null, null], [null]]);
    await expect(parseTabularFile(new File([''], 'blank.xlsx'))).rejects.toThrow(
      'has no data'
    );
  });
});
