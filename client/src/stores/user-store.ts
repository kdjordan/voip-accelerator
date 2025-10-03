import { defineStore } from 'pinia';
import type { User, Profile, PlanTierType, BillingPeriod } from '../types/user-types';
import { supabase } from '@/utils/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface SharedState {
  ui: {
    isSideNavOpen: boolean;
    isAppMobileMenuOpen: boolean;
    isGlobalLoading: boolean;
  };
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    profile: Profile | null;
    error: Error | null;
    isInitialized: boolean;
  };
  usage: {
    uploadsToday: number;
  };
}

export const useUserStore = defineStore('user', {
  state: (): SharedState => ({
    ui: {
      isSideNavOpen: false,
      isAppMobileMenuOpen: false,
      isGlobalLoading: false,
    },
    auth: {
      isAuthenticated: false,
      isLoading: true,
      user: null,
      profile: null,
      error: null,
      isInitialized: false,
    },
    usage: {
      uploadsToday: 0,
    },
  }),

  getters: {
    getSideNavOpen: (state) => state.ui.isSideNavOpen,
    getAppMobileMenuOpen: (state) => state.ui.isAppMobileMenuOpen,
    getIsGlobalLoading: (state) => state.ui.isGlobalLoading,
    getUser: (state) => state.auth.user,
    getUserProfile: (state) => state.auth.profile,
    getIsAuthenticated: (state) => state.auth.isAuthenticated,
    getAuthIsLoading: (state) => state.auth.isLoading,
    getAuthError: (state) => state.auth.error,
    getAuthIsInitialized: (state) => state.auth.isInitialized,
    getUserRole: (state) => state.auth.profile?.role ?? 'user',
    isAdmin: (state) => state.auth.profile?.role === 'admin',
    getUploadsToday: (state) => state.usage.uploadsToday,
    isPlanActive: (state) => {
      if (!state.auth.profile?.plan_expires_at) {
        return false;
      }
      try {
        return new Date(state.auth.profile.plan_expires_at) > new Date();
      } catch (e) {
        console.error('Error parsing plan_expires_at date:', state.auth.profile.plan_expires_at, e);
        return false;
      }
    },
    getCurrentPlanTier: (state): PlanTierType | null => {
      // Simplified: trial or active based on subscription_status
      if (state.auth.profile?.subscription_status === 'trial') {
        return 'trial';
      }
      if (state.auth.profile?.subscription_status === 'active') {
        return 'active';
      }
      return null;
    },

    getBillingPeriod: (state): BillingPeriod => {
      return state.auth.profile?.billing_period ?? null;
    },

    isAnnualBilling: (state): boolean => {
      return state.auth.profile?.billing_period === 'annual';
    },

    getCurrentPrice: (state): number => {
      // Return price based on billing period
      if (state.auth.profile?.billing_period === 'annual') {
        return 999;
      }
      return 99; // monthly default
    },
    getServiceExpiryBanner: (state) => {
      const profile = state.auth.profile;
      if (!profile) {
        return { show: false, message: '' };
      }

      const now = new Date();
      const subscriptionStatus = profile.subscription_status;
      
      // Check for trial expiry
      if (subscriptionStatus === 'trial') {
        if (profile.plan_expires_at) {
          const trialEnd = new Date(profile.plan_expires_at);
          if (now >= trialEnd) {
            return {
              show: true,
              message: "Your free trial has expired. Please choose a plan to continue using VoIP Accelerator.",
              variant: 'error' as const,
              buttonText: "Choose Plan"
            };
          } else {
            const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysRemaining <= 3) {
              return {
                show: true,
                message: `Your free trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Subscribe now to ensure uninterrupted access.`,
                variant: 'warning' as const,
                buttonText: "Upgrade"
              };
            }
          }
        }
      }
      
      // Check for scheduled cancellation
      else if (subscriptionStatus === 'active' && profile.cancel_at_period_end && profile.cancel_at) {
        const cancelDate = new Date(profile.cancel_at);
        if (now < cancelDate) {
          const daysRemaining = Math.ceil((cancelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            show: true,
            message: `Your subscription is scheduled to cancel in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. You can continue using the service until then or reactivate your subscription.`,
            variant: 'warning' as const,
            buttonText: "Reactivate Subscription"
          };
        }
      }
      
      // Check for subscription expiry
      else if ((subscriptionStatus === 'monthly' || subscriptionStatus === 'annual' || subscriptionStatus === 'active') && profile.current_period_end) {
        const subscriptionEnd = new Date(profile.current_period_end);
        if (now >= subscriptionEnd) {
          const planType = subscriptionStatus === 'monthly' ? 'monthly plan' : 
                          subscriptionStatus === 'annual' ? 'annual membership' : 'subscription';
          return {
            show: true,
            message: `Your ${planType} has expired. Please renew to continue service.`,
            variant: 'error' as const,
            buttonText: "Renew Now"
          };
        }
      }
      
      // Check for explicitly cancelled states (NOT null/undefined)
      else if (subscriptionStatus === 'cancelled' || subscriptionStatus === 'canceled') {
        return {
          show: true,
          message: "Your subscription has been canceled. Please subscribe to continue using VoIP Accelerator.",
          variant: 'error' as const,
          buttonText: "Subscribe Now"
        };
      }
      
      // Check for no subscription (null/undefined means never had one, not cancelled)
      else if (!subscriptionStatus) {
        // New user without subscription - don't show error banner
        return { show: false, message: '' };
      }

      // No upload limits - all plans unlimited
      return { show: false, message: '' };
    },
    
    shouldRedirectToBilling: (state) => {
      const profile = state.auth.profile;

      if (!profile) return false;

      // Don't redirect if status is 'active' (payment completed)
      if (profile.subscription_status === 'active') return false;

      // Don't redirect if status is 'trial'
      if (profile.subscription_status === 'trial') return false;

      // Simplified: Check if user has billing_period but no stripe_customer_id
      const hasBillingPeriod = profile.billing_period !== null;
      const hasNoStripeCustomer = !profile.stripe_customer_id;

      return hasBillingPeriod && hasNoStripeCustomer;
    },
  },

  actions: {
    setSideNavOpen(isOpen: boolean) {
      this.ui.isSideNavOpen = isOpen;
    },

    toggleSideNav() {
      this.ui.isSideNavOpen = !this.ui.isSideNavOpen;
    },

    setAppMobileMenuOpen(isOpen: boolean) {
      this.ui.isAppMobileMenuOpen = isOpen;
    },

    toggleAppMobileMenu() {
      this.ui.isAppMobileMenuOpen = !this.ui.isAppMobileMenuOpen;
    },

    setGlobalLoading(isLoading: boolean) {
      this.ui.isGlobalLoading = isLoading;
    },

    incrementUploadsToday() {
      this.usage.uploadsToday += 1;
    },

    resetUploadsToday() {
      this.usage.uploadsToday = 0;
    },
    
    clearBillingRedirect() {
      const userId = this.auth.user?.id;
      if (userId) {
        localStorage.removeItem(`pendingBillingRedirect_${userId}`);
        console.log(`Cleared billing redirect flag for user ${userId}`);
      }
    },

    async fetchProfile(userId: string): Promise<void> {
      this.auth.error = null;

      const controller = new AbortController();
      // const signal = controller.signal; // Signal not directly used on Supabase query due to type issues / complexity
      let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

      // Wrap the Supabase query in a new Promise to ensure it's a standard Promise for Promise.race
      const supabaseQueryPromise = new Promise<{
        data: Profile | null;
        error: any;
        status: number;
        count: number | null;
        statusText: string;
      }>((resolve, reject) => {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
          .then(
            (response) => {
              // The response from .single() is directly { data, error, status, etc. }
              resolve(
                response as {
                  data: Profile | null;
                  error: any;
                  status: number;
                  count: number | null;
                  statusText: string;
                }
              );
            },
            (error) => {
              // Handle potential rejection of the Supabase query itself
              reject(error);
            }
          );
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.warn(
            `[UserStore] Profile fetch for ${userId} timing out (10s). Aborting controller (for potential internal SDK use) and rejecting.`
          );
          controller.abort(); // Signal abortion - Supabase might pick this up if its global fetch is configured with this signal
          reject(new Error('Profile fetch timed out.'));
        }, 10000);
      });

      try {
        const response = await Promise.race([supabaseQueryPromise, timeoutPromise]);

        clearTimeout(timeoutId);

        const { data, error: supabaseError, status } = response; // response is now correctly typed from supabaseQueryPromise

        if (supabaseError) {
          console.error(
            `[UserStore] Supabase error fetching profile for ${userId} (Status: ${status}):`,
            supabaseError
          );
          this.auth.error = supabaseError;
          this.auth.profile = null;
        } else if (data) {
          // Safely assign profile data with error handling
          try {
            this.auth.profile = data as Profile;
          } catch (assignError) {
            console.error(`[UserStore] Error assigning profile data:`, assignError);
            this.auth.profile = null;
          }
        } else {
          console.warn(
            `[UserStore] No profile data found for user ID: ${userId}. (Status: ${status})`
          );
          console.warn(`[UserStore] This might be a new account - profile may not exist yet`);
          this.auth.profile = null;
        }
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.message === 'Profile fetch timed out.' || err.name === 'AbortError') {
          console.warn(
            `[UserStore] Profile fetch for ${userId} was aborted or timed out: ${err.message}`
          );
          this.auth.error = new Error('Profile fetch timed out.');
        } else {
          console.error(
            `[UserStore] CATCH block in fetchProfile for ${userId} (unexpected error):`,
            err
          );
          this.auth.error = err instanceof Error ? err : new Error(String(err));
        }
        this.auth.profile = null;
      } finally {
      }
    },

    clearAuthData() {
      this.auth.user = null;
      this.auth.profile = null;
      this.auth.isAuthenticated = false;
      this.auth.error = null;
      this.ui.isSideNavOpen = false;
      this.ui.isAppMobileMenuOpen = false;
    },

    async initializeAuthListener(): Promise<void> {
      this.auth.isLoading = true;
      this.auth.isInitialized = false; // Explicitly set at start

      // Setup onAuthStateChange listener. This handles ongoing events and can update profile.
      // It runs independently of the initial getSession flow below for setting isInitialized.
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          const currentUser = session?.user ?? null;
          // Update user and isAuthenticated based on the event immediately
          this.auth.user = currentUser;
          this.auth.isAuthenticated = !!currentUser;

          if (currentUser) {
            if (
              event === 'SIGNED_IN' ||
              event === 'TOKEN_REFRESHED' ||
              event === 'USER_UPDATED' ||
              event === 'INITIAL_SESSION' // Treat INITIAL_SESSION here as well for profile consistency
            ) {
              try {
                // Simplified signup processing - no tier selection needed
                // All signups start as trial, users choose billing period (monthly/annual) when upgrading
                // User profile is created with trial status by database trigger
                
                // Don't make the entire onAuthStateChange handler wait for fetchProfile if it's not INITIAL_SESSION
                // For INITIAL_SESSION, it might be okay, but generally, let it be async.
                this.fetchProfile(currentUser.id).catch((profileError) => {
                  console.error(
                    `[Auth Listener] Background profile fetch for user ${currentUser.id} (event ${event}) failed:`,
                    profileError
                  );
                  // Don't sign out on profile fetch failure - it causes infinite recursion
                  // Just log the error and continue
                  console.warn(
                    `[Auth Listener] Profile fetch failed for user ${currentUser.id} but keeping them signed in`
                  );
                });
              } catch (profileError) {
                // This catch might be redundant if fetchProfile itself handles its errors and doesn't throw to here.
                console.error(
                  `[Auth Listener] Error directly from fetchProfile call for user ${currentUser.id} (event ${event}):`,
                  profileError
                );
              }
            }
          } else if (event === 'SIGNED_OUT') {
            this.clearAuthData();
          }
        }
      );
      // TODO: Store and manage 'subscription' if unsubscription is needed on store disposal.

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth Store] Error getting initial session:', sessionError);
          this.auth.error = sessionError;
          this.clearAuthData(); // Ensure clean state
        } else if (session) {
          this.auth.user = session.user;
          this.auth.isAuthenticated = true;

          // Fetch profile in the background. Don't await it here.
          // The UI should react to profile changes when fetchProfile completes.
          this.fetchProfile(session.user.id).catch((profileError) => {
            console.error(
              `[Auth Store] Background fetchProfile for initial session user ${session.user.id} failed:`,
              profileError
            );
            // If still authenticated as this user, and profile fetch failed, sign out.
            if (this.auth.user?.id === session.user.id && this.auth.isAuthenticated) {
              console.warn(
                `[Auth Store] Signing out user ${session.user.id} due to background profile fetch failure after initial session.`
              );
              supabase.auth
                .signOut()
                .catch((e) =>
                  console.error(
                    '[Auth Store] Error signing out on background profile fetch failure:',
                    e
                  )
                );
              // clearAuthData() will be triggered by the SIGNED_OUT event from onAuthStateChange
            }
          });
        } else {
          this.clearAuthData(); // Ensure clean state
        }
      } catch (error) {
        console.error(
          '[Auth Store] Critical error during getSession() call or its processing:',
          error
        );
        this.auth.error = error as Error;
        this.clearAuthData(); // Ensure clean state on critical failure
      } finally {
        // This is the crucial part: isInitialized is set true after initial session check attempt.
        this.auth.isInitialized = true;
        this.auth.isLoading = false;
      }
    },

    async signUp(email: string, password: string, userAgent: string, selectedTier?: SubscriptionTier, isTrialSignup: boolean = true) {
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        const callbackUrl = `${import.meta.env.VITE_SITE_URL}/auth/callback`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: {
              user_agent: userAgent,
              selected_tier: selectedTier,
              is_trial_signup: isTrialSignup,
            },
          },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          // User created, needs confirmation (most common case with email confirm ON)
          console.info(
            'Sign up successful, user created:',
            data.user.id,
            'Check email for confirmation.'
          );
          
          // Tier and signup type are now stored in user metadata, no localStorage needed
          console.log(`User signup completed with tier ${selectedTier} (${isTrialSignup ? 'trial' : 'paid'})`);
          
          // Indicate confirmation needed to the UI if desired
          return { user: data.user, error: null };
        } else if (data.session && data.user) {
          // If session AND user returned, user is immediately logged in (e.g., auto-confirm ON)
          console.info('Sign up successful, user logged in:', data.user.id);
          this.auth.user = data.user;
          this.auth.isAuthenticated = true;
          await this.fetchProfile(data.user.id);
          
          // Set trial tier if provided
          if (selectedTier) {
            try {
              const { error: tierError } = await supabase.functions.invoke('set-trial-tier', {
                body: { selectedTier }
              });
              if (tierError) {
                console.error('Failed to set trial tier:', tierError);
              } else {
                console.log(`Trial tier set to: ${selectedTier}`);
                // Refresh profile to get updated tier
                await this.fetchProfile(data.user.id);
              }
            } catch (error) {
              console.error('Error setting trial tier:', error);
            }
          }
          
          return { user: data.user, error: null }; // Successful return
        } else {
          // Handle unexpected cases where neither user nor session is returned,
          // or session without user (shouldn't happen with successful signup)
          console.error('Sign up completed with unexpected state:', {
            user: !!data.user,
            session: !!data.session,
          });
          throw new Error('Sign up failed due to unexpected response from authentication server.');
        }
      } catch (err) {
        console.error('Error during sign up:', err);
        this.auth.error = err as Error;
        return { user: null, error: err as Error };
      } finally {
        this.auth.isLoading = false;
      }
    },

    async signInWithPassword(email: string, password: string) {
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (!data.user) throw new Error('Login failed, no user data returned.');
        console.info('Sign in successful for user:', data.user.id);
        return { session: data.session, user: data.user, error: null };
      } catch (err) {
        console.error('Error signing in:', err);
        this.auth.error = err as Error;
        this.clearAuthData();
        return { session: null, user: null, error: err as Error };
      } finally {
        this.auth.isLoading = false;
      }
    },

    async signInWithGoogle() {
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        const callbackUrl = `${import.meta.env.VITE_SITE_URL}/auth/callback`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
          },
        });
        if (error) throw error;
      } catch (err) {
        console.error('Error initiating Google Sign-In:', err);
        this.auth.error = err as Error;
        this.auth.isLoading = false;
        return { error: err as Error };
      }
    },

    async signOut() {
      this.auth.isLoading = true;
      this.auth.error = null;
      
      // 1. Try to cleanup database session
      const sessionId = sessionStorage.getItem('voip_session_id');
      if (sessionId) {
        try {
          await supabase
            .from('active_sessions')
            .delete()
            .eq('session_token', sessionId);
          console.log('Database session cleanup attempted');
        } catch (e) {
          console.log('Database session cleanup failed (expected if auth invalid)');
        }
      }
      
      // 2. Try Supabase signOut (may fail if auth already invalid)
      try {
        await supabase.auth.signOut();
        console.log('Supabase auth signOut successful');
      } catch (e) {
        console.log('Supabase auth signOut failed (expected if already signed out)');
      }
      
      // 3. FORCE clear ALL auth data from storage
      // Clear all localStorage items related to Supabase
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('Removed localStorage:', key);
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // 4. Clear store state
      this.clearAuthData();
      
      this.auth.isLoading = false;
      console.log('✅ Logout complete - all storage cleared');
    },

    async resetPasswordForEmail(email: string) {
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        const resetPasswordUrl = `${import.meta.env.VITE_SITE_URL}/update-password`; // Example: Route for setting new password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetPasswordUrl,
        });
        if (error) throw error;
        console.info('Password reset email sent successfully to:', email);
        return { error: null };
      } catch (err) {
        console.error('Error sending password reset email:', err);
        this.auth.error = err as Error;
        return { error: err as Error };
      } finally {
        this.auth.isLoading = false;
      }
    },

    async updateUserEmail(newEmail: string) {
      this.setGlobalLoading(true);
      this.auth.error = null;
      try {
        const { data, error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        if (data.user) {
          this.auth.user = data.user;
          // Optionally re-fetch profile if email change affects it, or wait for user to re-verify.
          // For now, Supabase handles email change flow with verification emails.
        }
        return { success: true, user: data.user };
      } catch (err: any) {
        console.error('[UserStore] Error updating email:', err);
        this.auth.error = err;
        return { success: false, error: err };
      } finally {
        this.setGlobalLoading(false);
      }
    },

    async deleteCurrentUserAccount(): Promise<{
      success: boolean;
      message?: string;
      error?: Error | null;
    }> {
      this.setGlobalLoading(true);
      this.auth.error = null;
      let result: { success: boolean; message?: string; error?: Error | null } = {
        success: false,
        error: null,
      };

      if (!this.auth.isAuthenticated || !this.auth.user) {
        this.auth.error = new Error('User not authenticated. Cannot delete account.');
        this.setGlobalLoading(false);
        result = { success: false, error: this.auth.error };
        return result;
      }

      try {
        console.log(
          `[UserStore] Attempting to invoke delete-user-account function for user: ${this.auth.user.id}`
        );
        const { data, error: functionError } = await supabase.functions.invoke(
          'delete-user-account',
          {
            method: 'POST', // Ensure this matches Edge Function
            // JWT is automatically included by supabase-js client
          }
        );

        if (functionError) {
          console.error('[UserStore] Error invoking delete-user-account function:', functionError);
          throw functionError;
        }

        console.log('[UserStore] delete-user-account function returned successfully:', data);
        // If function is successful, it means user is deleted on backend.
        // Now, sign out locally.
        await this.signOut(); // Reuse existing signOut to clear local state and session

        result = { success: true, message: data?.message || 'Account deleted successfully.' };
      } catch (err: any) {
        console.error('[UserStore] Error during account deletion process:', err);
        // Differentiate between Supabase function error and other errors
        if (err.context && err.context.json) {
          // Likely a Supabase Function error response
          this.auth.error = new Error(err.context.json.error || 'Failed to delete account.');
        } else {
          this.auth.error = err instanceof Error ? err : new Error(String(err));
        }
        result = { success: false, error: this.auth.error };
      } finally {
        this.setGlobalLoading(false);
      }
      return result;
    },
  },
});
