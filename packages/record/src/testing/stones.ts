import { describe, expect, it } from 'vitest';
import type { Ids, Stones } from '../application/ports.ts';
import type { LocalDate, PersonId, Reading, Stone, Streams } from '../domain/stone.ts';

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
      {
        start,
        elapsedTime: 310,
        movingTime: 300,
        distance: 1000,
        trigger: 'distance',
        figures: noFigures,
        intensity: null,
        workoutStep: null,
      },
      {
        start: new Date(start.getTime() + 310_000),
        elapsedTime: 620,
        movingTime: 600,
        distance: null,
        trigger: 'manual',
        figures: noFigures,
        intensity: null,
        workoutStep: null,
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
    figures: noFigures,
    stretches: {
      inOrder: [
        { kind: 'running', start, movingTime: 600, distance: 2000 },
        { kind: 'standing', start: new Date(start.getTime() + 600_000), movingTime: 30, distance: 0 },
        { kind: 'walking', start: new Date(start.getTime() + 630_000), movingTime: 270, distance: null },
      ],
      totals: {
        running: { movingTime: 600, distance: 2000 },
        walking: null,
        standing: { movingTime: 30, distance: 0 },
      },
    },
    measurements: { weight: 71.3, height: 1.83, restingHeartRate: null, maxHeartRate: 193 },
    streams,
    splits: [
      { distance: 1000, movingTime: 300, averageHeartRate: 141.5, ascent: 8, descent: 3.2 },
      { distance: 1000, movingTime: 300, averageHeartRate: null, ascent: null, descent: null },
      { distance: 1000, movingTime: 300, averageHeartRate: 150, ascent: 0, descent: 7.6 },
    ],
  };
}

const noFigures: Stone['figures'] = {
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
};

/** Four points a second apart, the last after a pause; GPS found at the second; no power or form. */
const streams: Streams = {
  offset: [0, 1, 2, 12],
  timerRunning: [true, true, true, false],
  distance: [0, 3.2, 6.5, 6.5],
  speed: [0, 3.2, 3.3, 0],
  heartRate: [96, 101, null, 104],
  altitude: [21.4, 21.6, 21.8, 21.8],
  power: null,
  cadence: [0, 168, 171.5, 0],
  temperature: [8, 8, 8, 9],
  position: [null, [64.14661, -21.94264], [64.14663, -21.94259], [64.14663, -21.94259]],
  stepLength: null,
  verticalOscillation: null,
  verticalRatio: null,
  groundContactTime: null,
};

/**
 * The behaviour every `Stones` adapter shares: run against the in-memory fake in `pnpm test`
 * and against Postgres in `pnpm test:adapters`, about one case per method (ADR 0007, ADR 0008).
 */
export function describeStones(name: string, setup: () => Promise<StonesSetup>): void {
  describe(`Stones (${name})`, () => {
    it('finds an added stone by its ID, with its laps, trace, local offset and streams, or none', async () => {
      const { stones, ids } = await setup();
      const added = stone(ids, ids.next(), '2026-11-02');
      const indoorsAbroad = {
        ...stone(ids, ids.next(), '2026-11-03'),
        trace: null,
        localOffset: -5 * 3600,
        streams: null,
      };

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

    it('lists stones without their streams', async () => {
      const { stones, ids } = await setup();
      const athlete = ids.next();
      const { streams: _streams, ...withoutStreams } = stone(ids, athlete, '2026-11-02');
      await stones.add({ ...withoutStreams, streams });

      expect(await stones.ofAthlete(athlete, { from: '2026-11-02', to: '2026-11-02' })).toEqual([withoutStreams]);
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

    it('removes its streams with a stone, so none are left behind', async () => {
      const { stones, ids } = await setup();
      const added = stone(ids, ids.next(), '2026-11-02');
      await stones.add(added);

      await stones.remove(added.id);
      // A stone with no streams under the same ID would show any left behind.
      await stones.add({ ...added, streams: null });

      expect((await stones.byId(added.id))?.streams).toBeNull();
    });

    it("keeps a stone's figures, and those the watch didn't record as none", async () => {
      const { stones, ids } = await setup();
      const athlete = ids.next();
      const figures = {
        ...noFigures,
        averageHeartRate: 152,
        maxHeartRate: 178,
        ascent: 0,
        averageCadence: 169.5,
        minTemperature: -4,
        calories: 712,
      };
      const run = { ...stone(ids, athlete, '2026-11-02'), figures };
      const indoors = stone(ids, athlete, '2026-11-03');
      await stones.add(run);
      await stones.add(indoors);

      expect((await stones.byId(run.id))?.figures).toEqual(figures);
      expect((await stones.ofAthlete(athlete, { from: '2026-11-02', to: '2026-11-03' })).map((s) => s.figures)).toEqual(
        [noFigures, figures],
      );
    });

    it("keeps each lap's figures, intensity and workout step", async () => {
      const { stones, ids } = await setup();
      const run = stone(ids, ids.next(), '2026-11-02');
      const [warmUp, interval] = run.laps as [Stone['laps'][number], Stone['laps'][number]];
      const laps = [
        { ...warmUp, intensity: 'warm-up' as const, figures: { ...noFigures, averageHeartRate: 131, ascent: 0 } },
        { ...interval, intensity: 'active' as const, workoutStep: 3, figures: { ...noFigures, averagePower: 362 } },
      ];
      await stones.add({ ...run, laps });

      expect((await stones.byId(run.id))?.laps).toEqual(laps);
    });

    it('names every stone by its ID', async () => {
      const { stones, ids } = await setup();
      const one = stone(ids, ids.next(), '2026-11-02');
      const another = stone(ids, ids.next(), '2026-11-03');
      await stones.add(one);
      await stones.add(another);

      expect(await stones.everyId()).toEqual(expect.arrayContaining([one.id, another.id]));
      await stones.remove(one.id);
      expect(await stones.everyId()).not.toContain(one.id);
    });

    it('replaces what a stone holds as read from its recording, keeping what places it', async () => {
      const { stones, ids } = await setup();
      const added = {
        ...stone(ids, ids.next(), '2026-11-02'),
        effort: null,
        device: null,
        stretches: null,
        measurements: null,
        splits: [],
      };
      const { id, athlete, fileName, sessionKey, start, localOffset, localDate } = added;
      await stones.add(added);
      const reread = stone(ids, ids.next(), '2026-11-09');
      const reading: Reading = {
        sport: 'trail-running',
        distance: 3100,
        movingTime: 905,
        elapsedTime: 935,
        laps: reread.laps,
        trace: reread.trace,
        effort: reread.effort,
        device: reread.device,
        garminReference: reread.garminReference,
        figures: { ...noFigures, averageHeartRate: 152, calories: 712 },
        stretches: reread.stretches,
        measurements: reread.measurements,
        streams: reread.streams,
        splits: reread.splits,
      };

      await stones.replaceReading(added.id, reading);
      await stones.replaceReading(ids.next(), reading);

      expect(await stones.byId(added.id)).toEqual({
        ...reading,
        id,
        athlete,
        fileName,
        sessionKey,
        start,
        localOffset,
        localDate,
      });
    });

    it("fills in a stone's streams when its reading is replaced, and replaces those it had", async () => {
      const { stones, ids } = await setup();
      const withoutStreams = { ...stone(ids, ids.next(), '2026-11-02'), streams: null };
      const withOldStreams = { ...stone(ids, ids.next(), '2026-11-03'), streams: { ...streams, power: [0, 0, 0, 0] } };
      await stones.add(withoutStreams);
      await stones.add(withOldStreams);
      const {
        id: _a,
        athlete: _b,
        fileName: _c,
        sessionKey: _d,
        start: _e,
        localOffset: _f,
        localDate: _g,
        ...read
      } = stone(ids, ids.next(), '2026-11-09');

      await stones.replaceReading(withoutStreams.id, read);
      await stones.replaceReading(withOldStreams.id, read);

      expect((await stones.byId(withoutStreams.id))?.streams).toEqual(streams);
      expect((await stones.byId(withOldStreams.id))?.streams).toEqual(streams);
    });
  });
}
