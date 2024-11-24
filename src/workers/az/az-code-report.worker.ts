import { AZReportsInput, AZCodeReport } from '../../types/app-types';

self.addEventListener('message', (event) => {
  const report: AZCodeReport = generateCodeReport(event.data);
  self.postMessage(report);
});

function generateCodeReport(input: AZReportsInput): AZCodeReport {
  const { fileName1, fileName2, file1Data, file2Data } = input;

  if (!fileName1 || !fileName2 || !file1Data || !file2Data) {
    throw Error('Missing file name or fileData in worker!');
  }

  const totalCodes1 = file1Data.length;
  const totalCodes2 = file2Data.length;
  const totalUniqueCodesSet = new Set([...file1Data.map(entry => entry.dialCode), ...file2Data.map(entry => entry.dialCode)]);
  const totalUniqueCodes = totalUniqueCodesSet.size;

  const matchedCodes = file1Data.filter(entry1 => 
    file2Data.some(entry2 => entry2.dialCode === entry1.dialCode)
  ).length;

  const percentageMatched = (matchedCodes / totalUniqueCodes) * 100;

  return {
    fileName1,
    fileName2,
    totalCodesFile1: totalCodes1,
    totalCodesFile2: totalCodes2,
    totalUniqueCodes,
    matchedCodes,
    percentageMatched: parseFloat(percentageMatched.toFixed(2)),
    nonMatchedCodes: totalUniqueCodes - matchedCodes,
    percentageNonMatched: parseFloat((100 - percentageMatched).toFixed(2))
  };
}
