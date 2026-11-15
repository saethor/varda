import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { Contract } from '@varda/contract';
import { createSharedAdapters, createSharedReaders } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createApp } from './app.ts';
import { createBetterAuthAdapter } from './auth/better-auth.ts';
import { seedPersons } from './dev-persons.ts';
import { createUuidV7Ids } from './ids.ts';

// The real app, built exactly as main.ts builds it, against a migrated database.
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
  devMenu: false,
});
const app = createApp({ shared, auth });

// The dev password from .env.example: the local database may already be seeded with it.
const password = 'varda-dev-password';

async function signIn(email: string): Promise<Response> {
  return await app.request(`${baseURL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

function clientWith(response: Response): ContractRouterClient<Contract> {
  const cookie = response.headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(';')[0])
    .join('; ');
  return createORPCClient(
    new RPCLink({ url: `${baseURL}/rpc`, headers: { cookie }, fetch: async (request) => await app.fetch(request) }),
  );
}

const seeded = [
  ['Anna Jónsdóttir', 'anna@varda.test'],
  ['Bjarni Sigurðsson', 'bjarni@varda.test'],
  ['Guðrún Ólafsdóttir', 'gudrun@varda.test'],
  ['Kári Einarsson', 'kari@varda.test'],
  ['Sóley Magnúsdóttir', 'soley@varda.test'],
] as const;

async function me(email: string) {
  const signedIn = await signIn(email);
  expect(signedIn.status).toBe(200);
  return await clientWith(signedIn).shared.persons.me();
}

// Seeded once, then again: the second run must find every login account and add nothing.
const afterFirstRun = new Map<string, Awaited<ReturnType<typeof me>>>();
let secondRun: Awaited<ReturnType<typeof seedPersons>>;
beforeAll(async () => {
  await seedPersons({ auth, baseURL, password });
  for (const [, email] of seeded) afterFirstRun.set(email, await me(email));
  secondRun = await seedPersons({ auth, baseURL, password });
});

it.each(seeded)(
  'after seeding twice, %s signs in with the dev password and is still one person',
  async (name, email) => {
    expect(secondRun).toEqual({ created: [], skipped: expect.arrayContaining([email]) });
    expect(await me(email)).toEqual({ id: expect.any(String), name });
    expect(await me(email)).toEqual(afterFirstRun.get(email));
  },
);
