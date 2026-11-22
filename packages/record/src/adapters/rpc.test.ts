import { createRouterClient, safe } from '@orpc/server';
import type { SharedContext } from '@varda/shared';
import { createFakeCoachingAccess } from '@varda/shared/testing';
import { describe, expect, it } from 'vitest';
import { createRecordFakes } from '../testing/index.ts';
import { watchFile } from '../watch-files/index.ts';
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
