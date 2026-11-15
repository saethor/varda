import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

// `pnpm db:seed` as a developer runs it, minus the .env file. The `.invalid` host
// can't resolve, so a seed that tried to connect would fail with a different error.
it.each([
  'postgres://varda:varda@db.varda.invalid:5432/varda',
  'postgres://varda:varda@localhost.varda.invalid:5432/varda',
])('refuses to seed %s, which is not on localhost', (databaseUrl) => {
  const seed = spawnSync(process.execPath, [fileURLToPath(new URL('./seed.ts', import.meta.url))], {
    env: { PATH: process.env.PATH, DATABASE_URL: databaseUrl },
    encoding: 'utf8',
  });

  expect(seed.status).not.toBe(0);
  expect(seed.stderr).toContain('only seeds a database on localhost');
});
