import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('check-session function started');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('About to authenticate user');

    // Verify the JWT token to get user ID - EXACTLY like track-upload
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const user = userData.user;
    console.log('User authenticated:', user.id);

    // Get request body
    const { sessionId, deviceInfo } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Checking for existing sessions for user:', user.id);

    // Check for existing active sessions for this user
    const { data: existingSessions, error: sessionError } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (sessionError) {
      console.error('Session query error:', sessionError);
      return new Response(JSON.stringify({ error: 'Failed to check sessions' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found sessions:', existingSessions?.length || 0);

    // If there are multiple active sessions, that means there's a conflict
    if (existingSessions && existingSessions.length > 1) {
      // Find the OTHER session (not the current one)
      const conflictingSession = existingSessions.find(s => s.session_token !== sessionId);
      
      if (conflictingSession) {
        console.log('Conflict found! Multiple sessions detected. Current:', sessionId, 'Conflicting:', conflictingSession.session_token);
        return new Response(JSON.stringify({
          hasConflict: true,
          existingSession: {
            id: conflictingSession.id,
            sessionId: conflictingSession.session_token,
            createdAt: conflictingSession.created_at,
            lastHeartbeat: conflictingSession.last_heartbeat,
            userAgent: conflictingSession.user_agent,
            ipAddress: conflictingSession.ip_address,
            browserInfo: conflictingSession.browser_info
          },
          message: 'You are already logged in on another device'
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    console.log('No conflicts found');
    return new Response(JSON.stringify({
      hasConflict: false,
      message: 'Session validated successfully'
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});