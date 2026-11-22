import { and, between, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Stones } from '../../application/ports.ts';
import type { Figures, Stone } from '../../domain/stone.ts';
import { stones } from './schema.ts';

type Row = typeof stones.$inferSelect;

/** What a stone placed before its figures were read holds: none of them. */
const noFigures: Figures = {
  averageHeartRate: null,
  maxHeartRate: null,
  ascent: null,
  descent: null,
  averageCadence: null,
  maxCadence: null,
  averagePower: null,
  maxPower: null,
  normalizedPower: null,
  minTemperature: null,
  averageTemperature: null,
  maxTemperature: null,
  calories: null,
};

function toStone({ laps, sport, figures, ...row }: Row): Stone {
  return {
    ...row,
    figures: figures ?? noFigures,
    // Only Record writes this column, and only with a Sport.
    sport: sport as Stone['sport'],
    laps: laps.map((lap) => ({ ...lap, start: new Date(lap.start) })),
    stretches: row.stretches && {
      ...row.stretches,
      inOrder: row.stretches.inOrder.map((stretch) => ({ ...stretch, start: new Date(stretch.start) })),
    },
  };
}

export function createPostgresStones(db: NodePgDatabase): Stones {
  const withSessionKey: Stones['withSessionKey'] = async (athlete, sessionKey) => {
    const [found] = await db
      .select()
      .from(stones)
      .where(and(eq(stones.athlete, athlete), eq(stones.sessionKey, sessionKey)));
    return found ? toStone(found) : null;
  };

  return {
    async add({ laps, ...stone }) {
      // The unique (athlete, session key) constraint decides a race; the loser adds nothing.
      const added = await db
        .insert(stones)
        .values({
          ...stone,
          laps: laps.map((lap) => ({ ...lap, start: lap.start.toISOString() })),
          stretches: stone.stretches && {
            ...stone.stretches,
            inOrder: stone.stretches.inOrder.map((stretch) => ({ ...stretch, start: stretch.start.toISOString() })),
          },
        })
        .onConflictDoNothing({ target: [stones.athlete, stones.sessionKey] })
        .returning({ id: stones.id });
      if (added.length > 0) return 'added';
      const placedBefore = await withSessionKey(stone.athlete, stone.sessionKey);
      if (placedBefore === null) throw new Error('A stone from this session was there a moment ago, and is gone.');
      return { alreadyPlaced: placedBefore.id };
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
    withSessionKey,
    async remove(id) {
      await db.delete(stones).where(eq(stones.id, id));
    },
  };
}
