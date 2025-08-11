import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInvitationRequest {
  token: string;
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
    const body: AcceptInvitationRequest = await req.json();
    const { token } = body;

    if (!token) {
      throw new Error('Invitation token is required');
    }

    console.log(`🎫 Accepting invitation - User: ${user.email}, Token: ${token.substring(0, 8)}...`);

    // Find and validate invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('organization_invitations')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('token', token)
      .is('used_at', null) // Not yet used
      .gt('expires_at', new Date().toISOString()) // Not expired
      .single();

    if (invitationError || !invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    // Verify email matches
    if (invitation.email !== user.email?.toLowerCase()) {
      throw new Error('Invitation email does not match your account email');
    }

    // Check if user already belongs to an organization
    const { data: existingProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to get user profile: ${profileError.message}`);
    }

    if (existingProfile.organization_id) {
      throw new Error('You already belong to an organization');
    }

    // Double-check seat availability (prevent race conditions)
    const { count: currentMembers, error: countError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', invitation.organization.id);

    if (countError) {
      throw new Error(`Failed to count organization members: ${countError.message}`);
    }

    if (currentMembers >= invitation.organization.seat_limit) {
      console.log(`🚫 Seat limit exceeded during acceptance - Current: ${currentMembers}, Limit: ${invitation.organization.seat_limit}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          seatLimitExceeded: true,
          message: 'Organization has reached its seat limit. Please contact your administrator.',
          organizationName: invitation.organization.name
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    // Start transaction-like operations
    // 1. Update user profile
    const { error: updateProfileError } = await supabaseClient
      .from('profiles')
      .update({
        organization_id: invitation.organization.id,
        subscription_tier: 'enterprise',
        role: 'user' // Organization members are 'user' role
      })
      .eq('id', user.id);

    if (updateProfileError) {
      throw new Error(`Failed to join organization: ${updateProfileError.message}`);
    }

    // 2. Mark invitation as used
    const { error: markUsedError } = await supabaseClient
      .from('organization_invitations')
      .update({
        used_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (markUsedError) {
      // This is non-critical, don't fail the whole operation
      console.warn('Failed to mark invitation as used:', markUsedError.message);
    }

    console.log(`✅ User joined organization - Org: ${invitation.organization.name}, User: ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
          role: invitation.role,
          seatLimit: invitation.organization.seat_limit,
          currentSeats: currentMembers + 1,
          isAdmin: false
        },
        message: `Successfully joined ${invitation.organization.name}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Accept invitation error:', error);
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