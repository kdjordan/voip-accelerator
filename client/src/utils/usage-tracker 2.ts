import { useBilling } from '@/composables/useBilling';

/**
 * Utility functions for tracking user actions for billing and analytics
 */

const { trackUsageMetric } = useBilling();

/**
 * Track a rate comparison operation
 */
export async function trackComparison(
  source: 'us' | 'az',
  metadata?: {
    sheets_compared?: number;
    total_rows?: number;
    comparison_type?: string;
    [key: string]: any;
  }
) {
  try {
    await trackUsageMetric('comparison', source, metadata);
  } catch (error) {
    console.warn('Failed to track comparison metric:', error);
  }
}

/**
 * Track a rate adjustment operation
 */
export async function trackAdjustment(
  source: 'us' | 'az',
  metadata?: {
    rows_affected?: number;
    adjustment_type?: 'percentage' | 'fixed' | 'bulk';
    adjustment_value?: number;
    [key: string]: any;
  }
) {
  try {
    await trackUsageMetric('adjustment', source, metadata);
  } catch (error) {
    console.warn('Failed to track adjustment metric:', error);
  }
}

/**
 * Convenience functions for common operations
 */
export const UsageTracker = {
  // US Operations
  usComparison: (metadata?: Parameters<typeof trackComparison>[1]) => 
    trackComparison('us', metadata),
  
  usAdjustment: (metadata?: Parameters<typeof trackAdjustment>[1]) => 
    trackAdjustment('us', metadata),

  // AZ Operations  
  azComparison: (metadata?: Parameters<typeof trackComparison>[1]) => 
    trackComparison('az', metadata),
    
  azAdjustment: (metadata?: Parameters<typeof trackAdjustment>[1]) => 
    trackAdjustment('az', metadata),

  // Bulk operations
  bulkComparison: (source: 'us' | 'az', sheetsCount: number, totalRows: number) =>
    trackComparison(source, {
      sheets_compared: sheetsCount,
      total_rows: totalRows,
      comparison_type: 'bulk'
    }),

  bulkAdjustment: (source: 'us' | 'az', rowsAffected: number, adjustmentType: string) =>
    trackAdjustment(source, {
      rows_affected: rowsAffected,
      adjustment_type: adjustmentType as any
    })
};

/**
 * Example usage:
 * 
 * // In your components:
 * import { UsageTracker } from '@/utils/usage-tracker';
 * 
 * // Track a US rate comparison
 * await UsageTracker.usComparison({ 
 *   sheets_compared: 2, 
 *   total_rows: 1500 
 * });
 * 
 * // Track an AZ bulk adjustment
 * await UsageTracker.azAdjustment({
 *   rows_affected: 250,
 *   adjustment_type: 'percentage',
 *   adjustment_value: 10
 * });
 * 
 * // Or use the convenience methods
 * await UsageTracker.bulkComparison('us', 3, 2500);
 */