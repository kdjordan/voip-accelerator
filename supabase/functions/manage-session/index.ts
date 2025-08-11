import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionRequest {
  action: 'validate' | 'heartbeat' | 'terminate';
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  browserInfo?: any;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Parse request body
    const body: SessionRequest = await req.json();
    const { action, sessionId, userAgent, ipAddress, browserInfo } = body;

    console.log(`🔐 Session management - User: ${user.email}, Action: ${action}, SessionId: ${sessionId}`);

    // Get user profile to check subscription tier
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_tier, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to get user profile: ${profileError.message}`);
    }

    const isEnterprise = profile.subscription_tier === 'enterprise';

    switch (action) {
      case 'validate': {
        // Check for existing sessions if not Enterprise
        if (!isEnterprise) {
          const { data: existingSessions, error: sessionError } = await supabaseClient
            .from('active_sessions')
            .select('id, session_id, created_at, last_heartbeat, user_agent, ip_address')
            .eq('user_id', user.id)
            .gt('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

          if (sessionError) {
            throw new Error(`Failed to check existing sessions: ${sessionError.message}`);
          }

          // If there are active sessions and this is a new session ID
          const currentSession = existingSessions?.find(s => s.session_id === sessionId);
          const otherSessions = existingSessions?.filter(s => s.session_id !== sessionId) || [];

          if (otherSessions.length > 0) {
            // For non-Enterprise users, force logout other sessions
            console.log(`🚨 Multiple sessions detected for non-Enterprise user. Terminating ${otherSessions.length} other sessions.`);
            
            await supabaseClient
              .from('active_sessions')
              .delete()
              .eq('user_id', user.id)
              .neq('session_id', sessionId);

            return new Response(
              JSON.stringify({
                success: true,
                sessionConflict: true,
                message: 'Other sessions terminated. You can continue.',
                conflictDetails: {
                  terminatedSessions: otherSessions.length,
                  sessions: otherSessions.map(s => ({
                    createdAt: s.created_at,
                    lastSeen: s.last_heartbeat,
                    userAgent: s.user_agent,
                    ipAddress: s.ip_address
                  }))
                }
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              }
            );
          }
        }

        // Create or update session record
        const { error: upsertError } = await supabaseClient
          .from('active_sessions')
          .upsert({
            user_id: user.id,
            session_id: sessionId,
            last_heartbeat: new Date().toISOString(),
            user_agent: userAgent,
            ip_address: ipAddress,
            browser_info: browserInfo
          }, {
            onConflict: 'session_id'
          });

        if (upsertError) {
          throw new Error(`Failed to create session: ${upsertError.message}`);
        }

        console.log(`✅ Session validated for ${isEnterprise ? 'Enterprise' : 'Individual'} user`);
        
        return new Response(
          JSON.stringify({
            success: true,
            sessionConflict: false,
            message: 'Session validated successfully',
            isEnterprise,
            allowMultipleSessions: isEnterprise
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'heartbeat': {
        // Update heartbeat timestamp
        const { error: updateError } = await supabaseClient
          .from('active_sessions')
          .update({ last_heartbeat: new Date().toISOString() })
          .eq('session_id', sessionId)
          .eq('user_id', user.id);

        if (updateError) {
          throw new Error(`Failed to update heartbeat: ${updateError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Heartbeat updated'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'terminate': {
        // Terminate specific session
        const { error: deleteError } = await supabaseClient
          .from('active_sessions')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', user.id);

        if (deleteError) {
          throw new Error(`Failed to terminate session: ${deleteError.message}`);
        }

        console.log(`🔚 Session terminated: ${sessionId}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Session terminated'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }

  } catch (error) {
    console.error('Session management error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});