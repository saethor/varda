import { defineConfig } from 'drizzle-kit';

// Generates the auth schema's migrations from Better Auth's tables: `pnpm --filter @varda/api db:generate`.
// They are applied by the root `pnpm db:migrate`, not by drizzle-kit.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/auth/schema.ts',
  out: './src/auth/migrations',
});
