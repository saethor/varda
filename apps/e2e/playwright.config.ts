import { defineConfig, devices } from '@playwright/test';

// Ports of their own, so a run never reuses an API or web app left running for development.
const apiPort = 4100;
const webPort = 4174;

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // DATABASE_URL and Better Auth's settings come from the environment, or locally from the root .env.
      command: 'node --env-file-if-exists=../../.env src/main.ts',
      cwd: '../api',
      env: { PORT: String(apiPort) },
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: false,
    },
    {
      // `vite preview` proxies /rpc to the API above, as the dev server does.
      command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${webPort} --strictPort`,
      cwd: '../web',
      env: { VARDA_API_URL: `http://127.0.0.1:${apiPort}` },
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
