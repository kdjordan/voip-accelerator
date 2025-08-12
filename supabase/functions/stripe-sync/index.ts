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

    // Sync event to database
    await supabase
      .from('events')
      .upsert({
        id: receivedEvent.id,
        object: receivedEvent.object,
        api_version: receivedEvent.api_version,
        created: new Date(receivedEvent.created * 1000).toISOString(),
        data: receivedEvent.data,
        livemode: receivedEvent.livemode,
        pending_webhooks: receivedEvent.pending_webhooks,
        request: receivedEvent.request,
        type: receivedEvent.type,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .schema('stripe');

    // Custom logic for our three-tier system
    switch (receivedEvent.type) {
      case 'customer.created':
      case 'customer.updated': {
        const customer = receivedEvent.data.object as Stripe.Customer;
        await supabase
          .from('customers')
          .upsert({
            id: customer.id,
            object: customer.object,
            email: customer.email,
            name: customer.name,
            description: customer.description,
            created: customer.created ? new Date(customer.created * 1000).toISOString() : null,
            metadata: customer.metadata,
            currency: customer.currency,
            livemode: customer.livemode,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .schema('stripe');
        break;
      }
      
      case 'product.created':
      case 'product.updated': {
        const product = receivedEvent.data.object as Stripe.Product;
        await supabase
          .from('products')
          .upsert({
            id: product.id,
            object: product.object,
            active: product.active,
            created: product.created ? new Date(product.created * 1000).toISOString() : null,
            default_price: product.default_price as string,
            description: product.description,
            name: product.name,
            metadata: product.metadata,
            livemode: product.livemode,
            updated: product.updated ? new Date(product.updated * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .schema('stripe');
        break;
      }
      
      case 'price.created':
      case 'price.updated': {
        const price = receivedEvent.data.object as Stripe.Price;
        await supabase
          .from('prices')
          .upsert({
            id: price.id,
            object: price.object,
            active: price.active,
            billing_scheme: price.billing_scheme,
            created: price.created ? new Date(price.created * 1000).toISOString() : null,
            currency: price.currency,
            product: price.product as string,
            recurring: price.recurring,
            type: price.type,
            unit_amount: price.unit_amount,
            unit_amount_decimal: price.unit_amount_decimal,
            metadata: price.metadata,
            livemode: price.livemode,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .schema('stripe');
        break;
      }
      
      case 'subscription.created':
      case 'subscription.updated': {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .upsert({
            id: subscription.id,
            object: subscription.object,
            cancel_at_period_end: subscription.cancel_at_period_end,
            created: subscription.created ? new Date(subscription.created * 1000).toISOString() : null,
            current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
            customer: subscription.customer as string,
            items: subscription.items,
            latest_invoice: subscription.latest_invoice as string,
            metadata: subscription.metadata,
            status: subscription.status,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            livemode: subscription.livemode,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .schema('stripe');
        break;
      }
      
      case 'invoice.created':
      case 'invoice.updated':
      case 'invoice.paid': {
        const invoice = receivedEvent.data.object as Stripe.Invoice;
        await supabase
          .from('invoices')
          .upsert({
            id: invoice.id,
            object: invoice.object,
            amount_due: invoice.amount_due,
            amount_paid: invoice.amount_paid,
            amount_remaining: invoice.amount_remaining,
            created: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
            currency: invoice.currency,
            customer: invoice.customer as string,
            customer_email: invoice.customer_email,
            customer_name: invoice.customer_name,
            hosted_invoice_url: invoice.hosted_invoice_url,
            invoice_pdf: invoice.invoice_pdf,
            paid: invoice.paid,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            status: invoice.status,
            subscription: invoice.subscription as string,
            total: invoice.total,
            metadata: invoice.metadata,
            livemode: invoice.livemode,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .schema('stripe');
        break;
      }
      
      case 'checkout.session.completed': {
        const session = receivedEvent.data.object as Stripe.Checkout.Session;
        console.log(`💰 Checkout session completed: ${session.id}`);
        
        // Get the user email from the session
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        if (customerEmail && session.subscription) {
          try {
            // Get subscription details to determine tier
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
              expand: ['items.data.price.product']
            });
            
            const product = subscription.items.data[0]?.price.product as Stripe.Product;
            let subscriptionTier: string | null = null;
            
            // Map product names to our tier system
            if (product.name.includes('Accelerator')) {
              subscriptionTier = 'accelerator';
            } else if (product.name.includes('Optimizer')) {
              subscriptionTier = 'optimizer';
            } else if (product.name.includes('Enterprise')) {
              subscriptionTier = 'enterprise';
            }
            
            // Update user profile with tier information
            if (subscriptionTier) {
              const { error } = await supabase
                .from('profiles')
                .update({
                  subscription_tier: subscriptionTier,
                  subscription_status: 'active',
                  stripe_customer_id: session.customer as string,
                  subscription_id: session.subscription as string,
                  plan_expires_at: null, // Clear trial expiry
                  updated_at: new Date().toISOString(),
                })
                .eq('email', customerEmail);
              
              if (error) {
                console.error('Error updating user profile:', error);
              } else {
                console.log(`✅ Updated user ${customerEmail} to ${subscriptionTier} tier`);
              }
              
              // For Enterprise tier, create organization if needed
              if (subscriptionTier === 'enterprise') {
                // Check if user already has an organization
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('id, organization_id')
                  .eq('email', customerEmail)
                  .single();
                
                if (profile && !profile.organization_id) {
                  // Create organization for enterprise user
                  const { data: org, error: orgError } = await supabase
                    .from('organizations')
                    .insert({
                      name: `${customerEmail}'s Organization`,
                      subscription_tier: 'enterprise',
                      stripe_customer_id: session.customer as string,
                      subscription_id: session.subscription as string,
                      billing_email: customerEmail,
                      admin_user_id: profile.id,
                      seat_limit: 5,
                      seats_used: 1,
                    })
                    .select()
                    .single();
                  
                  if (!orgError && org) {
                    // Update user profile with organization
                    await supabase
                      .from('profiles')
                      .update({
                        organization_id: org.id,
                        role: 'admin'
                      })
                      .eq('id', profile.id);
                    
                    console.log(`🏢 Created organization for enterprise user ${customerEmail}`);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error processing subscription tier:', error);
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        
        // Handle tier changes
        if (subscription.items.data[0]) {
          const product = subscription.items.data[0].price.product as Stripe.Product;
          let newTier: string | null = null;
          
          if (typeof product === 'object' && product.name) {
            if (product.name.includes('Accelerator')) {
              newTier = 'accelerator';
            } else if (product.name.includes('Optimizer')) {
              newTier = 'optimizer';  
            } else if (product.name.includes('Enterprise')) {
              newTier = 'enterprise';
            }
          }
          
          if (newTier) {
            // Update user's tier
            const { error } = await supabase
              .from('profiles')
              .update({
                subscription_tier: newTier,
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_customer_id', subscription.customer as string);
            
            if (!error) {
              console.log(`🔄 Updated customer ${subscription.customer} to ${newTier} tier`);
            }
          }
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        
        // Downgrade to trial/free when subscription ends
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'expired',
            subscription_tier: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', subscription.customer as string);
        
        if (!error) {
          console.log(`❌ Subscription ended for customer ${subscription.customer}`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});