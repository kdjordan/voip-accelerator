import type { User } from '@supabase/supabase-js';

// User information
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  lastLoggedIn: Date;
  createdAt: Date;
}

// User state
export interface UserState {
  info: UserInfo | null;
  sideNavOpen: boolean;
}

export interface Profile {
  id: string;
  updated_at: string;
  username: string;
  full_name: string;
  avatar_url: string;
  website: string;
  role: 'user' | 'admin';
  company: string;
  billing_address: any;
  payment_method: any;
  email?: string;
}

// Keep Supabase User type for reference in store
export type { User };
