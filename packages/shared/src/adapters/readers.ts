import { resolvePerson } from '../application/resolve-person.ts';
import type { SharedAdapters } from '../application/shared-adapters.ts';
import type { LoginAccount, LoginAccountId, Person, PersonId } from '../domain/person.ts';

/** What Shared publishes to in-process callers outside the contract (ADR 0005): trusted, with no access checks. */
export type SharedReaders = {
  persons: {
    /**
     * The person behind a login account, creating them if the login account has
     * none yet, and never a second (the safety net). Used by apps/api's auth adapter.
     */
    forLoginAccount(loginAccount: LoginAccount): Promise<Person>;
    /** Every person, sorted by name in Icelandic order. Used by the dev menu. */
    everyone(): Promise<Person[]>;
    /** The login account a person signs in with, or null when there is no such person. Used by the dev menu. */
    loginAccountOf(id: PersonId): Promise<LoginAccountId | null>;
  };
};

const byName = new Intl.Collator('is');

export function createSharedReaders(adapters: SharedAdapters): SharedReaders {
  return {
    persons: {
      forLoginAccount: (loginAccount) => resolvePerson(adapters, loginAccount),
      everyone: async () => (await adapters.persons.all()).sort((a, b) => byName.compare(a.name, b.name)),
      loginAccountOf: (id) => adapters.persons.loginAccountOf(id),
    },
  };
}
