import type { Ids, Recordings, Stones } from './ports.ts';

/** Every port the Record context needs (ADR 0008). */
export type RecordAdapters = {
  stones: Stones;
  recordings: Recordings;
  ids: Ids;
};
