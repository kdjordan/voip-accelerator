// Base service interface
export interface BaseService {
  initialize(): Promise<void>;
}

// Generic API interfaces
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface APIService {
  get<T>(url: string): Promise<APIResponse<T>>;
  post<T>(url: string, data: unknown): Promise<APIResponse<T>>;
  put<T>(url: string, data: unknown): Promise<APIResponse<T>>;
  delete(url: string): Promise<APIResponse<void>>;
}

// Generic database interfaces
export interface DatabaseConfig {
  name: string;
  version: number;
  stores: Record<string, string>;
}

export interface DatabaseService {
  connect(config: DatabaseConfig): Promise<void>;
  disconnect(): Promise<void>;
  clear(): Promise<void>;
}
