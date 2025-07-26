import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/utils/supabase';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface CheckoutOptions {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export const stripeService = {
  /**
   * Create a Stripe checkout session and redirect to checkout
   */
  async createCheckoutSession(options: CheckoutOptions) {
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to subscribe');
      }

      // Get Stripe instance
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Create checkout session via edge function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: options.priceId,
          successUrl: options.successUrl || `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: options.cancelUrl || `${window.location.origin}/pricing?subscription=cancelled`,
          customerEmail: user.email,
          userId: user.id,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.sessionId) {
        throw new Error('Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        throw stripeError;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  },

  /**
   * Create a customer portal session for subscription management
   */
  async createPortalSession() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to manage your subscription');
      }

      // Create portal session via edge function
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/profile`,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error('Failed to create portal session');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal session error:', error);
      throw error;
    }
  },

  /**
   * Get the current user's subscription status
   */
  async getSubscriptionStatus() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, current_period_end, cancel_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription status:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Subscription status error:', error);
      return null;
    }
  },

  /**
   * Get Stripe account information (admin only)
   */
  async getStripeAccountInfo() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to access account information');
      }

      // Get account info via edge function
      const { data, error } = await supabase.functions.invoke('get-stripe-account');

      if (error) {
        throw error;
      }

      return data?.account || null;
    } catch (error) {
      console.error('Stripe account info error:', error);
      throw error;
    }
  },
};