import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("get-all-users function initializing");

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string | null;
  role: string;
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  total_uploads: number | null;
  billing_period: string | null;
  email?: string; // From auth.users
}

interface GetUsersResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

serve(async (req: Request) => {
  console.log("get-all-users function invoked", { method: req.method });

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    console.log("Supabase admin client initialized");

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const jwt = authHeader.replace(/^Bearer\s+/, "");
    const {
      data: { user: requestingUser },
      error: userError,
    } = await supabaseAdminClient.auth.getUser(jwt);

    if (userError || !requestingUser) {
      console.error("Authentication error or user not found:", userError);
      return new Response(
        JSON.stringify({
          error: userError?.message || "Authentication failed or user not found.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Verify admin role (updated to use 'admin' after simplification)
    const { data: requestingUserProfile, error: profileError } = await supabaseAdminClient
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if (profileError || !requestingUserProfile || requestingUserProfile.role !== 'admin') {
      console.error("Access denied: User is not an admin", { userId: requestingUser.id, role: requestingUserProfile?.role });
      return new Response(
        JSON.stringify({ error: "Access denied. Admin role required." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Parse request parameters
    let params: GetUsersParams = {};
    if (req.method === "GET") {
      const url = new URL(req.url);
      params = {
        page: parseInt(url.searchParams.get('page') || '1'),
        limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 100),
        search: url.searchParams.get('search') || undefined,
        role: url.searchParams.get('role') || undefined,
        status: url.searchParams.get('status') || undefined,
      };
    } else if (req.method === "POST") {
      const body = await req.json();
      params = {
        page: body.page || 1,
        limit: Math.min(body.limit || 20, 100),
        search: body.search,
        role: body.role,
        status: body.status,
      };
    }

    const { page = 1, limit = 20, search, role, status } = params;
    const offset = (page - 1) * limit;

    console.log("Fetching users with params:", { page, limit, search, role, status });

    // Build query for profiles with auth.users data (updated after subscription simplification)
    let query = supabaseAdminClient
      .from('profiles')
      .select(`
        id,
        created_at,
        updated_at,
        role,
        plan_expires_at,
        stripe_customer_id,
        subscription_status,
        total_uploads,
        billing_period
      `);

    // Apply filters (updated to remove 'super_admin' role)
    if (role && ['user', 'admin'].includes(role)) {
      query = query.eq('role', role);
    }

    // For search, we'll need to fetch auth.users data separately since we can't join directly
    let userIds: string[] | undefined;
    if (search) {
      // Search in auth.users for email
      const { data: authUsers, error: authSearchError } = await supabaseAdminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000, // Get more to search through
      });

      if (authSearchError) {
        console.error("Error searching auth users:", authSearchError);
      } else {
        // Filter users by email search
        const filteredUsers = authUsers.users.filter(user => 
          user.email?.toLowerCase().includes(search.toLowerCase())
        );
        userIds = filteredUsers.map(user => user.id);
        
        if (userIds.length === 0) {
          // No matching emails, return empty result
          return new Response(
            JSON.stringify({
              users: [],
              total: 0,
              page,
              limit,
              hasMore: false,
            } as GetUsersResponse),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
        
        query = query.in('id', userIds);
      }
    }

    // Get total count for pagination
    let countQuery = supabaseAdminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (role && ['user', 'admin'].includes(role)) {
      countQuery = countQuery.eq('role', role);
    }
    if (userIds) {
      countQuery = countQuery.in('id', userIds);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Error getting user count:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to get user count." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Apply pagination and get results
    const { data: profiles, error: profilesError } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error("Error fetching user profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profiles." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Fetch email addresses from auth.users for the returned profiles
    const profileIds = profiles?.map(p => p.id) || [];
    const { data: authUsersData } = await supabaseAdminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    // Create a map of user ID to email
    const emailMap = new Map<string, string>();
    authUsersData?.users?.forEach(user => {
      if (profileIds.includes(user.id) && user.email) {
        emailMap.set(user.id, user.email);
      }
    });

    // Combine profile data with email addresses
    const users: UserProfile[] = (profiles || []).map(profile => ({
      ...profile,
      email: emailMap.get(profile.id),
    }));

    const hasMore = (totalCount || 0) > offset + limit;

    const response: GetUsersResponse = {
      users,
      total: totalCount || 0,
      page,
      limit,
      hasMore,
    };

    console.log(`Successfully fetched ${users.length} users (page ${page})`);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Critical error in get-all-users function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    // 🔒 SECURITY: Don't expose error details in production
    return new Response(
      JSON.stringify({
        error: "Internal server error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});