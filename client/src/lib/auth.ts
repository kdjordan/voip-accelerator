import { createAuthClient } from 'better-auth/vue';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? window.location.origin;

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
