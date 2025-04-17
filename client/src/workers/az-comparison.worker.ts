import type {
  AZReportsInput,
  AzPricingReport,
  AzCodeReport,
  ConsolidatedData,
  NonMatchingCode,
  AZDetailedComparisonEntry,
} from '@/types/domains/az-types';
// type DialCodeMap = Map<number, { destName: string; rate: number }>;

// Respond to messages from main thread
self.addEventListener('message', (event) => {
  // Process comparison and generate reports
  const { pricingReport, codeReport, detailedComparisonData } = generateReports(event.data);

  // Send the generated reports back to the main thread
  // NOTE: We might not need pricingReport anymore if all data is in detailedComparisonData + codeReport
  // For now, keep sending it but its nonMatchingCodes will be empty.
  self.postMessage({ pricingReport, codeReport, detailedComparisonData });
});

function generateReports(input: AZReportsInput): {
  pricingReport: AzPricingReport;
  codeReport: AzCodeReport;
  detailedComparisonData: AZDetailedComparisonEntry[];
} {
  const { fileName1, fileName2, file1Data, file2Data } = input;

  if (!fileName1 || !fileName2 || !file1Data || !file2Data) {
    throw new Error('Missing a file name or fileData in worker !!');
  }

  const pricingReport: AzPricingReport = {
    fileName1,
    fileName2,
    higherRatesForFile1: [],
    higherRatesForFile2: [],
    sameRates: [],
    nonMatchingCodes: [], // This will remain empty now
  };

  // Initialize detailed comparison data array
  const detailedComparisonData: AZDetailedComparisonEntry[] = [];

  // --- Refactored Logic Start ---

  // Create maps for quick lookup
  const dialCodeMapFile1 = new Map<string, { destName: string; rate: number }>();
  file1Data.forEach((entry) => {
    dialCodeMapFile1.set(entry.dialCode, { destName: entry.destName, rate: Number(entry.rate) });
  });

  const dialCodeMapFile2 = new Map<string, { destName: string; rate: number }>();
  file2Data.forEach((entry) => {
    dialCodeMapFile2.set(entry.dialCode, { destName: entry.destName, rate: Number(entry.rate) });
  });

  // Get all unique dial codes from both files
  const allDialCodes = new Set([...dialCodeMapFile1.keys(), ...dialCodeMapFile2.keys()]);

  let matchedCodesCount = 0;
  let nonMatchedCodesCount = 0; // Count of codes present in only one file

  for (const dialCode of allDialCodes) {
    const entry1 = dialCodeMapFile1.get(dialCode);
    const entry2 = dialCodeMapFile2.get(dialCode);

    if (entry1 && entry2) {
      // Code exists in both files
      matchedCodesCount++;
      const diff = entry2.rate - entry1.rate; // rate2 - rate1
      const diffPercent = calculatePercentageDifference(entry1.rate, entry2.rate);
      let cheaperFile: 'file1' | 'file2' | 'same';
      if (entry1.rate < entry2.rate) {
        cheaperFile = 'file1';
      } else if (entry2.rate < entry1.rate) {
        cheaperFile = 'file2';
      } else {
        cheaperFile = 'same';
      }

      detailedComparisonData.push({
        dialCode,
        rate1: entry1.rate,
        rate2: entry2.rate,
        diff,
        destName1: entry1.destName,
        destName2: entry2.destName,
        matchStatus: 'both',
        cheaperFile, // Add calculated value
        diffPercent, // Add calculated value
      });

      // Populate summary report (optional, could be derived later)
      const consolidatedEntry: ConsolidatedData = {
        dialCode,
        destName: entry1.destName,
        rateFile1: entry1.rate,
        rateFile2: entry2.rate,
        percentageDifference: diffPercent, // Use calculated diffPercent here too
      };
      if (cheaperFile === 'file1') {
        // Use cheaperFile for summary logic
        pricingReport.higherRatesForFile2.push(consolidatedEntry); // file1 is cheaper -> sell opportunity (higher rate in file2)
      } else if (cheaperFile === 'file2') {
        pricingReport.higherRatesForFile1.push(consolidatedEntry); // file2 is cheaper -> buy opportunity (higher rate in file1)
      } else {
        pricingReport.sameRates.push(consolidatedEntry);
      }
    } else if (entry1) {
      // Code exists only in file 1
      nonMatchedCodesCount++;
      detailedComparisonData.push({
        dialCode,
        rate1: entry1.rate,
        destName1: entry1.destName,
        matchStatus: 'file1_only',
        // cheaperFile, diff, diffPercent are implicitly undefined
      });
    } else if (entry2) {
      // Code exists only in file 2
      nonMatchedCodesCount++;
      detailedComparisonData.push({
        dialCode,
        rate2: entry2.rate,
        destName2: entry2.destName,
        matchStatus: 'file2_only',
        // cheaperFile, diff, diffPercent are implicitly undefined
      });
    }
  }

  // --- Refactored Logic End ---

  // --- Update Code Report ---
  const codeReport: AzCodeReport = {
    file1: {
      fileName: fileName1,
      totalCodes: file1Data.length, // Total rows
      totalDestinations: new Set(file1Data.map((d) => d.destName)).size,
      uniqueDestinationsPercentage: 0, // Calculate below
    },
    file2: {
      fileName: fileName2,
      totalCodes: file2Data.length, // Total rows
      totalDestinations: new Set(file2Data.map((d) => d.destName)).size,
      uniqueDestinationsPercentage: 0, // Calculate below
    },
    matchedCodes: matchedCodesCount,
    nonMatchedCodes: nonMatchedCodesCount, // Codes unique to one file
    matchedCodesPercentage: 0, // Calculate below
    nonMatchedCodesPercentage: 0, // Calculate below
  };

  // Calculate percentages for Code Report
  codeReport.file1.uniqueDestinationsPercentage =
    codeReport.file1.totalCodes > 0
      ? (codeReport.file1.totalDestinations / codeReport.file1.totalCodes) * 100
      : 0;
  codeReport.file2.uniqueDestinationsPercentage =
    codeReport.file2.totalCodes > 0
      ? (codeReport.file2.totalDestinations / codeReport.file2.totalCodes) * 100
      : 0;

  const totalUniqueDialCodes = allDialCodes.size;
  if (totalUniqueDialCodes > 0) {
    codeReport.matchedCodesPercentage = (matchedCodesCount / totalUniqueDialCodes) * 100;
    // Non-matched percentage based on total unique codes might be confusing.
    // Let's stick to counts or calculate based on potential matches?
    // Sticking to counts for now.
    codeReport.nonMatchedCodesPercentage = (nonMatchedCodesCount / totalUniqueDialCodes) * 100;
  }
  // --- End Code Report Update ---

  // Consolidate and sort summary reports (still needed if we keep the summary view)
  pricingReport.higherRatesForFile1 = consolidateEntries(pricingReport.higherRatesForFile1);
  pricingReport.higherRatesForFile2 = consolidateEntries(pricingReport.higherRatesForFile2);
  pricingReport.sameRates = consolidateEntries(pricingReport.sameRates);
  // pricingReport.nonMatchingCodes = []; // Already initialized as empty

  pricingReport.higherRatesForFile1.sort((a, b) => b.percentageDifference - a.percentageDifference);
  pricingReport.higherRatesForFile2.sort((a, b) => b.percentageDifference - a.percentageDifference);

  return { pricingReport, codeReport, detailedComparisonData };
}

function consolidateDialCodes(group: ConsolidatedData[]): ConsolidatedData {
  const { destName, rateFile1, rateFile2, percentageDifference } = group[0];
  const dialCodes = new Set(group.map((row) => row.dialCode));
  return {
    destName,
    rateFile1,
    rateFile2,
    dialCode: Array.from(dialCodes).join(', '),
    percentageDifference,
  };
}

function calculatePercentageDifference(rate1: number, rate2: number): number {
  if (rate1 > rate2) {
    return ((rate1 - rate2) / rate2) * 100;
  } else {
    return ((rate2 - rate1) / rate1) * 100;
  }
}

function consolidateEntries(entries: ConsolidatedData[]): ConsolidatedData[] {
  const groups = new Map<string, ConsolidatedData[]>();
  entries.forEach((entry) => {
    const key = `${entry.destName}:${entry.rateFile1}:${entry.rateFile2}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(entry);
  });

  const consolidatedEntries: ConsolidatedData[] = [];
  groups.forEach((group) => {
    consolidatedEntries.push(consolidateDialCodes(group));
  });

  return consolidatedEntries;
}
