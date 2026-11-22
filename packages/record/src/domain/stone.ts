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
  /** Running only: none for other sports, or when the watch detected none. */
  stretches: Stretches | null;
};

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
