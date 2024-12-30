export interface LergApiServiceType {
  testConnection(): Promise<boolean>;
  getStats(): Promise<LERGStats>;
  uploadLERGFile(formData: FormData): Promise<any>;
}
