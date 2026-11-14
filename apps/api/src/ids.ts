import type { SharedAdapters } from '@varda/shared';
import { v7 } from 'uuid';

/** The real `ids` adapter: UUIDv7, so IDs are unique across schemas and sort by creation time (ADR 0006). */
export function createUuidV7Ids(): SharedAdapters['ids'] {
  return { next: () => v7() };
}
