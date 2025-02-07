export interface LERGStats {
  totalRecords: number;
  lastUpdated: Date;
  specialCodes?: SpecialCodesStats;
}

export interface LERGRecord {
  npa: string;
  nxx: string;
  npanxx: string;
  state: string;
  country: string;
  last_updated?: Date;
}

export interface LERGUploadResponse {
  processedRecords: number;
  totalRecords: number;
}

export interface SpecialCodesStats {
  totalCodes: number;
  countryBreakdown: {
    countryCode: string;
    count: number;
  }[];
}

export interface SpecialCode {
  npa: string;
  country: string;
  province_or_territory: string;
}

export interface CSVRow {
  NPA: string;
  Country: string;
  'Province or Territory': string;
}

export interface SpecialCodeRecord {
  npa: string;
  country: string;
  province: string | null;
}
