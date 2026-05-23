import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db/client.js';
import { user, session, account, verification } from './db/schema.js';

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error('BETTER_AUTH_SECRET is required');
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret,
  baseURL: process.env.BETTER_AUTH_URL,
});

export type Auth = typeof auth;
