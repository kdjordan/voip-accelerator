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
      console.log(`[UserStore] fetchProfile INVOKED for userId: ${userId}.`);

      const PROFILE_FETCH_TIMEOUT = 10000; // 10 seconds
      let profileData: Profile | null = null;
      let fetchError: Error | null = null;
      let timeoutHandle: NodeJS.Timeout | number | undefined = undefined; // For browser/Node.js compatibility

      try {
        console.log(
          `[UserStore] TRY block in fetchProfile for ${userId}. Setting up Promise.race.`
        );

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            console.warn(
              `[UserStore] Profile fetch for userId: ${userId} timed out after ${PROFILE_FETCH_TIMEOUT / 1000}s via Promise.race.`
            );
            reject(new Error('Profile fetch timed out.')); // This error will be caught by the .catch in Promise.race
          }, PROFILE_FETCH_TIMEOUT);
        });

        const supabaseQueryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // Define clearly typed outcomes for Promise.race
        type SupabaseRaceOutcome = {
          type: 'supabase';
          response: Awaited<typeof supabaseQueryPromise>;
        };
        type TimeoutRaceOutcome = { type: 'timeout'; error: Error };
        type RaceOutcome = SupabaseRaceOutcome | TimeoutRaceOutcome;

        // Race the Supabase query against the timeout
        const raceResult = await Promise.race<RaceOutcome>([
          supabaseQueryPromise.then(
            (response) => ({ type: 'supabase', response }) as SupabaseRaceOutcome
          ),
          timeoutPromise.catch((error) => {
            throw error;
          }), // Let timeoutPromise reject, Promise.race will catch it.
        ]).catch((error) => {
          // This catch is specifically for if timeoutPromise rejected (won the race with a rejection)
          // or if supabaseQueryPromise itself rejected before being wrapped by .then()
          if (error.message === 'Profile fetch timed out.') {
            return { type: 'timeout', error } as TimeoutRaceOutcome;
          }
          // For other errors (e.g. supabase query rejected directly)
          throw error; // Re-throw to be caught by the outer try-catch
        });

        clearTimeout(timeoutHandle as any); // Clear the timeout regardless of outcome

        if (raceResult.type === 'timeout') {
          console.error(`[UserStore] Timeout won the race for userId: ${userId}.`);
          fetchError = raceResult.error;
        } else if (raceResult.type === 'supabase') {
          // Typescript should now know raceResult is SupabaseRaceOutcome
          const { data, error: supabaseError, status } = raceResult.response;
          console.log(
            `[UserStore] Supabase query completed for ${userId}. Status: ${status}, Error: ${JSON.stringify(supabaseError)}, Data: ${!!data}`
          );

          if (supabaseError && status !== 406) {
            console.error(
              `[UserStore] Supabase error fetching profile for ${userId}:`,
              supabaseError
            );
            fetchError = supabaseError;
          } else if (data) {
            profileData = data as Profile;
          } else {
            console.warn(`[UserStore] No profile data found for user ID: ${userId}`);
            // Not an error, profile will be null, which is handled by the caller.
          }
        }
      } catch (err: any) {
        // This catch block would handle errors not originating from supabaseQueryPromise or timeoutPromise directly,
        // or if the .then/.catch transformations in Promise.race failed, which is unlikely.
        clearTimeout(timeoutHandle as any); // Ensure timeout is cleared
        console.error(
          `[UserStore] CATCH block in fetchProfile for ${userId} (unexpected error):`,
          err
        );
        fetchError = err as Error;
      } finally {
        console.log(
          `[UserStore] FINALLY block in fetchProfile for ${userId}. Setting profile and error.`
        );
        this.auth.profile = profileData;
        if (fetchError) {
          this.auth.error = fetchError;
        } else {
          // If there was no fetchError, ensure any previous error related to auth is cleared for this successful fetch context.
          // However, be cautious if other operations might have set an error that shouldn't be cleared here.
          // For now, only set if fetchError is present, or explicitly clear if design dictates.
          // this.auth.error = null; // Potentially clear error if fetch was successful
        }
        console.log(
          `[UserStore] fetchProfile EXECUTION FINISHED for ${userId}. Profile: ${!!this.auth.profile}, Error: ${this.auth.error?.message || 'none'}`
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
        '[Auth Store] initializeAuthListener started. isLoading: true, isInitialized: false'
      );

      try {
        // Set up the onAuthStateChange listener first.
        // This listener handles ongoing auth events.
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            console.log('[Auth Listener] Event:', event, 'Session:', !!session);

            const currentUser = session?.user ?? null;

            if (currentUser) {
              this.auth.user = currentUser;
              this.auth.isAuthenticated = true;

              if (
                event === 'SIGNED_IN' ||
                event === 'TOKEN_REFRESHED' ||
                event === 'USER_UPDATED'
              ) {
                console.log(
                  `[Auth Listener] Event ${event} for user ${currentUser.id}. Triggering profile fetch.`
                );
                // Let initializeAuthListener handle the primary isLoading state.
                // The fetchProfile call here is a consequence of an event.
                await this.fetchProfile(currentUser.id); // Call fetchProfile

                if (!this.auth.profile && this.auth.isAuthenticated) {
                  console.warn(
                    `[Auth Listener] User ${currentUser.id} is authenticated (event: ${event}) but no profile found. Signing out.`
                  );
                  try {
                    await supabase.auth.signOut(); // This will trigger another SIGNED_OUT event
                  } catch (signOutError) {
                    console.error(
                      '[Auth Listener] Error during signOut in onAuthStateChange:',
                      signOutError
                    );
                    this.auth.error =
                      signOutError instanceof Error
                        ? signOutError
                        : new Error('Sign out failed in listener');
                  }
                }
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('[Auth Listener] Event SIGNED_OUT. Clearing auth data.');
              this.clearAuthData();
            }
            // Note: INITIAL_SESSION is primarily handled by the getSession() call below.
          }
        );

        if (subscription) {
          console.log('[Auth Store] onAuthStateChange subscription established.');
        }

        // Then, get the initial session state, with a timeout
        console.log('[Auth Store] Attempting to get initial session with timeout.');
        const GET_SESSION_TIMEOUT = 10000; // 10 seconds for getSession
        let sessionTimeoutHandle: NodeJS.Timeout | number | undefined = undefined;

        let initialSessionData: { session: Session | null; error: Error | null } = {
          session: null,
          error: null,
        };

        try {
          const sessionPromise = supabase.auth.getSession();
          const sessionTimeoutPromise = new Promise<never>((_, reject) => {
            sessionTimeoutHandle = setTimeout(() => {
              console.warn(
                `[Auth Store] supabase.auth.getSession() timed out after ${GET_SESSION_TIMEOUT / 1000}s.`
              );
              reject(new Error('Get session timed out.'));
            }, GET_SESSION_TIMEOUT);
          });

          // Define types for the race outcome
          type GetSessionSuccess = {
            type: 'session';
            data: Awaited<ReturnType<typeof supabase.auth.getSession>>['data'];
            error: Awaited<ReturnType<typeof supabase.auth.getSession>>['error'];
          };
          type GetSessionTimeout = { type: 'timeout'; error: Error };
          type GetSessionRaceOutcome = GetSessionSuccess | GetSessionTimeout;

          const raceResult = await Promise.race<GetSessionRaceOutcome>([
            sessionPromise.then(
              (response) =>
                ({
                  type: 'session',
                  data: response.data,
                  error: response.error,
                }) as GetSessionSuccess
            ),
            sessionTimeoutPromise.catch((error) => {
              throw error;
            }), // Let timeoutPromise reject for Promise.race to catch
          ]).catch((error) => {
            // This catch is for rejections from Promise.race itself (e.g., timeout, or direct supabase error if not .then'd)
            if (error.message === 'Get session timed out.') {
              return { type: 'timeout', error } as GetSessionTimeout;
            }
            // For other errors (e.g. supabase query rejected directly and wasn't caught by its .then)
            console.error(
              '[Auth Store] Error during getSession promise race, possibly direct Supabase error:',
              error
            );
            return { type: 'session', data: { session: null }, error } as GetSessionSuccess; // Treat as session error
          });

          clearTimeout(sessionTimeoutHandle as any);

          if (raceResult.type === 'timeout') {
            initialSessionData.error = raceResult.error;
          } else if (raceResult.type === 'session') {
            initialSessionData.session = raceResult.data.session;
            initialSessionData.error = raceResult.error;
          }
        } catch (e: any) {
          // Catch for errors specifically within the getSession attempt (e.g. if raceResult itself throws an error)
          console.error('[Auth Store] Outer catch for getSession attempt failed:', e);
          initialSessionData.error =
            e instanceof Error ? e : new Error('Failed to process session retrieval.');
        }

        const initialErrorFromGetSession = initialSessionData.error;
        const initialSession = initialSessionData.session;
        const initialUser = initialSession?.user ?? null;

        if (initialErrorFromGetSession) {
          console.error(
            '[Auth Store] Error getting initial session (processed):',
            initialErrorFromGetSession
          );
          this.auth.error = initialErrorFromGetSession; // Persist getSession error
          this.clearAuthData();
        } else if (initialUser) {
          this.auth.user = initialUser; // May be redundant if onAuthStateChange already set it, but ensures consistency
          this.auth.isAuthenticated = true;

          // Determine if a profile fetch is needed by the main initializeAuthListener flow
          const profileIsMissingOrForDifferentUser =
            !this.auth.profile || this.auth.profile.id !== initialUser.id;
          // Check if there was a specific timeout error from a previous fetch attempt (likely by onAuthStateChange)
          const previousFetchAttemptTimedOut =
            this.auth.error?.message === 'Profile fetch timed out.';

          if (profileIsMissingOrForDifferentUser || previousFetchAttemptTimedOut) {
            if (previousFetchAttemptTimedOut) {
              console.warn(
                `[Auth Store] Previous profile fetch for user ${initialUser.id} timed out. Attempting fetch again.`
              );
              this.auth.error = null; // Clear the timeout error before retrying
            } else {
              console.log(
                `[Auth Store] Profile for user ${initialUser.id} is missing or for a different user. Fetching profile.`
              );
            }
            await this.fetchProfile(initialUser.id);
          } else {
            console.log(
              `[Auth Store] Profile for user ${initialUser.id} already available and no recent timeout. Skipping main fetch.`
            );
          }

          // After all attempts, if profile is still missing for an authenticated user, sign them out.
          if (!this.auth.profile && this.auth.isAuthenticated) {
            console.warn(
              `[Auth Store] Post-initialization: User ${initialUser.id} is authenticated but no profile found. Attempting sign out.`
            );
            try {
              await supabase.auth.signOut();
              // onAuthStateChange should handle clearAuthData upon SIGNED_OUT event
            } catch (signOutError) {
              console.error(
                '[Auth Store] Error during sign out attempt in initializeAuthListener:',
                signOutError
              );
              this.auth.error =
                signOutError instanceof Error ? signOutError : new Error('Sign out failed');
              this.clearAuthData(); // Fallback
            }
          }
        } else {
          // No initial user from getSession, and no error from getSession itself
          console.log(
            '[Auth Store] No initial user session found (processed clean). Clearing auth data.'
          );
          this.clearAuthData();
        }
      } catch (error) {
        // Catch any UNEXPECTED errors from the main try block of initializeAuthListener
        // (e.g., if a re-thrown error from Promise.race for getSession was not handled)
        console.error(
          '[Auth Store] Uncaught critical error in initializeAuthListener main try block:',
          error
        );
        this.auth.error =
          error instanceof Error ? error : new Error('Critical initialization failure');
        this.clearAuthData();
      } finally {
        this.auth.isInitialized = true;
        this.auth.isLoading = false; // This is now correctly set after all async ops
        console.log(
          `[Auth Store] initializeAuthListener finished. isInitialized: ${this.auth.isInitialized}, isLoading: ${this.auth.isLoading}, isAuthenticated: ${this.auth.isAuthenticated}, User: ${!!this.auth.user}, Profile: ${!!this.auth.profile}, Error: ${this.auth.error?.message || 'none'}`
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
