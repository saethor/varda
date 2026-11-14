import type { Ids } from '@varda/shared';
import { v7 } from 'uuid';

/** The real `ids` adapter: UUIDv7, so IDs are unique across schemas and sort by creation time (ADR 0006). */
export function createUuidV7Ids(): Ids {
  return { next: () => v7() };
}
