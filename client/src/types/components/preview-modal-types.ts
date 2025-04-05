import { USColumnRole } from '@/types/domains/us-types';
import { PreviewModalSource } from '@/types/constants/messages';

/**
 * Props for the PreviewModal component
 */
export interface PreviewModalProps {
  showModal: boolean;
  columns: string[];
  startLine: number;
  previewData: string[][];
  columnOptions: Array<{ value: string; label: string; required?: boolean }>;
  validateRequired?: boolean;
  source?: PreviewModalSource;
}

/**
 * Emits for the PreviewModal component
 */
export interface PreviewModalEmits {
  'update:mappings': [mappings: Record<string, string>];
  'update:valid': [isValid: boolean];
  'update:start-line': [startLine: number];
  'update:indeterminate-definition': [definition: string];
  confirm: [mappings: Record<string, string>, indeterminateDefinition?: string];
  cancel: [];
}
