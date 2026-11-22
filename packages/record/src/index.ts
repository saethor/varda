// Public server interface of the Record context (ADR 0006). apps/api imports only this file.

export { createRecordAdapters } from './adapters/real.ts';
// The router, and the body limit apps/api's HTTP server puts in front of its `place` procedure.
export { createRecordRouter, placeBodyLimit } from './adapters/rpc.ts';
// The one-off backfill (#82): re-reads every stone's recording and keeps what today's reader reads.
export { type FilledInReport, fillInStones, type NotFilledInReason } from './application/fill-in-stones.ts';
export type { RecordAdapters, RecordOwnAdapters } from './application/record-adapters.ts';
