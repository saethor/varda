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

it('records the stones every second, with pauses, keeping only the channels each sport records', async () => {
  const { clientFor, stonesOf } = devApp();

  await seedStones({ clientFor, athletes: [anna.id], today });
  const listed = await stonesOf(anna.id);
  const streamsOf = async (sport: string) => {
    const stone = listed.find((s) => s.sport.sport === sport);
    return stone && (await clientFor(anna.id).record.stones.get({ stoneId: stone.id })).streams;
  };

  const run = await streamsOf('road-running');
  expect(run?.timerRunning.includes(false)).toBe(true);
  expect(run?.offset.slice(0, 3)).toEqual([0, 1, 2]);
  for (const channel of ['distance', 'heartRate', 'altitude', 'power', 'cadence', 'position', 'stepLength'] as const) {
    expect(run?.[channel]).not.toBeNull();
  }
  expect(await streamsOf('treadmill-running')).toMatchObject({ position: null, altitude: null });
  expect(await streamsOf('cycling')).toMatchObject({ power: null, stepLength: null });
  expect(await streamsOf('strength')).toMatchObject({ distance: null, heartRate: expect.any(Array) });
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

it("keeps the athlete's measurements on every stone, as the dev watch had them", async () => {
  const { clientFor, stonesOf } = devApp();

  await seedStones({ clientFor, athletes: [anna.id], today });
  const opened = await Promise.all(
    (await stonesOf(anna.id)).map(({ id }) => clientFor(anna.id).record.stones.get({ stoneId: id })),
  );

  for (const stone of opened) {
    expect(stone.measurements).toEqual({ weight: 68.5, height: 1.74, restingHeartRate: 52, maxHeartRate: 188 });
  }
});

it('rates some stones on the watch and not others, all from the same watch', async () => {
  const { clientFor, stonesOf } = devApp();

  await seedStones({ clientFor, athletes: [anna.id], today });
  const stones = await stonesOf(anna.id);

  expect(stones.some((stone) => stone.effort !== null)).toBe(true);
  expect(stones.some((stone) => stone.effort === null)).toBe(true);
  expect(new Set(stones.map((stone) => stone.device?.model))).toEqual(new Set(['Forerunner 255 Music']));
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

it('places an interval run whose laps carry their intensity and figures', async () => {
  const { clientFor, stonesOf } = devApp();
  await seedStones({ clientFor, athletes: [anna.id], today });

  const track = (await stonesOf(anna.id)).find((stone) => stone.sport.sport === 'track-running');

  expect(new Set(track?.laps.map((lap) => lap.intensity))).toEqual(
    new Set(['warm-up', 'active', 'recovery', 'cool-down']),
  );
  expect(track?.laps.every((lap) => lap.figures.averageHeartRate !== null)).toBe(true);
});

it('places runs with their running form, on the stone, its laps and its streams, and a ride with none', async () => {
  const { clientFor, stonesOf } = devApp();
  await seedStones({ clientFor, athletes: [anna.id], today });
  const listed = await stonesOf(anna.id);
  const open = (sport: string) => {
    const stone = listed.find((s) => s.sport.sport === sport);
    if (stone === undefined) throw new Error(`No ${sport} seeded.`);
    return clientFor(anna.id).record.stones.get({ stoneId: stone.id });
  };

  const track = await open('track-running');
  const ride = await open('cycling');

  expect(track.form?.stepLength).toBeGreaterThan(0.9);
  expect(track.form?.stepLength).toBeLessThan(1.6);
  expect(track.form?.groundContactTime).toBeGreaterThan(0.18);
  expect(track.form?.groundContactTime).toBeLessThan(0.32);
  expect(track.laps.every((lap) => lap.form !== null)).toBe(true);
  // The reps are run on longer steps and lighter feet than the recoveries.
  const [, rep, recovery] = track.laps;
  expect(rep?.form?.stepLength).toBeGreaterThan(recovery?.form?.stepLength ?? Infinity);
  expect(rep?.form?.groundContactTime).toBeLessThan(recovery?.form?.groundContactTime ?? 0);
  expect(new Set(track.streams?.stepLength).size).toBeGreaterThan(1);
  expect(ride.form).toBeNull();
});
