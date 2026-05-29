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
// Worker note: NONE of `read-excel-file`'s ESM exports actually spawn a Worker
// (`readSheetBrowser`/`readSheetWebWorker` all `unpackXlsxFile().then(parse())`
// on the CALLING thread — only the prebuilt UMD bundle uses a Worker, which
// Vite doesn't pull in). So calling `readSheet` directly here would freeze the
// tab on a real-sized .xlsx. Instead the xlsx branch spawns a dedicated worker
// (`xlsx-parse.worker.ts`) that imports `read-excel-file/web-worker` and does
// the unzip + XML parse + cell-normalization off the main thread.

import Papa from 'papaparse';
// XLSX write — browser entry returns { toBlob, toFile }; we use toBlob + the
// shared anchor-download pattern below.
import writeXlsxFile from 'write-excel-file/browser';
// XLSX parse runs off-thread via a dedicated worker (see file header).
import XlsxParseWorker from '@/workers/xlsx-parse.worker?worker';
import type { XlsxParseResponse } from '@/workers/xlsx-parse.worker';

// Re-export the pure cell normalizer (moved to its own module so the worker can
// import it without dragging in papaparse/DOM). Keeps the existing
// `tabular-io` import path working for callers and tests.
export { normalizeCell } from '@/utils/xlsx-cell';

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
 * Parse a tabular file into rows of strings, row 0 = header row — matching the
 * shape of today's `Papa.parse(file, { header: false })` `results.data`.
 *
 * CSV → papaparse (`header:false`, `skipEmptyLines:true`).
 * XLSX → parsed + normalized off the main thread in `xlsx-parse.worker.ts`
 *   (first sheet only; cells normalized to strings via normalizeCell there).
 *   Empty first sheet → the worker reports an actionable error we reject with.
 *
 * `options.maxRows` caps the rows returned (header + sample) — pass it for the
 * column-mapping PREVIEW so a huge deck doesn't load every row into a reactive
 * ref / serialize 200K rows out of the worker. Omit it for the full ingest.
 */
export async function parseTabularFile(
  file: File,
  options?: { maxRows?: number }
): Promise<string[][]> {
  const maxRows = options?.maxRows;
  if (detectFormat(file) === 'xlsx') {
    // Spawn the worker so the heavy unzip + XML parse never blocks the UI.
    return new Promise<string[][]>((resolve, reject) => {
      const worker = new XlsxParseWorker();
      worker.onmessage = (ev: MessageEvent<XlsxParseResponse>) => {
        worker.terminate();
        if ('error' in ev.data) {
          reject(new Error(ev.data.error));
        } else {
          resolve(ev.data.rows);
        }
      };
      worker.onerror = (err) => {
        worker.terminate();
        reject(err instanceof ErrorEvent ? new Error(err.message) : err);
      };
      worker.postMessage({ file, maxRows });
    });
  }

  // CSV — preserve the inline papaparse options used across the surfaces.
  // `preview: 0` (papaparse default) = all rows; `preview: N` caps to N.
  return new Promise<string[][]>((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      preview: maxRows && maxRows > 0 ? maxRows : 0,
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
