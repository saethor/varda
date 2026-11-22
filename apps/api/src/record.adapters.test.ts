import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRecordAdapters } from '@varda/record';
import { describeRecordings, describeStones } from '@varda/record/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, afterEach, expect, it } from 'vitest';
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

// A stone placed before its laps' figures were read holds laps in their old shape; only Postgres
// keeps such rows, so only it is asked to read them.
it('reads laps stored before their figures, intensity and workout step were read, with none of them', async () => {
  const { stones } = await recordAdapters();
  const id = ids.next();
  const oldLap = {
    start: '2026-11-02T07:30:00.000Z',
    elapsedTime: 310,
    movingTime: 300,
    distance: 1000,
    trigger: 'distance',
  };
  await pool.query(
    `insert into record.stones (id, athlete, session_key, file_name, start, local_date, sport, moving_time, elapsed_time, laps)
     values ($1, $2, $3, 'run.fit', '2026-11-02T07:30:00Z', '2026-11-02', 'road-running', 300, 310, $4)`,
    [id, ids.next(), `garmin:1:${id}`, JSON.stringify([oldLap])],
  );

  const stone = await stones.byId(id);

  expect(stone?.laps).toEqual([
    {
      ...oldLap,
      start: new Date(oldLap.start),
      intensity: null,
      workoutStep: null,
      figures: {
        averageHeartRate: null,
        maxHeartRate: null,
        ascent: null,
        descent: null,
        averageCadence: null,
        maxCadence: null,
        averagePower: null,
        maxPower: null,
        normalizedPower: null,
        minTemperature: null,
        averageTemperature: null,
        maxTemperature: null,
        calories: null,
      },
    },
  ]);
});
