import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication first
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate JWT token to ensure authenticated user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(
      token
    );

    if (userError || !userData.user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authenticatedUser = userData.user;
    console.log(
      `[upgrade-subscription] Authenticated user: ${authenticatedUser.id}`
    );

    const { subscriptionId, newTier, currentTier, userId } = await req.json();

    if (!subscriptionId || !newTier || !currentTier) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Security check: Verify the authenticated user owns this subscription
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, subscription_id")
      .eq("id", authenticatedUser.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile lookup error:", profileError);
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Verify the user owns the subscription being upgraded
    if (profile.subscription_id !== subscriptionId) {
      console.error(
        `Security violation: User ${authenticatedUser.id} attempted to upgrade subscription ${subscriptionId} but owns ${profile.subscription_id}`
      );
      return new Response(
        JSON.stringify({
          error: "Unauthorized: You can only upgrade your own subscription",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Additional security: verify userId parameter matches authenticated user
    if (userId && userId !== authenticatedUser.id) {
      console.error(
        `Parameter mismatch: userId ${userId} does not match authenticated user ${authenticatedUser.id}`
      );
      return new Response(
        JSON.stringify({ error: "Unauthorized: User ID mismatch" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2022-11-15",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Map tier to price ID
    const tierToPriceId = {
      optimizer: Deno.env.get("STRIPE_PRICE_OPTIMIZER"),
      accelerator: Deno.env.get("STRIPE_PRICE_ACCELERATOR"),
      enterprise: Deno.env.get("STRIPE_PRICE_ENTERPRISE"),
    };

    const newPriceId = tierToPriceId[newTier as keyof typeof tierToPriceId];

    if (!newPriceId) {
      throw new Error("Invalid tier specified");
    }

    // Update the subscription with the new price
    // This will automatically prorate the charges
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations", // This handles prorating automatically
      }
    );

    // Update the user's profile in Supabase
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authenticatedUser.id);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      // Note: We don't throw here because the Stripe update succeeded
      // The webhook will eventually sync this data
    }

    console.log(
      `✅ Successfully upgraded user ${authenticatedUser.id} from ${currentTier} to ${newTier}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: updatedSubscription.id,
        newTier,
        message: "Subscription upgraded successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upgrade error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
