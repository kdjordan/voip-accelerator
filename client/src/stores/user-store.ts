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
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        const { data, error, status } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && status !== 406) {
          console.error('Error fetching profile (Supabase error):', error);
          throw error;
        }

        if (data) {
          this.auth.profile = data as Profile;
        } else {
          this.auth.profile = null;
          console.warn(`[UserStore] No profile found for user ID: ${userId}`);
        }
      } catch (err) {
        this.auth.error = err as Error;
        console.error('[UserStore] Error caught in fetchProfile:', err);
        this.auth.profile = null;
      } finally {
        this.auth.isLoading = false;
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

    initializeAuthListener(): Promise<void> {
      return new Promise((resolve, reject) => {
        this.auth.isLoading = true;

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[Auth Listener] Event:', event, 'Session:', !!session);
          this.auth.error = null;
          const currentUser = session?.user ?? null;

          this.auth.user = currentUser;
          this.auth.isAuthenticated = !!currentUser;

          if (currentUser) {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              try {
                console.log(
                  `[Auth Listener] Fetching profile for user ${currentUser.id} on event ${event}`
                );
                await this.fetchProfile(currentUser.id);
              } catch (profileError) {
                console.error('[Auth Listener] Error fetching profile on event:', profileError);
              }
            }
          } else {
            this.clearAuthData();
          }

          if (!this.auth.isInitialized) {
            console.log('[Auth Listener] State determined, marking as initialized.');
            this.auth.isInitialized = true;
            this.auth.isLoading = false;
            resolve();
          } else {
            this.auth.isLoading = false;
          }
        });

        supabase.auth
          .getSession()
          .then(async ({ data: { session }, error }) => {
            if (error) {
              console.error('[Auth Listener] Error getting initial session:', error);
              this.auth.error = error;
              this.clearAuthData();
            } else {
              const currentUser = session?.user ?? null;
              this.auth.user = currentUser;
              this.auth.isAuthenticated = !!currentUser;
              if (currentUser && !this.auth.profile) {
                try {
                  console.log(
                    `[Auth Listener] Initial check found user ${currentUser.id}, fetching profile.`
                  );
                  await this.fetchProfile(currentUser.id);
                } catch (profileError) {
                  console.error(
                    '[Auth Listener] Error fetching profile on initial check:',
                    profileError
                  );
                }
              } else if (!currentUser) {
                this.clearAuthData();
              }
            }
          })
          .catch((err) => {
            console.error('[Auth Listener] Critical error during initial getSession():', err);
            this.auth.error = err;
            this.clearAuthData();
          })
          .finally(() => {
            if (!this.auth.isInitialized) {
              console.log('[Auth Listener] Initial getSession complete, marking as initialized.');
              this.auth.isInitialized = true;
              this.auth.isLoading = false;
              resolve();
            } else {
              this.auth.isLoading = false;
            }
          });
      });
    },

    async signUp(email: string, password: string, userAgent: string) {
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
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
