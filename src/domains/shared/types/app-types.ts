import type { AZStandardizedData } from '@/domains/az/types/az-types';
import type { USStandardizedData } from '@/domains/npanxx/types/npanxx-types';

// Base interface for all standardized data
export interface BaseStandardizedData {
  id?: number;
}

export interface FileEmit {
  file: File;
  data: StandardizedData[];
}

export interface ParsedResults {
  data: string[][];
}

// Union type of all possible standardized data types
export type StandardizedData = AZStandardizedData | USStandardizedData;

// Replace enum with const object pattern
export const PlanTier = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const;

// Type for the PlanTier values
export type PlanTierType = typeof PlanTier[keyof typeof PlanTier];

// User-related interfaces
export interface UserPlan {
  tier: PlanTierType;
  features: string[];
  limits?: {
    uploads?: number;
    storage?: number;
  };
}

export interface DataTransformer<T> {
  transform(row: Record<string, string>, columnRoles: string[]): T;
  validate(data: T): boolean;
}