import type { Ids, Persons } from '../application/ports.ts';
import type { SharedAdapters } from '../application/shared-adapters.ts';
import type { LoginAccountId, Person } from '../domain/person.ts';

export function createInMemoryPersons(): Persons {
  const byLoginAccount = new Map<LoginAccountId, Person>();
  return {
    async createFor({ id, loginAccount, name }) {
      const existing = byLoginAccount.get(loginAccount);
      if (existing) return existing;
      const person = { id, name };
      byLoginAccount.set(loginAccount, person);
      return person;
    },
    async findFor(loginAccount) {
      return byLoginAccount.get(loginAccount) ?? null;
    },
  };
}

/** Deterministic UUIDv7-shaped IDs: …-7000-8000-000000000001, …0002, and so on. */
export function createSequentialIds(): Ids {
  let last = 0;
  return {
    next: () => `00000000-0000-7000-8000-${String(++last).padStart(12, '0')}`,
  };
}

export function createSharedFakes(): SharedAdapters {
  return { persons: createInMemoryPersons(), ids: createSequentialIds() };
}
