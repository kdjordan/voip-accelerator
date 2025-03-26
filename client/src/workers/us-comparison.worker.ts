import type {
  USReportsInput,
  USPricingReport,
  USCodeReport,
  USStandardizedData,
  USComparisonData,
  USNonMatchingCode,
} from '@/types/domains/us-types';

// Respond to messages from main thread
self.addEventListener('message', (event) => {
  // Normalize input data for consistent processing
  const normalizedInput = normalizeInputData(event.data);

  try {
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

  // Normalize file1Data
  const normalizedFile1Data = file1Data.map((entry) => {
    const normalized = { ...entry };
    if (normalized.npanxx.length === 7 && normalized.npanxx.startsWith('1')) {
      normalized.npanxx = normalized.npanxx.substring(1);
      normalized.npa = normalized.npanxx.substring(0, 3);
      normalized.nxx = normalized.npanxx.substring(3, 6);
    }
    return normalized;
  });

  // Normalize file2Data
  const normalizedFile2Data = file2Data.map((entry) => {
    const normalized = { ...entry };
    if (normalized.npanxx.length === 7 && normalized.npanxx.startsWith('1')) {
      normalized.npanxx = normalized.npanxx.substring(1);
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

  console.log(
    `[Comparison Worker] Processing comparison between ${fileName1} (${file1Data.length} records) and ${fileName2} (${file2Data.length} records)`
  );

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

  // Count matched and non-matched codes in chunks
  const file1Codes = new Set<string>();
  const file2Codes = new Set<string>();

  // Collect all codes from file1 in chunks
  for (let i = 0; i < file1Data.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, file1Data.length);
    const chunk = file1Data.slice(i, end);

    chunk.forEach((entry) => {
      file1Codes.add(entry.npanxx);
    });
  }

  // Collect all codes from file2 in chunks
  for (let i = 0; i < file2Data.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, file2Data.length);
    const chunk = file2Data.slice(i, end);

    chunk.forEach((entry) => {
      file2Codes.add(entry.npanxx);
    });
  }

  console.log(
    `[Comparison Worker] Found ${file1Codes.size} unique codes in file1 and ${file2Codes.size} unique codes in file2`
  );

  // Process matching in chunks
  let processedCount = 0;
  const file1CodesArray = Array.from(file1Codes);
  const totalCodes = file1CodesArray.length;

  for (let i = 0; i < totalCodes; i += chunkSize) {
    const end = Math.min(i + chunkSize, totalCodes);
    const codeChunk = file1CodesArray.slice(i, end);

    codeChunk.forEach((code) => {
      if (file2Codes.has(code)) {
        codeReport.matchedCodes++;

        // Compare rates for matched codes
        const entry1 = npanxxMap1.get(code)!;
        const entry2 = npanxxMap2.get(code)!;

        // Interstate comparison
        if (entry1.interRate > entry2.interRate) {
          pricingReport.comparison.totalHigher++;
        } else if (entry1.interRate < entry2.interRate) {
          pricingReport.comparison.totalLower++;
        } else {
          pricingReport.comparison.totalEqual++;
        }
      } else {
        codeReport.nonMatchedCodes++;
      }
    });

    processedCount += codeChunk.length;
    if (i + chunkSize < totalCodes) {
      console.log(
        `[Comparison Worker] Processed comparison for ${processedCount}/${totalCodes} codes`
      );
    }
  }

  // Check for codes in file2 that are not in file1
  const file2CodesArray = Array.from(file2Codes);
  for (let i = 0; i < file2CodesArray.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, file2CodesArray.length);
    const codeChunk = file2CodesArray.slice(i, end);

    codeChunk.forEach((code) => {
      if (!file1Codes.has(code)) {
        codeReport.nonMatchedCodes++;
      }
    });
  }

  // Calculate percentages
  const totalUniqueNpanxx = new Set([...file1Codes, ...file2Codes]).size;
  codeReport.matchedCodesPercentage = (codeReport.matchedCodes / totalUniqueNpanxx) * 100;
  codeReport.nonMatchedCodesPercentage = (codeReport.nonMatchedCodes / totalUniqueNpanxx) * 100;

  // Calculate coverage percentages (dummy values for now)
  codeReport.file1.coveragePercentage = (codeReport.file1.uniqueNPA / 1000) * 100; // Example
  codeReport.file2.coveragePercentage = (codeReport.file2.uniqueNPA / 1000) * 100; // Example

  return { pricingReport, codeReport };
}

// Helper functions for calculations
function calculateAverage(data: USStandardizedData[], rateType: keyof USStandardizedData): number {
  const validData = data.filter((d) => d[rateType] !== undefined && d[rateType] !== null);

  if (validData.length === 0) return 0;

  // Type assertion since we know these are numbers
  const sum = validData.reduce((acc, curr) => acc + (curr[rateType] as number), 0);
  return sum / validData.length;
}

function calculateMedian(data: USStandardizedData[], rateType: keyof USStandardizedData): number {
  const validRates = data
    .map((d) => d[rateType] as number)
    .filter((r) => r !== undefined && r !== null)
    .sort((a, b) => a - b);

  if (validRates.length === 0) return 0;

  const midPoint = Math.floor(validRates.length / 2);

  if (validRates.length % 2 === 0) {
    return (validRates[midPoint - 1] + validRates[midPoint]) / 2;
  } else {
    return validRates[midPoint];
  }
}

function calculateMin(data: USStandardizedData[], rateType: keyof USStandardizedData): number {
  // Filter for valid rates
  const validRates = data
    .map((d) => d[rateType] as number)
    .filter((r) => r !== undefined && r !== null && r > 0);

  if (validRates.length === 0) return 0;

  // Use loop instead of Math.min(...array) to avoid stack overflow
  let min = validRates[0];
  for (let i = 1; i < validRates.length; i++) {
    if (validRates[i] < min) {
      min = validRates[i];
    }
  }

  return min;
}

function calculateMax(data: USStandardizedData[], rateType: keyof USStandardizedData): number {
  const validRates = data
    .map((d) => d[rateType] as number)
    .filter((r) => r !== undefined && r !== null);

  if (validRates.length === 0) return 0;

  // Use loop instead of Math.max(...array) to avoid stack overflow
  let max = validRates[0];
  for (let i = 1; i < validRates.length; i++) {
    if (validRates[i] > max) {
      max = validRates[i];
    }
  }

  return max;
}

function calculatePercentageDifference(rate1: number, rate2: number): number {
  if (rate1 === 0 && rate2 === 0) return 0;
  if (rate2 === 0) return 100; // Avoid division by zero

  return ((rate1 - rate2) / rate2) * 100;
}
