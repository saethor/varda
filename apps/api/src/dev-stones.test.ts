import { createRouterClient } from '@orpc/server';
import { createRecordRouter } from '@varda/record';
import { createRecordFakes } from '@varda/record/testing';
import { expect, it } from 'vitest';
import { seedStones } from './dev-stones.ts';

const anna = '00000000-0000-7000-8000-0000000000a1';
const bjarni = '00000000-0000-7000-8000-0000000000b2';
// A Thursday.
const today = new Date('2026-11-19T12:00:00Z');

const stonesOf = (record: ReturnType<typeof createRecordFakes>, person: string) =>
  createRouterClient(createRecordRouter(record), { context: { person } }).stones.list({
    from: '2026-10-01',
    to: '2026-12-31',
  });

it('places stones in several sports, with and without laps, over the recent weeks', async () => {
  const record = createRecordFakes();

  await seedStones({ record, athletes: [anna, bjarni], today });
  const stones = await stonesOf(record, anna);

  expect(new Set(stones.map((stone) => stone.sport.sport)).size).toBeGreaterThanOrEqual(4);
  expect(stones.some((stone) => stone.laps.length === 0)).toBe(true);
  expect(stones.some((stone) => stone.laps.length > 1)).toBe(true);
  for (const stone of stones) {
    expect(stone.localDate >= '2026-10-19' && stone.localDate <= '2026-11-19').toBe(true);
  }
  expect(await stonesOf(record, bjarni)).toHaveLength(stones.length);
});

it('gives outdoor stones a trace and those indoors or in a pool none', async () => {
  const record = createRecordFakes();

  await seedStones({ record, athletes: [anna], today });
  const traceOf = async (sport: string) => (await stonesOf(record, anna)).find((s) => s.sport.sport === sport)?.trace;

  expect(await traceOf('trail-running')).toEqual(expect.any(Array));
  expect(await traceOf('cycling')).toEqual(expect.any(Array));
  expect(await traceOf('treadmill-running')).toBeNull();
  expect(await traceOf('swimming')).toBeNull();
  expect(await traceOf('strength')).toBeNull();
});

it('places nothing new when seeding again', async () => {
  const record = createRecordFakes();
  const first = await seedStones({ record, athletes: [anna], today });

  const second = await seedStones({ record, athletes: [anna], today });

  expect(second).toEqual({ placed: 0, alreadyPlaced: first.placed });
  expect(await stonesOf(record, anna)).toHaveLength(first.placed);
});
