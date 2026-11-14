import { resolvePerson } from '../application/resolve-person.ts';
import type { SharedAdapters } from '../application/shared-adapters.ts';
import type { LoginAccount, Person } from '../domain/person.ts';

/** What Shared publishes to in-process callers outside the contract (ADR 0005): trusted, with no access checks. */
export type SharedReaders = {
  persons: {
    /**
     * The person behind a login account, creating them if the login account has
     * none yet, and never a second (the safety net). Used by apps/api's auth adapter.
     */
    forLoginAccount(loginAccount: LoginAccount): Promise<Person>;
  };
};

export function createSharedReaders(adapters: SharedAdapters): SharedReaders {
  return {
    persons: { forLoginAccount: (loginAccount) => resolvePerson(adapters, loginAccount) },
  };
}
