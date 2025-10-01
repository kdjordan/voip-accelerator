import { ref } from 'vue';
import { useUserStore } from '@/stores/user-store';
import { supabase } from '@/utils/supabase';

// Simplified upload tracking for analytics only (no limits)
interface UploadIncrementResult {
  success: boolean;
  total_uploads: number;
  message: string;
}

export function useUploadTracking() {
  const userStore = useUserStore();
  const isTracking = ref(false);
  const trackingError = ref<string | null>(null);
  
  /**
   * Increment upload count after successful file upload
   * Simplified: No limit checking, just analytics
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

      // Update local store with new total_uploads value
      if (data.success && userStore.getUserProfile) {
        (userStore.getUserProfile as any).total_uploads = data.total_uploads;
      }

      return data;
    } catch (err: any) {
      console.error('Error incrementing upload count:', err);
      trackingError.value = err.message || 'Failed to track upload';

      // Return failure result (non-blocking - analytics only)
      return {
        success: false,
        total_uploads: 0,
        message: 'Failed to track upload'
      };
    } finally {
      isTracking.value = false;
    }
  }

  return {
    // State
    isTracking,
    trackingError,

    // Methods
    incrementUploadCount,
  };
}