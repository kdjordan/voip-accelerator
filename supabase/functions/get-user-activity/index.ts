import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("get-user-activity function initializing");

serve(async (req: Request) => {
  console.log("get-user-activity function invoked", { method: req.method });

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

    // Verify admin role
    const { data: requestingUserProfile, error: profileError } = await supabaseAdminClient
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if (profileError || !requestingUserProfile || !['admin', 'superadmin'].includes(requestingUserProfile.role)) {
      console.error("Access denied: User is not an admin", { userId: requestingUser.id, role: requestingUserProfile?.role });
      return new Response(
        JSON.stringify({ error: "Access denied. Admin role required." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Get user ID from query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Fetch user activity data (placeholder implementation)
    const { data: userProfile, error: fetchError } = await supabaseAdminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error("Error fetching user profile:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log(`Successfully fetched user activity for user ${userId}`);

    return new Response(
      JSON.stringify({
        user: userProfile,
        activity: {
          lastLogin: userProfile.updated_at,
          loginCount: 1, // Placeholder
          // Add more activity data as needed
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Critical error in get-user-activity function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});