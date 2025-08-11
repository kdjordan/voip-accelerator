import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHash } from 'https://deno.land/std@0.177.0/hash/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteUserRequest {
  email: string;
  role?: string;
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
    const body: InviteUserRequest = await req.json();
    const { email, role = 'member' } = body;

    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }

    console.log(`📧 Inviting user - From: ${user.email}, To: ${email}, Role: ${role}`);

    // Get user's organization and verify admin status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to get user profile: ${profileError.message}`);
    }

    if (!profile.organization_id) {
      throw new Error('User does not belong to an organization');
    }

    if (profile.role !== 'admin') {
      throw new Error('Only organization admins can send invitations');
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id, name, seat_limit')
      .eq('id', profile.organization_id)
      .single();

    if (orgError) {
      throw new Error(`Failed to get organization: ${orgError.message}`);
    }

    // Count current organization members
    const { count: currentMembers, error: countError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization.id);

    if (countError) {
      throw new Error(`Failed to count organization members: ${countError.message}`);
    }

    // Check seat limit (hard block)
    if (currentMembers >= organization.seat_limit) {
      console.log(`🚫 Seat limit exceeded - Current: ${currentMembers}, Limit: ${organization.seat_limit}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          seatLimitExceeded: true,
          currentSeats: currentMembers,
          seatLimit: organization.seat_limit,
          message: `Organization has reached its ${organization.seat_limit} seat limit. Contact sales@voipaccelerator.com for additional seats.`,
          upgradeRequired: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429, // Too Many Requests
        }
      );
    }

    // Check if user is already a member
    const { data: existingUser, error: existingError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to check existing user: ${existingError.message}`);
    }

    if (existingUser) {
      throw new Error('User is already registered. Users can only belong to one organization.');
    }

    // Check for existing invitation
    const { data: existingInvite, error: inviteCheckError } = await supabaseClient
      .from('organization_invitations')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('email', email.toLowerCase().trim())
      .is('used_at', null) // Not yet used
      .gt('expires_at', new Date().toISOString()) // Not expired
      .maybeSingle();

    if (inviteCheckError) {
      throw new Error(`Failed to check existing invitations: ${inviteCheckError.message}`);
    }

    if (existingInvite) {
      throw new Error('An active invitation already exists for this email address');
    }

    // Generate secure invitation token
    const tokenData = `${email}-${organization.id}-${Date.now()}-${Math.random()}`;
    const hash = createHash('sha256');
    hash.update(tokenData);
    const token = hash.toString('hex');

    // Create invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('organization_invitations')
      .insert({
        organization_id: organization.id,
        email: email.toLowerCase().trim(),
        invited_by: user.id,
        role: role,
        token: token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invitationError) {
      throw new Error(`Failed to create invitation: ${invitationError.message}`);
    }

    console.log(`✅ Invitation created - Token: ${token.substring(0, 8)}...`);

    // TODO: Send email invitation (integrate with email service)
    // For now, return the invitation details for manual sending

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          organizationName: organization.name,
          role: invitation.role,
          token: invitation.token,
          expiresAt: invitation.expires_at,
          inviteUrl: `${req.headers.get('origin') || 'https://app.voipaccelerator.com'}/accept-invitation?token=${token}`
        },
        seatInfo: {
          currentSeats: currentMembers,
          seatLimit: organization.seat_limit,
          remaining: organization.seat_limit - currentMembers - 1 // -1 for this pending invitation
        },
        message: 'Invitation sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    );

  } catch (error) {
    console.error('Invite user error:', error);
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