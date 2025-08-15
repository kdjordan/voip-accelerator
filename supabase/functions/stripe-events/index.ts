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
  
  // Calculate next billing date (30 days from payment date)
  const paymentDate = new Date();
  const nextBillingDate = new Date(paymentDate);
  nextBillingDate.setDate(paymentDate.getDate() + 30);
  
  console.log('💳 Payment date:', paymentDate.toISOString());
  console.log('📅 Next billing date calculated:', nextBillingDate.toISOString());
  
  // Update user profile
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: subscriptionTier,
      subscription_status: 'active',
      stripe_customer_id: session.customer,
      subscription_id: session.subscription,
      last_payment_date: paymentDate.toISOString(),
      plan_expires_at: nextBillingDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', customerEmail);

  if (error) {
    console.error('❌ Error updating user profile:', error);
  } else {
    console.log(`✅ Updated user ${customerEmail} to ${subscriptionTier} tier`);
  }
}