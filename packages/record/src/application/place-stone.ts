import { readWatchFile } from '../domain/read-watch-file.ts';
import type { PersonId, StoneId } from '../domain/stone.ts';
import type { RecordAdapters } from './record-adapters.ts';

/**
 * Places a stone for the athlete from a watch file, keeping the file as its recording.
 * The recording is written before the stone, so a stone never exists without one.
 */
export async function placeStone(
  adapters: RecordAdapters,
  athlete: PersonId,
  watchFile: { name: string; bytes: Uint8Array },
): Promise<StoneId> {
  const session = readWatchFile(watchFile.bytes);
  const id = adapters.ids.next();
  await adapters.recordings.put(id, watchFile.bytes);
  await adapters.stones.add({ ...session, id, athlete, fileName: watchFile.name });
  return id;
}
