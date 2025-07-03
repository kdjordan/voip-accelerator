import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

interface PingStatusResponse {
  status: "ok" | "error";
  hasLergTable: boolean;
  error: string | null;
  timestamp: string;
}

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

    // Attempt to select from 'profiles' and 'enhanced_lerg'
    const [profilesResult, lergResult] = await Promise.all([
      supabaseClient.from("profiles").select("id").limit(1),
      supabaseClient.from("enhanced_lerg").select("npa").limit(1),
    ]);

    const response: PingStatusResponse = {
      status: "ok",
      hasLergTable: lergResult.error === null,
      error: profilesResult.error?.message || lergResult.error?.message || null,
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
