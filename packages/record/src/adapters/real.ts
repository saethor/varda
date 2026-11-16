import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RecordAdapters } from '../application/record-adapters.ts';
import { createLocalDiskRecordings } from './local-disk/recordings.ts';
import { createPostgresStones } from './postgres/stones.ts';

/**
 * Record's real adapters (ADR 0006), on the connection, the cross-cutting `ids` adapter and the
 * recordings directory main.ts opens, builds and reads.
 */
export function createRecordAdapters({
  db,
  ids,
  recordingsDir,
}: {
  db: NodePgDatabase;
  ids: RecordAdapters['ids'];
  recordingsDir: string;
}): RecordAdapters {
  return { stones: createPostgresStones(db), recordings: createLocalDiskRecordings(recordingsDir), ids };
}
