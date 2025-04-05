/**
 * Component identifiers for file upload components
 */
export type ComponentId = 'az1' | 'az2' | 'us1' | 'us2';

/**
 * State for file upload components
 */
export interface FileUploadState {
  isGeneratingReports: boolean;
  showPreviewModal: boolean;
  previewData: string[][];
  columns: string[];
  startLine: number;
  activeComponent: ComponentId;
  isModalValid: boolean;
  columnMappings: Record<string, string>;
  uploadError: Record<ComponentId, string | null>;
}

/**
 * Preview state for file uploads
 */
export interface PreviewState {
  data: string[][];
  columns: string[];
  startLine: number;
  indeterminateRateDefinition?: string;
}
