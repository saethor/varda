import type { BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

/**
 * The Better Auth options that decide how people sign in and what Better Auth's
 * tables look like. The app (better-auth.ts) and Better Auth's CLI (cli-config.ts)
 * both build from these, so the generated schema can't drift from the running app.
 */
export function loginOptions(db: NodePgDatabase) {
  return {
    // The tables come from `schema`; `schemaName` steers Better Auth's CLI into the `auth` schema.
    database: drizzleAdapter(db, { provider: 'pg', schema, schemaName: 'auth' }),
    emailAndPassword: { enabled: true },
  } satisfies BetterAuthOptions;
}
