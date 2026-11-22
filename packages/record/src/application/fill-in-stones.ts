import { readWatchFile } from '../domain/read-watch-file.ts';
import type { Reading, StoneId } from '../domain/stone.ts';
import type { RecordOwnAdapters } from './record-adapters.ts';

/** Why a stone could not be filled in. */
export type NotFilledInReason = 'no-recording' | 'unreadable' | 'not-kept';

/** What filling in did: each stone by its ID only, never with anything it holds (spec #74). */
export type FilledInReport = {
  filledIn: StoneId[];
  notFilledIn: { stoneId: StoneId; reason: NotFilledInReason }[];
};

/**
 * Re-reads every stone's recording with today's watch-file reader and keeps all it reads now, so
 * stones placed before the reader learned something hold it too (ADR 0009, #82). A stone's ID,
 * athlete, file name, session and dates stay as they are. Running it again changes nothing more.
 * A stone whose recording is missing or can't be read, or whose reading can't be kept, is left as
 * it was and reported; the others are filled in all the same.
 */
export async function fillInStones(adapters: RecordOwnAdapters): Promise<FilledInReport> {
  const report: FilledInReport = { filledIn: [], notFilledIn: [] };
  for (const stoneId of await adapters.stones.everyId()) {
    const reason = await fillIn(adapters, stoneId);
    if (reason === null) report.filledIn.push(stoneId);
    else report.notFilledIn.push({ stoneId, reason });
  }
  return report;
}

async function fillIn(adapters: RecordOwnAdapters, stoneId: StoneId): Promise<NotFilledInReason | null> {
  let reading: Reading;
  try {
    const recording = await adapters.recordings.get(stoneId);
    if (recording === null) return 'no-recording';
    // What places the stone is kept as stored; all the rest is what the reader reads now.
    const { sessionKey, start, localOffset, localDate, ...read } = readWatchFile(recording);
    reading = read;
  } catch {
    return 'unreadable';
  }
  try {
    await adapters.stones.replaceReading(stoneId, reading);
  } catch {
    // Not the error itself: a database error carries the row it failed to write, measurements and
    // all, into whatever logs or reports it (spec #74).
    return 'not-kept';
  }
  return null;
}
