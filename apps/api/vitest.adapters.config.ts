import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// `pnpm test:adapters`: the ports' behaviour suites against real Postgres (ADR 0007).
// Needs TEST_DATABASE_URL, a database of the tests' own (`pnpm db:up` creates varda_test), never
// the one `pnpm dev` uses: the suites sign up persons and place stones, and nothing removes them.
// The tests read DATABASE_URL like the app does, so it's pointed at the test database here, and
// adapters.global-setup.ts migrates that database before any test runs.
const rootEnv = new URL('../../.env', import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error('TEST_DATABASE_URL is not set (see .env.example).');
if (testDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is the same as DATABASE_URL; the tests need a database of their own.');
}
process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    include: ['src/**/*.adapters.test.ts'],
    globalSetup: ['./adapters.global-setup.ts'],
  },
});
