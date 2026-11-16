// Reading a watch file is pure domain code: @garmin/fitsdk only decodes bytes in memory (spec #60).
// FIT words (activity, session, timer time) stay in this file; everything it returns is Record's.
import { type ActivityMesg, Decoder, type FileIdMesg, type LapMesg, type SessionMesg, Stream } from '@garmin/fitsdk';
import type { Sport } from '@varda/shared';
import type { Lap, LapTrigger, LocalDate, Session, SessionKey } from './stone.ts';

/** Reads the session a watch file recorded. */
export function readWatchFile(bytes: Uint8Array): Session {
  const { messages, errors } = new Decoder(Stream.fromByteArray(bytes)).read();
  const [fileId] = messages.fileIdMesgs ?? [];
  const [session] = messages.sessionMesgs ?? [];
  if (errors.length > 0 || fileId === undefined || session === undefined) {
    throw new Error('The watch file holds no session that can be read.');
  }

  const start = dateOf(session.startTime);
  const laps = lapsOf(session, messages.lapMesgs ?? []);
  return {
    sessionKey: sessionKeyOf(fileId, start),
    start,
    localDate: localDateOf(start, messages.activityMesgs?.[0]),
    sport: sportOf(session),
    distance: session.totalDistance || null,
    movingTime: session.totalTimerTime ?? 0,
    elapsedTime: session.totalElapsedTime ?? 0,
    laps,
  };
}

/**
 * The watch, and when it wrote the file. A watch with no serial number (0) can't be told apart
 * from others of its model that way, so it falls back to the model and when the session started.
 */
function sessionKeyOf(fileId: FileIdMesg, start: Date): SessionKey {
  return fileId.serialNumber
    ? [fileId.manufacturer, fileId.serialNumber, dateOf(fileId.timeCreated).toISOString()].join(':')
    : [fileId.manufacturer, fileId.product, start.toISOString()].join(':');
}

/** The local date where the session started: its start shifted by the activity's local time offset. */
function localDateOf(start: Date, activity: ActivityMesg | undefined): LocalDate {
  const offset =
    typeof activity?.localTimestamp === 'number' ? activity.localTimestamp - fitSeconds(dateOf(activity.timestamp)) : 0;
  return new Date(start.getTime() + offset * 1000).toISOString().slice(0, 10);
}

/** The session's laps, picked by its lap index and ordered by start. */
function lapsOf(session: SessionMesg, lapMesgs: LapMesg[]): Lap[] {
  const first = session.firstLapIndex ?? 0;
  return lapMesgs
    .slice(first, first + (session.numLaps ?? lapMesgs.length))
    .map((lap) => ({
      start: dateOf(lap.startTime),
      elapsedTime: lap.totalElapsedTime ?? 0,
      movingTime: lap.totalTimerTime ?? 0,
      distance: lap.totalDistance || null,
      trigger: triggerOf(lap.lapTrigger),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

// The FIT lap triggers Record tells apart; every other one (position, session end, …) is "other".
const triggers: Partial<Record<string, LapTrigger>> = { manual: 'manual', distance: 'distance', time: 'time' };

function triggerOf(trigger: LapMesg['lapTrigger']): LapTrigger {
  return triggers[String(trigger)] ?? 'other';
}

function sportOf(session: SessionMesg): Sport {
  return session.sport === 'running' ? 'road-running' : 'other';
}

/** 1989-12-31T00:00:00Z, the FIT epoch, in Unix seconds. */
const fitEpoch = 631_065_600;

const fitSeconds = (date: Date) => date.getTime() / 1000 - fitEpoch;

/** The decoder turns FIT date-times into `Date`s; a bare number is seconds since the FIT epoch. */
function dateOf(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date((value + fitEpoch) * 1000);
  throw new Error('The watch file is missing a time it needs.');
}
