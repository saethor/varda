import { SessionAlreadyPlaced } from '../domain/errors.ts';
import { readWatchFile } from '../domain/read-watch-file.ts';
import type { PersonId, StoneId } from '../domain/stone.ts';
import type { RecordOwnAdapters } from './record-adapters.ts';

/**
 * Places a stone for the athlete from a watch file, keeping the file as its recording, and
 * answers its ID. Throws `WatchFileTurnedAway` for a file that can't be placed, and
 * `SessionAlreadyPlaced` when the athlete already placed a stone from its session.
 * The recording is written before the stone, so a stone never exists without one; when the
 * stone isn't added after all, its recording is removed again (the worst case is an orphan file).
 */
export async function placeStone(
  adapters: RecordOwnAdapters,
  athlete: PersonId,
  watchFile: { name: string; bytes: Uint8Array },
): Promise<StoneId> {
  const session = readWatchFile(watchFile.bytes);
  const placedBefore = await adapters.stones.withSessionKey(athlete, session.sessionKey);
  if (placedBefore !== null) throw new SessionAlreadyPlaced(placedBefore.id);

  const id = adapters.ids.next();
  await adapters.recordings.put(id, watchFile.bytes);
  let added: Awaited<ReturnType<RecordOwnAdapters['stones']['add']>>;
  try {
    added = await adapters.stones.add({ ...session, id, athlete, fileName: watchFile.name });
  } catch {
    await removeRecording(adapters, id);
    // Not the error itself: a database error carries the row it failed to write, measurements and
    // all, into whatever logs or reports it. This names the stone only (spec #74).
    throw new Error(`Placing stone ${id} failed: the stone could not be kept.`);
  }
  if (added !== 'added') {
    // Another request placed the same session between the look-up and here.
    await removeRecording(adapters, id);
    throw new SessionAlreadyPlaced(added.alreadyPlaced);
  }
  return id;
}

/** Best effort: a recording left behind is only an orphan file, never a stone without one. */
async function removeRecording(adapters: RecordOwnAdapters, stoneId: StoneId): Promise<void> {
  try {
    await adapters.recordings.remove(stoneId);
  } catch {
    // Nothing more to do: the stone was never placed.
  }
}
