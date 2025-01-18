import type { BaseStandardizedData } from '@/types';

export interface AZStandardizedData extends BaseStandardizedData {
  destName: string;
  dialCode: number;
  rate: number;
}

export const AZColumnRole = {
  DESTINATION: 'destName',
  DIALCODE: 'dialCode',
  RATE: 'rate',
  SELECT: '',  // For "Select Column Role" option
} as const;

export type AZColumnRole = typeof AZColumnRole[keyof typeof AZColumnRole];

export interface AZReportsInput {
  fileName1: string;
  fileName2: string;
  file1Data: AZStandardizedData[];
  file2Data: AZStandardizedData[];
}

export interface AzPricingReport {
  higherRatesForFile1: ConsolidatedData[];
  higherRatesForFile2: ConsolidatedData[];
  sameRates: ConsolidatedData[];
  nonMatchingCodes: NonMatchingCode[];
  fileName1: string;
  fileName2: string;
}

export interface AzCodeReport {
  file1: {
    fileName: string;
    totalCodes: number;
    totalDestinations: number;
    uniqueDestinationsPercentage: number;
  };
  file2: {
    fileName: string;
    totalCodes: number;
    totalDestinations: number;
    uniqueDestinationsPercentage: number;
  };
  matchedCodes: number;
  nonMatchedCodes: number;
  matchedCodesPercentage: number;
  nonMatchedCodesPercentage: number;
}

export interface ConsolidatedData {
  dialCode: string;
  destName: string;
  rateFile1: number;
  rateFile2: number;
  percentageDifference: number;
}

export interface NonMatchingCode {
  dialCode: string;
  destName: string;
  rate: number;
  file: string;
}
