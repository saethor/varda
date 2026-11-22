import { createFakeCoachingAccess } from '@varda/shared/testing';
import type { Ids, Recordings, Stones } from '../application/ports.ts';
import type { RecordAdapters } from '../application/record-adapters.ts';
import type { PersonId, SessionKey, Stone, StoneId } from '../domain/stone.ts';

export function createInMemoryStones(): Stones {
  const byId = new Map<StoneId, Stone>();
  const withSessionKey = (athlete: PersonId, sessionKey: SessionKey) =>
    [...byId.values()].find((stone) => stone.athlete === athlete && stone.sessionKey === sessionKey) ?? null;
  return {
    async add(stone) {
      const placedBefore = withSessionKey(stone.athlete, stone.sessionKey);
      if (placedBefore !== null) return { alreadyPlaced: placedBefore.id };
      byId.set(stone.id, stone);
      return 'added';
    },
    async byId(id) {
      return byId.get(id) ?? null;
    },
    async ofAthlete(athlete, { from, to }) {
      return [...byId.values()]
        .filter((stone) => stone.athlete === athlete && stone.localDate >= from && stone.localDate <= to)
        .sort((a, b) => b.localDate.localeCompare(a.localDate) || b.start.getTime() - a.start.getTime())
        .map(({ streams: _streams, ...listed }) => listed);
    },
    async withSessionKey(athlete, sessionKey) {
      return withSessionKey(athlete, sessionKey);
    },
    async remove(id) {
      byId.delete(id);
    },
  };
}

export function createInMemoryRecordings(): Recordings {
  const byStone = new Map<StoneId, Uint8Array>();
  return {
    async put(stoneId, bytes) {
      byStone.set(stoneId, bytes);
    },
    async get(stoneId) {
      return byStone.get(stoneId) ?? null;
    },
    async remove(stoneId) {
      byStone.delete(stoneId);
    },
  };
}

/** Deterministic UUIDv7-shaped IDs: …-7000-8000-000000000001, …0002, and so on. */
export function createSequentialIds(): Ids {
  let last = 0;
  return {
    next: () => `00000000-0000-7000-8000-${String(++last).padStart(12, '0')}`,
  };
}

export function createRecordFakes(): RecordAdapters {
  return {
    stones: createInMemoryStones(),
    recordings: createInMemoryRecordings(),
    ids: createSequentialIds(),
    coachingAccess: createFakeCoachingAccess(),
  };
}
