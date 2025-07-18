import { ref, computed } from 'vue';
import { supabase } from '@/utils/supabase';
import { useUserStore } from '@/stores/user-store';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface SubscriptionStatus {
  isActive: boolean;
  requiresPayment: boolean;
  subscriptionStatus: 'trial' | 'monthly' | 'annual' | 'cancelled';
  planExpiresAt: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  message: string;
}

export function useBilling() {
  const userStore = useUserStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Stripe price IDs (you'll need to get these from your Stripe dashboard)
  const PRICE_IDS = {
    monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_monthly_test',
    annual: import.meta.env.VITE_STRIPE_PRICE_ANNUAL || 'price_annual_test',
  };

  const currentPlan = computed(() => userStore.getUserProfile?.subscription_status || 'trial');
  const isSubscriptionActive = computed(() => userStore.isPlanActive);

  /**
   * Check current subscription status
   */
  async function checkSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: fnError } = await supabase.functions.invoke('check-subscription-status');
      
      if (fnError) throw fnError;
      
      return data as SubscriptionStatus;
    } catch (err: any) {
      error.value = err.message || 'Failed to check subscription status';
      console.error('Error checking subscription status:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create Stripe checkout session
   */
  async function createCheckoutSession(plan: 'monthly' | 'annual') {
    try {
      loading.value = true;
      error.value = null;

      const priceId = PRICE_IDS[plan];
      
      console.log('💳 USEBILLING: Creating checkout session');
      console.log('Plan requested:', plan);
      console.log('Price ID being sent:', priceId);
      console.log('Monthly price ID:', PRICE_IDS.monthly);
      console.log('Annual price ID:', PRICE_IDS.annual);
      
      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/dashboard?payment=cancelled`;

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          successUrl,
          cancelUrl,
        },
      });

      if (fnError) throw fnError;

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Alternative: Use Stripe.js to redirect
        const stripe = await stripePromise;
        if (stripe) {
          const { error: stripeError } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });
          if (stripeError) throw stripeError;
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to create checkout session';
      console.error('Error creating checkout session:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Open Stripe billing portal
   */
  async function openBillingPortal() {
    try {
      loading.value = true;
      error.value = null;

      const returnUrl = `${window.location.origin}/dashboard`;

      const { data, error: fnError } = await supabase.functions.invoke('create-portal-session', {
        body: { returnUrl },
      });

      if (fnError) throw fnError;

      // Redirect to Stripe billing portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to open billing portal';
      console.error('Error opening billing portal:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Track usage metric
   */
  async function trackUsageMetric(
    metricType: 'comparison' | 'adjustment',
    source: 'us' | 'az',
    metadata?: Record<string, any>
  ) {
    try {
      // Direct database insert for better performance
      const { error: insertError } = await supabase
        .from('usage_metrics')
        .insert({
          user_id: userStore.getUser?.id,
          metric_type: metricType,
          source,
          metadata: metadata || {},
        });

      if (insertError) {
        console.error('Error tracking usage metric:', insertError);
      }
    } catch (err) {
      console.error('Error tracking usage metric:', err);
    }
  }

  /**
   * Get user usage statistics
   */
  async function getUserUsageStats() {
    try {
      const { data, error: queryError } = await supabase
        .from('user_usage_stats')
        .select('*')
        .eq('user_id', userStore.getUser?.id)
        .single();

      if (queryError && queryError.code !== 'PGRST116') { // Ignore "no rows" error
        throw queryError;
      }

      return data || {
        total_comparisons: 0,
        total_adjustments: 0,
        us_comparisons: 0,
        az_comparisons: 0,
        us_adjustments: 0,
        az_adjustments: 0,
        actions_today: 0,
        actions_this_week: 0,
        actions_this_month: 0,
      };
    } catch (err: any) {
      console.error('Error getting usage stats:', err);
      return null;
    }
  }


  return {
    loading,
    error,
    currentPlan,
    isSubscriptionActive,
    checkSubscriptionStatus,
    createCheckoutSession,
    openBillingPortal,
    trackUsageMetric,
    getUserUsageStats,
  };
}