export interface StandardizedData {
  destName: string;
  dialCode: string;
  rate: number;
}

export interface FileEmit {
  file: File;
  data: StandardizedData[];
}


export interface RateComparison {
  dialCode: string;
  destName: string;
  rateFile1: number;
  rateFile2: number;
  percentageDifference: number;
}

export interface ComparisonReport {
  higherRatesForFile1: RateComparison[];
  higherRatesForFile2: RateComparison[];
  sameRates: { [dialCode: string]: { destName: string; rateFile1: number; rateFile2: number } };
}
