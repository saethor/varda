// Dates and times as they were where a stone was done, never shifted into the browser's zone.
// Each `Date` here stands for a wall-clock reading: show it with `timeZone: 'UTC'`.

/** A calendar date with no zone, `YYYY-MM-DD`, as the contract speaks of local dates. */
export type LocalDate = string;

const day = 24 * 60 * 60 * 1000;

/** The local date as a `Date` at its midnight, to show with `timeZone: 'UTC'`. */
export const midnightOf = (date: LocalDate): Date => new Date(`${date}T00:00:00Z`);

/** The local date `days` days after (negative: before) `date`. */
export const shiftDate = (date: LocalDate, days: number): LocalDate =>
  new Date(midnightOf(date).getTime() + days * day).toISOString().slice(0, 10);

/** When a stone started, as the clock read where it started, to show with `timeZone: 'UTC'`. */
export const localStartOf = ({ start, localOffset }: { start: Date; localOffset: number }): Date =>
  new Date(start.getTime() + localOffset * 1000);
