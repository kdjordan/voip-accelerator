import type { User } from '@supabase/supabase-js';

// User Tiers - Updated for Three-Tier System
export const PlanTier = {
  TRIAL: 'trial',
  ACCELERATOR: 'accelerator',
  OPTIMIZER: 'optimizer', 
  ENTERPRISE: 'enterprise',
  // Legacy support
  MONTHLY: 'optimizer', // Map legacy monthly to optimizer
  ANNUAL: 'optimizer',  // Map legacy annual to optimizer
} as const;

export type PlanTierType = 'trial' | 'accelerator' | 'optimizer' | 'enterprise' | 'monthly' | 'annual';

// Subscription Tier Types (new)
export type SubscriptionTier = 'accelerator' | 'optimizer' | 'enterprise';

// Plan Selection Types
export interface TierOption {
  id: SubscriptionTier;
  name: string;
  price: number;
  priceId: string;
  description: string;
  features: string[];
  uploadLimit?: number;
  seats: number;
  popular?: boolean;
}

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
  role: 'user' | 'admin' | 'super_admin'; // Updated to match database
  company: string; // text
  billing_address: any; // jsonb
  payment_method: any; // jsonb
  
  // Billing fields (updated for three-tier system)
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'canceled' | 'incomplete';
  subscription_tier?: SubscriptionTier | null; // The user's current tier (optimizer/accelerator/enterprise)
  
  // Plan timing
  plan_expires_at?: string | null;
  current_period_end?: string | null;
  trial_started_at?: string | null;
  
  // Cancellation tracking
  cancel_at_period_end?: boolean;
  cancel_at?: string | null;
  canceled_at?: string | null;
  
  // Upload tracking (for Accelerator tier)
  uploads_this_month?: number;
  uploads_reset_date?: string | null;
  
  // Organization support (for Enterprise)
  organization_id?: string | null;
  email?: string; // Add email field
}

// Keep Supabase User type for reference in store
export type { User };
