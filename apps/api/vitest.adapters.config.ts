import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// `pnpm test:adapters`: the ports' behaviour suites against real Postgres (ADR 0007).
// Needs DATABASE_URL and a migrated database (`pnpm db:up && pnpm db:migrate`).
const rootEnv = new URL('../../.env', import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

export default defineConfig({
  test: { include: ['src/**/*.adapters.test.ts'] },
});
