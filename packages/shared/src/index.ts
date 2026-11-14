// Public server interface of the Shared context (ADR 0006). apps/api imports only this file.
export { createSharedRouter } from './adapters/rpc.ts';
// Shared vocabulary, also used by the Plan and Record domains.
export type { Sport, SportGroup } from './domain/sport.ts';
