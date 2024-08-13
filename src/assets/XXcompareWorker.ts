import { type StandardizedData } from "../../types/app-types";

self.onmessage = function(event) {
  if (event.data.type === 'start') {
    const { data1, data2 } = event.data;
    const comparisonResults = compareData(data1, data2);
    self.postMessage({ type: 'result', data: comparisonResults });
  }
};

function compareData(data1: StandardizedData[], data2: StandardizedData[]) {
  const higherRatesForFile1: StandardizedData[] = [];
  const higherRatesForFile2: StandardizedData[] = [];
  const sameRates: StandardizedData[] = [];
  const nonMatchingCodes: StandardizedData[] = [];

  const data2Map = new Map(data2.map((item) => [item.dialCode, item]));

  data1.forEach((row1) => {
    const row2 = data2Map.get(row1.dialCode);
    if (row2) {
      if (row1.rate > row2.rate) {
        higherRatesForFile1.push(row1);
      } else if (row1.rate < row2.rate) {
        higherRatesForFile2.push(row2);
      } else {
        sameRates.push(row1);
      }
    } else {
      nonMatchingCodes.push(row1);
    }
  });

  data2.forEach((row2) => {
    if (!data2Map.has(row2.dialCode)) {
      nonMatchingCodes.push(row2);
    }
  });

  return {
    higherRatesForFile1,
    higherRatesForFile2,
    sameRates,
    nonMatchingCodes
  };
}