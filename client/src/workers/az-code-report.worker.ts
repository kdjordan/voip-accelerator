import type { AZReportsInput, AzCodeReport } from '@/types/';

self.addEventListener('message', event => {
  const report: AzCodeReport = generateCodeReport(event.data);
  self.postMessage(report);
});

function generateCodeReport(input: AZReportsInput): AzCodeReport {
  const { fileName1, fileName2, file1Data, file2Data } = input;

  if (!fileName1 || !fileName2 || !file1Data || !file2Data) {
    throw Error('Missing file name or fileData in worker!');
  }

  const codes1Set = new Set(file1Data.map(entry => entry.dialCode));
  const codes2Set = new Set(file2Data.map(entry => entry.dialCode));

  const destinations1Set = new Set(file1Data.map(entry => entry.destName));
  const destinations2Set = new Set(file2Data.map(entry => entry.destName));

  const matchedCodes = [...codes1Set].filter(code => codes2Set.has(code)).length;

  const totalUniqueCodes = new Set([...codes1Set, ...codes2Set]).size;

  const nonMatchedCodes = totalUniqueCodes - matchedCodes;

  const matchedCodesPercentage = (matchedCodes / totalUniqueCodes) * 100;
  const nonMatchedCodesPercentage = (nonMatchedCodes / totalUniqueCodes) * 100;

  return {
    file1: {
      fileName: fileName1,
      totalCodes: file1Data.length,
      totalDestinations: destinations1Set.size,
      uniqueDestinationsPercentage: (destinations1Set.size / file1Data.length) * 100
    },
    file2: {
      fileName: fileName2,
      totalCodes: file2Data.length,
      totalDestinations: destinations2Set.size,
      uniqueDestinationsPercentage: (destinations2Set.size / file2Data.length) * 100
    },
    matchedCodes,
    nonMatchedCodes,
    matchedCodesPercentage: parseFloat(matchedCodesPercentage.toFixed(2)),
    nonMatchedCodesPercentage: parseFloat(nonMatchedCodesPercentage.toFixed(2))
  };
}
