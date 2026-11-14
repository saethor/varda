import { createSharedAdapters, createSharedReaders } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, expect, it } from 'vitest';
import { createUuidV7Ids } from '../ids.ts';
import { createBetterAuthAdapter } from './better-auth.ts';

// The real auth adapter, built exactly as main.ts builds it, against a migrated database.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(async () => await pool.end());

const db = drizzle({ client: pool });
const baseURL = 'http://localhost:4000';
const shared = createSharedAdapters({ db, ids: createUuidV7Ids() });
const auth = createBetterAuthAdapter({
  db,
  secret: 'adapter-test-secret-at-least-32-characters',
  baseURL,
  persons: createSharedReaders(shared).persons,
});

const uuidV7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// The only test showing that signing up creates the person (the after-user-created hook), not the safety net.
it('creates the person when signing up, and resolves the session to them', async () => {
  const signUp = await auth.handle(
    new Request(`${baseURL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Anna',
        email: `anna-${crypto.randomUUID()}@example.com`,
        password: 'correct horse battery staple',
      }),
    }),
  );
  const cookie = signUp.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');

  const { user } = (await signUp.json()) as { user: { id: string } };

  const created = await shared.persons.findFor(user.id);
  const signedIn = await auth.personFor(new Request(`${baseURL}/rpc/shared/persons/me`, { headers: { cookie } }));

  expect(created).toEqual({ id: expect.stringMatching(uuidV7), name: 'Anna' });
  expect(signedIn).toEqual(created?.id);
});
