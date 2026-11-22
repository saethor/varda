import type { Sport } from '@varda/shared';

export type StoneId = string;
/** A person's ID, from Shared, by identity only (ADR 0005). */
export type PersonId = string;
/** A calendar date with no zone, `YYYY-MM-DD`. Sorts as a string. */
export type LocalDate = string;

/** What ended a lap. */
export type LapTrigger = 'manual' | 'distance' | 'time' | 'other';

/** A recorded section of a stone (Record glossary). Times in seconds, distance in metres. */
export type Lap = {
  start: Date;
  elapsedTime: number;
  movingTime: number;
  distance: number | null;
  trigger: LapTrigger;
};

/**
 * The line a stone traced over the ground (Record glossary): `[lat, lon]` pairs in degrees,
 * in order, simplified from the recording's GPS.
 */
export type Trace = [lat: number, lon: number][];

/**
 * Identifies the session a stone was placed from, whatever copy of its watch file was used,
 * so the same session is placed only once.
 */
export type SessionKey = string;

/** Why a watch file's content is turned away. Nothing of a turned-away file is kept. */
export type TurnedAwayReason = 'not-a-fit-file' | 'broken' | 'not-a-session' | 'multisport';

/**
 * Every point the watch recorded over a stone (Record glossary: Stream), as recorded, never thinned
 * (ADR 0009): about one a second, or every few seconds from a watch that records smartly. Channels
 * are parallel arrays, one value per point; a channel the watch didn't record at all is `null`, and a
 * point it missed in a channel it did record (a heart-rate drop-out, no GPS fix yet) is `null`.
 *
 * Kept as recorded (ADR 0002): a later distance correction scales `distance` (and `speed`) by its
 * factor when the stone is read, and never rewrites what is stored here.
 */
export type Streams = {
  /** Seconds from the stone's start, rising. */
  offset: number[];
  /**
   * Whether the timer ran from the previous point up to this one: `false` for the first point after
   * a pause, `true` for the first point. Leave out the interval ending at a `false` point.
   */
  timerRunning: boolean[];
  /** Metres from the start. */
  distance: StreamChannel;
  /** Metres per second. */
  speed: StreamChannel;
  /** Beats per minute. */
  heartRate: StreamChannel;
  /** Metres above sea level. */
  altitude: StreamChannel;
  /** Watts. */
  power: StreamChannel;
  /** Steps per minute on foot (running, walking, hiking); revolutions per minute otherwise. */
  cadence: StreamChannel;
  /** Degrees Celsius. */
  temperature: StreamChannel;
  /** `[lat, lon]` in degrees. */
  position: ([lat: number, lon: number] | null)[] | null;
  /** Metres. */
  stepLength: StreamChannel;
  /** Metres. */
  verticalOscillation: StreamChannel;
  /** Percent: vertical oscillation over step length. */
  verticalRatio: StreamChannel;
  /** Seconds a foot stays on the ground each step. */
  groundContactTime: StreamChannel;
};

/** One value per point of its streams, `null` at a point the watch missed; `null` when never recorded. */
export type StreamChannel = (number | null)[] | null;

/** A session read from a watch file, ready to be placed as a stone. */
export type Session = {
  sessionKey: SessionKey;
  start: Date;
  /**
   * Seconds the local time where the session started was ahead of UTC (negative when behind),
   * so its start can be shown as the time of day it was there. 0 when the watch file has no local time.
   */
  localOffset: number;
  /** The local date where the session started. */
  localDate: LocalDate;
  sport: Sport;
  /** Metres, or none when the watch recorded none (never 0). */
  distance: number | null;
  /** Seconds the timer ran, pauses excluded. */
  movingTime: number;
  /** Seconds from start to finish, pauses included. */
  elapsedTime: number;
  /** In order of their start; possibly none. */
  laps: Lap[];
  /** None when the watch recorded fewer than 2 positions (indoors, in a pool, in the gym). */
  trace: Trace | null;
  /** None when the watch recorded no points. Only an opened stone has them; a listed one never does. */
  streams: Streams | null;
};

/** A training session the athlete actually did (Record glossary). */
export type Stone = Session & {
  id: StoneId;
  athlete: PersonId;
  /** The name of the watch file the stone was placed from. */
  fileName: string;
};

/** A stone as a list holds it: everything but its streams, which only opening it reads. */
export type ListedStone = Omit<Stone, 'streams'>;
