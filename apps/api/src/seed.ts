// `pnpm db:seed`: signs up the dev persons on a local, migrated database. Run by
// hand after `pnpm db:migrate`; running it again adds nothing.
import { createSharedAdapters, createSharedReaders } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createBetterAuthAdapter } from './auth/better-auth.ts';
import { seedPersons } from './dev-persons.ts';
import { required } from './env.ts';
import { createUuidV7Ids } from './ids.ts';

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

// Checked before anything else is read or connected, so a shared or production
// database is never touched.
const databaseUrl = required('DATABASE_URL');
const host = URL.canParse(databaseUrl) ? new URL(databaseUrl).hostname : '';
if (!localHosts.has(host)) {
  console.error(
    `db:seed only seeds a database on localhost, and DATABASE_URL points at "${host}". Nothing was written.`,
  );
  process.exit(1);
}

const password = required('VARDA_DEV_PASSWORD');
const baseURL = required('BETTER_AUTH_URL');
const pool = new Pool({ connectionString: databaseUrl });
try {
  const db = drizzle({ client: pool });
  const shared = createSharedAdapters({ db, ids: createUuidV7Ids() });
  const auth = createBetterAuthAdapter({
    db,
    secret: required('BETTER_AUTH_SECRET'),
    baseURL,
    persons: createSharedReaders(shared).persons,
  });
  const { created, skipped } = await seedPersons({ auth, baseURL, password });
  for (const email of created) console.log(`signed up ${email}`);
  for (const email of skipped) console.log(`skipped ${email} (already has a login account)`);
} finally {
  await pool.end();
}
