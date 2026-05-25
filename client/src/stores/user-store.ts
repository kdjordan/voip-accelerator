import { defineStore } from 'pinia';
import type { User } from '../types/user-types';
import { authClient } from '@/lib/auth';

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
    error: Error | null;
    isInitialized: boolean;
  };
}

function toUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const createdAt = r.createdAt;
  const updatedAt = r.updatedAt;
  return {
    id: String(r.id),
    name: typeof r.name === 'string' ? r.name : '',
    email: typeof r.email === 'string' ? r.email : '',
    emailVerified: Boolean(r.emailVerified),
    image: typeof r.image === 'string' ? r.image : null,
    role: r.role === 'admin' ? 'admin' : 'user',
    createdAt:
      createdAt instanceof Date
        ? createdAt.toISOString()
        : typeof createdAt === 'string'
          ? createdAt
          : '',
    updatedAt:
      updatedAt instanceof Date
        ? updatedAt.toISOString()
        : typeof updatedAt === 'string'
          ? updatedAt
          : '',
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
      error: null,
      isInitialized: false,
    },
  }),

  getters: {
    getSideNavOpen: (state) => state.ui.isSideNavOpen,
    getAppMobileMenuOpen: (state) => state.ui.isAppMobileMenuOpen,
    getIsGlobalLoading: (state) => state.ui.isGlobalLoading,
    getUser: (state) => state.auth.user,
    getIsAuthenticated: (state) => state.auth.isAuthenticated,
    getAuthIsLoading: (state) => state.auth.isLoading,
    getAuthError: (state) => state.auth.error,
    getAuthIsInitialized: (state) => state.auth.isInitialized,
    // Role comes off the better-auth session user (admin plugin); legacy/null role reads as 'user'.
    getUserRole: (state): 'user' | 'admin' => state.auth.user?.role ?? 'user',
    isAdmin: (state) => state.auth.user?.role === 'admin',
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

    clearAuthData() {
      this.auth.user = null;
      this.auth.isAuthenticated = false;
      this.auth.error = null;
      this.ui.isSideNavOpen = false;
      this.ui.isAppMobileMenuOpen = false;
    },

    async initializeAuthListener(): Promise<void> {
      this.auth.isLoading = true;
      this.auth.isInitialized = false;
      try {
        const { data, error } = await authClient.getSession();
        if (error) {
          this.auth.error = new Error(error.message ?? 'Failed to fetch session');
          this.clearAuthData();
        } else if (data && (data as { user?: unknown }).user) {
          this.auth.user = toUser((data as { user: unknown }).user);
          this.auth.isAuthenticated = !!this.auth.user;
        } else {
          this.clearAuthData();
        }
      } catch (err) {
        console.error('[Auth Store] Critical error during session bootstrap:', err);
        this.auth.error = err instanceof Error ? err : new Error(String(err));
        this.clearAuthData();
      } finally {
        this.auth.isInitialized = true;
        this.auth.isLoading = false;
      }
    },

    async signUp(email: string, password: string, _userAgent: string) {
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        const inferredName = email.split('@')[0] || email;
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name: inferredName,
        });
        if (error) throw new Error(error.message ?? 'Sign up failed');
        const user = toUser((data as { user?: unknown } | null)?.user);
        if (user) {
          this.auth.user = user;
          this.auth.isAuthenticated = true;
        }
        return { user, error: null };
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
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) throw new Error(error.message ?? 'Sign in failed');
        const user = toUser((data as { user?: unknown } | null)?.user);
        if (!user) throw new Error('Login failed, no user data returned.');
        this.auth.user = user;
        this.auth.isAuthenticated = true;
        return { user, error: null };
      } catch (err) {
        console.error('Error signing in:', err);
        this.auth.error = err as Error;
        this.clearAuthData();
        return { user: null, error: err as Error };
      } finally {
        this.auth.isLoading = false;
      }
    },

    async signOut() {
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        await authClient.signOut();
      } catch (err) {
        console.warn('Sign out failed (continuing local cleanup):', err);
      }
      this.clearAuthData();
      this.auth.isLoading = false;
    },

    async resetPasswordForEmail(email: string) {
      this.auth.isLoading = true;
      this.auth.error = null;
      try {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo,
        });
        if (error) throw new Error(error.message ?? 'Reset request failed');
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
        const { data, error } = await authClient.changeEmail({
          newEmail,
          callbackURL: `${window.location.origin}/dashboard`,
        });
        if (error) throw new Error(error.message ?? 'Email change failed');
        return { success: true, user: data ?? this.auth.user };
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
        const { data, error: deleteError } = await authClient.deleteUser();

        if (deleteError) {
          console.error('[UserStore] Error deleting account:', deleteError);
          throw new Error(deleteError.message || 'Failed to delete account.');
        }

        // deleteUser already cleared the server session; signOut clears local state.
        await this.signOut();
        result = {
          success: true,
          message: data?.message || 'Account deleted successfully.',
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
