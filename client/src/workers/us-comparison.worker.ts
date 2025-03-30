import type {
  USReportsInput,
  USPricingReport,
  USCodeReport,
  USStandardizedData,
  USComparisonData,
  USNonMatchingCode,
} from '@/types/domains/us-types';

// Store LERG data in worker scope
let lergData: any = null;

// Respond to messages from main thread
self.addEventListener('message', (event) => {
  // Check if this is a LERG data message
  if (event.data.lergData) {
    lergData = event.data.lergData;
    self.postMessage({ status: 'lergDataReceived' });
    return;
  }

  // For file data messages, normalize and process
  try {
    // Normalize input data for consistent processing
    const normalizedInput = normalizeInputData(event.data);

    // Process comparison and generate reports
    const { pricingReport, codeReport } = generateReports(normalizedInput);

    // Send the generated reports back to the main thread
    self.postMessage({ pricingReport, codeReport });
  } catch (error) {
    console.error('Error generating reports:', error);
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
});

/**
 * Normalize NPANXX values in input data
 */
function normalizeInputData(input: USReportsInput): USReportsInput {
  const { fileName1, fileName2, file1Data, file2Data } = input;

  // Helper function to consistently normalize NPANXX
  function normalizeNpanxx(input: string): string {
    // Remove all non-numeric characters
    let cleaned = input.replace(/\D/g, '');

    // If the cleaned string starts with '1' and is 7 digits, remove the '1'
    if (cleaned.length === 7 && cleaned.startsWith('1')) {
      cleaned = cleaned.substring(1);
    }

    // If it's longer than 6 digits, truncate to 6
    if (cleaned.length > 6) {
      cleaned = cleaned.substring(0, 6);
    }

    // If it's less than 6 digits but at least 3, pad with zeros
    if (cleaned.length < 6 && cleaned.length >= 3) {
      cleaned = cleaned.padEnd(6, '0');
    }

    return cleaned;
  }

  // Normalize file1Data
  const normalizedFile1Data = file1Data.map((entry) => {
    const normalized = { ...entry };
    if (normalized.npanxx) {
      normalized.npanxx = normalizeNpanxx(normalized.npanxx);
      normalized.npa = normalized.npanxx.substring(0, 3);
      normalized.nxx = normalized.npanxx.substring(3, 6);
    }
    return normalized;
  });

  // Normalize file2Data
  const normalizedFile2Data = file2Data.map((entry) => {
    const normalized = { ...entry };
    if (normalized.npanxx) {
      normalized.npanxx = normalizeNpanxx(normalized.npanxx);
      normalized.npa = normalized.npanxx.substring(0, 3);
      normalized.nxx = normalized.npanxx.substring(3, 6);
    }
    return normalized;
  });

  return {
    fileName1,
    fileName2,
    file1Data: normalizedFile1Data,
    file2Data: normalizedFile2Data,
  };
}

function generateReports(input: USReportsInput): {
  pricingReport: USPricingReport;
  codeReport: USCodeReport;
} {
  const { fileName1, fileName2, file1Data, file2Data } = input;

  if (!fileName1 || !fileName2 || !file1Data || !file2Data) {
    throw new Error('Missing a file name or fileData in worker !!');
  }

  // Calculate all rate statistics first
  const file1Stats = {
    averageInterRate: calculateAverage(file1Data, 'interRate'),
    averageIntraRate: calculateAverage(file1Data, 'intraRate'),
    averageIJRate: calculateAverage(file1Data, 'indetermRate'),
    medianInterRate: calculateMedian(file1Data, 'interRate'),
    medianIntraRate: calculateMedian(file1Data, 'intraRate'),
    medianIJRate: calculateMedian(file1Data, 'indetermRate'),
    minInterRate: calculateMin(file1Data, 'interRate'),
    maxInterRate: calculateMax(file1Data, 'interRate'),
    interRateCount: file1Data.filter((d) => d.interRate > 0).length,
    minIntraRate: calculateMin(file1Data, 'intraRate'),
    maxIntraRate: calculateMax(file1Data, 'intraRate'),
    intraRateCount: file1Data.filter((d) => d.intraRate > 0).length,
    minIJRate: calculateMin(file1Data, 'indetermRate'),
    maxIJRate: calculateMax(file1Data, 'indetermRate'),
    ijRateCount: file1Data.filter((d) => d.indetermRate > 0).length,
  };

  const file2Stats = {
    averageInterRate: calculateAverage(file2Data, 'interRate'),
    averageIntraRate: calculateAverage(file2Data, 'intraRate'),
    averageIJRate: calculateAverage(file2Data, 'indetermRate'),
    medianInterRate: calculateMedian(file2Data, 'interRate'),
    medianIntraRate: calculateMedian(file2Data, 'intraRate'),
    medianIJRate: calculateMedian(file2Data, 'indetermRate'),
    minInterRate: calculateMin(file2Data, 'interRate'),
    maxInterRate: calculateMax(file2Data, 'interRate'),
    interRateCount: file2Data.filter((d) => d.interRate > 0).length,
    minIntraRate: calculateMin(file2Data, 'intraRate'),
    maxIntraRate: calculateMax(file2Data, 'intraRate'),
    intraRateCount: file2Data.filter((d) => d.intraRate > 0).length,
    minIJRate: calculateMin(file2Data, 'indetermRate'),
    maxIJRate: calculateMax(file2Data, 'indetermRate'),
    ijRateCount: file2Data.filter((d) => d.indetermRate > 0).length,
  };

  // Create the pricing report
  const pricingReport: USPricingReport = {
    file1: {
      fileName: fileName1,
      averageInterRate: file1Stats.averageInterRate,
      averageIntraRate: file1Stats.averageIntraRate,
      averageIJRate: file1Stats.averageIJRate,
      medianInterRate: file1Stats.medianInterRate,
      medianIntraRate: file1Stats.medianIntraRate,
      medianIJRate: file1Stats.medianIJRate,
    },
    file2: {
      fileName: fileName2,
      averageInterRate: file2Stats.averageInterRate,
      averageIntraRate: file2Stats.averageIntraRate,
      averageIJRate: file2Stats.averageIJRate,
      medianInterRate: file2Stats.medianInterRate,
      medianIntraRate: file2Stats.medianIntraRate,
      medianIJRate: file2Stats.medianIJRate,
    },
    comparison: {
      interRateDifference: calculatePercentageDifference(
        file1Stats.averageInterRate,
        file2Stats.averageInterRate
      ),
      intraRateDifference: calculatePercentageDifference(
        file1Stats.averageIntraRate,
        file2Stats.averageIntraRate
      ),
      ijRateDifference: calculatePercentageDifference(
        file1Stats.averageIJRate,
        file2Stats.averageIJRate
      ),
      totalHigher: 0,
      totalLower: 0,
      totalEqual: 0,
    },
  };

  // Create the code report separately using our pre-calculated stats
  const codeReport: USCodeReport = {
    file1: {
      fileName: fileName1,
      totalNPANXX: file1Data.length,
      uniqueNPA: new Set(file1Data.map((d) => d.npa)).size,
      uniqueNXX: new Set(file1Data.map((d) => d.nxx)).size,
      coveragePercentage: 0,
      rateStats: {
        interstate: {
          average: file1Stats.averageInterRate,
          median: file1Stats.medianInterRate,
          min: file1Stats.minInterRate,
          max: file1Stats.maxInterRate,
          count: file1Stats.interRateCount,
        },
        intrastate: {
          average: file1Stats.averageIntraRate,
          median: file1Stats.medianIntraRate,
          min: file1Stats.minIntraRate,
          max: file1Stats.maxIntraRate,
          count: file1Stats.intraRateCount,
        },
        indeterminate: {
          average: file1Stats.averageIJRate,
          median: file1Stats.medianIJRate,
          min: file1Stats.minIJRate,
          max: file1Stats.maxIJRate,
          count: file1Stats.ijRateCount,
        },
      },
    },
    file2: {
      fileName: fileName2,
      totalNPANXX: file2Data.length,
      uniqueNPA: new Set(file2Data.map((d) => d.npa)).size,
      uniqueNXX: new Set(file2Data.map((d) => d.nxx)).size,
      coveragePercentage: 0,
      rateStats: {
        interstate: {
          average: file2Stats.averageInterRate,
          median: file2Stats.medianInterRate,
          min: file2Stats.minInterRate,
          max: file2Stats.maxInterRate,
          count: file2Stats.interRateCount,
        },
        intrastate: {
          average: file2Stats.averageIntraRate,
          median: file2Stats.medianIntraRate,
          min: file2Stats.minIntraRate,
          max: file2Stats.maxIntraRate,
          count: file2Stats.intraRateCount,
        },
        indeterminate: {
          average: file2Stats.averageIJRate,
          median: file2Stats.medianIJRate,
          min: file2Stats.minIJRate,
          max: file2Stats.maxIJRate,
          count: file2Stats.ijRateCount,
        },
      },
    },
    matchedCodes: 0,
    nonMatchedCodes: 0,
    matchedCodesPercentage: 0,
    nonMatchedCodesPercentage: 0,
  };

  // Create maps for easy lookup
  const npanxxMap1 = new Map<string, USStandardizedData>();
  const npanxxMap2 = new Map<string, USStandardizedData>();

  // Process in chunks to avoid blocking
  const chunkSize = 5000;

  // Process file1Data in chunks
  for (let i = 0; i < file1Data.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, file1Data.length);
    const chunk = file1Data.slice(i, end);

    chunk.forEach((entry) => {
      npanxxMap1.set(entry.npanxx, entry);
    });
  }

  // Process file2Data in chunks
  for (let i = 0; i < file2Data.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, file2Data.length);
    const chunk = file2Data.slice(i, end);

    chunk.forEach((entry) => {
      npanxxMap2.set(entry.npanxx, entry);
    });
  }

  // Count matched and non-matched codes
  const file1Codes = new Set<string>();
  const file2Codes = new Set<string>();

  // Collect all codes from file1
  file1Data.forEach((entry) => {
    file1Codes.add(entry.npanxx);
  });

  // Collect all codes from file2
  file2Data.forEach((entry) => {
    file2Codes.add(entry.npanxx);
  });

  // Find exactly matching codes using Set operations
  const matchedCodes = new Set<string>();

  // Simply check every code in file1 against file2
  file1Codes.forEach((code) => {
    if (file2Codes.has(code)) {
      matchedCodes.add(code);
    }
  });

  // Get non-matched codes
  const nonMatchedCodesFile1 = new Set<string>();
  const nonMatchedCodesFile2 = new Set<string>();

  file1Codes.forEach((code) => {
    if (!file2Codes.has(code)) {
      nonMatchedCodesFile1.add(code);
    }
  });

  file2Codes.forEach((code) => {
    if (!file1Codes.has(code)) {
      nonMatchedCodesFile2.add(code);
    }
  });

  // Set the statistics in the report
  codeReport.matchedCodes = matchedCodes.size;
  codeReport.nonMatchedCodes = nonMatchedCodesFile1.size + nonMatchedCodesFile2.size;

  // Calculate rate statistics for matched codes
  let higherCount = 0;
  let lowerCount = 0;
  let equalCount = 0;

  matchedCodes.forEach((code) => {
    const entry1 = npanxxMap1.get(code)!;
    const entry2 = npanxxMap2.get(code)!;

    // Interstate comparison
    if (entry1.interRate > entry2.interRate) {
      higherCount++;
    } else if (entry1.interRate < entry2.interRate) {
      lowerCount++;
    } else {
      equalCount++;
    }
  });

  pricingReport.comparison.totalHigher = higherCount;
  pricingReport.comparison.totalLower = lowerCount;
  pricingReport.comparison.totalEqual = equalCount;

  // Calculate percentages
  const totalUniqueNpanxx = new Set([...file1Codes, ...file2Codes]).size;
  codeReport.matchedCodesPercentage = (codeReport.matchedCodes / totalUniqueNpanxx) * 100;
  codeReport.nonMatchedCodesPercentage = (codeReport.nonMatchedCodes / totalUniqueNpanxx) * 100;

  // Calculate coverage percentages
  codeReport.file1.coveragePercentage = (codeReport.file1.uniqueNPA / 1000) * 100; // Example
  codeReport.file2.coveragePercentage = (codeReport.file2.uniqueNPA / 1000) * 100; // Example

  return { pricingReport, codeReport };
}

// Utility functions for rate calculations
function calculateAverage(data: USStandardizedData[], field: keyof USStandardizedData): number {
  if (data.length === 0) return 0;

  // Need to cast as any since TypeScript doesn't know these are numbers
  const total = data.reduce((sum, item) => sum + (item[field] as any), 0);
  return parseFloat((total / data.length).toFixed(4));
}

function calculateMedian(data: USStandardizedData[], field: keyof USStandardizedData): number {
  if (data.length === 0) return 0;

  // Extract and sort values
  const values = [...data].map((item) => item[field] as any).sort((a, b) => a - b);

  const mid = Math.floor(values.length / 2);

  // If even length, average the two middle values
  if (values.length % 2 === 0) {
    return parseFloat(((values[mid - 1] + values[mid]) / 2).toFixed(4));
  }

  // If odd length, return the middle value
  return parseFloat(values[mid].toFixed(4));
}

function calculateMin(data: USStandardizedData[], field: keyof USStandardizedData): number {
  if (data.length === 0) return 0;

  // Find minimum value
  const min = Math.min(...data.map((item) => item[field] as any));
  return parseFloat(min.toFixed(4));
}

function calculateMax(data: USStandardizedData[], field: keyof USStandardizedData): number {
  if (data.length === 0) return 0;

  // Find maximum value
  const max = Math.max(...data.map((item) => item[field] as any));
  return parseFloat(max.toFixed(4));
}

function calculatePercentageDifference(value1: number, value2: number): number {
  if (value1 === 0 && value2 === 0) return 0;
  if (value2 === 0) return 100; // Avoid division by zero

  const diff = ((value1 - value2) / value2) * 100;
  return parseFloat(diff.toFixed(2));
}
