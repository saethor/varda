// The auth adapter: login accounts are Better Auth's "users", and this is the only
// place that word may appear (ADR 0006). Everything outside speaks of persons.
import { resolvePerson, type SharedAdapters } from '@varda/shared';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Auth } from '../adapters.ts';
import * as schema from './schema.ts';

export type BetterAuthInfra = {
  db: NodePgDatabase;
  /** BETTER_AUTH_SECRET, at least 32 characters. */
  secret: string;
  /** BETTER_AUTH_URL, where the API is served, e.g. http://localhost:4000. */
  baseURL: string;
  shared: SharedAdapters;
};

/** The real `auth` adapter: email and password login with Better Auth, its tables in the `auth` schema. */
export function createBetterAuthAdapter({ db, secret, baseURL, shared }: BetterAuthInfra): Auth {
  const betterAuthInstance = betterAuth({
    secret,
    baseURL,
    // The tables come from `schema`; `schemaName` only steers Better Auth's CLI.
    database: drizzleAdapter(db, { provider: 'pg', schema, schemaName: 'auth' }),
    emailAndPassword: { enabled: true },
    databaseHooks: {
      user: {
        create: {
          // Sign-up creates the person, named as given. If this fails, the login
          // account is left without a person, and the next request creates one
          // (personFor below). Throwing here would fail the sign-up after the user
          // row is written, leaving an email that can neither sign in nor sign up.
          after: async (user) => {
            try {
              await resolvePerson(shared, { id: user.id, name: user.name });
            } catch (error) {
              console.error('Creating the person on sign-up failed; the next request will retry.', error);
            }
          },
        },
      },
    },
  });

  return {
    async personFor(request) {
      const found = await betterAuthInstance.api.getSession({ headers: request.headers });
      if (!found) return null;
      // The safety net: a login account without a person gets one here, never a second.
      return await resolvePerson(shared, { id: found.user.id, name: found.user.name });
    },
    handle: (request) => betterAuthInstance.handler(request),
  };
}
