// Follow this pattern to import other modules from the Deno registry:
// import { example } from "https://deno.land/x/example@v0.0.0/mod.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Removed incorrect import for corsHeaders
// import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from "@supabase/supabase-js"; // Import Supabase client

// Define CORS headers directly in the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Adjust if needed for specific origins
  "Access-Control-Allow-Methods": "POST, OPTIONS", // Allow POST and OPTIONS
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("Add LERG Record function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Ensure the request method is POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    // Get Supabase client - Ensure env vars are set in Supabase Edge Function settings
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      // Add SUPABASE_SERVICE_ROLE_KEY if needed for inserts, though anon might suffice depending on RLS
      // Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    console.log("[add-lerg-record] Supabase client created");

    // Parse request body
    const { npa, state, country } = await req.json();
    console.log(
      `[add-lerg-record] Received data: NPA=${npa}, State=${state}, Country=${country}`
    );

    // Validate input data (required fields, format)
    if (!npa || !state || !country) {
      console.error(
        "[add-lerg-record] Validation Error: Missing required fields"
      );
      return new Response(
        JSON.stringify({
          error: "Missing required fields: npa, state, country",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Basic validation (adjust regex/checks as needed)
    if (!/^[0-9]{3}$/.test(npa)) {
      console.error(
        `[add-lerg-record] Validation Error: Invalid NPA format: ${npa}`
      );
      return new Response(
        JSON.stringify({ error: "Invalid NPA format (must be 3 digits)" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    if (!/^[A-Za-z]{2}$/.test(state)) {
      console.error(
        `[add-lerg-record] Validation Error: Invalid State format: ${state}`
      );
      return new Response(
        JSON.stringify({ error: "Invalid State format (must be 2 letters)" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    if (!/^[A-Za-z]{2}$/.test(country)) {
      console.error(
        `[add-lerg-record] Validation Error: Invalid Country format: ${country}`
      );
      return new Response(
        JSON.stringify({ error: "Invalid Country format (must be 2 letters)" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Insert data into Supabase 'lerg_codes' table (assuming table name from ping-status)
    console.log(`[add-lerg-record] Inserting record into lerg_codes...`);
    const { data, error: dbError } = await supabaseClient
      .from("lerg_codes") // Use the correct table name
      .insert([
        {
          npa: npa.trim(),
          state: state.trim().toUpperCase(),
          country: country.trim().toUpperCase(),
          // last_updated will likely be set by a DB trigger/default
        },
      ])
      .select(); // Optionally select the inserted row to return/log

    // Handle potential errors (database error, unique constraint violation)
    if (dbError) {
      console.error("[add-lerg-record] Supabase insert error:", dbError);
      if (dbError.code === "23505") {
        // Unique violation code for PostgreSQL
        return new Response(
          JSON.stringify({ error: `NPA '${npa}' already exists.` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 409, // Conflict
          }
        );
      }
      // Throw for other DB errors
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log("[add-lerg-record] Record inserted successfully:", data);
    const responseData = {
      message: "LERG record added successfully",
      record: data?.[0] ?? { npa, state, country },
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201, // Created
    });
  } catch (err) {
    console.error("[add-lerg-record] Error processing request:", err);
    // Check if it's a JSON parsing error
    if (err instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const errorMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/* 
To deploy:
supabase functions deploy add-lerg-record --no-verify-jwt

Make sure SUPABASE_URL and SUPABASE_ANON_KEY environment variables are set in your Supabase project function settings.
*/
