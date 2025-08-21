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