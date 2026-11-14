import type { LoginAccountId, Person, PersonId } from '../domain/person.ts';

/** The Shared context's persons, exactly one per login account. */
export type Persons = {
  /**
   * Creates the person for a login account. Idempotent on the login account:
   * when it already has a person, that person is returned and nothing is created.
   */
  createFor(person: { id: PersonId; loginAccount: LoginAccountId; name: string }): Promise<Person>;
  /** The person for a login account, or null when it has none. */
  findFor(loginAccount: LoginAccountId): Promise<Person | null>;
  /** The person with this ID, or null when there is none. */
  byId(id: PersonId): Promise<Person | null>;
};

/** New IDs (UUIDv7), generated in application code (ADR 0006). A cross-cutting adapter. */
export type Ids = { next(): string };
