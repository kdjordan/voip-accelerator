import { createAuthClient } from 'better-auth/vue';
import { adminClient } from 'better-auth/client/plugins';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? window.location.origin;

export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
