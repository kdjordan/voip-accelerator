import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth header for user validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create client with service role for database operations (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate user with separate anon client
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    // Use service role approach (method 2 from debug-auth that worked)
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { newSessionId, deviceInfo } = await req.json()
    
    if (!newSessionId) {
      return new Response(
        JSON.stringify({ error: 'New session ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete all existing sessions for this user
    const { error: deleteError } = await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Session deletion error:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to clear existing sessions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new session record
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
      })

    if (insertError) {
      console.error('Session creation error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create new session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Previous sessions cleared and new session created'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Force logout error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})