import { describe, expect, it } from 'vitest';
import type { Ids, Persons } from '../application/ports.ts';

const uuidV7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

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

      const created = await persons.createFor({ id: ids.next(), loginAccount, name: 'Guðrún' });
      const again = await persons.createFor({ id: ids.next(), loginAccount, name: 'Someone else' });

      expect(created.id).toMatch(uuidV7);
      expect(created.name).toBe('Guðrún');
      expect(again).toEqual(created);
    });

    it('finds the person for a login account, or nobody', async () => {
      const { persons, ids, newLoginAccount } = await setup();
      const loginAccount = newLoginAccount();
      const created = await persons.createFor({ id: ids.next(), loginAccount, name: 'Jón' });

      expect(await persons.findFor(loginAccount)).toEqual(created);
      expect(await persons.findFor(newLoginAccount())).toBeNull();
    });
  });
}
