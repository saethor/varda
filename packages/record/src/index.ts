// Public server interface of the Record context (ADR 0006). apps/api imports only this file.

export { createRecordAdapters } from './adapters/real.ts';
export { createRecordRouter } from './adapters/rpc.ts';
export type { RecordAdapters } from './application/record-adapters.ts';
