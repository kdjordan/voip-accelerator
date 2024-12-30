export interface LERGRecord {
  npa: string;
  nxx: string;
  lata: string;
  ocn: string;
  company: string;
  state: string;
  rate_center: string;
  switch_clli: string;
}

export interface LERGUploadResponse {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errors?: string[];
} 