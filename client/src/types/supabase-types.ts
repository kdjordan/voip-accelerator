/**
 * Supabase data types for the VoIP Accelerator application
 */

/**
 * LERG Code data structure
 */
export interface LergCode {
  id: string;
  npa: string;
  state: string;
  country: string;
  last_updated: string;
}

/**
 * User metadata including role information
 */
export interface UserMetadata {
  role?: 'user' | 'admin';
}

/**
 * Standard Supabase response format for data operations
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * LERG data statistics returned by getLergMeta
 */
export interface LergMetadata {
  count: number;
  last_updated: string | null;
  version?: string;
}

/**
 * Supabase Database Tables
 */
export type Tables = {
  lerg_codes: LergCode;
  // Add other tables as they are created
};

/**
 * Role definitions
 */
export const Roles = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
