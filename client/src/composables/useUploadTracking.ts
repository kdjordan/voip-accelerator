import { ref, computed, type Ref } from 'vue';
import { useUserStore } from '@/stores/user-store';
import { supabase } from '@/utils/supabase';

export type UploadType = 'rate_sheet' | 'comparison' | 'rate_deck' | 'bulk_adjustment';

interface UploadCheckResult {
  allowed: boolean;
  remaining: number | null;
  message: string;
  uploads_this_month: number;
  total_uploads: number;
  tier: string;
}

interface UploadIncrementResult {
  success: boolean;
  uploads_this_month: number;
  total_uploads: number;
  remaining: number | null;
  message: string;
}

interface UploadStatistics {
  uploads_this_month: number;
  total_uploads: number;
  upload_limit: number | null;
  percentage_used: number;
  tier: string;
  reset_date: string;
  days_until_reset: number;
}

interface UploadTrackingResponse {
  success: boolean;
  limitExceeded?: boolean;
  currentUploads?: number;
  uploadLimit?: number;
  remaining?: number;
  tier?: string;
  message?: string;
  upgradeRequired?: boolean;
  nextResetDate?: string;
  isUnlimited?: boolean;
}

export function useUploadTracking() {
  const userStore = useUserStore();
  const isTracking = ref(false);
  const trackingError = ref<string | null>(null);
  const lastCheck = ref<UploadCheckResult | null>(null);
  const statistics = ref<UploadStatistics | null>(null);
  
  // Get upload limit from environment variable (for Optimizer tier)
  const UPLOAD_LIMIT = import.meta.env.VITE_OPTIMIZER_UPLOAD_LIMIT 
    ? parseInt(import.meta.env.VITE_OPTIMIZER_UPLOAD_LIMIT) 
    : 100;
  
  // Get current tier and upload usage from user store
  const currentTier = computed(() => userStore.getSubscriptionTier || userStore.getTrialTier);
  const uploadUsage = computed(() => userStore.getUploadUsage);
  
  // Check if user can upload based on their tier
  const canUpload = computed(() => {
    if (!uploadUsage.value) return true;
    
    // Unlimited tiers
    if (currentTier.value === 'accelerator' || currentTier.value === 'enterprise') {
      return true;
    }
    
    // Optimizer tier - check limit
    if (currentTier.value === 'optimizer') {
      return uploadUsage.value.used < (uploadUsage.value.limit || 100);
    }
    
    return true;
  });
  
  const remainingUploads = computed(() => {
    if (!uploadUsage.value) return null;
    
    // Unlimited tiers
    if (currentTier.value === 'accelerator' || currentTier.value === 'enterprise') {
      return null; // null indicates unlimited
    }
    
    // Optimizer tier
    if (currentTier.value === 'optimizer') {
      const limit = uploadUsage.value.limit || 100;
      return Math.max(0, limit - uploadUsage.value.used);
    }
    
    return null;
  });
  
  /**
   * Check if user can upload files based on their tier and current usage
   * Uses new database function for accurate checking
   */
  async function checkUploadLimitAsync(): Promise<UploadCheckResult> {
    isTracking.value = true;
    trackingError.value = null;

    try {
      const userId = userStore.getUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .rpc('check_upload_limit', { p_user_id: userId })
        .single();

      if (error) throw error;

      lastCheck.value = data;
      return data;
    } catch (err: any) {
      console.error('Error checking upload limit:', err);
      trackingError.value = err.message || 'Failed to check upload limit';
      
      // Return a safe default that blocks uploads
      return {
        allowed: false,
        remaining: 0,
        message: 'Unable to verify upload limit. Please try again.',
        uploads_this_month: uploadUsage.value?.used || 0,
        total_uploads: 0,
        tier: currentTier.value || 'optimizer'
      };
    } finally {
      isTracking.value = false;
    }
  }

  /**
   * Increment upload count after successful file upload
   * Uses new database function for atomic increment
   */
  async function incrementUploadCount(fileCount: number = 1): Promise<UploadIncrementResult> {
    isTracking.value = true;
    trackingError.value = null;

    try {
      const userId = userStore.getUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .rpc('increment_upload_count', { 
          p_user_id: userId,
          p_file_count: fileCount 
        })
        .single();

      if (error) throw error;

      // Update local store with new values
      if (data.success && userStore.getUserProfile) {
        userStore.getUserProfile.uploads_this_month = data.uploads_this_month;
        
        // Update total_uploads if it exists on the profile
        if ('total_uploads' in userStore.getUserProfile) {
          (userStore.getUserProfile as any).total_uploads = data.total_uploads;
        }
      }

      return data;
    } catch (err: any) {
      console.error('Error incrementing upload count:', err);
      trackingError.value = err.message || 'Failed to track upload';
      
      // Return failure result
      return {
        success: false,
        uploads_this_month: uploadUsage.value?.used || 0,
        total_uploads: 0,
        remaining: remainingUploads.value,
        message: 'Failed to track upload'
      };
    } finally {
      isTracking.value = false;
    }
  }

  /**
   * Get detailed upload statistics for dashboard display
   */
  async function getUploadStatistics(): Promise<UploadStatistics | null> {
    try {
      const userId = userStore.getUser?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .rpc('get_upload_statistics', { p_user_id: userId })
        .single();

      if (error) throw error;

      statistics.value = data;
      return data;
    } catch (err: any) {
      console.error('Error getting upload statistics:', err);
      trackingError.value = err.message || 'Failed to get upload statistics';
      return null;
    }
  }

  /**
   * Pre-upload validation helper
   * Returns true if upload should proceed, false if blocked
   */
  async function validateBeforeUpload(fileCount: number = 1): Promise<{
    canUpload: boolean;
    message: string;
    remaining: number | null;
  }> {
    // For unlimited tiers, always allow
    if (currentTier.value === 'accelerator' || currentTier.value === 'enterprise') {
      return {
        canUpload: true,
        message: 'Unlimited uploads available',
        remaining: null
      };
    }

    // Check current limit
    const result = await checkUploadLimitAsync();
    
    if (!result.allowed) {
      return {
        canUpload: false,
        message: result.message,
        remaining: result.remaining
      };
    }

    // Check if this upload would exceed the limit
    if (result.remaining !== null && fileCount > result.remaining) {
      return {
        canUpload: false,
        message: `You can only upload ${result.remaining} more file(s) this month. You're trying to upload ${fileCount} file(s).`,
        remaining: result.remaining
      };
    }

    // Show warning if near limit
    if (result.remaining !== null && result.remaining <= 20) {
      return {
        canUpload: true,
        message: `Warning: Only ${result.remaining} uploads remaining this month`,
        remaining: result.remaining
      };
    }

    return {
      canUpload: true,
      message: '',
      remaining: result.remaining
    };
  }

  /**
   * Track an upload and check if it's within limits
   * @param uploadType - Type of upload being tracked
   * @param uploadCount - Number of uploads (default 1)
   * @returns Promise with tracking response
   * @deprecated Use incrementUploadCount instead for better database integration
   */
  async function trackUpload(
    uploadType: UploadType, 
    uploadCount: number = 1
  ): Promise<UploadTrackingResponse> {
    // Use the new increment function but return backwards-compatible response
    const result = await incrementUploadCount(uploadCount);
    
    return {
      success: result.success,
      limitExceeded: !result.success && result.remaining === 0,
      currentUploads: result.uploads_this_month,
      uploadLimit: currentTier.value === 'optimizer' ? UPLOAD_LIMIT : undefined,
      remaining: result.remaining || undefined,
      tier: currentTier.value || undefined,
      message: result.message,
      upgradeRequired: result.remaining === 0 && currentTier.value === 'optimizer',
      isUnlimited: currentTier.value === 'accelerator' || currentTier.value === 'enterprise'
    };
  }
  
  /**
   * Pre-check if an upload will exceed limits
   * @param uploadCount - Number of uploads to check
   * @returns boolean indicating if upload is allowed
   */
  function checkUploadLimit(uploadCount: number = 1): boolean {
    if (!uploadUsage.value) return true;
    
    // Unlimited tiers
    if (currentTier.value === 'accelerator' || currentTier.value === 'enterprise') {
      return true;
    }
    
    // Optimizer tier
    if (currentTier.value === 'optimizer') {
      const limit = uploadUsage.value.limit || 100;
      return (uploadUsage.value.used + uploadCount) <= limit;
    }
    
    return true;
  }
  
  /**
   * Get a user-friendly message about upload limits
   */
  function getUploadLimitMessage(): string {
    if (!uploadUsage.value) return '';
    
    // Unlimited tiers
    if (currentTier.value === 'accelerator' || currentTier.value === 'enterprise') {
      return 'Unlimited uploads available';
    }
    
    // Optimizer tier
    if (currentTier.value === 'optimizer') {
      const limit = uploadUsage.value.limit || 100;
      const used = uploadUsage.value.used;
      const remaining = limit - used;
      
      if (remaining <= 0) {
        return `Upload limit reached (${limit}/${limit}). Upgrade to Enterprise for unlimited uploads.`;
      } else if (remaining <= 20) {
        return `⚠️ Only ${remaining} uploads remaining this month`;
      } else {
        return `${remaining} uploads remaining this month`;
      }
    }
    
    return '';
  }
  
  /**
   * Helper to get user-friendly tier display name
   */
  function getTierDisplayName(tier: string | null): string {
    switch (tier) {
      case 'accelerator':
        return 'Accelerator';
      case 'optimizer':
        return 'Optimizer';
      case 'enterprise':
        return 'Enterprise';
      case 'trial':
        return 'Free Trial';
      default:
        return 'Basic';
    }
  }

  /**
   * Helper to format remaining uploads message
   */
  function formatRemainingMessage(): string {
    if (currentTier.value === 'accelerator' || currentTier.value === 'enterprise') {
      return 'Unlimited uploads';
    }
    
    const remaining = remainingUploads.value;
    if (remaining === null) return '';
    
    if (remaining === 0) {
      return 'Monthly upload limit reached';
    } else if (remaining <= 10) {
      return `⚠️ Only ${remaining} upload${remaining === 1 ? '' : 's'} remaining`;
    } else {
      return `${remaining} upload${remaining === 1 ? '' : 's'} remaining`;
    }
  }

  // Additional computed properties for Dashboard
  const uploadsThisMonth = computed(() => {
    return statistics.value?.uploadsThisMonth || uploadUsage.value?.used || 0;
  });

  const uploadsRemaining = computed(() => {
    return remainingUploads.value;
  });

  const percentageUsed = computed(() => {
    if (!uploadUsage.value) return 0;
    
    // For unlimited tiers, return 0
    if (currentTier.value === 'accelerator' || currentTier.value === 'enterprise') {
      return 0;
    }
    
    // For Optimizer tier
    if (currentTier.value === 'optimizer') {
      const limit = uploadUsage.value.limit || UPLOAD_LIMIT;
      const used = uploadUsage.value.used || 0;
      return Math.round((used / limit) * 100);
    }
    
    return 0;
  });

  const isUnlimited = computed(() => {
    return currentTier.value === 'accelerator' || currentTier.value === 'enterprise';
  });

  return {
    // State
    isTracking,
    trackingError,
    lastCheck,
    statistics,
    currentTier,
    uploadUsage,
    canUpload,
    remainingUploads,
    UPLOAD_LIMIT,
    
    // Dashboard specific computed properties
    uploadsThisMonth,
    uploadsRemaining,
    percentageUsed,
    isUnlimited,
    
    // Enhanced Methods (recommended)
    checkUploadLimitAsync,
    incrementUploadCount,
    getUploadStatistics,
    validateBeforeUpload,
    
    // Legacy Methods (backwards compatible)
    trackUpload,
    checkUploadLimit,
    getUploadLimitMessage,
    
    // Helpers
    getTierDisplayName,
    formatRemainingMessage
  };
}