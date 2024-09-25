import {
  type AzPricingReport,
  type ConsolidatedData,
  type AZReportsInput,
  type NonMatchingCode
} from '../../../types/app-types';
// type DialCodeMap = Map<number, { destName: string; rate: number }>;

// Respond to messages from main thread
self.addEventListener('message', (event) => {
  
  // Process comparison and generate report
  const report: AzPricingReport = generateComparisonReport(event.data);

  // Send the generated report back to the main thread
  self.postMessage(report);
});

function generateComparisonReport(input: AZReportsInput): AzPricingReport {
  const { fileName1, fileName2, file1Data, file2Data } = input

  if (!fileName1 || !fileName2 || !file1Data || !file2Data) {
    throw Error('Missing a file name or fileData in worker !!')
  }

  const comparisonReport: AzPricingReport = {
    higherRatesForFile1: [],
    higherRatesForFile2: [],
    sameRates: [],
    nonMatchingCodes: [],
    fileName1: fileName1,
    fileName2: fileName2

    
  };

  const dialCodeMapFile1 = new Map<number, { destName: string; rate: number }>();
  const dialCodeMapFile2 = new Map<number, { destName: string; rate: number }>();

  file1Data.forEach(entry => {
    dialCodeMapFile1.set(entry.dialCode, { destName: entry.destName, rate: entry.rate });
  });
  file2Data.forEach(entry => {
    dialCodeMapFile2.set(entry.dialCode, { destName: entry.destName, rate: entry.rate });
  });

  dialCodeMapFile1.forEach((value1, key1) => {
    if (dialCodeMapFile2.has(key1)) {
      const value2 = dialCodeMapFile2.get(key1)!;
      const percentageDifference = calculatePercentageDifference(value1.rate, value2.rate);
  
      if (value1.rate > value2.rate) {
        comparisonReport.higherRatesForFile1.push({
          dialCode: `${key1}`,
          destName: value1.destName,
          rateFile1: value1.rate,
          rateFile2: value2.rate,
          percentageDifference: percentageDifference
        });
      } else if (value1.rate < value2.rate) {
        comparisonReport.higherRatesForFile2.push({
          dialCode: `${key1}`,
          destName: value1.destName,
          rateFile1: value1.rate,
          rateFile2: value2.rate,
          percentageDifference: percentageDifference
        });
      } else if (value1.rate === value2.rate) {
        comparisonReport.sameRates.push({
          dialCode: `${key1}`,
          destName: value1.destName,
          rateFile1: value1.rate,
          rateFile2: value2.rate,
          percentageDifference: 0
        });
      } else {
      comparisonReport.nonMatchingCodes.push({
        dialCode: `${key1}`,
        destName: value1.destName,
        rate: value1.rate,
        file: fileName1
      });
      dialCodeMapFile2.delete(key1);
     }
    }
  });
  
  dialCodeMapFile2.forEach((value, key) => {
    comparisonReport.nonMatchingCodes.push({
      dialCode: `${key}`,
      destName: value.destName,
      rate: value.rate,
      file: fileName2
    });
  });

  const consolidateEntries = (entries: ConsolidatedData[]): ConsolidatedData[] => {
    const groups = new Map<string, ConsolidatedData[]>();
    entries.forEach(entry => {
      const key = `${entry.destName}:${entry.rateFile1}:${entry.rateFile2}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });

    const consolidatedEntries: ConsolidatedData[] = [];
    groups.forEach(group => {
      consolidatedEntries.push(consolidateDialCodes(group));
    });

    return consolidatedEntries;
  };

  comparisonReport.higherRatesForFile1 = consolidateEntries(comparisonReport.higherRatesForFile1);
  comparisonReport.higherRatesForFile2 = consolidateEntries(comparisonReport.higherRatesForFile2);
  comparisonReport.sameRates = consolidateEntries(comparisonReport.sameRates);
  comparisonReport.nonMatchingCodes = consolidateNonMatchingEntries(comparisonReport.nonMatchingCodes);
  //sort report descending
  comparisonReport.higherRatesForFile1.sort((a, b) => b.percentageDifference - a.percentageDifference);
  comparisonReport.higherRatesForFile2.sort((a, b) => b.percentageDifference - a.percentageDifference);

  return comparisonReport;
}

function consolidateDialCodesForNonMatching(group: NonMatchingCode[]): NonMatchingCode {
  const consolidatedDialCode = group.map(entry => entry.dialCode).join(", ");
  const { destName, rate, file } = group[0]; // Assuming all entries in the group have the same destName, rate, and file.
  return { dialCode: consolidatedDialCode, destName, rate, file };
};

function consolidateNonMatchingEntries(entries: NonMatchingCode[]): NonMatchingCode[] {
  const groups = new Map<string, NonMatchingCode[]>();
  entries.forEach(entry => {
    const key = `${entry.destName}:${entry.rate}:${entry.file}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(entry);
  });

  const consolidatedEntries: NonMatchingCode[] = [];
  groups.forEach(group => {
    consolidatedEntries.push(consolidateDialCodesForNonMatching(group));
  });

  return consolidatedEntries;
};


function consolidateDialCodes(group: ConsolidatedData[]): ConsolidatedData {
  const { destName, rateFile1, rateFile2, percentageDifference } = group[0];
  const dialCodes = new Set(group.map(row => row.dialCode));
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

