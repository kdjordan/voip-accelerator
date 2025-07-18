import type { User } from '@supabase/supabase-js';

// User Tiers
export const PlanTier = {
  TRIAL: 'trial',
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
} as const;

export type PlanTierType = (typeof PlanTier)[keyof typeof PlanTier];

// Feature Limits
export interface PlanLimits {
  maxRateDeckSize: number;
  maxCDRSize: number;
  maxStorageGB: number;
  maxComparisonsPerDay: number;
}

// Features available per plan
export interface PlanFeatures {
  unlimitedUploads: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  cdrProcessing: boolean;
  rateDeckBuilder: boolean;
  batchProcessing: boolean;
  exportFormats: string[];
}

// User information
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  planTier: PlanTierType;
  lastLoggedIn: Date;
  createdAt: Date;
}

// User state
export interface UserState {
  info: UserInfo | null;
  currentPlan: PlanTierType;
  features: PlanFeatures;
  limits: PlanLimits;
  sideNavOpen: boolean;
  usage?: {
    uploadsToday: number;
    storageUsed: number;
    comparisonsToday: number;
  };
}

export interface Profile {
  id: string; // UUID
  updated_at: string; // timestamptz
  username: string; // text
  full_name: string; // text
  avatar_url: string; // text
  website: string; // text
  role: 'user' | 'admin' | 'superadmin'; // text, 'user', 'admin', or 'superadmin'
  company: string; // text
  billing_address: any; // jsonb
  payment_method: any; // jsonb
  // Billing fields
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: 'trial' | 'monthly' | 'annual' | 'cancelled';
  plan_expires_at?: string | null;
  trial_started_at?: string | null;
}

// Keep Supabase User type for reference in store
export type { User };
