// comparison.worker.ts
import { type ComparisonReport } from '../../types/app-types';

// Define interfaces
// export interface RateComparison {
//   dialCode: string;
//   destName: string;
//   rateFile1: number;
//   rateFile2: number;
//   percentageDifference: number;
// }

// export interface ComparisonReport {
//   higherRatesForFile1: RateComparison[];
//   higherRatesForFile2: RateComparison[];
//   sameRates: { [dialCode: string]: { destName: string; rateFile1: number; rateFile2: number } };
//   nonMatchingCodes: NonMatchingCode[];
// }

// export interface NonMatchingCode {
//   dialCode: string;
//   destName: string;
//   rate: number;
//   file: 'file1' | 'file2';
// }

// Respond to messages from main thread
self.addEventListener('message', (event) => {
  console.log('got the data')
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
  const dialCodeMapFile2 = new Map<string, { destName: string; rate: number }>();
  file2.forEach(entry => {
    dialCodeMapFile2.set(entry.dialCode.toString(), { destName: entry.destName, rate: entry.rate });
  });

  // Process file1 entries
  file1.forEach(entry => {
    const dialCode = entry.dialCode.toString();
    if (dialCodeMapFile2.has(dialCode)) {
      const file2Entry = dialCodeMapFile2.get(dialCode)!;
      const percentageDifference = calculatePercentageDifference(entry.rate, file2Entry.rate);

      if (entry.rate > file2Entry.rate) {
        comparisonReport.higherRatesForFile1.push({
          dialCode,
          destName: entry.destName,
          rateFile1: entry.rate,
          rateFile2: file2Entry.rate,
          percentageDifference
        });
      } else if (entry.rate < file2Entry.rate) {
        comparisonReport.higherRatesForFile2.push({
          dialCode,
          destName: entry.destName,
          rateFile1: entry.rate,
          rateFile2: file2Entry.rate,
          percentageDifference
        });
      } else {
        comparisonReport.sameRates[dialCode] = {
          destName: entry.destName,
          rateFile1: entry.rate,
          rateFile2: file2Entry.rate
        };
      }

      // Remove from map to track remaining non-matching codes in file2
      // dialCodeMapFile2.delete(dialCode);
    } else {
      comparisonReport.nonMatchingCodes.push({
        dialCode,
        destName: entry.destName,
        rate: entry.rate,
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

  return comparisonReport;
}

// Function to calculate percentage difference
function calculatePercentageDifference(rate1: number, rate2: number): number {
  return ((rate1 - rate2) / rate2) * 100;
}
