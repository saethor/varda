import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Ports of their own, so a run never reuses an API or web app left running for development.
const apiPort = 4100;
const webPort = 4174;
// `localhost`, not 127.0.0.1: WebAuthn won't accept an IP address as the relying party ID,
// which Better Auth takes from BETTER_AUTH_URL, so passkeys only work on a host name.
const webOrigin = `http://localhost:${webPort}`;

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: webOrigin,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // DATABASE_URL, BETTER_AUTH_SECRET and VARDA_DEV_PASSWORD come from the environment, or
      // locally from the root .env. BETTER_AUTH_URL is the web app's origin, since Better Auth is
      // reached through its proxy and checks the Origin header. Set here, it wins over the .env's
      // dev-server address. Recordings go to a temporary directory, never the developer's own. The seed adds the dev persons once and skips them on every later run,
      // and VARDA_DEV_MENU serves the dev menu's endpoints, so the dev menu has persons to switch to.
      command: 'node --env-file-if-exists=../../.env src/seed.ts && node --env-file-if-exists=../../.env src/main.ts',
      cwd: '../api',
      env: {
        PORT: String(apiPort),
        BETTER_AUTH_URL: webOrigin,
        VARDA_DEV_MENU: 'true',
        VARDA_RECORDINGS_DIR: join(tmpdir(), 'varda-e2e-recordings'),
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
