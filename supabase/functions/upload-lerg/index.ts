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

    console.log(`Received ${records.length} records to process.`);

    // First, clear all existing LERG codes - THIS IS THE OLD, PROBLEMATIC CODE.
    /*
    const { error: deleteError } = await supabaseClient.from(LERG_CODES_TABLE).delete().neq('npa', '000'); // Delete all but a dummy value
    if (deleteError) {
      console.error('Error clearing LERG codes:', deleteError);
      throw deleteError;
    }
    console.log('Successfully cleared existing LERG codes.');
    */

    // Add a last_updated timestamp to each record
    const timestamp = new Date().toISOString();

    // Process in chunks of 25 for insertion
    const CHUNK_SIZE = 25;
    let totalProcessed = 0;
    let failedChunks = 0;

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

      try {
        const { error: upsertError } = await supabaseClient
          .from("lerg_codes")
          .upsert(chunk, { onConflict: "npa" });

        if (upsertError) {
          console.error(
            `Error upserting chunk starting at index ${i}:`,
            upsertError
          );
          failedChunks++;
        } else {
          totalProcessed += chunk.length;
          console.log(
            `[upload-lerg] Progress: ${totalProcessed}/${records.length} records processed`
          );

          // Add a small delay between chunks to prevent rate limiting
          if (i + CHUNK_SIZE < records.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      } catch (err) {
        console.error("[upload-lerg] Chunk insertion failed:", {
          chunkIndex: Math.floor(i / CHUNK_SIZE) + 1,
          error: err,
        });
        throw err;
      }
    }

    const message = `Upload complete. Successfully processed ${
      records.length
    } records. ${
      failedChunks > 0
        ? `${failedChunks} chunks failed.`
        : "New records were added and existing ones were updated."
    }`;

    console.log(message);

    return new Response(
      JSON.stringify({ message, successfulInserts: totalProcessed }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    console.error("[upload-lerg] Error:", err);
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "An error occurred during upload",
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
