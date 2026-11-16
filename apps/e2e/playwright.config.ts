import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Ports of their own, so a run never reuses an API or web app left running for development.
const apiPort = 4100;
const webPort = 4174;
// `localhost`, not 127.0.0.1: WebAuthn won't accept an IP address as the relying party ID,
// which Better Auth takes from BETTER_AUTH_URL, so passkeys only work on a host name.
const webOrigin = `http://localhost:${webPort}`;

// A fresh directory for the API's recordings on every run, removed by global-teardown.ts. Playwright
// loads this file again in each worker, which inherits the environment, so a run makes only one.
process.env.VARDA_E2E_RECORDINGS_DIR ??= mkdtempSync(join(tmpdir(), 'varda-e2e-recordings-'));
const recordingsDir = process.env.VARDA_E2E_RECORDINGS_DIR;

// The API runs against TEST_DATABASE_URL, a database of the tests' own (`pnpm db:up` creates
// varda_test), never the one `pnpm dev` uses: the flows sign up persons and place stones, and
// nothing removes them.
const rootEnv = new URL('../../.env', import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error('TEST_DATABASE_URL is not set (see .env.example).');
if (testDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is the same as DATABASE_URL; the tests need a database of their own.');
}

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  globalTeardown: './global-teardown.ts',
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: webOrigin,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // BETTER_AUTH_SECRET and VARDA_DEV_PASSWORD come from the environment, or locally from the
      // root .env. DATABASE_URL is the test database, migrated first. Set here, it and the rest of
      // `env` win over the .env, since Node's --env-file never overrides a variable already set.
      // BETTER_AUTH_URL is the web app's origin, since Better Auth is reached through its proxy
      // and checks the Origin header. Recordings go to this run's temporary directory, never the
      // developer's own. The seed adds the dev persons once and skips them on every later run, and
      // VARDA_DEV_MENU serves the dev menu's endpoints, so the dev menu has persons to switch to.
      command: [
        'node --env-file-if-exists=../../.env src/migrate.ts',
        'node --env-file-if-exists=../../.env src/seed.ts',
        'node --env-file-if-exists=../../.env src/main.ts',
      ].join(' && '),
      cwd: '../api',
      env: {
        DATABASE_URL: testDatabaseUrl,
        PORT: String(apiPort),
        BETTER_AUTH_URL: webOrigin,
        VARDA_DEV_MENU: 'true',
        VARDA_RECORDINGS_DIR: recordingsDir,
      },
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: false,
    },
    {
      // The Vite dev server, since the dev menu is only in development builds. It proxies /rpc and
      // /api/auth to the API above. On `localhost`, like the origin above, for WebAuthn.
      command: `pnpm dev --host localhost --port ${webPort} --strictPort`,
      cwd: '../web',
      env: { VARDA_API_URL: `http://127.0.0.1:${apiPort}` },
      url: webOrigin,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
