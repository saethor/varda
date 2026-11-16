// Public server interface of the Record context (ADR 0006). apps/api imports only this file.

export { createRecordAdapters } from './adapters/real.ts';
export { createRecordRouter } from './adapters/rpc.ts';
// The placing use case the `place` procedure calls, for apps/api's seed to place dev stones through.
export { type Placing, placeStone } from './application/place-stone.ts';
export type { RecordAdapters, RecordOwnAdapters } from './application/record-adapters.ts';
export { maxWatchFileBytes } from './contract.ts';
