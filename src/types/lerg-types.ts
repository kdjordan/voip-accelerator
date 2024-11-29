export interface LergEntry {
  country: string;
  npanxx: number;
}

export interface LergLoadingStatus {
  isLoading: boolean;
  progress: number;
  error: LergError | null;
  lastUpdated: Date | null;
}

// Define error structure
export interface LergError {
  code: string;
  message: string;
  details?: unknown;
}

// Base message interface
interface WorkerBaseMessage {
  type: string;
}

// Input message types
export interface ProcessMessage extends WorkerBaseMessage {
  type: 'process';
  csvContent: string;
  chunkSize?: number;
}

export type LergWorkerMessage = ProcessMessage;

// Output message types
interface ProgressMessage extends WorkerBaseMessage {
  type: 'progress';
  progress: number;
}

interface CompleteMessage extends WorkerBaseMessage {
  type: 'complete';
  data: LergEntry[];
}

interface ErrorMessage extends WorkerBaseMessage {
  type: 'error';
  error: LergError;
}

export type LergWorkerResponse = ProgressMessage | CompleteMessage | ErrorMessage;
