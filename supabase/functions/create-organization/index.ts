import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOrganizationRequest {
  name: string;
  billingEmail?: string;
  seatLimit?: number;
}

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

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Parse request body
    const body: CreateOrganizationRequest = await req.json();
    const { name, billingEmail, seatLimit = 10 } = body;

    if (!name || name.trim().length < 2) {
      throw new Error('Organization name must be at least 2 characters long');
    }

    console.log(`🏢 Creating organization - Admin: ${user.email}, Name: ${name}`);

    // Check if user already has an organization
    const { data: existingProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id, subscription_tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to get user profile: ${profileError.message}`);
    }

    if (existingProfile.organization_id) {
      throw new Error('User already belongs to an organization');
    }

    // Create the organization
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .insert({
        name: name.trim(),
        admin_user_id: user.id,
        billing_email: billingEmail || user.email,
        seat_limit: Math.min(Math.max(seatLimit, 1), 10), // Clamp between 1-10
        subscription_status: 'enterprise',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Update user profile to be admin of this organization
    const { error: updateProfileError } = await supabaseClient
      .from('profiles')
      .update({
        organization_id: organization.id,
        subscription_tier: 'enterprise',
        role: 'admin'
      })
      .eq('id', user.id);

    if (updateProfileError) {
      // Rollback: delete the organization
      await supabaseClient
        .from('organizations')
        .delete()
        .eq('id', organization.id);
      
      throw new Error(`Failed to update user profile: ${updateProfileError.message}`);
    }

    console.log(`✅ Organization created successfully - ID: ${organization.id}, Name: ${name}`);

    return new Response(
      JSON.stringify({
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          seatLimit: organization.seat_limit,
          billingEmail: organization.billing_email,
          createdAt: organization.created_at,
          isAdmin: true,
          currentSeats: 1 // Just the admin
        },
        message: 'Organization created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    );

  } catch (error) {
    console.error('Create organization error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});