import { describe, expect, it } from 'vitest';
import type { Ids, Stones } from '../application/ports.ts';
import type { LocalDate, PersonId, Stone } from '../domain/stone.ts';

export type StonesSetup = {
  stones: Stones;
  /** IDs for stones, and for athletes no earlier case has used. */
  ids: Ids;
};

/** A road run on `localDate` at `time` UTC. */
function stone(ids: Ids, athlete: PersonId, localDate: LocalDate, time = '07:30'): Stone {
  const start = new Date(`${localDate}T${time}:00Z`);
  return {
    id: ids.next(),
    athlete,
    sessionKey: `garmin:3412345678:${start.toISOString()}`,
    fileName: 'run.fit',
    start,
    localOffset: 0,
    localDate,
    sport: 'road-running',
    distance: 3000,
    movingTime: 900,
    elapsedTime: 930,
    laps: [
      { start, elapsedTime: 310, movingTime: 300, distance: 1000, trigger: 'distance' },
      {
        start: new Date(start.getTime() + 310_000),
        elapsedTime: 620,
        movingTime: 600,
        distance: null,
        trigger: 'manual',
      },
    ],
    trace: [
      [64.14661, -21.94264],
      [64.14522, -21.93911],
      [64.14384, -21.94467],
    ],
    effort: 6,
    device: { manufacturer: 'Garmin', model: 'Forerunner 255 Music' },
    garminReference: { trainingLoad: 105.87, aerobicTrainingEffect: 3.2, anaerobicTrainingEffect: null },
  };
}

/**
 * The behaviour every `Stones` adapter shares: run against the in-memory fake in `pnpm test`
 * and against Postgres in `pnpm test:adapters`, about one case per method (ADR 0007, ADR 0008).
 */
export function describeStones(name: string, setup: () => Promise<StonesSetup>): void {
  describe(`Stones (${name})`, () => {
    it('finds an added stone by its ID, with its laps, trace and local offset, or none', async () => {
      const { stones, ids } = await setup();
      const added = stone(ids, ids.next(), '2026-11-02');
      const indoorsAbroad = { ...stone(ids, ids.next(), '2026-11-03'), trace: null, localOffset: -5 * 3600 };

      await stones.add(added);
      await stones.add(indoorsAbroad);

      expect(await stones.byId(added.id)).toEqual(added);
      expect(await stones.byId(indoorsAbroad.id)).toEqual(indoorsAbroad);
      expect(await stones.byId(ids.next())).toBeNull();
    });

    it("lists an athlete's stones by local date, both ends included, newest first", async () => {
      const { stones, ids } = await setup();
      const athlete = ids.next();
      const before = stone(ids, athlete, '2026-10-31');
      const first = stone(ids, athlete, '2026-11-01');
      const morning = stone(ids, athlete, '2026-11-04', '06:00');
      const evening = stone(ids, athlete, '2026-11-04', '18:00');
      const last = stone(ids, athlete, '2026-11-07');
      const someoneElses = stone(ids, ids.next(), '2026-11-04');
      for (const each of [morning, before, last, someoneElses, first, evening]) await stones.add(each);

      const listed = await stones.ofAthlete(athlete, { from: '2026-11-01', to: '2026-11-07' });

      expect(listed.map(({ id }) => id)).toEqual([last.id, evening.id, morning.id, first.id]);
    });

    it("finds the athlete's stone placed from a session, or none", async () => {
      const { stones, ids } = await setup();
      const athlete = ids.next();
      const added = stone(ids, athlete, '2026-11-02');
      await stones.add(added);

      expect(await stones.withSessionKey(athlete, added.sessionKey)).toEqual(added);
      expect(await stones.withSessionKey(ids.next(), added.sessionKey)).toBeNull();
    });

    it("refuses a second stone from the same session of the athlete's, answering the first", async () => {
      const { stones, ids } = await setup();
      const athlete = ids.next();
      const first = stone(ids, athlete, '2026-11-02');
      const second = { ...stone(ids, athlete, '2026-11-02'), sessionKey: first.sessionKey };
      const someoneElses = { ...stone(ids, ids.next(), '2026-11-02'), sessionKey: first.sessionKey };

      expect(await stones.add(first)).toBe('added');
      expect(await stones.add(second)).toEqual({ alreadyPlaced: first.id });
      expect(await stones.add(someoneElses)).toBe('added');
      expect(await stones.byId(second.id)).toBeNull();
    });

    it('removes a stone', async () => {
      const { stones, ids } = await setup();
      const added = stone(ids, ids.next(), '2026-11-02');
      await stones.add(added);

      await stones.remove(added.id);

      expect(await stones.byId(added.id)).toBeNull();
    });
  });
}
