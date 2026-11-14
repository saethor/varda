import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { SharedAdapters } from '../../application/shared-adapters.ts';
import { createPostgresPersons } from './persons.ts';

/**
 * Shared's real adapters (ADR 0006), on the connection and the cross-cutting
 * `ids` adapter main.ts opens and builds.
 */
export function createSharedAdapters({ db, ids }: { db: NodePgDatabase; ids: SharedAdapters['ids'] }): SharedAdapters {
  return { persons: createPostgresPersons(db), ids };
}
