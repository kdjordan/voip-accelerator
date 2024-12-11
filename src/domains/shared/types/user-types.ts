// User Tiers
export const PlanTier = {
  FREE: 'free',
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
