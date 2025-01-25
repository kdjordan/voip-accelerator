export interface LERGRecord {
  npanxx: string;
  state: string;
  npa: string;
  nxx: string;
}

export interface LERGProcessingResult {
  records: LERGRecord[];
  totalProcessed: number;
  errors: string[];
}

export interface LERGStats {
  totalRecords: number;
  lastUpdated: string | null;
}

// Column roles for LERG file processing
export const LERGColumnRole = {
  NPA: 'npa',
  NXX: 'nxx',
  STATE: 'state',
} as const;

export type LERGColumnRoleType = (typeof LERGColumnRole)[keyof typeof LERGColumnRole];
