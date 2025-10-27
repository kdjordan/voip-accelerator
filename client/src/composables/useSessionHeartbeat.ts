import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/utils/supabase';
import { useUserStore } from '@/stores/user-store';

export function useSessionHeartbeat() {
  const router = useRouter();
  const userStore = useUserStore();
  let heartbeatInterval: NodeJS.Timeout | null = null;

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
        router.push('/auth/sign-in?reason=session_terminated');
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
  });

  onUnmounted(() => {
    stopHeartbeat();
  });

  return {
    checkSessionValidity,
    startHeartbeat,
    stopHeartbeat
  };
}