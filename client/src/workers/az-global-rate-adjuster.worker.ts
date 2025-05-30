/// <reference lib="webworker" />

import { calculateAdjustedRate } from '@/constants/rate-buckets';
import type { RateBucketType } from '@/types/domains/rate-sheet-types';

interface GroupData {
  destinationName: string;
  rates: { rate: number }[];
  codes: string[];
  hasDiscrepancy: boolean;
}

interface AdjustmentSettings {
  adjustmentType: 'markup' | 'markdown';
  adjustmentValueType: 'percentage' | 'fixed';
  adjustmentValue: number;
}

interface WorkerInput {
  groupedData: GroupData[];
  excludedDestinations: string[];
  adjustmentSettings: AdjustmentSettings;
}

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { groupedData, excludedDestinations, adjustmentSettings } = event.data;
  const totalRecords = groupedData.length;
  let processedCount = 0;

  try {
    // Filter out excluded destinations and those with discrepancies
    const eligibleDestinations = groupedData.filter(
      (group) =>
        !excludedDestinations.includes(group.destinationName) &&
        !group.hasDiscrepancy &&
        group.rates &&
        group.rates.length > 0
    );

    const updates = eligibleDestinations.map((group) => {
      const currentRate = group.rates[0]?.rate || 0;
      const newRate = calculateAdjustedRate(
        currentRate,
        adjustmentSettings.adjustmentType,
        adjustmentSettings.adjustmentValue,
        adjustmentSettings.adjustmentValueType
      );

      processedCount++;
      if (processedCount % 100 === 0) {
        self.postMessage({
          type: 'progress',
          detail: `Processing rates... ${processedCount}/${totalRecords}`,
          percentage: (processedCount / totalRecords) * 100,
          phase: 'processing',
        });
      }

      return {
        destinationName: group.destinationName,
        originalRate: currentRate,
        newRate,
        codes: group.codes,
      };
    });

    // Send final result
    self.postMessage({
      type: 'complete',
      updates,
      processedCount: updates.length,
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error in worker',
    });
  }
};
