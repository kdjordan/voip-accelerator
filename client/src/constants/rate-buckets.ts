import type { RateBucketFilter, RateBucketType } from '@/types/domains/rate-sheet-types';

export const RATE_BUCKETS: RateBucketFilter[] = [
  { type: 'all', label: 'All Rates', min: 0, max: null },
  { type: '0.000000-0.015000', label: '$0.000000 - $0.015000', min: 0, max: 0.015 },
  { type: '0.015001-0.050000', label: '$0.015001 - $0.050000', min: 0.015001, max: 0.05 },
  { type: '0.050001-0.150000', label: '$0.050001 - $0.150000', min: 0.050001, max: 0.15 },
  { type: '0.150000+', label: '$0.150000+', min: 0.15, max: null },
];

// Boundary values go to lower bucket (round down)
export function classifyRateIntoBucket(rate: number): RateBucketType {
  // Ensure 6-decimal precision for comparison
  const preciseRate = parseFloat(rate.toFixed(6));

  if (preciseRate <= 0.015) return '0.000000-0.015000';
  if (preciseRate <= 0.05) return '0.015001-0.050000';
  if (preciseRate <= 0.15) return '0.050001-0.150000';
  return '0.150000+';
}

export function isRateInBucket(rate: number, bucketType: RateBucketType): boolean {
  if (bucketType === 'all') return true;

  const bucket = RATE_BUCKETS.find((b) => b.type === bucketType);
  if (!bucket) return false;

  // Ensure 6-decimal precision for comparison
  const preciseRate = parseFloat(rate.toFixed(6));

  if (bucket.max === null) {
    return preciseRate >= bucket.min;
  }

  return preciseRate >= bucket.min && preciseRate <= bucket.max;
}

// 6-decimal precision formatting for all rate displays
export function formatRate(rate: number): string {
  return rate.toFixed(6);
}

// 6-decimal precision for all calculations
export function calculateAdjustedRate(
  originalRate: number,
  adjustmentType: 'markup' | 'markdown',
  adjustmentValue: number,
  adjustmentValueType: 'percentage' | 'fixed'
): number {
  let newRate = originalRate;

  if (adjustmentValueType === 'percentage') {
    if (adjustmentType === 'markup') {
      newRate = originalRate * (1 + adjustmentValue / 100);
    } else {
      newRate = originalRate * (1 - adjustmentValue / 100);
    }
  } else {
    if (adjustmentType === 'markup') {
      newRate = originalRate + adjustmentValue;
    } else {
      newRate = Math.max(0, originalRate - adjustmentValue);
    }
  }

  // Ensure 6-decimal precision
  return Math.max(0, parseFloat(newRate.toFixed(6)));
}
