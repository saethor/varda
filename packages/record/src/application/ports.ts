import type { LocalDate, PersonId, Reading, SessionKey, Stone, StoneId } from '../domain/stone.ts';

/**
 * Who may see an athlete's stones: Record's own question, which apps/api answers with the
 * coaching access reader Shared publishes (ADR 0005).
 */
export type CoachingAccess = {
  /** Whether `viewer` may see `athlete`'s stones. */
  canSee(viewer: PersonId, athlete: PersonId): Promise<boolean>;
};

/** The athletes' stones. */
export type Stones = {
  /**
   * Adds the stone, unless the athlete already has one placed from its session (even one added
   * a moment ago by a racing request): then nothing is added and the answer is that stone.
   */
  add(stone: Stone): Promise<'added' | { alreadyPlaced: StoneId }>;
  /** The stone with this ID, or null when there is none. */
  byId(id: StoneId): Promise<Stone | null>;
  /** The athlete's stones whose local date is within `from`–`to` (inclusive), newest first. */
  ofAthlete(athlete: PersonId, range: { from: LocalDate; to: LocalDate }): Promise<Stone[]>;
  /** The athlete's stone placed from this session, or null when there is none. */
  withSessionKey(athlete: PersonId, sessionKey: SessionKey): Promise<Stone | null>;
  /** Removes the stone. Nothing happens when there is none. */
  remove(id: StoneId): Promise<void>;
  /** The IDs of every athlete's stones, in no particular order. */
  everyId(): Promise<StoneId[]>;
  /**
   * Replaces all the stone holds as read from its recording with `reading`, wherever it is kept,
   * leaving its ID, athlete, file name, session and dates as they are. Nothing happens when there
   * is no such stone.
   */
  replaceReading(id: StoneId, reading: Reading): Promise<void>;
};

/** The recordings stones were placed from: the original watch files, kept untouched (ADR 0002). */
export type Recordings = {
  put(stoneId: StoneId, bytes: Uint8Array): Promise<void>;
  /** The recording of this stone, or null when there is none. */
  get(stoneId: StoneId): Promise<Uint8Array | null>;
  /** Removes the recording. Nothing happens when there is none. */
  remove(stoneId: StoneId): Promise<void>;
};

/** New IDs (UUIDv7), generated in application code (ADR 0006). A cross-cutting adapter. */
export type Ids = { next(): string };
