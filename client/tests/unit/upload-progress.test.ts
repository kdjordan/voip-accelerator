import { describe, it, expect } from 'vitest';
import { reportWriteProgress } from '@/utils/upload-progress';

describe('reportWriteProgress', () => {
  it('maps the start of a write to the band floor', () => {
    expect(reportWriteProgress(0, 1000, { from: 0, to: 99 })).toBe(0);
    expect(reportWriteProgress(0, 1000, { from: 40, to: 99 })).toBe(40);
    expect(reportWriteProgress(0, 1000, { from: 50, to: 100 })).toBe(50);
  });

  it('maps the end of a write to the band ceiling', () => {
    expect(reportWriteProgress(1000, 1000, { from: 0, to: 99 })).toBe(99);
    expect(reportWriteProgress(1000, 1000, { from: 40, to: 99 })).toBe(99);
    expect(reportWriteProgress(1000, 1000, { from: 50, to: 100 })).toBe(100);
  });

  it('maps the midpoint to the band midpoint', () => {
    expect(reportWriteProgress(500, 1000, { from: 0, to: 100 })).toBe(50);
    expect(reportWriteProgress(500, 1000, { from: 40, to: 100 })).toBe(70);
    expect(reportWriteProgress(250, 1000, { from: 0, to: 80 })).toBe(20);
  });

  it('clamps overshoot (stored > total) to the band ceiling', () => {
    expect(reportWriteProgress(1200, 1000, { from: 40, to: 99 })).toBe(99);
  });

  it('returns the band floor when total is zero or negative (avoids divide-by-zero)', () => {
    expect(reportWriteProgress(0, 0, { from: 40, to: 99 })).toBe(40);
    expect(reportWriteProgress(10, -5, { from: 0, to: 99 })).toBe(0);
  });

  it('is monotonic across a chunked write', () => {
    const band = { from: 40, to: 99 };
    const total = 10_000;
    let prev = -1;
    for (let stored = 0; stored <= total; stored += 2500) {
      const p = reportWriteProgress(stored, total, band);
      expect(p).toBeGreaterThanOrEqual(prev);
      expect(p).toBeGreaterThanOrEqual(band.from);
      expect(p).toBeLessThanOrEqual(band.to);
      prev = p;
    }
  });
});
