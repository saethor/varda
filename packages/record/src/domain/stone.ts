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

/** A watch, by its maker and model, as people call them; the model is none when Record doesn't know it. */
export type Device = { manufacturer: string; model: string | null };

/** Garmin's training load and aerobic and anaerobic Training Effect (0–5), each none when not written. */
export type GarminReference = {
  trainingLoad: number | null;
  aerobicTrainingEffect: number | null;
  anaerobicTrainingEffect: number | null;
};

/**
 * The athlete's measurements as their watch had them on the stone's day (Shared glossary): weight in
 * kilograms, height in metres, resting and max heart rate in bpm. Each is none when the watch had none.
 */
export type Measurements = {
  weight: number | null;
  height: number | null;
  restingHeartRate: number | null;
  maxHeartRate: number | null;
};

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
  /** The athlete's rating of how hard the session felt, 1–10, from the watch; none when they gave none. */
  effort: number | null;
  /** The watch that recorded the session; none when the file doesn't say whose it is. */
  device: Device | null;
  /**
   * Garmin's own verdicts on the session, kept only to compare with Varða's later (ADR 0003): never
   * used, shown or answered. None when the watch wrote none of them.
   */
  garminReference: GarminReference | null;
  /** None when the watch had none of them. Never logged or sent outside Varða. */
  measurements: Measurements | null;
};

/** A training session the athlete actually did (Record glossary). */
export type Stone = Session & {
  id: StoneId;
  athlete: PersonId;
  /** The name of the watch file the stone was placed from. */
  fileName: string;
};
