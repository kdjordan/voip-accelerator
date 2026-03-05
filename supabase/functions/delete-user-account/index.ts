import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("delete-user-account function initializing");

serve(async (req: Request) => {
  console.log("delete-user-account function invoked", { method: req.method });

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight OPTIONS request
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
          error:
            userError?.message || "Authentication failed or user not found.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Check if admin is trying to delete another user
    let userIdToDelete = requestingUser.id;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.userId && body.userId !== requestingUser.id) {
          // Admin trying to delete another user - verify admin role
          const { data: adminProfile, error: profileError } = await supabaseAdminClient
            .from('profiles')
            .select('role')
            .eq('id', requestingUser.id)
            .single();

          if (profileError || !adminProfile || adminProfile.role !== 'admin') {
            console.error('[Delete Account] Non-admin trying to delete another user');
            return new Response(
              JSON.stringify({ error: 'Admin privileges required to delete other users.' }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
              }
            );
          }
          userIdToDelete = body.userId;
          console.log(`[Delete Account] Admin ${requestingUser.id} deleting user: ${userIdToDelete}`);
        }
      } catch (e) {
        // No body or invalid JSON - proceed with self-deletion
      }
    }

    console.log(`[Delete Account] Processing deletion request for user: ${userIdToDelete}`);

    // Delete profile first (triggers active_sessions cascade)
    const { error: deleteProfileError } = await supabaseAdminClient
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete);

    if (deleteProfileError) {
      console.error(`[Delete Account] Error deleting profile:`, deleteProfileError);
      // Continue - profile may not exist
    } else {
      console.log(`[Delete Account] Profile deleted for user ${userIdToDelete}`);
    }

    // Delete auth user
    const { error: deleteAuthUserError } = await supabaseAdminClient.auth.admin.deleteUser(userIdToDelete);

    if (deleteAuthUserError) {
      console.error(`[Delete Account] Error deleting user from auth.users:`, deleteAuthUserError);
      throw new Error(`Failed to delete user from authentication: ${deleteAuthUserError.message}`);
    }

    console.log(`[Delete Account] User ${userIdToDelete} deleted from auth.users successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User account and associated data deleted successfully."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("[Delete Account] Critical error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal Server Error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
