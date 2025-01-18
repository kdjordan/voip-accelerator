export interface LergApiServiceType {
  testConnection(): Promise<boolean>;
  getStats(): Promise<LERGStats>;
  uploadLERGFile(formData: FormData): Promise<any>;
}

export interface LERGStats {
  totalRecords: number;
  lastUpdated: Date;
  specialCodes?: {
    totalCodes: number;
    countryBreakdown: {
      countryCode: string;
      count: number;
    }[];
  };
}

export interface LERGUploadResponse {
  processedRecords: number;
  totalRecords: number;
}
