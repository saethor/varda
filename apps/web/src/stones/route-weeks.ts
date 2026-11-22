import { type LocalDate, shiftDate as shift } from './local-date.ts';
import { mondayOf } from './stone-week.ts';

/** What the weeks need of a stone. Times in seconds, distance in metres or none. */
interface WeekStone {
  localDate: LocalDate;
  start: Date;
  distance: number | null;
  movingTime: number;
}

export interface RouteWeek<S> {
  monday: LocalDate;
  sunday: LocalDate;
  /** Newest first. */
  stones: S[];
  totals: WeekTotals;
}

/** Distance is none when no stone in the week has one, never 0. */
export interface WeekTotals {
  stones: number;
  distance: number | null;
  movingTime: number;
}

const totalsOf = (stones: readonly WeekStone[]): WeekTotals => {
  const distances = stones.flatMap((s) => (s.distance === null ? [] : [s.distance]));
  return {
    stones: stones.length,
    distance: distances.length === 0 ? null : distances.reduce((sum, d) => sum + d, 0),
    movingTime: stones.reduce((sum, s) => sum + s.movingTime, 0),
  };
};

/**
 * Every Mon–Sun week from the one `from` falls in to the one `to` falls in, newest first, with its
 * stones and totals. Weeks with no stones are kept: a gap in the route is part of the record.
 */
export function routeWeeks<S extends WeekStone>(stones: readonly S[], from: LocalDate, to: LocalDate): RouteWeek<S>[] {
  const newestFirst = [...stones].sort((a, b) => b.start.getTime() - a.start.getTime());
  const weeks: RouteWeek<S>[] = [];
  for (let monday = mondayOf(to); monday >= mondayOf(from); monday = shift(monday, -7)) {
    const inWeek = newestFirst.filter((s) => mondayOf(s.localDate) === monday);
    weeks.push({ monday, sunday: shift(monday, 6), stones: inWeek, totals: totalsOf(inWeek) });
  }
  return weeks;
}

export interface StitchDay<S> {
  date: LocalDate;
  /** Earliest first. */
  stones: S[];
  /** After today: not knitted yet. */
  ahead: boolean;
}

export interface StitchRow<S> {
  monday: LocalDate;
  /** Monday to Sunday. */
  days: StitchDay<S>[];
  stones: number;
}

/** The range the stitch rows load: `weeks` whole weeks back from the one today falls in. */
export function stitchRange(today: LocalDate, weeks: number): { from: LocalDate; to: LocalDate } {
  return { from: shift(mondayOf(today), -7 * (weeks - 1)), to: today };
}

/** The last `weeks` weeks as rows of days, newest week first, each day with its stones. */
export function stitchRows<S extends WeekStone>(stones: readonly S[], today: LocalDate, weeks: number): StitchRow<S>[] {
  const earliestFirst = [...stones].sort((a, b) => a.start.getTime() - b.start.getTime());
  const { from } = stitchRange(today, weeks);
  const rows: StitchRow<S>[] = [];
  for (let monday = mondayOf(today); monday >= from; monday = shift(monday, -7)) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = shift(monday, i);
      return { date, stones: earliestFirst.filter((s) => s.localDate === date), ahead: date > today };
    });
    rows.push({ monday, days, stones: days.reduce((n, d) => n + d.stones.length, 0) });
  }
  return rows;
}
