import { ref } from 'vue';
import { supabase } from '@/utils/supabase';

interface SessionInfo {
  id: string;
  sessionId: string;
  createdAt: string;
  lastHeartbeat: string;
  userAgent: string;
  ipAddress: string;
  browserInfo: any;
}

interface SessionCheckResponse {
  hasConflict: boolean;
  existingSession?: SessionInfo;
  message: string;
}

interface DeviceInfo {
  userAgent: string;
  ipAddress?: string;
  browserInfo: {
    browser: string;
    os: string;
    device: string;
  };
}

export function useSessionManagement() {
  const isCheckingSession = ref(false);
  const sessionConflict = ref<SessionInfo | null>(null);

  // Generate a unique session ID for this browser session
  const generateSessionId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  };

  // Get or create session ID for this browser session
  const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('voip_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('voip_session_id', sessionId);
    }
    return sessionId;
  };

  // Get device information
  const getDeviceInfo = (): DeviceInfo => {
    const userAgent = navigator.userAgent;
    
    // Parse browser info
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Parse OS info
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    // Parse device type
    let device = 'Desktop';
    if (userAgent.includes('Mobile')) device = 'Mobile';
    else if (userAgent.includes('Tablet')) device = 'Tablet';
    
    return {
      userAgent,
      browserInfo: {
        browser,
        os,
        device
      }
    };
  };

  // Check for existing sessions
  const checkSession = async (): Promise<SessionCheckResponse> => {
    isCheckingSession.value = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const sessionId = getSessionId();
      const deviceInfo = getDeviceInfo();

      // Use the REAL edge function now
      const response = await supabase.functions.invoke('check-session', {
        body: {
          sessionId,
          deviceInfo
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data as SessionCheckResponse;
      
      if (result.hasConflict && result.existingSession) {
        sessionConflict.value = result.existingSession;
      } else {
        sessionConflict.value = null;
      }
      
      return result;
    } catch (error) {
      console.error('Session check error:', error);
      throw error;
    } finally {
      isCheckingSession.value = false;
    }
  };

  // Force logout other sessions and create new one
  const forceLogout = async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const newSessionId = generateSessionId();
      sessionStorage.setItem('voip_session_id', newSessionId);
      const deviceInfo = getDeviceInfo();

      console.log('🔄 Calling force-logout edge function...');

      // Let Supabase handle auth automatically (like other working functions)
      const response = await supabase.functions.invoke('force-logout', {
        body: {
          newSessionId,
          deviceInfo
        }
      });

      console.log('📡 Edge function response:', response);

      if (response.error) {
        console.error('❌ Edge function returned error:', response.error);
        throw response.error;
      }

      if (!response.data?.success) {
        console.error('❌ Edge function failed:', response.data);
        throw new Error(response.data?.error || 'Failed to force logout');
      }

      console.log('✅ Force logout successful!');
      sessionConflict.value = null;
    } catch (error) {
      console.error('💥 Force logout error:', error);
      throw error;
    }
  };


  // Format session info for display
  const formatSessionInfo = (session: SessionInfo): string => {
    const info = session.browserInfo || {};
    const browser = info.browser || 'Unknown Browser';
    const os = info.os || 'Unknown OS';
    const device = info.device || 'Unknown Device';
    
    const lastActive = new Date(session.lastHeartbeat);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 60000);
    
    let activeText = 'Just now';
    if (diffMinutes > 0 && diffMinutes < 60) {
      activeText = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffMinutes >= 60) {
      const hours = Math.floor(diffMinutes / 60);
      activeText = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    return `${browser} on ${os} (${device}) - Last active: ${activeText}`;
  };

  return {
    isCheckingSession,
    sessionConflict,
    checkSession,
    forceLogout,
    formatSessionInfo,
    getSessionId
  };
}