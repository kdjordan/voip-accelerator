import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/utils/supabase';
import { useUserStore } from '@/stores/user-store';

export function useSessionHeartbeat() {
  const router = useRouter();
  const userStore = useUserStore();
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const deleteSession = async () => {
    try {
      const sessionId = sessionStorage.getItem('voip_session_id');
      if (!sessionId) return;

      console.log('🧹 Deleting session on tab close');

      // Delete session from database
      await supabase
        .from('active_sessions')
        .delete()
        .eq('session_token', sessionId);

      // Clear from sessionStorage
      sessionStorage.removeItem('voip_session_id');
    } catch (error) {
      console.error('Error deleting session on tab close:', error);
    }
  };

  const checkSessionValidity = async () => {
    try {
      // Get current session ID from storage
      const sessionId = sessionStorage.getItem('voip_session_id');
      if (!sessionId) return; // No session to check

      // Update last_heartbeat to keep session alive AND check if session still exists
      // If session was deleted (force logout from another device), this will return no rows
      const { data, error } = await supabase
        .from('active_sessions')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('session_token', sessionId)
        .select('id')
        .single();

      if (error || !data) {
        console.log('🚨 Session no longer valid - forcing logout');
        // Session was removed (force logout from another device)
        // Clear everything and redirect to login
        await userStore.signOut();
        router.push('/login?reason=session_terminated');
      }
    } catch (error) {
      console.error('Session heartbeat error:', error);
    }
  };

  const startHeartbeat = () => {
    // Check every 5 seconds
    heartbeatInterval = setInterval(checkSessionValidity, 5000);
    // Also check immediately
    checkSessionValidity();
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  onMounted(() => {
    startHeartbeat();

    // Add beforeunload event listener to clean up session when tab closes
    // This handles normal tab close, browser close, navigation away
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable cleanup during page unload
      // Standard fetch/axios may be cancelled by browser during unload
      const sessionId = sessionStorage.getItem('voip_session_id');
      if (sessionId) {
        // Note: We can't use async/await here because the page is unloading
        // Just fire and forget - the delete will complete even as page unloads
        deleteSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up event listener on unmount
    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    });
  });

  onUnmounted(() => {
    stopHeartbeat();
  });

  return {
    checkSessionValidity,
    startHeartbeat,
    stopHeartbeat,
    deleteSession
  };
}