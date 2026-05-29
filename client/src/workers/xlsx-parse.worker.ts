/// <reference lib="webworker" />
// XLSX parse worker (ADR-0010). The unzip + XML parse of an .xlsx is heavy and
// synchronous — running it on the main thread freezes/crashes the tab on a
// real-sized deck. `read-excel-file/web-worker` is the variant designed to run
// INSIDE a worker, so this file does the parse off the main thread and posts
// back plain string rows (cells normalized via the pure xlsx-cell module).

import { readSheet } from 'read-excel-file/web-worker';
import { normalizeCell } from '@/utils/xlsx-cell';

export interface XlsxParseSuccess {
  rows: string[][];
}
export interface XlsxParseFailure {
  error: string;
}
export type XlsxParseResponse = XlsxParseSuccess | XlsxParseFailure;

export interface XlsxParseRequest {
  file: File;
  // Cap rows returned (header + sample) for the column-mapping preview, so a huge
  // deck doesn't serialize 200K rows back to the main thread. Omit for full ingest.
  maxRows?: number;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<XlsxParseRequest>) => {
  try {
    const { file, maxRows } = e.data;
    // sheet `1` → first sheet. Cells arrive typed (string | number | boolean | Date | null).
    const raw = await readSheet(file, 1);

    const hasData =
      Array.isArray(raw) && raw.some((r) => r.some((c) => c != null));
    if (!hasData) {
      ctx.postMessage({
        error:
          "This workbook's first sheet has no data. Put your rate data on the first sheet and re-upload.",
      } satisfies XlsxParseResponse);
      return;
    }

    const limited = maxRows && maxRows > 0 ? raw.slice(0, maxRows) : raw;
    const rows = limited.map((r) => r.map((c) => normalizeCell(c)));
    ctx.postMessage({ rows } satisfies XlsxParseResponse);
  } catch (err) {
    ctx.postMessage({
      error: err instanceof Error ? err.message : String(err),
    } satisfies XlsxParseResponse);
  }
};
