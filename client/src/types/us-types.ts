import type { BaseStandardizedData } from '@/types';

// Core data structure
export interface USStandardizedData extends BaseStandardizedData {
  npanxx: string;
  npa: string;
  nxx: string;
  interRate: number;
  intraRate: number;
  indetermRate: number;
}

// Rate type constants
export const NPANXXRateType = {
  INTERSTATE: 'interstate',
  INTRASTATE: 'intrastate',
  INDETERMINATE: 'indeterminate',
} as const;

export type NPANXXRateType = (typeof NPANXXRateType)[keyof typeof NPANXXRateType];

// Column roles for CSV mapping
export const USColumnRole = {
  NPA: 'npa',
  NXX: 'nxx',
  NPANXX: 'npanxx',
  INTERSTATE: 'interRate',
  INTRASTATE: 'intraRate',
  INDETERMINATE: 'ijRate',
  SELECT: '',
} as const;

export type USColumnRole = (typeof USColumnRole)[keyof typeof USColumnRole];

// Rate comparison result
export interface RateComparison {
  type: NPANXXRateType;
  difference: number;
  isHigher: boolean;
  isEqual: boolean;
}

// Rate statistics
export interface RateStats {
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

// Enhanced report types
export interface USFileReport {
  fileName: string;
  totalNPANXX: number;
  uniqueNPA: number;
  uniqueNXX: number;
  coveragePercentage: number;
  rateStats: {
    [key in NPANXXRateType]: RateStats;
  };
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
