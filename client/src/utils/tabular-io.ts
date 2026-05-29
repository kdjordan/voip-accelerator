// Shared format-transparent tabular read/write layer (ADR-0010).
//
// One module that routes CSV vs XLSX so every upload/export surface treats the
// two formats identically. CSV behavior is preserved byte-for-byte (it still
// runs through papaparse with the same options used inline today); XLSX is
// parsed via `read-excel-file`'s web-worker entry — which runs the unzip + XML
// parse off the main thread, so the UI never freezes — and written via
// `write-excel-file`'s browser entry. The downstream column-mapping,
// validation, NANP-categorization, and Dexie-write pipeline is untouched
// because `parseTabularFile` returns the same shape as today's
// `Papa.parse(file, { header: false })` output: `string[][]`, row 0 = headers.
//
// Worker note: `read-excel-file/web-worker` manages its own Web Worker
// internally (every export of the package already does so under the hood — see
// its README), so no hand-rolled worker file is needed here.

import Papa from 'papaparse';
// XLSX parse — web-worker entry parses off the main thread. `readSheet(input,
// sheet)` returns one sheet's rows directly; sheet `1` is the first sheet.
import { readSheet } from 'read-excel-file/web-worker';
// XLSX write — browser entry returns { toBlob, toFile }; we use toBlob + the
// shared anchor-download pattern below.
import writeXlsxFile from 'write-excel-file/browser';

export type TabularFormat = 'csv' | 'xlsx';

/** The XLSX MIME type produced by Excel / spreadsheet apps. */
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Detect a file's tabular format. Primarily by extension (`.xlsx` → xlsx, else
 * csv); defensively also treats the xlsx MIME as xlsx (some browsers report a
 * blank or generic extension via drag-drop).
 */
export function detectFormat(file: File): TabularFormat {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.xlsx') || file.type === XLSX_MIME) return 'xlsx';
  return 'csv';
}

/**
 * PURE: normalize one xlsx cell value to the string form papaparse would have
 * produced. xlsx cells arrive typed (number / boolean / Date), so:
 *  - null / undefined → ''
 *  - number → a plain decimal string, NO scientific notation and NO float
 *    precision drift (0.008 stays "0.008"; 213555 stays "213555"; 1e-7 →
 *    "0.0000001", never "1e-7")
 *  - Date → ISO date "YYYY-MM-DD"
 *  - string / boolean / everything else → String(value)
 */
export function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value); // NaN / Infinity — leave as-is
    if (Number.isInteger(value)) return String(value);
    // Non-integer: avoid both scientific notation (e.g. "1e-7") and binary
    // float drift (e.g. "0.007999999..."). maximumFractionDigits caps the tail;
    // useGrouping:false drops thousands separators.
    return value.toLocaleString('en-US', {
      useGrouping: false,
      maximumFractionDigits: 20,
    });
  }

  if (value instanceof Date) {
    // ISO date only (no time component). xlsx dates are date-typed cells.
    return value.toISOString().slice(0, 10);
  }

  return String(value);
}

/**
 * Parse a tabular file into rows of strings, row 0 = header row — matching the
 * shape of today's `Papa.parse(file, { header: false })` `results.data`.
 *
 * CSV → papaparse (`header:false`, `skipEmptyLines:true`).
 * XLSX → first sheet only, every cell normalized to a string via normalizeCell.
 * Empty first sheet → throws an actionable error (callers surface it).
 */
export async function parseTabularFile(file: File): Promise<string[][]> {
  if (detectFormat(file) === 'xlsx') {
    // `readSheet(input, 1)` → the first sheet's rows. Cells are typed
    // (string | number | boolean | Date | null) — normalize each to a string.
    const rows = await readSheet(file, 1);

    const hasData = Array.isArray(rows) && rows.some((row) => row.some((cell) => cell != null));
    if (!hasData) {
      throw new Error(
        "This workbook's first sheet has no data. Put your rate data on the first sheet and re-upload."
      );
    }

    return rows.map((row) => row.map((cell) => normalizeCell(cell)));
  }

  // CSV — preserve the inline papaparse options used across the surfaces.
  return new Promise<string[][]>((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as string[][]),
      error: (error) => reject(error),
    });
  });
}

/** Trigger a browser download of a Blob via the shared anchor pattern. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Ensure `filename` ends with `.${ext}` (case-insensitive); append if missing. */
function withExtension(filename: string, ext: TabularFormat): string {
  return filename.toLowerCase().endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
}

/**
 * Build a tabular file from headers + rows and trigger its download in the
 * chosen format. XLSX content is identical to the CSV (same headers/rows),
 * single sheet. The correct extension is appended if missing.
 */
export async function downloadTabularFile(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  format: TabularFormat
): Promise<void> {
  if (format === 'xlsx') {
    // write-excel-file cells: { value, type }. Strings stay strings; numbers
    // stay numeric so Excel treats them as numbers.
    const sheetData = [
      headers.map((h) => ({ value: h, type: String })),
      ...rows.map((row) =>
        row.map((cell) =>
          typeof cell === 'number'
            ? { value: cell, type: Number }
            : { value: cell == null ? '' : String(cell), type: String }
        )
      ),
    ];
    const blob = await writeXlsxFile(sheetData as never).toBlob();
    triggerDownload(blob, withExtension(filename, 'xlsx'));
    return;
  }

  // CSV — same Papa.unparse shape used by the existing exporters.
  const csv = Papa.unparse([headers, ...rows], { header: false, newline: '\n' });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, withExtension(filename, 'csv'));
}
