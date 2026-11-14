import { defineConfig } from 'drizzle-kit';

// Generates Shared's migrations from its schema: `pnpm --filter @varda/shared db:generate`.
// They are applied by the root `pnpm db:migrate`, not by drizzle-kit.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/adapters/postgres/schema.ts',
  out: './src/adapters/postgres/migrations',
});
