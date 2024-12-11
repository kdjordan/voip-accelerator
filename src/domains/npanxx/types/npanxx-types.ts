import type { BaseStandardizedData } from '@/domains/shared/types';

export enum USColumnRole {
  NPA = 'npa',
  NXX = 'nxx',
  NPANXX = 'npanxx',
  InterRate = 'interRate',
  IntraRate = 'intraRate',
  IJRate = 'ijRate',
  SelectRole = '', // This will represent our "Select Column Role" option
}

export interface USStandardizedData extends BaseStandardizedData {
  npa: number;
  nxx: number;
  interRate: number;
  intraRate: number;
  ijRate: number;
}

export interface USReportPayload {
  fileName1: string;
  fileName2: string;
  file1Data: USStandardizedData[];
  file2Data: USStandardizedData[];
}

export interface USReportResponse {
  pricing: any; // TODO: Define proper pricing report type
  code: any; // TODO: Define proper code report type
}

// New types for reports
export interface USFileReport {
  fileName: string;
  totalNPANXX: number;
  uniqueNPA: number;
  uniqueNXX: number;
  coveragePercentage: number;
}

export interface USCodeReport {
  file1: USFileReport;
  file2: USFileReport;
  matchedCodes: number;
  nonMatchedCodes: number;
  matchedCodesPercentage: number;
  nonMatchedCodesPercentage: number;
}

export interface USPricingReport {
  file1: {
    fileName: string;
    averageInterRate: number;
    averageIntraRate: number;
    averageIJRate: number;
    medianInterRate: number;
    medianIntraRate: number;
    medianIJRate: number;
  };
  file2: {
    fileName: string;
    averageInterRate: number;
    averageIntraRate: number;
    averageIJRate: number;
    medianInterRate: number;
    medianIntraRate: number;
    medianIJRate: number;
  };
  comparison: {
    interRateDifference: number;
    intraRateDifference: number;
    ijRateDifference: number;
    totalHigher: number;
    totalLower: number;
    totalEqual: number;
  };
}



export const NPANXXRateType = {
  INTERSTATE: 'inter',
  INTRASTATE: 'intra',
  INDETERMINATE: 'ij',
} as const;

export type NPANXXRateType = (typeof NPANXXRateType)[keyof typeof NPANXXRateType];
