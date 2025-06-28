// Follow this pattern to import other modules from the Deno registry:
// import { example } from "https://deno.land/x/example@v0.0.0/mod.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const LERG_CODES_TABLE = "lerg_codes";

// Regular expression for validating 2-letter codes (case-insensitive)
const twoLetterCodeRegex = /^[A-Za-z]{2}$/;
// Regular expression for validating 3-digit NPA
const npaRegex = /^[0-9]{3}$/;

interface LergRecordPayload {
  npa: string;
  state: string;
  country: string;
}

async function validatePayload(
  payload: LergRecordPayload
): Promise<{ valid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};

  if (!payload.npa || !npaRegex.test(payload.npa)) {
    errors.npa = "NPA must be exactly 3 digits.";
  }

  if (!payload.state || !twoLetterCodeRegex.test(payload.state)) {
    errors.state = "State must be exactly 2 letters.";
  }

  if (!payload.country || !twoLetterCodeRegex.test(payload.country)) {
    errors.country = "Country must be exactly 2 letters.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { npa, state, country } = await req.json();

    // Create a new Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Insert new record directly, assuming the call is from an authorized admin
    const { error: insertError } = await serviceClient
      .from(LERG_CODES_TABLE)
      .insert({
        npa: npa,
        state: state.toUpperCase(),
        country: country.toUpperCase(),
        last_updated: new Date().toISOString(),
      });

    if (insertError) {
      if (insertError.code === "23505") {
        // Handle duplicate NPA error
        return new Response(
          JSON.stringify({ error: `NPA '${npa}' already exists.` }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      // Handle other database errors
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: `Database error: ${insertError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Success Response ---
    return new Response(
      JSON.stringify({ message: "Record added successfully" }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/* 
To deploy:
supabase functions deploy add-lerg-record --no-verify-jwt

Make sure SUPABASE_URL and SUPABASE_ANON_KEY environment variables are set in your Supabase project function settings.
*/
