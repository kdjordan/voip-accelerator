import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  // No CORS needed for webhooks - they come from Stripe
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!signature || !webhookSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return new Response('Webhook signature missing', { status: 400 });
  }

  try {
    const body = await req.text();
    const receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🔔 Webhook received: ${receivedEvent.type}`);

    // Handle the event
    switch (receivedEvent.type) {
      case 'checkout.session.completed': {
        const session = receivedEvent.data.object as Stripe.Checkout.Session;
        console.log(`💰 Checkout session completed: ${session.id}`);
        
        // Get the user email from the session
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        if (customerEmail) {
          // Get the subscription to determine billing interval
          let subscriptionStatus = 'active';
          if (session.subscription) {
            try {
              const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
                expand: ['items.data.price']
              });
              
              // Check the billing interval to determine if monthly or annual
              const price = subscription.items.data[0]?.price;
              console.log(`🔍 Subscription details:`, {
                subscriptionId: subscription.id,
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                priceId: price?.id,
                interval: price?.recurring?.interval,
                intervalCount: price?.recurring?.interval_count
              });
              
              if (price?.recurring?.interval === 'month') {
                subscriptionStatus = 'monthly';
              } else if (price?.recurring?.interval === 'year') {
                subscriptionStatus = 'annual';
              }
              
              console.log(`📅 Billing interval: ${price?.recurring?.interval}, status: ${subscriptionStatus}`);
            } catch (error) {
              console.error('Error retrieving subscription:', error);
            }
          }

          // Update user's subscription status
          const updateData: any = {
            stripe_customer_id: session.customer as string,
            subscription_status: subscriptionStatus,
            subscription_id: session.subscription as string,
            updated_at: new Date().toISOString(),
          };
          
          // Also add period dates if we have the subscription
          if (session.subscription) {
            try {
              const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
              updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
              updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
            } catch (error) {
              console.error('Error retrieving subscription for period dates:', error);
            }
          }

          console.log(`🔄 Updating profile for ${customerEmail}:`, updateData);
          
          const { error, data } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('email', customerEmail)
            .select();

          if (error) {
            console.error('❌ Error updating user profile:', error);
          } else {
            console.log(`✅ Updated profile for ${customerEmail} with status: ${subscriptionStatus}`);
            console.log(`📊 Updated profile data:`, data?.[0]);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        console.log(`📋 Subscription ${receivedEvent.type}: ${subscription.id}`);
        
        // Get the customer
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('email' in customer && customer.email) {
          // Determine subscription status based on billing interval
          let subscriptionStatus = subscription.status;
          const price = subscription.items.data[0]?.price;
          
          console.log(`🔍 Subscription update details:`, {
            subscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            priceId: price?.id,
            interval: price?.recurring?.interval,
            intervalCount: price?.recurring?.interval_count,
            customerEmail: customer.email
          });
          
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            if (price?.recurring?.interval === 'month') {
              subscriptionStatus = 'monthly';
            } else if (price?.recurring?.interval === 'year') {
              subscriptionStatus = 'annual';
            }
          }
          
          const subscriptionData = {
            stripe_customer_id: subscription.customer as string,
            subscription_status: subscriptionStatus,
            subscription_id: subscription.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          };

          console.log(`🔄 Updating subscription for ${customer.email}:`, subscriptionData);
          
          const { error, data } = await supabase
            .from('profiles')
            .update(subscriptionData)
            .eq('email', customer.email)
            .select();

          if (error) {
            console.error('❌ Error updating subscription:', error);
          } else {
            console.log(`✅ Updated subscription for ${customer.email}`);
            console.log(`📊 Updated profile data:`, data?.[0]);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        console.log(`🚫 Subscription deleted: ${subscription.id}`);
        
        // Get the customer
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('email' in customer && customer.email) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('email', customer.email);

          if (error) {
            console.error('Error canceling subscription:', error);
          } else {
            console.log(`✅ Canceled subscription for ${customer.email}`);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = receivedEvent.data.object as Stripe.Invoice;
        console.log(`✅ Payment succeeded for invoice: ${invoice.id}`);
        
        // Log successful payment
        if (invoice.customer_email) {
          const { error } = await supabase
            .from('profiles')
            .update({
              last_payment_date: new Date().toISOString(),
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('email', invoice.customer_email);

          if (error) {
            console.error('Error updating payment status:', error);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = receivedEvent.data.object as Stripe.Invoice;
        console.log(`❌ Payment failed for invoice: ${invoice.id}`);
        
        // Update subscription status
        if (invoice.customer_email) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('email', invoice.customer_email);

          if (error) {
            console.error('Error updating payment failure:', error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${receivedEvent.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error(`❌ Webhook error: ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});