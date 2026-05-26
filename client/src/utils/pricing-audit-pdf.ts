/**
 * Branded "Change Audit" PDF for Pricing Studio.
 *
 * Renders the session's pricing operations as a one-or-more page VoIP Accelerator
 * report: a wordmark header (emerald accent on white — this is a print document,
 * not the dark UI), a session summary block, and the per-operation audit table
 * (sourced from the pure buildAuditTable). The audit deliberately omits per-row
 * detail to stay scalable for 200K+ decks.
 *
 * The logo is rendered as a styled wordmark rather than the SVG asset to avoid
 * pulling in an SVG-to-PDF dependency; can be upgraded to the raster logo later.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildAuditTable, type PricingOperation } from '@/utils/pricing-engine';

export interface AuditPdfMeta {
  generatedAt?: Date;
  totalRecords: number;
  modifiedRows: number;
  frozenScopes: number;
  effectiveDate: string | null;
}

const EMERALD: [number, number, number] = [52, 211, 153]; // #34d399
const INK: [number, number, number] = [8, 9, 10]; // #08090A
const ZINC: [number, number, number] = [113, 113, 122]; // zinc-500

function fmtInt(n: number): string {
  return n.toLocaleString('en-US');
}

/** Build the branded Change Audit PDF document (does not trigger a download). */
export function buildAuditPdf(operations: PricingOperation[], meta: AuditPdfMeta): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = meta.generatedAt ?? new Date();
  const marginX = 40;

  // Header: emerald accent rule + wordmark
  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, pageWidth, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text('VoIP Accelerator', marginX, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...ZINC);
  doc.text('Pricing Studio — Change Audit', marginX, 70);

  doc.setFontSize(9);
  doc.text(`Generated ${generatedAt.toLocaleString('en-US')}`, pageWidth - marginX, 52, {
    align: 'right',
  });
  doc.text('Local browser session', pageWidth - marginX, 66, { align: 'right' });

  // Summary block
  const summary = [
    `Total records: ${fmtInt(meta.totalRecords)}`,
    `Modified rows: ${fmtInt(meta.modifiedRows)}`,
    `Frozen scopes: ${fmtInt(meta.frozenScopes)}`,
    `Operations: ${fmtInt(operations.length)}`,
    `Effective date: ${meta.effectiveDate || 'N/A'}`,
  ];
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(summary.join('     •     '), marginX, 96);

  // Operations table
  const { headers, rows } = buildAuditTable(operations);
  autoTable(doc, {
    startY: 112,
    head: [headers],
    body: rows.length ? rows : [['—', 'No operations recorded this session', '', '', '', '', '', '', '', '', '', '']],
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 7.5, cellPadding: 4, textColor: INK, lineColor: [228, 228, 231] },
    headStyles: { fillColor: EMERALD, textColor: INK, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(...ZINC);
    doc.text(
      'Generated locally in your browser — not uploaded or stored.',
      marginX,
      pageHeight - 24
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 24, { align: 'right' });
  }

  return doc;
}

/** Build and trigger a download of the branded Change Audit PDF. */
export function downloadAuditPdf(
  operations: PricingOperation[],
  meta: AuditPdfMeta,
  filename = 'change-audit'
): void {
  const stamp = (meta.generatedAt ?? new Date()).toISOString().replace(/[:.]/g, '-');
  buildAuditPdf(operations, meta).save(`${filename}-${stamp}.pdf`);
}
