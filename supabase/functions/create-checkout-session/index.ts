import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";
import { getCorsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  // Get the origin from the request headers
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
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
    console.log('Processing checkout session request');
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User verified:', user.email);

    // Get request body
    const { priceId, successUrl, cancelUrl, customerEmail, userId } = await req.json();

    if (!priceId) {
      throw new Error('Price ID is required');
    }

    console.log('🚨 STRIPE CHECKOUT DEBUG:');
    console.log('Price ID received from frontend:', priceId);
    console.log('User email:', user.email);
    
    // Determine if this is monthly or annual based on price ID
    const monthlyPriceId = 'price_1RkbOQFVpXrZdlrXw9Pokbpl';
    const annualPriceId = 'price_1RkbPwFVpXrZdlrXrspQ4IIb';
    
    if (priceId === monthlyPriceId) {
      console.log('✅ MONTHLY PLAN SELECTED - $40/month');
    } else if (priceId === annualPriceId) {
      console.log('⚠️ ANNUAL PLAN SELECTED - $400/year');
    } else {
      console.log('❌ UNKNOWN PRICE ID:', priceId);
    }

    // Check if customer already exists
    let customerId: string | undefined;
    
    // First, check if user already has a Stripe customer ID in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId || user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
      console.log('Found existing customer ID:', customerId);
    } else {
      // Search for existing customer by email
      const customers = await stripe.customers.list({
        email: customerEmail || user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('Found existing Stripe customer:', customerId);
        // Update profile with customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId || user.id);
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : (customerEmail || user.email),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${origin || 'http://localhost:5173'}/dashboard?subscription=success`,
      cancel_url: cancelUrl || `${origin || 'http://localhost:5173'}/pricing?subscription=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: userId || user.id,
        },
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});