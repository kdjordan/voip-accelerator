import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('No user found');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_status, plan_expires_at, trial_started_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Check subscription status
    const now = new Date();
    let isActive = false;
    let requiresPayment = false;
    let trialEndsAt = null;
    let message = '';

    if (profile.subscription_status === 'monthly' || profile.subscription_status === 'annual') {
      // Paid subscription
      isActive = true;
      message = `Active ${profile.subscription_status} subscription`;
    } else if (profile.subscription_status === 'trial' && profile.trial_started_at) {
      // Check trial period (7 days)
      const trialStart = new Date(profile.trial_started_at);
      const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      trialEndsAt = trialEnd.toISOString();
      
      if (now < trialEnd) {
        isActive = true;
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        message = `Trial active - ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`;
      } else {
        requiresPayment = true;
        message = 'Trial expired - payment required';
      }
    } else {
      requiresPayment = true;
      message = 'No active subscription';
    }

    return new Response(
      JSON.stringify({
        isActive,
        requiresPayment,
        subscriptionStatus: profile.subscription_status,
        planExpiresAt: profile.plan_expires_at,
        trialStartedAt: profile.trial_started_at,
        trialEndsAt,
        message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});