import { defineStore } from 'pinia';
import type { User, Profile } from '../types/user-types';
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

    async fetchProfile(userId: string): Promise<void> {
      this.auth.error = null;

      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

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
              reject(error);
            }
          );
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.warn(
            `[UserStore] Profile fetch for ${userId} timing out (10s). Aborting controller.`
          );
          controller.abort();
          reject(new Error('Profile fetch timed out.'));
        }, 10000);
      });

      try {
        const response = await Promise.race([supabaseQueryPromise, timeoutPromise]);

        clearTimeout(timeoutId);

        const { data, error: supabaseError, status } = response;

        if (supabaseError) {
          console.error(
            `[UserStore] Supabase error fetching profile for ${userId} (Status: ${status}):`,
            supabaseError
          );
          this.auth.error = supabaseError;
          this.auth.profile = null;
        } else if (data) {
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
      this.auth.isInitialized = false;

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          const currentUser = session?.user ?? null;
          this.auth.user = currentUser;
          this.auth.isAuthenticated = !!currentUser;

          if (currentUser) {
            if (
              event === 'SIGNED_IN' ||
              event === 'TOKEN_REFRESHED' ||
              event === 'USER_UPDATED' ||
              event === 'INITIAL_SESSION'
            ) {
              this.fetchProfile(currentUser.id).catch((profileError) => {
                console.error(
                  `[Auth Listener] Background profile fetch for user ${currentUser.id} (event ${event}) failed:`,
                  profileError
                );
                console.warn(
                  `[Auth Listener] Profile fetch failed for user ${currentUser.id} but keeping them signed in`
                );
              });
            }
          } else if (event === 'SIGNED_OUT') {
            this.clearAuthData();
          }
        }
      );

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth Store] Error getting initial session:', sessionError);
          this.auth.error = sessionError;
          this.clearAuthData();
        } else if (session) {
          this.auth.user = session.user;
          this.auth.isAuthenticated = true;

          this.fetchProfile(session.user.id).catch((profileError) => {
            console.error(
              `[Auth Store] Background fetchProfile for initial session user ${session.user.id} failed:`,
              profileError
            );
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
            }
          });
        } else {
          this.clearAuthData();
        }
      } catch (error) {
        console.error(
          '[Auth Store] Critical error during getSession() call or its processing:',
          error
        );
        this.auth.error = error as Error;
        this.clearAuthData();
      } finally {
        this.auth.isInitialized = true;
        this.auth.isLoading = false;
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
          console.info(
            'Sign up successful, user created:',
            data.user.id,
            'Check email for confirmation.'
          );
          return { user: data.user, error: null };
        } else if (data.session && data.user) {
          console.info('Sign up successful, user logged in:', data.user.id);
          this.auth.user = data.user;
          this.auth.isAuthenticated = true;
          await this.fetchProfile(data.user.id);
          return { user: data.user, error: null };
        } else {
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

      try {
        await supabase.auth.signOut();
        console.log('Supabase auth signOut successful');
      } catch (e) {
        console.log('Supabase auth signOut failed (expected if already signed out)');
      }

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

      sessionStorage.clear();

      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        console.log('Cleared cookie:', name);
      }

      this.clearAuthData();

      this.auth.isLoading = false;
      console.log('Logout complete - all storage cleared');
    },

    async resetPasswordForEmail(email: string) {
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        const resetPasswordUrl = `${import.meta.env.VITE_SITE_URL}/update-password`;
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
      let result: {
        success: boolean;
        message?: string;
        error?: Error | null;
      } = {
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
            method: 'POST',
          }
        );

        if (functionError) {
          console.error('[UserStore] Error invoking delete-user-account function:', functionError);
          throw functionError;
        }

        console.log('[UserStore] delete-user-account function returned successfully:', data);

        await this.signOut();
        result = {
          success: true,
          message: data.message || 'Account deleted successfully.'
        };
      } catch (err: any) {
        console.error('[UserStore] Error during account deletion process:', err);
        if (err.context && err.context.json) {
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
