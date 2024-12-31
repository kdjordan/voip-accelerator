export interface LERGStats {
  totalRecords: number;
  lastUpdated: Date | null;
}

export interface LERGRecord {
  npa: string;
  nxx: string;
  npanxx: string;
  state: string;
  last_updated: Date;
}

export interface LERGUploadResponse {
  processedRecords: number;
  totalRecords: number;
}
