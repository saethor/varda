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
 * Identifies the session a stone was placed from, whatever copy of its watch file was used,
 * so the same session is placed only once.
 */
export type SessionKey = string;

/** A session read from a watch file, ready to be placed as a stone. */
export type Session = {
  sessionKey: SessionKey;
  start: Date;
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
};

/** A training session the athlete actually did (Record glossary). */
export type Stone = Session & {
  id: StoneId;
  athlete: PersonId;
  /** The name of the watch file the stone was placed from. */
  fileName: string;
};
