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
  /** The athlete's rating of how hard the session felt, 1–10, from the watch; none when they gave none. */
  effort: number | null;
  /** The watch that recorded the session; none when the file doesn't say whose it is. */
  device: Device | null;
  /**
   * Garmin's own verdicts on the session, kept only to compare with Varða's later (ADR 0003): never
   * used, shown or answered. None when the watch wrote none of them.
   */
  garminReference: GarminReference | null;
  /** The watch's own summary figures for the whole stone. */
  figures: Figures;
  /** Running only: none for other sports, or when the watch detected none. */
  stretches: Stretches | null;
  /** None when the watch had none of them. Never logged or sent outside Varða. */
  measurements: Measurements | null;
  /** None when the watch recorded no points. Only an opened stone has them; a listed one never does. */
  streams: Streams | null;
};

/**
 * The figures the watch recorded for a stone (or a lap), as recorded, never worked out by Varða
 * (ADR 0009). Each is null when the watch recorded none, never 0. Heart rate in bpm, ascent and
 * descent in metres, power in W, temperature in °C, calories in kcal. Cadence is as the watch shows
 * it: steps a minute for running, walking and hiking (both legs), revolutions a minute otherwise.
 */
export type Figures = {
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  ascent: number | null;
  descent: number | null;
  averageCadence: number | null;
  maxCadence: number | null;
  averagePower: number | null;
  maxPower: number | null;
  normalizedPower: number | null;
  minTemperature: number | null;
  averageTemperature: number | null;
  maxTemperature: number | null;
  calories: number | null;
};

/**
 * What a stone holds as read from its recording, apart from what places it: the session it came
 * from and when it was (`sessionKey`, `start`, `localOffset`, `localDate`). Re-reading a recording
 * (the backfill, #82) replaces exactly this, so every field a later reader learns is part of it.
 */
export type Reading = Omit<Session, 'sessionKey' | 'start' | 'localOffset' | 'localDate'>;

/** A training session the athlete actually did (Record glossary). */
export type Stone = Session & {
  id: StoneId;
  athlete: PersonId;
  /** The name of the watch file the stone was placed from. */
  fileName: string;
};

/** What a stretch of a run was spent doing. */
export type StretchKind = 'running' | 'walking' | 'standing';

/** A part of a run spent running, walking or standing, as the watch detected it (Record glossary). */
export type Stretch = {
  kind: StretchKind;
  start: Date;
  /** Seconds the timer ran. */
  movingTime: number;
  /** Metres, or none when the watch recorded none. Standing still is 0. */
  distance: number | null;
};

/** All of a run's stretches of one kind, as the watch summed them. */
export type StretchTotal = { movingTime: number; distance: number | null };

/** A run's stretches, and the watch's own totals for each kind (none for a kind it didn't detect). */
export type Stretches = {
  /** In order of their start. */
  inOrder: Stretch[];
  totals: Record<StretchKind, StretchTotal | null>;
};

/** A stone as a list holds it: everything but its streams, which only opening it reads. */
export type ListedStone = Omit<Stone, 'streams'>;
