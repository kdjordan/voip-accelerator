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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      headers: corsHeaders, 
      status: 405 
    });
  }

  try {
    console.log('Processing Stripe account info request');
    
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

    // Verify the user is authenticated and has admin privileges
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Unauthorized');
    }

    // Check if user has admin role (optional - remove if not needed)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      console.error('User is not admin:', user.email);
      throw new Error('Admin access required');
    }

    console.log('Admin user verified:', user.email);

    // Get Stripe account information
    const account = await stripe.accounts.retrieve();

    console.log('Stripe account retrieved successfully');

    // Return relevant account information
    const accountInfo = {
      id: account.id,
      business_profile: {
        name: account.business_profile?.name,
        support_email: account.business_profile?.support_email,
        url: account.business_profile?.url,
      },
      company: {
        name: account.company?.name,
      },
      country: account.country,
      default_currency: account.default_currency,
      details_submitted: account.details_submitted,
      email: account.email,
      type: account.type,
      created: account.created,
      display_name: account.settings?.dashboard?.display_name,
    };

    return new Response(
      JSON.stringify({ account: accountInfo }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error retrieving Stripe account info:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});