import { StoneNotFound } from '../domain/errors.ts';
import type { PersonId, StoneId } from '../domain/stone.ts';
import type { RecordOwnAdapters } from './record-adapters.ts';

/**
 * How deleting a stone went: its recording went with it (`null`), or it couldn't be removed and
 * was left behind as an orphan file, for this reason.
 */
export type Deleting = { recordingLeftBehind: unknown };

/**
 * Deletes the athlete's stone, then its recording. Only the stone's athlete may delete it: a
 * stone of anyone else's throws `StoneNotFound`, as does one that doesn't exist. The stone goes
 * first, so a recording that can't be removed is only an orphan file, never a stone without one.
 */
export async function deleteStone(adapters: RecordOwnAdapters, athlete: PersonId, stoneId: StoneId): Promise<Deleting> {
  const stone = await adapters.stones.byId(stoneId);
  if (stone === null || stone.athlete !== athlete) throw new StoneNotFound(stoneId);
  await adapters.stones.remove(stoneId);
  try {
    await adapters.recordings.remove(stoneId);
  } catch (error) {
    // The stone is gone, which is what the athlete asked for; sweeping up orphan files is for later.
    return { recordingLeftBehind: error };
  }
  return { recordingLeftBehind: null };
}
