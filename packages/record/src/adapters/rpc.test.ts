import { createRouterClient, safe } from '@orpc/server';
import type { SharedContext } from '@varda/shared';
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

    expect(stones).toEqual([
      {
        id: stoneId,
        localDate: '2026-11-02',
        start: new Date('2026-11-02T07:30:00Z'),
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
