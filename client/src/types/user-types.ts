import type { User } from '@supabase/supabase-js';

// User Tiers
export const PlanTier = {
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
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
  id: string; // UUID, references auth.users.id
  created_at: string; // timestamp with timezone
  updated_at?: string | null; // timestamp with timezone
  role: 'user' | 'admin'; // text, 'user' or 'admin'
  trial_ends_at?: string | null; // timestamp with timezone
  user_agent?: string | null; // text
  signup_method?: 'email' | 'google' | string | null; // text (allow others for future)
  stripe_customer_id?: string | null; // text
  subscription_status?: string | null; // text
}

// Keep Supabase User type for reference in store
export type { User };
