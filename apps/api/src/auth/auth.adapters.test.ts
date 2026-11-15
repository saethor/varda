import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { Contract } from '@varda/contract';
import { createSharedAdapters, createSharedReaders } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { createUuidV7Ids } from '../ids.ts';
import { createBetterAuthAdapter } from './better-auth.ts';

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

const uuidV7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

async function post(path: string, body: object): Promise<Response> {
  return await app.request(`${baseURL}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function sessionCookie(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

function clientWith(cookie: string): ContractRouterClient<Contract> {
  return createORPCClient(
    new RPCLink({ url: `${baseURL}/rpc`, headers: { cookie }, fetch: async (request) => await app.fetch(request) }),
  );
}

// The only test showing that signing up creates the person (the after-user-created hook),
// and that signing in with email and password reaches them through the contract.
it('creates the person on sign-up, and tells them who they are after signing in', async () => {
  const credentials = { email: `anna-${crypto.randomUUID()}@example.com`, password: 'correct horse battery staple' };

  const signUp = await post('sign-up/email', { name: 'Anna', ...credentials });
  const { user } = (await signUp.json()) as { user: { id: string } };
  // Before any request is signed in, so the safety net can't have created them.
  const created = await shared.persons.findFor(user.id);

  const signIn = await post('sign-in/email', credentials);
  const me = await clientWith(sessionCookie(signIn)).shared.persons.me();

  expect(created).toEqual({ id: expect.stringMatching(uuidV7), name: 'Anna' });
  expect(me).toEqual(created);
});
