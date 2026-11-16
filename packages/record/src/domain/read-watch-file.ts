// Reading a watch file is pure domain code: @garmin/fitsdk only decodes bytes in memory (spec #60).
// FIT words (activity, session, timer time) stay in this file; everything it returns is Record's.
import {
  type ActivityMesg,
  Decoder,
  type FileIdMesg,
  type LapMesg,
  type RecordMesg,
  type SessionMesg,
  Stream,
} from '@garmin/fitsdk';
import type { Sport } from '@varda/shared';
import { WatchFileTurnedAway } from './errors.ts';
import type { Lap, LapTrigger, LocalDate, Session, SessionKey, Trace } from './stone.ts';
import { traceOf } from './trace.ts';

/** Reads the session a watch file recorded. Throws `WatchFileTurnedAway` for a file that can't be placed. */
export function readWatchFile(bytes: Uint8Array): Session {
  const decoder = new Decoder(Stream.fromByteArray(bytes));
  // Known by its header bytes, never its name or type.
  if (!decoder.isFIT()) throw new WatchFileTurnedAway('not-a-fit-file');
  if (!decoder.checkIntegrity()) throw new WatchFileTurnedAway('broken');

  const { messages, errors } = decoder.read();
  if (errors.length > 0) throw new WatchFileTurnedAway('broken');
  const [fileId] = messages.fileIdMesgs ?? [];
  const [session] = messages.sessionMesgs ?? [];
  // Only an activity holds a session; settings, courses and workouts hold no training.
  if (fileId?.type !== 'activity' || session === undefined) throw new WatchFileTurnedAway('not-a-session');
  if (isMultisport(messages.sessionMesgs ?? [], messages.activityMesgs?.[0])) {
    throw new WatchFileTurnedAway('multisport');
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
    trace: traceOf(positionsOf(messages.recordMesgs ?? [])),
  };
}

/** A triathlon, a brick or any other session of several sports in one file. Not placed yet (spec #60). */
function isMultisport(sessions: SessionMesg[], activity: ActivityMesg | undefined): boolean {
  const multisportSports: unknown[] = ['transition', 'multisport'];
  return (
    sessions.filter((session) => session.sport !== 'transition').length > 1 ||
    (activity?.numSessions ?? 1) > 1 ||
    sessions.some((session) => multisportSports.includes(session.sport))
  );
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

/** The positions the watch recorded, in degrees, skipping records with none. */
function positionsOf(records: RecordMesg[]): Trace {
  return records.flatMap(({ positionLat, positionLong }) =>
    typeof positionLat === 'number' && typeof positionLong === 'number'
      ? [[degreesOf(positionLat), degreesOf(positionLong)] as Trace[number]]
      : [],
  );
}

/** FIT stores positions in semicircles: 2^31 of them make 180°. */
const degreesOf = (semicircles: number) => (semicircles * 180) / 2 ** 31;

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

// Spec #60's sport table. The FIT `sport` decides; `sub_sport` only splits running, so a new
// Garmin sub-sport never moves a session out of its sport. An unknown running sub-sport is road.
const runningBySubSport: Partial<Record<string, Sport>> = {
  trail: 'trail-running',
  ultra: 'trail-running',
  track: 'track-running',
  treadmill: 'treadmill-running',
  indoorRunning: 'treadmill-running',
  virtualActivity: 'treadmill-running',
};

const bySport: Partial<Record<string, Sport>> = {
  cycling: 'cycling',
  eBiking: 'cycling',
  swimming: 'swimming',
  crossCountrySkiing: 'skiing',
  alpineSkiing: 'skiing',
  snowboarding: 'skiing',
  hiking: 'hiking',
  mountaineering: 'hiking',
  snowshoeing: 'hiking',
  walking: 'walking',
};

function sportOf({ sport, subSport }: SessionMesg): Sport {
  if (sport === 'running') return runningBySubSport[String(subSport)] ?? 'road-running';
  if (sport === 'training' && subSport === 'strengthTraining') return 'strength';
  return bySport[String(sport)] ?? 'other';
}

/** 1989-12-31T00:00:00Z, the FIT epoch, in Unix seconds. */
export const fitEpoch = 631_065_600;

const fitSeconds = (date: Date) => date.getTime() / 1000 - fitEpoch;

/**
 * The decoder turns FIT date-times into `Date`s; a bare number is seconds since the FIT epoch.
 * A file missing a time it needs is broken.
 */
function dateOf(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date((value + fitEpoch) * 1000);
  throw new WatchFileTurnedAway('broken');
}
