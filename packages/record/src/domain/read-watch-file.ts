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
  type UserProfileMesg,
  type ZonesTargetMesg,
} from '@garmin/fitsdk';
import type { Sport } from '@varda/shared';
import { WatchFileTurnedAway } from './errors.ts';
import { readFigures } from './read-figures.ts';
import { readStretches } from './read-stretches.ts';
import type {
  Device,
  GarminReference,
  Lap,
  LapIntensity,
  LapTrigger,
  Measurements,
  Session,
  SessionKey,
  Trace,
} from './stone.ts';
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
  const localOffset = localOffsetOf(messages.activityMesgs?.[0]);
  const laps = lapsOf(session, messages.lapMesgs ?? [], sportOf(session));
  return {
    sessionKey: sessionKeyOf(fileId, start),
    start,
    localOffset,
    localDate: new Date(start.getTime() + localOffset * 1000).toISOString().slice(0, 10),
    sport: sportOf(session),
    distance: session.totalDistance || null,
    movingTime: session.totalTimerTime ?? 0,
    elapsedTime: session.totalElapsedTime ?? 0,
    laps,
    trace: traceOf(positionsOf(messages.recordMesgs ?? [])),
    effort: effortOf(session),
    device: deviceOf(fileId),
    garminReference: garminReferenceOf(session),
    figures: readFigures(session, sportOf(session)),
    stretches: readStretches(sportOf(session), messages, dateOf),
    measurements: measurementsOf(messages.userProfileMesgs?.[0], messages.zonesTargetMesgs?.[0]),
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

/** Seconds the activity's local time was ahead of UTC, or 0 (UTC) when the file has no local time. */
function localOffsetOf(activity: ActivityMesg | undefined): number {
  return typeof activity?.localTimestamp === 'number'
    ? Math.round(activity.localTimestamp - fitSeconds(dateOf(activity.timestamp)))
    : 0;
}

/** The session's laps, picked by its lap index and ordered by start. */
function lapsOf(session: SessionMesg, lapMesgs: LapMesg[], sport: Sport): Lap[] {
  const first = session.firstLapIndex ?? 0;
  return lapMesgs
    .slice(first, first + (session.numLaps ?? lapMesgs.length))
    .map((lap) => ({
      start: dateOf(lap.startTime),
      elapsedTime: lap.totalElapsedTime ?? 0,
      movingTime: lap.totalTimerTime ?? 0,
      distance: lap.totalDistance || null,
      trigger: triggerOf(lap.lapTrigger),
      figures: readFigures(lap, sport),
      intensity: intensityOf(lap.intensity),
      workoutStep: typeof lap.wktStepIndex === 'number' ? lap.wktStepIndex : null,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

// The FIT lap triggers Record tells apart; every other one (position, session end, …) is "other".
const triggers: Partial<Record<string, LapTrigger>> = { manual: 'manual', distance: 'distance', time: 'time' };

function triggerOf(trigger: LapMesg['lapTrigger']): LapTrigger {
  return triggers[String(trigger)] ?? 'other';
}

// The FIT lap intensities Record tells apart: an interval is active work. "Other" tells nothing.
const intensities: Partial<Record<string, LapIntensity>> = {
  warmup: 'warm-up',
  active: 'active',
  interval: 'active',
  recovery: 'recovery',
  rest: 'rest',
  cooldown: 'cool-down',
};

function intensityOf(intensity: LapMesg['intensity']): LapIntensity | null {
  return intensities[String(intensity)] ?? null;
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

/** The watch keeps the athlete's rating 0–100; effort is 1–10. No rating (or 0) is no effort. */
function effortOf({ workoutRpe }: SessionMesg): number | null {
  if (typeof workoutRpe !== 'number' || workoutRpe <= 0) return null;
  return Math.min(10, Math.max(1, Math.round(workoutRpe / 10)));
}

// Makers and models by the names FIT gives them, as people call them. Headphones, sensors and
// batteries the file also lists are not read: only the watch that wrote it.
const manufacturers: Partial<Record<string, string>> = {
  garmin: 'Garmin',
  suunto: 'Suunto',
  polarElectro: 'Polar',
  coros: 'COROS',
  wahooFitness: 'Wahoo',
};

const garminModels: Partial<Record<string, string>> = {
  fr255: 'Forerunner 255',
  fr255Music: 'Forerunner 255 Music',
  fr255Small: 'Forerunner 255S',
  fr255SmallMusic: 'Forerunner 255S Music',
};

/** The watch that wrote the file, or none when its maker isn't one Record knows. */
function deviceOf({ manufacturer, garminProduct }: FileIdMesg): Device | null {
  const maker = manufacturers[String(manufacturer)];
  if (maker === undefined) return null;
  return { manufacturer: maker, model: (manufacturer === 'garmin' && garminModels[String(garminProduct)]) || null };
}

/** Garmin's verdicts, kept as reference (ADR 0003). None when the watch wrote none of them. */
function garminReferenceOf(session: SessionMesg): GarminReference | null {
  const reference = {
    trainingLoad: numberOrNull(session.trainingLoadPeak),
    aerobicTrainingEffect: numberOrNull(session.totalTrainingEffect),
    anaerobicTrainingEffect: numberOrNull(session.totalAnaerobicTrainingEffect),
  };
  return Object.values(reference).every((value) => value === null) ? null : reference;
}

const numberOrNull = (value: unknown) => (typeof value === 'number' ? value : null);
/**
 * The athlete's measurements from the watch's profile of them and its zone settings: max heart rate
 * is only ever in the latter. Nothing else of either is read (no name, sex, threshold, FTP or zones).
 * A value the watch didn't have (missing or 0) is none; none of them at all is no measurements.
 */
function measurementsOf(profile: UserProfileMesg | undefined, zones: ZonesTargetMesg | undefined): Measurements | null {
  const measurements = {
    weight: profile?.weight || null,
    height: profile?.height || null,
    restingHeartRate: profile?.restingHeartRate || null,
    maxHeartRate: zones?.maxHeartRate || null,
  };
  return Object.values(measurements).some((value) => value !== null) ? measurements : null;
}
