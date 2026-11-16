import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RecordOwnAdapters } from '../application/record-adapters.ts';
import { createLocalDiskRecordings } from './local-disk/recordings.ts';
import { createPostgresStones } from './postgres/stones.ts';

/**
 * Record's own real adapters (ADR 0006), on the connection, the cross-cutting `ids` adapter and the
 * recordings directory main.ts opens, builds and reads.
 */
export function createRecordAdapters({
  db,
  ids,
  recordingsDir,
}: {
  db: NodePgDatabase;
  ids: RecordOwnAdapters['ids'];
  recordingsDir: string;
}): RecordOwnAdapters {
  return { stones: createPostgresStones(db), recordings: createLocalDiskRecordings(recordingsDir), ids };
}
