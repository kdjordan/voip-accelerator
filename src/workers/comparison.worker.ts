import { type ComparisonReport, type StandardizedData, type RateComparison, type ConsolidatedData, type NonMatchingCode } from './../../types/app-types';
type DialCodeMap = Map<number, { destName: string; rate: number }>;

// Respond to messages from main thread
self.addEventListener('message', (event) => {
  const { file1, file2 } = event.data;


  // Process comparison and generate report
  const report: ComparisonReport = generateComparisonReport(file1, file2);

  // Send the generated report back to the main thread
  self.postMessage(report);
});

function generateComparisonReport(file1: any[], file2: any[]): ComparisonReport {
  const comparisonReport: ComparisonReport = {
    higherRatesForFile1: [],
    higherRatesForFile2: [],
    sameRates: [],
    nonMatchingCodes: []
  };

  const dialCodeMapFile1 = new Map<number, { destName: string; rate: number }>();
  const dialCodeMapFile2 = new Map<number, { destName: string; rate: number }>();

  file1.forEach(entry => {
    dialCodeMapFile1.set(entry.dialCode, { destName: entry.destName, rate: entry.rate });
  });
  file2.forEach(entry => {
    dialCodeMapFile2.set(entry.dialCode, { destName: entry.destName, rate: entry.rate });
  });

  const tempComparisons: RateComparison[] = [];

  dialCodeMapFile1.forEach((value1, key1) => {
    if (dialCodeMapFile2.has(key1)) {
      const value2 = dialCodeMapFile2.get(key1)!;
      const percentageDifference = calculatePercentageDifference(value1.rate, value2.rate);
      tempComparisons.push({
        dialCode: key1,
        destName: value1.destName,
        rateFile1: value1.rate,
        rateFile2: value2.rate,
        percentageDifference: percentageDifference,
      });
      dialCodeMapFile2.delete(key1);
    } else {
      comparisonReport.nonMatchingCodes.push({
        dialCode: key1,
        destName: value1.destName,
        rate: value1.rate,
        file: 'file1'
      });
    }
  });

  dialCodeMapFile2.forEach((value, key) => {
    comparisonReport.nonMatchingCodes.push({
      dialCode: key,
      destName: value.destName,
      rate: value.rate,
      file: 'file2'
    });
  });

  const consolidateEntries = (entries: RateComparison[]): ConsolidatedData[] => {
    const groups = new Map<string, RateComparison[]>();
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

  comparisonReport.higherRatesForFile1 = consolidateEntries(tempComparisons.filter(entry => entry.percentageDifference > 0));
  comparisonReport.higherRatesForFile2 = consolidateEntries(tempComparisons.filter(entry => entry.percentageDifference < 0));
  comparisonReport.sameRates = consolidateEntries(tempComparisons.filter(entry => entry.percentageDifference === 0));

  return comparisonReport;
}


function consolidateDialCodes(group: RateComparison[]): ConsolidatedData {
  const { destName, rateFile1, rateFile2, percentageDifference } = group[0];
  const dialCodes = new Set(group.map(row => row.dialCode));
  return {
    destName,
    rateFile1,
    rateFile2,
    dialCode: Array.from(dialCodes).join(','),
    percentageDifference,
  };
}

function calculatePercentageDifference(rate1: number, rate2: number): number {
  return ((rate1 - rate2) / rate2) * 100;
}

