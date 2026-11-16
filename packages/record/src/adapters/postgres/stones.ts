import { and, between, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Stones } from '../../application/ports.ts';
import type { Stone } from '../../domain/stone.ts';
import { stones } from './schema.ts';

type Row = typeof stones.$inferSelect;

function toStone({ laps, sport, ...row }: Row): Stone {
  return {
    ...row,
    // Only Record writes this column, and only with a Sport.
    sport: sport as Stone['sport'],
    laps: laps.map((lap) => ({ ...lap, start: new Date(lap.start) })),
  };
}

export function createPostgresStones(db: NodePgDatabase): Stones {
  return {
    async add({ laps, ...stone }) {
      await db
        .insert(stones)
        .values({ ...stone, laps: laps.map((lap) => ({ ...lap, start: lap.start.toISOString() })) });
    },
    async byId(id) {
      const [found] = await db.select().from(stones).where(eq(stones.id, id));
      return found ? toStone(found) : null;
    },
    async ofAthlete(athlete, { from, to }) {
      const rows = await db
        .select()
        .from(stones)
        .where(and(eq(stones.athlete, athlete), between(stones.localDate, from, to)))
        .orderBy(desc(stones.localDate), desc(stones.start));
      return rows.map(toStone);
    },
    async withSessionKey(athlete, sessionKey) {
      const [found] = await db
        .select()
        .from(stones)
        .where(and(eq(stones.athlete, athlete), eq(stones.sessionKey, sessionKey)));
      return found ? toStone(found) : null;
    },
    async remove(id) {
      await db.delete(stones).where(eq(stones.id, id));
    },
  };
}
