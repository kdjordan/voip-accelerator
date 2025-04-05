import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// CORS headers for the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[ping-status] Function invoked");

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    console.log("[ping-status] Supabase client created");

    // Check if LERG table exists by trying to count records
    console.log("[ping-status] Checking if LERG table exists");
    const { count, error } = await supabaseClient
      .from("lerg_codes")
      .select("*", { count: "exact", head: true });

    if (error && error.code !== "PGRST116") {
      // If error is not just "no rows returned", it's a real error
      console.error("[ping-status] Error checking LERG table:", error);
      throw error;
    }

    const hasLergTable = error?.code !== "PGRST204"; // PGRST204 is "relation not found"
    console.log("[ping-status] LERG table exists:", hasLergTable);

    const response = {
      status: "ok",
      hasLergTable,
      timestamp: new Date().toISOString(),
    };

    console.log("[ping-status] Response:", response);

    // Return response with CORS headers
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[ping-status] Connection test failed:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
