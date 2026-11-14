import type { Ids, Persons } from './ports.ts';

/** Every port the Shared context needs (ADR 0008). */
export type SharedAdapters = {
  persons: Persons;
  ids: Ids;
};
