import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { SharedAdapters } from '../../application/shared-adapters.ts';
import { createPostgresPersons } from './persons.ts';

/** The infrastructure Shared's real adapters run on, opened by main.ts. */
export type SharedInfra = { db: NodePgDatabase };

/** Shared's real Drizzle adapters (ADR 0006). `ids` is cross-cutting and comes from apps/api. */
export function createSharedAdapters({ db }: SharedInfra): Omit<SharedAdapters, 'ids'> {
  return { persons: createPostgresPersons(db) };
}
