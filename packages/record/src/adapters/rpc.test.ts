import { inspect } from 'node:util';
import { createRouterClient, safe } from '@orpc/server';
import type { SharedContext } from '@varda/shared';
import { createFakeCoachingAccess } from '@varda/shared/testing';
import { describe, expect, it } from 'vitest';
import { createRecordFakes } from '../testing/index.ts';
import { type WatchFileOptions, type WatchFileSplit, watchFile } from '../watch-files/index.ts';
import { createRecordRouter } from './rpc.ts';

const guðrún = '00000000-0000-7000-8000-0000000000a1';

function clientFor(context: SharedContext, adapters = createRecordFakes()) {
  return createRouterClient(createRecordRouter(adapters), { context });
}

const fitFile = (bytes: Uint8Array, name = 'run.fit') => new File([bytes as Uint8Array<ArrayBuffer>], name);

describe('placing a stone', () => {
  it('places a road run with its summary and laps, and lists it on its day', async () => {
    const client = clientFor({ person: guðrún });

    const { stoneId } = await client.stones.place({ file: fitFile(watchFile(), 'morning-run.fit') });
    const stones = await client.stones.list({ from: '2026-11-02', to: '2026-11-02' });

    // Only the fields named here, so a ticket adding a field doesn't rewrite this; each tests its own.
    expect(stones).toMatchObject([
      {
        id: stoneId,
        localDate: '2026-11-02',
        start: new Date('2026-11-02T07:30:00Z'),
        localOffset: 0,
        sport: { sport: 'road-running', group: 'running' },
        fileName: 'morning-run.fit',
        distance: 3000,
        movingTime: 900,
        elapsedTime: 930,
        laps: [
          {
            start: new Date('2026-11-02T07:30:00Z'),
            elapsedTime: 310,
            movingTime: 300,
            distance: 1000,
            trigger: 'distance',
          },
          {
            start: new Date('2026-11-02T07:35:10Z'),
            elapsedTime: 310,
            movingTime: 300,
            distance: 1000,
            trigger: 'distance',
          },
          {
            start: new Date('2026-11-02T07:40:20Z'),
            elapsedTime: 310,
            movingTime: 300,
            distance: 1000,
            trigger: 'distance',
          },
        ],
        trace: [
          [64.14661, -21.94264],
          [64.14522, -21.93911],
          [64.14309, -21.94018],
          [64.14384, -21.94467],
        ],
      },
    ]);
  });

  it('answers that a session already placed is placed, with the first stone', async () => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile()) });

    const { error, isDefined } = await safe(client.stones.place({ file: fitFile(watchFile(), 'copy.fit') }));

    expect(isDefined && { code: error.code, data: error.data }).toEqual({ code: 'ALREADY_PLACED', data: { stoneId } });
  });

  it('knows a session from a watch with no serial number by its start, whenever its file was written', async () => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile({ serialNumber: 0 })) });
    const exportedLater = watchFile({ serialNumber: 0, timeCreated: new Date('2026-11-20T12:00:00Z') });

    const { error, isDefined } = await safe(client.stones.place({ file: fitFile(exportedLater) }));

    expect(isDefined && { code: error.code, data: error.data }).toEqual({ code: 'ALREADY_PLACED', data: { stoneId } });
  });

  it('answers a lost race to place the same session with the stone that won it, keeping no recording', async () => {
    const adapters = createRecordFakes();
    const client = clientFor({ person: guðrún }, adapters);
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile()) });
    // The racing request looked before the winner's stone was there.
    adapters.stones = { ...adapters.stones, withSessionKey: async () => null };
    let loser = '';
    const add = adapters.stones.add;
    adapters.stones.add = async (stone) => {
      loser = stone.id;
      return await add(stone);
    };

    const { error, isDefined } = await safe(client.stones.place({ file: fitFile(watchFile()) }));

    expect(isDefined && { code: error.code, data: error.data }).toEqual({ code: 'ALREADY_PLACED', data: { stoneId } });
    expect(await adapters.recordings.get(loser)).toBeNull();
  });

  it('keeps no recording when the stone could not be added', async () => {
    const adapters = createRecordFakes();
    let tried = '';
    adapters.stones.add = async (stone) => {
      tried = stone.id;
      throw new Error('The database is down.');
    };

    const { error } = await safe(clientFor({ person: guðrún }, adapters).stones.place({ file: fitFile(watchFile()) }));

    expect(error).not.toBeNull();
    expect(await adapters.recordings.get(tried)).toBeNull();
  });

  // The rows of spec #60's sport table that carry a decision, not the whole table.
  it.each([
    ['running', 'street', 'road-running'],
    ['running', 'trail', 'trail-running'],
    ['running', 'ultra', 'trail-running'],
    ['running', 'track', 'track-running'],
    ['running', 'treadmill', 'treadmill-running'],
    ['running', 'indoorRunning', 'treadmill-running'],
    ['running', 'virtualActivity', 'treadmill-running'],
    ['running', 'obstacle', 'road-running'],
    ['eBiking', 'generic', 'cycling'],
    ['snowboarding', 'generic', 'skiing'],
    ['mountaineering', 'generic', 'hiking'],
    ['snowshoeing', 'generic', 'hiking'],
    ['training', 'yoga', 'other'],
    ['golf', 'generic', 'other'],
  ] as const)('places a %s (%s) session as %s', async (sport, subSport, expected) => {
    const client = clientFor({ person: guðrún });

    await client.stones.place({ file: fitFile(watchFile({ sport, subSport })) });
    const [stone] = await client.stones.list({ from: '2026-11-02', to: '2026-11-02' });

    expect(stone?.sport.sport).toBe(expected);
  });

  it('places a strength session with no laps and no distance', async () => {
    const client = clientFor({ person: guðrún });
    const strength = watchFile({ sport: 'training', subSport: 'strengthTraining', laps: [], distance: false });

    await client.stones.place({ file: fitFile(strength) });
    const [stone] = await client.stones.list({ from: '2026-11-02', to: '2026-11-02' });

    expect(stone).toMatchObject({ sport: { sport: 'strength' }, distance: null, laps: [] });
  });

  it('dates a stone by the local day it started on, even when that is another day in UTC, keeping its offset', async () => {
    const client = clientFor({ person: guðrún });
    // 22:30 in New York (UTC−5) on the 2nd is 03:30 UTC on the 3rd.
    const lateEvening = watchFile({ start: new Date('2026-11-03T03:30:00Z'), localOffset: -5 * 3600 });
    // 00:30 in Oslo (UTC+1) on the 4th is 23:30 UTC on the 3rd.
    const pastMidnight = watchFile({ start: new Date('2026-11-03T23:30:00Z'), localOffset: 3600 });

    await client.stones.place({ file: fitFile(lateEvening) });
    await client.stones.place({ file: fitFile(pastMidnight) });
    const stones = await client.stones.list({ from: '2026-11-01', to: '2026-11-05' });

    expect(stones.map((stone) => [stone.localDate, stone.localOffset])).toEqual([
      ['2026-11-04', 3600],
      ['2026-11-02', -5 * 3600],
    ]);
  });

  it('dates and times a stone in UTC when the watch file has no local time', async () => {
    const client = clientFor({ person: guðrún });
    const noLocalTime = watchFile({ start: new Date('2026-11-03T23:30:00Z'), localOffset: null });

    await client.stones.place({ file: fitFile(noLocalTime) });
    const stones = await client.stones.list({ from: '2026-11-01', to: '2026-11-05' });

    expect(stones.map((stone) => [stone.localDate, stone.localOffset])).toEqual([['2026-11-03', 0]]);
  });

  it('refuses someone who is not signed in with the typed error', async () => {
    const { error, isDefined } = await safe(clientFor({ person: null }).stones.place({ file: fitFile(watchFile()) }));
    expect(isDefined && error.code).toBe('UNAUTHORIZED');
  });
});

describe('turning a watch file away', () => {
  const notAFitFile = new TextEncoder().encode('lap,distance\n1,1000\n');

  it.each([
    ['not-a-fit-file', fitFile(notAFitFile, 'run.fit')],
    ['broken', fitFile(watchFile({ brokenCrc: true }))],
    ['not-a-session', fitFile(watchFile({ fileType: 'course' }))],
    ['multisport', fitFile(watchFile({ multisport: true }))],
    // 25 MB is the most Varða takes; this starts as a real watch file and is 1 byte over.
    ['too-large', new File([watchFile() as Uint8Array<ArrayBuffer>, new Uint8Array(25_000_001)], 'huge.fit')],
  ])('turns away a file that is %s, keeping nothing', async (reason, file) => {
    const client = clientFor({ person: guðrún });

    const { error, isDefined } = await safe(client.stones.place({ file }));

    expect(isDefined && { code: error.code, data: error.data }).toEqual({ code: 'TURNED_AWAY', data: { reason } });
    expect(await client.stones.list({ from: '2000-01-01', to: '2100-01-01' })).toEqual([]);
  });

  it('turns away a file missing when its session started as broken', async () => {
    const client = clientFor({ person: guðrún });

    const { error, isDefined } = await safe(
      client.stones.place({ file: fitFile(watchFile({ missingStartTime: true })) }),
    );

    expect(isDefined && { code: error.code, data: error.data }).toEqual({
      code: 'TURNED_AWAY',
      data: { reason: 'broken' },
    });
  });
});

describe('the trace', () => {
  const placedTrace = async (file: File) => {
    const client = clientFor({ person: guðrún });
    await client.stones.place({ file });
    const [stone] = await client.stones.list({ from: '2026-11-02', to: '2026-11-02' });
    return stone?.trace;
  };

  it('has none when the watch recorded no GPS', async () => {
    expect(await placedTrace(fitFile(watchFile({ gps: false })))).toBeNull();
  });

  it('is simplified to at most 300 points, keeping where the session started and finished', async () => {
    const trace = await placedTrace(fitFile(watchFile({ gpsPoints: 2000 })));

    expect(trace?.length).toBeLessThanOrEqual(300);
    expect(trace?.length).toBeGreaterThan(2);
    expect(trace?.at(0)).toEqual([64.14661, -21.94264]);
    expect(trace?.at(-1)).toEqual([64.14384, -21.94467]);
  });
});

describe('the streams', () => {
  const opened = async (file: Uint8Array) => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(file) });
    return await client.stones.get({ stoneId });
  };

  it('keeps every point the watch recorded, each second, with its offset from the start and its pauses marked', async () => {
    // 3 laps of 1 km in 300 s of timer and 310 s elapsed: each lap stops for 10 s halfway.
    const { streams } = await opened(watchFile({ perSecond: true }));

    // 931 seconds from start to finish, less the 9 seconds inside each of the 3 pauses.
    expect(streams?.offset).toHaveLength(904);
    expect(streams?.offset.slice(0, 3)).toEqual([0, 1, 2]);
    expect(streams?.offset.at(-1)).toBe(930);
    // The point at each restart ends an interval the timer didn't run; every other point is timer-on.
    const paused = streams?.offset.filter((_, i) => streams.timerRunning[i] === false);
    expect(paused).toEqual([160, 470, 780]);
    expect(streams?.timerRunning).toHaveLength(904);
  });

  it('keeps each channel the watch recorded, in SI units, as recorded', async () => {
    const { streams } = await opened(watchFile({ perSecond: true }));
    const at = (offset: number) => streams?.offset.indexOf(offset) ?? -1;

    // Halfway through the first lap: 500 m in 150 s; still there when the timer starts again.
    expect(streams?.distance?.[at(150)]).toBeCloseTo(500);
    expect(streams?.distance?.[at(160)]).toBeCloseTo(500);
    expect(streams?.distance?.at(-1)).toBeCloseTo(3000);
    expect(streams?.speed?.[at(100)]).toBeCloseTo(3.333, 2);
    expect(streams?.speed?.[at(160)]).toBe(0);
    // A running watch writes cadence per leg (85.5 strides/min): the stone has it in steps per minute.
    expect(streams?.cadence?.[at(100)]).toBe(171);
    expect(streams?.stepLength?.[at(100)]).toBeCloseTo(1.17);
    expect(streams?.verticalOscillation?.[at(100)]).toBeCloseTo(0.085);
    expect(streams?.verticalRatio?.[at(100)]).toBeCloseTo(7.3);
    expect(streams?.groundContactTime?.[at(100)]).toBeCloseTo(0.245);
    expect(streams?.position?.[0]?.[0]).toBeCloseTo(64.146612, 5);
    expect(streams?.position?.at(-1)?.[1]).toBeCloseTo(-21.944671, 5);
    for (const channel of ['heartRate', 'altitude', 'power', 'temperature'] as const) {
      expect(streams?.[channel]).toHaveLength(904);
      expect(streams?.[channel]?.every((value) => typeof value === 'number')).toBe(true);
    }
  });

  it('leaves out the channels the watch did not record', async () => {
    const treadmill = await opened(
      watchFile({ subSport: 'treadmill', perSecond: true, gps: false, without: ['altitude', 'power'] }),
    );
    const strength = await opened(
      watchFile({
        sport: 'training',
        subSport: 'strengthTraining',
        laps: [],
        distance: false,
        gps: false,
        perSecond: true,
        without: ['altitude', 'power', 'cadence', 'temperature', 'form'],
      }),
    );

    expect(treadmill.streams).toMatchObject({ position: null, altitude: null, power: null });
    expect(treadmill.streams?.distance).toHaveLength(904);
    // A watch writes 0 m all session long when it measures no distance: there is no distance at all.
    expect(strength.streams).toMatchObject({
      distance: null,
      speed: null,
      altitude: null,
      power: null,
      cadence: null,
      temperature: null,
      position: null,
      stepLength: null,
      verticalOscillation: null,
      verticalRatio: null,
      groundContactTime: null,
    });
    expect(strength.streams?.heartRate?.length).toBe(strength.streams?.offset.length);
  });

  it('keeps cadence in revolutions per minute, as recorded, for a ride', async () => {
    const { streams } = await opened(watchFile({ sport: 'cycling', perSecond: true, without: ['form'] }));

    expect(streams?.cadence?.[100]).toBe(85);
  });

  it('has none when the watch recorded no points', async () => {
    expect((await opened(watchFile({ gps: false, noRecords: true }))).streams).toBeNull();
  });

  it('is never listed', async () => {
    const client = clientFor({ person: guðrún });
    await client.stones.place({ file: fitFile(watchFile({ perSecond: true })) });

    const [listed] = await client.stones.list({ from: '2026-11-02', to: '2026-11-02' });

    expect(listed).toBeDefined();
    expect(listed).not.toHaveProperty('streams');
  });
});

describe('listing stones', () => {
  const runOn = (day: string, time = '07:30') => fitFile(watchFile({ start: new Date(`${day}T${time}:00Z`) }));

  it('lists the stones within the range, both ends included, newest first', async () => {
    const client = clientFor({ person: guðrún });
    const placed = async (file: File) => (await client.stones.place({ file })).stoneId;
    await placed(runOn('2026-10-31'));
    const first = await placed(runOn('2026-11-01'));
    const morning = await placed(runOn('2026-11-04', '06:00'));
    const evening = await placed(runOn('2026-11-04', '18:00'));
    const last = await placed(runOn('2026-11-07'));
    await placed(runOn('2026-11-08'));

    const stones = await client.stones.list({ from: '2026-11-01', to: '2026-11-07' });

    expect(stones.map((stone) => stone.id)).toEqual([last, evening, morning, first]);
  });

  it("never lists another athlete's stones", async () => {
    const adapters = createRecordFakes();
    await clientFor({ person: guðrún }, adapters).stones.place({ file: runOn('2026-11-02') });

    const jón = clientFor({ person: '00000000-0000-7000-8000-0000000000b2' }, adapters);

    expect(await jón.stones.list({ from: '2026-11-02', to: '2026-11-02' })).toEqual([]);
  });
});

describe('opening a stone', () => {
  it('opens a placed stone with its laps and trace, as the feed shows it', async () => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile(), 'morning-run.fit') });

    const stone = await client.stones.get({ stoneId });

    const [listed] = await client.stones.list({ from: '2026-11-02', to: '2026-11-02' });
    expect(stone).toMatchObject(listed ?? {});
    expect([stone.fileName, stone.laps.length, stone.trace?.length]).toEqual(['morning-run.fit', 3, 4]);
  });

  it('answers that a stone that does not exist is not found', async () => {
    const client = clientFor({ person: guðrún });

    const { error, isDefined } = await safe(client.stones.get({ stoneId: '00000000-0000-7000-8000-00000000ffff' }));

    expect(isDefined && error.code).toBe('NOT_FOUND');
  });

  it("answers that another athlete's stone is not found, exactly as if it did not exist", async () => {
    const adapters = createRecordFakes();
    const { stoneId } = await clientFor({ person: guðrún }, adapters).stones.place({ file: fitFile(watchFile()) });
    const jón = clientFor({ person: '00000000-0000-7000-8000-0000000000b2' }, adapters);

    const { error, isDefined } = await safe(jón.stones.get({ stoneId }));

    expect(isDefined && { code: error.code, status: error.status, data: error.data }).toEqual({
      code: 'NOT_FOUND',
      status: 404,
      data: undefined,
    });
  });

  it("opens another athlete's stone for someone coaching access lets see it", async () => {
    const coach = '00000000-0000-7000-8000-0000000000c3';
    const adapters = {
      ...createRecordFakes(),
      coachingAccess: createFakeCoachingAccess([{ viewer: coach, athlete: guðrún }]),
    };
    const { stoneId } = await clientFor({ person: guðrún }, adapters).stones.place({ file: fitFile(watchFile()) });

    const stone = await clientFor({ person: coach }, adapters).stones.get({ stoneId });

    expect(stone.id).toBe(stoneId);
  });
});

describe('deleting a stone', () => {
  it('deletes a stone so it is not found and no longer listed', async () => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile()) });

    await client.stones.delete({ stoneId });

    const { error, isDefined } = await safe(client.stones.get({ stoneId }));
    expect(isDefined && error.code).toBe('NOT_FOUND');
    expect(await client.stones.list({ from: '2026-11-02', to: '2026-11-02' })).toEqual([]);
  });

  it('leaves no recording behind, so the same file places a new stone', async () => {
    const adapters = createRecordFakes();
    const client = clientFor({ person: guðrún }, adapters);
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile()) });

    await client.stones.delete({ stoneId });
    const placedAgain = await client.stones.place({ file: fitFile(watchFile()) });

    expect(await adapters.recordings.get(stoneId)).toBeNull();
    expect(placedAgain.stoneId).not.toBe(stoneId);
    expect((await client.stones.get(placedAgain)).id).toBe(placedAgain.stoneId);
  });

  it("answers that another athlete's stone, or one that does not exist, is not found, and keeps it", async () => {
    const adapters = createRecordFakes();
    const client = clientFor({ person: guðrún }, adapters);
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile()) });
    const jón = clientFor({ person: '00000000-0000-7000-8000-0000000000b2' }, adapters);

    const someoneElses = await safe(jón.stones.delete({ stoneId }));
    const unknown = await safe(client.stones.delete({ stoneId: '00000000-0000-7000-8000-00000000ffff' }));

    expect(someoneElses.isDefined && someoneElses.error.code).toBe('NOT_FOUND');
    expect(unknown.isDefined && unknown.error.code).toBe('NOT_FOUND');
    expect((await client.stones.get({ stoneId })).id).toBe(stoneId);
    expect(await adapters.recordings.get(stoneId)).not.toBeNull();
  });

  it('deletes the stone even when its recording cannot be removed', async () => {
    const adapters = createRecordFakes();
    adapters.recordings.remove = async () => {
      throw new Error('The disk is gone.');
    };
    const client = clientFor({ person: guðrún }, adapters);
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile()) });

    // Logs that the file was left behind.
    await client.stones.delete({ stoneId });

    const { error, isDefined } = await safe(client.stones.get({ stoneId }));
    expect(isDefined && error.code).toBe('NOT_FOUND');
  });

  it('refuses someone who is not signed in with the typed error', async () => {
    const { error, isDefined } = await safe(
      clientFor({ person: null }).stones.delete({ stoneId: '00000000-0000-7000-8000-00000000ffff' }),
    );
    expect(isDefined && error.code).toBe('UNAUTHORIZED');
  });
});

describe("the athlete's measurements", () => {
  const measured = { weight: 71.3, height: 1.83, restingHeartRate: 47, maxHeartRate: 193 };

  it('keeps the weight, height, resting and max heart rate the watch had, for the athlete', async () => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile({ measurements: measured })) });

    const stone = await client.stones.get({ stoneId });

    expect(stone.measurements).toEqual(measured);
  });

  it('has none from a watch that had none', async () => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile()) });

    expect((await client.stones.get({ stoneId })).measurements).toBeNull();
  });

  it('shows a coach the resting and max heart rate, never the weight or height', async () => {
    const coach = '00000000-0000-7000-8000-0000000000c3';
    const adapters = {
      ...createRecordFakes(),
      coachingAccess: createFakeCoachingAccess([{ viewer: coach, athlete: guðrún }]),
    };
    const { stoneId } = await clientFor({ person: guðrún }, adapters).stones.place({
      file: fitFile(watchFile({ measurements: measured })),
    });

    const stone = await clientFor({ person: coach }, adapters).stones.get({ stoneId });

    expect(stone.measurements).toEqual({ weight: null, height: null, restingHeartRate: 47, maxHeartRate: 193 });
  });

  /** What placing says when it fails: everything it logs, and the error it throws, in full. */
  async function said(place: () => Promise<unknown>): Promise<string> {
    const lines: unknown[][] = [];
    const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
    const kept = methods.map((method) => console[method]);
    for (const method of methods) console[method] = (...args: unknown[]) => lines.push(args);
    try {
      const { error } = await safe(place());
      return inspect({ lines, error }, { depth: null });
    } finally {
      methods.forEach((method, i) => {
        console[method] = kept[i] as (typeof console)[typeof method];
      });
    }
  }
  const anyMeasurement = /weight|height|heartRate|71\.3|1\.83/i;

  it.each([
    ['broken', { brokenCrc: true }],
    ['multisport', { multisport: true }],
  ] as const)('says nothing of them when a %s file is turned away', async (_, options) => {
    const client = clientFor({ person: guðrún });

    const words = await said(() =>
      client.stones.place({ file: fitFile(watchFile({ ...options, measurements: measured })) }),
    );

    expect(words).toContain('TURNED_AWAY');
    expect(words).not.toMatch(anyMeasurement);
  });

  it('says nothing of them when the stone fails to be kept, naming the stone instead', async () => {
    const adapters = createRecordFakes();
    // A database error carries the row it failed to write, as the Postgres driver's does.
    adapters.stones.add = async (stone) => {
      throw new Error(`Failed query: insert into "record"."stones"\nparams: ${JSON.stringify(stone)}`);
    };
    const client = clientFor({ person: guðrún }, adapters);

    const words = await said(() => client.stones.place({ file: fitFile(watchFile({ measurements: measured })) }));

    expect(words).toMatch(/Placing stone [0-9a-f-]{36} failed/);
    expect(words).not.toMatch(anyMeasurement);
  });
});

describe('effort, the watch and Garmin reference data (#77)', () => {
  it("takes the stone's effort from the rating the athlete gave on the watch", async () => {
    const client = clientFor({ person: guðrún });

    const { stoneId } = await client.stones.place({ file: fitFile(watchFile({ rpe: 20 })) });

    expect((await client.stones.get({ stoneId })).effort).toBe(2);
  });

  it('gives a stone the athlete did not rate on the watch no effort', async () => {
    const client = clientFor({ person: guðrún });

    const { stoneId } = await client.stones.place({ file: fitFile(watchFile()) });

    expect((await client.stones.get({ stoneId })).effort).toBeNull();
  });

  it('keeps which watch recorded the stone, by its maker and model', async () => {
    const client = clientFor({ person: guðrún });

    const { stoneId } = await client.stones.place({ file: fitFile(watchFile({ product: 3990 })) });

    expect((await client.stones.get({ stoneId })).device).toEqual({
      manufacturer: 'Garmin',
      model: 'Forerunner 255 Music',
    });
  });

  it('names only the maker of a watch whose model it does not know', async () => {
    const client = clientFor({ person: guðrún });

    const { stoneId } = await client.stones.place({ file: fitFile(watchFile({ product: 65_000 })) });

    expect((await client.stones.get({ stoneId })).device).toEqual({ manufacturer: 'Garmin', model: null });
  });

  it("keeps Garmin's training load and Training Effect with the stone, and never answers them", async () => {
    const adapters = createRecordFakes();
    const client = clientFor({ person: guðrún }, adapters);
    const garminReference = { trainingLoad: 105.5, aerobicTrainingEffect: 3.2, anaerobicTrainingEffect: 1.4 };

    const { stoneId } = await client.stones.place({ file: fitFile(watchFile({ garminReference })) });
    const answers = JSON.stringify([
      await client.stones.get({ stoneId }),
      await client.stones.list({ from: '2026-11-02', to: '2026-11-02' }),
    ]);

    expect((await adapters.stones.byId(stoneId))?.garminReference).toEqual(garminReference);
    expect(answers).not.toMatch(/garmin.?reference|training.?load|training.?effect|105\.5|3\.2|1\.4/i);
  });

  it('keeps no Garmin reference data from a file without it', async () => {
    const adapters = createRecordFakes();

    const { stoneId } = await clientFor({ person: guðrún }, adapters).stones.place({ file: fitFile(watchFile()) });

    expect((await adapters.stones.byId(stoneId))?.garminReference).toBeNull();
  });
});

describe('summary figures', () => {
  it("keeps a run's figures exactly as the watch recorded them, cadence in steps a minute as the watch shows it", async () => {
    const client = clientFor({ person: guðrún });
    const run = watchFile({
      figures: {
        averageHeartRate: 152,
        maxHeartRate: 178,
        ascent: 84,
        descent: 79,
        // The watch writes a run's cadence per leg: 84.5 strides a minute are 169 steps.
        averageCadence: 84.5,
        maxCadence: 92,
        averagePower: 301,
        maxPower: 455,
        normalizedPower: 312,
        minTemperature: 18,
        averageTemperature: 23,
        maxTemperature: 27,
        calories: 712,
      },
    });
    const { stoneId } = await client.stones.place({ file: fitFile(run) });

    const stone = await client.stones.get({ stoneId });

    expect(stone.figures).toEqual({
      averageHeartRate: 152,
      maxHeartRate: 178,
      ascent: 84,
      descent: 79,
      averageCadence: 169,
      maxCadence: 184,
      averagePower: 301,
      maxPower: 455,
      normalizedPower: 312,
      minTemperature: 18,
      averageTemperature: 23,
      maxTemperature: 27,
      calories: 712,
    });
  });

  it('leaves out every figure the watch did not record, never 0', async () => {
    const client = clientFor({ person: guðrún });
    const noHeartRateNoPower = watchFile({ figures: { ascent: 0, descent: 12, calories: 230 } });
    const { stoneId } = await client.stones.place({ file: fitFile(noHeartRateNoPower) });

    const stone = await client.stones.get({ stoneId });

    expect(stone.figures).toEqual({
      averageHeartRate: null,
      maxHeartRate: null,
      ascent: 0,
      descent: 12,
      averageCadence: null,
      maxCadence: null,
      averagePower: null,
      maxPower: null,
      normalizedPower: null,
      minTemperature: null,
      averageTemperature: null,
      maxTemperature: null,
      calories: 230,
    });
  });

  it("keeps a ride's cadence in revolutions a minute, as recorded", async () => {
    const client = clientFor({ person: guðrún });
    const ride = watchFile({ sport: 'cycling', figures: { averageCadence: 82, maxCadence: 110 } });
    const { stoneId } = await client.stones.place({ file: fitFile(ride, 'ride.fit') });

    const { figures } = await client.stones.get({ stoneId });

    expect([figures.averageCadence, figures.maxCadence]).toEqual([82, 110]);
  });

  it('lists stones with their figures', async () => {
    const client = clientFor({ person: guðrún });
    await client.stones.place({ file: fitFile(watchFile({ figures: { averageHeartRate: 141, calories: 498 } })) });

    const [listed] = await client.stones.list({ from: '2026-11-02', to: '2026-11-02' });

    expect(listed?.figures).toMatchObject({ averageHeartRate: 141, maxHeartRate: null, calories: 498 });
  });
});

describe('stretches', () => {
  // A run of 900 s on the timer: running, a walk, standing at a crossing, running again.
  const runWalkStand: WatchFileSplit[] = [
    { type: 'rwdRun', start: 0, time: 400, distance: 1400 },
    { type: 'rwdWalk', start: 400, time: 120, distance: 150 },
    { type: 'rwdStand', start: 520, time: 30, distance: 0 },
    { type: 'rwdRun', start: 550, time: 350, distance: 1450 },
  ];

  it("keeps a run's stretches in order, with the watch's running, walking and standing totals", async () => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile({ splits: runWalkStand })) });

    const stone = await client.stones.get({ stoneId });

    expect(stone.stretches).toEqual({
      inOrder: [
        { kind: 'running', start: new Date('2026-11-02T07:30:00Z'), movingTime: 400, distance: 1400 },
        { kind: 'walking', start: new Date('2026-11-02T07:36:40Z'), movingTime: 120, distance: 150 },
        { kind: 'standing', start: new Date('2026-11-02T07:38:40Z'), movingTime: 30, distance: 0 },
        { kind: 'running', start: new Date('2026-11-02T07:39:10Z'), movingTime: 350, distance: 1450 },
      ],
      totals: {
        running: { movingTime: 750, distance: 2850 },
        walking: { movingTime: 120, distance: 150 },
        standing: { movingTime: 30, distance: 0 },
      },
    });
  });

  it("leaves out Garmin's interval-type splits, and the kinds the watch didn't detect", async () => {
    const client = clientFor({ person: guðrún });
    const intervals: WatchFileSplit[] = [
      { type: 'intervalActive', start: 0, time: 900, distance: 3000 },
      { type: 'rwdRun', start: 0, time: 900, distance: 3000 },
      { type: 'intervalRest', start: 900, time: 30, distance: 0 },
    ];
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile({ splits: intervals })) });

    const stone = await client.stones.get({ stoneId });

    expect(stone.stretches).toEqual({
      inOrder: [{ kind: 'running', start: new Date('2026-11-02T07:30:00Z'), movingTime: 900, distance: 3000 }],
      totals: { running: { movingTime: 900, distance: 3000 }, walking: null, standing: null },
    });
  });

  it('keeps no stretches for a ride, even with run/walk splits in its file', async () => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({
      file: fitFile(watchFile({ sport: 'cycling', splits: runWalkStand })),
    });

    expect((await client.stones.get({ stoneId })).stretches).toBeNull();
  });

  it('keeps no stretches for a run the watch detected none in, nor ones with only interval splits', async () => {
    const client = clientFor({ person: guðrún });
    const plain = await client.stones.place({ file: fitFile(watchFile()) });
    const onlyIntervals = await client.stones.place({
      file: fitFile(
        watchFile({
          start: new Date('2026-11-03T07:30:00Z'),
          splits: [{ type: 'intervalActive', start: 0, time: 900, distance: 3000 }],
        }),
      ),
    });

    expect((await client.stones.get(plain)).stretches).toBeNull();
    expect((await client.stones.get(onlyIntervals)).stretches).toBeNull();
  });

  it('lists stones without their stretches', async () => {
    const client = clientFor({ person: guðrún });
    await client.stones.place({ file: fitFile(watchFile({ splits: runWalkStand })) });

    const [listed] = await client.stones.list({ from: '2026-11-02', to: '2026-11-02' });

    expect(listed).not.toHaveProperty('stretches');
  });
});

describe('splits', () => {
  const opened = async (file: Uint8Array) => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(file) });
    return await client.stones.get({ stoneId });
  };
  // Three laps of 1 km in 300 s of timer, each stopped 10 s halfway, then 400 m in 120 s without a stop.
  const kilometre = { distance: 1000, timerTime: 300, elapsedTime: 310 };
  const threePointFour = [kilometre, kilometre, kilometre, { distance: 400, timerTime: 120, elapsedTime: 120 }];

  it('splits a 3.4 km run into three whole kilometres and the 0.4 km left, each timed without its pauses', async () => {
    const { splits } = await opened(watchFile({ perSecond: true, laps: threePointFour }));

    expect(splits.map(({ distance, movingTime }) => ({ distance, movingTime }))).toEqual([
      { distance: 1000, movingTime: 300 },
      { distance: 1000, movingTime: 300 },
      { distance: 1000, movingTime: 300 },
      { distance: expect.closeTo(400, 2), movingTime: 120 },
    ]);
  });

  it('leaves a pause inside a kilometre out of its time, wherever the kilometre ends between two points', async () => {
    // 1.7 km at 3.4 m/s in 500 s of timer, stopped for 30 s at 250 s: the first kilometre ends 294.1 s in.
    const { splits } = await opened(
      watchFile({ perSecond: true, laps: [{ distance: 1700, timerTime: 500, elapsedTime: 530 }] }),
    );

    expect(splits).toHaveLength(2);
    expect(splits[0]?.distance).toBe(1000);
    expect(splits[0]?.movingTime).toBeCloseTo(1000 / 3.4, 1);
    expect(splits[1]?.distance).toBeCloseTo(700, 1);
    expect(splits[1]?.movingTime).toBeCloseTo(700 / 3.4, 1);
  });

  it("takes each split's heart rate, ascent and descent from the points within it", async () => {
    // Up 10 m over the first kilometre, flat over the second, down 15 m over the third, then flat.
    const hill = (metres: number) =>
      metres < 1000 ? 20 + metres / 100 : metres < 2000 ? 30 : metres < 3000 ? 30 - (metres - 2000) * 0.015 : 15;
    const { splits } = await opened(watchFile({ perSecond: true, laps: threePointFour, ground: hill }));

    // The builder's runner's heart rate is 138 + t/40 + 3·sin(t/25) bpm, t seconds of timer.
    // 0–300 s: 138 + 150/40, and the sine averages 0.04. 900–1020 s: 138 + 960/40, the sine 0.54.
    expect(splits[0]?.averageHeartRate).toBeCloseTo(141.79, 0);
    expect(splits[3]?.averageHeartRate).toBeCloseTo(162.54, 0);
    // Each as near as an altimeter's wobble is told from a climb: within 1.2 m.
    const climbs = splits.map(({ ascent, descent }) => [ascent, descent]);
    const expected = [
      [10, 0],
      [0, 0],
      [0, 15],
      [0, 0],
    ];
    climbs.flat().forEach((metres, i) => {
      expect(Math.abs((metres ?? Number.NaN) - (expected.flat()[i] ?? 0))).toBeLessThanOrEqual(1.2);
    });
  });

  it("doesn't take an altimeter's wobble on flat ground for climbing", async () => {
    const wobbling = (metres: number) => 20 + (Math.floor(metres) % 2 === 0 ? 0.4 : -0.4);
    const { splits } = await opened(watchFile({ perSecond: true, laps: threePointFour, ground: wobbling }));

    for (const split of splits) expect(split).toMatchObject({ ascent: 0, descent: 0 });
  });

  it('has no heart rate, ascent or descent in a split when the watch recorded none', async () => {
    const { splits } = await opened(
      watchFile({ perSecond: true, laps: threePointFour, without: ['heartRate', 'altitude'] }),
    );

    expect(splits).toHaveLength(4);
    for (const split of splits) expect(split).toMatchObject({ averageHeartRate: null, ascent: null, descent: null });
  });

  it('splits a ride and a hike too', async () => {
    const ride = await opened(
      watchFile({ sport: 'cycling', perSecond: true, without: ['form'], laps: threePointFour }),
    );
    const hike = await opened(
      watchFile({
        sport: 'hiking',
        perSecond: true,
        without: ['form'],
        laps: threePointFour,
        start: new Date('2026-11-03'),
      }),
    );

    expect(ride.splits.map((split) => split.movingTime)).toEqual([300, 300, 300, 120]);
    expect(hike.splits.map((split) => split.movingTime)).toEqual([300, 300, 300, 120]);
  });

  it('has none for a pool swim, a strength session or yoga', async () => {
    const swim = await opened(
      watchFile({ sport: 'swimming', subSport: 'lapSwimming', perSecond: true, gps: false, without: ['form'] }),
    );
    const withoutDistance: WatchFileOptions = {
      laps: [],
      distance: false,
      gps: false,
      perSecond: true,
      without: ['form'],
    };
    const strength = await opened(
      watchFile({ sport: 'training', subSport: 'strengthTraining', ...withoutDistance, start: new Date('2026-11-03') }),
    );
    const yoga = await opened(
      watchFile({ sport: 'training', subSport: 'yoga', ...withoutDistance, start: new Date('2026-11-04') }),
    );

    expect(swim.distance).toBe(3000);
    expect(swim.splits).toEqual([]);
    expect(strength.splits).toEqual([]);
    expect(yoga.splits).toEqual([]);
  });

  it('is never listed', async () => {
    const client = clientFor({ person: guðrún });
    await client.stones.place({ file: fitFile(watchFile({ perSecond: true, laps: threePointFour })) });

    const [listed] = await client.stones.list({ from: '2026-11-02', to: '2026-11-02' });

    expect(listed).toBeDefined();
    expect(listed).not.toHaveProperty('splits');
  });
});
