import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface LERGRecord {
  npa: string;
  state: string;
  country: string;
  last_updated?: Date;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[upload-lerg] Parsing request body");
    const body = await req.json();
    const { records } = body;

    // Validate records array
    if (!records || !Array.isArray(records)) {
      console.log("[upload-lerg] No valid records array provided");
      return new Response(
        JSON.stringify({ error: "No valid records array provided" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Validate record structure
    const isValidRecord = (record: any): record is LERGRecord => {
      return (
        typeof record === "object" &&
        typeof record.npa === "string" &&
        typeof record.state === "string" &&
        typeof record.country === "string"
      );
    };

    if (!records.every(isValidRecord)) {
      console.log("[upload-lerg] Invalid record structure detected");
      return new Response(
        JSON.stringify({ error: "Invalid record structure in array" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log(`[upload-lerg] Processing ${records.length} records`);

    // Clear existing LERG data
    console.log("[upload-lerg] Truncating existing LERG data");
    const { error: truncateError } = await supabaseClient.rpc(
      "truncate_lerg_codes"
    );
    if (truncateError) {
      console.error("[upload-lerg] Error truncating table:", truncateError);
      throw truncateError;
    }

    // Process in chunks of 25 for insertion
    const CHUNK_SIZE = 25;
    let totalProcessed = 0;

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE).map((record) => ({
        ...record,
        last_updated: new Date(),
      }));

      console.log(
        `[upload-lerg] Inserting chunk ${
          Math.floor(i / CHUNK_SIZE) + 1
        }/${Math.ceil(records.length / CHUNK_SIZE)}`
      );

      const { error: insertError } = await supabaseClient
        .from("lerg_codes")
        .insert(chunk);

      if (insertError) {
        console.error("[upload-lerg] Error inserting records:", insertError);
        throw insertError;
      }

      totalProcessed += chunk.length;
      console.log(
        `[upload-lerg] Progress: ${totalProcessed}/${records.length} records processed`
      );
    }

    const result = {
      processedRecords: totalProcessed,
      totalRecords: records.length,
    };

    console.log("[upload-lerg] Upload completed successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("[upload-lerg] Error:", err);
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "An error occurred during upload",
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
