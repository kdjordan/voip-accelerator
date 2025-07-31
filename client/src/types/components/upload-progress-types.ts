/**
 * Upload Progress Types - Real progress tracking for file uploads
 */

export interface UploadProgressCallback {
  /**
   * Called to update upload progress
   * @param progress - Progress percentage (0-100)
   * @param stage - Current processing stage
   * @param rowsProcessed - Number of rows processed so far
   * @param totalRows - Total number of rows (if known)
   */
  (progress: number, stage: UploadStage, rowsProcessed: number, totalRows?: number): void;
}

export enum UploadStage {
  PARSING = 'parsing',
  VALIDATING = 'validating', 
  STORING = 'storing',
  FINALIZING = 'finalizing'
}

export interface UploadProgressState {
  isUploading: boolean;
  progress: number;
  stage: UploadStage;
  rowsProcessed: number;
  totalRows?: number;
}

/**
 * Stage weights for calculating overall progress
 * These match the UploadProgressIndicator stages for compatibility
 */
export const UPLOAD_STAGE_WEIGHTS = {
  [UploadStage.PARSING]: 0.25,
  [UploadStage.VALIDATING]: 0.35,
  [UploadStage.STORING]: 0.35,
  [UploadStage.FINALIZING]: 0.05
} as const;