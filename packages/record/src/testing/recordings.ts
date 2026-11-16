import { describe, expect, it } from 'vitest';
import type { Ids, Recordings } from '../application/ports.ts';

export type RecordingsSetup = {
  /** A fresh store for each case. */
  recordings: Recordings;
  /** Stone IDs. */
  ids: Ids;
};

/**
 * The behaviour every `Recordings` adapter shares: run against the in-memory fake in `pnpm test`
 * and against the local disk in `pnpm test:adapters`, about one case per method (ADR 0007, ADR 0008).
 */
export function describeRecordings(name: string, setup: () => Promise<RecordingsSetup>): void {
  describe(`Recordings (${name})`, () => {
    it('gives back the bytes a recording was put with', async () => {
      const { recordings, ids } = await setup();
      const stoneId = ids.next();
      const bytes = new Uint8Array([14, 16, 0x2e, 0x46, 0x49, 0x54, 0, 255]);

      await recordings.put(stoneId, bytes);

      expect(await recordings.get(stoneId)).toEqual(bytes);
    });

    it('has no recording for a stone it was never given', async () => {
      const { recordings, ids } = await setup();

      expect(await recordings.get(ids.next())).toBeNull();
    });

    it('removes a recording, and removing it again is harmless', async () => {
      const { recordings, ids } = await setup();
      const stoneId = ids.next();
      await recordings.put(stoneId, new Uint8Array([1, 2, 3]));

      await recordings.remove(stoneId);
      await recordings.remove(stoneId);

      expect(await recordings.get(stoneId)).toBeNull();
    });
  });
}
