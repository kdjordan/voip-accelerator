import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Create supabase client with user context
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { 
        autoRefreshToken: false, 
        persistSession: false 
      }
    })
    
    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token)
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { selectedTier } = await req.json()
    
    if (!selectedTier || !['accelerator', 'optimizer', 'enterprise'].includes(selectedTier)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier selection' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🎯 Setting trial tier for user ${user.id}: ${selectedTier}`)

    // Create admin client for profile updates
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)
    
    // Update user profile with selected tier
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        trial_tier: selectedTier,
        subscription_status: 'trial',
        plan_expires_at: trialEndDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating profile:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to set trial tier' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`✅ Successfully set trial tier ${selectedTier} for user ${user.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        trialTier: selectedTier,
        trialExpiresAt: trialEndDate.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})