// `pnpm db:seed`: signs up the dev persons on a local, migrated database and places their dev
// stones. Run by hand after `pnpm db:migrate`, and by the end-to-end suite; running it again
// adds nothing.
import { createRouterClient } from '@orpc/server';
import { createRecordAdapters } from '@varda/record';
import { createSharedAdapters, createSharedReaders } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createBetterAuthAdapter } from './auth/better-auth.ts';
import { devPersons, seedPersons } from './dev-persons.ts';
import { seedStones } from './dev-stones.ts';
import { required } from './env.ts';
import { createUuidV7Ids } from './ids.ts';
import { createRouter } from './router.ts';

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
const recordingsDir = required('VARDA_RECORDINGS_DIR');
const pool = new Pool({ connectionString: databaseUrl });
try {
  const db = drizzle({ client: pool });
  const ids = createUuidV7Ids();
  const shared = createSharedAdapters({ db, ids });
  // Record's real adapters, built the way main.ts builds them.
  const record = createRecordAdapters({ db, ids, recordingsDir });
  const persons = createSharedReaders(shared).persons;
  const auth = createBetterAuthAdapter({
    db,
    secret: required('BETTER_AUTH_SECRET'),
    baseURL,
    persons,
    devMenu: false,
  });
  const { created, skipped } = await seedPersons({ auth, baseURL, password });
  for (const email of created) console.log(`signed up ${email}`);
  for (const email of skipped) console.log(`skipped ${email} (already has a login account)`);

  const devNames = new Set(devPersons.map(({ name }) => name));
  const athletes = (await persons.everyone()).filter(({ name }) => devNames.has(name)).map(({ id }) => id);
  // The router the API serves, so the stones are placed exactly as `place` places them.
  const router = createRouter({ shared, record, auth });
  const clientFor = (person: string) => createRouterClient(router, { context: { person } });
  const stones = await seedStones({ clientFor, athletes, today: new Date() });
  console.log(`placed ${stones.placed} stones, skipped ${stones.alreadyPlaced} (already placed)`);
} finally {
  await pool.end();
}
