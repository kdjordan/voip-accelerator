import { ComparisonReport, StandardizedData, RateComparison, NonMatchingCode } from '@/types/app-types';

interface WorkerMessageData {
  type: string;
  data?: [string, StandardizedData][];
}

let map1Chunks: [string, StandardizedData][] = [];
let map2Chunks: [string, StandardizedData][] = [];

self.onmessage = function (event: MessageEvent<WorkerMessageData>) {
  try {
    if (event.data.type === 'start') {
      map1Chunks = [];
      map2Chunks = [];
      self.postMessage({ type: 'ready' });
    } else if (event.data.type === 'map1Chunk') {
      map1Chunks.push(...event.data.data!);
    } else if (event.data.type === 'map2Chunk') {
      map2Chunks.push(...event.data.data!);
    } else if (event.data.type === 'done') {
      const map1Data = map1Chunks;
      const map2Data = map2Chunks;

      const comparisonReport: ComparisonReport = {
        higherRatesForFile1: [],
        higherRatesForFile2: [],
        sameRates: {},
        nonMatchingCodes: [],
      };

      const map1 = new Map<string, StandardizedData>(map1Data);
      const map2 = new Map<string, StandardizedData>(map2Data);

      map1.forEach((file1Data: StandardizedData, dialCode: string) => {
        const file2Data = map2.get(dialCode);
        if (file2Data) {
          const rate1 = file1Data.rate;
          const rate2 = file2Data.rate;

          if (rate1 > rate2) {
            comparisonReport.higherRatesForFile1.push({
              dialCode: dialCode,
              destName: file1Data.destName,
              rateFile1: rate1,
              rateFile2: rate2,
              percentageDifference: calculatePercentageDifference(rate1, rate2),
            });
          } else if (rate2 > rate1) {
            comparisonReport.higherRatesForFile2.push({
              dialCode: dialCode,
              destName: file1Data.destName,
              rateFile1: rate1,
              rateFile2: rate2,
              percentageDifference: calculatePercentageDifference(rate2, rate1),
            });
          } else {
            comparisonReport.sameRates[dialCode] = {
              destName: file1Data.destName,
              rateFile1: rate1,
              rateFile2: rate2,
            };
          }
        } else {
          comparisonReport.nonMatchingCodes.push({
            dialCode: dialCode,
            destName: file1Data.destName,
            rate: file1Data.rate,
            file: 'file1',
          });
        }
      });

      map2.forEach((file2Data: StandardizedData, dialCode: string) => {
        if (!map1.has(dialCode)) {
          comparisonReport.nonMatchingCodes.push({
            dialCode: dialCode,
            destName: file2Data.destName,
            rate: file2Data.rate,
            file: 'file2',
          });
        }
      });

      comparisonReport.higherRatesForFile1.sort(
        (a: RateComparison, b: RateComparison) => b.percentageDifference - a.percentageDifference
      );

      comparisonReport.higherRatesForFile2.sort(
        (a: RateComparison, b: RateComparison) => b.percentageDifference - a.percentageDifference
      );

      self.postMessage({ type: 'result', data: comparisonReport });
    }
  } catch (error: any) {
    console.error('Worker processing error:', error);
    self.postMessage({ type: 'error', data: error.message });
  }
};

function calculatePercentageDifference(rate1: number, rate2: number): number {
  return ((rate1 - rate2) / ((rate1 + rate2) / 2)) * 100;
}
