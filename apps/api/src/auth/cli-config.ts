// Only for Better Auth's CLI, to regenerate schema.ts: `pnpm --filter @varda/api auth:generate`.
// The running app builds Better Auth in better-auth.ts from the same options.
import { betterAuth } from 'better-auth';
import { drizzle } from 'drizzle-orm/node-postgres';
import { loginOptions } from './options.ts';

export const auth = betterAuth(loginOptions(drizzle.mock()));
