import type { Ids, Recordings, Stones } from '../application/ports.ts';
import type { RecordAdapters } from '../application/record-adapters.ts';
import type { Stone, StoneId } from '../domain/stone.ts';

export function createInMemoryStones(): Stones {
  const byId = new Map<StoneId, Stone>();
  return {
    async add(stone) {
      byId.set(stone.id, stone);
    },
    async byId(id) {
      return byId.get(id) ?? null;
    },
    async ofAthlete(athlete, { from, to }) {
      return [...byId.values()]
        .filter((stone) => stone.athlete === athlete && stone.localDate >= from && stone.localDate <= to)
        .sort((a, b) => b.localDate.localeCompare(a.localDate) || b.start.getTime() - a.start.getTime());
    },
    async withSessionKey(athlete, sessionKey) {
      return [...byId.values()].find((stone) => stone.athlete === athlete && stone.sessionKey === sessionKey) ?? null;
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
  return { stones: createInMemoryStones(), recordings: createInMemoryRecordings(), ids: createSequentialIds() };
}
