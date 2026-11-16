import type { CoachingAccess } from '../adapters/readers.ts';
import type { Ids, Persons } from '../application/ports.ts';
import type { SharedAdapters } from '../application/shared-adapters.ts';
import type { LoginAccountId, Person, PersonId } from '../domain/person.ts';

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
    async byId(id) {
      return [...byLoginAccount.values()].find((person) => person.id === id) ?? null;
    },
    async everyone() {
      return [...byLoginAccount.values()];
    },
    async loginAccountOf(id) {
      return [...byLoginAccount].find(([, person]) => person.id === id)?.[0] ?? null;
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

/**
 * Coaching access in memory: an athlete sees their own training, and a viewer sees an athlete's
 * when `grants` says so, so a test can stand in for a coach before coaching relationships exist.
 */
export function createFakeCoachingAccess(grants: { viewer: PersonId; athlete: PersonId }[] = []): CoachingAccess {
  return {
    async canSee(viewer, athlete) {
      return viewer === athlete || grants.some((grant) => grant.viewer === viewer && grant.athlete === athlete);
    },
  };
}
