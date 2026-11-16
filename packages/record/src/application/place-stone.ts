import { readWatchFile } from '../domain/read-watch-file.ts';
import type { PersonId, StoneId, TurnedAwayReason } from '../domain/stone.ts';
import type { RecordOwnAdapters } from './record-adapters.ts';

/** How placing a stone went: placed, the session was placed before, or the file was turned away. */
export type Placing = { placed: StoneId } | { alreadyPlaced: StoneId } | { turnedAway: TurnedAwayReason };

/**
 * Places a stone for the athlete from a watch file, keeping the file as its recording.
 * The recording is written before the stone, so a stone never exists without one; when the
 * stone isn't added after all, its recording is removed again (the worst case is an orphan file).
 */
export async function placeStone(
  adapters: RecordOwnAdapters,
  athlete: PersonId,
  watchFile: { name: string; bytes: Uint8Array },
): Promise<Placing> {
  const reading = readWatchFile(watchFile.bytes);
  if ('turnedAway' in reading) return reading;
  const { session } = reading;
  const placedBefore = await adapters.stones.withSessionKey(athlete, session.sessionKey);
  if (placedBefore !== null) return { alreadyPlaced: placedBefore.id };

  const id = adapters.ids.next();
  await adapters.recordings.put(id, watchFile.bytes);
  let added: Awaited<ReturnType<RecordOwnAdapters['stones']['add']>>;
  try {
    added = await adapters.stones.add({ ...session, id, athlete, fileName: watchFile.name });
  } catch (error) {
    await removeRecording(adapters, id);
    throw error;
  }
  if (added !== 'added') {
    // Another request placed the same session between the look-up and here.
    await removeRecording(adapters, id);
    return added;
  }
  return { placed: id };
}

/** Best effort: a recording left behind is only an orphan file, never a stone without one. */
async function removeRecording(adapters: RecordOwnAdapters, stoneId: StoneId): Promise<void> {
  try {
    await adapters.recordings.remove(stoneId);
  } catch {
    // Nothing more to do: the stone was never placed.
  }
}
