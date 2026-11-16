import type { PersonId, StoneId } from '../domain/stone.ts';
import type { RecordOwnAdapters } from './record-adapters.ts';

/** How deleting a stone went: deleted, or there is no such stone of the athlete's. */
export type Deleting = 'deleted' | 'not-found';

/**
 * Deletes the athlete's stone, then its recording. Only the stone's athlete may delete it: a
 * stone of anyone else's is not found, as is one that doesn't exist. The stone goes first, so
 * a recording that can't be removed is only an orphan file, never a stone without one.
 */
export async function deleteStone(adapters: RecordOwnAdapters, athlete: PersonId, stoneId: StoneId): Promise<Deleting> {
  const stone = await adapters.stones.byId(stoneId);
  if (stone === null || stone.athlete !== athlete) return 'not-found';
  await adapters.stones.remove(stoneId);
  try {
    await adapters.recordings.remove(stoneId);
  } catch (error) {
    // The stone is gone, which is what the athlete asked for; sweeping up orphan files is for later.
    console.error(`Removing the recording of deleted stone ${stoneId} failed; the file is left behind.`, error);
  }
  return 'deleted';
}
