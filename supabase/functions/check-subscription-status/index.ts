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
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    if (!user) {
      throw new Error('No user found');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_status, current_period_end, plan_expires_at, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw profileError;
    }
    
    console.log(`🔍 Checking subscription for ${profile.email}:`, {
      subscription_status: profile.subscription_status,
      current_period_end: profile.current_period_end,
      plan_expires_at: profile.plan_expires_at,
      now: now.toISOString()
    });

    // Check subscription status
    const now = new Date();
    let isActive = false;
    let requiresPayment = false;
    let trialEndsAt = null;
    let message = '';

    if (profile.subscription_status === 'monthly' || profile.subscription_status === 'annual' || profile.subscription_status === 'active') {
      // Paid subscription - check if not expired
      const expirationDate = profile.current_period_end ? new Date(profile.current_period_end) : null;
      
      console.log(`💳 Paid subscription check:`, {
        status: profile.subscription_status,
        expirationDate: expirationDate?.toISOString(),
        isExpired: expirationDate ? expirationDate <= now : 'no date'
      });
      
      if (expirationDate && expirationDate > now) {
        isActive = true;
        message = `Active ${profile.subscription_status} subscription`;
      } else if (!expirationDate) {
        // No expiration date but has active status (legacy or lifetime)
        isActive = true;
        message = `Active ${profile.subscription_status} subscription (no expiry)`;
      } else {
        requiresPayment = true;
        message = 'Subscription expired';
      }
    } else if (profile.subscription_status === 'trial') {
      // For trial status without trial_started_at column, check plan_expires_at
      if (profile.plan_expires_at) {
        const trialEnd = new Date(profile.plan_expires_at);
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
        message = 'Trial status but no expiration date';
      }
    } else {
      requiresPayment = true;
      message = 'No active subscription';
    }

    const response = {
      isActive,
      requiresPayment,
      subscriptionStatus: profile.subscription_status,
      planExpiresAt: profile.current_period_end || profile.plan_expires_at,
      trialStartedAt: null,
      trialEndsAt,
      message,
    };
    
    console.log(`✅ Returning subscription status:`, response);
    
    return new Response(
      JSON.stringify(response),
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