import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { Contract } from '@varda/contract';
import { createSharedAdapters, createSharedReaders } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';
import { createUuidV7Ids } from '../ids.ts';
import { createBetterAuthAdapter } from './better-auth.ts';

// The real app, built exactly as main.ts builds it with VARDA_DEV_MENU on or off, against a migrated database.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(async () => await pool.end());

const db = drizzle({ client: pool });
const baseURL = 'http://localhost:4000';
const shared = createSharedAdapters({ db, ids: createUuidV7Ids() });

function appWith({ devMenu }: { devMenu: boolean }) {
  const auth = createBetterAuthAdapter({
    db,
    secret: 'adapter-test-secret-at-least-32-characters',
    baseURL,
    persons: createSharedReaders(shared).persons,
    devMenu,
  });
  return createApp({ shared, auth });
}

const app = appWith({ devMenu: true });

type Person = { id: string; name: string };

async function signUp(name: string): Promise<Person> {
  const signedUp = await app.request(`${baseURL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      email: `${crypto.randomUUID()}@example.com`,
      password: 'correct horse battery staple',
    }),
  });
  const { user } = (await signedUp.json()) as { user: { id: string } };
  const person = await shared.persons.findFor(user.id);
  if (!person) throw new Error(`Signing up ${name} created no person.`);
  return person;
}

async function listPersons(on: ReturnType<typeof appWith>): Promise<Response> {
  return await on.request(`${baseURL}/api/auth/dev/persons`);
}

async function impersonate(on: ReturnType<typeof appWith>, personId: string): Promise<Response> {
  return await on.request(`${baseURL}/api/auth/dev/impersonate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ personId }),
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

describe('the dev menu, with VARDA_DEV_MENU on', () => {
  it('lists every person by name', async () => {
    const unique = crypto.randomUUID();
    // Signed up out of order, so a list in sign-up order fails.
    const orn = await signUp(`Örn ${unique}`);
    const anna = await signUp(`Anna ${unique}`);

    const listed = (await (await listPersons(app)).json()) as Person[];
    const ours = listed.filter((person) => person.name.endsWith(unique));

    expect(ours).toEqual([anna, orn]);
  });

  it('signs the browser in as the person picked', async () => {
    const gudrun = await signUp(`Guðrún ${crypto.randomUUID()}`);

    const impersonated = await impersonate(app, gudrun.id);
    const me = await clientWith(sessionCookie(impersonated)).shared.persons.me();

    expect(me).toEqual(gudrun);
  });

  it('answers 404 for a person who does not exist', async () => {
    const response = await impersonate(app, createUuidV7Ids().next());

    expect(response.status).toBe(404);
  });
});

describe('the dev menu, with VARDA_DEV_MENU off', () => {
  it('has no dev routes', async () => {
    const off = appWith({ devMenu: false });
    const anna = await signUp(`Anna ${crypto.randomUUID()}`);

    const statuses = [(await listPersons(off)).status, (await impersonate(off, anna.id)).status];

    expect(statuses).toEqual([404, 404]);
  });
});
