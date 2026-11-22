// The one-off backfill (#82), through the in-memory fakes: what the stones answer after it runs.
import { createRouterClient } from '@orpc/server';
import { describe, expect, it } from 'vitest';
import { createRecordRouter } from './adapters/rpc.ts';
import { fillInStones } from './application/fill-in-stones.ts';
import { createRecordFakes } from './testing/index.ts';
import { watchFile } from './watch-files/index.ts';

const guðrún = '00000000-0000-7000-8000-0000000000a1';

const fitFile = (bytes: Uint8Array, name = 'run.fit') => new File([bytes as Uint8Array<ArrayBuffer>], name);

/** Everything a watch file can tell that the first reader didn't read. */
const everything = watchFile({
  rpe: 70,
  product: 3990,
  measurements: { weight: 71.3, height: 1.83, restingHeartRate: 48, maxHeartRate: 193 },
  figures: { averageHeartRate: 152, maxHeartRate: 178, calories: 712 },
  splits: [
    { type: 'rwdRun', start: 0, time: 800, distance: 2800 },
    { type: 'rwdWalk', start: 800, time: 100, distance: 200 },
  ],
});

/**
 * A stone in its old shape: placed when the reader read none of the newer data, so it holds none
 * of it, though its recording has it all. Placing a file without that data, then keeping the full
 * file of the same session as its recording, leaves the stone exactly so.
 */
async function placeOldStone(adapters = createRecordFakes(), name = 'morning-run.fit', start?: Date) {
  const client = createRouterClient(createRecordRouter(adapters), { context: { person: guðrún } });
  const at = start === undefined ? {} : { start };
  const { stoneId } = await client.stones.place({ file: fitFile(watchFile(at), name) });
  await adapters.recordings.put(stoneId, start === undefined ? everything : watchFile({ ...at, rpe: 70 }));
  return { adapters, client, stoneId };
}

describe('filling in stones placed before the richer stone screen', () => {
  it('fills in what the recording holds, keeping who and when the stone is', async () => {
    const { adapters, client, stoneId } = await placeOldStone();
    const before = await client.stones.get({ stoneId });
    const sessionKey = (await adapters.stones.byId(stoneId))?.sessionKey;

    await fillInStones(adapters);
    const after = await client.stones.get({ stoneId });

    expect(before.effort).toBeNull();
    expect(after).toMatchObject({
      id: stoneId,
      localDate: '2026-11-02',
      start: new Date('2026-11-02T07:30:00Z'),
      fileName: 'morning-run.fit',
      effort: 7,
      device: { manufacturer: 'Garmin', model: 'Forerunner 255 Music' },
      figures: { averageHeartRate: 152, maxHeartRate: 178, calories: 712 },
      stretches: { totals: { running: { movingTime: 800, distance: 2800 } } },
      measurements: { weight: 71.3, height: 1.83, restingHeartRate: 48, maxHeartRate: 193 },
    });
    const stored = await adapters.stones.byId(stoneId);
    expect(stored?.athlete).toBe(guðrún);
    expect(stored?.sessionKey).toBe(sessionKey);
  });

  it('fills in the per-second streams of a stone placed without them', async () => {
    const adapters = createRecordFakes();
    const client = createRouterClient(createRecordRouter(adapters), { context: { person: guðrún } });
    const { stoneId } = await client.stones.place({ file: fitFile(watchFile({ noRecords: true })) });
    await adapters.recordings.put(stoneId, watchFile({ perSecond: true }));
    const before = await client.stones.get({ stoneId });

    await fillInStones(adapters);
    const after = await client.stones.get({ stoneId });

    expect(before.streams).toBeNull();
    expect(after.streams?.offset.length).toBeGreaterThan(0);
    expect(after.streams?.heartRate?.some((beat) => beat !== null)).toBe(true);
    // Its kilometre splits are worked out from them as it is filled in.
    expect(before.splits).toEqual([]);
    expect(after.splits.map((split) => split.distance)).toEqual([1000, 1000, 1000]);
  });

  it('changes nothing more when run again', async () => {
    const { adapters, stoneId } = await placeOldStone();

    await fillInStones(adapters);
    const once = await adapters.stones.byId(stoneId);
    const again = await fillInStones(adapters);

    expect(await adapters.stones.byId(stoneId)).toEqual(once);
    expect(again).toEqual({ filledIn: [stoneId], notFilledIn: [] });
  });

  it('leaves a stone whose recording is missing or unreadable as it was, reports it by ID, and fills in the rest', async () => {
    const { adapters, stoneId: missing } = await placeOldStone(
      undefined,
      'missing.fit',
      new Date('2026-11-01T07:30:00Z'),
    );
    const { stoneId: unreadable } = await placeOldStone(adapters, 'unreadable.fit', new Date('2026-11-03T07:30:00Z'));
    const { stoneId: readable } = await placeOldStone(adapters, 'readable.fit', new Date('2026-11-04T07:30:00Z'));
    await adapters.recordings.remove(missing);
    await adapters.recordings.put(unreadable, watchFile({ brokenCrc: true, rpe: 70 }));
    const before = [await adapters.stones.byId(missing), await adapters.stones.byId(unreadable)];

    const report = await fillInStones(adapters);

    expect([await adapters.stones.byId(missing), await adapters.stones.byId(unreadable)]).toEqual(before);
    expect((await adapters.stones.byId(readable))?.effort).toBe(7);
    expect(report).toEqual({
      filledIn: [readable],
      notFilledIn: [
        { stoneId: missing, reason: 'no-recording' },
        { stoneId: unreadable, reason: 'unreadable' },
      ],
    });
  });

  it('reports a stone whose reading could not be kept by its ID only, never with what it holds', async () => {
    const { adapters, stoneId } = await placeOldStone();
    const before = await adapters.stones.byId(stoneId);
    // A database error carries the row it failed to write.
    adapters.stones.replaceReading = async (_id, reading) => {
      throw new Error(`could not write ${JSON.stringify(reading)}`);
    };

    const report = await fillInStones(adapters);

    expect(report).toEqual({ filledIn: [], notFilledIn: [{ stoneId, reason: 'not-kept' }] });
    expect(JSON.stringify(report)).not.toMatch(/71\.3|1\.83|193/);
    expect(await adapters.stones.byId(stoneId)).toEqual(before);
  });
});
