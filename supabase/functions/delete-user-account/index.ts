import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; // Standard Deno serve
import { createClient } from "@supabase/supabase-js"; // Matches user's existing pattern
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("delete-user-account function initializing");

serve(async (req: Request) => {
  console.log("delete-user-account function invoked", { method: req.method });

  // Get the origin from the request headers
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
      auth: { persistSession: false }, // Important for admin client
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
    // console.log("Extracted JWT (first 10 chars):", jwt.substring(0, 10)); // Keep commented for security

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

    const userIdToDelete = requestingUser.id;
    console.log(`Attempting to delete user: ${userIdToDelete}`);

    const { error: deleteAuthUserError } =
      await supabaseAdminClient.auth.admin.deleteUser(userIdToDelete);

    if (deleteAuthUserError) {
      console.error(
        `Error deleting user ${userIdToDelete} from auth.users:`,
        deleteAuthUserError
      );
      throw new Error(
        `Failed to delete user from authentication: ${deleteAuthUserError.message}`
      );
    }

    console.log(`User ${userIdToDelete} deleted from auth.users successfully.`);

    // Step 2: Delete related user data from other tables (e.g., 'profiles', 'call_logs')
    // This requires knowing your database schema and ensuring cascade deletes are set up (FOREIGN KEY with ON DELETE CASCADE)
    // or manually deleting from all related tables.
    // Example for a 'profiles' table (uncomment and adapt if you have one):
    /*
    const { error: deleteProfileError } = await supabaseAdminClient
      .from('profiles') // Replace 'profiles' with your actual table name
      .delete()
      .eq('user_id', userIdToDelete); // Ensure this column name ('user_id') is correct

    if (deleteProfileError) {
      // Log this warning but don't necessarily throw an error, as auth user is already deleted.
      // This might indicate orphaned data that needs cleanup or a schema issue.
      console.warn(`Warning: Could not delete profile for user ${userIdToDelete}: ${deleteProfileError.message}`);
    } else {
      console.log(`Profile data deleted for user ${userIdToDelete}.`);
    }
    */

    return new Response(
      JSON.stringify({
        message: "User account and associated data deleted successfully.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Critical error in delete-user-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
