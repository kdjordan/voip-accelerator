import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('pre-login-check function started');
    
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

    // Verify the JWT token to get user ID
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

    // Check for ANY existing active sessions for this user
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

    console.log('Found existing sessions:', existingSessions?.length || 0);

    // If there are ANY active sessions, check if they're stale before showing conflict
    if (existingSessions && existingSessions.length > 0) {
      const mostRecentSession = existingSessions[0];

      // Check if session is stale (last heartbeat > 30 seconds ago)
      // This handles cases where beforeunload didn't fire (browser crash, force quit, etc.)
      const lastHeartbeat = new Date(mostRecentSession.last_heartbeat);
      const now = new Date();
      const timeSinceHeartbeat = (now.getTime() - lastHeartbeat.getTime()) / 1000; // seconds

      if (timeSinceHeartbeat > 30) {
        console.log('Session is stale (no heartbeat for', timeSinceHeartbeat, 'seconds) - auto-deleting');

        // Delete stale session
        await supabase
          .from('active_sessions')
          .delete()
          .eq('id', mostRecentSession.id);

        // No conflict - stale session was cleaned up
        console.log('Stale session deleted - safe to login');
        return new Response(JSON.stringify({
          hasConflict: false,
          message: 'Stale session cleaned up'
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Session is active (recent heartbeat) - this is a real conflict
      console.log('Conflict found! User already has active session');
      return new Response(JSON.stringify({
        hasConflict: true,
        existingSession: {
          id: mostRecentSession.id,
          sessionId: mostRecentSession.session_token,
          createdAt: mostRecentSession.created_at,
          lastHeartbeat: mostRecentSession.last_heartbeat,
          userAgent: mostRecentSession.user_agent,
          ipAddress: mostRecentSession.ip_address,
          browserInfo: mostRecentSession.browser_info
        },
        message: 'You are already logged in on another device'
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('No existing sessions found - safe to login');
    return new Response(JSON.stringify({
      hasConflict: false,
      message: 'No existing sessions found'
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      error: 'An unexpected error occurred. Please try again.'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});