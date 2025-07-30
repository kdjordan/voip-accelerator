/**
 * LCR Validation Tests - Known calculation examples for testing
 */

export interface LCRTestCase {
  name: string;
  prefix: string;
  providerRates: Array<{
    provider: string;
    interRate: number;
    intraRate: number;
    indeterminateRate: number;
  }>;
  strategy: string;
  markup: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  expectedResults: {
    selectedProvider: string;
    selectedRate: number;
    finalRate: number;
  };
}

export const LCR_TEST_CASES: LCRTestCase[] = [
  {
    name: 'LCR1 - Basic cheapest selection',
    prefix: '201201',
    providerRates: [
      { provider: 'Provider A', interRate: 0.005000, intraRate: 0.004500, indeterminateRate: 0.005000 },
      { provider: 'Provider B', interRate: 0.003000, intraRate: 0.003500, indeterminateRate: 0.003000 },
      { provider: 'Provider C', interRate: 0.004000, intraRate: 0.004000, indeterminateRate: 0.004000 }
    ],
    strategy: 'LCR1',
    markup: { type: 'percentage', value: 10 },
    expectedResults: {
      selectedProvider: 'Provider B',
      selectedRate: 0.003000,
      finalRate: 0.003300 // 0.003000 + 10%
    }
  },
  {
    name: 'LCR2 - Second cheapest selection',
    prefix: '212555',
    providerRates: [
      { provider: 'Provider A', interRate: 0.008000, intraRate: 0.007500, indeterminateRate: 0.008000 },
      { provider: 'Provider B', interRate: 0.005000, intraRate: 0.005500, indeterminateRate: 0.005000 },
      { provider: 'Provider C', interRate: 0.006000, intraRate: 0.006000, indeterminateRate: 0.006000 }
    ],
    strategy: 'LCR2',
    markup: { type: 'fixed', value: 0.001000 },
    expectedResults: {
      selectedProvider: 'Provider C',
      selectedRate: 0.006000,
      finalRate: 0.007000 // 0.006000 + 0.001000
    }
  },
  {
    name: 'Average - All providers included',
    prefix: '305123',
    providerRates: [
      { provider: 'Provider A', interRate: 0.004000, intraRate: 0.003500, indeterminateRate: 0.004000 },
      { provider: 'Provider B', interRate: 0.006000, intraRate: 0.005500, indeterminateRate: 0.006000 },
      { provider: 'Provider C', interRate: 0.008000, intraRate: 0.007500, indeterminateRate: 0.008000 }
    ],
    strategy: 'Average',
    markup: { type: 'percentage', value: 5 },
    expectedResults: {
      selectedProvider: 'Provider A, Provider B, Provider C',
      selectedRate: 0.006000, // (0.004000 + 0.006000 + 0.008000) / 3
      finalRate: 0.006300 // 0.006000 + 5%
    }
  },
  {
    name: 'LCR3 - Fallback when only 2 providers',
    prefix: '415987',
    providerRates: [
      { provider: 'Provider A', interRate: 0.007000, intraRate: 0.006500, indeterminateRate: 0.007000 },
      { provider: 'Provider B', interRate: 0.005000, intraRate: 0.005500, indeterminateRate: 0.005000 }
    ],
    strategy: 'LCR3',
    markup: { type: 'percentage', value: 15 },
    expectedResults: {
      selectedProvider: 'Provider A', // Fallback to second cheapest since no third option
      selectedRate: 0.007000,
      finalRate: 0.008050 // 0.007000 + 15%
    }
  },
  {
    name: 'Zero rate handling',
    prefix: '501234',
    providerRates: [
      { provider: 'Provider A', interRate: 0.000000, intraRate: 0.003500, indeterminateRate: 0.000000 },
      { provider: 'Provider B', interRate: 0.004000, intraRate: 0.004500, indeterminateRate: 0.004000 },
      { provider: 'Provider C', interRate: 0.006000, intraRate: 0.005500, indeterminateRate: 0.006000 }
    ],
    strategy: 'LCR1',
    markup: { type: 'percentage', value: 20 },
    expectedResults: {
      selectedProvider: 'Provider B', // Provider A filtered out due to 0 rate
      selectedRate: 0.004000,
      finalRate: 0.004800 // 0.004000 + 20%
    }
  }
];

/**
 * Validate if actual results match expected results for a test case
 */
export function validateTestCase(
  testCase: LCRTestCase,
  actualResult: {
    selectedProvider: string;
    selectedRate: number;
    finalRate: number;
  }
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const tolerance = 0.000001; // Small tolerance for floating point comparison

  // Check selected provider
  if (actualResult.selectedProvider !== testCase.expectedResults.selectedProvider) {
    errors.push(`Provider mismatch: expected "${testCase.expectedResults.selectedProvider}", got "${actualResult.selectedProvider}"`);
  }

  // Check selected rate
  if (Math.abs(actualResult.selectedRate - testCase.expectedResults.selectedRate) > tolerance) {
    errors.push(`Selected rate mismatch: expected ${testCase.expectedResults.selectedRate.toFixed(6)}, got ${actualResult.selectedRate.toFixed(6)}`);
  }

  // Check final rate
  if (Math.abs(actualResult.finalRate - testCase.expectedResults.finalRate) > tolerance) {
    errors.push(`Final rate mismatch: expected ${testCase.expectedResults.finalRate.toFixed(6)}, got ${actualResult.finalRate.toFixed(6)}`);
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

/**
 * Manual calculation helper for debugging
 */
export function manualLCRCalculation(testCase: LCRTestCase): {
  sortedRates: Array<{ provider: string; rate: number }>;
  selectedRate: number;
  selectedProvider: string;
  finalRate: number;
} {
  // Sort rates by value (ascending)
  const sorted = testCase.providerRates
    .filter(p => p.interRate > 0)
    .map(p => ({ provider: p.provider, rate: p.interRate }))
    .sort((a, b) => a.rate - b.rate);

  let selectedRate: number;
  let selectedProvider: string;

  switch (testCase.strategy) {
    case 'LCR1':
      selectedRate = sorted[0]?.rate || 0;
      selectedProvider = sorted[0]?.provider || 'None';
      break;
    case 'LCR2':
      selectedRate = sorted[1]?.rate || sorted[0]?.rate || 0;
      selectedProvider = sorted[1]?.provider || sorted[0]?.provider || 'None';
      break;
    case 'LCR3':
      selectedRate = sorted[2]?.rate || sorted[1]?.rate || sorted[0]?.rate || 0;
      selectedProvider = sorted[2]?.provider || sorted[1]?.provider || sorted[0]?.provider || 'None';
      break;
    case 'Average':
      selectedRate = sorted.reduce((sum, r) => sum + r.rate, 0) / sorted.length;
      selectedProvider = sorted.map(r => r.provider).join(', ');
      break;
    default:
      selectedRate = sorted[0]?.rate || 0;
      selectedProvider = sorted[0]?.provider || 'None';
  }

  // Apply markup
  let finalRate: number;
  if (testCase.markup.type === 'fixed') {
    finalRate = selectedRate + testCase.markup.value;
  } else {
    finalRate = selectedRate * (1 + testCase.markup.value / 100);
  }

  // Round to 6 decimal places
  finalRate = Math.round(finalRate * 1000000) / 1000000;

  return {
    sortedRates: sorted,
    selectedRate,
    selectedProvider,
    finalRate
  };
}