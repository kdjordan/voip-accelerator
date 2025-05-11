import { defineStore } from 'pinia';
import type { User, Profile } from '../types/user-types';
import { supabase } from '@/services/supabase.service';
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
    getUploadsToday: (state) => state.usage.uploadsToday,
    isTrialActive: (state) => {
      if (!state.auth.profile?.trial_ends_at) {
        return false;
      }
      try {
        return new Date(state.auth.profile.trial_ends_at) > new Date();
      } catch (e) {
        console.error('Error parsing trial_ends_at date:', state.auth.profile.trial_ends_at, e);
        return false;
      }
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

    async fetchProfile(userId: string): Promise<void> {
      console.log(
        `[UserStore] fetchProfile (AbortController + Promise.race v2) INVOKED for userId: ${userId}.`
      );
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
          .single()
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
          this.auth.profile = data as Profile;
        } else {
          console.warn(
            `[UserStore] No profile data found for user ID: ${userId}. (Status: ${status})`
          );
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
        console.log(
          `[UserStore] fetchProfile (AbortController + Promise.race v2) EXECUTION FINISHED for ${userId}. Profile: ${!!this.auth.profile}, Error: ${this.auth.error?.message || 'none'}`
        );
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
      console.log(
        '[Auth Store] initializeAuthListener (v2) started. isLoading: true, isInitialized: false'
      );

      // Setup onAuthStateChange listener. This handles ongoing events and can update profile.
      // It runs independently of the initial getSession flow below for setting isInitialized.
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          console.log('[Auth Listener] Event:', event, 'Session:', !!session);

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
              console.log(
                `[Auth Listener] Event ${event} for user ${currentUser.id}. Triggering profile fetch.`
              );
              try {
                // Don't make the entire onAuthStateChange handler wait for fetchProfile if it's not INITIAL_SESSION
                // For INITIAL_SESSION, it might be okay, but generally, let it be async.
                this.fetchProfile(currentUser.id).catch((profileError) => {
                  console.error(
                    `[Auth Listener] Background profile fetch for user ${currentUser.id} (event ${event}) failed:`,
                    profileError
                  );
                  // If profile fetch fails for an authenticated user, consider sign out
                  if (this.auth.isAuthenticated && this.auth.user?.id === currentUser.id) {
                    console.warn(
                      `[Auth Listener] Signing out user ${currentUser.id} due to profile fetch failure after ${event}.`
                    );
                    supabase.auth
                      .signOut()
                      .catch((e) =>
                        console.error(
                          '[Auth Listener] Error signing out after profile fetch failure:',
                          e
                        )
                      );
                    // clearAuthData() will be handled by the SIGNED_OUT event
                  }
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
            console.log('[Auth Listener] User signed out. Clearing auth data.');
            this.clearAuthData();
          }
          console.log(
            `[Auth Listener] Event processed. Current state: isAuth: ${this.auth.isAuthenticated}, User: ${this.auth.user?.id}`
          );
        }
      );
      // TODO: Store and manage 'subscription' if unsubscription is needed on store disposal.

      try {
        console.log(
          '[Auth Store] Attempting to get initial session via supabase.auth.getSession()...'
        );
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log(
          `[Auth Store] getSession() responded. Session: ${!!session}, Error: ${JSON.stringify(sessionError)}`
        );

        if (sessionError) {
          console.error('[Auth Store] Error getting initial session:', sessionError);
          this.auth.error = sessionError;
          this.clearAuthData(); // Ensure clean state
        } else if (session) {
          this.auth.user = session.user;
          this.auth.isAuthenticated = true;
          console.log(
            `[Auth Store] Initial session found for user ${session.user.id}. Triggering profile fetch (non-blocking for isInitialized).`
          );
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
          console.log('[Auth Store] No initial session found or session is invalid.');
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
        console.log(
          `[Auth Store] initializeAuthListener (v2) MAIN FINALLY. isInitialized: ${this.auth.isInitialized}, isLoading: ${this.auth.isLoading}, isAuthenticated: ${this.auth.isAuthenticated}`
        );
      }
    },

    async signUp(email: string, password: string, userAgent: string) {
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
          // Indicate confirmation needed to the UI if desired
          return { user: data.user, error: null };
        } else if (data.session && data.user) {
          // If session AND user returned, user is immediately logged in (e.g., auto-confirm ON)
          console.info('Sign up successful, user logged in:', data.user.id);
          this.auth.user = data.user;
          this.auth.isAuthenticated = true;
          await this.fetchProfile(data.user.id);
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
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        this.clearAuthData();
      } catch (err) {
        console.error('Error signing out:', err);
        this.auth.error = err as Error;
      } finally {
        this.auth.isLoading = false;
      }
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
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        // Email change confirmation links usually go to the Supabase default or Site URL.
        // You *can* specify redirectTo here too if needed, but often not necessary for email change.
        const { data, error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        console.info(
          'Email update initiated. Check both old and new email addresses for confirmation.'
        );
        return { user: data.user, error: null };
      } catch (err) {
        console.error('Error updating user email:', err);
        this.auth.error = err as Error;
        return { user: null, error: err as Error };
      } finally {
        this.auth.isLoading = false;
      }
    },
  },
});
