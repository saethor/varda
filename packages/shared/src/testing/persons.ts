import { describe, expect, it } from 'vitest';
import type { Ids, Persons } from '../application/ports.ts';

export type PersonsSetup = {
  persons: Persons;
  ids: Ids;
  /** A login-account ID no earlier case has used. */
  newLoginAccount: () => string;
};

/**
 * The behaviour every `Persons` adapter shares: run against the in-memory fake
 * in `pnpm test` and against Postgres in `pnpm test:adapters`, about one case
 * per method (ADR 0007, ADR 0008).
 */
export function describePersons(name: string, setup: () => Promise<PersonsSetup>): void {
  describe(`Persons (${name})`, () => {
    it('creates one person per login account', async () => {
      const { persons, ids, newLoginAccount } = await setup();
      const loginAccount = newLoginAccount();

      const id = ids.next();

      const created = await persons.createFor({ id, loginAccount, name: 'Guðrún' });
      const again = await persons.createFor({ id: ids.next(), loginAccount, name: 'Someone else' });

      expect(created).toEqual({ id, name: 'Guðrún' });
      expect(again).toEqual(created);
    });

    it('finds the person for a login account, or nobody', async () => {
      const { persons, ids, newLoginAccount } = await setup();
      const loginAccount = newLoginAccount();
      const created = await persons.createFor({ id: ids.next(), loginAccount, name: 'Jón' });

      expect(await persons.findFor(loginAccount)).toEqual(created);
      expect(await persons.findFor(newLoginAccount())).toBeNull();
    });

    it('finds a person by their ID, or nobody', async () => {
      const { persons, ids, newLoginAccount } = await setup();
      const created = await persons.createFor({ id: ids.next(), loginAccount: newLoginAccount(), name: 'Sigga' });

      expect(await persons.byId(created.id)).toEqual(created);
      expect(await persons.byId(ids.next())).toBeNull();
    });

    it('lists every person', async () => {
      const { persons, ids, newLoginAccount } = await setup();
      const created = await persons.createFor({ id: ids.next(), loginAccount: newLoginAccount(), name: 'Kári' });

      expect(await persons.everyone()).toContainEqual(created);
    });

    it('finds the login account of a person, or none', async () => {
      const { persons, ids, newLoginAccount } = await setup();
      const loginAccount = newLoginAccount();
      const created = await persons.createFor({ id: ids.next(), loginAccount, name: 'Sóley' });

      expect(await persons.loginAccountOf(created.id)).toBe(loginAccount);
      expect(await persons.loginAccountOf(ids.next())).toBeNull();
    });
  });
}
