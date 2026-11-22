import { type LocalDate, midnightOf, shiftDate as shift } from './local-date.ts';

/** What placing a stone in its week needs of it. Times in seconds, distance in metres or none. */
interface WeekStone {
  id: string;
  localDate: LocalDate;
  start: Date;
  distance: number | null;
  movingTime: number;
}

/** Monday is 0, Sunday 6. */
const weekday = (date: LocalDate) => (midnightOf(date).getUTCDay() + 6) % 7;

/** The Monday of the Mon–Sun week a local date falls in. */
export const mondayOf = (date: LocalDate): LocalDate => shift(date, -weekday(date));

/**
 * The local dates a stone's screen loads, both ends included: its Mon–Sun week and one whole week
 * either side, so its neighbours can be found across the edges of its week.
 */
export function weekAround(date: LocalDate): { from: LocalDate; to: LocalDate } {
  const monday = mondayOf(date);
  return { from: shift(monday, -7), to: shift(monday, 13) };
}

export interface PlaceInWeek<S> {
  /** The Monday of the stone's week. */
  monday: LocalDate;
  /** 1 for the week's first stone. */
  ordinal: number;
  /** The week's distance up to and including the stone; none, never 0, when no stone so far has one. */
  distance: number | null;
  /** The week's moving time up to and including the stone, every sport counting. */
  movingTime: number;
  /** The stones just before and after it among those loaded, across the edges of its week. */
  previous: S | null;
  next: S | null;
}

/**
 * Where a stone sits in its week: which stone of the week it is, the week's totals so far, and its
 * neighbours. Totals stop at the stone, so an old stone reads the same however its week went on.
 */
export function placeInWeek<S extends WeekStone>(stone: S, stones: readonly S[]): PlaceInWeek<S> {
  // The stone itself always counts, even if the stones loaded are older than it.
  const byStart = [stone, ...stones.filter((s) => s.id !== stone.id)].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const at = byStart.indexOf(stone);
  const monday = mondayOf(stone.localDate);
  const soFar = byStart.slice(0, at + 1).filter((s) => mondayOf(s.localDate) === monday);
  const distances = soFar.flatMap((s) => (s.distance === null ? [] : [s.distance]));

  return {
    monday,
    ordinal: soFar.length,
    distance: distances.length === 0 ? null : distances.reduce((sum, d) => sum + d, 0),
    movingTime: soFar.reduce((sum, s) => sum + s.movingTime, 0),
    previous: byStart[at - 1] ?? null,
    next: byStart[at + 1] ?? null,
  };
}

/** The number a stone leads with: distance for running and cross-training that have one, time otherwise. */
export function heroOf(
  group: 'running' | 'strength' | 'cross-training',
  distance: number | null,
): 'distance' | 'movingTime' {
  return group !== 'strength' && distance !== null ? 'distance' : 'movingTime';
}
