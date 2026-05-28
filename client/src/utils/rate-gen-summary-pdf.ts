/**
 * Branded "Build Summary" PDF for the Rate Composition Studio.
 *
 * Renders a committed generated deck as a one-or-more page VoIP Accelerator
 * report: a wordmark header (emerald accent on white — print document, not the
 * dark UI), a summary block (deck name, strategy, markup, effective date, total
 * prefixes, single-sourced, providers used, avg rates), and the win-rate-by-type
 * table (the studio's primary signal) via jspdf-autotable.
 *
 * Mirrors utils/pricing-audit-pdf.ts (style + buildX/downloadX split). No new
 * dependency — jspdf + jspdf-autotable already ship.
 *
 * Visual reskin (Switchboard) is deferred; this keeps the current emerald
 * branding to match the existing audit PDF.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { selectionLabel, type RateGenAnalytics, type GeneratedRateDeck } from '@/types/domains/rate-gen-types';

const EMERALD: [number, number, number] = [52, 211, 153]; // #34d399
const INK: [number, number, number] = [8, 9, 10]; // #08090A
const ZINC: [number, number, number] = [113, 113, 122]; // zinc-500

function fmtInt(n: number): string {
  return n.toLocaleString('en-US');
}

function fmtRate(n: number): string {
  return n.toFixed(6);
}

function fmtMarkup(deck: GeneratedRateDeck): string {
  if (deck.markupFixed && deck.markupFixed > 0) return `$${deck.markupFixed} fixed`;
  return `${deck.markupPercentage}%`;
}

/**
 * PURE: the labelled summary lines for the PDF's summary block. Exported so the
 * data shaping can be unit-tested without rendering a document.
 */
export function buildSummaryLines(deck: GeneratedRateDeck, analytics: RateGenAnalytics): string[] {
  const effective = deck.effectiveDate
    ? new Date(deck.effectiveDate).toLocaleDateString('en-US')
    : 'N/A';
  return [
    `Deck name: ${deck.name}`,
    `Selection: ${selectionLabel(deck.depth, deck.mode)}`,
    `Markup: ${fmtMarkup(deck)}`,
    `Effective date: ${effective}`,
    `Total prefixes: ${fmtInt(analytics.totalPrefixes)}`,
    `Single-sourced: ${fmtInt(analytics.singleSourcedCount)}`,
    `Providers used: ${analytics.providersUsed.join(', ') || 'None'}`,
    `Avg interstate: ${fmtRate(analytics.avgInterstate)}`,
    `Avg intrastate: ${fmtRate(analytics.avgIntrastate)}`,
    `Avg indeterminate: ${fmtRate(analytics.avgIndeterminate)}`,
  ];
}

/**
 * PURE: flatten win-rate-by-type into autoTable rows
 * (rate type · provider · wins · share %). Sorted within each rate type by the
 * upstream aggregate. Exported for unit testing.
 */
export function buildWinRateTable(analytics: RateGenAnalytics): {
  headers: string[];
  rows: string[][];
} {
  const headers = ['Rate type', 'Provider', 'Wins', 'Share'];
  const rows: string[][] = [];
  const sections: Array<[string, RateGenAnalytics['winRateByType']['interstate']]> = [
    ['Interstate', analytics.winRateByType.interstate],
    ['Intrastate', analytics.winRateByType.intrastate],
    ['Indeterminate', analytics.winRateByType.indeterminate],
  ];
  for (const [label, stats] of sections) {
    if (stats.length === 0) {
      rows.push([label, 'None', '0', '0%']);
      continue;
    }
    stats.forEach((s, i) => {
      rows.push([i === 0 ? label : '', s.provider, fmtInt(s.count), `${s.percentage.toFixed(1)}%`]);
    });
  }
  return { headers, rows };
}

/** Build the branded Build Summary PDF document (does not trigger a download). */
export function buildBuildSummaryPdf(
  deck: GeneratedRateDeck,
  analytics: RateGenAnalytics,
  generatedAt: Date = new Date()
): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
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
  doc.text('Rate Composition Studio — Build Summary', marginX, 70);

  doc.setFontSize(9);
  doc.text(`Generated ${generatedAt.toLocaleString('en-US')}`, pageWidth - marginX, 52, {
    align: 'right',
  });
  doc.text('Local browser session', pageWidth - marginX, 66, { align: 'right' });

  // Summary block — one line each so nothing clips at the page edge.
  const summary = buildSummaryLines(deck, analytics);
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  let summaryY = 92;
  for (const line of summary) {
    doc.text(line, marginX, summaryY);
    summaryY += 15;
  }

  // Win-rate-by-type table (primary signal)
  const { headers, rows } = buildWinRateTable(analytics);
  autoTable(doc, {
    startY: summaryY + 8,
    head: [headers],
    body: rows,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 4, textColor: INK, lineColor: [228, 228, 231] },
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
    doc.text('Generated locally in your browser — not uploaded or stored.', marginX, pageHeight - 24);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 24, { align: 'right' });
  }

  return doc;
}

/** Build and trigger a download of the Build Summary PDF. */
export function downloadBuildSummaryPdf(
  deck: GeneratedRateDeck,
  analytics: RateGenAnalytics,
  filename = 'build-summary'
): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  buildBuildSummaryPdf(deck, analytics).save(`${filename}-${stamp}.pdf`);
}
