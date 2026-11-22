import { and, between, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Stones } from '../../application/ports.ts';
import type { ListedStone, Stone } from '../../domain/stone.ts';
import { stoneStreams, stones } from './schema.ts';

type Row = typeof stones.$inferSelect;

/** A stone row with its streams, which only `byId` and `withSessionKey` read. */
const withStreams = { stone: stones, streams: stoneStreams.streams };

function toOpenedStone({ stone, streams }: { stone: Row; streams: Stone['streams'] }): Stone {
  return { ...toStone(stone), streams };
}

function toStone({ laps, sport, ...row }: Row): ListedStone {
  return {
    ...row,
    // Only Record writes this column, and only with a Sport.
    sport: sport as Stone['sport'],
    laps: laps.map((lap) => ({ ...lap, start: new Date(lap.start) })),
  };
}

export function createPostgresStones(db: NodePgDatabase): Stones {
  const withSessionKey: Stones['withSessionKey'] = async (athlete, sessionKey) => {
    const [found] = await db
      .select(withStreams)
      .from(stones)
      .leftJoin(stoneStreams, eq(stoneStreams.stoneId, stones.id))
      .where(and(eq(stones.athlete, athlete), eq(stones.sessionKey, sessionKey)));
    return found ? toOpenedStone(found) : null;
  };

  return {
    async add({ laps, streams, ...stone }) {
      // The unique (athlete, session key) constraint decides a race; the loser adds nothing.
      const added = await db.transaction(async (tx) => {
        const inserted = await tx
          .insert(stones)
          .values({ ...stone, laps: laps.map((lap) => ({ ...lap, start: lap.start.toISOString() })) })
          .onConflictDoNothing({ target: [stones.athlete, stones.sessionKey] })
          .returning({ id: stones.id });
        if (inserted.length > 0 && streams !== null)
          await tx.insert(stoneStreams).values({ stoneId: stone.id, streams });
        return inserted;
      });
      if (added.length > 0) return 'added';
      const placedBefore = await withSessionKey(stone.athlete, stone.sessionKey);
      if (placedBefore === null) throw new Error('A stone from this session was there a moment ago, and is gone.');
      return { alreadyPlaced: placedBefore.id };
    },
    async byId(id) {
      const [found] = await db
        .select(withStreams)
        .from(stones)
        .leftJoin(stoneStreams, eq(stoneStreams.stoneId, stones.id))
        .where(eq(stones.id, id));
      return found ? toOpenedStone(found) : null;
    },
    async ofAthlete(athlete, { from, to }) {
      const rows = await db
        .select()
        .from(stones)
        .where(and(eq(stones.athlete, athlete), between(stones.localDate, from, to)))
        .orderBy(desc(stones.localDate), desc(stones.start));
      return rows.map(toStone);
    },
    withSessionKey,
    async remove(id) {
      // Its streams go with it (on delete cascade).
      await db.delete(stones).where(eq(stones.id, id));
    },
  };
}
