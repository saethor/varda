// Public server interface of the Shared context (ADR 0006). apps/api imports only this file.
export { createSharedAdapters } from './adapters/postgres/index.ts';
export { createSharedReaders, type SharedReaders } from './adapters/readers.ts';
// apps/api fills the per-request context Shared owns, and composes every context's router on it.
export { createSharedRouter, type SharedContext } from './adapters/rpc.ts';
export type { SharedAdapters } from './application/shared-adapters.ts';
// The read model the published readers return.
export type { Person } from './domain/person.ts';
// Shared vocabulary, also used by the Plan and Record domains.
export type { Sport, SportGroup } from './domain/sport.ts';
