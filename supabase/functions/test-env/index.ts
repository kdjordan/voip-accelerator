import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const envVars = {
      STRIPE_PRICE_OPTIMIZER: Deno.env.get('STRIPE_PRICE_OPTIMIZER'),
      STRIPE_PRICE_ACCELERATOR: Deno.env.get('STRIPE_PRICE_ACCELERATOR'),
      STRIPE_PRICE_ENTERPRISE: Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
      STRIPE_SECRET_KEY: !!Deno.env.get('STRIPE_SECRET_KEY'),
    };

    console.log('Environment variables:', envVars);

    return new Response(
      JSON.stringify(envVars),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});