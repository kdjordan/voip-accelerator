import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('🎯 WEBHOOK CALLED - METHOD:', req.method);
  console.log('🎯 WEBHOOK CALLED - URL:', req.url);
  console.log('🔑 Auth header:', req.headers.get('authorization'));
  console.log('🔑 API key header:', req.headers.get('apikey'));
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    console.log('❌ Not a POST request');
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log('📦 Raw body length:', body.length);
    
    let event;
    try {
      event = JSON.parse(body);
      console.log('✅ JSON parsed successfully');
      console.log('🎉 EVENT TYPE:', event.type);
      console.log('🎉 EVENT ID:', event.id);
    } catch (err) {
      console.error('❌ JSON parse failed:', err);
      return new Response('Invalid JSON', { status: 400 });
    }

    console.log('🎯 WEBHOOK PROCESSING COMPLETE');

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object);
    }

    // Handle subscription cancellation events
    if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(event.data.object);
    }

    if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(event.data.object);
    }

    return new Response(JSON.stringify({ received: true, event_type: event.type }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleCheckoutCompleted(session: any) {
  console.log('🎯 Processing checkout.session.completed');
  
  const customerEmail = session.customer_email || session.customer_details?.email;
  
  if (!customerEmail || !session.subscription) {
    console.log('❌ Missing customer email or subscription:', { customerEmail, subscription: session.subscription });
    return;
  }

  console.log('📧 Processing checkout for:', customerEmail);
  console.log('💳 Subscription ID:', session.subscription);
  console.log('👤 Customer ID:', session.customer);
  console.log('🔍 Full session object:', JSON.stringify(session, null, 2));

  // Determine subscription tier from session amount_total (in cents)
  let subscriptionTier = 'optimizer'; // default
  
  const amountTotal = session.amount_total;
  console.log('💰 Amount total:', amountTotal);
  
  if (amountTotal === 9900) { // $99.00
    subscriptionTier = 'optimizer';
  } else if (amountTotal === 24900) { // $249.00
    subscriptionTier = 'accelerator';
  } else if (amountTotal === 49900) { // $499.00
    subscriptionTier = 'enterprise';
  }
  
  console.log('🎯 Determined tier:', subscriptionTier);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔧 Updating user profile...');
  
  // Calculate billing dates
  const paymentDate = new Date();
  const currentPeriodStart = new Date(paymentDate);
  const currentPeriodEnd = new Date(paymentDate);
  currentPeriodEnd.setDate(paymentDate.getDate() + 30); // 30-day billing cycle
  
  console.log('💳 Payment date:', paymentDate.toISOString());
  console.log('📅 Current period start:', currentPeriodStart.toISOString());
  console.log('📅 Current period end:', currentPeriodEnd.toISOString());
  
  // First, get user ID for the reset function
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (userError || !userData) {
    console.error('❌ Error finding user:', userError);
    return;
  }

  console.log('👤 Found user ID:', userData.id);

  // Update user profile with all Stripe metadata
  const updateData = {
    subscription_tier: subscriptionTier,
    subscription_status: 'active',
    stripe_customer_id: session.customer,
    subscription_id: session.subscription,
    last_payment_date: paymentDate.toISOString(),
    current_period_start: currentPeriodStart.toISOString(),
    current_period_end: currentPeriodEnd.toISOString(),
    plan_expires_at: currentPeriodEnd.toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('email', customerEmail);

  if (error) {
    console.error('❌ Error updating user profile:', error);
  } else {
    console.log(`✅ Updated user ${customerEmail} to ${subscriptionTier} tier`);
    
    // Reset monthly uploads when upgrading to paid plan
    console.log('🔄 Resetting monthly uploads for new subscriber...');
    const { data: resetData, error: resetError } = await supabase
      .rpc('reset_monthly_uploads', { p_user_id: userData.id });

    if (resetError) {
      console.error('❌ Error resetting monthly uploads:', resetError);
    } else {
      console.log('✅ Monthly uploads reset successfully:', resetData);
    }
  }
}

// Handle subscription updates (including scheduled cancellations)
async function handleSubscriptionUpdated(subscription: any) {
  console.log('🎯 Processing customer.subscription.updated');
  console.log('📋 Subscription object:', JSON.stringify(subscription, null, 2));

  // Get customer email - try multiple sources
  let customerEmail = subscription.customer_email;
  
  if (!customerEmail) {
    console.log('🔍 No customer_email on subscription, fetching from Stripe customer...');
    // We would need to fetch from Stripe API here, but for webhook safety,
    // we'll use the database to find the customer by stripe_customer_id
  }

  if (!customerEmail) {
    console.log('❌ Cannot process subscription update: no customer email available');
    return;
  }

  console.log('📧 Processing subscription update for:', customerEmail);
  console.log('🔄 Subscription ID:', subscription.id);
  console.log('📊 Status:', subscription.status);
  console.log('❌ Cancel at period end:', subscription.cancel_at_period_end);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Build update data
  const updateData: any = {
    subscription_status: subscription.status,
    updated_at: new Date().toISOString(),
  };

  // Handle scheduled cancellation
  if (subscription.cancel_at_period_end && subscription.cancel_at) {
    console.log('⏰ Subscription scheduled for cancellation');
    updateData.cancel_at = new Date(subscription.cancel_at * 1000).toISOString();
    updateData.cancel_at_period_end = true;
    
    if (subscription.current_period_end) {
      updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
    }
  } else if (!subscription.cancel_at_period_end && subscription.cancel_at === null) {
    console.log('🔄 Subscription reactivated');
    updateData.cancel_at = null;
    updateData.cancel_at_period_end = false;
  }

  // Handle tier changes during updates
  if (subscription.items?.data?.[0]?.price?.unit_amount) {
    const amount = subscription.items.data[0].price.unit_amount;
    const newTier = determineSubscriptionTier(amount);
    updateData.subscription_tier = newTier;
    console.log('🎯 Tier change detected:', newTier);
  }

  // Update current period end if available
  if (subscription.current_period_end) {
    updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
  }

  console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

  // Update user profile
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('stripe_customer_id', subscription.customer);

  if (error) {
    console.error('❌ Error updating subscription:', error);
  } else {
    console.log(`✅ Updated subscription for customer ${subscription.customer}`);
  }
}

// Handle subscription deletion (immediate or end-of-period cancellation)
async function handleSubscriptionDeleted(subscription: any) {
  console.log('🎯 Processing customer.subscription.deleted');
  console.log('📋 Subscription object:', JSON.stringify(subscription, null, 2));

  console.log('💀 Subscription canceled/deleted');
  console.log('🔄 Subscription ID:', subscription.id);
  console.log('👤 Customer:', subscription.customer);
  console.log('⏰ Canceled at:', subscription.canceled_at);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Build update data for cancellation
  const updateData: any = {
    subscription_status: 'canceled',
    subscription_tier: 'trial', // Revert to trial
    subscription_id: null, // Clear subscription ID
    uploads_this_month: 0, // Reset uploads
    cancel_at_period_end: false,
    cancel_at: null,
    updated_at: new Date().toISOString(),
  };

  if (subscription.canceled_at) {
    updateData.canceled_at = new Date(subscription.canceled_at * 1000).toISOString();
  }

  console.log('📝 Cancellation update data:', JSON.stringify(updateData, null, 2));

  // Update user profile
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('stripe_customer_id', subscription.customer);

  if (error) {
    console.error('❌ Error processing cancellation:', error);
  } else {
    console.log(`✅ Processed cancellation for customer ${subscription.customer}`);
    
    // Get user for reset function
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (userError || !userData) {
      console.error('❌ Error finding user for reset:', userError);
      return;
    }

    // Reset monthly uploads on cancellation
    console.log('🔄 Resetting monthly uploads for canceled subscription...');
    const { data: resetData, error: resetError } = await supabase
      .rpc('reset_monthly_uploads', { p_user_id: userData.id });

    if (resetError) {
      console.error('❌ Error resetting uploads on cancellation:', resetError);
    } else {
      console.log('✅ Uploads reset successfully on cancellation:', resetData);
    }
  }
}

// Helper function for tier determination (reused from checkout logic)
function determineSubscriptionTier(amountInCents: number): string {
  if (amountInCents === 9900) return 'optimizer';   // $99.00
  if (amountInCents === 24900) return 'accelerator'; // $249.00  
  if (amountInCents === 49900) return 'enterprise';  // $499.00
  return 'optimizer'; // default
}