import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'false',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      headers: corsHeaders, 
      status: 405 
    });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header prefix:', authHeader?.substring(0, 20));
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    console.log('Supabase URL present:', !!supabaseUrl);
    console.log('Supabase Anon Key present:', !!supabaseAnonKey);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User verification result:', { 
      hasUser: !!user, 
      userEmail: user?.email,
      errorCode: userError?.message 
    });
    
    if (userError || !user) {
      throw new Error(`Unauthorized: ${userError?.message || 'No user'}`);
    }

    // Check for profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    console.log('Profile query result:', { 
      hasProfile: !!profile, 
      hasStripeCustomerId: !!profile?.stripe_customer_id,
      profileError: profileError?.message 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        user: { id: user.id, email: user.email },
        profile: { hasStripeCustomerId: !!profile?.stripe_customer_id }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Debug error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    );
  }
});