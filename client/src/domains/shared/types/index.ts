export * from './csv-types';
export * from './user-types';
export * from './app-types';

export type DataType = DBName.AZ | DBName.US | DBName.CAN;

// First, let's define our store interface
export interface DomainStore<P, C> {
  // State properties
  files: {
    [key: string]: string;
  };
  reportsGenerated: boolean;
  showUploadComponents: boolean;
  activeReportType: ReportType;
  codeReport: C | null;
  pricingReport: P | null;

  // Getters
  isFull: boolean;
  getFileNames: string[];
  getPricingReport: P | null;

  // Methods
  addFileUploaded(componentName: string, fileName: string): void;
  setActiveReportType(type: ReportType): void;
  setReports(pricing: P, code: C): void;
  isComponentDisabled(componentName: string): boolean;
}

export type DomainStoreType = ReturnType<typeof useAzStore> | ReturnType<typeof useUsStore>;
