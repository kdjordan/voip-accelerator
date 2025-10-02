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

  // Determine billing period from session amount_total (in cents)
  let billingPeriod = 'monthly'; // default

  const amountTotal = session.amount_total;
  console.log('💰 Amount total:', amountTotal);

  if (amountTotal === 9900) { // $99.00
    billingPeriod = 'monthly';
  } else if (amountTotal === 99900) { // $999.00
    billingPeriod = 'annual';
  }

  console.log('🎯 Determined billing period:', billingPeriod);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔧 Updating user profile...');

  // Calculate billing dates based on billing period
  const paymentDate = new Date();
  const currentPeriodStart = new Date(paymentDate);
  const currentPeriodEnd = new Date(paymentDate);

  if (billingPeriod === 'annual') {
    currentPeriodEnd.setFullYear(paymentDate.getFullYear() + 1); // 365-day billing cycle
  } else {
    currentPeriodEnd.setDate(paymentDate.getDate() + 30); // 30-day billing cycle
  }

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
    billing_period: billingPeriod,
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
    console.log(`✅ Updated user ${customerEmail} to ${billingPeriod} billing`);
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

  // Handle billing period changes during updates
  if (subscription.items?.data?.[0]?.price?.unit_amount) {
    const amount = subscription.items.data[0].price.unit_amount;
    const newBillingPeriod = determineBillingPeriod(amount);
    updateData.billing_period = newBillingPeriod;
    console.log('🎯 Billing period change detected:', newBillingPeriod);
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
    billing_period: null, // Clear billing period
    subscription_id: null, // Clear subscription ID
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
  }
}

// Helper function for billing period determination (reused from checkout logic)
function determineBillingPeriod(amountInCents: number): string {
  if (amountInCents === 9900) return 'monthly';   // $99.00
  if (amountInCents === 99900) return 'annual';   // $999.00
  return 'monthly'; // default
}