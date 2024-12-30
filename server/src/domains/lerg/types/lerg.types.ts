export interface LERGRecord {
  npa: string;
  nxx: string;
  npanxx: string;
  state: string;
  last_updated: string;
}

export interface LERGUploadResponse {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errors?: string[];
}
