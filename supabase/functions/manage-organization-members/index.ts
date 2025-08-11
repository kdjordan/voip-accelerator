import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManageRequest {
  action: 'list' | 'remove' | 'change_role';
  memberId?: string;
  newRole?: string;
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

    // Parse request body for POST requests
    let body: ManageRequest = { action: 'list' };
    if (req.method === 'POST') {
      body = await req.json();
    }

    const { action, memberId, newRole } = body;

    console.log(`👥 Managing organization members - User: ${user.email}, Action: ${action}`);

    // Get user's organization and verify admin status
    const { data: adminProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to get user profile: ${profileError.message}`);
    }

    if (!adminProfile.organization_id) {
      throw new Error('User does not belong to an organization');
    }

    if (adminProfile.role !== 'admin') {
      throw new Error('Only organization admins can manage members');
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('id', adminProfile.organization_id)
      .single();

    if (orgError) {
      throw new Error(`Failed to get organization: ${orgError.message}`);
    }

    switch (action) {
      case 'list': {
        // Get all organization members
        const { data: members, error: membersError } = await supabaseClient
          .from('profiles')
          .select('id, email, role, created_at, updated_at, current_period_end')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: true });

        if (membersError) {
          throw new Error(`Failed to get organization members: ${membersError.message}`);
        }

        // Get pending invitations
        const { data: invitations, error: invitationsError } = await supabaseClient
          .from('organization_invitations')
          .select('id, email, role, created_at, expires_at')
          .eq('organization_id', organization.id)
          .is('used_at', null)
          .gt('expires_at', new Date().toISOString());

        if (invitationsError) {
          throw new Error(`Failed to get pending invitations: ${invitationsError.message}`);
        }

        console.log(`📋 Listed ${members.length} members and ${invitations.length} pending invitations`);

        return new Response(
          JSON.stringify({
            success: true,
            organization: {
              id: organization.id,
              name: organization.name,
              seatLimit: organization.seat_limit,
              adminUserId: organization.admin_user_id
            },
            members: members.map(member => ({
              id: member.id,
              email: member.email,
              role: member.role,
              isAdmin: member.id === organization.admin_user_id,
              joinedAt: member.created_at,
              subscriptionActive: member.current_period_end ? new Date(member.current_period_end) > new Date() : false
            })),
            pendingInvitations: invitations,
            seatUsage: {
              current: members.length,
              limit: organization.seat_limit,
              remaining: organization.seat_limit - members.length,
              pendingInvites: invitations.length
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'remove': {
        if (!memberId) {
          throw new Error('Member ID is required for remove action');
        }

        if (memberId === organization.admin_user_id) {
          throw new Error('Cannot remove organization admin');
        }

        if (memberId === user.id) {
          throw new Error('Cannot remove yourself');
        }

        // Remove user from organization
        const { error: removeError } = await supabaseClient
          .from('profiles')
          .update({
            organization_id: null,
            subscription_tier: 'starter', // Downgrade to starter
            role: 'user' // Reset to regular user
          })
          .eq('id', memberId)
          .eq('organization_id', organization.id); // Safety check

        if (removeError) {
          throw new Error(`Failed to remove member: ${removeError.message}`);
        }

        console.log(`🗑️ Removed member ${memberId} from organization`);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Member removed from organization',
            memberId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'change_role': {
        if (!memberId || !newRole) {
          throw new Error('Member ID and new role are required');
        }

        if (memberId === organization.admin_user_id) {
          throw new Error('Cannot change admin role');
        }

        if (!['user', 'admin'].includes(newRole)) {
          throw new Error('Invalid role. Must be "user" or "admin"');
        }

        // Update member role
        const { error: roleError } = await supabaseClient
          .from('profiles')
          .update({ role: newRole })
          .eq('id', memberId)
          .eq('organization_id', organization.id); // Safety check

        if (roleError) {
          throw new Error(`Failed to change member role: ${roleError.message}`);
        }

        console.log(`🔄 Changed member ${memberId} role to ${newRole}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Member role changed to ${newRole}`,
            memberId,
            newRole
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }

  } catch (error) {
    console.error('Manage organization members error:', error);
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