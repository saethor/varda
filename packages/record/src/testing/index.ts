// Test-only: in-memory fakes and behaviour suites for the Record context's ports (ADR 0008).
export { createInMemoryRecordings, createInMemoryStones, createRecordFakes, createSequentialIds } from './fakes.ts';
export { describeRecordings, type RecordingsSetup } from './recordings.ts';
export { describeStones, type StonesSetup } from './stones.ts';
