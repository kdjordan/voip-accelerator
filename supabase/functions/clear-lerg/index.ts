import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[clear-lerg] Truncating LERG data from database");

    // Clear existing LERG data using DELETE
    const { error: truncateError } = await supabaseClient
      .from("lerg_codes")
      .delete()
      .neq("npa", "000"); // This will delete all records

    if (truncateError) {
      console.error("[clear-lerg] Error truncating table:", truncateError);
      throw truncateError;
    }

    console.log("[clear-lerg] Successfully cleared all LERG data");

    return new Response(
      JSON.stringify({
        success: true,
        message: "All LERG data has been cleared from the database",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    console.error("[clear-lerg] Error:", err);
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "An error occurred while clearing LERG data",
        details: err,
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
