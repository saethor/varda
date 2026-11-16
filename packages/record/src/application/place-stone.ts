import { readWatchFile } from '../domain/read-watch-file.ts';
import type { PersonId, StoneId } from '../domain/stone.ts';
import type { RecordAdapters } from './record-adapters.ts';

/** A stone placed, or the athlete's stone already placed from the same session. */
export type Placing = { placed: StoneId } | { alreadyPlaced: StoneId };

/**
 * Places a stone for the athlete from a watch file, keeping the file as its recording.
 * The recording is written before the stone, so a stone never exists without one.
 * A session is placed only once: placing it again names the stone already placed.
 */
export async function placeStone(
  adapters: RecordAdapters,
  athlete: PersonId,
  watchFile: { name: string; bytes: Uint8Array },
): Promise<Placing> {
  const session = readWatchFile(watchFile.bytes);
  const existing = await adapters.stones.withSessionKey(athlete, session.sessionKey);
  if (existing !== null) return { alreadyPlaced: existing.id };
  const id = adapters.ids.next();
  await adapters.recordings.put(id, watchFile.bytes);
  await adapters.stones.add({ ...session, id, athlete, fileName: watchFile.name });
  return { placed: id };
}
