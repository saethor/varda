import { and, between, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Stones } from '../../application/ports.ts';
import type { Figures, Reading, Stone } from '../../domain/stone.ts';
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
    laps: laps.map(({ figures: lapFigures, intensity, workoutStep, ...lap }) => ({
      ...lap,
      start: new Date(lap.start),
      figures: lapFigures ?? noFigures,
      intensity: intensity ?? null,
      workoutStep: workoutStep ?? null,
    })),
    stretches: row.stretches && {
      ...row.stretches,
      inOrder: row.stretches.inOrder.map((stretch) => ({ ...stretch, start: new Date(stretch.start) })),
    },
  };
}

/**
 * A stone, or only its reading, as stored: every field is its own column, laps and stretches with
 * their dates as ISO strings. A field a later reader learns becomes a column of the same name.
 */
function toStored<T extends Reading>({ laps, stretches, ...rest }: T) {
  return {
    ...rest,
    laps: laps.map((lap) => ({ ...lap, start: lap.start.toISOString() })),
    stretches: stretches && {
      ...stretches,
      inOrder: stretches.inOrder.map((stretch) => ({ ...stretch, start: stretch.start.toISOString() })),
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
    async add(stone) {
      // The unique (athlete, session key) constraint decides a race; the loser adds nothing.
      const added = await db
        .insert(stones)
        .values(toStored(stone))
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
    async everyId() {
      const rows = await db.select({ id: stones.id }).from(stones);
      return rows.map(({ id }) => id);
    },
    async replaceReading(id, reading) {
      // Only the reading's columns: the stone's ID, athlete, file name, session and dates stay.
      await db.update(stones).set(toStored(reading)).where(eq(stones.id, id));
    },
  };
}
