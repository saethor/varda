import { createSharedAdapters } from '@varda/shared';
import { describePersons } from '@varda/shared/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll } from 'vitest';
import { createUuidV7Ids } from './ids.ts';

// Shared's real adapters, built exactly as main.ts builds them, against a migrated database.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(async () => await pool.end());

const ids = createUuidV7Ids();
const { persons } = createSharedAdapters({ db: drizzle({ client: pool }) });

// Every case uses fresh login accounts, so cases never see each other's rows.
describePersons('Postgres', async () => ({ persons, ids, newLoginAccount: () => ids.next() }));
