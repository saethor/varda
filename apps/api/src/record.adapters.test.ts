import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRecordAdapters } from '@varda/record';
import { describeRecordings, describeStones } from '@varda/record/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, afterEach } from 'vitest';
import { createUuidV7Ids } from './ids.ts';

// Record's real adapters, built exactly as main.ts builds them, against a migrated database
// and a fresh temporary recordings directory for every case.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(async () => await pool.end());

const db = drizzle({ client: pool });
const ids = createUuidV7Ids();

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function recordAdapters() {
  const recordingsDir = await mkdtemp(join(tmpdir(), 'varda-recordings-'));
  dirs.push(recordingsDir);
  return createRecordAdapters({ db, ids, recordingsDir });
}

// Every case uses fresh athletes and stone IDs, so cases never see each other's rows.
describeStones('Postgres', async () => ({ stones: (await recordAdapters()).stones, ids }));

describeRecordings('local disk', async () => ({ recordings: (await recordAdapters()).recordings, ids }));
