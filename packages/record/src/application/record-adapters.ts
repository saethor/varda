import type { CoachingAccess, Ids, Recordings, Stones } from './ports.ts';

/** Record's own adapters: its storage and the cross-cutting `ids` (ADR 0008). */
export type RecordOwnAdapters = {
  stones: Stones;
  recordings: Recordings;
  ids: Ids;
};

/**
 * Every port the Record context needs (ADR 0008): its own adapters, and the readers it reads
 * from other contexts, which apps/api's `createApp` fills with the readers they publish.
 */
export type RecordAdapters = RecordOwnAdapters & {
  /** Shared's reader: who may see an athlete's stones. */
  coachingAccess: CoachingAccess;
};
