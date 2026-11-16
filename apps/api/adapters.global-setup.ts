import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Migrates the test database (DATABASE_URL, set by vitest.adapters.config.ts) with `pnpm db:migrate`'s own script. */
export default function setup(): void {
  execFileSync(process.execPath, [fileURLToPath(new URL('./src/migrate.ts', import.meta.url))], { stdio: 'inherit' });
}
