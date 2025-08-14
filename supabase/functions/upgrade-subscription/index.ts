import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subscriptionId, newTier, currentTier, userId } = await req.json()

    if (!subscriptionId || !newTier || !currentTier) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Map tier to price ID
    const tierToPriceId = {
      'optimizer': Deno.env.get('STRIPE_PRICE_OPTIMIZER'),
      'accelerator': Deno.env.get('STRIPE_PRICE_ACCELERATOR'),
      'enterprise': Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
    }

    const newPriceId = tierToPriceId[newTier as keyof typeof tierToPriceId]
    
    if (!newPriceId) {
      throw new Error('Invalid tier specified')
    }

    // Update the subscription with the new price
    // This will automatically prorate the charges
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // This handles prorating automatically
    })

    // Update the user's profile in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      // Note: We don't throw here because the Stripe update succeeded
      // The webhook will eventually sync this data
    }

    console.log(`✅ Successfully upgraded user ${userId} from ${currentTier} to ${newTier}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscriptionId: updatedSubscription.id,
        newTier,
        message: 'Subscription upgraded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Upgrade error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})