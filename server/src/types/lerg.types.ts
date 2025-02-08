export interface LERGStats {
  totalRecords: number;
  lastUpdated: Date;
}

export interface LERGRecord {
  npa: string;
  state: string;
  country: string;
  last_updated?: Date;
}

export interface LERGUploadResponse {
  processedRecords: number;
  totalRecords: number;
}
