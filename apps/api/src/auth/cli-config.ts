// Only for Better Auth's CLI, to regenerate schema.ts: `pnpm --filter @varda/api auth:generate`.
// The running app builds Better Auth in better-auth.ts; keep the options that shape the tables in step.
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';

export const auth = betterAuth({
  database: drizzleAdapter(drizzle.mock(), { provider: 'pg', schemaName: 'auth' }),
  emailAndPassword: { enabled: true },
});
