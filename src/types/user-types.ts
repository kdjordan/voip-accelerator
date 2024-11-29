export enum PlanTier {
    FREE = 'free',
    PRO = 'pro',
  }
  
  export interface PlanFeatures {
    unlimitedUploads: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
  }
  
  export interface UserInfo {
    email: string;
    username: string;
    planTier: PlanTier;
    lastLoggedIn: Date | null;
  }
  
  export interface UserState {
    info: UserInfo | null;
    currentPlan: PlanTier;
    features: PlanFeatures;
    sideNavOpen: boolean;
  }
  
  export type FileUpload = {
    dbName: string;
    fileName: string;
  };
  
  export type UploadedFileTracker = Map<string, FileUpload>;