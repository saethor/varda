// Public server interface of the Record context (ADR 0006). apps/api imports only this file.

export { createRecordAdapters } from './adapters/real.ts';
// The router, and the body limit apps/api's HTTP server puts in front of its `place` procedure.
export { createRecordRouter, placeBodyLimit } from './adapters/rpc.ts';
export type { RecordAdapters, RecordOwnAdapters } from './application/record-adapters.ts';
