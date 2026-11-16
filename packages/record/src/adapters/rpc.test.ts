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
      },
    ]);
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

  it('dates a stone by the local day it started on, even when that is another day in UTC', async () => {
    const client = clientFor({ person: guðrún });
    // 22:30 in New York (UTC−5) on the 2nd is 03:30 UTC on the 3rd.
    const lateEvening = watchFile({ start: new Date('2026-11-03T03:30:00Z'), localOffset: -5 * 3600 });
    // 00:30 in Oslo (UTC+1) on the 4th is 23:30 UTC on the 3rd.
    const pastMidnight = watchFile({ start: new Date('2026-11-03T23:30:00Z'), localOffset: 3600 });

    await client.stones.place({ file: fitFile(lateEvening) });
    await client.stones.place({ file: fitFile(pastMidnight) });
    const stones = await client.stones.list({ from: '2026-11-01', to: '2026-11-05' });

    expect(stones.map((stone) => stone.localDate)).toEqual(['2026-11-04', '2026-11-02']);
  });

  it('dates a stone by its UTC day when the watch file has no local time', async () => {
    const client = clientFor({ person: guðrún });
    const noLocalTime = watchFile({ start: new Date('2026-11-03T23:30:00Z'), localOffset: null });

    await client.stones.place({ file: fitFile(noLocalTime) });
    const stones = await client.stones.list({ from: '2026-11-01', to: '2026-11-05' });

    expect(stones.map((stone) => stone.localDate)).toEqual(['2026-11-03']);
  });

  it('refuses a session placed before, naming the stone already placed from it', async () => {
    const client = clientFor({ person: guðrún });
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile(), 'run.fit') });

    const { error, isDefined } = await safe(client.stones.place({ file: fitFile(watchFile(), 'copy.fit') }));

    expect(isDefined && error.code === 'ALREADY_PLACED' && error.data).toEqual({ stoneId });
    expect(await client.stones.list({ from: '2026-11-02', to: '2026-11-02' })).toHaveLength(1);
  });

  it('refuses someone who is not signed in with the typed error', async () => {
    const { error, isDefined } = await safe(clientFor({ person: null }).stones.place({ file: fitFile(watchFile()) }));
    expect(isDefined && error.code).toBe('UNAUTHORIZED');
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
