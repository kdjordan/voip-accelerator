import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[clear-lerg] Function invoked");

  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[clear-lerg] Supabase client created");

    // Soft delete all records by setting is_active to false
    // This preserves data for audit purposes while making it invisible to normal queries
    console.log("[clear-lerg] Performing soft delete on enhanced_lerg table");
    const { data, error } = await supabaseClient
      .from("enhanced_lerg")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
        notes: "Cleared via admin interface"
      })
      .eq("is_active", true)
      .select("npa");

    if (error) {
      console.error("[clear-lerg] Error clearing enhanced_lerg:", error);
      throw error;
    }

    const recordsCleared = data?.length || 0;
    console.log(`[clear-lerg] Successfully cleared ${recordsCleared} records`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cleared ${recordsCleared} LERG records`,
        recordsCleared,
        timestamp: new Date().toISOString(),
        operation: "soft_delete"
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error("[clear-lerg] Error clearing LERG data:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to clear LERG data from enhanced_lerg table"
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