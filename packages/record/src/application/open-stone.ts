import { StoneNotFound } from '../domain/errors.ts';
import type { PersonId, Stone, StoneId } from '../domain/stone.ts';
import type { RecordAdapters } from './record-adapters.ts';

/**
 * The stone, for a viewer coaching access lets see its athlete's stones. One they can't see
 * throws `StoneNotFound`, exactly like one that doesn't exist (spec #60).
 */
export async function openStone(adapters: RecordAdapters, viewer: PersonId, stoneId: StoneId): Promise<Stone> {
  const stone = await adapters.stones.byId(stoneId);
  if (stone === null || !(await adapters.coachingAccess.canSee(viewer, stone.athlete))) {
    throw new StoneNotFound(stoneId);
  }
  return stone;
}
