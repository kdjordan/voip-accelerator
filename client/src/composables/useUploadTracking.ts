import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user-store';
import { supabase } from '@/utils/supabase';

export type UploadType = 'rate_sheet' | 'comparison' | 'rate_deck' | 'bulk_adjustment';

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
  
  // Get current tier and upload usage from user store
  const currentTier = computed(() => userStore.getSubscriptionTier || userStore.getTrialTier);
  const uploadUsage = computed(() => userStore.getUploadUsage);
  
  // Check if user can upload based on their tier
  const canUpload = computed(() => {
    if (!uploadUsage.value) return true;
    
    // Unlimited tiers
    if (currentTier.value === 'optimizer' || currentTier.value === 'enterprise') {
      return true;
    }
    
    // Accelerator tier - check limit
    if (currentTier.value === 'accelerator') {
      return uploadUsage.value.used < (uploadUsage.value.limit || 100);
    }
    
    return true;
  });
  
  const remainingUploads = computed(() => {
    if (!uploadUsage.value) return null;
    
    // Unlimited tiers
    if (currentTier.value === 'optimizer' || currentTier.value === 'enterprise') {
      return null; // null indicates unlimited
    }
    
    // Accelerator tier
    if (currentTier.value === 'accelerator') {
      const limit = uploadUsage.value.limit || 100;
      return Math.max(0, limit - uploadUsage.value.used);
    }
    
    return null;
  });
  
  /**
   * Track an upload and check if it's within limits
   * @param uploadType - Type of upload being tracked
   * @param uploadCount - Number of uploads (default 1)
   * @returns Promise with tracking response
   */
  async function trackUpload(
    uploadType: UploadType, 
    uploadCount: number = 1
  ): Promise<UploadTrackingResponse> {
    isTracking.value = true;
    trackingError.value = null;
    
    try {
      const { data, error } = await supabase.functions.invoke('track-upload', {
        body: { uploadType, uploadCount }
      });
      
      if (error) {
        throw error;
      }
      
      // Update local upload count if successful
      if (data?.success && uploadUsage.value) {
        // Refresh user profile to get updated counts
        await userStore.fetchUserProfile();
      }
      
      return data as UploadTrackingResponse;
      
    } catch (error: any) {
      console.error('Upload tracking error:', error);
      trackingError.value = error.message || 'Failed to track upload';
      
      // Return error response
      return {
        success: false,
        message: trackingError.value
      };
    } finally {
      isTracking.value = false;
    }
  }
  
  /**
   * Pre-check if an upload will exceed limits
   * @param uploadCount - Number of uploads to check
   * @returns boolean indicating if upload is allowed
   */
  function checkUploadLimit(uploadCount: number = 1): boolean {
    if (!uploadUsage.value) return true;
    
    // Unlimited tiers
    if (currentTier.value === 'optimizer' || currentTier.value === 'enterprise') {
      return true;
    }
    
    // Accelerator tier
    if (currentTier.value === 'accelerator') {
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
    if (currentTier.value === 'optimizer' || currentTier.value === 'enterprise') {
      return 'Unlimited uploads available';
    }
    
    // Accelerator tier
    if (currentTier.value === 'accelerator') {
      const limit = uploadUsage.value.limit || 100;
      const used = uploadUsage.value.used;
      const remaining = limit - used;
      
      if (remaining <= 0) {
        return `Upload limit reached (${limit}/${limit}). Upgrade to Optimizer for unlimited uploads.`;
      } else if (remaining <= 20) {
        return `⚠️ Only ${remaining} uploads remaining this month`;
      } else {
        return `${remaining} uploads remaining this month`;
      }
    }
    
    return '';
  }
  
  return {
    // State
    isTracking,
    trackingError,
    currentTier,
    uploadUsage,
    canUpload,
    remainingUploads,
    
    // Methods
    trackUpload,
    checkUploadLimit,
    getUploadLimitMessage
  };
}