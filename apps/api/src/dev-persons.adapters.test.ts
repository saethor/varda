import type { Person } from '@varda/shared';
import { beforeAll, expect, it } from 'vitest';
import { devPersons, type SeedResult, seedPersons } from './dev-persons.ts';
import { required } from './env.ts';
import { createRealApp } from './real-app.ts';

const { shared, auth, baseURL, postAuth, clientFor } = createRealApp({ devMenu: false });

// The password `pnpm db:seed` uses, so a local database seeded before still signs in.
const password = required('VARDA_DEV_PASSWORD');

async function me(email: string): Promise<Person> {
  return await clientFor(await postAuth('sign-in/email', { email, password })).shared.persons.me();
}

// Seeded twice. The first run may find the persons already there; the second always must.
let secondRun: SeedResult;
beforeAll(async () => {
  await seedPersons({ auth, baseURL, password });
  secondRun = await seedPersons({ auth, baseURL, password });
});

it('signs up nobody when seeding again', () => {
  expect(secondRun).toEqual({ created: [], skipped: devPersons.map(({ email }) => email) });
});

it('lets every seeded person sign in with the dev password and be told who they are', async () => {
  const names = await Promise.all(devPersons.map(async ({ email }) => (await me(email)).name));

  expect(names).toEqual(devPersons.map(({ name }) => name));
});

it('gives each seeded email exactly one person', async () => {
  const everyone = await shared.persons.everyone();

  for (const { name, email } of devPersons) {
    expect(everyone.filter((person) => person.name === name)).toEqual([await me(email)]);
  }
});
