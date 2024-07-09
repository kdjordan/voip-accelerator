// comparison.worker.ts
import { type ComparisonReport } from '../../types/app-types';

// Respond to messages from main thread
self.addEventListener('message', (event) => {
  const { file1, file2 } = event.data;


  // Process comparison and generate report
  const report: ComparisonReport = generateComparisonReport(file1, file2);

  // Send the generated report back to the main thread
  self.postMessage(report);
});

// Function to generate the comparison report
function generateComparisonReport(file1: any[], file2: any[]): ComparisonReport {
  const comparisonReport: ComparisonReport = {
    higherRatesForFile1: [],
    higherRatesForFile2: [],
    sameRates: {},
    nonMatchingCodes: []
  };

  // Mapping dialCode entries of file2 for quick lookup
  const dialCodeMapFile1 = new Map<number, { destName: string; rate: number }>();
  file1.forEach(entry => {
    dialCodeMapFile1.set(entry.dialCode, { destName: entry.destName, rate: entry.rate });
  });

  const dialCodeMapFile2 = new Map<number, { destName: string; rate: number }>();
  file2.forEach(entry => {
    dialCodeMapFile2.set(entry.dialCode, { destName: entry.destName, rate: entry.rate });
  });

  // Process file1 entries

  dialCodeMapFile1.forEach((valueFile1, keyFile1) => {

    if (dialCodeMapFile2.has(keyFile1)) {

      const file2Entry = dialCodeMapFile2.get(keyFile1)!;
      if (valueFile1.rate > file2Entry.rate) {
        const percentageDifference = calculatePercentageDifference(valueFile1.rate, file2Entry.rate);
        comparisonReport.higherRatesForFile1.push({
          dialCode: keyFile1,
          destName: valueFile1.destName,
          rateFile1: valueFile1.rate,
          rateFile2: file2Entry.rate,
          percentageDifference
        })
      } else if (valueFile1.rate < file2Entry.rate) {
        const percentageDifference = calculatePercentageDifference(file2Entry.rate, valueFile1.rate,);
        comparisonReport.higherRatesForFile1.push({
          dialCode: keyFile1,
          destName: valueFile1.destName,
          rateFile1: valueFile1.rate,
          rateFile2: file2Entry.rate,
          percentageDifference
        });
      } else if (valueFile1.rate === file2Entry.rate) {
        comparisonReport.sameRates[keyFile1] = {
          destName: valueFile1.destName,
          rateFile1: valueFile1.rate,
          rateFile2: file2Entry.rate
        };
      }

      // Remove from map to track remaining non-matching codes in file2
      dialCodeMapFile2.delete(keyFile1);
    } else {
      comparisonReport.nonMatchingCodes.push({
        dialCode: keyFile1,
        destName: valueFile1.destName,
        rate: valueFile1.rate,
        file: 'file1'
      });
    }
  });

  // Process remaining entries in file2 not found in file1
  dialCodeMapFile2.forEach((value, key) => {
    comparisonReport.nonMatchingCodes.push({
      dialCode: key,
      destName: value.destName,
      rate: value.rate,
      file: 'file2'
    });
  });

  // Sort higherRatesForFile1 and higherRatesForFile2 by percentageDifference in descending order
  comparisonReport.higherRatesForFile1.sort((a, b) => b.percentageDifference - a.percentageDifference);
  comparisonReport.higherRatesForFile2.sort((a, b) => b.percentageDifference - a.percentageDifference);
  
  return comparisonReport;
}

// Function to calculate percentage difference
function calculatePercentageDifference(rate1: number, rate2: number): number {
  return ((rate1 - rate2) / rate2) * 100;
}
