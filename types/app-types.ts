export interface StandardizedData {
  destName: string;
  dialCode: string;
  rate: number;
}

export interface FileEmit {
  file: File;
  data: StandardizedData[];
}

export interface ComparisonReport {
  higherRatesForFile1: {
    [dialCode: string]: {
      dialCode: string;
      destName: string;
      rateFile1: number;
      rateFile2: number;
      percentageDifference: number;
    };
  };
  higherRatesForFile2: {
    [dialCode: string]: {
      dialCode: string;
      destName: string;
      rateFile1: number;
      rateFile2: number;
      percentageDifference: number;
    };
  };
  sameRates: {
    [dialCode: string]: {
      destName: string;
      rateFile1: number;
      rateFile2: number;
    };
  };
}
