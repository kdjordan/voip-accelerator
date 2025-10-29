import type { User } from '@supabase/supabase-js';

// Simplified Plan System - Single Accelerator Plan
export const PlanTier = {
  TRIAL: 'trial',
  ACTIVE: 'active',
} as const;

export type PlanTierType = 'trial' | 'active';

// Billing Period Types
export type BillingPeriod = 'monthly' | 'annual' | 'test' | null;

// Simplified Plan - All users get same features (unlimited)
export interface PlanInfo {
  name: string;
  billingPeriod: BillingPeriod;
  price: number;
  priceId: string;
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
  sideNavOpen: boolean;
}

export interface Profile {
  id: string; // UUID
  updated_at: string; // timestamptz
  username: string; // text
  full_name: string; // text
  avatar_url: string; // text
  website: string; // text
  role: 'user' | 'admin'; // Simplified: removed super_admin
  company: string; // text
  billing_address: any; // jsonb
  payment_method: any; // jsonb
  email?: string; // Add email field

  // Billing fields (simplified single-plan system)
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'canceled' | 'incomplete';
  billing_period?: BillingPeriod; // Monthly or Annual

  // Plan timing
  plan_expires_at?: string | null;
  current_period_end?: string | null;
  trial_started_at?: string | null;

  // Cancellation tracking
  cancel_at_period_end?: boolean;
  cancel_at?: string | null;
  canceled_at?: string | null;

  // Upload tracking (admin analytics only, hidden from users)
  total_uploads?: number;
}

// Keep Supabase User type for reference in store
export type { User };
