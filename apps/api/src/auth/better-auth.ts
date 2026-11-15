// The auth adapter: login accounts are Better Auth's "users", and this is the only
// place that word may appear (ADR 0006). Everything outside speaks of persons.
import type { SharedReaders } from '@varda/shared';
import { betterAuth } from 'better-auth';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Auth } from '../adapters.ts';
import { devMenu } from './dev-menu.ts';
import { loginOptions } from './options.ts';

export type BetterAuthInfra = {
  db: NodePgDatabase;
  /** BETTER_AUTH_SECRET, at least 32 characters. */
  secret: string;
  /** BETTER_AUTH_URL, the origin people sign in on: the web app's, which proxies /api/auth here, e.g. http://localhost:5173. */
  baseURL: string;
  /** Shared's reader that resolves a login account to its person. */
  persons: SharedReaders['persons'];
  /** VARDA_DEV_MENU=true: serve the dev menu's endpoints under /api/auth/dev/. Local development only. */
  devMenu: boolean;
};

/** The real `auth` adapter: email and password login with Better Auth, its tables in the `auth` schema. */
export function createBetterAuthAdapter({ db, secret, baseURL, persons, devMenu: withDevMenu }: BetterAuthInfra): Auth {
  const betterAuthInstance = betterAuth({
    secret,
    baseURL,
    ...loginOptions(db),
    // Without the flag the dev routes aren't registered at all, so there is no bypass to get wrong.
    plugins: withDevMenu ? [devMenu(persons)] : [],
    databaseHooks: {
      user: {
        create: {
          // Sign-up creates the person, named as given. If this fails, the login
          // account is left without a person, and the next request creates one
          // (personFor below). Throwing here would fail the sign-up after the user
          // row is written, leaving an email that can neither sign in nor sign up.
          after: async (user) => {
            try {
              await persons.forLoginAccount({ id: user.id, name: user.name });
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
      const person = await persons.forLoginAccount({ id: found.user.id, name: found.user.name });
      return person.id;
    },
    handle: (request) => betterAuthInstance.handler(request),
  };
}
