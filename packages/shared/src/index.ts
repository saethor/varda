// Public server interface of the Shared context (ADR 0006). apps/api imports only this file.
export { createSharedRouter, requirePerson, type SharedContext } from './adapters/rpc.ts';
export type { Ids, Persons } from './application/ports.ts';
// The safety net and the login-account hook both resolve through this (used by the auth adapter).
export { resolvePerson } from './application/resolve-person.ts';
export type { SharedAdapters } from './application/shared-adapters.ts';
export type { LoginAccount, LoginAccountId, Person, PersonId } from './domain/person.ts';
// Shared vocabulary, also used by the Plan and Record domains.
export type { Sport, SportGroup } from './domain/sport.ts';
