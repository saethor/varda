import { readWatchFile } from '../domain/read-watch-file.ts';
import type { PersonId, StoneId } from '../domain/stone.ts';
import type { RecordAdapters } from './record-adapters.ts';

/** How placing a stone went: placed, or refused because the session was already placed. */
export type Placing = { placed: StoneId } | { alreadyPlaced: StoneId };

/**
 * Places a stone for the athlete from a watch file, keeping the file as its recording.
 * The recording is written before the stone, so a stone never exists without one; when the
 * stone isn't added after all, its recording is removed again (the worst case is an orphan file).
 */
export async function placeStone(
  adapters: RecordAdapters,
  athlete: PersonId,
  watchFile: { name: string; bytes: Uint8Array },
): Promise<Placing> {
  const session = readWatchFile(watchFile.bytes);
  const placedBefore = await adapters.stones.withSessionKey(athlete, session.sessionKey);
  if (placedBefore !== null) return { alreadyPlaced: placedBefore.id };

  const id = adapters.ids.next();
  await adapters.recordings.put(id, watchFile.bytes);
  let added: Awaited<ReturnType<RecordAdapters['stones']['add']>>;
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
async function removeRecording(adapters: RecordAdapters, stoneId: StoneId): Promise<void> {
  try {
    await adapters.recordings.remove(stoneId);
  } catch {
    // Nothing more to do: the stone was never placed.
  }
}
