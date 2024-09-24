// import {
//   type USComparisonReport,
//   type USConsolidatedData,
//   type USPricingReportInput,
//   type USNonMatchingCode,
//   type USStandardizedData
// } from '../../../types/app-types';

// self.addEventListener('message', (event) => {
//   const report: USComparisonReport = generateComparisonReport(event.data);
//   self.postMessage(report);
// });

// function generateComparisonReport(input: USPricingReportInput): USComparisonReport {
//   const { fileName1, fileName2, file1Data, file2Data } = input;

//   if (!fileName1 || !fileName2 || !file1Data || !file2Data) {
//     throw Error('Missing a file name or fileData in worker!');
//   }

//   const comparisonReport: USComparisonReport = {
//     higherRatesForFile1: [],
//     higherRatesForFile2: [],
//     sameRates: [],
//     nonMatchingCodes: [],
//     fileName1: fileName1,
//     fileName2: fileName2
//   };

//   const npanxxMapFile1 = new Map<string, USStandardizedData>();
//   const npanxxMapFile2 = new Map<string, USStandardizedData>();

//   file1Data.forEach(entry => {
//     const key = `${entry.npa}${entry.nxx}`;
//     npanxxMapFile1.set(key, entry);
//   });
//   file2Data.forEach(entry => {
//     const key = `${entry.npa}${entry.nxx}`;
//     npanxxMapFile2.set(key, entry);
//   });

//   npanxxMapFile1.forEach((value1, key) => {
//     if (npanxxMapFile2.has(key)) {
//       const value2 = npanxxMapFile2.get(key)!;
//       compareRates(value1, value2, key, comparisonReport, fileName1);
//       npanxxMapFile2.delete(key);
//     } else {
//       addNonMatchingCode(value1, key, fileName1, comparisonReport);
//     }
//   });

//   npanxxMapFile2.forEach((value, key) => {
//     addNonMatchingCode(value, key, fileName2, comparisonReport);
//   });

//   consolidateAndSortReport(comparisonReport);

//   return comparisonReport;
// }

// function compareRates(value1: USStandardizedData, value2: USStandardizedData, key: string, report: USComparisonReport, fileName1: string) {
//   const compareRatePair = (rate1: number, rate2: number, rateType: string) => {
//     const percentageDifference = calculatePercentageDifference(rate1, rate2);
//     const entry: USConsolidatedData = {
//       npanxx: key,
//       rateType,
//       rateFile1: rate1,
//       rateFile2: rate2,
//       percentageDifference
//     };

//     if (rate1 > rate2) {
//       report.higherRatesForFile1.push(entry);
//     } else if (rate1 < rate2) {
//       report.higherRatesForFile2.push(entry);
//     } else {
//       report.sameRates.push(entry);
//     }
//   };

//   compareRatePair(value1.interRate, value2.interRate, 'Inter');
//   compareRatePair(value1.intraRate, value2.intraRate, 'Intra');
//   compareRatePair(value1.ijRate, value2.ijRate, 'Indeterminate');
// }

// function addNonMatchingCode(value: USStandardizedData, key: string, fileName: string, report: USComparisonReport) {
//   const addNonMatching = (rate: number, rateType: string) => {
//     report.nonMatchingCodes.push({
//       npanxx: key,
//       rateType,
//       rate,
//       file: fileName
//     });
//   };

//   addNonMatching(value.interRate, 'Inter');
//   addNonMatching(value.intraRate, 'Intra');
//   addNonMatching(value.ijRate, 'Indeterminate');
// }

// function consolidateAndSortReport(report: USComparisonReport) {
//   const consolidateEntries = (entries: USConsolidatedData[]): USConsolidatedData[] => {
//     const groups = new Map<string, USConsolidatedData[]>();
//     entries.forEach(entry => {
//       const key = `${entry.npanxx}:${entry.rateType}:${entry.rateFile1}:${entry.rateFile2}`;
//       if (!groups.has(key)) {
//         groups.set(key, []);
//       }
//       groups.get(key)!.push(entry);
//     });

//     return Array.from(groups.values()).map(group => group[0]);
//   };

//   report.higherRatesForFile1 = consolidateEntries(report.higherRatesForFile1);
//   report.higherRatesForFile2 = consolidateEntries(report.higherRatesForFile2);
//   report.sameRates = consolidateEntries(report.sameRates);

//   report.higherRatesForFile1.sort((a, b) => b.percentageDifference - a.percentageDifference);
//   report.higherRatesForFile2.sort((a, b) => b.percentageDifference - a.percentageDifference);
// }

// function calculatePercentageDifference(rate1: number, rate2: number): number {
//   if (rate1 > rate2) {
//     return ((rate1 - rate2) / rate2) * 100;
//   } else {
//     return ((rate2 - rate1) / rate1) * 100;
//   }
// }

