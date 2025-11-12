import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Stripe with API key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

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

    // 🔒 SECURITY: Verify webhook signature to prevent fraudulent events
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Debug: Log first 10 chars of secret to verify it's loaded
    console.log('🔑 Webhook secret loaded:', webhookSecret ? `${webhookSecret.substring(0, 15)}...` : 'NOT FOUND');

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified');
      console.log('🎉 EVENT TYPE:', event.type);
      console.log('🎉 EVENT ID:', event.id);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Handle successful invoice payment (renewals)
    if (event.type === 'invoice.payment_succeeded') {
      await handleInvoicePaymentSucceeded(event.data.object);
    }

    // Handle failed invoice payment
    if (event.type === 'invoice.payment_failed') {
      await handleInvoicePaymentFailed(event.data.object);
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
  const amountTotal = session.amount_total;
  console.log('💰 Amount total:', amountTotal);

  const billingPeriod = determineBillingPeriod(amountTotal);
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

  // STEP 1: Check if this user had requested account deletion
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, account_deletion_scheduled_at, deletion_reason, email')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (fetchError) {
    console.error('❌ Error fetching profile:', fetchError);
    // Continue with normal cancellation processing
  }

  // STEP 2: If account deletion was scheduled, perform complete deletion
  if (profile?.account_deletion_scheduled_at) {
    console.log(`🗑️ Account deletion scheduled - performing complete account cleanup for user ${profile.id}`);
    console.log(`📅 Deletion was requested at: ${profile.account_deletion_scheduled_at}`);
    console.log(`📝 Reason: ${profile.deletion_reason || 'user_requested'}`);

    try {
      // Delete profile first (triggers active_sessions cascade)
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (deleteProfileError) {
        console.error('❌ Error deleting profile during scheduled deletion:', deleteProfileError);
        throw deleteProfileError;
      }

      console.log(`✅ Profile deleted for user ${profile.id}`);

      // Delete auth user (triggers usage_metrics cascade)
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(profile.id);

      if (deleteAuthError) {
        console.error('❌ Error deleting auth user during scheduled deletion:', deleteAuthError);
        throw deleteAuthError;
      }

      console.log(`✅ Auth user deleted for user ${profile.id}`);
      console.log(`🎉 Complete account deletion finished for ${profile.email || profile.id}`);

      return; // Exit early - account fully deleted
    } catch (deletionError) {
      console.error('❌ Failed to complete scheduled account deletion:', deletionError);
      // Fall through to normal cancellation processing as fallback
    }
  }

  // STEP 3: Normal cancellation processing (no deletion scheduled)
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

// Handle successful invoice payment (renewals)
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('🎯 Processing invoice.payment_succeeded');
  console.log('📋 Invoice object:', JSON.stringify(invoice, null, 2));

  // This handles successful renewals - update subscription dates
  console.log('💰 Invoice paid successfully');
  console.log('💳 Invoice ID:', invoice.id);
  console.log('👤 Customer:', invoice.customer);
  console.log('📊 Subscription:', invoice.subscription);
  console.log('💵 Amount paid:', invoice.amount_paid / 100);

  if (!invoice.subscription) {
    console.log('⚠️ No subscription on invoice, skipping');
    return;
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Determine billing period from invoice amount
  const billingPeriod = determineBillingPeriod(invoice.amount_paid);

  // Calculate new period dates
  const paymentDate = new Date(invoice.status_transitions.paid_at * 1000);
  const currentPeriodStart = new Date(paymentDate);
  const currentPeriodEnd = new Date(paymentDate);

  if (billingPeriod === 'annual') {
    currentPeriodEnd.setFullYear(paymentDate.getFullYear() + 1);
  } else {
    currentPeriodEnd.setDate(paymentDate.getDate() + 30);
  }

  const updateData: any = {
    subscription_status: 'active',
    last_payment_date: paymentDate.toISOString(),
    current_period_start: currentPeriodStart.toISOString(),
    current_period_end: currentPeriodEnd.toISOString(),
    plan_expires_at: currentPeriodEnd.toISOString(),
    billing_period: billingPeriod,
    updated_at: new Date().toISOString(),
  };

  console.log('📝 Renewal update data:', JSON.stringify(updateData, null, 2));

  // Update user profile
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('stripe_customer_id', invoice.customer);

  if (error) {
    console.error('❌ Error updating renewal:', error);
  } else {
    console.log(`✅ Processed successful renewal for customer ${invoice.customer}`);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: any) {
  console.log('🎯 Processing invoice.payment_failed');
  console.log('📋 Invoice object:', JSON.stringify(invoice, null, 2));

  console.log('❌ Invoice payment failed');
  console.log('💳 Invoice ID:', invoice.id);
  console.log('👤 Customer:', invoice.customer);
  console.log('📊 Subscription:', invoice.subscription);
  console.log('🔄 Attempt count:', invoice.attempt_count);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Mark subscription as past_due (Stripe will continue retry attempts)
  const updateData: any = {
    subscription_status: 'past_due',
    updated_at: new Date().toISOString(),
  };

  console.log('📝 Failed payment update data:', JSON.stringify(updateData, null, 2));

  // Update user profile
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('stripe_customer_id', invoice.customer);

  if (error) {
    console.error('❌ Error updating failed payment:', error);
  } else {
    console.log(`✅ Processed failed payment for customer ${invoice.customer}`);
    console.log('⚠️ User marked as past_due - Stripe will retry payment');
  }
}

// Helper function for billing period determination (reused from checkout logic)
function determineBillingPeriod(amountInCents: number): string {
  if (amountInCents === 100) return 'test';       // $1.00 (test subscription - admin only)
  if (amountInCents === 9900) return 'monthly';   // $99.00
  if (amountInCents === 99900) return 'annual';   // $999.00
  return 'monthly'; // default
}