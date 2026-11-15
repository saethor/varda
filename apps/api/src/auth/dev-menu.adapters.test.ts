import { describe, expect, it } from 'vitest';
import { createUuidV7Ids } from '../ids.ts';
import { createRealApp, type RealApp } from '../real-app.ts';

const on = createRealApp({ devMenu: true });
const off = createRealApp({ devMenu: false });

type Person = { id: string; name: string };

async function signUp(name: string): Promise<Person> {
  const signedUp = await on.postAuth('sign-up/email', {
    name,
    email: `${crypto.randomUUID()}@example.com`,
    password: 'correct horse battery staple',
  });
  const { user } = (await signedUp.json()) as { user: { id: string } };
  const person = await on.shared.persons.findFor(user.id);
  if (!person) throw new Error(`Signing up ${name} created no person.`);
  return person;
}

async function listPersons(app: RealApp): Promise<Response> {
  return await app.getAuth('dev/persons');
}

async function impersonate(app: RealApp, personId: string): Promise<Response> {
  return await app.postAuth('dev/impersonate', { personId });
}

// The order of the list is the persons reader's, tested through the fakes in @varda/shared.
describe('the dev menu, with VARDA_DEV_MENU on', () => {
  it('lists persons with their names', async () => {
    const kari = await signUp(`Kári ${crypto.randomUUID()}`);

    const listed = (await (await listPersons(on)).json()) as Person[];

    expect(listed).toContainEqual(kari);
  });

  it('signs the browser in as the person picked', async () => {
    const gudrun = await signUp(`Guðrún ${crypto.randomUUID()}`);

    const impersonated = await impersonate(on, gudrun.id);
    const me = await on.clientFor(impersonated).shared.persons.me();

    expect(me).toEqual(gudrun);
  });

  // A malformed ID is just another ID that is no person's: the spec answers 404 for both.
  it.each([
    ['an unknown person ID', createUuidV7Ids().next()],
    ['an ID that is not a UUID', 'not-a-person'],
  ])('answers 404 for %s', async (_, personId) => {
    const response = await impersonate(on, personId);

    expect(response.status).toBe(404);
  });
});

describe('the dev menu, with VARDA_DEV_MENU off', () => {
  it('has no dev routes', async () => {
    const anna = await signUp(`Anna ${crypto.randomUUID()}`);

    const statuses = [(await listPersons(off)).status, (await impersonate(off, anna.id)).status];

    expect(statuses).toEqual([404, 404]);
  });
});
