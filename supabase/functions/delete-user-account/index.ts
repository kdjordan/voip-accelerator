import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { getCorsHeaders } from "../_shared/cors.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';

console.log("delete-user-account function initializing");

serve(async (req: Request) => {
  console.log("delete-user-account function invoked", { method: req.method });

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight OPTIONS request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Initialize Stripe (only if key available)
    const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    }) : null;

    console.log("Supabase admin client initialized");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const jwt = authHeader.replace(/^Bearer\s+/, "");

    const {
      data: { user: requestingUser },
      error: userError,
    } = await supabaseAdminClient.auth.getUser(jwt);

    if (userError || !requestingUser) {
      console.error("Authentication error or user not found:", userError);
      return new Response(
        JSON.stringify({
          error:
            userError?.message || "Authentication failed or user not found.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const userIdToDelete = requestingUser.id;
    console.log(`[Delete Account] Processing deletion request for user: ${userIdToDelete}`);

    // Track warnings for non-critical issues
    const warnings: string[] = [];

    // STEP 1: Get user profile for Stripe information and subscription status
    const { data: profile, error: profileFetchError } = await supabaseAdminClient
      .from('profiles')
      .select('subscription_id, subscription_status, current_period_end, stripe_customer_id')
      .eq('id', userIdToDelete)
      .single();

    if (profileFetchError) {
      console.warn(`[Delete Account] Could not fetch profile for user ${userIdToDelete}:`, profileFetchError);
      warnings.push('Could not verify subscription status');
    }

    // STEP 2: Handle Stripe subscription cancellation (if applicable)
    let deletionScheduledFor: string | null = null;

    // Check if user has an active subscription (includes active, past_due, trialing states)
    const hasActiveSubscription = profile?.subscription_id &&
      ['active', 'past_due', 'trialing'].includes(profile.subscription_status);

    if (stripe && hasActiveSubscription) {
      try {
        console.log(`[Delete Account] Scheduling Stripe subscription cancellation at period end for: ${profile.subscription_id}`);

        // Industry standard: Cancel at period end (user keeps access they paid for)
        const updatedSubscription = await stripe.subscriptions.update(
          profile.subscription_id,
          {
            cancel_at_period_end: true,
            metadata: {
              deletion_requested_at: new Date().toISOString(),
              deletion_reason: 'user_requested'
            }
          }
        );

        deletionScheduledFor = updatedSubscription.current_period_end
          ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
          : null;

        console.log(`[Delete Account] Subscription scheduled for cancellation. Access until: ${deletionScheduledFor}`);

        // STEP 3: Mark profile for deletion (don't delete yet - user keeps access until period end)
        const { error: markDeletionError } = await supabaseAdminClient
          .from('profiles')
          .update({
            account_deletion_scheduled_at: new Date().toISOString(),
            deletion_reason: 'user_requested',
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userIdToDelete);

        if (markDeletionError) {
          console.error(`[Delete Account] Failed to mark profile for deletion:`, markDeletionError);
          throw new Error(`Failed to schedule account deletion: ${markDeletionError.message}`);
        }

        console.log(`[Delete Account] Profile marked for deletion on ${deletionScheduledFor}`);

        // Return success with scheduled deletion info
        return new Response(
          JSON.stringify({
            success: true,
            message: "Account deletion scheduled. You'll keep access until your billing period ends.",
            deletion_scheduled_for: deletionScheduledFor,
            access_until: deletionScheduledFor,
            warnings: warnings.length > 0 ? warnings : undefined
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );

      } catch (stripeError: any) {
        console.error(`[Delete Account] Stripe cancellation failed:`, stripeError);
        warnings.push(`Stripe cancellation failed: ${stripeError.message}`);
        // Continue with immediate deletion if Stripe fails
      }
    }

    // STEP 4: Immediate deletion for trial users or if no active subscription
    console.log(`[Delete Account] Proceeding with immediate deletion (trial user or no active subscription)`);

    // Delete profile first (triggers active_sessions cascade)
    const { error: deleteProfileError } = await supabaseAdminClient
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete);

    if (deleteProfileError) {
      console.error(`[Delete Account] Error deleting profile:`, deleteProfileError);
      warnings.push(`Profile deletion warning: ${deleteProfileError.message}`);
    } else {
      console.log(`[Delete Account] Profile deleted for user ${userIdToDelete}`);
    }

    // Delete auth user (triggers usage_metrics cascade)
    const { error: deleteAuthUserError } = await supabaseAdminClient.auth.admin.deleteUser(userIdToDelete);

    if (deleteAuthUserError) {
      console.error(`[Delete Account] Error deleting user from auth.users:`, deleteAuthUserError);
      throw new Error(`Failed to delete user from authentication: ${deleteAuthUserError.message}`);
    }

    console.log(`[Delete Account] User ${userIdToDelete} deleted from auth.users successfully`);

    // Delete Stripe customer if exists (for complete cleanup)
    if (stripe && profile?.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id);
        console.log(`[Delete Account] Stripe customer deleted: ${profile.stripe_customer_id}`);
      } catch (stripeError: any) {
        console.warn(`[Delete Account] Failed to delete Stripe customer:`, stripeError);
        warnings.push(`Stripe customer deletion failed: ${stripeError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User account and associated data deleted successfully.",
        warnings: warnings.length > 0 ? warnings : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("[Delete Account] Critical error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal Server Error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
