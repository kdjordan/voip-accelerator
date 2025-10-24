import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";

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

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      headers: corsHeaders, 
      status: 405 
    });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    console.log('Supabase URL:', supabaseUrl);
    console.log('Anon key present:', !!supabaseAnonKey);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    console.log('Verifying user authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User verification result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasError: !!userError,
      errorMessage: userError?.message,
    });

    if (userError || !user) {
      throw new Error(`Unauthorized: ${userError?.message || 'No user found'}`);
    }

    // Parse request body
    const { priceId, successUrl, cancelUrl, customerEmail, userId } = await req.json();
    
    console.log('Request details:', {
      priceId,
      successUrl,
      cancelUrl,
      customerEmail,
      userId,
      userFromAuth: user.id
    });
    
    if (!priceId) {
      throw new Error('Price ID is required');
    }

    // Create checkout session
    console.log('Creating Stripe checkout session with:', {
      priceId,
      mode: 'subscription',
      userEmail: user.email,
      customerEmail: customerEmail || user.email
    });
    
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard?subscription=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin') || 'http://localhost:5173'}/billing?subscription=cancelled`,
      customer_email: customerEmail || user.email,
      subscription_data: {
        metadata: { supabase_user_id: userId || user.id },
      },
    });

    console.log('✅ Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url,
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url  // Include the direct checkout URL for simpler redirect
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: error.type,
      code: error.code,
      request_id: error.request_id,
      statusCode: error.statusCode,
      raw: error
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.type || error.code || 'unknown_error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    );
  }
});