import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

interface LERGRecord {
  npa: string;
  state: string;
  country: string;
  last_updated?: Date;
}

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

  console.log("[get-lerg-data] Function invoked");

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[get-lerg-data] Supabase client created");

    // Query the lerg_codes table
    console.log("[get-lerg-data] Querying lerg_codes table");
    const { data: lergData, error: lergError } = await supabaseClient
      .from("lerg_codes")
      .select("npa, state, country")
      .order("npa");

    if (lergError) {
      console.error("[get-lerg-data] Error querying lerg_codes:", lergError);
      throw lergError;
    }

    console.log(`[get-lerg-data] Retrieved ${lergData?.length || 0} records`);

    // Get stats
    console.log("[get-lerg-data] Getting count stats");
    const { data: countData, error: countError } = await supabaseClient
      .from("lerg_codes")
      .select("count", { count: "exact" });

    if (countError) {
      console.error("[get-lerg-data] Error getting count:", countError);
      throw countError;
    }

    console.log("[get-lerg-data] Getting last updated timestamp");
    const { data: lastUpdatedData, error: lastUpdatedError } =
      await supabaseClient
        .from("lerg_codes")
        .select("last_updated")
        .order("last_updated", { ascending: false })
        .limit(1);

    if (lastUpdatedError) {
      console.error(
        "[get-lerg-data] Error getting last updated:",
        lastUpdatedError
      );
      throw lastUpdatedError;
    }

    const result = {
      data: lergData,
      stats: {
        totalRecords: countData,
        lastUpdated: lastUpdatedData?.[0]?.last_updated || null,
      },
    };

    console.log("[get-lerg-data] Successfully compiled response");

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[get-lerg-data] Error fetching LERG data:", error);

    return new Response(
      JSON.stringify({
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
