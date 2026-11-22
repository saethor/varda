import { expect, it } from 'vitest';
import { seedStones } from './dev-stones.ts';
import { createTestApp } from './testing.ts';

const anna = { id: '00000000-0000-7000-8000-0000000000a1', name: 'Anna' };
const bjarni = { id: '00000000-0000-7000-8000-0000000000b2', name: 'Bjarni' };
// A Thursday.
const today = new Date('2026-11-19T12:00:00Z');

/** The app, signed in as each of Anna and Bjarni, over the same fakes. */
function devApp() {
  const asAnna = createTestApp({ as: anna });
  const asBjarni = createTestApp({
    as: bjarni,
    overrides: { shared: asAnna.fakes.shared, record: asAnna.fakes.record },
  });
  const clients = new Map([
    [anna.id, asAnna.client],
    [bjarni.id, asBjarni.client],
  ]);
  const clientFor = (athlete: string) => {
    const client = clients.get(athlete);
    if (client === undefined) throw new Error(`No client for ${athlete}.`);
    return client;
  };
  const stonesOf = (athlete: string) => clientFor(athlete).record.stones.list({ from: '2026-01-01', to: '2027-12-31' });
  return { clientFor, stonesOf };
}

it('places stones in several sports, with and without laps, over the recent weeks', async () => {
  const { clientFor, stonesOf } = devApp();

  await seedStones({ clientFor, athletes: [anna.id, bjarni.id], today });
  const stones = await stonesOf(anna.id);

  expect(new Set(stones.map((stone) => stone.sport.sport)).size).toBeGreaterThanOrEqual(4);
  expect(stones.some((stone) => stone.laps.length === 0)).toBe(true);
  expect(stones.some((stone) => stone.laps.length > 1)).toBe(true);
  for (const stone of stones) {
    expect(stone.localDate >= '2026-10-19' && stone.localDate <= '2026-11-19').toBe(true);
  }
  expect(await stonesOf(bjarni.id)).toHaveLength(stones.length);
});

it('gives outdoor stones a trace and those indoors or in a pool none', async () => {
  const { clientFor, stonesOf } = devApp();

  await seedStones({ clientFor, athletes: [anna.id], today });
  const traceOf = async (sport: string) => (await stonesOf(anna.id)).find((s) => s.sport.sport === sport)?.trace;

  expect(await traceOf('trail-running')).toEqual(expect.any(Array));
  expect(await traceOf('cycling')).toEqual(expect.any(Array));
  expect(await traceOf('treadmill-running')).toBeNull();
  expect(await traceOf('swimming')).toBeNull();
  expect(await traceOf('strength')).toBeNull();
});

it.each([
  ['the same day', today],
  ['a later week', new Date('2026-12-02T09:00:00Z')],
])('places nothing new when seeding again on %s', async (_, later) => {
  const { clientFor, stonesOf } = devApp();
  const first = await seedStones({ clientFor, athletes: [anna.id], today });

  const second = await seedStones({ clientFor, athletes: [anna.id], today: later });

  expect(second).toEqual({ placed: 0, alreadyPlaced: first.placed });
  expect(await stonesOf(anna.id)).toHaveLength(first.placed);
});

it('places a run with walking and standing stretches', async () => {
  const { clientFor, stonesOf } = devApp();
  await seedStones({ clientFor, athletes: [anna.id], today });

  const opened = await Promise.all(
    (await stonesOf(anna.id)).map(({ id }) => clientFor(anna.id).record.stones.get({ stoneId: id })),
  );

  const kinds = new Set(opened.flatMap((stone) => stone.stretches?.inOrder.map(({ kind }) => kind) ?? []));
  expect([...kinds].sort()).toEqual(['running', 'standing', 'walking']);
});
