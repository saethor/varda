import { passkey } from '@better-auth/passkey';
import type { BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { lastLoginMethod } from 'better-auth/plugins';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

/**
 * The Better Auth options that decide how people sign in and what Better Auth's
 * tables look like. The app (better-auth.ts) and Better Auth's CLI (cli-config.ts)
 * both build from these, so the generated schema can't drift from the running app.
 *
 * `baseURL` is BETTER_AUTH_URL, the origin people sign in on. A passkey belongs to
 * that origin: its host name is the relying party ID, and the origin itself is the
 * only one a passkey prompt may come from.
 */
export function loginOptions({ db, baseURL }: { db: NodePgDatabase; baseURL: string }) {
  const signInOrigin = new URL(baseURL);
  return {
    // The tables come from `schema`; `schemaName` steers Better Auth's CLI into the `auth` schema.
    database: drizzleAdapter(db, { provider: 'pg', schema, schemaName: 'auth' }),
    emailAndPassword: { enabled: true },
    plugins: [
      passkey({ rpID: signInOrigin.hostname, origin: signInOrigin.origin, rpName: 'Varða' }),
      // Its defaults: the last sign-in method is kept in a cookie in the browser, not in the database.
      lastLoginMethod(),
    ],
  } satisfies BetterAuthOptions;
}
