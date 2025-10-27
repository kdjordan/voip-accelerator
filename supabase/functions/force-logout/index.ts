import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('force-logout function started');

    // Get auth header for user validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with service role for database operations (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the JWT token to get user ID (same pattern as pre-login-check)
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = userData.user;
    console.log('User authenticated:', user.id);

    // Get request body
    const { newSessionId, deviceInfo } = await req.json();
    console.log('Request payload:', { newSessionId, hasDeviceInfo: !!deviceInfo });

    if (!newSessionId) {
      console.error('Missing newSessionId in request');
      return new Response(
        JSON.stringify({ error: 'New session ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete all existing sessions for this user
    console.log('Deleting existing sessions for user:', user.id);
    const { error: deleteError } = await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Session deletion error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to clear existing sessions', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Existing sessions deleted successfully');

    // Create new session record
    console.log('Creating new session with token:', newSessionId);
    const { error: insertError } = await supabase
      .from('active_sessions')
      .insert({
        user_id: user.id,
        session_token: newSessionId,
        user_agent: deviceInfo?.userAgent || req.headers.get('user-agent'),
        ip_address: deviceInfo?.ipAddress || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        browser_info: deviceInfo?.browserInfo || {},
        is_active: true,
        created_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString()
      });

    if (insertError) {
      console.error('Session creation error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create new session', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('New session created successfully');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Previous sessions cleared and new session created'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Force logout error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})